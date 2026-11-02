
# AI Resume Analyzer 🚀

An AI-powered resume analyzer that identifies the most suitable job role, evaluates role-specific ATS scores, and provides intelligent feedback to improve resumes.

## ✨ Features

- Resume Upload (PDF, DOCX, TXT)
- AI-Based Job Role Detection
- Role-Specific ATS Scoring
- Skills, Sections & Action Words Analysis
- AI-Powered Resume Feedback
- Strengths, Weaknesses & Improvement Suggestions
- Downloadable Analysis Report
- Support for Curated & AI-Generated Role Profiles

## 🛠️ Tech Stack

**Frontend**
- HTML5
- CSS3
- JavaScript (ES Modules)
- PDF.js
- Mammoth.js

**Backend**
- Node.js
- Express.js
- REST APIs
- Middleware-based Architecture

**AI Integration**
- Google Gemini 2.5 Flash
- Gemini Model Fallback & Retry

**Deployment**
- Frontend: Vercel
- Backend: Render

## 🔄 Application Workflow

Resume Upload → Text Extraction → AI Role Detection → Role Profile Selection → ATS Scoring → AI Feedback → Results & Report

## 🏗️ Architecture

```text
Frontend (HTML, CSS, JavaScript)
          |
          ▼
       REST APIs
          |
          ▼
Backend (Node.js + Express)
          |
    ┌─────┴──────┐
    ▼            ▼
Controllers    Middleware
    |            |
    ▼            ▼
   Services ── Profiles
    |
    ├── Role Detection
    ├── ATS Scoring
    ├── Resume Analysis
    └── AI Feedback
         |
         ▼
   Gemini API
```

## 📂 Project Structure

```text
AI-Resume-Analyzer/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── profiles/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── validators/
│   ├── index.js
│   └── server.js
│
├── frontend/
│   ├── css/
│   ├── js/
│   │   ├── api/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.js
│   └── index.html
│
└── README.md
```

## 📊 ATS Scoring

The ATS score is calculated using a deterministic and explainable scoring system.

| Component | Weight |
|---|---:|
| Skills Coverage | 50% |
| Important Sections | 30% |
| Action Words | 20% |

Gemini handles AI-based role detection and feedback, while ATS scoring remains independent of AI-generated opinions.

## 🌐 Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| AI Integration | Google Gemini API |

- **Live Application:** [AI Resume Analyzer](https://ai-resume-analyzer-chi.vercel.app/)
- **Backend API:** [Render Server](https://ai-resume-analyzer-nxh6.onrender.com)
- **Health Check:** [API Status](https://ai-resume-analyzer-nxh6.onrender.com/api/health)

## ⚙️ Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/vikas-chaurasia21/AI-Resume-Analyzer.git
cd AI-Resume-Analyzer
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and configure:

```env
GEMINI_API_KEY=your_api_key
ALLOWED_ORIGINS=http://localhost:3000
PORT=5000
```

Start the backend:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd ../frontend
npx serve .
```

## 🔐 Security

- Environment variables for API keys
- CORS origin restrictions
- Request validation & sanitization
- Rate limiting
- Centralized error handling
- Safe rendering of dynamic content

## 🔮 Future Improvements

- Additional curated job roles
- OCR support for scanned resumes
- Enhanced analysis accuracy
- End-to-end testing
- Continuous Integration (CI)

---

**Developed by [Vikas Chaurasia](https://github.com/vikas-chaurasia21)**
