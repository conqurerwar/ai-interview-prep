import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, Mic, AlertTriangle, CheckCircle, Download, 
  Calendar, Award, Brain, BarChart2, ChevronDown, ChevronUp, Loader 
} from 'lucide-react';
import { generateInterviewReport } from '../utils/pdfReport';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('interviews'); // 'interviews' or 'ats'
  const [interviews, setInterviews] = useState([]);
  const [atsReports, setAtsReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState(null); // stores active expanded ID

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const [interviewsRes, atsRes] = await Promise.all([
          axios.get(`${API_URL}/api/interview/history`),
          axios.get(`${API_URL}/api/cv/history`)
        ]);
        setInterviews(interviewsRes.data);
        setAtsReports(atsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };

  // Calculations for stats
  const avgAtsScore = atsReports.length > 0
    ? Math.round(atsReports.reduce((acc, curr) => acc + curr.atsScore, 0) / atsReports.length)
    : 0;

  const avgInterviewScore = interviews.length > 0
    ? Math.round(interviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / interviews.length)
    : 0;

  const downloadCorrectedCV = (report) => {
    if (!report || !report.correctedCVText) return;
    const element = document.createElement("a");
    const file = new Blob([report.correctedCVText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Corrected_${report.fileName || "CV.txt"}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadInterviewPDF = (interview) => {
    // Map conversation models back to pdf expected models
    const conversation = interview.conversation.map(c => ({
      role: c.role === 'jerry' ? 'jerry' : 'user',
      text: c.text
    }));

    generateInterviewReport({
      mode: interview.topic.split(':')[0] || 'Technical',
      topics: [interview.topic.split(':')[1]?.trim() || interview.topic],
      difficulty: interview.difficulty,
      conversation,
      score: interview.score
    });
  };

  return (
    <div className="container dashboard-container animate-fade-in">
      <header className="dashboard-header">
        <h1>Performance Dashboard</h1>
        <p>Review your interview logs, ATS resume checker history, and tracking insights.</p>
      </header>

      {loading ? (
        <div className="dashboard-loading text-center">
          <Loader className="loader-icon spin" size={48} />
          <h3>Loading dashboard analytics...</h3>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div className="stat-icon ats-accent">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>Resumes Checked</h3>
                <span className="stat-value">{atsReports.length}</span>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon ats-accent">
                <BarChart2 size={24} />
              </div>
              <div className="stat-info">
                <h3>Average ATS Score</h3>
                <span className={`stat-value ${avgAtsScore >= 80 ? 'text-success' : avgAtsScore >= 60 ? 'text-warning' : 'text-danger'}`}>
                  {avgAtsScore}%
                </span>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon interview-accent">
                <Mic size={24} />
              </div>
              <div className="stat-info">
                <h3>Interviews Conducted</h3>
                <span className="stat-value">{interviews.length}</span>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon interview-accent">
                <Award size={24} />
              </div>
              <div className="stat-info">
                <h3>Average Mock Score</h3>
                <span className={`stat-value ${avgInterviewScore >= 80 ? 'text-success' : avgInterviewScore >= 60 ? 'text-warning' : 'text-danger'}`}>
                  {avgInterviewScore}%
                </span>
              </div>
            </div>
          </div>

          {/* History Sections Tabbed Selector */}
          <div className="dashboard-tabs">
            <button 
              className={`dashboard-tab ${activeTab === 'interviews' ? 'active' : ''}`}
              onClick={() => { setActiveTab('interviews'); setExpandedItem(null); }}
            >
              <Brain size={18} /> Mock Interviews
            </button>
            <button 
              className={`dashboard-tab ${activeTab === 'ats' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ats'); setExpandedItem(null); }}
            >
              <FileText size={18} /> ATS Resume History
            </button>
          </div>

          {/* Active Logs View */}
          <div className="history-logs-container">
            {activeTab === 'interviews' ? (
              <div className="logs-list">
                {interviews.length === 0 ? (
                  <div className="glass-panel empty-log text-center">
                    <Mic size={48} className="empty-icon" />
                    <h3>No mock interviews yet</h3>
                    <p>Practice with Jerry to get your first scoring report.</p>
                    <button className="btn-primary mt-1" onClick={() => navigate('/interview')}>
                      Start Mock Interview
                    </button>
                  </div>
                ) : (
                  interviews.map((item) => (
                    <div key={item._id} className="glass-panel log-item-card">
                      <div className="log-summary-row" onClick={() => toggleExpand(item._id)}>
                        <div className="log-main-details">
                          <span className={`difficulty-badge ${item.difficulty.toLowerCase()}`}>
                            {item.difficulty}
                          </span>
                          <div>
                            <h3>{item.topic}</h3>
                            <span className="log-date">
                              <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="log-summary-actions">
                          <div className={`score-badge ${item.score >= 80 ? 'success' : item.score >= 60 ? 'warning' : 'danger'}`}>
                            {item.score}%
                          </div>
                          {expandedItem === item._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {expandedItem === item._id && (
                        <div className="log-expanded-details animate-fade-in">
                          {/* AI Evaluation */}
                          <div className="expanded-feedback-box">
                            <h4>Jerry's Performance Review</h4>
                            <div className="expanded-feedback-content">
                              {item.feedback}
                            </div>
                          </div>

                          {/* Full Transcript */}
                          <div className="expanded-transcript-box">
                            <h4>Full Transcript</h4>
                            <div className="expanded-chat-area">
                              {item.conversation.map((msg, index) => (
                                <div key={index} className={`expanded-bubble ${msg.role}`}>
                                  <strong>{msg.role === 'jerry' ? 'Jerry' : 'You'}:</strong> {msg.text}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Downloads */}
                          <div className="expanded-actions">
                            <button className="btn-primary" onClick={() => handleDownloadInterviewPDF(item)}>
                              <Download size={16} /> Download Interview PDF Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="logs-list">
                {atsReports.length === 0 ? (
                  <div className="glass-panel empty-log text-center">
                    <FileText size={48} className="empty-icon" />
                    <h3>No resume checks yet</h3>
                    <p>Upload your CV to see your first ATS compatibility report.</p>
                    <button className="btn-primary mt-1" onClick={() => navigate('/ats')}>
                      Analyze Resume
                    </button>
                  </div>
                ) : (
                  atsReports.map((item) => (
                    <div key={item._id} className="glass-panel log-item-card">
                      <div className="log-summary-row" onClick={() => toggleExpand(item._id)}>
                        <div className="log-main-details">
                          <div className="cv-icon-badge">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h3>{item.fileName || 'CV.pdf'}</h3>
                            <span className="log-date">
                              <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="log-summary-actions">
                          <div className={`score-badge ${item.atsScore >= 80 ? 'success' : item.atsScore >= 60 ? 'warning' : 'danger'}`}>
                            {item.atsScore}%
                          </div>
                          {expandedItem === item._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {expandedItem === item._id && (
                        <div className="log-expanded-details animate-fade-in">
                          {/* Identified Mistakes */}
                          <div className="expanded-feedback-box">
                            <h4>Identified Formatting & Design Issues</h4>
                            <ul className="dashboard-mistakes-list">
                              {item.mistakes && item.mistakes.length > 0 ? (
                                item.mistakes.map((mistake, index) => (
                                  <li key={index} className="dashboard-mistake-item">
                                    <AlertTriangle size={18} className="dashboard-warning-icon" />
                                    <div>
                                      <strong>{mistake.type}:</strong> {mistake.description}
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li className="dashboard-mistake-item success">
                                  <CheckCircle size={18} className="dashboard-success-icon" />
                                  <div>
                                    <strong>No Major Formatting Errors:</strong> Your resume has clean structure!
                                  </div>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Actions */}
                          <div className="expanded-actions">
                            <button className="btn-primary" onClick={() => downloadCorrectedCV(item)}>
                              <Download size={16} /> Download AI Corrected Resume (.txt)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
