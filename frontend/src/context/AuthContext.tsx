import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import { api } from '../services/api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
    role: string
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;

        setToken(storedToken);
        setUser(parsedUser);

        api.defaults.headers.common['Authorization'] =
          `Bearer ${storedToken}`;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');

        delete api.defaults.headers.common['Authorization'];
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    role: string
  ): Promise<void> => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });

    const { access_token, user: userData } = response.data as {
      access_token: string;
      user: User;
    };

    // Verify that the selected role matches the account role.
    if (userData.role !== role) {
      throw new Error(
        `Account is registered as ${userData.role}, not ${role}`
      );
    }

    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userData.role);

    setToken(access_token);
    setUser(userData);

    api.defaults.headers.common['Authorization'] =
      `Bearer ${access_token}`;
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    setToken(null);
    setUser(null);

    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};