import apiClient from './api';

export interface CurrencyStats {
  totalUsers: number;
  totalBalance: number;
  totalBankBalance: number;
  totalMiningBalance: number; 
  totalTransactions: number;
  topUsersByBalance: Array<{ 
    userId: string; 
    amount: number;
    name: string;
    avatar: string | null;
  }>;
  topUsersByBankBalance: Array<{ 
    userId: string; 
    bankBalance: number;
    name: string;
    avatar: string | null;
  }>;
  currencyDistribution: {
    wallet: number;
    bank: number;
    mining: number; 
  };
}

export interface UserCurrency {
  userId: string;
  name: string;
  avatar: string | null;
  bankBalance: number;
  walletBalance: number;
  miningBalance: number; 
  creditScore: number;
  createdAt?: number;
  totalBalance: number;
}

export interface UserDetails {
  userId: string;
  name: string;
  avatar: string | null;
  walletBalance: number;
  bankBalance: number;
  miningBalance: number; 
  creditScore: number;
  createdAt?: number;
  lastInterest?: number;
  totalTransactions: number;
  recentTransactions: Transaction[];
  penalties: any[];
  balanceHistory: any[];
}

export interface Transaction {
  type: 'in' | 'out';
  description: string;
  amount: number;
  timestamp: number;
  userId?: string;
}

export interface UsersListResponse {
  users: UserCurrency[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CurrencyOverview {
  stats: CurrencyStats;
  recentTransactions: Transaction[];
  currencyTypes: string[];
  lastUpdated: string;
}

export interface UserEditData {
  walletBalance?: number;
  bankBalance?: number;
  creditScore?: number;
  description?: string;
}

export const currencyApi = {
  
  getStats: async (): Promise<CurrencyStats> => {
    const response = await apiClient.get('/currencies/stats');
    return response.data;
  },

  
  getUsers: async (page = 1, limit = 20, search = ''): Promise<UsersListResponse> => {
    const response = await apiClient.get('/currencies/users', {
      params: { page, limit, search }
    });
    return response.data;
  },

  
  getUserDetails: async (userId: string): Promise<UserDetails> => {
    const response = await apiClient.get(`/currencies/users/${userId}`);
    return response.data;
  },

  
  updateUserBalance: async (userId: string, amount: number, type = 'wallet') => {
    const response = await apiClient.put(`/currencies/users/${userId}/balance`, {
      amount,
      type
    });
    return response.data;
  },

  // New API for detailed user editing
  updateUserDetails: async (userId: string, userData: UserEditData) => {
    const response = await apiClient.put(`/currencies/users/${userId}/details`, userData);
    return response.data;
  },

  // New API for setting absolute values
  setUserWalletBalance: async (userId: string, balance: number, description?: string) => {
    const response = await apiClient.put(`/currencies/users/${userId}/wallet`, {
      balance,
      description
    });
    return response.data;
  },

  // New API for setting bank balance
  setUserBankBalance: async (userId: string, balance: number, description?: string) => {
    const response = await apiClient.put(`/currencies/users/${userId}/bank`, {
      balance,
      description
    });
    return response.data;
  },

  // New API for updating credit score
  updateUserCreditScore: async (userId: string, creditScore: number, description?: string) => {
    const response = await apiClient.put(`/currencies/users/${userId}/credit-score`, {
      creditScore,
      description
    });
    return response.data;
  },

  
  getTransactions: async (userId?: string, limit = 50): Promise<Transaction[]> => {
    const response = await apiClient.get('/currencies/transactions', {
      params: { userId, limit }
    });
    return response.data;
  },

  
  createTransaction: async (userId: string, type: 'in' | 'out', amount: number, description: string) => {
    const response = await apiClient.post('/currencies/transactions', {
      userId,
      type,
      amount,
      description
    });
    return response.data;
  },

  
  getLeaderboard: async () => {
    const response = await apiClient.get('/currencies/leaderboard');
    return response.data;
  },

  
  getOverview: async (): Promise<CurrencyOverview> => {
    const response = await apiClient.get('/currencies/overview');
    return response.data;
  }
};
