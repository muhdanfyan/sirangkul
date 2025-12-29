import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, MessageSquare, Clock, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Proposal {
  id: string;
  title: string;
  submitter: string;
  amount: string;
  submittedDate: string;
  category: string;
  urgency: string;
  description: string;
  documents: string[];
}

const ApprovalWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [proposals] = useState<Proposal[]>([
    {
      id: 'PR001',
      title: 'Renovasi Ruang Kelas 7A',
      submitter: 'Ahmad Fauzi',
      amount: 'Rp 15.000.000',
      submittedDate: '2025-01-15',
      category: 'Infrastruktur',
      urgency: 'Tinggi',
      description: 'Renovasi ruang kelas 7A meliputi pengecatan ulang, perbaikan jendela, dan penggantian lantai yang rusak.',
      documents: ['RAB_Renovasi_7A.pdf', 'TOR_Renovasi.docx']
    },
    {
      id: 'PR006',
      title: 'Pengadaan Proyektor untuk Lab',
      submitter: 'Siti Nurhaliza',
      amount: 'Rp 8.500.000',
      submittedDate: '2025-01-14',
      category: 'Teknologi',
      urgency: 'Normal',
      description: 'Pengadaan 2 unit proyektor untuk laboratorium komputer guna mendukung pembelajaran digital.',
      documents: ['RAB_Proyektor.pdf', 'Spesifikasi_Teknis.docx']
    },
    {
      id: 'PR007',
      title: 'Program Pelatihan Guru',
      submitter: 'Muhammad Ali',
      amount: 'Rp 12.000.000',
      submittedDate: '2025-01-13',
      category: 'Pendidikan',
      urgency: 'Normal',
      description: 'Program pelatihan guru dalam penggunaan teknologi digital untuk pembelajaran.',
      documents: ['Proposal_Pelatihan.pdf', 'Daftar_Peserta.xlsx']
    }
  ]);

  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Mendesak':
        return 'bg-red-100 text-red-800';
      case 'Tinggi':
        return 'bg-orange-100 text-orange-800';
      case 'Normal':
        return 'bg-blue-100 text-blue-800';
      case 'Rendah':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReview = (proposal: Proposal, action: 'approve' | 'reject') => {
    setSelectedProposal(proposal);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const submitReview = () => {
    if (reviewAction === 'approve') {
      alert(`Proposal ${selectedProposal?.id} disetujui!`);
    } else {
      alert(`Proposal ${selectedProposal?.id} ditolak!`);
    }
    setShowReviewModal(false);
    setReviewNotes('');
    setSelectedProposal(null);
    setReviewAction(null);
  };

  const canReview = () => {
    const reviewerRoles = ['Verifikator', 'Kepala Madrasah', 'Komite Madrasah'];
    return reviewerRoles.includes(user?.role || '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Persetujuan</h1>
        <p className="text-gray-600 mt-1">Review dan setujui proposal yang masuk - {user?.role}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-600">Menunggu Review</div>
              <div className="text-xl font-bold text-gray-900">3</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-600">Disetujui</div>
              <div className="text-xl font-bold text-gray-900">12</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-red-500 p-2 rounded-lg">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-600">Ditolak</div>
              <div className="text-xl font-bold text-gray-900">2</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-500 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-600">Total Review</div>
              <div className="text-xl font-bold text-gray-900">17</div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposals for Review */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Proposal Menunggu Review</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{proposal.title}</h4>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(proposal.urgency)}`}>
                        {proposal.urgency}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {proposal.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Pengusul:</span>
                      <div className="font-medium">{proposal.submitter}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Anggaran:</span>
                      <div className="font-medium text-blue-600">{proposal.amount}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Tanggal Pengajuan:</span>
                      <div className="font-medium">{proposal.submittedDate}</div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{proposal.description}</p>

                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Dokumen:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {proposal.documents.map((doc, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          <FileText className="h-3 w-3 mr-1" />
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {canReview() && (
                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setSelectedProposal(proposal)}
                    className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </button>
                  <button 
                    onClick={() => handleReview(proposal, 'reject')}
                    className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </button>
                  <button 
                    onClick={() => handleReview(proposal, 'approve')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProposal && !showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detail Proposal</h2>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{selectedProposal.title}</h3>
                <p className="text-gray-600">{selectedProposal.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">ID Proposal:</span>
                  <div className="font-medium">{selectedProposal.id}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Pengusul:</span>
                  <div className="font-medium">{selectedProposal.submitter}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Anggaran:</span>
                  <div className="font-medium">{selectedProposal.amount}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Kategori:</span>
                  <div className="font-medium">{selectedProposal.category}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Setujui Proposal' : 'Tolak Proposal'}
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Proposal: {selectedProposal.title}</p>
              <p className="text-gray-600">Anggaran: {selectedProposal.amount}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan {reviewAction === 'approve' ? 'Persetujuan' : 'Penolakan'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={reviewAction === 'approve' ? 'Berikan catatan persetujuan...' : 'Berikan alasan penolakan...'}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={submitReview}
                className={`px-4 py-2 rounded-lg ${
                  reviewAction === 'approve' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {reviewAction === 'approve' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;