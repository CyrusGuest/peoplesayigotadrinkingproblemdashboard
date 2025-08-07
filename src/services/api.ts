const API_BASE_URL = 'http://localhost:4000/api'; // https://api.peoplesayigotadrinkingproblem.com/api

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
  socialLinks?: {
    tiktok?: string;
  
    instagram?: string;
    telegram?: string;
  };
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
  creatorName: string; // Store creator name for better UX
  platform: 'tiktok' | 'instagram';
  link: string;
  title?: string; // Content title/caption
  description?: string; // Additional description
  submittedAt: string;
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  lastStatsUpdate?: string;
}

export interface Message {
  messageId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Chat {
  chatId: string;
  participants: string; // String for GSI compatibility
  participantsList: string[]; // Array for easy access
  messages: Message[];
  lastMessageAt: string;
}

export interface PaymentRequest {
  requestId: string;
  creatorId: string;
  creatorName: string; // Store creator name for better UX
  amountRequested: number;
  status: 'pending' | 'approved' | 'denied' | 'paid' | 'on_hold';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  adminNotes?: string;
  denialReason?: string;
  paymentMethod?: string;
  amountPaid?: number;
  transactionId?: string;
  paymentDate?: string;
  processedBy?: string;
  deliverableIds?: string[];
}

export interface PaymentAuditLog {
  logId: string;
  requestId: string;
  userId: string;
  userRole: 'admin' | 'creator';
  action: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface SocialMediaSearchParams {
  platform: 'instagram' | 'tiktok';
  profileUrl: string;
  resultsLimit: number;
  searchType: 'hashtag' | 'keyword' | 'all';
  searchQuery?: string;
  resultsType: 'posts' | 'stories' | 'reels' | 'all';
}

export interface KOLCampaign {
  campaignId: string;
  kolId: string;
  kolName: string;
  totalVideos: number;
  paymentAmount: number;
  platform?: 'instagram' | 'tiktok';
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ScheduledPost {
  postId: string;
  campaignId: string;
  kolId: string;
  kolName: string;
  scheduledDate: string; // YYYY-MM-DD format
  status: 'scheduled' | 'posted' | 'late_1day' | 'late_2plus';
  trackingHashtag: string; // Unique hashtag for this specific post (e.g., #SC240101A)
  actualPostDate?: string;
  actualPostUrl?: string;
  platform: 'instagram' | 'tiktok';
  profileUrl: string;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KOLPostScan {
  scanId: string;
  kolId: string;
  platform: 'instagram' | 'tiktok';
  profileUrl: string;
  scanDate: string;
  postsFound: Array<{
    postId: string;
    postDate: string;
    url: string;
    caption?: string;
  }>;
  scanStatus: 'success' | 'failed' | 'partial';
  errorMessage?: string;
  createdAt: string;
}

export interface SocialMediaPost {
  id: string;
  type: string;
  shortCode?: string;
  caption?: string;
  hashtags: string[];
  mentions: string[];
  url: string;
  commentsCount: number;
  likesCount: number;
  videoViewCount?: number;
  videoPlayCount?: number;
  timestamp: string;
  displayUrl?: string;
  videoUrl?: string;
  ownerUsername: string;
  ownerFullName?: string;
  isSponsored?: boolean;
  videoDuration?: number;
  productType?: string;
  musicInfo?: {
    artist_name: string;
    song_name: string;
    uses_original_audio: boolean;
  };
  latestComments?: Array<{
    id: string;
    text: string;
    ownerUsername: string;
    timestamp: string;  }>;
}

export interface SocialMediaReport {
  reportId: string;
  creatorId?: string;
  platform: 'instagram' | 'tiktok';
  profileUrl: string;
  isAdminGenerated?: boolean;
  searchParams: {
    resultsLimit: number;
    searchType: 'hashtag' | 'keyword' | 'all';
    searchQuery?: string;
    resultsType: 'posts' | 'stories' | 'reels' | 'all';
  };
  analytics: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalViews?: number;
    totalPlays?: number;
    averageLikes: number;
    averageComments: number;
    averageViews?: number;
    averagePlays?: number;
    engagementRate: number;
    topHashtags: Array<{ tag: string; count: number }>;
    topMentions: Array<{ username: string; count: number }>;
    contentTypes: {
      images: number;
      videos: number;
      reels: number;
    };
    postingFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    bestPerformingPosts: Array<{
      id: string;
      caption?: string;
      likes: number;
      comments: number;
      views?: number;
      url: string;
      timestamp: string;    }>;
  };
  posts: SocialMediaPost[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
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
      const errorData = await response.json().catch(() => ({}));      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async login(data: LoginData): Promise<AuthResponse> {    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async signup(data: SignupData): Promise<AuthResponse> {    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async completePassword(email: string, newPassword: string, session: string): Promise<AuthResponse> {    const response = await fetch(`${API_BASE_URL}/auth/complete-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, session }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async confirmSignUp(email: string, confirmationCode: string, password: string): Promise<AuthResponse> {    const response = await fetch(`${API_BASE_URL}/auth/confirm-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirmationCode, password }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async resendConfirmationCode(email: string): Promise<AuthResponse> {    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  // User management
  async getCurrentUser(): Promise<User> {    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  async updateSocialLinks(socialLinks: {
    tiktok?: string;
  
    instagram?: string;
    telegram?: string;
  }): Promise<User> {    const response = await fetch(`${API_BASE_URL}/users/me/social-links`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ socialLinks }),
    });
    const data = await this.handleResponse<{ user: User }>(response);
    return data.user;
  }

  async getAllUsers(): Promise<User[]> {    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ users: User[] }>(response);
    return data.users;
  }

  async createUser(userData: {
    email: string;
    name: string;
    role: 'creator' | 'admin';
    socialLinks?: {
      tiktok?: string;
    
      instagram?: string;
      telegram?: string;
    };
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await this.handleResponse<{ user: User }>(response);
    return data.user;
  }

  async getChatParticipants(): Promise<User[]> {    const response = await fetch(`${API_BASE_URL}/users/chat-participants`, {
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
  async getDeliverables(): Promise<Deliverable[]> {    const response = await fetch(`${API_BASE_URL}/deliverables`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ deliverables: Deliverable[] }>(response);
    return data.deliverables;
  }

  async getAllDeliverables(): Promise<Deliverable[]> {
    const response = await fetch(`${API_BASE_URL}/admin/deliverables`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ deliverables: Deliverable[] }>(response);
    return data.deliverables;
  }

  async submitDeliverable(platform: 'tiktok' | 'instagram', link: string, title?: string, description?: string): Promise<Deliverable> {    const response = await fetch(`${API_BASE_URL}/deliverables`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ platform, link, title, description }),
    });
    const data = await this.handleResponse<{ deliverable: Deliverable }>(response);
    return data.deliverable;
  }

  async createDeliverableForUser(creatorId: string, platform: 'tiktok' | 'instagram', link: string, title?: string, description?: string): Promise<Deliverable> {
    const response = await fetch(`${API_BASE_URL}/admin/deliverables`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ creatorId, platform, link, title, description }),
    });
    const data = await this.handleResponse<{ deliverable: Deliverable }>(response);
    return data.deliverable;
  }

  async refreshDeliverableStats(deliverableId: string): Promise<{ processId: string; message: string; deliverable: Deliverable }> {
    const response = await fetch(`${API_BASE_URL}/deliverables/${deliverableId}/refresh-stats`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ processId: string; message: string; deliverable: Deliverable }>(response);
    return data;
  }

  // Payment Request methods
  async createPaymentRequest(data: {
    amountRequested: number;
    deliverableIds: string[];
    notes?: string;
  }): Promise<PaymentRequest> {    const response = await fetch(`${API_BASE_URL}/payment-requests`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ paymentRequest: PaymentRequest }>(response);
    return result.paymentRequest;
  }

  async getPaymentRequests(): Promise<PaymentRequest[]> {    const response = await fetch(`${API_BASE_URL}/payment-requests`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ paymentRequests: PaymentRequest[] }>(response);
    return data.paymentRequests;
  }

  async getPaymentRequestDetails(requestId: string): Promise<{
    paymentRequest: PaymentRequest;
    deliverables: Deliverable[];
    auditLogs: PaymentAuditLog[];  }> {    const response = await fetch(`${API_BASE_URL}/payment-requests/${requestId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updatePaymentRequest(requestId: string, data: { notes?: string }): Promise<PaymentRequest> {    const response = await fetch(`${API_BASE_URL}/payment-requests/${requestId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ paymentRequest: PaymentRequest }>(response);
    return result.paymentRequest;
  }

  async cancelPaymentRequest(requestId: string): Promise<void> {    const response = await fetch(`${API_BASE_URL}/payment-requests/${requestId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse(response);
  }

  // Admin payment request methods
  async approvePaymentRequest(requestId: string, data: {
    paymentMethod: string;
    amountPaid: number;
    transactionId: string;
    adminNotes?: string;
  }): Promise<{ paymentRequest: PaymentRequest; payment: Record<string, unknown> }> {    const response = await fetch(`${API_BASE_URL}/admin/payment-requests/${requestId}/approve`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async denyPaymentRequest(requestId: string, data: {
    denialReason: string;
    adminNotes?: string;
  }): Promise<PaymentRequest> {    const response = await fetch(`${API_BASE_URL}/admin/payment-requests/${requestId}/deny`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ paymentRequest: PaymentRequest }>(response);
    return result.paymentRequest;
  }

  async putPaymentRequestOnHold(requestId: string, data: { adminNotes?: string }): Promise<PaymentRequest> {    const response = await fetch(`${API_BASE_URL}/admin/payment-requests/${requestId}/hold`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ paymentRequest: PaymentRequest }>(response);
    return result.paymentRequest;
  }

  async getPaymentAnalytics(): Promise<Record<string, unknown>> {    const response = await fetch(`${API_BASE_URL}/admin/payment-analytics`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ analytics: Record<string, unknown> }>(response);
    return data.analytics;
  }

  // Chat methods
  async getChats(): Promise<Chat[]> {    const response = await fetch(`${API_BASE_URL}/chats`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ chats: Chat[] }>(response);
    return data.chats;
  }

  async createChat(participantId: string): Promise<Chat> {    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ participantId }),
    });
    const data = await this.handleResponse<{ chat: Chat }>(response);
    return data.chat;
  }

  async getChat(chatId: string): Promise<Chat> {    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ chat: Chat }>(response);
    return data.chat;
  }

  async sendMessage(chatId: string, content: string): Promise<void> {    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    await this.handleResponse<{ message: string }>(response);
  }

  // Social Media Content Review
  async scrapeSocialMediaContent(params: SocialMediaSearchParams & { creatorId?: string; isAdminGenerated?: boolean }): Promise<{
    success: boolean;
    report: SocialMediaReport;
    totalResults: number;
    searchParams: SocialMediaSearchParams;  }> {    const response = await fetch(`${API_BASE_URL}/admin/social-media-review`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return await this.handleResponse<{
      success: boolean;
      report: SocialMediaReport;
      totalResults: number;
      searchParams: SocialMediaSearchParams;    }>(response);
  }

  async scrapeIndividualVideo(platform: 'instagram' | 'tiktok', videoUrl: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/scrape-individual-video`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ platform, videoUrl }),
    });
    return this.handleResponse(response);
  }



