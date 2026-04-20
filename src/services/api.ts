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
    email: string;
    role: string;
    status?: string;
    is_active?: boolean;
    bidang_id?: string | null;
    bidang?: Bidang | null;
  };
}

export interface Proposal {
  id: string;
  rkam_id: string;
  user_id: string;
  bidang_id?: string | null;
  bidang?: string | null;
  title: string;
  description?: string;
  jumlah_pengajuan: string | number;
  status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'final_approved' | 'payment_processing' | 'completed';
  urgency?: 'Rendah' | 'Normal' | 'Tinggi' | 'Mendesak';
  start_date?: string | null;
  end_date?: string | null;

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
  improvement_suggestions?: string | null;  // NEW: Improvements suggestions when rejected
  rejected_by_role?: string | null;  // NEW: Role of rejector

  // Committee flag
  requires_committee_approval?: boolean;

  // Relations
  user?: {
    id: string;
    name?: string;
    full_name?: string;
    email: string;
    role?: string;
    bidang_id?: string | null;
    bidang?: Bidang | null;
  };
  rkam?: RKAM;
  bidangRef?: Bidang | null;
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
  attachments?: ProposalAttachment[];  // Uploaded supporting documents
  payment?: Payment;  // NEW: Payment relationship
  approvals?: ApprovalWorkflowEntry[];
  current_workflow?: {
    stage: string;
    status: string;
    approver_role: string;
  };
}

export interface ApprovalWorkflowEntry {
  id: string;
  proposal_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  approver?: {
    id: string;
    full_name?: string;
    role?: string;
  };
}

export interface ProposalCreateRequest {
  rkam_id: string;
  title: string;
  description?: string;
  jumlah_pengajuan: number;
  urgency?: 'Rendah' | 'Normal' | 'Tinggi' | 'Mendesak';
  start_date?: string;
  end_date?: string;
}

export interface ProposalUpdateRequest {
  rkam_id?: string;
  title?: string;
  description?: string;
  jumlah_pengajuan?: number;
  urgency?: 'Rendah' | 'Normal' | 'Tinggi' | 'Mendesak';
  start_date?: string;
  end_date?: string;
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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  notes?: string;
  admin_notes?: string;
  rejection_reason?: string | null;
  improvement_suggestions?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejected_by_role?: string | null;
  processed_at?: string | null;
  completed_at?: string | null;
  processed_by?: string | null;
  created_at: string;
  updated_at: string;

