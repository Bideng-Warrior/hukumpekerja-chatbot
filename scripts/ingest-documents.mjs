#!/usr/bin/env node
/**
 * Ingestion script untuk knowledge base RAG HukumPekerja.
 *
 * Porting Node.js dari notebook Load_Legal.ipynb (logika teruji):
 *   - Ekstraksi teks dari PDF (pdf-parse) / TXT / Markdown
 *   - Pembersihan noise halaman (nomor halaman, "SALINAN", "PRESIDEN REPUBLIK
 *     INDONESIA", footer SK) dengan pencocokan mirip difflib
 *   - Chunking per pasal (merekam BAB aktif), pasal panjang dipecah ~2500 karakter
 *   - Re-run aman: baris lama dengan metadata source sama dihapus dulu (dedup)
 *
 * Embedding via EMBEDDING_PROVIDER:
 *   - "gemini" : gemini-embedding-001, outputDimensionality 1024, dikirim
 *                batch via batchEmbedContents (tidak butuh kredit HF)
 *   - "hf"     : BAAI/bge-m3 via Hugging Face Inference (router + domain lama)
 *
 * PENTING: model embedding saat ingest dan saat query runtime HARUS sama
 * (set EMBEDDING_PROVIDER di Vercel dengan nilai yang sama). Ganti provider
 * memerlukan re-ingest seluruh dokumen.
 *
 * Pemakaian:
 *   EMBEDDING_PROVIDER=gemini GEMINI_API_KEY=... DATABASE_URL=... \
 *     node scripts/ingest-documents.mjs <folder> [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Lewati index.js pdf-parse (punya cabang debug yang membaca file test saat
// dimuat di luar CJS biasa); ambil modul intinya langsung.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const HF_EMBED_ENDPOINTS = [
  'https://router.huggingface.co/hf-inference/models/BAAI/bge-m3',
  'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-m3',
];
const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001`;
const MAX_CHARS_PER_CHUNK = 2500;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const folder = args.find((a) => !a.startsWith('--'));
const provider = process.env.EMBEDDING_PROVIDER === 'gemini' ? 'gemini' : 'hf';
const EMBED_BATCH_SIZE = provider === 'gemini' ? 20 : 16;

if (!folder) {
  console.error('Pemakaian: EMBEDDING_PROVIDER=gemini|hf ( + kunci terkait ) DATABASE_URL=... node scripts/ingest-documents.mjs <folder-dokumen> [--dry-run]');
  process.exit(1);
}
if (!dryRun) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL wajib ada (atau jalankan dengan --dry-run).');
    process.exit(1);
  }
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    console.error('EMBEDDING_PROVIDER=gemini memerlukan GEMINI_API_KEY.');
    process.exit(1);
  }
  if (provider === 'hf' && !process.env.HF_TOKEN) {
    console.error('EMBEDDING_PROVIDER=hf memerlukan HF_TOKEN.');
    process.exit(1);
  }
}

// ---------- 1. Pembersih noise halaman (porting dari Load_Legal.ipynb) ----------

const NOISE_TARGETS = ['PRESIDEN', 'REPUBLIK INDONESIA', 'PRESIDEN REPUBLIK INDONESIA'];

function similarity(a, b) {
  // rasio mirip difflib.SequenceMatcher: 2 * kecocokan / total panjang
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (longer.length === 0) return 1;
  let prev = new Array(shorter.length + 1).fill(0);
  for (let i = 0; i < longer.length; i++) {
    const cur = [0];
    for (let j = 0; j < shorter.length; j++) {
      cur[j + 1] = longer[i] === shorter[j] ? prev[j] + 1 : Math.max(prev[j + 1], cur[j], prev[j]);
    }
    prev = cur;
  }
  return (2 * prev[shorter.length]) / (a.length + b.length);
}

function isNoiseLine(s) {
  if (!s) return true;
  if (/^-?\s*\d{1,4}\s*-?$/.test(s)) return true;
  if (/^SK\s*No\.?\s*[\dA-Za-z]+(\s*[A-Za-z])?\s*$/i.test(s)) return true;
  if (s.toUpperCase() === 'SALINAN') return true;
  if (s.length <= 30) {
    const upper = s.toUpperCase();
    for (const target of NOISE_TARGETS) {
      if (similarity(upper, target) > 0.75) return true;
    }
  }
  return false;
}

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !isNoiseLine(line))
    .join('\n');
}

// ---------- 2. Ekstraksi & chunking per pasal ----------

async function extractText(file) {
  if (file.toLowerCase().endsWith('.pdf')) {
    const data = await pdfParse(fs.readFileSync(file));
    return data.text;
  }
  if (/\.(txt|md)$/i.test(file)) {
    return fs.readFileSync(file, 'utf8');
  }
  return '';
}

function chunkByPasal(fullText) {
  const lines = fullText.split('\n');
  const chunks = [];
  let buffer = [];
  let currentBab = null;
  let pendingPasal = null;
  let pendingBab = null;

  const flush = () => {
    if (pendingPasal && buffer.length) {
      const txt = buffer.join('\n').trim();
      if (txt) chunks.push({ bab: pendingBab, pasal: pendingPasal, text: txt });
    }
    buffer = [];
  };

  for (const line of lines) {
    const babMatch = /^BAB\s+([IVXLCDM]+[A-Z]?)\s*$/.exec(line);
    if (babMatch) {
      currentBab = `BAB ${babMatch[1]}`;
      continue;
    }
    const pasalMatch = /^Pasal\s+(\d+[A-Z]?)\s*\.?$/.exec(line);
    if (pasalMatch) {
      flush();
      pendingPasal = `Pasal ${pasalMatch[1]}`;
      pendingBab = currentBab;
      continue;
    }
    buffer.push(line);
  }
  flush();
  return chunks;
}

function splitLongChunk(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const parts = [];
  let current = '';
  for (const para of text.split('\n')) {
    if (current.length + para.length + 1 > maxChars && current) {
      parts.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n${para}` : para;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// ---------- 3. Embedding ----------

async function embedBatchGemini(texts) {
  // backoff untuk 429 (limit RPM/TPM free tier)
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(`${GEMINI_EMBED_URL}:batchEmbedContents?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map((t) => ({
            model: 'models/gemini-embedding-001',
            content: { parts: [{ text: t }] },
            outputDimensionality: 1024,
          })),
        }),
      });
      if (res.status === 429 || res.status === 503) {
        const wait = 15000 * (attempt + 1);
        console.warn(`\n  Gemini ${res.status}; tunggu ${wait / 1000}s (percobaan ${attempt + 1}/8)`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      const vectors = json.embeddings.map((e) => e.values);
      if (vectors.some((v) => !v || v.length !== 1024)) {
        throw new Error(`dimensi embedding tidak 1024: ${vectors.map((v) => v?.length).join(',')}`);
      }
      return vectors;
    } catch (err) {
      if (attempt === 7) {
        console.error(`  Batch Gemini gagal permanen: ${err.message}`);
        return null;
      }
      console.warn(`  Gemini embed error (${err.message}); ulangi...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return null;
}

async function embedBatchHf(texts) {
  for (let e = 0; e < HF_EMBED_ENDPOINTS.length; e++) {
    const url = HF_EMBED_ENDPOINTS[e];
    let retries = 4;
    while (retries > 0) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: texts }),
        });
        if (res.status === 503 || res.status === 429) {
          const wait = res.status === 429 ? 5000 : 10000;
          console.warn(`  HF ${res.status}; tunggu ${wait / 1000}s (${retries} percobaan tersisa)`);
          await new Promise((r) => setTimeout(r, wait));
          retries--;
          continue;
        }
        if (!res.ok) throw new Error(`HF ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const json = await res.json();
        return json.map((v) => (Array.isArray(v[0]) ? v[0] : v));
      } catch (err) {
        console.warn(`  Endpoint gagal (${url}): ${err.message}`);
        break; // coba endpoint berikutnya
      }
    }
  }
  return null;
}

const embedBatch = (texts) => (provider === 'gemini' ? embedBatchGemini(texts) : embedBatchHf(texts));

// ---------- 4. Main ----------

async function main() {
  const files = fs.readdirSync(folder)
    .filter((f) => /\.(pdf|txt|md)$/i.test(f))
    .map((f) => path.join(folder, f));

  if (!files.length) {
    console.error(`Tidak ada file .pdf/.txt/.md di "${folder}"`);
    process.exit(1);
  }

  // Fase 1: ekstrak & pecah semua dokumen
  const plan = [];
  for (const file of files) {
    const source = path.basename(file);
    const uu = path.basename(file, path.extname(file));
    console.log(`Membaca ${source}...`);
    const text = cleanText(await extractText(file));
    if (!text.trim()) {
      console.warn(`  ⚠️ tidak ada teks, dilewati`);
      continue;
    }
    const pasalChunks = chunkByPasal(text);
    const chunks = pasalChunks.flatMap((pc) =>
      splitLongChunk(pc.text, MAX_CHARS_PER_CHUNK).map((t) => ({ bab: pc.bab, pasal: pc.pasal, text: t }))
    );
    console.log(`  ${pasalChunks.length} pasal -> ${chunks.length} chunk`);
    plan.push({ source, uu, chunks });
  }

  const totalChunks = plan.reduce((n, p) => n + p.chunks.length, 0);
  console.log(`\nTotal: ${plan.length} dokumen, ${totalChunks} chunk (embedding provider: ${provider})`);

  if (dryRun) {
    console.log('[dry-run] Tidak ada embedding/penyimpanan.');
    return;
  }

  // Fase 2: hapus data lama per source (re-run tidak menduplikasi)
  const { default: postgres } = await import('postgres');
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require', max: 1 });
  for (const p of plan) {
    await sql`DELETE FROM documents WHERE metadata->>'source' = ${p.source}`;
  }
  console.log(`Data lama untuk ${plan.length} sumber dihapus (kalau ada).`);

  // Fase 3: embed batch & insert
  let done = 0;
  let failed = 0;
  const all = plan.flatMap((p) => p.chunks.map((c) => ({ ...c, source: p.source, uu: p.uu })));

  for (let i = 0; i < all.length; i += EMBED_BATCH_SIZE) {
    const batch = all.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedBatch(batch.map((b) => b.text));
    if (!embeddings) {
      console.error(`\nBatch ${Math.floor(i / EMBED_BATCH_SIZE) + 1} gagal di-embed — dilewati`);
      failed += batch.length;
      continue;
    }
    for (let j = 0; j < batch.length; j++) {
      const b = batch[j];
      const meta = {
        source: b.source,
        uu: b.uu,
        bab: b.bab,
        pasal: b.pasal,
        text: b.text.slice(0, 250),
        embedding_provider: provider === 'gemini' ? 'gemini-embedding-001' : 'bge-m3',
      };
      await sql`
        INSERT INTO documents (content, metadata, embedding)
        VALUES (${b.text}, ${JSON.stringify(meta)}::jsonb, ${JSON.stringify(embeddings[j])}::vector)
      `;
      done++;
    }
    process.stdout.write(`\rProgress: ${done}/${all.length} tersimpan`);
  }

  await sql.end();
  console.log(`\n\n✅ Selesai: ${done} chunk tersimpan, ${failed} gagal.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
