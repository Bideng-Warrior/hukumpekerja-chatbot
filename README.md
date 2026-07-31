# HukumPekerja-Chatbot

Sebuah proyek chatbot untuk membantu menjawab pertanyaan terkait hukum ketenagakerjaan (Indonesia). Proyek ini menggabungkan notebook analisis/eksperimen (Jupyter) dan komponen TypeScript untuk antarmuka/serving, serta skrip JavaScript pendukung.

Catatan: repositori ini banyak berisi Jupyter Notebook (analisis/eksperimen) dan kode TypeScript untuk bagian aplikasi. Sesuaikan langkah di bawah dengan struktur dan file di repo bila ada perbedaan.

## Fitur
- Prototype chatbot untuk menjawab pertanyaan terkait hukum ketenagakerjaan
- Notebooks untuk:
  - Eksperimen pemrosesan teks / pra-pelatihan atau fine-tuning
  - Pembersihan data dan eksplorasi dataset
  - Evaluasi kualitas jawaban
- Komponen TypeScript untuk:
  - Antarmuka pengguna (UI) / endpoint API
  - Integrasi model atau layanan penyedia LLM (opsional)
- Contoh konfigurasi dan panduan pengembangan

## Bahasa
Dokumentasi dan antarmuka menggunakan bahasa Indonesia. Kode utama berupa:
- Jupyter Notebook (majoritas)
- TypeScript (aplikasi / server)
- JavaScript, CSS (pendukung)

## Persyaratan
- Node.js (versi LTS disarankan: v16/18+)
- npm atau pnpm / yarn
- Python 3.8+ untuk menjalankan Jupyter Notebook
- pip, virtualenv atau venv
- (Opsional) Docker dan Docker Compose untuk lingkungan terkontainer

## Instalasi — lingkungan Python (notebook)
1. Buat virtual environment:
   - python -m venv .venv
   - source .venv/bin/activate  (Linux / macOS)
   - .venv\Scripts\activate     (Windows)
2. Install dependensi:
   - Jika ada file requirements.txt:
     - pip install -r requirements.txt
   - Atau pasang paket umum:
     - pip install jupyterlab pandas numpy scikit-learn transformers datasets
3. Jalankan Jupyter:
   - jupyter lab
   - atau jupyter notebook
4. Buka notebook yang relevan di browser dan ikuti sel-selnya.

Catatan: Jika repo menyediakan environment.yml (conda) atau binder/requirements khusus, gunakan yang disediakan.

## Instalasi — aplikasi TypeScript (frontend / server)
1. Masuk ke direktori proyek yang berisi package.json (mis. `web/` atau `app/`):
   - cd path/to/typescript
2. Install dependensi:
   - npm install
   - atau pnpm install / yarn install
3. Jalankan skrip pengembangan:
   - npm run dev
   - atau: npm start / npm run build && npm run start
4. Periksa package.json untuk skrip yang tersedia dan sesuaikan perintah di atas.

Jika aplikasi berkomunikasi dengan backend atau LLM eksternal, pastikan variabel lingkungan (API key, URL) diatur terlebih dahulu.

## Konfigurasi
Buat file konfigurasi/variabel lingkungan (contoh `.env`) untuk menyimpan:
- API_KEY_MODEL=...
- MODEL_ENDPOINT=...
- PORT=3000
- LOGGER_LEVEL=info

Pastikan file `.env` dimasukkan ke `.gitignore` jika berisi kredensial.

## Menjalankan secara lokal (alur contoh)
1. Jalankan notebook untuk memproses / menyiapkan data dan membuat artefak model atau prompt.
2. Jalankan service TypeScript (UI/API).
3. Konfigurasikan service agar mengarah ke model (lokal atau layanan LLM).
4. Akses UI pada http://localhost:PORT dan coba beberapa pertanyaan.

## Struktur direktori (contoh)
(Struktur di bawah ini adalah contoh umum — sesuaikan dengan isi repo)
- notebooks/        — Jupyter Notebooks (eksperimen & preprocessing)
- src/              — Kode TypeScript (frontend / backend)
- public/           — Asset statis (CSS, gambar)
- data/             — Dataset, file sumber (jangan commit data sensitif)
- README.md
- requirements.txt / package.json

## Kontribusi
Terima kasih atas minat berkontribusi! Panduan singkat:
1. Fork repo dan buat branch fitur: `git checkout -b feat/nama-fitur`
2. Buat perubahan, sertakan test bila relevan.
3. Jalankan notebook/rebuild agar perubahan tercermin.
4. Ajukan Pull Request dengan deskripsi jelas tentang perubahan dan tujuan.
5. Sertakan contoh cara menguji fitur baru.

Jika Anda mengirim notebook, mohon:
- Minimalkan output besar (clear output sebelum commit bila perlu)
- Sertakan penjelasan dan sel yang menjalankan pipeline utama

## Lisensi
Tambahkan file LICENSE di repo jika belum ada. Jika belum diputuskan, rekomendasi umum:
- MIT License — untuk kebanyakan proyek open-source
- CC-BY sajak untuk materi dokumentasi/konteks non-kode

## Keamanan & Privasi
- Jangan commit kredensial, kunci API, atau data pribadi ke repo publik.
- Jika repo memuat dataset sensitif, pastikan telah dihapus atau dienkripsi.

## Troubleshooting (Umum)
- Jika Jupyter tidak bisa dijalankan: pastikan Python & pip sudah terinstal, lalu periksa virtualenv aktif.
- Jika npm script gagal: cek versi Node.js dan dependency mismatch, perbarui node_modules (`rm -rf node_modules && npm install`).
- Jika model/endpoint LLM tidak merespons: periksa kredensial dan konektivitas jaringan.

## Contoh penggunaan singkat
- Jalankan notebook preprocessing untuk membuat file `data/processed.jsonl`
- Jalankan server: `cd web && npm install && npm run dev`
- Buka UI dan masukkan pertanyaan seperti: "Apa hak pekerja saat PHK tanpa pesangon?"

## Kontak
Untuk pertanyaan lanjutan atau koordinasi kontribusi:
- Pemilik repo: Bideng-Warrior (lihat halaman GitHub)
- Atau buat issue di repo untuk diskusi fitur / bug

---

Catatan terakhir:
README ini bersifat generik dan dirancang untuk menutupi bagian notebook (eksperimen) dan komponen TypeScript (aplikasi). Jika Anda ingin README yang lebih spesifik (menambahkan badge CI, contoh endpoint API, screenshot UI, atau instruksi Dockerfile/docker-compose), beri tahu file/folder mana yang menjadi entrypoint (mis. nama folder frontend/backend, nama file `server.ts` atau `app.ts`, dsb.), saya akan sesuaikan dan dapat langsung membuat commit ke repo.
