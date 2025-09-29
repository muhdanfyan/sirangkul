import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Manajemen User', path: '/users', roles: ['Administrator'] },
    { icon: PiggyBank, label: 'RKAM', path: '/rkam', roles: ['Administrator', 'Bendahara', 'Kepala Madrasah'] },
    { icon: FileText, label: 'Buat Proposal', path: '/proposals/new', roles: ['Pengusul'] },
    { icon: Search, label: 'Lacak Proposal', path: '/proposals/tracking' },
    { icon: CheckCircle, label: 'Persetujuan', path: '/approvals', roles: ['Verifikator', 'Kepala Madrasah', 'Komite Madrasah'] },
    { icon: CreditCard, label: 'Pembayaran', path: '/payments', roles: ['Bendahara', 'Administrator'] },
    { icon: FileBarChart, label: 'Laporan', path: '/reports' },
    { icon: MessageSquare, label: 'Feedback', path: '/feedback', roles: ['Administrator', 'Kepala Madrasah'] },
    { icon: History, label: 'Audit Log', path: '/audit', roles: ['Administrator'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
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
              {item.label}
            </NavLink>
          ))}
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