  // Background process methods
  async getBackgroundProcesses(): Promise<{ processes: any[] }> {
    const response = await fetch(`${API_BASE_URL}/background-processes`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getBackgroundProcess(id: string): Promise<{ process: any }> {
    const response = await fetch(`${API_BASE_URL}/background-processes/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async cancelBackgroundProcess(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/background-processes/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCreatorSocialMediaReports(creatorId: string): Promise<{ reports: SocialMediaReport[] }> {    const response = await fetch(`${API_BASE_URL}/admin/creator/${creatorId}/social-media-reports`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<{ reports: SocialMediaReport[] }>(response);
  }

  async getSocialMediaReport(reportId: string): Promise<{ report: SocialMediaReport }> {    const response = await fetch(`${API_BASE_URL}/admin/social-media-reports/${reportId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<{ report: SocialMediaReport }>(response);
  }

  async deleteSocialMediaReport(reportId: string): Promise<{ message: string }> {    const response = await fetch(`${API_BASE_URL}/admin/social-media-reports/${reportId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<{ message: string }>(response);
  }

  async getSupportedPlatforms(): Promise<{ platforms: string[] }> {    const response = await fetch(`${API_BASE_URL}/admin/supported-platforms`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse<{ platforms: string[] }>(response);
  }

  // Admin Reports
  async getAdminReports(): Promise<SocialMediaReport[]> {
    const response = await fetch(`${API_BASE_URL}/admin/reports`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<{ reports: SocialMediaReport[] }>(response);
    return data.reports;
  }

  async deleteReport(reportId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // KOL Campaign Management
  async createKOLCampaign(data: {
    kolId: string;
    totalVideos: number;
    paymentAmount: number;
    scheduledDates: string[];
    platform?: 'instagram' | 'tiktok';
    profileUrl?: string;
  }): Promise<{ success: boolean; campaign: KOLCampaign; scheduledPosts: ScheduledPost[]; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-campaigns`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getKOLCampaigns(): Promise<{ campaigns: KOLCampaign[] }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-campaigns`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getKOLCampaign(campaignId: string): Promise<{ campaign: KOLCampaign; scheduledPosts: ScheduledPost[] }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-campaigns/${campaignId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getScheduledPosts(params: { startDate?: string; endDate?: string; date?: string }): Promise<{ scheduledPosts: ScheduledPost[] }> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.date) queryParams.append('date', params.date);

    const response = await fetch(`${API_BASE_URL}/admin/scheduled-posts?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateScheduledPostStatus(postId: string, status: ScheduledPost['status'], actualPostDate?: string, actualPostUrl?: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/scheduled-posts/${postId}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, actualPostDate, actualPostUrl }),
    });
    return this.handleResponse(response);
  }

  async triggerDailyScan(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-scan/daily`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getPostsNeedingAttention(): Promise<{ posts: ScheduledPost[] }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-posts/attention`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async triggerManualScan(kolId: string, platform: 'instagram' | 'tiktok'): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-scan/manual`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ kolId, platform }),
    });
    return this.handleResponse(response);
  }

  async sendKOLMessage(kolId: string, message: string, subject?: string): Promise<{ success: boolean; chatId: string; messageId: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-message`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ kolId, message, subject }),
    });
    return this.handleResponse(response);
  }

  async triggerCalendarHashtagScan(): Promise<{ 
    success: boolean; 
    scannedProfiles: number; 
    postsMatched: number; 
    message: string;
    detectedPosts?: Array<{
      postId: string;
      kolId: string;
      platform: 'instagram' | 'tiktok';
      postUrl: string;
      deliverableCreated?: boolean;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/kol-scan/calendar-hashtags`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse(response);
    
    // If the backend returns detected posts, create deliverables for them
    if (result.detectedPosts && result.detectedPosts.length > 0) {
      for (const post of result.detectedPosts) {
        if (!post.deliverableCreated && post.postUrl) {
          try {
            await this.createDeliverableFromDetectedPost(
              post.postId,
              post.kolId,
              post.platform,
              post.postUrl
            );
          } catch (error) {
            console.error('Failed to create deliverable for detected post:', error);
          }
        }
      }
    }
    
    return result;
  }

  async getScheduledPostsByCampaign(campaignId: string): Promise<ScheduledPost[]> {
    const response = await fetch(`${API_BASE_URL}/admin/scheduled-posts/campaign/${campaignId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse(response) as { scheduledPosts: ScheduledPost[] };
    return result.scheduledPosts || [];
  }

  async createDeliverableFromDetectedPost(
    postId: string, 
    kolId: string, 
    platform: 'instagram' | 'tiktok', 
    postUrl: string,
    title?: string
  ): Promise<{ deliverable: Deliverable; message: string }> {
    // Use the existing deliverable creation endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/admin/deliverables`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          creatorId: kolId,
          platform,
          link: postUrl,
          title: title || `KOL Campaign Post - ${new Date().toLocaleDateString()}`,
          description: `Auto-created from detected campaign post (Post ID: ${postId})`
        }),
      });
      const data = await this.handleResponse(response) as { deliverable: Deliverable };
      return { deliverable: data.deliverable, message: 'Deliverable created successfully' };
    } catch (error: any) {
      // If it fails because deliverable exists or creator not found, log it
      console.log('Could not create deliverable:', error.message);
      throw error;
    }
  }
  
  async checkAndCreateDeliverablesForDetectedPosts(): Promise<{ created: number; checked: number }> {
    try {
      // Get all scheduled posts to check for ones with URLs
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
      
      const response = await fetch(`${API_BASE_URL}/admin/scheduled-posts?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      const { scheduledPosts } = await this.handleResponse(response) as { scheduledPosts: ScheduledPost[] };
      
      let created = 0;
      const postsWithUrls = scheduledPosts.filter(p => p.actualPostUrl && p.status === 'posted');
      const checked = postsWithUrls.length;
      
      for (const post of postsWithUrls) {
        if (post.actualPostUrl) {
          try {
            // Check if deliverable already exists for this URL
            const deliverables = await this.getDeliverables();
            const exists = deliverables.some(d => d.link === post.actualPostUrl);
            
            if (!exists) {
              await this.createDeliverableFromDetectedPost(
                post.postId,
                post.kolId,
                post.platform,
                post.actualPostUrl,
                `${post.kolName} - Campaign Post`
              );
              created++;
              console.log(`Created deliverable for post ${post.postId}`);
            }
          } catch (error) {
            console.log(`Could not create deliverable for post ${post.postId}:`, error);
          }
        }
      }
      
      return { created, checked };
    } catch (error) {
      console.error('Failed to check for detected posts without deliverables:', error);
      return { created: 0, checked: 0 };
    }
  }
}

export const apiService = new ApiService(); 