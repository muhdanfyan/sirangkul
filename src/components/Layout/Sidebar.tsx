import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PiggyBank, 
  FileText, 
  Search, 
  CheckCircle, 
  CreditCard, 
  FileBarChart, 
  MessageSquare, 
  History,
  X,
  ChevronDown,
  ChevronRight,
  ListChecks,
  FilePlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { getApprovalAttentionCount, getProposalAttentionCount } from '../../utils/proposalWorkflow';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [proposalMenuOpen, setProposalMenuOpen] = useState(false);
  const [menuCounts, setMenuCounts] = useState({
    proposals: 0,
    approvals: 0,
    payments: 0,
  });

  const isProposalRoute = location.pathname.includes('/proposal') || location.pathname.includes('/my-proposals');

  // Auto-expand Proposal menu if user is on a proposal page
  useEffect(() => {
    if (isProposalRoute) {
      setProposalMenuOpen(true);
    }
  }, [isProposalRoute]);

  useEffect(() => {
    let isMounted = true;

    const loadMenuCounts = async () => {
      if (!user) {
        if (isMounted) {
          setMenuCounts({ proposals: 0, approvals: 0, payments: 0 });
        }
        return;
      }

      const shouldLoadProposals = ['Pengusul', 'Verifikator', 'Kepala Madrasah', 'Komite Madrasah', 'Bendahara'].includes(user.role);
      const shouldLoadPayments = ['Administrator', 'Bendahara'].includes(user.role);

      try {
        const [proposals, pendingPayments] = await Promise.all([
          shouldLoadProposals ? apiService.getAllProposals() : Promise.resolve([]),
          shouldLoadPayments ? apiService.getPendingPayments() : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setMenuCounts({
          proposals: getProposalAttentionCount(user, proposals),
          approvals: getApprovalAttentionCount(user, proposals),
          payments: pendingPayments.length,
        });
      } catch (error) {
        console.error('Failed to load sidebar notification counts:', error);

        if (isMounted) {
          setMenuCounts({ proposals: 0, approvals: 0, payments: 0 });
        }
      }
    };

    loadMenuCounts();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, user]);

  const renderCountBadge = (count: number, tone: 'blue' | 'amber' = 'blue') => {
    if (count <= 0) {
      return null;
    }

    const toneClassName = tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-blue-100 text-blue-700';

    return (
      <span className={`ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${toneClassName}`}>
        {count}
      </span>
    );
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'User', path: '/users', roles: ['Administrator'] },
    { icon: PiggyBank, label: 'RKAM', path: '/rkam', roles: ['Administrator', 'Bendahara', 'Kepala Madrasah'] },
    { icon: CheckCircle, label: 'Persetujuan', path: '/approvals', roles: ['Verifikator', 'Kepala Madrasah', 'Komite Madrasah'] },
    { icon: CreditCard, label: 'Pembayaran', path: '/payments', roles: ['Bendahara', 'Administrator'] },
    { icon: FileBarChart, label: 'Laporan', path: '/reports' },
    { icon: MessageSquare, label: 'Feedback', path: '/feedback', roles: ['Administrator', 'Kepala Madrasah'] },
    { icon: History, label: 'Audit Log', path: '/audit', roles: ['Administrator'] },
  ];

  const proposalSubMenuItems = [
    { icon: ListChecks, label: 'List Proposal', path: '/proposal-tracking' },
    { icon: FilePlus, label: 'Buat Proposal', path: '/proposal-submission', roles: ['Pengusul'] },
    { icon: FileText, label: 'Proposal Saya', path: '/my-proposals', roles: ['Pengusul'] },
    { icon: Search, label: 'Lacak Proposal', path: '/proposals/tracking' },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const filteredProposalSubMenuItems = proposalSubMenuItems.filter(item => 
    !item.roles || item.roles.some(r => (user?.role || '').toLowerCase() === r.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <img src="/logo-sirangkul.png" alt="SiRangkul Logo" className="h-8 w-8" />
            <span className="ml-2 text-xl font-bold text-gray-900">SiRangkul</span>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 mb-1 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
              onClick={onClose}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="min-w-0 flex-1">{item.label}</span>
              {item.path === '/approvals' && renderCountBadge(menuCounts.approvals)}
              {item.path === '/payments' && renderCountBadge(menuCounts.payments, 'amber')}
            </NavLink>
          ))}

          {/* Proposal Menu with Submenu */}
          <div className="mb-1">
            <button
              onClick={() => setProposalMenuOpen(!proposalMenuOpen)}
              className={`flex items-center justify-between w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                isProposalRoute
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3" />
                <span>Proposal</span>
              </div>
              {renderCountBadge(menuCounts.proposals)}
              {proposalMenuOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Submenu */}
            {proposalMenuOpen && (
              <div className="ml-6 mt-1 space-y-1">
                {filteredProposalSubMenuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                    onClick={onClose}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            © 2025 SiRangkul v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
