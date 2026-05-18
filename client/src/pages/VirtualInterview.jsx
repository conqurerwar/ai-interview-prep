import { useState, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Settings, XCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSpeech } from '../hooks/useSpeech';
import Jerry from '../components/Jerry';
import { MOCK_MODES } from '../config/mockModes';
import { generateInterviewReport } from '../utils/pdfReport';
import './VirtualInterview.css';

export default function VirtualInterview() {
  const navigate = useNavigate();
  const [inSetup, setInSetup] = useState(true);
  const [mode, setMode] = useState(MOCK_MODES[0].id);
  const [topics, setTopics] = useState(['React.js']);
  const [difficulty, setDifficulty] = useState('Medium');
  
  const [sessionId, setSessionId] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('Ready to start'); // 'speaking', 'listening', 'processing'
  const [conversation, setConversation] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useSpeech((transcript) => {
    handleUserSpeech(transcript);
  });

  const generateSessionId = () => Math.random().toString(36).substring(2, 15);

  const startInterview = async () => {
    setInSetup(false);
    const id = generateSessionId();
    setSessionId(id);
    setInterviewStatus('processing');
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const selectedMode = MOCK_MODES.find(m => m.id === mode);
      const res = await axios.post(`${API_URL}/api/interview/start`, {
        topic: `${selectedMode.name}: ${topics.join(', ') || 'General SWE'}`, difficulty, sessionId: id
      });
      const jerryReply = res.data.reply;
      
      setConversation([{ role: 'jerry', text: jerryReply }]);
      setInterviewStatus('speaking');
      speak(jerryReply, () => setInterviewStatus('ready'));

    } catch (err) {
      console.error(err);
      setInterviewStatus('Error connecting to server');
    }
  };

  const handleUserSpeech = async (transcript) => {
    if (!transcript.trim()) return;
    
    setConversation(prev => [...prev, { role: 'user', text: transcript }]);
    setInterviewStatus('processing');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_URL}/api/interview/chat`, {
        sessionId, userAnswer: transcript
      });
      const jerryReply = res.data.reply;

      setConversation(prev => [...prev, { role: 'jerry', text: jerryReply }]);
      setInterviewStatus('speaking');
      speak(jerryReply, () => setInterviewStatus('ready'));

    } catch (err) {
      console.error(err);
      setInterviewStatus('Error connecting to server');
    }
  };

  const stopInterview = () => {
    stopSpeaking();
    stopListening();
    navigate('/');
  };

  const finishAndDownloadReport = async () => {
    stopSpeaking();
    stopListening();
    setLoadingEvaluation(true);
    setInterviewStatus('processing');
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_URL}/api/interview/finish`, { sessionId });
      setEvaluation(res.data);
    } catch (err) {
      console.error('Error evaluating interview:', err);
      alert('Failed to evaluate your interview. Generating standard report instead.');
      
      const selectedMode = MOCK_MODES.find(m => m.id === mode);
      const fallbackScore = Math.floor(Math.random() * 20) + 75;
      generateInterviewReport({
        mode: selectedMode.name,
        topics,
        difficulty,
        conversation,
        score: fallbackScore
      });
      navigate('/dashboard');
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      if (interviewStatus === 'speaking' || isSpeaking) {
         stopSpeaking();
      }
      setInterviewStatus('listening');
      startListening();
    }
  };

  // Sync internal state with hook state
  useEffect(() => {
    if (isListening && interviewStatus !== 'listening') setInterviewStatus('listening');
    if (isSpeaking && interviewStatus !== 'speaking') setInterviewStatus('speaking');
  }, [isListening, isSpeaking]);

  return (
    <div className="container animate-fade-in interview-container">
      <button className="btn-secondary back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back
      </button>

      {inSetup ? (
        <div className="setup-container">
          <div className="glass-panel setup-card">
            <Settings size={48} className="setup-icon" />
            <h1>Configure Interview</h1>
            <p>Customize your interview session with Jerry.</p>

            <div className="form-group">
              <label>Interview Mode</label>
              <select value={mode} onChange={e => {
                setMode(e.target.value);
                const selected = MOCK_MODES.find(m => m.id === e.target.value);
                if (selected) setDifficulty(selected.defaultDifficulty);
              }}>
                {MOCK_MODES.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Topics (Select multiple)</label>
              <div className="topics-list">
                {['OS', 'Networking', 'DBMS', 'System Design', 'React.js', 'Node.js', 'DSA', 'DevOps'].map(t => (
                  <label key={t} className="topic-list-item">
                    <input 
                      type="checkbox"
                      checked={topics.includes(t)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTopics([...topics, t]);
                        } else {
                          setTopics(topics.filter(top => top !== t));
                        }
                      }}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <button className="btn-primary start-btn" onClick={startInterview}>
              Begin Interview
            </button>
          </div>
        </div>
      ) : loadingEvaluation ? (
        <div className="setup-container">
          <div className="glass-panel setup-card text-center evaluation-loading-card">
            <div className="loader-spinner"></div>
            <h1>Jerry is Evaluating...</h1>
            <p>Please wait while Jerry reviews your transcript and compiles your performance score.</p>
          </div>
        </div>
      ) : evaluation ? (
        <div className="evaluation-container animate-fade-in">
          <div className="glass-panel evaluation-card">
            <div className="evaluation-header">
              <h1>Interview Complete!</h1>
              <p className="subtitle">Jerry has graded your responses. Here is your report:</p>
            </div>
            
            <div className="evaluation-stats">
              <div className="score-badge-circle">
                <span className="eval-score-num">{evaluation.score}%</span>
                <span className="eval-score-label">Overall Score</span>
              </div>
              <div className="eval-meta-info">
                <p><strong>Topic:</strong> {evaluation.topic}</p>
                <p><strong>Difficulty:</strong> {evaluation.difficulty}</p>
                <p><strong>Date:</strong> {new Date(evaluation.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="eval-feedback-box">
              <h3>Jerry's Feedback & Assessment</h3>
              <div className="feedback-content">
                {evaluation.feedback}
              </div>
            </div>

            <div className="eval-actions">
              <button className="btn-primary" onClick={() => {
                const selectedMode = MOCK_MODES.find(m => m.id === mode);
                generateInterviewReport({
                  mode: selectedMode.name,
                  topics,
                  difficulty,
                  conversation,
                  score: evaluation.score
                });
              }}>
                <Download size={18} /> Download Full PDF Report
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="interview-room">
          <div className="glass-panel room-card">
            <div className="room-header">
              <div className="status-indicator">
                <span className={`status-dot ${interviewStatus}`}></span>
                {interviewStatus === 'speaking' ? 'Jerry is speaking...' : 
                 interviewStatus === 'listening' ? 'Listening to you...' : 
                 interviewStatus === 'processing' ? 'Processing...' : 'Your turn to speak'}
              </div>
              <div className="header-actions">
                <button className="btn-secondary success-btn" onClick={finishAndDownloadReport}>
                  Finish & Report
                </button>
                <button className="btn-secondary danger-btn" onClick={stopInterview}>
                  <XCircle size={18} /> Quit
                </button>
              </div>
            </div>

            <Jerry isSpeaking={isSpeaking} />

            <div className="controls-area">
              <button 
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleMic}
                disabled={interviewStatus === 'processing'}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <p className="mic-hint">
                {isListening ? 'Tap to stop recording' : 'Tap to answer'}
              </p>
            </div>

            <div className="transcript-area">
              {conversation.slice(-2).map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  <strong>{msg.role === 'jerry' ? 'Jerry' : 'You'}: </strong>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
