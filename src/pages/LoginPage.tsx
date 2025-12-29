import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, User, Shield, ClipboardCheck, GraduationCap, Wallet, Users, Home, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Email atau password salah');
    }
    setIsLoading(false);
  };

  const demoAccounts = [
    { email: 'admin@sirangkul.com', role: 'Administrator', icon: Shield, gradient: 'from-rose-500 to-pink-600' },
    { email: 'ahmad@madrasah.com', role: 'Pengusul', icon: User, gradient: 'from-emerald-500 to-teal-600' },
    { email: 'siti@madrasah.com', role: 'Verifikator', icon: ClipboardCheck, gradient: 'from-cyan-500 to-teal-600' },
    { email: 'kepala@madrasah.com', role: 'Kepala Madrasah', icon: GraduationCap, gradient: 'from-amber-500 to-orange-600' },
    { email: 'bendahara@madrasah.com', role: 'Bendahara', icon: Wallet, gradient: 'from-blue-500 to-cyan-600' },
    { email: 'komite@madrasah.com', role: 'Komite Madrasah', icon: Users, gradient: 'from-violet-500 to-purple-600' },
  ];

  const selectDemoAccount = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword('password');
    setShowDemoAccounts(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-[0_25px_80px_-15px_rgba(6,182,212,0.25)] overflow-hidden flex min-h-[600px]">
        
        {/* Left Side - Branding with SiRangkul Colors (Teal/Cyan + Blue) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 p-12 flex-col justify-between relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-40 h-40 border-[20px] border-white rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-60 h-60 border-[20px] border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white/50 rounded-full"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Logo Container */}
            <div className="bg-white rounded-2xl p-4 inline-block shadow-lg">
              <div className="flex items-center gap-3">
                <img src="/logo-sirangkul.png" alt="SiRangkul" className="h-12 w-12 object-contain" />
                <span className="text-cyan-600 font-bold text-xl">SiRangkul</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-white">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Kelola Anggaran<br/>Madrasah dengan<br/>Mudah
            </h1>
            <p className="text-white/90 text-lg">
              Sistem terintegrasi untuk pengelolaan RKAM yang transparan dan akuntabel
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <img src="https://man2kotamakassar.sch.id/images/logo.png" alt="MAN 2" className="h-12 w-12 object-contain" />
            </div>
            <div className="text-white">
              <p className="font-semibold text-lg">MAN 2 Kota Makassar</p>
              <p className="text-sm text-white/80">Madrasah Aliyah Negeri</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo-sirangkul.png" alt="SiRangkul" className="h-12 w-12" />
            <span className="font-bold text-xl text-gray-800">SiRangkul</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang!</h2>
            <p className="text-gray-500">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <X className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300 disabled:opacity-60 transition-all"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-cyan-600 transition-colors">
              <Home className="h-4 w-4" />
              Beranda
            </Link>
            <span className="text-gray-300">|</span>
            <a href="/user_guide/index.html" className="inline-flex items-center gap-1 text-gray-500 hover:text-cyan-600 transition-colors">
              <BookOpen className="h-4 w-4" />
              Panduan
            </a>
            <span className="text-gray-300">|</span>
            <a href="/rakm-viewer" className="text-gray-500 hover:text-cyan-600 transition-colors">
              Lihat RAKM
            </a>
            <span className="text-gray-300">|</span>
            <a href="https://wa.me/6283134086899" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-cyan-600 transition-colors">
              Hubungi Admin
            </a>
          </div>
        </div>
      </div>

      {/* Demo Toggle */}
      <button
        onClick={() => setShowDemoAccounts(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-gradient-to-b from-cyan-500 to-teal-600 text-white px-2.5 py-6 rounded-l-xl shadow-lg z-50 hover:px-3 transition-all"
      >
        <span className="text-xs font-bold tracking-wider" style={{ writingMode: 'vertical-rl' }}>DEMO</span>
      </button>

      {/* Demo Panel */}
      {showDemoAccounts && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowDemoAccounts(false)} />
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-slideUp">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="px-6 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Demo Accounts</h3>
                <p className="text-gray-400 text-sm">Password: <code className="bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded">password</code></p>
              </div>
              <button onClick={() => setShowDemoAccounts(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="px-4 pb-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {demoAccounts.map((acc, i) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={i}
                    onClick={() => selectDemoAccount(acc)}
                    className="p-4 bg-gray-50 hover:bg-white border border-gray-100 hover:border-cyan-200 rounded-2xl text-left group hover:shadow-lg transition-all"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${acc.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-700 group-hover:text-cyan-600">{acc.role}</p>
                    <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default LoginPage;
