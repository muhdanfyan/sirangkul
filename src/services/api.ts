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
  title: string;
  status: 'draft' | 'submitted'
  submitted_at: string;
}

export interface Pembayaran {
  id: string;
  proposal_id: string;
  amount: number;
  status: 'pending' | 'processed' | 'completed'
}

export interface Laporan {
  id: string;
  // no api endpoint
}

export interface Feedback {
  id: string;
  user_id: string;
  message: string;
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

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` }),
      },
    });
  }

  async getProposals(): Promise<Proposal[]> {
    return this.request<Proposal[]>('/proposals', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` }),
      },
    });
  }

  async getPembayaran(): Promise<Pembayaran[]> {
    return this.request<Pembayaran[]>('/payments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` }),
      },
    });
  }

  async getLaporan(): Promise<Laporan[]> {
    return this.request<Laporan[]>('/laporan', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...API_BASE_URL(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` })
      }
    });
  }

  async getFeedback(): Promise<Feedback[]> {
    return this.request<Feedback[]>('/feedback', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...API_BASE_URL(localStorage.getItem('sirangkul_token') && { Authorization: `Bearer ${localStorage.getItem('sirangkul_token')}` })
      }
    });
  }

  // Add other API methods here as needed
  // async getProposals() { ... }
  // async createProposal() { ... }

}

  

export const apiService = new ApiService();
