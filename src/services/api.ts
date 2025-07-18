const API_BASE_URL = 'http://localhost:4000/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  name: string;
  password: string;
  role: 'creator'; // Only creator accounts can be created via signup
}

export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'creator';
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  tokens?: {
    AccessToken: string;
    RefreshToken: string;
    IdToken: string;
  };
  challenge?: string;
  session?: string;
  message?: string;
  error?: string;
}

export interface Deliverable {
  deliverableId: string;
  creatorId: string;
  platform: 'tiktok' | 'instagram' | 'twitter';
  link: string;
  submittedAt: string;
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  lastStatsUpdate?: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async completePassword(email: string, newPassword: string, session: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/complete-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, session }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async confirmSignUp(email: string, confirmationCode: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/confirm-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirmationCode, password }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async resendConfirmationCode(email: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  // User management
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ users: User[] }>(response);
    return data.users;
  }

  // Token management
  setTokens(tokens: AuthResponse['tokens']) {
    if (tokens?.AccessToken) {
      localStorage.setItem('accessToken', tokens.AccessToken);
    }
    if (tokens?.RefreshToken) {
      localStorage.setItem('refreshToken', tokens.RefreshToken);
    }
    if (tokens?.IdToken) {
      localStorage.setItem('idToken', tokens.IdToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Deliverables
  async getDeliverables(): Promise<Deliverable[]> {
    const response = await fetch(`${API_BASE_URL}/deliverables`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ deliverables: Deliverable[] }>(response);
    return data.deliverables;
  }

  async submitDeliverable(platform: 'tiktok' | 'instagram' | 'twitter', link: string): Promise<Deliverable> {
    const response = await fetch(`${API_BASE_URL}/deliverables`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ platform, link }),
    });
    const data = await this.handleResponse<{ deliverable: Deliverable }>(response);
    return data.deliverable;
  }
}

export const apiService = new ApiService(); 