# HireRank - AI Hiring Copilot 🚀

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

HireRank is an AI-powered resume screening and candidate ranking system. It automates the tedious process of reading through hundreds of resumes by using semantic AI models to score candidates against your job description based on skill matching, experience depth, and context quality.

## ✨ Features

- **🧠 AI Semantic Matching**: Uses `sentence-transformers` (`all-MiniLM-L6-v2`) to intelligently match candidate resumes to job descriptions.
- **📊 Automated Ranking**: Candidates are scored on a 0-100 scale based on skills, experience, and impact metrics.
- **🔐 Secure Authentication**: JWT-based user authentication and protected routing.
- **📄 PDF Processing**: Extracts structured text from candidate resumes automatically.
- **⚡ Fast & Modern**: Built with a highly concurrent FastAPI backend and a snappy React + Tailwind frontend.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Python 3.11, FastAPI, SQLAlchemy (SQLite), sentence-transformers, pdfplumber
- **Authentication**: JWT (python-jose), bcrypt

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Python](https://www.python.org/downloads/) (v3.10 or higher)
- Git

---

## 🚀 Getting Started

Follow these step-by-step instructions to get the project running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/hirerank.git
cd hirerank
```

### 2. Backend Setup (FastAPI)

Open a terminal in the root directory of the project.

**For Windows (PowerShell):**
```powershell
# Create a virtual environment
python -m venv backend\venv

# Activate the virtual environment
.\backend\venv\Scripts\Activate.ps1

# Install required Python dependencies
pip install -r backend\requirements.txt

# Copy the example environment variables
Copy-Item backend\.env.example backend\.env
```

**For macOS / Linux:**
```bash
# Create a virtual environment
python3 -m venv backend/venv

# Activate the virtual environment
source backend/venv/bin/activate

# Install required Python dependencies
pip install -r backend/requirements.txt

# Copy the example environment variables
cp backend/.env.example backend/.env
```

*(Optional)* Open `backend/.env` and update the `SECRET_KEY` to a strong, random string.

### 3. Frontend Setup (React/Vite)

Open a **new** terminal window in the root directory of the project (keep your backend terminal available for later).

**For Windows (PowerShell):**
```powershell
cd frontend

# Install Node modules (using legacy-peer-deps to bypass strict version checks)
npm install --legacy-peer-deps

# Copy the example environment variables
Copy-Item .env.example .env
```

**For macOS / Linux:**
```bash
cd frontend

# Install Node modules (using legacy-peer-deps to bypass strict version checks)
npm install --legacy-peer-deps

# Copy the example environment variables
cp .env.example .env
```

---

## 🏃‍♂️ Running the Application

You will need to run the backend and frontend simultaneously in two separate terminal windows.

### Start the Backend Server

In your **Backend Terminal** (with the virtual environment activated):

```bash
python -m uvicorn backend.main:app --reload --port 8000
```
- The backend API will be running at `http://localhost:8000`
- **Interactive API Docs (Swagger):** `http://localhost:8000/docs`

> **Note:** The first time you run the analysis pipeline, the backend will download the AI model (`all-MiniLM-L6-v2`, ~90MB). This only happens once.

### Start the Frontend Server

In your **Frontend Terminal**:

```bash
# Ensure you are inside the frontend/ folder
npm run dev
```
- The web application will be accessible at `http://localhost:5173` (or the port specified in your terminal output).

---

## 📚 API Overview

Here are the core endpoints provided by the FastAPI backend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create a new user account |
| `POST` | `/auth/login` | Authenticate and get a JWT token |
| `POST` | `/upload/resumes` | Upload a batch of PDF resumes & job description |
| `POST` | `/analyze` | Trigger the AI scoring pipeline |
| `GET`  | `/analyze/status/{id}` | Poll the status of a background analysis session |
| `GET`  | `/results/{session_id}` | Fetch the ranked candidates for a specific session |
| `GET`  | `/results/candidate/{id}` | Get detailed scoring breakdowns for a single candidate |
| `GET`  | `/results/sessions/mine` | List all historical sessions belonging to the user |

---

## 🧮 AI Scoring Formula

The backend ranks candidates using a hybrid scoring system out of 100 points:

```text
Final Score = (0.5 × Skill Match) + (0.3 × Experience Depth) + (0.2 × Context Quality)
```

1. **Skill Match (50%)**: Semantic cosine similarity between the job description and candidate resume, plus explicit skill overlap bonuses.
2. **Experience Depth (30%)**: Calculated based on years of experience, leadership signals (e.g., "managed", "led"), and quantified achievements (e.g., metrics, percentages).
3. **Context Quality (20%)**: Evaluates the strength of the phrasing (e.g., action verbs vs. passive language).

---

## 🤝 Contributing

Contributions are welcome! If you'd like to extend the system:

- **Add a new scoring metric**: Create a function in `backend/core/scorer.py` and update `compute_final_score()`.
- **Add a new API route**: Create a new file in `backend/routes/` and register the router in `backend/main.py`.
- **Change the Database**: The project currently uses SQLite for simplicity. To switch to PostgreSQL, update the `DATABASE_URL` in `backend/.env` and install `psycopg2`.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
