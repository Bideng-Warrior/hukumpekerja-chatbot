import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { documents } from '../../../db/schema';
import { cosineDistance, desc, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const endpoint = process.env.NEXT_PUBLIC_AI_ENDPOINT;
    const embedEndpoint = endpoint?.replace('/api/chat', '/api/embed');

    if (!endpoint || !embedEndpoint) {
      return NextResponse.json({ error: 'AI Endpoint not configured' }, { status: 500 });
    }

    // Input Validation (Prevent DoS and Invalid Types)
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({ error: 'Query tidak valid' }, { status: 400 });
    }
    if (body.query.length > 2000) {
      return NextResponse.json({ error: 'Pertanyaan terlalu panjang (maksimal 2000 karakter)' }, { status: 400 });
    }

    // 1. Get embedding for user query
    const embedResponse = await fetch(embedEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ text: body.query }),
    });

    let retrievedContext = "";
    let citations: any[] = [];

    if (embedResponse.ok) {
      const { embedding } = await embedResponse.json();

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
    
    // Inject our metadata citations back into the response so the UI can display them
    data.citations = citations;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy Error communicating with AI engine:', error);
    return NextResponse.json(
      { error: 'Gagal terhubung ke layanan AI.' },
      { status: 502 }
    );
  }
}
