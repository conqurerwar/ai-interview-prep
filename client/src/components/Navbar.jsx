import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="gradient-text">bePrepared</span>
        </Link>
        <div className="navbar-links">
          <Link to="/ats" className="nav-link">ATS Checker</Link>
          <Link to="/interview" className="nav-link">Mock Interview</Link>
          {user && <Link to="/dashboard" className="nav-link">Dashboard</Link>}
          
          {user ? (
            <div className="user-menu">
              <div className="user-badge">
                <UserIcon size={16} />
                <span>{user.email.split('@')[0]}</span>
              </div>
              <button onClick={logout} className="logout-btn" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary login-btn">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
