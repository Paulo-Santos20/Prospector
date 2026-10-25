import { useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '../lib/firebase';
import { api } from '../lib/axios';
import { AuthContext, type AuthContextValue } from './authContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/users/me').catch((error) => {
      if (error?.response?.status === 403 && auth) {
        void signOut(auth);
      }
    });
  }, [user]);

  const requireAuth = () => {
    if (!auth) throw new Error('Firebase não configurado. Preencha o .env do cliente.');
    return auth;
  };

  const value: AuthContextValue = {
    user,
    loading,
    configured: firebaseConfigured,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(requireAuth(), email, password);
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(requireAuth(), email);
    },
    logout: async () => {
      await signOut(requireAuth());
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
