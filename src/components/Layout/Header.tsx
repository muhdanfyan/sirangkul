import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onLogout }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
            <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;