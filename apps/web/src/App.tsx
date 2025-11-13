import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DIDManagement from './pages/DIDManagement';
import Credentials from './pages/Credentials';
import CredentialIssuance from './pages/CredentialIssuance';
import CredentialVerification from './pages/CredentialVerification';
import Settings from './pages/Settings';

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/did" element={<DIDManagement />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/credentials/issue" element={<CredentialIssuance />} />
            <Route path="/credentials/verify" element={<CredentialVerification />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  );
}

export default App;

