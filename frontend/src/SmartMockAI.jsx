import { useState, useEffect, useRef } from 'react';
import './App.css';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

function SmartMockAI() {
  // App Phase: 'setup' | 'interview' | 'dashboard'
  const [phase, setPhase] = useState('setup');

  // Theme Mode: 'light' | 'dark'
  const [theme, setTheme] = useState('light');

  // Sync theme with body class list
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  // Interview settings
  const [role, setRole] = useState('Frontend Developer');
  const [difficulty, setDifficulty] = useState('Mid-level');
  const [totalRounds, setTotalRounds] = useState(3);

  // Active Session state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // [{ question, answer, analysis }]
  const [overallSummary, setOverallSummary] = useState('');
  const [loading, setLoading] = useState(false);

  // Workflow states for step-by-step review
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [submittedAnalysis, setSubmittedAnalysis] = useState(null);
  const [submittedSource, setSubmittedSource] = useState('');
  const [submittedConfidence, setSubmittedConfidence] = useState('');
  const [nextQuestionData, setNextQuestionData] = useState('');
  const [isFinalRoundData, setIsFinalRoundData] = useState(false);
  const [overallSummaryData, setOverallSummaryData] = useState('');

  // Audio/Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [fillerCount, setFillerCount] = useState(0);
  const [timer, setTimer] = useState(0);

  // Accordion state for dashboard
  const [expandedRound, setExpandedRound] = useState(null);

  // Feedback form state
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('Feature Request');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'
  const [feedbackSubmittedName, setFeedbackSubmittedName] = useState('');

  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const messageEndRef = useRef(null); // Ref for scrolling to bottom

  // List of job roles to choose from
  const jobRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Engineer',
    'Mobile Engineer',
    'DevOps Engineer',
    'Cloud Architect',
    'AI / Machine Learning Engineer',
    'Data Scientist',
    'Cyber Security Analyst',
    'Database Administrator (DBA)',
    'Embedded Systems Engineer',
    'Game Developer',
    'Blockchain Developer',
    'QA Automation Engineer',
    'Network Engineer'
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setAnswer((prev) => (prev + ' ' + finalTranscript).trim());
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Track live filler words from user's current typed/transcribed answer
  useEffect(() => {
    const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know'];
    const words = answer.toLowerCase().split(/\s+/);
    let count = 0;
    
    words.forEach(word => {
      // Clean word from basic punctuation
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      if (fillers.includes(cleanWord)) {
        count++;
      }
    });

    // Check for "you know" phrase
    const matchPhrases = (answer.toLowerCase().match(/you know/g) || []).length;
    // "you know" has 2 words, so adjust count based on simple split double counting
    count = count + matchPhrases; 

    setFillerCount(count);
  }, [answer]);

  // Auto-scroll to bottom of message list when chat history or step state changes
  useEffect(() => {
    if (messageEndRef.current) {
      const container = messageEndRef.current.closest('.message-list');
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatHistory, currentQuestion, isWaitingForNext, loading]);

  // Handle active timer when recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported or permission is denied in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        setTimer(0);
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  // Start the interview
  const startInterview = async () => {
    setLoading(true);
    setChatHistory([]);
    setCurrentRound(1);
    setAnswer('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole: role, difficulty })
      });
      const data = await response.json();
      setCurrentQuestion(data.question);
      setPhase('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Could not start mock interview. Is the backend running?');
    }
    setLoading(false);
  };

  // Submit response & retrieve assessment
  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please type or record an answer before submitting.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRole: role,
          difficulty,
          currentQuestion,
          currentAnswer: answer,
          chatHistory,
          currentRound,
          totalRounds
        })
      });
      
      const data = await response.json();

      // Capture active response and analysis to present review
      setSubmittedAnswer(answer);
      setSubmittedAnalysis(data.analysis);
      setSubmittedSource(data.analysisSource || 'gemini');
      setSubmittedConfidence(data.confidence || 'high');
      setNextQuestionData(data.nextQuestion);
      setIsFinalRoundData(data.isEnded);
      setOverallSummaryData(data.overallSummary);
      setIsWaitingForNext(true);
      setAnswer('');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to process response. Please try again.');
    }
    setLoading(false);
  };

  // Transition to next question or end interview session
  const handleNextRound = () => {
    const roundRecord = {
      question: currentQuestion,
      answer: submittedAnswer,
      analysis: submittedAnalysis,
      analysisSource: submittedSource,
      confidence: submittedConfidence
    };

    const updatedHistory = [...chatHistory, roundRecord];
    setChatHistory(updatedHistory);

    if (isFinalRoundData) {
      setOverallSummary(overallSummaryData);
      setPhase('dashboard');
    } else {
      setCurrentQuestion(nextQuestionData);
      setCurrentRound((prev) => prev + 1);
      setSubmittedAnswer('');
      setSubmittedAnalysis(null);
      setSubmittedSource('');
      setSubmittedConfidence('');
      setIsWaitingForNext(false);
      setTimer(0);
    }
  };

  const restartApp = () => {
    setPhase('setup');
    setAnswer('');
    setChatHistory([]);
    setOverallSummary('');
    setCurrentRound(1);
    setIsWaitingForNext(false);
    setSubmittedAnswer('');
    setSubmittedAnalysis(null);
    setSubmittedSource('');
    setSubmittedConfidence('');
    setNextQuestionData('');
    setIsFinalRoundData(false);
    setOverallSummaryData('');
  };

  // Export full transcript as a file
  const exportTranscript = () => {
    let content = `# SmartMock AI Mock Interview Report\n`;
    content += `Role: ${role} | Difficulty: ${difficulty}\n`;
    content += `Total Rounds: ${totalRounds}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n\n`;
    content += `## Overall Performance Summary\n${overallSummary}\n\n`;
    content += `## Round Details\n\n`;

    chatHistory.forEach((item, index) => {
      content += `### Round ${index + 1}\n`;
      content += `**Question:** ${item.question}\n`;
      content += `**Your Answer:** ${item.answer}\n`;
      content += `**Score:** ${item.analysis.score}\n`;
      content += `**Filler Words Review:** ${item.analysis.fillerWordAnalysis}\n`;
      content += `**Technical Review:** ${item.analysis.technicalFeedback}\n`;
      content += `**Try saying this instead:** ${item.analysis.improvedVersion}\n\n`;
      content += `--------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartMock_AI_Report_${role.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to format time
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Helper to get average score for circular gauge
  const getAverageScore = () => {
    if (chatHistory.length === 0) return 0;
    const total = chatHistory.reduce((acc, curr) => {
      const match = curr.analysis.score.match(/(\d+)\/10/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);
    return Math.round((total / chatHistory.length) * 10) / 10;
  };

  // Handle feedback form submission
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackName.trim() || !feedbackEmail.trim() || !feedbackMessage.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    
    setFeedbackStatus('submitting');
    
    // Simulate API submission
    setTimeout(() => {
      setFeedbackSubmittedName(feedbackName);
      setFeedbackStatus('success');
      setFeedbackName('');
      setFeedbackEmail('');
      setFeedbackCategory('Feature Request');
      setFeedbackRating(5);
      setFeedbackMessage('');
    }, 1200);
  };

  // Render Functions
  return (
    <div className="app-container">
      <nav className="app-navbar fade-in">
        <div className="nav-logo" onClick={restartApp} style={{ cursor: 'pointer' }}>
          <span className="logo-icon">🎙️</span>
          <span className="logo-text">SmartMock <span className="logo-subtext">AI</span></span>
        </div>
        <button type="button" className="theme-toggle-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </nav>

      {phase === 'setup' && (
        <>
          <div className="landing-grid fade-in">
            {/* Left Column: Hero Copy & Showcase */}
            <div className="hero-content">
              
              
              <h1 className="hero-heading">
                Ace Your Tech Interviews with <span className="text-gradient">SmartMock AI</span>
              </h1>
              
              <p className="hero-lead">
                A premium speech-to-text interactive mock interview simulator. Practice speaking answers in real time, monitor vocal pacings, and get detailed AI-powered feedback maps.
              </p>

              {/* Engineering Highlights / Features */}
              <div className="tech-stack-container">
                <span className="tech-tag">React.js</span>
                <span className="tech-tag">Web Speech API</span>
                <span className="tech-tag">Express.js</span>
                <span className="tech-tag">Gemini LLM</span>
                <span className="tech-tag">Glassmorphism UI</span>
              </div>

              {/* Quick Metrics */}
              <div className="hero-stats">
                <div className="hero-stat-card">
                  <div className="stat-icon-wrap">🎙️</div>
                  <div className="stat-info">
                    <h4>Voice Dictation</h4>
                    <p>Real-time speech-to-text translation</p>
                  </div>
                </div>
                <div className="hero-stat-card">
                  <div className="stat-icon-wrap">⏱️</div>
                  <div className="stat-info">
                    <h4>Linguistic Pacing</h4>
                    <p>Live filler word count & timer tracking</p>
                  </div>
                </div>
                <div className="hero-stat-card">
                  <div className="stat-icon-wrap">🧠</div>
                  <div className="stat-info">
                    <h4>Detailed Assessment</h4>
                    <p>Technically graded scores & suggestions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Hologram Soundwave Animation Visualizer */}
            <div className="hero-visualizer-card">
              <div className="visualizer-header">
                <span className="visualizer-dot green-pulse"></span>
                <span className="visualizer-status">SYSTEM ONLINE</span>
                <span className="visualizer-tech-badge">GEMINI LLM</span>
              </div>
              
              <div className="hologram-container">
                <div className="hologram-glow"></div>
                <div className="hologram-circle outer-circle"></div>
                <div className="hologram-circle middle-circle"></div>
                <div className="hologram-circle inner-circle">
                  <span className="hologram-icon">🎙️</span>
                </div>
              </div>

              <div className="visualizer-soundwave">
                <span className="sound-bar" style={{ animationDelay: '0.1s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.3s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.5s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.2s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.6s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.4s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.7s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.3s' }}></span>
                <span className="sound-bar" style={{ animationDelay: '0.5s' }}></span>
              </div>

              <div className="visualizer-meta-grid">
                <div className="meta-item">
                  <div className="meta-label">AUDIO ENGINE</div>
                  <div className="meta-value">WEB SPEECH API</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">RESPONSE TYPE</div>
                  <div className="meta-value">STREAMING NLP</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">PACING INDEX</div>
                  <div className="meta-value">LIVE MONITOR</div>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Configuration Form Card Below */}
          <section className="setup-card-horizontal">
            <div className="setup-horizontal-header">
              <h2 className="setup-title-horizontal">Configure Your Interview</h2>
              <p className="setup-subtitle-horizontal">Customize your simulated mock session parameters</p>
            </div>
            
            <div className="setup-form-horizontal">
              {/* Job Role Group */}
              <div className="form-group-horizontal role-group">
                <label className="form-label">Select Job Role</label>
                <select
                  className="form-select-horizontal"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {jobRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Level Group */}
              <div className="form-group-horizontal experience-group">
                <label className="form-label">Experience Level</label>
                <div className="pill-selector-horizontal">
                  {[
                    { val: 'Junior', label: 'Junior', desc: '0-2 Yrs' },
                    { val: 'Mid-level', label: 'Mid-level', desc: '2-5 Yrs' },
                    { val: 'Senior', label: 'Senior', desc: '5+ Yrs' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      className={`pill-btn-horizontal ${difficulty === item.val ? 'active' : ''}`}
                      onClick={() => setDifficulty(item.val)}
                    >
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-desc">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Rounds Group */}
              <div className="form-group-horizontal rounds-group">
                <label className="form-label">Interview Rounds</label>
                <div className="rounds-selector-horizontal">
                  {[3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`round-pill-horizontal ${totalRounds === num ? 'active' : ''}`}
                      onClick={() => setTotalRounds(num)}
                    >
                      <span className="round-num">{num}</span>
                      <span className="round-text">Rounds</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Button Action Row Below */}
            <div className="setup-actions-horizontal">
              <button type="button" className="btn btn-primary btn-launch-horizontal" onClick={startInterview} disabled={loading}>
                {loading ? 'Generating Simulator...' : 'Launch Simulation 🚀'}
              </button>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="info-section slide-up">
            <h3 className="section-subtitle">Workflow Overview</h3>
            <h2 className="section-main-title">How SmartMock AI Simulates Reality</h2>
            <div className="timeline-steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <h4>Configure Persona</h4>
                <p>Choose your target role and select difficulty depth for customized technical questionnaires.</p>
              </div>
              <div className="step-card">
                <div className="step-number">02</div>
                <h4>Voice Interactive Mock</h4>
                <p>Listen to questions and speak answers using Web Speech API to test verbal technical capabilities.</p>
              </div>
              <div className="step-card">
                <div className="step-number">03</div>
                <h4>Linguistic Feedback</h4>
                <p>Tracks live filler words (like "um", "you know") to help refine communication pacing and flow.</p>
              </div>
              <div className="step-card">
                <div className="step-number">04</div>
                <h4>AI Grading & Reports</h4>
                <p>Analyze technical accuracy score and download detailed markdown summaries for resume reviews.</p>
              </div>
            </div>
          </section>

          {/* Technology Spotlight (CSE Specialization) */}
          <section className="tech-spotlight-section slide-up">
            <h3 className="section-subtitle">System Architecture</h3>
            <h2 className="section-main-title">Under the Hood Architecture</h2>
            <div className="features-grid">
              <div className="feature-item-card">
                <div className="feature-icon-badge">🗣️</div>
                <h3>Linguistic Parser</h3>
                <p>Uses reactive regex checking to track filler patterns and calculate conversational pacing live.</p>
              </div>
              <div className="feature-item-card">
                <div className="feature-icon-badge">🎙️</div>
                <h3>Web Speech Engine</h3>
                <p>Leverages native speech recognition pipelines for high-accuracy local dictation streaming.</p>
              </div>
              <div className="feature-item-card">
                <div className="feature-icon-badge">🤖</div>
                <h3>Generative AI Evaluator</h3>
                <p>Integrates with LLMs to cross-examine responses against industry expectations and suggest optimized versions.</p>
              </div>
              <div className="feature-item-card">
                <div className="feature-icon-badge">📄</div>
                <h3>Markdown Reporter</h3>
                <p>Generates structured performance cards and reports dynamically formatted using blob streams.</p>
              </div>
            </div>
          </section>

          {/* Feedback & Feature Requests Section */}
          <section className="feedback-section slide-up">
            <h3 className="section-subtitle">Suggestions & Feedback</h3>
            <h2 className="section-main-title">Help Us Improve SmartMock AI</h2>
            <p className="feedback-lead">
              Have a feature request, found a bug, or want to suggest an improvement? We'd love to hear from you!
            </p>
            
            <div className="feedback-container">
              {feedbackStatus === 'success' ? (
                <div className="feedback-success-card">
                  <div className="success-icon-wrap">🎉</div>
                  <h3>Feedback Submitted!</h3>
                  <p>
                    Thank you, <strong>{feedbackSubmittedName}</strong>. Your feedback helps make SmartMock AI better for everyone. We've received your request and will look into it.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={() => setFeedbackStatus('idle')}>
                    Submit Another Response
                  </button>
                </div>
              ) : (
                <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                  <div className="feedback-form-grid">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input 
                        type="text" 
                        className="form-input-text" 
                        placeholder="Your Name"
                        value={feedbackName}
                        onChange={(e) => setFeedbackName(e.target.value)}
                        required
                        disabled={feedbackStatus === 'submitting'}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-input-text" 
                        placeholder="you@example.com"
                        value={feedbackEmail}
                        onChange={(e) => setFeedbackEmail(e.target.value)}
                        required
                        disabled={feedbackStatus === 'submitting'}
                      />
                    </div>
                  </div>

                  <div className="feedback-form-grid">
                    <div className="form-group">
                      <label className="form-label">Feedback Category</label>
                      <select 
                        className="form-select-custom"
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value)}
                        disabled={feedbackStatus === 'submitting'}
                      >
                        <option value="Feature Request">💡 Feature Request</option>
                        <option value="Bug Report">🐛 Bug Report</option>
                        <option value="UI/UX Improvement">🎨 UI/UX Improvement</option>
                        <option value="General Suggestion">💬 General Suggestion</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Experience Rating</label>
                      <div className="feedback-rating-selector">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`rating-star-btn ${feedbackRating >= star ? 'active' : ''}`}
                            onClick={() => setFeedbackRating(star)}
                            disabled={feedbackStatus === 'submitting'}
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Message / Details</label>
                    <textarea 
                      className="form-textarea-custom" 
                      rows="4" 
                      placeholder="Describe your feature request, suggestion, or bug in detail..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      required
                      disabled={feedbackStatus === 'submitting'}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-submit-feedback"
                    disabled={feedbackStatus === 'submitting'}
                  >
                    {feedbackStatus === 'submitting' ? 'Sending Feedback...' : 'Send Feedback ✉️'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </>
      )}

      {phase === 'interview' && (
        <section className="session-container fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="session-header-row">
              <span className="session-badge">Round {currentRound} of {totalRounds}</span>
              <span className="session-badge">{role} - {difficulty}</span>
            </div>

            <div className="chat-window">
              <div className="message-list">
                {/* 1. Render all completed rounds from chatHistory chronologically */}
                {chatHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                    <div className="message-bubble interviewer">
                      <div className="bubble-sender">AI Interviewer</div>
                      <p>{h.question}</p>
                    </div>
                    <div className="message-bubble candidate">
                      <div className="bubble-sender candidate">Candidate (You)</div>
                      <p>{h.answer}</p>
                    </div>
                    
                    {/* Clean Timeline Score Divider */}
                    <div className="round-score-divider">
                      <span className="divider-line"></span>
                      <span className="divider-badge">Round {i + 1} Score: {h.analysis.score}</span>
                      <span className="divider-line"></span>
                    </div>
                  </div>
                ))}

                {/* 2. Render active round question */}
                <div className="message-bubble interviewer">
                  <div className="bubble-sender">AI Interviewer</div>
                  <p>{currentQuestion}</p>
                </div>

                {/* 3. If waiting for next round (active round submitted, show answer bubble inline) */}
                {isWaitingForNext && (
                  <div className="message-bubble candidate animate-slide-up">
                    <div className="bubble-sender candidate">Candidate (You)</div>
                    <p>{submittedAnswer}</p>
                  </div>
                )}
                
                <div ref={messageEndRef} />
              </div>

              {/* Sticky Proceed Button inside chat window container */}
              {isWaitingForNext && (
                <div className="chat-proceed-container fade-in">
                  <button type="button" className="btn btn-primary chat-proceed-btn" onClick={handleNextRound}>
                    {isFinalRoundData ? 'Finish & View Summary 📊' : 'Proceed to Next Question ➡️'}
                  </button>
                </div>
              )}

              {loading && (
                <div style={{ textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: '600', padding: '10px' }}>
                  AI Interviewer is analyzing response...
                </div>
              )}
            </div>
          </div>

          <div className="control-panel">
            {!isWaitingForNext ? (
              <div className="console-card fade-in">
                <h3 className="console-title">Answer Console</h3>
                
                <div className="speech-recorder-container">
                  <button 
                    type="button"
                    className={`mic-btn ${isRecording ? 'recording' : ''}`} 
                    onClick={toggleRecording}
                    disabled={loading}
                    title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                  >
                    {isRecording ? '🛑' : '🎙️'}
                  </button>
                  <div className={`recorder-status ${isRecording ? 'active' : ''}`}>
                    {isRecording ? 'Listening... Speak now.' : 'Click to start voice recording'}
                  </div>

                  {isRecording && (
                    <div className="waveform">
                      <div className="wave-bar animating" style={{ height: '18px' }}></div>
                      <div className="wave-bar animating" style={{ height: '28px' }}></div>
                      <div className="wave-bar animating" style={{ height: '15px' }}></div>
                      <div className="wave-bar animating" style={{ height: '24px' }}></div>
                      <div className="wave-bar animating" style={{ height: '10px' }}></div>
                    </div>
                  )}
                </div>

                <div className="live-stats">
                  <div className="stat-box">
                    <div className="stat-label">Speech Duration</div>
                    <div className="stat-value">{formatTime(timer)}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Filler Words</div>
                    <div className={`stat-value ${fillerCount > 3 ? 'warning' : ''}`}>{fillerCount}</div>
                  </div>
                </div>

                <div className="answer-input-container">
                  <textarea
                    className="answer-textarea"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Your speech transcript will appear here. You can also edit it or type directly..."
                    disabled={loading}
                  />
                  
                  <div className="action-row">
                    <button type="button" className="btn btn-secondary" onClick={restartApp}>Exit</button>
                    <button type="button" className="btn btn-primary" onClick={submitAnswer} disabled={loading || !answer.trim()}>
                      Submit Response
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="console-card feedback-review-card fade-in">
                <h3 className="console-title">AI Assessment</h3>
                
                {submittedSource === 'local' && (
                  <div className="fallback-alert">
                    ⚠️ AI services unavailable. Local backup evaluator was used.
                  </div>
                )}
                
                <div className="badge-container">
                  {submittedSource === 'gemini' && <span className="source-badge badge-gemini">🟢 Gemini Analysis</span>}
                  {submittedSource === 'groq' && <span className="source-badge badge-groq">🟡 Groq Fallback</span>}
                  {submittedSource === 'local' && <span className="source-badge badge-local">🔵 Local Backup</span>}
                  <span className="confidence-badge">Confidence: {submittedConfidence}</span>
                </div>
                
                <div className="feedback-score-widget">
                  <div className="feedback-score-circle">
                    <span className="feedback-score-num">{submittedAnalysis.score.split('/')[0]}</span>
                  </div>
                  <div className="feedback-round-label">Round {currentRound} Score</div>
                </div>

                <div className="feedback-details-container">
                  <div className="feedback-detail-section">
                    <h4 className="detail-section-title">🎙️ Pacing & Vocal Delivery</h4>
                    <p className="detail-section-text">{submittedAnalysis.fillerWordAnalysis}</p>
                  </div>

                  <div className="feedback-detail-section">
                    <h4 className="detail-section-title">🔍 Technical Evaluation</h4>
                    <p className="detail-section-text">{submittedAnalysis.technicalFeedback}</p>
                  </div>

                  <div className="feedback-detail-section model-answer-section">
                    <h4 className="detail-section-title">💡 Recommended Response</h4>
                    <div className="model-answer-bubble">
                      "{submittedAnalysis.improvedVersion}"
                    </div>
                  </div>
                </div>

                <div className="feedback-action-row">
                  <button type="button" className="btn btn-secondary" onClick={restartApp} style={{ width: '100%' }}>Exit Interview</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {phase === 'dashboard' && (
        <section className="dashboard-container fade-in">
          <h2 className="dashboard-title">Interview Summary & Analytics</h2>
          
          <div className="score-summary-widget">
            <div className="radial-gauge">
              <svg className="radial-gauge-svg" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-primary)" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <circle className="radial-bg" cx="80" cy="80" r="70" />
                <circle 
                  className="radial-fill" 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  style={{ strokeDashoffset: 440 - (440 * (getAverageScore() * 10)) / 100 }}
                />
              </svg>
              <div className="radial-text">{getAverageScore()}/10</div>
            </div>
            <div className="gauge-description">Average Interview Score</div>
          </div>

          <div className="dashboard-grid">
            <div className="review-panel">
              <h3 className="review-panel-title strengths">🟢 Key Strengths</h3>
              <div className="review-content">
                {overallSummary ? overallSummary.split(/areas to work on|areas for improvement/i)[0].replace(/Overall Performance Summary:/i, '').trim() : 'Analyzing...'}
              </div>
            </div>
            <div className="review-panel">
              <h3 className="review-panel-title weaknesses">🔴 Focus Areas</h3>
              <div className="review-content">
                {overallSummary && overallSummary.split(/areas to work on|areas for improvement/i)[1] 
                  ? 'Areas to work on:\n' + overallSummary.split(/areas to work on|areas for improvement/i)[1].trim()
                  : 'Great job! No major gaps detected.'}
              </div>
            </div>
          </div>

          <div className="timeline-section">
            <h3 className="timeline-section-title">Round-by-Round Breakdown</h3>
            <div className="timeline-list">
              {chatHistory.map((item, idx) => (
                <div key={idx} className="timeline-item">
                  <button 
                    type="button"
                    className="timeline-trigger" 
                    onClick={() => setExpandedRound(expandedRound === idx ? null : idx)}
                  >
                    <span>Round {idx + 1}: {item.question.slice(0, 60)}...</span>
                    <span>{item.analysis.score} {expandedRound === idx ? '▲' : '▼'}</span>
                  </button>
                  {expandedRound === idx && (
                    <div className="timeline-content">
                      <div>
                        <span className="timeline-label">Interviewer Question:</span>
                        <p className="timeline-value">{item.question}</p>
                      </div>
                      <div>
                        <span className="timeline-label">Your Response:</span>
                        <p className="timeline-value">"{item.answer}"</p>
                      </div>
                      <div>
                        <span className="timeline-label">Pacing & Fillers:</span>
                        <p className="timeline-value">{item.analysis.fillerWordAnalysis}</p>
                      </div>
                      <div>
                        <span className="timeline-label">Technical Review:</span>
                        <p className="timeline-value">{item.analysis.technicalFeedback}</p>
                      </div>
                      <div className="timeline-suggestion">
                        <span className="timeline-label">💡 Recommended Rephrasing:</span>
                        <p style={{ marginTop: '5px' }}>{item.analysis.improvedVersion}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-actions">
            <button type="button" className="btn btn-secondary" onClick={exportTranscript}>Export Report (.md)</button>
            <button type="button" className="btn btn-primary" onClick={restartApp}>Start New Interview</button>
          </div>
        </section>
      )}

      {/* Modern Global Project Footer */}
      <footer className="project-footer fade-in">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo" onClick={restartApp} style={{ cursor: 'pointer' }}>
              <span className="logo-icon">🎙️</span>
              <span className="logo-text">SmartMock <span className="logo-subtext">AI</span></span>
            </div>
            <p className="footer-description">
              An advanced, interactive mock interview platform. Practice speaking responses in real time, monitor vocal pacing, and receive detailed AI-powered technical feedback to build career confidence.
            </p>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">Features</h4>
            <ul className="footer-links-list">
              <li><span className="footer-link-item" onClick={restartApp}>Voice Simulator</span></li>
              <li><span className="footer-link-item" onClick={restartApp}>Pacing Analysis</span></li>
              <li><span className="footer-link-item" onClick={restartApp}>Technical Grading</span></li>
              <li><span className="footer-link-item" onClick={restartApp}>Markdown Reports</span></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">Resources</h4>
            <ul className="footer-links-list">
              <li><a className="footer-link-item" href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Gemini API Docs</a></li>
              <li><a className="footer-link-item" href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API" target="_blank" rel="noopener noreferrer">Web Speech API</a></li>
              <li><a className="footer-link-item" href="https://react.dev/" target="_blank" rel="noopener noreferrer">React Reference</a></li>
              <li><a className="footer-link-item" href="https://expressjs.com/" target="_blank" rel="noopener noreferrer">Express Reference</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">System Stack</h4>
            <div className="footer-badge-list">
              <span className="footer-badge">React 19</span>
              <span className="footer-badge">Node.js</span>
              <span className="footer-badge">Express</span>
              <span className="footer-badge">Gemini LLM</span>
              <span className="footer-badge">Web Speech API</span>
              <span className="footer-badge">Glassmorphism</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} SmartMock AI. All rights reserved.
          </p>
          <div className="footer-meta">
            <a className="footer-meta-link" href="#privacy">Privacy Policy</a>
            <a className="footer-meta-link" href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SmartMockAI;