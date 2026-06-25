# 🎙️ SmartMock AI - Interview Analyzer

**Live Deployment Link:** [https://your-vercel-deployment-link.vercel.app](https://your-vercel-deployment-link.vercel.app)

SmartMock AI is an intelligent, AI-powered interview practice helper that analyzes candidate answers for specific job roles. Using the state-of-the-art **Gemini 2.5 Flash** model, it reviews user answers for clarity, technical accuracy, and pacing issues (like usage of filler words), providing actionable feedback and a polished, improved version of the answer.

---

## 🚀 Features

- **Dropdown Job Role Selection**: Offers a streamlined selector listing 16 diverse computer science disciplines (e.g. *Software Engineer*, *AI/ML*, *Cloud Architect*, *Cybersecurity*, etc.).
- **Live Soundwave Visualizer**: Active CSS-animated voice/soundwave visualizer card enhancing the setup dashboard.
- **Technical Feedback Panel**: Provides an instant sidebar rating, filler-word tracker, and rephrase suggestion list side-by-side with the question transcript.
- **Pacing & Filler Word Tracking**: Detects repetitive filler words (e.g., *um*, *uh*, *like*, *basically*, *actually*) and evaluates speech pacing.
- **💡 Improved Suggestions**: Offers a polished, professional rewrite/rephrasing of the candidate's answer.
- **Scoring System**: Grades responses out of 10 based on structure, clarity, and correctness.
- **🛡️ Local Fallback Engine**: Employs an offline backup parser and role-specific question databank that automatically acts when Gemini API rate limits/503 errors occur, keeping the interview uninterrupted.
- **📬 Feedback & Suggestions Portal**: In-app feedback system for users to submit improvements directly.

---

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express**
- **Google Generative AI SDK** (configured for `gemini-2.5-flash` with exponential backoff retry)
- **Local Fallback Engine** (offline evaluation & question bank)
- **dotenv** (environment configuration)
- **CORS** (cross-origin resource sharing)

### Frontend
- **React 19**
- **Vite** (build tool)
- **Vanilla CSS** (premium teal/cyan theme-responsive layout, glassmorphism UI, setup audio visualizers, and a circular emoji theme toggle switch)

---

## 📁 Repository Structure

```text
interview-analyzer/
├── backend/
│   ├── .env                  # Port and API keys (ignored by git)
│   ├── server.js             # Main Express server and Gemini integration
│   ├── package.json          # Backend dependencies and scripts
│   └── package-lock.json
└── frontend/
    ├── src/
    │   ├── main.jsx      # Entrypoint
    │   ├── App.jsx       # Layout shell
    │   ├── SmartMockAI.jsx # Main analyzer component UI and logic
    │   ├── index.css     # Base styles
    │   └── App.css       # App-specific UI styles
    ├── package.json      # Frontend configuration & dependencies
    ├── vite.config.js    # Vite configuration
    └── index.html        # HTML template
```

---

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

---

### Step 1: Configure & Start the Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the backend server:
   ```bash
   node server.js
   ```
   The backend will run at [http://localhost:5002](http://localhost:5002).

---

### Step 2: Configure & Start the Frontend

1. Navigate to the frontend workspace folder:
   ```bash
   cd ../frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open the displayed URL in your browser (usually [http://localhost:5173](http://localhost:5173)).

---

## 🔌 API Reference

### Analyze Interview Answer

- **Endpoint**: `/api/analyze`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "interviewAnswer": "I basically use React to build components. It's like a library, and uh, it is fast.",
    "jobRole": "Frontend Developer"
  }
  ```

- **Response Body**:
  ```json
  {
    "score": "6/10",
    "fillerWordAnalysis": "Detected multiple filler words: 'basically', 'like', and 'uh'. Try pausing instead of using fillers.",
    "technicalFeedback": "Correctly identifies React as a component-based library. However, it lacks details on key React concepts such as virtual DOM, state management, or hooks.",
    "improvedVersion": "React is a component-based JavaScript library designed for building fast and interactive user interfaces. It optimizes updates by utilizing a virtual DOM, allowing developers to manage state and render UI efficiently."
  }
  ```

---

## 📝 License

This project is licensed under the ISC License.
