import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthToken, clearAuthToken } from '../services/authService';

/**
 * Hook to automatically sync Auth0 tokens with API requests
 * This should be used at the app level to ensure all API calls include the token
 */
export const useAuth0Token = () => {
  const { isAuthenticated, getAccessTokenSilently, isLoading } = useAuth0();

  useEffect(() => {
    const syncToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          setAuthToken(token);
        } catch (error) {
          console.error('Error getting access token:', error);
          clearAuthToken();
        }
      } else {
        clearAuthToken();
      }
    };

    if (!isLoading) {
      syncToken();
    }
  }, [isAuthenticated, getAccessTokenSilently, isLoading]);
};
