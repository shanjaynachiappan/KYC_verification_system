import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, Menu, ChevronDown, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const usernameDisplay = user?.username || 'Shanjay';
  const initial = usernameDisplay.charAt(0).toUpperCase();

  return (
    <header className="app-header">
      <div className="header-brand-group">
        <button 
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-brand" onClick={() => navigate('/verification-workflow')} style={{ cursor: 'pointer' }}>
          <div className="shield-logo-icon">
            <Shield size={20} className="shield-icon" />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">VerifyPay</span>
            <span className="brand-subtitle">IDENTITY</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <ThemeToggle />

        {/* Single User Profile Pill with Dropdown Menu */}
        <div className="user-dropdown-container" ref={dropdownRef}>
          <button 
            className={`user-profile-badge interactive ${showDropdown ? 'active' : ''}`}
            onClick={() => setShowDropdown(!showDropdown)}
            title="User Profile Menu"
          >
            <div className="user-avatar">{initial}</div>
            <span className="user-name">{usernameDisplay}</span>
            <ChevronDown size={14} className={`dropdown-chevron ${showDropdown ? 'rotate' : ''}`} />
          </button>

          {showDropdown && (
            <div className="profile-menu-dropdown">
              <div className="dropdown-user-info">
                <strong>{usernameDisplay}</strong>
                <span>Member Account</span>
              </div>
              <hr className="dropdown-divider" />
              <button 
                className="dropdown-item" 
                onClick={() => { setShowDropdown(false); navigate('/dashboard'); }}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => { setShowDropdown(false); navigate('/verification-workflow'); }}
              >
                <ShieldCheck size={14} />
                <span>Verification Hub</span>
              </button>
              <hr className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
