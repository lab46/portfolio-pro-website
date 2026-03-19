import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useRef, useEffect } from 'react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth0();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Portfolio App
        </Link>
        
        {isAuthenticated && (
          <ul className="navbar-nav">
            <li>
              <Link to="/legal-entities" className={isActive('/legal-entities') ? 'active' : ''}>
                Legal Entities
              </Link>
            </li>
            <li>
              <Link to="/bank-accounts" className={isActive('/bank-accounts') ? 'active' : ''}>
                Bank Accounts
              </Link>
            </li>
            <li>
              <Link to="/assets" className={isActive('/assets') ? 'active' : ''}>
                Assets
              </Link>
            </li>
            <li>
              <Link to="/transactions" className={isActive('/transactions') ? 'active' : ''}>
                Transactions
              </Link>
            </li>
            <li>
              <Link to="/reports" className={isActive('/reports') ? 'active' : ''}>
                Reports
              </Link>
            </li>
            <li>
              <Link to="/automation-rules" className={isActive('/automation-rules') ? 'active' : ''}>
                Automation Rules
              </Link>
            </li>
            <li>
              <Link to="/documents" className={isActive('/documents') ? 'active' : ''}>
                Documents
              </Link>
            </li>
          </ul>
        )}

        <div className="navbar-auth">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <div className="user-menu-container" ref={menuRef}>
                  <button 
                    className="user-avatar-button" 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-label="User menu"
                  >
                    {user?.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.name || 'User'} 
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>
                  
                  {showUserMenu && (
                    <div className="user-dropdown-menu">
                      <div className="user-info-section">
                        <div className="user-name">{user?.name || 'User'}</div>
                        {user?.email && <div className="user-email">{user.email}</div>}
                      </div>
                      <div className="user-menu-divider"></div>
                      <div className="user-menu-actions">
                        <LogoutButton />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <LoginButton />
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
