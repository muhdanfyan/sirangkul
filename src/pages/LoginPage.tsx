import React, { useState, useEffect } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } else {
      setError('Email atau password salah');
    }
    setIsLoading(false);
  };

  const demoAccounts = [
    { email: 'admin@sirangkul.com', role: 'Administrator' },
    { email: 'ahmad@madrasah.com', role: 'Pengusul' },
    { email: 'siti@madrasah.com', role: 'Verifikator' },
    { email: 'kepala@madrasah.com', role: 'Kepala Madrasah' },
    { email: 'bendahara@madrasah.com', role: 'Bendahara' },
    { email: 'komite@madrasah.com', role: 'Komite Madrasah' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src="/logo-sirangkul.png" alt="SiRangkul Logo" className="h-20 w-20" />
              <div className="w-px h-16 bg-gray-300"></div>
              <img src="https://man2kotamakassar.sch.id/images/logo.png" alt="MAN 2 Makassar Logo" className="h-20 w-20" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SiRangkul</h1>
            <p className="text-gray-600">Sistem Informasi Rencana Anggaran dan Kelola Usulan</p>
            <p className="text-sm text-gray-500 mt-1">MAN 2 Kota Makassar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan email Anda"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan password Anda"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <a href="https://wa.me/6283134086899" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500">
              Hubungi Admin
            </a>
            <span className="mx-2 text-gray-400">|</span>
            <a href="/rakm-viewer" className="font-medium text-blue-600 hover:text-blue-500">
              Lihat RAKM
            </a>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="text-center text-xs text-gray-500 mb-3">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Demo Mode</span>
              <span className="ml-2">Klik untuk auto-fill • Password: <code className="bg-gray-100 px-1 rounded">password</code></span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('password');
                  }}
                  className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="text-xs font-semibold text-gray-700 group-hover:text-blue-600">{account.role}</div>
                  <div className="text-[10px] text-gray-400 truncate">{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;