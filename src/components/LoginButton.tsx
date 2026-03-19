import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './LoginButton.css';

const LoginButton: React.FC = () => {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (
    <button
      className="btn btn-primary login-button"
      onClick={() => loginWithRedirect()}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Log In'}
    </button>
  );
};

export default LoginButton;
