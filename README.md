# HukumPekerja Chatbot

prototype for an Indonesian labor-law question-and-answer assistant.

HukumPekerja Chatbot is a prototype system that combines experimental Jupyter notebooks for data preparation, model experimentation, and evaluation with a TypeScript-based application layer (Next.js) for user interaction and API serving. The system is intended to provide general information about Indonesian labor law — it is not legal advice.

---

Table of contents
- [Key features](#key-features)
- [Architecture & technologies](#architecture--technologies)
- [Prerequisites](#prerequisites)
- [Installation & running](#installation--running)
  - [Python / Jupyter notebooks](#python--jupyter-notebooks)
  - [TypeScript application (Next.js)](#typescript-application-nextjs)
- [Configuration](#configuration)
- [Development workflow](#development-workflow)
- [Directory layout (example)](#directory-layout-example)
- [Security & data handling](#security--data-handling)
- [License](#license)


## Key features
- Q&A assistant for common questions about Indonesian labor law.
- Jupyter notebooks for:
  - data cleaning and preprocessing
  - prompt engineering and experimentation
  - evaluation and quality checks
- TypeScript / Next.js application for UI and API endpoints.
- Configurable to use a local or remote LLM provider via environment variables.

## Architecture & technologies
- Notebooks: Python (Jupyter) for experiments and data pipelines
- Application: TypeScript with Next.js for the frontend and API routes
- Optional integrations: Hugging Face / external LLM APIs, local model servicers
- Tooling: Node.js, npm/pnpm/yarn, Python virtual environments, (optional) Docker

## Prerequisites
- Node.js (LTS recommended: v16 / v18+)
- npm, pnpm, or yarn
- Python 3.8+
- pip and a virtual environment tool (venv or conda)
- (Optional) Docker & Docker Compose for containerized runs

## Installation & running

### Python / Jupyter notebooks
1. Clone the repository and change into it:
   ```bash
   git clone https://github.com/Bideng-Warrior/hukumpekerja-chatbot.git
   cd hukumpekerja-chatbot
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate    # macOS / Linux
   .venv\Scripts\activate     # Windows
   ```
3. Install Python dependencies. If a `requirements.txt` exists, use it:
   ```bash
   pip install -r requirements.txt
   ```
   Otherwise install common packages used by the notebooks:
   ```bash
   pip install jupyterlab pandas numpy scikit-learn transformers datasets
   ```
4. Start Jupyter Lab or Notebook:
   ```bash
   jupyter lab
   # or
   jupyter notebook
   ```
5. Open the notebooks in the `notebooks/` directory (or the repository root if notebooks are located there) and follow the cells.

### TypeScript application (Next.js)
1. Change to the application folder (where `package.json` is located). If the project root contains the app, skip this step.
   ```bash
   cd web   # adjust if the app is in a different folder
   ```
2. Install Node dependencies:
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```
4. Open http://localhost:3000 (or configured port) to access the UI.

## Configuration
Create a `.env` file at the repository root or within the application directory containing required environment variables. Example variables:

```
MODEL_PROVIDER_URL=https://api.example.com
MODEL_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

Ensure `.env` is listed in `.gitignore` to avoid leaking credentials.

## Development workflow
- Use the notebooks to prepare datasets and produce any model artefacts or prompt templates required by the application.
- Run the Next.js application in development mode while pointing it to the model provider configured in `.env`.
- For changes that affect notebooks or data pipelines, include a short README or note in the notebook explaining how to reproduce outputs.
- Keep notebook outputs minimal when committing: clear large outputs and include only essential visualizations or results.

## Directory layout (example)
- notebooks/        — Jupyter notebooks (experiments, preprocessing, evaluation)
- src/              — TypeScript source code for application (frontend / API)
- public/           — Static assets (images, CSS)
- data/             — Datasets and generated artefacts (do not commit sensitive data)
- README.md
- requirements.txt / package.json

Adjust paths above to match the repository's actual structure.

## Security & data handling
- Do not commit API keys, credentials, or sensitive datasets to the repository.
- If working with personal or sensitive data, anonymize or remove personally identifiable information before including samples in the repo.
- Follow applicable laws and organizational policies when handling datasets.

## License
If a license is not yet included in this repository, add a `LICENSE` file to specify terms. A common choice for open-source projects is the MIT License.
