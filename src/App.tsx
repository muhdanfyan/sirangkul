import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import RKAMManagement from './pages/RKAMManagement';
import ProposalSubmission from './pages/ProposalSubmission';
import ProposalTracking from './pages/ProposalTracking';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import PaymentManagement from './pages/PaymentManagement';
import Reporting from './pages/Reporting';
import FeedbackManagement from './pages/FeedbackManagement';
import AuditLog from './pages/AuditLog';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import MyProposals from './pages/MyProposals';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import RAKMViewer from './pages/RAKMViewer';
import ProposalList from './components/widgets/ProposalList';
import ProposalForm from './components/widgets/ProposalForm';
import ProposalDetail from './components/widgets/ProposalDetail';
import ProposalApproval from './pages/ProposalApproval';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/rakm-viewer" element={<RAKMViewer />} />
          <Route path="/*" element={<ProtectedRoute />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function ProtectedRoute() {
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={logout} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/rkam" element={<RKAMManagement />} />
            
            {/* Proposal Routes */}
            <Route path="/proposal-tracking" element={<ProposalList />} />
            <Route path="/proposal-submission" element={<ProposalSubmission />} />
            <Route path="/my-proposals" element={<MyProposals />} />
            <Route path="/proposals/:id" element={<ProposalDetail />} />
            <Route path="/proposals/:id/approval" element={<ProposalApproval />} />
            <Route path="/proposals/:id/edit" element={<ProposalForm isEdit={true} />} />
            
            {/* Legacy Proposal Routes - Keep for backward compatibility */}
            <Route path="/proposals/new" element={<ProposalForm />} />
            <Route path="/proposals/tracking" element={<ProposalTracking />} />
            
            <Route path="/approvals" element={<ApprovalWorkflow />} />
            <Route path="/payments" element={<PaymentManagement />} />
            <Route path="/reports" element={<Reporting />} />
            <Route path="/feedback" element={<FeedbackManagement />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
