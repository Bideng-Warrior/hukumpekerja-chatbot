import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { documents } from '../../../db/schema';
import { cosineDistance } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CitationData } from '../../../domain/types';

export const maxDuration = 60; // Allow Vercel function to run up to 60 seconds (Hobby max)

// Cosine-distance ceiling for a retrieved chunk to count as relevant (0 = identical,
// 2 = opposite). Queries with no chunk under this threshold get the safe refusal
// answer instead of an LLM answer built from weak matches.
const MAX_DISTANCE = parseFloat(process.env.RAG_MAX_DISTANCE ?? '0.55');

const REFUSAL_MESSAGE =
  'Maaf, saya tidak menemukan informasi tersebut di dokumen hukum saya. Silakan hubungi Disnaker atau LBH terdekat.';

const HF_EMBED_ENDPOINTS = [
  // Current HF Inference router; the legacy api-inference domain is kept as a
  // fallback because it intermittently fails with DNS errors.
  'https://router.huggingface.co/hf-inference/models/BAAI/bge-m3',
  'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-m3',
];

async function huggingFaceFetch(url: string, text: string, allowRetry: boolean): Promise<Response> {
  const doFetch = () =>
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

  let response = await doFetch();

  // Cold starts return 503 while the model loads; only the primary endpoint
  // gets the slow retry loop so total runtime stays under maxDuration.
  let retries = allowRetry ? 3 : 0;
  while (response.status === 503 && retries > 0) {
    console.warn(`HF model loading (503). Waiting 10 seconds... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    response = await doFetch();
    retries--;
  }

  return response;
}

async function embedWithHuggingFace(text: string): Promise<number[] | null> {
  for (let i = 0; i < HF_EMBED_ENDPOINTS.length; i++) {
    const url = HF_EMBED_ENDPOINTS[i];
    try {
      const response = await huggingFaceFetch(url, text, i === 0);
      if (response.ok) {
        const json = await response.json();
        // HF returns a flat float array, sometimes nested like [[0.1, ...]]
        return Array.isArray(json[0]) ? json[0] : json;
      }
      console.error('HF embedding failed:', url, response.status, await response.text());
    } catch (error) {
      // Network/DNS failure on one domain — fall through to the next endpoint
      console.warn('HF embedding request error:', url, error);
    }
  }
  return null;
}

// Gemini-native embeddings (1024 dims, matching the documents vector column).
// Used when EMBEDDING_PROVIDER=gemini — the provider used at INGESTION time and
// at QUERY time must be the same model, or cosine similarity is meaningless.
async function embedWithGemini(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: 1024 }),
      }
    );
    if (!res.ok) {
      console.error('Gemini embedding failed:', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const json = await res.json();
    return json.embedding?.values ?? null;
  } catch (error) {
    console.warn('Gemini embedding request error:', error);
    return null;
  }
}

// Gemini model names keep getting renamed/deprecated; try a chain of candidates
// until one responds instead of betting on a single hard-coded name.
const DEFAULT_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const candidates = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...DEFAULT_GEMINI_MODELS]
    : DEFAULT_GEMINI_MODELS;

  let lastError: unknown = null;
  for (const modelId of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (!text) {
        throw new Error('Empty response (possibly blocked by safety settings)');
      }
      return text;
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model "${modelId}" failed, trying next candidate:`, error);
    }
  }
  throw lastError ?? new Error('No Gemini model responded');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = body.provider || 'ngrok';

    // Input Validation (Prevent DoS and Invalid Types) — before calling any external service
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({ error: 'Query tidak valid' }, { status: 400 });
    }
    if (body.query.length > 2000) {
      return NextResponse.json({ error: 'Pertanyaan terlalu panjang (maksimal 2000 karakter)' }, { status: 400 });
    }

    let endpoint = '';
    if (provider === 'ngrok') {
      endpoint = body.customEndpoint || process.env.NEXT_PUBLIC_AI_ENDPOINT || '';
      // Tanpa endpoint Ngrok yang hidup, generation otomatis jatuh ke Gemini.
    }

    // Retrieval memakai EMBEDDING_PROVIDER (sama dengan saat ingest); generation
    // Llama -> Gemini. Error config hanya kalau kedua jalur sama-sama mustahil.
    if (!endpoint && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Tidak ada AI engine terkonfigurasi (endpoint Ngrok atau Gemini API Key)' }, { status: 500 });
    }
    if (process.env.EMBEDDING_PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
    }
    if (process.env.EMBEDDING_PROVIDER !== 'gemini' && !process.env.HF_TOKEN) {
      return NextResponse.json({ error: 'HF Token not configured' }, { status: 500 });
    }

    // 1. Embed the query with the SAME provider used at ingestion time
    //    (EMBEDDING_PROVIDER) — regardless of which engine generates the answer.
    const embedding =
      process.env.EMBEDDING_PROVIDER === 'gemini'
        ? await embedWithGemini(body.query)
        : await embedWithHuggingFace(body.query);

    // Without an embedding there is no factual grounding — return the safe
    // refusal instead of letting the LLM answer with an empty context.
    if (!embedding) {
      return NextResponse.json({ query: body.query, jawaban_model: REFUSAL_MESSAGE, citations: [] });
    }

    // 2. Similarity search in PostgreSQL (pgvector). Only chunks within the
    //    relevance threshold are used; if none qualify, refuse (PRD fallback).
    const distance = cosineDistance(documents.embedding, embedding);
    const similarDocs = await db
      .select({ content: documents.content, metadata: documents.metadata, distance })
      .from(documents)
      .orderBy(distance)
      .limit(5);

    const relevantDocs = similarDocs.filter((doc) => {
      // drizzle types the raw cosineDistance expression as {}; at runtime it is a number
      const docDistance = doc.distance as number | null;
      return docDistance != null && docDistance <= MAX_DISTANCE;
    });

    if (relevantDocs.length === 0) {
      return NextResponse.json({ query: body.query, jawaban_model: REFUSAL_MESSAGE, citations: [] });
    }

    const retrievedContext = relevantDocs.map((doc) => doc.content).join('\n\n---\n\n');
    const citations: CitationData[] = relevantDocs.map((doc) => {
      const meta = (doc.metadata ?? {}) as Partial<CitationData>;
      return {
        uu: meta.uu ?? 'Dokumen Hukum',
        pasal: meta.pasal ?? '-',
        bab: meta.bab,
        text: meta.text ?? doc.content,
      };
    });

    // 3. Strict Anti-Hallucination Prompt Injection + Chat History
    const historyText = body.history ? `RIWAYAT OBROLAN SEBELUMNYA:\n${body.history}\n\n` : '';

    const strictContext = `
${historyText}ATURAN WAJIB (ANTI-HALUSINASI):
1. Anda HANYA boleh menjawab berdasarkan teks di bawah ini.
2. Pertanyaan pengguna boleh berbeda redaksi dengan pasal. Jika teks memuat ketentuan yang RELEVAN dengan inti pertanyaan, Anda WAJIB menjawabnya dari ketentuan tersebut — contoh: ditanya "pesangon PHK sepihak", jawab dari pasal tentang uang pesangon PHK beserta rincian besarnya.
3. JIKA sama sekali tidak ada ketentuan yang relevan di teks di bawah ini, Anda WAJIB menjawab: "Maaf, saya tidak menemukan informasi tersebut di dokumen hukum saya. Silakan hubungi Disnaker atau LBH terdekat."
4. Jangan pernah membuat-buat aturan hukum, angka, atau pasal yang tidak ada di teks (halusinasi).
5. Sebutkan nomor pasal yang menjadi dasar jawaban Anda.

DOKUMEN HUKUM:
${retrievedContext}
    `.trim();

    // 4. Generation dengan fallback otomatis: Llama (Ngrok) lebih dulu saat
    //    provider ngrok dipilih, lalu Gemini jika endpoint tidak ada/tidak
    //    merespons/timeout/jawabannya kosong. Embedding & retrieval tetap satu
    //    provider (EMBEDDING_PROVIDER) untuk semua engine.
    const engines: Array<'ngrok' | 'gemini'> =
      provider === 'ngrok' && endpoint ? ['ngrok', 'gemini'] : ['gemini'];

    const prompt = `Konteks:\n${strictContext}\n\nPertanyaan: ${body.query}`;
    let jawaban_model: string | null = null;
    let engineUsed = '';

    for (const engine of engines) {
      if (engine === 'ngrok') {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
              query: body.query,
              retrieved_context: strictContext,
            }),
            signal: AbortSignal.timeout(25000),
          });

          if (!response.ok) {
            console.error(`[llama-ngrok] HTTP ${response.status}:`, (await response.text()).slice(0, 300));
            continue; // fallback ke Gemini
          }

          const data = await response.json();
          const answer = typeof data.jawaban_model === 'string' ? data.jawaban_model.trim() : '';
          if (!answer) {
            console.warn('[llama-ngrok] jawaban kosong — fallback ke Gemini');
            continue;
          }
          jawaban_model = answer;
          engineUsed = 'llama-ngrok';
        } catch (error) {
          console.warn('[llama-ngrok] engine tidak tersedia — fallback ke Gemini:', error);
        }
      } else {
        if (!process.env.GEMINI_API_KEY) continue;
        try {
          jawaban_model = await generateWithGemini(prompt);
          engineUsed = 'gemini';
        } catch (error) {
          console.error('[gemini] engine gagal:', error);
        }
      }
      if (jawaban_model) break;
    }

    if (!jawaban_model) {
      return NextResponse.json(
        { error: 'Gagal terhubung ke layanan AI.' },
        { status: 502 }
      );
    }

    // Jawaban penolakan tidak boleh membawa sitasi — tampil kontradiktif di UI
    const isRefusal = /tidak menemukan informasi tersebut/i.test(jawaban_model);
    return NextResponse.json({
      query: body.query,
      jawaban_model,
      citations: isRefusal ? [] : citations,
      engine: engineUsed,
    });
  } catch (error) {
    console.error('Proxy Error communicating with AI engine:', error);
    return NextResponse.json(
      { error: 'Gagal terhubung ke layanan AI.' },
      { status: 502 }
    );
  }
}
