import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://prospector-api-mngo.onrender.com/api',
});