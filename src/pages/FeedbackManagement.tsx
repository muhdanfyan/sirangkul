import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { MessageSquare, User, CheckCircle, Clock, AlertCircle, Eye, Reply } from 'lucide-react';


interface Feedback {
  id: string;
  user_id: string;
  proposal_id: string;
  message: string;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
}

type User = { id: string, name: string, email: string}


const FeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  // const [users, proposals] = getDetail();

  // console.log(users, proposals)

  const getStatusColor = (status: string) => {
    const colors = {
      'Baru': 'bg-blue-100 text-blue-800',
      'Diproses': 'bg-yellow-100 text-yellow-800',
      'Selesai': 'bg-green-100 text-green-800',
      'Ditutup': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await apiService.getFeedback();
        console.log(response)
        setFeedbacks(response);
      } catch (error) {
        console.error('Gagal mengambil feedback:', error);
      }
    };
    fetchFeedbacks();
  }, []);

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
                      <h4 className="text-lg font-medium text-gray-900">{feedback.message}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {getStatusIcon('Baru')}
                        <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('Baru')}`}>
                          Baru
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {feedback.user_id}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{feedback.message}</p>

                  <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => setSelectedFeedback(feedback)}
                      className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detail
                    </button>
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
                  </div>
                </div>
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
                <h3 className="font-semibold text-gray-900 mb-2">{selectedFeedback.message}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">User ID:</span>
                  <div className="font-medium">{selectedFeedback.user_id}</div>
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-600">Pesan:</span>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedFeedback.message}</div>
              </div>
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
              <p className="text-gray-600 mb-2">Feedback: {selectedFeedback.message}</p>
              <p className="text-gray-600">Dari: {selectedFeedback.user_id}</p>
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