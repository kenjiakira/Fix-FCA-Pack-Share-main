import apiClient from './api';

export interface UserInfo {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface AvatarInfo {
  exists: boolean;
  avatarUrl: string | null;
}

export const userInfoApi = {
  
  getUserInfo: async (userId: string): Promise<UserInfo> => {
    const response = await apiClient.get(`/userinfo/${userId}`);
    return response.data.data;
  },

  getUsersInfo: async (userIds: string[]): Promise<Record<string, UserInfo>> => {
    const response = await apiClient.post('/userinfo/batch', { userIds });
    return response.data.data;
  },

  getAvatarInfo: async (userId: string): Promise<AvatarInfo> => {
    const response = await apiClient.get(`/userinfo/avatar/${userId}`);
    return response.data.data;
  },

  getAllUsers: async (): Promise<string[]> => {
    const response = await apiClient.get('/userinfo/all');
    return response.data.data;
  }
};
