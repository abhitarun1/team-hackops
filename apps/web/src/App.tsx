import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DIDManagement from './pages/DIDManagement';
import Credentials from './pages/Credentials';
import CredentialIssuance from './pages/CredentialIssuance';
import CredentialVerification from './pages/CredentialVerification';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/did" element={<DIDManagement />} />
                      <Route path="/credentials" element={<Credentials />} />
                      <Route path="/credentials/issue" element={<CredentialIssuance />} />
                      <Route path="/credentials/verify" element={<CredentialVerification />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;

