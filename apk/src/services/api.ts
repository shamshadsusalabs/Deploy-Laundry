import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2, iOS simulator uses localhost
const BASE_URL = Platform.OS === 'android'
    ? 'http://localhost:5000/api'
    : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('customerToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('customerToken');
            await AsyncStorage.removeItem('customerData');
        }
        return Promise.reject(error);
    }
);

export default api;
