import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ATSChecker from './pages/ATSChecker';
import VirtualInterview from './pages/VirtualInterview';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ats" element={<ATSChecker />} />
          <Route path="/interview" element={<VirtualInterview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
