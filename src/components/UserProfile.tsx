import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="user-profile loading">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="user-profile">
      {user.picture && (
        <img 
          src={user.picture} 
          alt={user.name || 'User'} 
          className="user-avatar"
        />
      )}
      <div className="user-info">
        <span className="user-name">{user.name || user.email}</span>
        {user.email && user.name && (
          <span className="user-email">{user.email}</span>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
