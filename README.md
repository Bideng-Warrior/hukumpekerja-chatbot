# TanyaHukum - Chatbot Hukum Pekerja Indonesia ⚖️

TanyaHukum adalah aplikasi chatbot berbasis Artificial Intelligence (AI) yang dirancang khusus untuk membantu pekerja di Indonesia memahami hak-hak hukum mereka (seperti pesangon, jam lembur, kontrak kerja, hingga PHK) berdasarkan Undang-Undang dan peraturan ketenagakerjaan resmi.

Aplikasi ini menggunakan teknologi **RAG (Retrieval-Augmented Generation)** yang memastikan AI menjawab secara faktual dan **Anti-Halusinasi**. Jika pertanyaan berada di luar konteks dokumen hukum ketenagakerjaan, sistem akan merujuk pengguna ke Disnaker atau LBH terdekat.

## 🚀 Fitur Utama

- **Hybrid AI Architecture**: Mendukung dua otak AI secara bergantian:
  - **Llama-3 (Ngrok)**: Model AI privat (Fine-tuned) yang di-hosting secara lokal/via Ngrok.
  - **Google Gemini (Fallback)**: Model fallback super cepat menggunakan *gemini-3.1-flash-lite*.
- **Strict RAG (Anti-Halusinasi)**: Mencari pasal hukum secara cerdas dari basis data vektor PostgreSQL dan memaksa AI agar **hanya** menjawab berdasarkan dokumen tersebut.
- **Hugging Face Inference API**: Menggunakan model embedding bahasa Indonesia terbaik `BAAI/bge-m3` (1024 dimensi).
- **Persistent Chat History**: Riwayat percakapan tersimpan permanen secara *real-time* ke *database*.
- **Responsive UI**: Antarmuka Sidebar modern yang responsif dan sangat interaktif, dibangun menggunakan Tailwind CSS & Framer Motion.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Next.js API Routes (Serverless Functions on Vercel)
- **Database**: PostgreSQL (via Supabase)
- **ORM & Vektor**: Drizzle ORM, `pgvector` untuk *similarity search* (Cosine Distance)
- **AI SDKs**: `@google/generative-ai` (Gemini) & `@huggingface/inference` (Hugging Face)

## 📋 Persyaratan Sistem

Pastikan Anda memiliki hal-hal berikut sebelum memulai:
- **Node.js** (versi 18.x atau terbaru)
- **Supabase / PostgreSQL database** dengan ekstensi `vector` yang sudah diaktifkan.
- **Akun Hugging Face** (untuk mendapatkan *Access Token*).
- **Akun Google AI Studio** (untuk mendapatkan *Gemini API Key*).

## ⚙️ Cara Instalasi & Menjalankan (Development)

1. **Clone repository ini dan masuk ke dalam folder:**
   ```bash
   git clone https://github.com/Bideng-Warrior/hukumpekerja-chatbot.git
   cd hukumpekerja-chatbot
   ```

2. **Instal seluruh *dependencies*:**
   ```bash
   npm install
   ```

3. **Atur Environment Variables (`.env`)**
   Salin file `.env.example` ke `.env` dan lengkapi datanya:
   ```env
   # PostgreSQL Connection (Gunakan pooler dari Supabase jika ada)
   DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[db]"

   # Endpoint Llama-3 lokal (Ngrok)
   NEXT_PUBLIC_AI_ENDPOINT="https://xxxx.ngrok-free.dev/api/chat"

   # Kunci AI (Google & Hugging Face)
   GEMINI_API_KEY="AIzaSy..."
   HF_TOKEN="hf_..."
   ```

4. **Inisialisasi Database (Push Schema)**
   ```bash
   npx drizzle-kit push
   ```

5. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di *browser* Anda.

## ☁️ Deployment ke Vercel

Proyek ini sangat mudah di-*deploy* ke Vercel. 
1. Hubungkan *repository* GitHub Anda ke Vercel.
2. Di bagian **Environment Variables** di dasbor Vercel, pastikan Anda memasukkan 4 variabel ini:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_AI_ENDPOINT`
   - `GEMINI_API_KEY`
   - `HF_TOKEN`
3. Vercel akan mengelola sisanya. Proses *Serverless Timeout* telah diatasi (terdapat mekanisme `try-catch` tahan banting pada DNS Hugging Face, serta *timeout handler* yang lebih panjang untuk Vercel).

## 📄 Struktur Direktori Penting

- `src/app/api/chat/route.ts`: Otak utama API (mengurus logika Ngrok vs Gemini, pemanggilan model Embedding, validasi input, hingga kueri RAG ke *pgvector*).
- `src/app/page.tsx`: Antarmuka *Chatbot* utama.
- `src/components/SettingsModal.tsx`: Pengaturan AI *Provider* di UI *Frontend*.
- `src/services/chatService.ts`: Jembatan koneksi HTTP dari antarmuka pengguna ke Server API.
- `src/db/schema.ts`: Skema *database* Drizzle ORM (termasuk penyimpanan tabel obrolan dan tabel vektor).

## 🔐 Keamanan
Aplikasi ini membatasi input pengguna maksimal 2000 karakter per pertanyaan untuk menghindari serangan memori pada vektor. Server juga telah menghilangkan rute lama yang tidak digunakan (contohnya `users/login`) demi meningkatkan keamanan data pekerja.
