import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth,
  signOut, 
  onAuthStateChanged,
  FirebaseUser,
} from '../lib/firebase';
import apiService from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'guide' | 'admin';
  avatar?: string;
  phone?: string;
  preferences?: {
    travelStyle: string;
    budget: string;
  };
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!firebaseUser;

  useEffect(() => {
    // Check if Firebase is configured
    if (!auth) {
      console.warn('Firebase Auth is not configured. Authentication features will not work.');
      setIsLoading(false);
      return;
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get Firebase ID token and set it in API service
          const idToken = await firebaseUser.getIdToken();
          apiService.setToken(idToken);
          
          // Fetch user data from backend
          try {
            const response = await apiService.getCurrentUser();
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
          } catch (error: any) {
            console.error('Failed to get user data from backend:', error);
            // If user doesn't exist in backend, create it
            // This handles the case where user was created in Firebase but not in Firestore
            const userData = {
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'user',
            };
            try {
              // Ensure token is set before registering
              const freshToken = await firebaseUser.getIdToken(true); // Force refresh
              apiService.setToken(freshToken);
              const response = await apiService.register(userData);
              setUser(response.user);
              localStorage.setItem('user', JSON.stringify(response.user));
            } catch (regError: any) {
              console.error('Failed to create user in backend:', regError);
              // User might already exist, try to get it again with fresh token
              try {
                const freshToken = await firebaseUser.getIdToken(true);
                apiService.setToken(freshToken);
                const response = await apiService.getCurrentUser();
                setUser(response.user);
                localStorage.setItem('user', JSON.stringify(response.user));
              } catch (e) {
                console.error('Failed to get user after registration attempt:', e);
                // If all else fails, clear the user state
                setUser(null);
                apiService.setToken(null);
              }
            }
          }
        } catch (error) {
          console.error('Failed to get ID token:', error);
          setUser(null);
          apiService.setToken(null);
        }
      } else {
        // User signed out
        setUser(null);
        apiService.setToken(null);
        localStorage.removeItem('user');
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Sign in with Firebase
      const { auth: firebaseAuth, signInWithEmailAndPassword } = await import('../lib/firebase');
      
      if (!firebaseAuth) {
        throw new Error('Firebase is not configured. Please set up your Firebase credentials in .env file.');
      }
      
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Set token in API service BEFORE making any API calls
      apiService.setToken(idToken);
      
      // Fetch user data from backend
      try {
        const response = await apiService.getCurrentUser();
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      } catch (apiError: any) {
        // If user doesn't exist in backend, create them
        if (apiError.message?.includes('not found') || apiError.message?.includes('User not found')) {
          const userData = {
            name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
            email: userCredential.user.email || '',
            role: 'user',
          };
          try {
            const registerResponse = await apiService.register(userData);
            setUser(registerResponse.user);
            localStorage.setItem('user', JSON.stringify(registerResponse.user));
          } catch (regError) {
            console.error('Failed to create user in backend:', regError);
            throw new Error('Failed to set up your account. Please try again.');
          }
        } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      // Convert Firebase errors to user-friendly messages
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: any) => {
    try {
      const { email, password, name, phone, role } = userData;
      
      // Create user in Firebase Auth
      const { auth: firebaseAuth, createUserWithEmailAndPassword, updateProfile } = await import('../lib/firebase');
      
      if (!firebaseAuth) {
        throw new Error('Firebase is not configured. Please set up your Firebase credentials in .env file.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase profile with name
      if (name) {
        await updateProfile(firebaseUser, { displayName: name });
      }
      
      // Get ID token
      const idToken = await firebaseUser.getIdToken();
      apiService.setToken(idToken);
      
      // Create user in backend Firestore
      const response = await apiService.register({
        name,
        email,
        phone,
        role: role || 'user',
        // Don't send password to backend - Firebase handles it
      });
      
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error: any) {
      console.error('Registration failed:', error);
      // Convert Firebase errors to user-friendly messages
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      apiService.logout();
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if Firebase logout fails
      apiService.logout();
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('user');
    }
  };

  const updateUser = async (userData: any) => {
    try {
      const response = await apiService.updateProfile(userData);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Update Firebase profile if name changed
      if (firebaseUser && userData.name && auth) {
        const { updateProfile } = await import('../lib/firebase');
        await updateProfile(firebaseUser, { displayName: userData.name });
      }
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (firebaseUser) {
        // Refresh Firebase token
        const idToken = await firebaseUser.getIdToken(true);
        apiService.setToken(idToken);
      }
      
      const response = await apiService.getCurrentUser();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { auth: firebaseAuth, sendPasswordResetEmail: sendResetEmail } = await import('../lib/firebase');
      
      if (!firebaseAuth) {
        throw new Error('Firebase is not configured. Please set up your Firebase credentials in .env file.');
      }
      
      await sendResetEmail(firebaseAuth, email);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    sendPasswordResetEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
