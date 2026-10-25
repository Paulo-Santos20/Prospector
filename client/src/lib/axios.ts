import axios from 'axios';
import { auth } from './firebase';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:10000/api'
    : 'https://prospector-api-mngo.onrender.com/api');

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
  const user = auth?.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && auth?.currentUser) {
      await auth.signOut();
    }
    return Promise.reject(error);
  }
);
