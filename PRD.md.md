# Product Requirements Document (PRD): Legal Chatbot Ketenagakerjaan Indonesia

## 1. Overview
Aplikasi ini adalah asisten hukum berbasis AI (RAG) yang dirancang khusus untuk pekerja awam di Indonesia. Tujuannya adalah mendemokratisasi akses terhadap informasi hukum ketenagakerjaan (seperti UU Cipta Kerja, PP PKWT, PHK, dan aturan lembur) dengan menerjemahkan bahasa pasal yang kaku menjadi penjelasan sehari-hari yang mudah dipahami. Sistem ini dirancang untuk beroperasi dengan akurasi tinggi, anti-halusinasi, dan menyertakan sitasi hukum yang jelas. 

Ke depannya, produk digital ini akan didistribusikan melalui kampanye Meta Ads untuk menjangkau target audiens secara masif, dengan kolaborasi pengembangan bersama Ici untuk mempercepat iterasi rilis.

## 2. Requirements

### Business & Product Requirements
*   **Target Pengguna:** Pekerja/buruh awam yang tidak memiliki latar belakang hukum namun membutuhkan kejelasan terkait hak-hak mereka (PHK, kontrak, lembur).
*   **Akurasi & Kepercayaan:** Model dilarang keras berhalusinasi. Jika informasi tidak ada di dokumen RAG, AI wajib merespons dengan anjuran untuk menghubungi Disnaker atau LBH.
*   **Monetisasi & Distribusi:** Fase awal fokus pada *user acquisition* via Meta Ads. Skema monetisasi masa depan dapat berupa fitur premium (konsultasi spesifik/kalkulator lanjutan).

### Technical Requirements
*   **Response Time:** Target waktu respons di bawah 5 detik untuk *chat generation*.
*   **Concurrency:** Mampu menangani *request* paralel dengan memanfaatkan *serverless backend* dan *queuing* jika diperlukan.
*   **Scalability:** Arsitektur harus mendukung pembaruan dokumen hukum secara berkala (re-embedding) tanpa mengganggu *runtime* aplikasi.

## 3. Core Features

### MVP (Minimum Viable Product)
*   **Chat Interface:** Antarmuka percakapan natural berbahasa Indonesia.
*   **Transparent Citation:** Menampilkan sumber referensi (Nama UU, Bab, Pasal) yang digunakan oleh AI untuk menjawab.
*   **Contextual RAG Retrieval:** Pencarian pasal yang presisi berdasarkan *query* pengguna (menggunakan semantic search BGE-m3).
*   **Fallback Mechanism:** Template jawaban aman jika *confidence score* dari pencarian vektor berada di bawah ambang batas.

### Future Roadmap
*   **Kalkulator Hak Pekerja:** UI kalkulator *rule-based* untuk menghitung estimasi pesangon PHK atau upah lembur berdasarkan input form.
*   **Document Generator:** Pembuatan otomatis draf surat somasi ringan atau pengajuan cuti resmi.
*   **Chat History:** Penyimpanan riwayat konsultasi agar pengguna bisa melanjutkan percakapan sebelumnya.

## 4. User Flow

1. **Onboarding:** Pengguna masuk ke halaman utama aplikasi via tautan web (Vercel) -> Melihat *disclaimer* bahwa ini bukan pengganti penasihat hukum resmi.
2. **Query Input:** Pengguna mengetik pertanyaan (contoh: "Saya di-PHK sepihak, pesangonnya berapa?").
3. **Processing (Backend):**
    * *Frontend* mengirim pertanyaan ke API.
    * *Vector DB* mengambil *chunk* dokumen UU terkait berdasarkan kemiripan semantik.
    * LLM merangkai jawaban menggunakan konteks yang ditemukan.
4. **Output:** Pengguna menerima jawaban komprehensif, bahasa awam, dilengkapi daftar pasal yang menjadi rujukan.
5. **Follow-up:** Pengguna dapat menanyakan detail lebih lanjut atau diarahkan untuk menggunakan fitur kalkulator (jika tersedia).

## 5. Architecture

Sistem menggunakan arsitektur terpisah antara Client, Database Serverless, dan Mesin Inferensi AI:

*   **Client (Frontend):** Menangani UI/UX, manajemen *state*, dan validasi input. Dideploy di infrastruktur Edge.
*   **Serverless Backend:** Mengelola otentikasi (opsional), riwayat percakapan, dan orkestrasi pemanggilan API ke AI Engine.
*   **AI Engine (Inference Server):** Menjalankan *embedding* dokumen, *retrieval* ke Vector DB, dan *generation* LLM menggunakan GPU.

## 6. Database Schema

*(Catatan: Menggunakan skema berorientasi dokumen/NoSQL untuk Convex)*

### Tabel: `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | Id | Primary key (Convex generated) |
| `name` | String | Nama pengguna (opsional/anonim) |
| `created_at` | DateTime | Waktu pendaftaran |

### Tabel: `chats` (Chat History)
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | Id | Primary key |
| `user_id` | Id (Ref: `users`) | Pemilik percakapan |
| `title` | String | Judul sesi percakapan |
| `messages` | Array of Objects | Berisi urutan `{"role": "user"/"assistant", "content": "..."}` |
| `updated_at` | DateTime | Waktu *update* terakhir |

### Tabel: `documents` (RAG Knowledge Base di Vector DB)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary key |
| `content` | Text | Teks lengkap dari *chunk* pasal hukum |
| `metadata` | JSON | Berisi asal usul hukum (`{"uu": "Cipta Kerja", "pasal": "156"}`) |
| `embedding` | Vector(1024) | Representasi numerik dari BGE-m3 |

## 7. Tech Stack

| Komponen | Teknologi | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend** | Next.js, Tailwind CSS | Cepat, SEO friendly, ekosistem React yang kuat. (Deploy: Vercel) |
| **Backend / DB API** | Convex | *Real-time sync*, integrasi mudah dengan React, terdapat *free tier*. |
| **Vector Database** | Qdrant / Supabase pgvector | Optimal untuk pencarian *similarity* dokumen RAG. |
| **AI Inference API** | FastAPI (Python) | Ringan dan asinkronus untuk menjembatani *model serving*. |
| **LLM Engine** | Unsloth + Transformers | Eksekusi Llama 3B *fine-tuned* 4-bit secara cepat di GPU. |
| **Embedding Model** | `BAAI/bge-m3` | Performa multilingual (Indonesia) terbaik untuk dokumen struktural. |