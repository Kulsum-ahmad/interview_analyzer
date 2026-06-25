# 🎨 SmartMock AI - Frontend Client

SmartMock AI Frontend is a responsive, highly interactive React application designed to simulate and evaluate technical interviews. Built using **React 19**, **Vite**, and **Vanilla CSS**, it features a premium glassmorphic UI, harmonious teal-and-cyan palette, and real-time visualization features.

---

## ✨ Features

- **Premium Teal/Cyan Design**: A curated color palette optimized for dark/light modes with glassmorphic cards and crisp borders.
- **Audio Soundwave Visualizer**: An active visualizer card at the top simulating voice recording/setup state to capture the user's focus.
- **Horizontal Configuration Controls**: Streamlined selector inputs for 16 technical disciplines and difficulty levels placed above the fold.
- **Interactive Multi-Round Mock Panels**:
  - Live chat-style transcript showing past questions and candidate answers.
  - Sticky progress/navigation buttons for seamless step transitions.
  - Sidebar feedback dashboard showing immediate ratings, rephrase suggestions, and filler word detection.
- **Integrated Feedback/Contact Portal**: Dedicated form at the footer to let users directly submit feature requests, bug reports, and suggestions.
- **Dynamic Theme Switcher**: Toggle between light and dark modes instantly with a clean circular emoji button.

---

## 🛠️ Tech Stack & Architecture

- **React 19**: Powered by standard stateful hooks (`useState`, `useRef`, `useEffect`).
- **Vanilla CSS**: Curated custom gradients (`background: linear-gradient(135deg, var(--bg-start), var(--bg-end))`), HSL tailwind-free variables, and custom micro-animations (pulsing waves, active glowing state, and card-lift hover effects).
- **Vite**: Lightweight dev compiler with Hot Module Replacement (HMR).

---

## 🚀 Running the Client

### Prerequisites
* Ensure the [Backend Server](file:///c:/interview-analyzer-backend/backend/README.md) is running on port `5002`.

### Getting Started

1. Install modern dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 📂 Code Layout

* `src/main.jsx`: Main client entry point.
* `src/App.jsx`: Global wrapper handling theme context and overall shell.
* `src/SmartMockAI.jsx`: Primary interface managing interview state machine, API coordination, and validation.
* `src/App.css` / `src/index.css`: Key stylesheet variables, layout flexboxes, animation keyframes, and themes.
