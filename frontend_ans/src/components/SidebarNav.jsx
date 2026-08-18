import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, User, FileText, Lock, LifeBuoy, CheckCircle2 } from 'lucide-react';

export default function SidebarNav({ isOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navItems = [
    {
      id: 'kyc',
      label: 'KYC Verification',
      path: '/verification-workflow',
      icon: ShieldCheck,
      isActive: currentPath.startsWith('/verification') || currentPath.startsWith('/verify')
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      isActive: currentPath === '/dashboard'
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '#profile',
      icon: User,
      isActive: false
    },
    {
      id: 'documents',
      label: 'Documents',
      path: '#documents',
      icon: FileText,
      isActive: false
    },
    {
      id: 'security',
      label: 'Security',
      path: '#security',
      icon: Lock,
      isActive: false
    },
    {
      id: 'support',
      label: 'Support',
      path: '#support',
      icon: LifeBuoy,
      isActive: false
    }
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-inner flex-col-justify">
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${item.isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.path && !item.path.startsWith('#')) {
                    navigate(item.path);
                  }
                }}
                type="button"
              >
                {item.isActive && <div className="active-left-indicator" />}
                <Icon size={18} className="sidebar-item-icon" />
                <span className="sidebar-item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Security Card at Bottom of Left Sidebar */}
        <div className="sidebar-security-card">
          <div className="security-card-header-row">
            <Lock size={15} className="green-lock-icon" />
            <h4>Your data is secure</h4>
          </div>
          <ul className="security-card-list">
            <li>
              <CheckCircle2 size={13} className="sec-check-icon" />
              <span>Encrypted data transmission</span>
            </li>
            <li>
              <CheckCircle2 size={13} className="sec-check-icon" />
              <span>Privacy protected</span>
            </li>
            <li>
              <CheckCircle2 size={13} className="sec-check-icon" />
              <span>Secure verification</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
