import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ATSChecker.css';

export default function ATSChecker() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/cv/check`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error uploading CV:', error);
      if (error.response && error.response.status === 402) {
        alert('Your OpenAI API key has insufficient quota or is out of credits. Please check your OpenAI billing dashboard.');
      } else {
        const backendError = error.response?.data?.error;
        alert(backendError ? `Error: ${backendError}` : 'Failed to process CV. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadCorrectedCV = () => {
    if (!result || !result.correctedCVText) return;
    const element = document.createElement("a");
    const file = new Blob([result.correctedCVText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "Corrected_CV.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="container animate-fade-in">
      <button className="btn-secondary back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to Home
      </button>

      <div className="ats-header">
        <h1>ATS Resume Checker</h1>
        <p>Upload your CV to see how it performs in Applicant Tracking Systems.</p>
      </div>

      {!result ? (
        <div className="glass-panel upload-section">
          <div className="upload-box">
            <input type="file" id="cv-upload" accept=".pdf,.doc,.docx" onChange={handleFileChange} hidden />
            <label htmlFor="cv-upload" className="upload-label">
              <Upload size={48} className="upload-icon" />
              <h3>{file ? file.name : "Click to Upload your CV"}</h3>
              <p>Supports PDF, DOC, DOCX</p>
            </label>
          </div>
          <button
            className="btn-primary upload-btn"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "Analyzing CV..." : "Analyze CV"}
          </button>
        </div>
      ) : (
        <div className="results-container">
          <div className="glass-panel score-card">
            <h2>ATS Compatibility Score</h2>
            <div className="score-circle">
              <span className="score-text">{result.atsScore}%</span>
            </div>
            <p className="score-desc">
              {result.atsScore >= 80 ? 'Excellent! Your CV is highly optimized.' :
                result.atsScore >= 60 ? 'Good, but has room for improvement.' :
                  'Needs significant improvement to pass ATS filters.'}
            </p>
          </div>

          <div className="glass-panel mistakes-card">
            <h2>Identified Mistakes</h2>
            <ul className="mistakes-list">
              {result.mistakes && result.mistakes.map((mistake, index) => (
                <li key={index} className="mistake-item">
                  <AlertTriangle size={20} className="warning-icon" />
                  <div>
                    <h4>{mistake.type}</h4>
                    <p>{mistake.description}</p>
                  </div>
                </li>
              ))}
              {(!result.mistakes || result.mistakes.length === 0) && (
                <li className="mistake-item success">
                  <CheckCircle size={20} className="success-icon" />
                  <div>
                    <h4>Perfect!</h4>
                    <p>No major mistakes found in your CV format.</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className="glass-panel action-card">
            <h2>AI Corrected Version</h2>
            <p>We've generated an updated version of your CV fixing the identified issues and optimizing keywords.</p>
            <button className="btn-primary" onClick={downloadCorrectedCV}>
              <Download size={18} /> Download Corrected CV
            </button>
            <button className="btn-secondary mt-1" onClick={() => setResult(null)}>
              Check Another CV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
