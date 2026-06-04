import { useState } from 'react';

function SmartMockAI() {
  const [answer, setAnswer] = useState('');
  const [role, setRole] = useState('Frontend Developer');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewAnswer: answer, jobRole: role })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error analyzing text:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', padding: '20px', fontFamily: 'Arial' }}>
      <h2>🎙️ SmartMock AI Interview Analyzer</h2>
      <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '8px', marginBottom: '10px', width: '100%' }}>
        <option>Frontend Developer</option>
        <option>Full Stack Engineer</option>
      </select>
      <textarea 
        rows="5" 
        placeholder="Type or paste your practice interview answer here..." 
        value={answer} 
        onChange={(e) => setAnswer(e.target.value)}
        style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
      />
      <button onClick={handleAnalyze} disabled={loading} style={{ marginTop: '10px', padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
        {loading ? 'Analyzing Content...' : 'Analyze Answer'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #28a745' }}>
          <h3>Score: {result.score}</h3>
          <p><strong>Pacing & Fillers:</strong> {result.fillerWordAnalysis}</p>
          <p><strong>Technical Review:</strong> {result.technicalFeedback}</p>
          <p style={{ background: '#e2f0d9', padding: '10px', borderRadius: '5px' }}><strong>💡 Try saying this instead:</strong> {result.improvedVersion}</p>
        </div>
      )}
    </div>
  );
}

export default SmartMockAI;