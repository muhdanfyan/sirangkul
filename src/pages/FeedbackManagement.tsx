import React, { useState } from 'react';
import { MessageSquare, User, Calendar, CheckCircle, Clock, AlertCircle, Eye, Reply } from 'lucide-react';

interface Feedback {
  id: string;
  name: string;
  email: string;
  type: 'Keluhan' | 'Saran' | 'Kritik' | 'Pertanyaan';
  subject: string;
  message: string;
  status: 'Baru' | 'Diproses' | 'Selesai' | 'Ditutup';
  priority: 'Rendah' | 'Sedang' | 'Tinggi';
  submittedDate: string;
  assignedTo?: string;
  response?: string;
  responseDate?: string;
}

type User = { id: string, name: string, email: string}


const FeedbackManagement: React.FC = () => {
  const [feedbacks] = useState<Feedback[]>([
    {
      id: 'FB001',
      name: 'Hj. Siti Aminah',
      email: 'siti.aminah@gmail.com',
      type: 'Keluhan',
      subject: 'Keterlambatan Pembayaran Beasiswa',
      message: 'Saya ingin menanyakan mengenai keterlambatan pembayaran beasiswa anak saya yang sudah disetujui sejak bulan lalu.',
      status: 'Baru',
      priority: 'Tinggi',
      submittedDate: '2025-01-15',
    },
    {
      id: 'FB002',
      name: 'Bapak Ahmad Rahman',
      email: 'ahmad.rahman@yahoo.com',
      type: 'Saran',
      subject: 'Peningkatan Fasilitas Laboratorium',
      message: 'Saya menyarankan untuk meningkatkan fasilitas laboratorium IPA karena masih kurang memadai untuk praktikum siswa.',
      status: 'Diproses',
      priority: 'Sedang',
      submittedDate: '2025-01-14',
      assignedTo: 'Dr. H. Muhammad',
      response: 'Terima kasih atas sarannya. Kami akan memasukkan ini dalam perencanaan anggaran tahun depan.',
      responseDate: '2025-01-15'
    },
    {
      id: 'FB003',
      name: 'Ibu Fatimah',
      email: 'fatimah123@gmail.com',
      type: 'Kritik',
      subject: 'Kebersihan Lingkungan Madrasah',
      message: 'Kebersihan lingkungan madrasah masih kurang terjaga, terutama di area kantin dan toilet.',
      status: 'Selesai',
      priority: 'Sedang',
      submittedDate: '2025-01-12',
      assignedTo: 'Ahmad Fauzi',
      response: 'Kami telah mengambil tindakan dengan menambah jadwal kebersihan dan petugas cleaning service.',
      responseDate: '2025-01-13'
    },
    {
      id: 'FB004',
      name: 'H. Abdullah',
      email: 'abdullah.h@email.com',
      type: 'Pertanyaan',
      subject: 'Transparansi Penggunaan Dana BOS',
      message: 'Mohon penjelasan mengenai penggunaan dana BOS semester ini dan apakah ada laporan yang bisa diakses publik.',
      status: 'Diproses',
      priority: 'Tinggi',
      submittedDate: '2025-01-13',
      assignedTo: 'Fatimah S.Pd'
    }
  ]);

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const getStatusColor = (status: string) => {
    const colors = {
      'Baru': 'bg-blue-100 text-blue-800',
      'Diproses': 'bg-yellow-100 text-yellow-800',
      'Selesai': 'bg-green-100 text-green-800',
      'Ditutup': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'Tinggi': 'bg-red-100 text-red-800',
      'Sedang': 'bg-yellow-100 text-yellow-800',
      'Rendah': 'bg-gray-100 text-gray-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'Keluhan': 'bg-red-100 text-red-800',
      'Saran': 'bg-green-100 text-green-800',
      'Kritik': 'bg-orange-100 text-orange-800',
      'Pertanyaan': 'bg-blue-100 text-blue-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Baru':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'Diproses':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Selesai':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesStatus = statusFilter === '' || feedback.status === statusFilter;
    const matchesType = typeFilter === '' || feedback.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const handleResponse = () => {
    alert('Respons berhasil dikirim!');
    setShowResponseModal(false);
    setResponseText('');
    setSelectedFeedback(null);
  };

  const stats = {
    total: feedbacks.length,
    baru: feedbacks.filter(f => f.status === 'Baru').length,
    diproses: feedbacks.filter(f => f.status === 'Diproses').length,
    selesai: feedbacks.filter(f => f.status === 'Selesai').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Feedback</h1>
        <p className="text-gray-600 mt-1">Kelola keluhan, saran, dan kritik dari masyarakat</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Baru</p>
              <p className="text-3xl font-bold text-blue-600">{stats.baru}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Diproses</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.diproses}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selesai</p>
              <p className="text-3xl font-bold text-green-600">{stats.selesai}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="Baru">Baru</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditutup">Ditutup</option>
          </select>

          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Tipe</option>
            <option value="Keluhan">Keluhan</option>
            <option value="Saran">Saran</option>
            <option value="Kritik">Kritik</option>
            <option value="Pertanyaan">Pertanyaan</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{feedback.subject}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(feedback.type)}`}>
                        {feedback.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(feedback.priority)}`}>
                        {feedback.priority}
                      </span>
                      <div className="flex items-center">
                        {getStatusIcon(feedback.status)}
                        <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                          {feedback.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {feedback.name}
                    </div>
                    <div className="text-sm text-gray-600">{feedback.email}</div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {feedback.submittedDate}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{feedback.message}</p>

                  {feedback.assignedTo && (
                    <div className="text-sm text-blue-600 mb-2">
                      Ditangani oleh: {feedback.assignedTo}
                    </div>
                  )}

                  {feedback.response && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="text-sm font-medium text-green-900 mb-1">Respons:</div>
                      <div className="text-sm text-green-800">{feedback.response}</div>
                      <div className="text-xs text-green-600 mt-1">Direspons pada: {feedback.responseDate}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setSelectedFeedback(feedback)}
                  className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Detail
                </button>
                {feedback.status !== 'Selesai' && (
                  <button 
                    onClick={() => {
                      setSelectedFeedback(feedback);
                      setShowResponseModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Respons
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedFeedback && !showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detail Feedback</h2>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{selectedFeedback.subject}</h3>
                <div className="flex space-x-2 mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedFeedback.type)}`}>
                    {selectedFeedback.type}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedFeedback.priority)}`}>
                    {selectedFeedback.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nama:</span>
                  <div className="font-medium">{selectedFeedback.name}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <div className="font-medium">{selectedFeedback.email}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Tanggal:</span>
                  <div className="font-medium">{selectedFeedback.submittedDate}</div>
                </div>
                {selectedFeedback.assignedTo && (
                  <div>
                    <span className="text-sm text-gray-600">Penanggungjawab:</span>
                    <div className="font-medium">{selectedFeedback.assignedTo}</div>
                  </div>
                )}
              </div>

              <div>
                <span className="text-sm text-gray-600">Pesan:</span>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedFeedback.message}</div>
              </div>

              {selectedFeedback.response && (
                <div>
                  <span className="text-sm text-gray-600">Respons:</span>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                    {selectedFeedback.response}
                    <div className="text-xs text-gray-500 mt-2">
                      Direspons pada: {selectedFeedback.responseDate}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Beri Respons</h2>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Feedback: {selectedFeedback.subject}</p>
              <p className="text-gray-600">Dari: {selectedFeedback.name}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Respons Anda
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tulis respons Anda..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleResponse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kirim Respons
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;