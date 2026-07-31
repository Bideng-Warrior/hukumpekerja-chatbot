# HukumPekerja - Indonesian Labor Law Chatbot ⚖️

HukumPekerja is an Artificial Intelligence (AI) powered chatbot application designed specifically to help workers in Indonesia understand their legal rights (such as severance pay, overtime, work contracts, to layoffs) based on official Indonesian labor laws and regulations.

This application utilizes **RAG (Retrieval-Augmented Generation)** technology to ensure the AI answers factually and **prevents AI hallucinations**. If a query falls outside the context of the provided labor law documents, the system will explicitly refuse to answer and redirect users to the local Manpower Office (Disnaker) or Legal Aid Institute (LBH).

## 🚀 Key Features

- **Hybrid AI Architecture**: Supports two interchangeable AI brains:
  - **Llama-3 (Ngrok)**: A private, fine-tuned AI model hosted locally/remotely via Ngrok.
  - **Google Gemini (Fallback)**: A blazing-fast fallback model using *gemini-3.1-flash-lite*.
- **Strict RAG (Anti-Hallucination)**: Intelligently retrieves relevant legal articles from a PostgreSQL vector database and strictly confines the AI's response to those retrieved documents.
- **Hugging Face Inference API**: Uses the best-in-class Indonesian embedding model `BAAI/bge-m3` (1024 dimensions) for precise similarity searches.
- **Persistent Chat History**: Chat sessions are permanently saved in real-time to the database.
- **Responsive UI**: A modern, interactive, and responsive sidebar interface built with Tailwind CSS & Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Next.js API Routes (Serverless Functions optimized for Vercel)
- **Database**: PostgreSQL (hosted via Supabase)
- **ORM & Vector Search**: Drizzle ORM, `pgvector` for similarity search (Cosine Distance)
- **AI SDKs**: `@google/generative-ai` (Gemini) & `@huggingface/inference` (Hugging Face)

## 📋 System Requirements

Ensure you have the following prerequisites before getting started:
- **Node.js** (version 18.x or newer)
- **Supabase / PostgreSQL database** with the `vector` extension enabled.
- **Hugging Face Account** (to obtain an Access Token).
- **Google AI Studio Account** (to obtain a Gemini API Key).

## ⚙️ Local Development Setup

1. **Clone this repository and navigate to the project directory:**
   ```bash
   git clone https://github.com/Bideng-Warrior/hukumpekerja-chatbot.git
   cd hukumpekerja-chatbot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env`)**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   # PostgreSQL Connection (Use a connection pooler from Supabase if available)
   DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[db]"

   # Local Llama-3 Endpoint (via Ngrok)
   NEXT_PUBLIC_AI_ENDPOINT="https://xxxx.ngrok-free.dev/api/chat"

   # AI Provider Keys (Google & Hugging Face)
   GEMINI_API_KEY="AIzaSy..."
   HF_TOKEN="hf_..."
   ```

4. **Initialize the Database (Push Schema)**
   ```bash
   npx drizzle-kit push
   ```

5. **Run the Application**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## ☁️ Deployment to Vercel

This project is fully optimized for seamless deployment to Vercel.
1. Connect your GitHub repository to Vercel.
2. In the **Environment Variables** section of your Vercel dashboard, add the following 4 variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_AI_ENDPOINT`
   - `GEMINI_API_KEY`
   - `HF_TOKEN`
3. Vercel handles the rest. Serverless Timeout issues have been mitigated (the codebase includes robust `try-catch` mechanisms to handle intermittent Hugging Face DNS drops, along with extended Vercel timeout handlers).

## 📄 Key Directory Structure

- `src/app/api/chat/route.ts`: The main API brain (handles Ngrok vs Gemini routing, Embedding model invocation, input validation, and `pgvector` RAG queries).
- `src/app/page.tsx`: The primary Chatbot interface.
- `src/components/SettingsModal.tsx`: Frontend UI for switching the AI Provider.
- `src/services/chatService.ts`: The HTTP bridge connecting the UI to the API Server.
- `src/db/schema.ts`: Drizzle ORM database schemas (including chat tables and vector storage).

## 🔐 Security
This application limits user input to a maximum of 2,000 characters per query to prevent memory exhaustion attacks on the vector database. Unused legacy routes (e.g., `users/login`) have been permanently removed to ensure maximum security for worker data.
