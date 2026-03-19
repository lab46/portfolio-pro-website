import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config } from './config/auth0.config';
import Layout from './components/Layout';
import AuthenticationGuard from './components/AuthenticationGuard';
import { useAuth0Token } from './hooks/useAuth0Token';
import HomePage from './pages/HomePage';
import AssetsPage from './pages/AssetsPage';
import BankAccountsPage from './pages/BankAccountsPage';
import LegalEntitiesPage from './pages/LegalEntitiesPage';
import EntityMembersPage from './pages/EntityMembersPage';
import TransactionsPage from './pages/TransactionsPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentVerificationPage from './pages/DocumentVerificationPage';
import ReportsPage from './pages/ReportsPage';
import AutomationRulesPage from './pages/AutomationRulesPage';
import './App.css';

const AppContent: React.FC = () => {
  // Sync Auth0 token with API requests
  useAuth0Token();

  return (
    <Router>
      <AuthenticationGuard>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="legal-entities" element={<LegalEntitiesPage />} />
            <Route path="legal-entities/:entityId/members" element={<EntityMembersPage />} />
            <Route path="bank-accounts" element={<BankAccountsPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="automation-rules" element={<AutomationRulesPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:documentId/verify" element={<DocumentVerificationPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthenticationGuard>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
    >
      <AppContent />
    </Auth0Provider>
  );
};

const NotFound: React.FC = () => {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
};

export default App;