  payment?: Payment;
  proposal?: Proposal;
  processedByUser?: {
    id: string;
    full_name?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Bidang extends Category {}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
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

export interface ApprovalActionRequest {
  notes?: string;
}

export interface ProposalRejectRequest {
  rejection_reason: string;
  improvement_suggestions: string;
}

export interface PaymentRejectRequest {
  rejection_reason: string;
  improvement_suggestions: string;
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

export interface DashboardSummary {
  totalProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  pendingProposals: number;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  bidangBreakdown?: Array<{
    name: string;
    total_budget: number;
    used_budget: number;
    remaining_budget: number;
    total_proposals: number;
  }>;
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
  category_id?: string | null;
  bidang_id?: string | null;
  kategori: string; // for compatibility
  bidang?: string | null;
  item_name: string;
  pagu: number;
  volume: number | string;
  satuan: string;
  unit_price: number;
  dana_bos: number;
  dana_komite: number;
  tahun_anggaran: number;
  deskripsi: string | null;
  description?: string | null;
  terpakai: number;
  sisa: number;
  persentase: number;
  status: 'Normal' | 'Warning' | 'Critical';
  
  // Scoped computed fields (if timeframe filter active)
  terpakai_filtered?: number;
  sisa_filtered?: number;
  persentase_filtered?: number;
  
  created_at?: string;
  updated_at?: string;
  category?: Category | null;
  bidangRef?: Bidang | null;
}

export interface RKAMCreateRequest {
  category_id?: string;
  bidang_id?: string;
  item_name: string;
  volume: number;
  satuan: string;
  unit_price: number;
  dana_bos?: number;
  dana_komite?: number;
  tahun_anggaran: number;
  deskripsi?: string;
}

export interface RKAMUpdateRequest extends Partial<RKAMCreateRequest> {}

export interface ApiError {
  message: string;
}

export interface ProposalAttachment {
  id: string;
  proposal_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  attachment_type?: 'proposal' | 'lpj' | null;
  created_at: string;
}

export interface ProposalAttachmentUpload {
  file: File;
  attachmentType: 'proposal' | 'lpj';
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

    const controller = new AbortController();
    const timeout = 15000; // 15 seconds
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    const config: RequestInit = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            const error = new Error(errorData.message || `HTTP error! status: ${response.status}`) as any;
            error.response = { data: errorData }; // Mock axios structure for easier transition
            throw error;
          } catch (jsonError) {
            if (jsonError instanceof Error && (jsonError as any).response) throw jsonError;
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          // Non-JSON response (likely HTML error page)
          const textError = await response.text();
          if (import.meta.env.DEV) {
            console.error('Server returned non-JSON error:', textError.substring(0, 200));
          }
          throw new Error(`Server error (${response.status}): Terjadi kesalahan pada server. Silakan periksa backend API.`);
        }
      }

      const successContentType = response.headers.get('content-type');
      if (!successContentType || !successContentType.includes('application/json')) {
        const rawText = await response.text();
        if (import.meta.env.DEV) {
          console.error('Expected JSON response but got:', rawText.substring(0, 200));
        }
        throw new Error('Server mengembalikan respons tidak valid. Pastikan backend Laravel sudah berjalan dan konfigurasi API benar.');
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: Server tidak merespons dalam 30 detik. Silakan coba lagi.');
      }

      if (import.meta.env.DEV) {
        console.error('API request failed:', error);
      }
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

  async getUsers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    bidang_id?: string;
    sort_by?: string;
    order?: string;
    no_paginate?: boolean;
  }): Promise<PaginatedResponse<User> | User[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';

    const response = await this.request<{ success: boolean; data: PaginatedResponse<User> | User[] }>(endpoint, {
      method: 'GET',
    });

    return response.data;
  }

  async addUser(userData: any): Promise<User> {
    const response = await this.request<{ success: boolean; data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updateUser(userId: string, userData: any): Promise<User> {
    const response = await this.request<{ success: boolean; data: User }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async delUser(userId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

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

  async processPaymentWithFile(
    proposalId: string,
    data: PaymentProcessRequest,
    proofFile: File
  ): Promise<{
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
    const url = `${this.baseURL}/payments/${proposalId}/process`;
    const token = localStorage.getItem('sirangkul_token');
    const formData = new FormData();
    const compressed = await this.compressFile(proofFile);

    formData.append('recipient_name', data.recipient_name);
    formData.append('recipient_account', data.recipient_account);
    formData.append('payment_method', data.payment_method);

    if (data.bank_name) {
      formData.append('bank_name', data.bank_name);
    }

    if (data.payment_reference) {
      formData.append('payment_reference', data.payment_reference);
    }

    if (data.notes) {
      formData.append('notes', data.notes);
    }

    formData.append('payment_proof_file', compressed, proofFile.name + '.gz');
    formData.append('proof_original_name', proofFile.name);
    formData.append('proof_original_size', String(proofFile.size));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorData = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : {};

      throw new Error((errorData as ApiError).message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
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
  async getAllRKAM(params?: { 
    category_id?: string; 
    bidang_id?: string;
    bidang?: string;
    kategori?: string;
    tahun_anggaran?: number; 
    search?: string;
    page?: number;
    per_page?: number;
    start_date?: string;
    end_date?: string;
    preset?: string;
    sort_by?: string;
    order?: string;
    no_paginate?: boolean;
  }): Promise<PaginatedResponse<RKAM> | RKAM[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/rkam?${queryString}` : '/rkam';

    const response = await this.request<
      { success: boolean; message?: string; data: PaginatedResponse<RKAM> | RKAM[] }
      | PaginatedResponse<RKAM>
      | RKAM[]
    >(endpoint, {
      method: 'GET',
    });

    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as PaginatedResponse<RKAM> | RKAM[];
    }

    return response as PaginatedResponse<RKAM>;
  }

  async getRKAMOptions(): Promise<{ categories: Category[]; bidangs: Bidang[]; units: string[] }> {
    const response = await this.request<
      { success?: boolean; data?: { categories?: Category[]; bidangs?: Bidang[]; units?: string[] }; categories?: Category[]; bidangs?: Bidang[]; units?: string[] }
      | { categories?: Category[]; bidangs?: Bidang[]; units?: string[] }
    >('/rkam/options', {
      method: 'GET',
    });

    if (response && typeof response === 'object' && 'data' in response && response.data) {
      const bidangs = Array.isArray(response.data.bidangs)
        ? response.data.bidangs
        : Array.isArray(response.data.categories)
          ? response.data.categories
          : [];

      return {
        categories: bidangs,
        bidangs,
        units: Array.isArray(response.data.units) ? response.data.units : [],
      };
    }

    const bidangs = Array.isArray(response.bidangs)
      ? response.bidangs
      : Array.isArray(response.categories)
        ? response.categories
        : [];

    return {
      categories: bidangs,
      bidangs,
      units: Array.isArray(response.units) ? response.units : [],
    };
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

  // Category API Methods
  async getAllBidangs(): Promise<Bidang[]> {
    const response = await this.request<{ success: boolean; data: Bidang[] }>('/bidangs', {
      method: 'GET',
    });
    return response.data;
  }

  async createBidang(data: Partial<Bidang>): Promise<Bidang> {
    const response = await this.request<{ success: boolean; data: Bidang }>('/bidangs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateBidang(id: string, data: Partial<Bidang>): Promise<Bidang> {
    const response = await this.request<{ success: boolean; data: Bidang }>(`/bidangs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteBidang(id: string): Promise<void> {
    await this.request(`/bidangs/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllCategories(): Promise<Category[]> {
    return this.getAllBidangs();
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    return this.createBidang(data);
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return this.updateBidang(id, data);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.deleteBidang(id);
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

  async verifyProposal(proposalId: string, data: ApprovalActionRequest = {}): Promise<{
    success: boolean;
    message: string;
    data: Proposal;
  }> {
    return this.request(`/proposals/${proposalId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveProposal(proposalId: string, data: ApprovalActionRequest = {}): Promise<{
    success: boolean;
    message: string;
    data: {
      proposal: Proposal;
      next_approver?: string;
      next_step?: string;
    };
  }> {
    return this.request(`/proposals/${proposalId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async finalApproveProposal(proposalId: string, data: ApprovalActionRequest = {}): Promise<{
    success: boolean;
    message: string;
    data: Proposal;
  }> {
    return this.request(`/proposals/${proposalId}/final-approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rejectProposal(proposalId: string, data: ProposalRejectRequest): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      status: string;
      rejected_at: string;
      rejected_by: string;
      rejected_by_role: string;
      rejection_reason: string;
      improvement_suggestions: string;
      status_badge: string;
      status_label: string;
    };
  }> {
    return this.request(`/proposals/${proposalId}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // NEW: Reject payment (for Bendahara)
  async rejectPayment(paymentId: string, data: PaymentRejectRequest): Promise<{
    success: boolean;
    message: string;
    data: {
      payment_id: string;
      payment_status: string;
      proposal_id: string;
      proposal_status: string;
      rejection_reason: string;
      improvement_suggestions: string;
    };
  }> {
    return this.request(`/payments/${paymentId}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
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

  // Compress a File using the browser's native CompressionStream API (gzip)
  async compressFile(file: File): Promise<Blob> {
    const stream = file.stream().pipeThrough(new CompressionStream('gzip'));
    const arrayBuffer = await new Response(stream).arrayBuffer();
    return new Blob([arrayBuffer], { type: 'application/gzip' });
  }

  // Upload 1–5 attachments for a proposal (compresses each file with gzip before sending)
  async uploadProposalAttachments(proposalId: string, files: ProposalAttachmentUpload[]): Promise<ProposalAttachment[]> {
    const url = `${this.baseURL}/proposals/${proposalId}/attachments`;
    const token = localStorage.getItem('sirangkul_token');

    const formData = new FormData();

    for (const item of files) {
      const compressed = await this.compressFile(item.file);
      formData.append('files[]', compressed, item.file.name + '.gz');
      formData.append('original_names[]', item.file.name);
      formData.append('mime_types[]', item.file.type || 'application/octet-stream');
      formData.append('file_sizes[]', String(item.file.size));
      formData.append('attachment_types[]', item.attachmentType);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const uploadContentType = response.headers.get('content-type');
      if (uploadContentType && uploadContentType.includes('application/json')) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      throw new Error(`Upload gagal (${response.status}): Server mengembalikan respons tidak valid.`);
    }

    const uploadResult = await response.json().catch(() => {
      throw new Error('Upload selesai tetapi server mengembalikan respons tidak valid.');
    });
    return uploadResult.data as ProposalAttachment[];
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    const url = `${this.baseURL}/attachments/${attachmentId}`;
    const token = localStorage.getItem('sirangkul_token');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorData = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : {};

      throw new Error((errorData as ApiError).message || `Gagal menghapus lampiran proposal (${response.status}).`);
    }
  }

  // Download an attachment by its ID
  async downloadAttachment(attachmentId: string, fileName: string): Promise<void> {
    const url = `${this.baseURL}/attachments/${attachmentId}/download`;
    const token = localStorage.getItem('sirangkul_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorData = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : {};

      if (response.status === 404) {
        throw new Error((errorData as ApiError).message || 'File lampiran proposal tidak ditemukan di server.');
      }

      throw new Error((errorData as ApiError).message || `Gagal mengunduh lampiran proposal (${response.status}).`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }

  // NEW: Download reporting export
  async downloadReportExport(format: string = 'csv', filters?: any): Promise<Blob> {
    const url = new URL(`${this.baseURL}/reporting/export`);
    url.searchParams.append('format', format);

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          url.searchParams.append(key, filters[key]);
        }
      });
    }

    const token = localStorage.getItem('sirangkul_token');
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/reporting/summary', {
      method: 'GET',
    });
  }

  // PUBLIC VIEWER METHODS
  async getPublicRKAM(params: any): Promise<PaginatedResponse<RKAM>> {
    const url = new URL(`${this.baseURL}/public/rkam`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data; // Laravel wraps in { success, data: { ...paginate } }
  }

  async getPublicRKAMOptions(): Promise<{ categories: Category[]; bidangs: Bidang[]; units: string[] }> {
    const response = await fetch(`${this.baseURL}/public/rkam/options`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data || {};
    const bidangs = Array.isArray(data.bidangs)
      ? data.bidangs
      : Array.isArray(data.categories)
        ? data.categories
        : [];

    return {
      categories: bidangs,
      bidangs,
      units: Array.isArray(data.units) ? data.units : [],
    };
  }

  // Fetch an attachment as a Blob URL for in-browser preview
  async fetchAttachmentBlobUrl(attachmentId: string): Promise<string> {
    const url = `${this.baseURL}/attachments/${attachmentId}/download`;
    const token = localStorage.getItem('sirangkul_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorData = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : {};

      if (response.status === 404) {
        throw new Error((errorData as ApiError).message || 'File lampiran proposal tidak ditemukan di server.');
      }

      throw new Error((errorData as ApiError).message || `Gagal memuat lampiran proposal (${response.status}).`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Fetch payment proof as a Blob URL for in-browser preview.
  // Returns { url, mimeType } — mimeType comes from the decompressed blob.
  async fetchPaymentProofBlobUrl(paymentId: string): Promise<{ url: string; mimeType: string }> {
    const fetchUrl = `${this.baseURL}/payments/${paymentId}/download-proof`;
    const token = localStorage.getItem('sirangkul_token');

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const ct = response.headers.get('content-type') || '';
      const errorData = ct.includes('application/json')
        ? await response.json().catch(() => ({}))
        : {};
      throw new Error((errorData as ApiError).message || `HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return { url: URL.createObjectURL(blob), mimeType: blob.type };
  }

}

export const apiService = new ApiService();
export type { User };
