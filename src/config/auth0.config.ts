/**
 * Auth0 Configuration
 * 
 * IMPORTANT: Replace these placeholder values with your actual Auth0 credentials
 * 
 * To get these values:
 * 1. Go to your Auth0 Dashboard: https://manage.auth0.com
 * 2. Navigate to Applications > Your Application
 * 3. Copy the Domain, Client ID, and Client Secret
 * 
 * For production, use environment variables instead of hardcoding values
 */

export const auth0Config = {
  // Replace with your Auth0 domain (e.g., 'your-tenant.us.auth0.com')
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'YOUR_AUTH0_DOMAIN',
  
  // Replace with your Auth0 Client ID
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'YOUR_AUTH0_CLIENT_ID',
  
  // Redirect URI after authentication
  redirectUri: window.location.origin,
  
  // Audience for your API (optional, use if you have an API configured)
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || undefined,
  
  // Scopes to request
  scope: 'openid profile email read:legal_entities, write:legal_entities read:members, write:members read:bank_accounts write:bank_accounts read:assets write:assets read:transactions write:transactions read:documents write:documents read:reports read:automation_rules write:automation_rules',
}; 

// Type for Auth0 configuration
export interface Auth0Config {
  domain: string;
  clientId: string;
  redirectUri: string;
  audience?: string;
  scope: string;
}
