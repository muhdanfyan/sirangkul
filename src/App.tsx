import React, { useState, useEffect } from 'react';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <LoginPage />;
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
            <Route path="/proposals/new" element={<ProposalSubmission />} />
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;