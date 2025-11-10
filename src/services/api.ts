import { User } from "../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface Proposal {
  id: string;
  rkam_id: string;
  user_id: string;
  title: string;
  description?: string;
  jumlah_pengajuan: string | number;
  status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'final_approved' | 'payment_processing' | 'completed';
  
  // Timestamps
  submitted_at?: string | null;
  verified_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  final_approved_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Approver IDs
  verified_by?: string | null;
  approved_by?: string | null;
  rejected_by?: string | null;
  final_approved_by?: string | null;
  rejection_reason?: string | null;
  
  // Committee flag
  requires_committee_approval?: boolean;
  
  // Relations
  user?: {
    id: string;
    name?: string;
    full_name?: string;
    email: string;
    role?: string;
  };
  rkam?: RKAM;
  verifier?: {
    id: string;
    full_name?: string;
    role?: string;
  };
  approver?: {
    id: string;
    full_name?: string;
    role?: string;
  };
  rejector?: {
    id: string;
    full_name?: string;
    role?: string;
  };
  final_approver?: {
    id: string;
    full_name?: string;
    role?: string;
  };
  rejected_by_user?: {  // NEW: User who rejected
    id: string;
    full_name?: string;
    role?: string;
  };
  payment?: Payment;  // NEW: Payment relationship
  current_workflow?: {
    stage: string;
    status: string;
    approver_role: string;
  };
}

export interface ProposalCreateRequest {
  rkam_id: string;
  title: string;
  description?: string;
  jumlah_pengajuan: number;
}

export interface ProposalUpdateRequest {
  rkam_id?: string;
  title?: string;
  description?: string;
  jumlah_pengajuan?: number;
}

export interface Payment {
  id: string;
  proposal_id: string;
  amount: string | number;
  recipient_name: string;
  recipient_account: string;
  bank_name?: string;
  payment_method: 'transfer' | 'cash' | 'check';
  payment_reference?: string;
  payment_proof_url?: string;
  payment_proof_file?: string;  // NEW: File path for uploaded proof
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes?: string;
  admin_notes?: string;
  processed_at?: string | null;
  completed_at?: string | null;
  processed_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  proposal?: Proposal;
  processedByUser?: {
    id: string;
    full_name?: string;
  };
}

export interface PaymentProcessRequest {
  recipient_name: string;
  recipient_account: string;
  bank_name?: string;
  payment_method: 'transfer' | 'cash' | 'check';
  payment_reference?: string;
  notes?: string;
}

export interface PaymentCompleteRequest {
  payment_proof_url?: string;
  admin_notes?: string;
}

export interface ProposalStats {
  total: number;
  draft: number;
  submitted: number;
  verified: number;
  approved: number;
  rejected: number;
  final_approved: number;
  payment_processing: number;
  completed: number;
  total_amount_completed: number;
}

export interface Laporan {
  id: string;
  // no api endpoint
}

