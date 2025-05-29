import {
  Proposal,
  CommunityPost,
  User,
  VoteRecord,
  Notification,
  CalendarEvent,
} from '@/types';

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProposalFilters extends PaginationParams {
  status?: 'active' | 'passed' | 'failed' | 'pending';
  category?: string;
  search?: string;
  minFunding?: number;
  maxFunding?: number;
}

export interface CommunityFilters extends PaginationParams {
  category?: 'idea' | 'discussion' | 'feedback' | 'announcement';
  tags?: string[];
  search?: string;
  author?: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client with error handling and retries
class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create HTTP client instance
const httpClient = new HttpClient(API_BASE_URL);

// Proposal API functions
export const proposalApi = {
  // Get all proposals with filtering and pagination
  getProposals: (
    filters?: ProposalFilters
  ): Promise<ApiResponse<Proposal[]>> => {
    return httpClient.get('/proposals', filters);
  },

  // Get a single proposal by ID
  getProposal: (id: string): Promise<ApiResponse<Proposal>> => {
    return httpClient.get(`/proposals/${id}`);
  },

  // Create a new proposal
  createProposal: (
    proposal: Partial<Proposal>
  ): Promise<ApiResponse<Proposal>> => {
    return httpClient.post('/proposals', proposal);
  },

  // Update a proposal
  updateProposal: (
    id: string,
    updates: Partial<Proposal>
  ): Promise<ApiResponse<Proposal>> => {
    return httpClient.put(`/proposals/${id}`, updates);
  },

  // Delete a proposal
  deleteProposal: (id: string): Promise<ApiResponse<void>> => {
    return httpClient.delete(`/proposals/${id}`);
  },

  // Vote on a proposal
  voteOnProposal: (
    proposalId: string,
    vote: 'yes' | 'no' | 'abstain'
  ): Promise<ApiResponse<VoteRecord>> => {
    return httpClient.post(`/proposals/${proposalId}/vote`, { vote });
  },

  // Get voting history for a proposal
  getProposalVotes: (
    proposalId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<VoteRecord[]>> => {
    return httpClient.get(`/proposals/${proposalId}/votes`, params);
  },
};

// Community API functions
export const communityApi = {
  // Get all community posts
  getPosts: (
    filters?: CommunityFilters
  ): Promise<ApiResponse<CommunityPost[]>> => {
    return httpClient.get('/community/posts', filters);
  },

  // Get a single post by ID
  getPost: (id: string): Promise<ApiResponse<CommunityPost>> => {
    return httpClient.get(`/community/posts/${id}`);
  },

  // Create a new post
  createPost: (
    post: Partial<CommunityPost>
  ): Promise<ApiResponse<CommunityPost>> => {
    return httpClient.post('/community/posts', post);
  },

  // Update a post
  updatePost: (
    id: string,
    updates: Partial<CommunityPost>
  ): Promise<ApiResponse<CommunityPost>> => {
    return httpClient.put(`/community/posts/${id}`, updates);
  },

  // Delete a post
  deletePost: (id: string): Promise<ApiResponse<void>> => {
    return httpClient.delete(`/community/posts/${id}`);
  },

  // Upvote/downvote a post
  voteOnPost: (
    postId: string,
    vote: 'up' | 'down'
  ): Promise<ApiResponse<CommunityPost>> => {
    return httpClient.post(`/community/posts/${postId}/vote`, { vote });
  },

  // Get trending tags
  getTrendingTags: (): Promise<ApiResponse<string[]>> => {
    return httpClient.get('/community/trending-tags');
  },
};

// User API functions
export const userApi = {
  // Get current user profile
  getProfile: (): Promise<ApiResponse<User>> => {
    return httpClient.get('/user/profile');
  },

  // Update user profile
  updateProfile: (updates: Partial<User>): Promise<ApiResponse<User>> => {
    return httpClient.put('/user/profile', updates);
  },

  // Get user's voting history
  getVotingHistory: (
    params?: PaginationParams
  ): Promise<ApiResponse<VoteRecord[]>> => {
    return httpClient.get('/user/voting-history', params);
  },

  // Get user's proposals
  getUserProposals: (
    params?: PaginationParams
  ): Promise<ApiResponse<Proposal[]>> => {
    return httpClient.get('/user/proposals', params);
  },

  // Get user's community posts
  getUserPosts: (
    params?: PaginationParams
  ): Promise<ApiResponse<CommunityPost[]>> => {
    return httpClient.get('/user/posts', params);
  },

  // Get user notifications
  getNotifications: (
    params?: PaginationParams
  ): Promise<ApiResponse<Notification[]>> => {
    return httpClient.get('/user/notifications', params);
  },

  // Mark notification as read
  markNotificationRead: (
    notificationId: string
  ): Promise<ApiResponse<void>> => {
    return httpClient.patch(`/user/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllNotificationsRead: (): Promise<ApiResponse<void>> => {
    return httpClient.patch('/user/notifications/read-all');
  },
};

// Wallet API functions
export const walletApi = {
  // Connect wallet
  connectWallet: (
    address: string,
    signature: string
  ): Promise<ApiResponse<{ token: string; user: User }>> => {
    return httpClient.post('/wallet/connect', { address, signature });
  },

  // Disconnect wallet
  disconnectWallet: (): Promise<ApiResponse<void>> => {
    return httpClient.post('/wallet/disconnect');
  },

  // Get VMF balance
  getVMFBalance: (
    address: string
  ): Promise<ApiResponse<{ balance: number; votingPower: number }>> => {
    return httpClient.get(`/wallet/balance/${address}`);
  },

  // Verify wallet ownership
  verifyWallet: (
    address: string,
    message: string,
    signature: string
  ): Promise<ApiResponse<boolean>> => {
    return httpClient.post('/wallet/verify', { address, message, signature });
  },
};

// Calendar API functions
export const calendarApi = {
  // Get calendar events
  getEvents: (
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<CalendarEvent[]>> => {
    return httpClient.get('/calendar/events', { startDate, endDate });
  },

  // Create calendar event
  createEvent: (
    event: Partial<CalendarEvent>
  ): Promise<ApiResponse<CalendarEvent>> => {
    return httpClient.post('/calendar/events', event);
  },

  // Update calendar event
  updateEvent: (
    id: string,
    updates: Partial<CalendarEvent>
  ): Promise<ApiResponse<CalendarEvent>> => {
    return httpClient.put(`/calendar/events/${id}`, updates);
  },

  // Delete calendar event
  deleteEvent: (id: string): Promise<ApiResponse<void>> => {
    return httpClient.delete(`/calendar/events/${id}`);
  },
};

// Analytics API functions
export const analyticsApi = {
  // Get governance statistics
  getGovernanceStats: (): Promise<
    ApiResponse<{
      totalProposals: number;
      activeProposals: number;
      totalVotes: number;
      totalParticipants: number;
      averageParticipation: number;
    }>
  > => {
    return httpClient.get('/analytics/governance');
  },

  // Get community statistics
  getCommunityStats: (): Promise<
    ApiResponse<{
      totalPosts: number;
      totalUsers: number;
      activeUsers: number;
      popularTags: string[];
    }>
  > => {
    return httpClient.get('/analytics/community');
  },

  // Get voting trends
  getVotingTrends: (
    period: '7d' | '30d' | '90d' | '1y'
  ): Promise<
    ApiResponse<{
      dates: string[];
      votes: number[];
      participation: number[];
    }>
  > => {
    return httpClient.get('/analytics/voting-trends', { period });
  },
};

// Utility functions for handling API responses
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError!;
};

// Cache utility for API responses
class ApiCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const apiCache = new ApiCache();

// Cached API request wrapper
export const cachedRequest = async <T>(
  key: string,
  requestFn: () => Promise<ApiResponse<T>>,
  ttl?: number
): Promise<ApiResponse<T>> => {
  const cached = apiCache.get<ApiResponse<T>>(key);

  if (cached) {
    return cached;
  }

  const response = await requestFn();

  if (response.success) {
    apiCache.set(key, response, ttl);
  }

  return response;
};
