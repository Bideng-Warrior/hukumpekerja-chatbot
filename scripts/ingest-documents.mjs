#!/usr/bin/env node
/**
 * Ingestion script untuk knowledge base RAG HukumPekerja.
 *
 * Membaca dokumen hukum (plain text / markdown, satu file per peraturan),
 * memecah per pasal, meng-embed tiap chunk dengan BAAI/bge-m3 via Hugging Face
 * (endpoint yang sama dengan aplikasi), lalu menyisipkannya ke tabel
 * `documents` (content + metadata jsonb + embedding vector 1024).
 *
 * Pemakaian:
 *   HF_TOKEN=hf_xxx DATABASE_URL=postgresql://... node scripts/ingest-documents.mjs <folder-dokumen> --uu "UU Cipta Kerja" [--dry-run]
 *
 * Format file yang didukung: .txt dan .md. Skrip otomatis mendeteksi judul
 * pasal via pola baris "Pasal <angka>" (huruf besar/kecil, dengan/tanpa
 * "AYAT"); dokumen tanpa pola tersebut dipecah per ~1000 karakter.
 * Nama UU diambil dari argumen --uu, atau dari nama file jika tidak diberikan.
 */

import fs from 'node:fs';
import path from 'node:path';

const HF_EMBED_URLS = [
  'https://router.huggingface.co/hf-inference/models/BAAI/bge-m3',
  'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-m3',
];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const uuArgIdx = args.indexOf('--uu');
const uuName = uuArgIdx !== -1 ? args[uuArgIdx + 1] : null;
const folder = args.find((a) => !a.startsWith('--') && a !== uuName);

if (!folder || (!process.env.HF_TOKEN && !dryRun) || (!process.env.DATABASE_URL && !dryRun)) {
  console.error('Pemakaian: HF_TOKEN=... DATABASE_URL=... node scripts/ingest-documents.mjs <folder> --uu "Nama UU" [--dry-run]');
  process.exit(1);
}

/** Pecah teks per pasal; fallback ke potongan ~1000 karakter. */
function chunkText(text, sourceName) {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  // Baris yang diawali "Pasal 12", "PASAL 12", "Pasal 12A", dst.
  const parts = cleaned.split(/(?=^(?:PASAL|Pasal)\s+\d+[A-Z]?\b)/m);
  if (parts.length > 1) {
    return parts
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => {
        const match = /^(?:PASAL|Pasal)\s+(\d+[A-Z]?)\b/i.exec(p);
        return {
          uu: uuName || sourceName,
          pasal: match ? `Pasal ${match[1]}` : '(pembuka)',
          text: p.slice(0, 300),
          content: p,
        };
      });
  }
  const chunks = [];
  for (let i = 0; i < cleaned.length; i += 1000) {
    chunks.push({
      uu: uuName || sourceName,
      pasal: `(bagian ${Math.floor(i / 1000) + 1})`,
      text: cleaned.slice(i, i + 200),
      content: cleaned.slice(i, i + 1000),
    });
  }
  return chunks;
}

async function embed(text) {
  for (const url of HF_EMBED_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      });
      if (res.status === 503) return null; // model loading — caller retries
      if (!res.ok) throw new Error(`HF ${res.status}: ${await res.text()}`);
      const json = await res.json();
      return Array.isArray(json[0]) ? json[0] : json;
    } catch {
      // coba endpoint berikutnya
    }
  }
  return null;
}

async function main() {
  const { default: postgres } = await import('postgres');
  const files = fs.readdirSync(folder)
    .filter((f) => /\.(txt|md)$/i.test(f))
    .map((f) => path.join(folder, f));

  if (files.length === 0) {
    console.error(`Tidak ada file .txt/.md di folder "${folder}"`);
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require', max: 1 });
  let total = 0;

  for (const file of files) {
    const sourceName = path.basename(file, path.extname(file));
    const chunks = chunkText(fs.readFileSync(file, 'utf8'), sourceName);
    console.log(`${sourceName}: ${chunks.length} chunk${chunks.length > 1 ? 's' : ''}`);

    for (const [i, chunk] of chunks.entries()) {
      const label = `${chunk.uu} ${chunk.pasal}`;
      if (dryRun) {
        console.log(`  [dry-run] ${label} (${chunk.content.length} karakter)`);
        total++;
        continue;
      }

      let embedding = null;
      for (let attempt = 0; attempt < 3 && !embedding; attempt++) {
        embedding = await embed(chunk.content);
        if (!embedding) await new Promise((r) => setTimeout(r, 10000));
      }
      if (!embedding) {
        console.error(`  GAGAL embed ${label} setelah 3 percobaan — dilewati`);
        continue;
      }
      if (embedding.length !== 1024) {
        console.error(`  Dimensi embedding ${embedding.length} != 1024 untuk ${label} — dilewati`);
        continue;
      }

      await sql`
        INSERT INTO documents (content, metadata, embedding)
        VALUES (${chunk.content}, ${JSON.stringify(chunk)}::jsonb, ${JSON.stringify(embedding)}::vector)
      `;
      console.log(`  [${i + 1}/${chunks.length}] ${label} tersimpan`);
      total++;
    }
  }

  await sql.end();
  console.log(`\nSelesai: ${total} dokumen${dryRun ? ' (dry-run, tidak ada yang disimpan)' : ' tersimpan di tabel documents'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