export interface Feedback {
  id: string;
  user_id: string;
  proposal_id: string;
  message: string;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface RKAM {
  id: string;
  kategori: string;
  item_name: string;
  pagu: string | number;
  tahun_anggaran: number;
  deskripsi: string | null;
  terpakai: string | number;
  sisa: string | number;
  persentase: number;
  status: 'Normal' | 'Warning' | 'Critical';
  created_at?: string;
  updated_at?: string;
}

export interface RKAMCreateRequest {
  kategori: string;
  item_name: string;
  pagu: number;
  tahun_anggaran: number;
  deskripsi?: string;
}

export interface RKAMUpdateRequest {
  kategori?: string;
  item_name?: string;
  pagu?: number;
  tahun_anggaran?: number;
  deskripsi?: string;
}

export interface ApiError {
  message: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('sirangkul_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'GET',
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` }),
      },
    });
  }

  async addUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` }),
        
      },
    });
  }

  async updateUser(userId: string, userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` }),
      },
    });
  }

  async delUser(userId: string): Promise<void> {
    return this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` }),
      },
    });
  }

  async getProposals(): Promise<Proposal[]> {
    return this.request<Proposal[]>('/proposals', {
  // Payment API Methods
  async getAllPayments(params?: { status?: string; payment_method?: string }): Promise<Payment[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/payments?${queryString}` : '/payments';
    
    const response = await this.request<{ success: boolean; message: string; data: Payment[] }>(endpoint, {
      method: 'GET',
    });
    
    return response.data;
  }

  async getPendingPayments(): Promise<Proposal[]> {
    const response = await this.request<{ success: boolean; message: string; data: Proposal[] }>('/payments/pending', {
      method: 'GET',
    });
    
    return response.data;
  }

  async getPaymentById(paymentId: string): Promise<Payment> {
    const response = await this.request<{ success: boolean; message: string; data: Payment }>(`/payments/${paymentId}`, {
      method: 'GET',
    });
    
    return response.data;
  }

  async processPayment(proposalId: string, data: PaymentProcessRequest): Promise<{
    success: boolean;
    message: string;
    data: {
      payment_id: string;
      proposal_id: string;
      status: string;
      amount: string;
      processed_at: string;
    };
  }> {
    return this.request(`/payments/${proposalId}/process`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completePayment(paymentId: string, data: PaymentCompleteRequest): Promise<{
    success: boolean;
    message: string;
    data: {
      payment_id: string;
      payment_status: string;
      proposal_id: string;
      proposal_status: string;
      rkam_update: {
        rkam_id: string;
        old_terpakai: number;
        new_terpakai: number;
        new_sisa: number;
      };
    };
  }> {
    return this.request(`/payments/${paymentId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    data: {
      payment_id: string;
      payment_status: string;
      proposal_id: string;
      proposal_status: string;
    };
  }> {
    return this.request(`/payments/${paymentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getLaporan(): Promise<Laporan[]> {
    return this.request<Laporan[]>('/laporan', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` })
      }
    });
  }

  async getFeedback(): Promise<Feedback[]> {
    return this.request<Feedback[]>('/feedback', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` })
      }
    });
  }
  
  // Add other API methods here as needed
  // async getProposals() { ... }
  // async createProposal() { ... }

  // RKAM API Methods
  async getAllRKAM(params?: { kategori?: string; tahun_anggaran?: number; search?: string }): Promise<RKAM[]> {
    const queryParams = new URLSearchParams();
    if (params?.kategori) queryParams.append('kategori', params.kategori);
    if (params?.tahun_anggaran) queryParams.append('tahun_anggaran', params.tahun_anggaran.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/rkam?${queryString}` : '/rkam';
    
    const response = await this.request<{ success: boolean; message: string; data: RKAM[] }>(endpoint, {
      method: 'GET',
    });
    
    return response.data;
  }

  async getRKAMById(rkamId: string): Promise<RKAM> {
    const response = await this.request<{ success: boolean; message: string; data: RKAM }>(`/rkam/${rkamId}`, {
      method: 'GET',
    });
    
    return response.data;
  }

  async createRKAM(data: RKAMCreateRequest): Promise<RKAM> {
    const response = await this.request<{ success: boolean; message: string; data: RKAM }>('/rkam', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  async updateRKAM(rkamId: string, data: RKAMUpdateRequest): Promise<RKAM> {
    const response = await this.request<{ success: boolean; message: string; data: RKAM }>(`/rkam/${rkamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  async deleteRKAM(rkamId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/rkam/${rkamId}`, {
      method: 'DELETE',
    });
  }

  async getRKAMProposals(rkamId: string): Promise<{ rkam: RKAM; proposals: Proposal[] }> {
    const response = await this.request<{ success: boolean; message: string; data: { rkam: RKAM; proposals: Proposal[] } }>(`/rkam/${rkamId}/proposals`, {
      method: 'GET',
    });
    
    return response.data;
  }

  // Proposal API Methods
  async getAllProposals(params?: { status?: string; rkam_id?: string }): Promise<Proposal[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.rkam_id) queryParams.append('rkam_id', params.rkam_id);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/proposals?${queryString}` : '/proposals';
    
    const response = await this.request<{ success: boolean; message: string; data: Proposal[] }>(endpoint, {
      method: 'GET',
    });
    
    return response.data;
  }

  async getProposalById(proposalId: string): Promise<Proposal> {
    const response = await this.request<{ success: boolean; message: string; data: Proposal }>(`/proposals/${proposalId}`, {
      method: 'GET',
    });
    
    return response.data;
  }

  async createProposal(data: ProposalCreateRequest): Promise<Proposal> {
    const response = await this.request<{ success: boolean; message: string; data: Proposal }>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  async updateProposal(proposalId: string, data: ProposalUpdateRequest): Promise<Proposal> {
    const response = await this.request<{ success: boolean; message: string; data: Proposal }>(`/proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  async deleteProposal(proposalId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/proposals/${proposalId}`, {
      method: 'DELETE',
    });
  }

  // Proposal Approval Actions
  async submitProposal(proposalId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      status: string;
      submitted_at: string;
      next_approver: string;
    };
  }> {
    return this.request(`/proposals/${proposalId}/submit`, {
      method: 'POST',
    });
  }

  async verifyProposal(proposalId: string, data?: Record<string, never>): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      status: string;
      verified_at: string;
      verified_by: string;
      next_approver: string;
    };
  }> {
    return this.request(`/proposals/${proposalId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async approveProposal(proposalId: string, data?: Record<string, never>): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      status: string;
      approved_at: string;
      approved_by?: string;
      final_approved_at?: string;
      final_approved_by?: string;
      requires_committee_approval?: boolean;
      next_approver?: string;
      next_step?: string;
    };
  }> {
    return this.request(`/proposals/${proposalId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async finalApproveProposal(proposalId: string, data?: Record<string, never>): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      status: string;
      final_approved_at: string;
      final_approved_by: string;
      next_step?: string;
    };
  }> {
    return this.request(`/proposals/${proposalId}/final-approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async rejectProposal(proposalId: string, rejection_reason: string): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      status: string;
      rejected_at: string;
      rejected_by: string;
      rejection_reason: string;
      status_badge: string;
      status_label: string;
    };
  }> {
    return this.request(`/proposals/${proposalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    });
  }

  // NEW: Complete payment with file upload
  async completePaymentWithFile(paymentId: string, formData: FormData): Promise<{
    success: boolean;
    message: string;
    data: {
      payment_id: string;
      payment_status: string;
      proposal_id: string;
      proposal_status: string;
      rkam_update: {
        rkam_id: string;
        old_terpakai: number;
        new_terpakai: number;
        new_sisa: number;
      };
    };
  }> {
    const url = `${this.baseURL}/payments/${paymentId}/complete`;
    const token = localStorage.getItem('sirangkul_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // NEW: Get my proposals (for Pengusul)
  async getMyProposals(): Promise<Proposal[]> {
    const response = await this.request<{ success: boolean; message: string; data: Proposal[] }>('/proposals/my-proposals', {
      method: 'GET',
    });
    
    return response.data;
  }

  // NEW: Get proposal statistics (for Pengusul)
  async getProposalStatistics(): Promise<ProposalStats> {
    const response = await this.request<{ success: boolean; message: string; data: ProposalStats }>('/proposals/statistics', {
      method: 'GET',
    });
    
    return response.data;
  }

  // NEW: Download payment proof
  async downloadPaymentProof(paymentId: string): Promise<Blob> {
    const url = `${this.baseURL}/payments/${paymentId}/download-proof`;
    const token = localStorage.getItem('sirangkul_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  // NEW: Get my payments (for Pengusul)
  async getMyPayments(): Promise<Payment[]> {
    const response = await this.request<{ success: boolean; message: string; data: Payment[] }>('/payments/my-payments', {
      method: 'GET',
    });
    
    return response.data;
  }

}

  

export const apiService = new ApiService();
