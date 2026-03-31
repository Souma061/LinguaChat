import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileConfig } from '../config/mobileConfig';

const apiClient = axios.create({
  baseURL: mobileConfig.apiUrl,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
