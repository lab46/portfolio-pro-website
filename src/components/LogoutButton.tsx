import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './LogoutButton.css';

const LogoutButton: React.FC = () => {
  const { logout, isLoading } = useAuth0();

  return (
    <button
      className="btn btn-secondary logout-button"
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Log Out'}
    </button>
  );
};

export default LogoutButton;
