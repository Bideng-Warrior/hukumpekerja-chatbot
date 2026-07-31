import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { documents } from '../../../db/schema';
import { cosineDistance, desc, sql } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Allow Vercel function to run up to 60 seconds (Hobby max)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = body.provider || 'ngrok';
    
    // Determine endpoints based on provider
    let endpoint = '';
    let embedEndpoint = '';
    
    if (provider === 'ngrok') {
      endpoint = body.customEndpoint || process.env.NEXT_PUBLIC_AI_ENDPOINT;
      embedEndpoint = endpoint?.replace('/api/chat', '/api/embed');
      
      if (!endpoint || !embedEndpoint) {
        return NextResponse.json({ error: 'AI Endpoint not configured' }, { status: 500 });
      }
    } else {
      // Gemini provider uses Hugging Face for embeddings
      embedEndpoint = 'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-m3';
      if (!process.env.GEMINI_API_KEY || !process.env.HF_TOKEN) {
        return NextResponse.json({ error: 'Gemini API Key or HF Token not configured' }, { status: 500 });
      }
    }

    // Input Validation (Prevent DoS and Invalid Types)
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({ error: 'Query tidak valid' }, { status: 400 });
    }
    if (body.query.length > 2000) {
      return NextResponse.json({ error: 'Pertanyaan terlalu panjang (maksimal 2000 karakter)' }, { status: 400 });
    }

    // 1. Get embedding for user query
    let embedding: number[] | null = null;
    
    if (provider === 'ngrok') {
      const embedResponse = await fetch(embedEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ text: body.query }),
      });
      if (embedResponse.ok) {
        const json = await embedResponse.json();
        embedding = json.embedding;
      }
    } else {
      // Gemini uses Hugging Face Inference API
      try {
        let embedResponse = await fetch(embedEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: body.query }),
        });
        
        // If HF model is asleep (503), retry up to 3 times (wait 10s each)
        let retries = 3;
        while (embedResponse.status === 503 && retries > 0) {
          console.warn(`HF Model loading (503). Waiting 10 seconds... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          embedResponse = await fetch(embedEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.HF_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: body.query }),
          });
          retries--;
        }

        if (embedResponse.ok) {
          const json = await embedResponse.json();
          // HF API returns an array of floats, sometimes nested like [[0.1, ...]] or [0.1, ...]
          embedding = Array.isArray(json[0]) ? json[0] : json;
        } else {
          console.error("HF Embedding failed after retries:", embedResponse.status, await embedResponse.text());
        }
      } catch (hfError) {
        console.error("HF Fetch Exception (DNS/Network):", hfError);
        // embedding remains null, fallback gracefully
      }
    }

    let retrievedContext = "";
    let citations: any[] = [];

    if (embedding) {
      // 2. Perform Similarity Search in PostgreSQL (pgvector)
      // Retrieve Top 3 most relevant document chunks
      const similarDocs = await db.select()
        .from(documents)
        .orderBy(cosineDistance(documents.embedding, embedding))
        .limit(3);

      retrievedContext = similarDocs.map(doc => doc.content).join('\n\n---\n\n');
      citations = similarDocs.map(doc => doc.metadata);
    } else {
      console.warn("Failed to get embedding. Proceeding without RAG context.");
    }

    // 3. Strict Anti-Hallucination Prompt Injection + Chat History
    // We pass this extra instruction inside retrieved_context so the AI obeys it.
    const historyText = body.history ? `RIWAYAT OBROLAN SEBELUMNYA:\n${body.history}\n\n` : "";
    
    const strictContext = `
${historyText}ATURAN WAJIB (ANTI-HALUSINASI):
1. Anda HANYA boleh menjawab berdasarkan teks di bawah ini.
2. JIKA JAWABAN TIDAK ADA DI TEKS DI BAWAH INI, Anda WAJIB menjawab: "Maaf, saya tidak menemukan informasi tersebut di dokumen hukum saya. Silakan hubungi Disnaker atau LBH terdekat."
3. Jangan pernah membuat-buat aturan hukum (halusinasi).

DOKUMEN HUKUM:
${retrievedContext}
    `.trim();

    // 4. Send query + context to AI Engine
    if (provider === 'ngrok') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          query: body.query,
          retrieved_context: strictContext
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[DEBUG] AI Engine HTTP ${response.status} Body:`, errText);
        throw new Error(`AI Engine responded with status: ${response.status}`);
      }

      const data = await response.json();
      data.citations = citations;
      return NextResponse.json(data);
    } else {
      // Gemini provider logic
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      
      const prompt = `Konteks:\n${strictContext}\n\nPertanyaan: ${body.query}`;
      const result = await model.generateContent(prompt);
      const jawaban_model = result.response.text();
      
      return NextResponse.json({
        query: body.query,
        jawaban_model: jawaban_model,
        citations: citations
      });
    }
  } catch (error) {
    console.error('Proxy Error communicating with AI engine:', error);
    return NextResponse.json(
      { error: 'Gagal terhubung ke layanan AI.' },
      { status: 502 }
    );
  }
}
