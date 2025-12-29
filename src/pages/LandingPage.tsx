import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, FileText, Shield, BarChart3, Clock, Eye, BookOpen, Download } from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Manajemen Proposal',
      description: 'Kelola pengajuan proposal anggaran secara digital dengan alur yang terstruktur dan mudah dipantau.'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Multi-Role Access',
      description: 'Sistem berbasis peran untuk Pengusul, Verifikator, Kepala Madrasah, Bendahara, dan Komite.'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Approval Workflow',
      description: 'Alur persetujuan berjenjang dengan validasi otomatis berdasarkan threshold anggaran.'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Dashboard Analitik',
      description: 'Visualisasi data anggaran dan realisasi secara real-time untuk pengambilan keputusan.'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Tracking Real-time',
      description: 'Pantau status proposal dari pengajuan hingga pencairan dana dengan notifikasi otomatis.'
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: 'Transparansi RKAM',
      description: 'Akses publik untuk melihat data anggaran RKAM demi transparansi dan akuntabilitas.'
    }
  ];

  const roles = [
    { name: 'Administrator', desc: 'Mengelola sistem dan pengguna' },
    { name: 'Pengusul', desc: 'Mengajukan proposal kegiatan' },
    { name: 'Verifikator', desc: 'Memverifikasi kelengkapan proposal' },
    { name: 'Kepala Madrasah', desc: 'Menyetujui proposal' },
    { name: 'Bendahara', desc: 'Memproses pencairan dana' },
    { name: 'Komite Madrasah', desc: 'Persetujuan akhir proposal besar' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo-sirangkul.png" alt="SiRangkul" className="h-10 w-10" />
              <span className="font-bold text-xl text-gray-800">SiRangkul</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-cyan-600 transition-colors">Fitur</a>
              <a href="#roles" className="text-gray-600 hover:text-cyan-600 transition-colors">Peran</a>
              <a href="#guide" className="text-gray-600 hover:text-cyan-600 transition-colors">Panduan</a>
              <a href="/rakm-viewer" className="text-gray-600 hover:text-cyan-600 transition-colors">RKAM</a>
            </nav>
            <Link 
              to="/login"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-cyan-200 transition-all"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Banner */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Banner Background Slideshow */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/90 via-teal-900/85 to-cyan-900/90 z-10"></div>
          <img 
            src="https://man2kotamakassar.sch.id/images/banner3.jpg" 
            alt="MAN 2 Banner" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Kelola Anggaran<br/>Madrasah dengan<br/>Mudah & Transparan
              </h1>
              <p className="text-xl text-white/90 mb-8">
                SiRangkul adalah platform digital terintegrasi untuk pengelolaan RKAM dan proses pengajuan usulan yang efisien, transparan, dan akuntabel.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/login"
                  className="inline-flex items-center gap-2 bg-white text-cyan-600 px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all"
                >
                  Mulai Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a 
                  href="/rakm-viewer"
                  className="inline-flex items-center gap-2 bg-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-all"
                >
                  Lihat RKAM Publik
                </a>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <img src="/logo-sirangkul.png" alt="SiRangkul" className="h-48 w-48 mx-auto mb-6" />
                <div className="flex justify-center">
                  <img src="https://man2kotamakassar.sch.id/images/logo.png" alt="MAN 2" className="h-20 w-20" />
                </div>
                <p className="text-center text-gray-600 mt-4 font-medium">MAN 2 Kota Makassar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Apa itu SiRangkul?</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              <strong>SiRangkul</strong> (Sistem Informasi Rencana Anggaran dan Kelola Usulan) adalah aplikasi berbasis web yang dirancang untuk memfasilitasi pengelolaan rencana anggaran dan proses pengajuan usulan di lingkungan madrasah. Sistem ini mendigitalisasi seluruh alur kerja dari <strong>perencanaan, pengajuan, verifikasi, persetujuan, hingga pelaporan</strong> anggaran dan usulan kegiatan.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Fitur Unggulan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Fitur-fitur kunci yang saling terhubung untuk mendigitalisasi seluruh alur kerja pengelolaan anggaran madrasah.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Manfaat Utama</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Efisiensi', desc: 'Mempercepat proses dari pengajuan hingga persetujuan proposal' },
              { title: 'Transparansi', desc: 'Pantau status proposal secara real-time melalui dashboard' },
              { title: 'Akuntabilitas', desc: 'Audit trail digital untuk setiap tahapan persetujuan' },
              { title: 'Kemudahan', desc: 'Akses data dan laporan kapan saja, di mana saja' },
            ].map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <CheckCircle className="h-10 w-10 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Peran dalam Sistem</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">SiRangkul mendukung berbagai peran dengan akses dan tanggung jawab masing-masing.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <div key={index} className="flex items-center gap-4 bg-gray-50 p-5 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {role.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{role.name}</h4>
                  <p className="text-sm text-gray-500">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why MAN 2 Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Mengapa MAN 2 Kota Makassar Membutuhkan SiRangkul?
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Proses pengelolaan anggaran dan usulan kegiatan di MAN 2 Kota Makassar saat ini masih mengandalkan 
                metode semi-manual yang menyebabkan berbagai tantangan. SiRangkul hadir sebagai solusi digital 
                yang dirancang khusus untuk menjawab kebutuhan tersebut.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Masalah Sebelumnya</h4>
                    <p className="text-gray-600 text-sm">
                      Keterlambatan alur persetujuan, kesulitan pelacakan status usulan, dan kurangnya transparansi dalam penggunaan dana.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Solusi SiRangkul</h4>
                    <p className="text-gray-600 text-sm">
                      Platform digital terintegrasi yang mengedepankan efisiensi, transparansi, dan akuntabilitas dalam pengelolaan RKAM.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Keunggulan untuk MAN 2</h3>
              <div className="space-y-4">
                {[
                  { icon: '⏱️', title: 'Proses Lebih Cepat', desc: 'Pengajuan dan persetujuan proposal tidak lagi berhari-hari, cukup dalam hitungan jam.' },
                  { icon: '📊', title: 'Data Real-time', desc: 'Kepala Madrasah dapat memantau sisa pagu dan realisasi anggaran kapan saja.' },
                  { icon: '📝', title: 'Audit Trail Lengkap', desc: 'Setiap tindakan tercatat digital untuk memudahkan proses audit internal maupun eksternal.' },
                  { icon: '🔓', title: 'Transparansi Publik', desc: 'Masyarakat dapat melihat data RKAM melalui akses publik, meningkatkan kepercayaan stakeholder.' },
                  { icon: '📱', title: 'Akses Fleksibel', desc: 'Dapat diakses dari mana saja melalui browser, tanpa perlu instalasi aplikasi khusus.' },
                  { icon: '🔔', title: 'Notifikasi Otomatis', desc: 'Pengingat otomatis untuk proposal yang pending dan memerlukan tindakan segera.' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section id="guide" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Panduan & Dokumentasi</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Pelajari cara menggunakan SiRangkul melalui panduan lengkap kami.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="/user_guide/index.html" className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group border border-gray-100">
              <BookOpen className="h-12 w-12 text-cyan-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Panduan Pengguna</h3>
              <p className="text-gray-600 mb-4">Panduan lengkap penggunaan SiRangkul untuk semua peran.</p>
              <span className="text-cyan-600 font-medium inline-flex items-center gap-1">
                Buka Panduan <ArrowRight className="h-4 w-4" />
              </span>
            </a>
            <a href="/user_guide/panduan.html" className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group border border-gray-100">
              <FileText className="h-12 w-12 text-teal-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Panduan per Role</h3>
              <p className="text-gray-600 mb-4">Panduan spesifik untuk setiap peran dalam sistem.</p>
              <span className="text-teal-600 font-medium inline-flex items-center gap-1">
                Buka Panduan <ArrowRight className="h-4 w-4" />
              </span>
            </a>
            <a href="/user_guide/panduan-pdf.html" className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group border border-gray-100">
              <Download className="h-12 w-12 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Panduan PDF</h3>
              <p className="text-gray-600 mb-4">Download panduan dalam format PDF untuk referensi offline.</p>
              <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                Download PDF <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Siap Memulai?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Masuk ke sistem untuk mulai mengelola anggaran dan proposal madrasah Anda.
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-10 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all text-lg"
          >
            Masuk ke Sistem
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo-sirangkul.png" alt="SiRangkul" className="h-10 w-10" />
                <span className="font-bold text-xl">SiRangkul</span>
              </div>
              <p className="text-gray-400">Sistem Informasi Rencana Anggaran dan Kelola Usulan untuk MAN 2 Kota Makassar.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Link Cepat</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
                <li><a href="/rakm-viewer" className="hover:text-white">RKAM Publik</a></li>
                <li><a href="/user_guide/index.html" className="hover:text-white">Panduan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400">
                <li>MAN 2 Kota Makassar</li>
                <li>
                  <a href="https://wa.me/6283134086899" className="hover:text-white">WhatsApp Admin</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © 2024 SiRangkul. Dikembangkan untuk MAN 2 Kota Makassar.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
