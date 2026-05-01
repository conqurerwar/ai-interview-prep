import { useNavigate } from 'react-router-dom';
import { FileText, Mic } from 'lucide-react';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container home-container animate-fade-in">
      <header className="home-header">
        <h1>Elevate Your Career with AI</h1>
        <p>Prepare for your next big role using our intelligent ATS resume checker and virtual interview simulator.</p>
      </header>

      <div className="cards-grid">
        <div className="glass-panel feature-card" onClick={() => navigate('/ats')}>
          <div className="icon-wrapper ats-icon">
            <FileText size={40} />
          </div>
          <h2>ATS Checker</h2>
          <p>Upload your CV to get an ATS compatibility score, identify mistakes, and download an AI-corrected version instantly.</p>
          <button className="btn-primary">Try ATS Checker</button>
        </div>

        <div className="glass-panel feature-card" onClick={() => navigate('/interview')}>
          <div className="icon-wrapper interview-icon">
            <Mic size={40} />
          </div>
          <h2>Virtual Interview</h2>
          <p>Practice with Jerry, our animated AI interviewer. Select your topic and difficulty for a realistic, voice-based interview experience.</p>
          <button className="btn-primary">Start Interview</button>
        </div>
      </div>
    </div>
  );
}
