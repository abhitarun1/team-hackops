import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
}

interface AuthContextType extends AuthState {
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
  });

  useEffect(() => {
    // Check if user is already logged in
    const savedAuth = localStorage.getItem('identity_vault_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.isAuthenticated && authData.userId) {
          setState({
            isAuthenticated: true,
            userId: authData.userId,
          });
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      }
    }
  }, []);

  const login = async (userId: string, password: string): Promise<boolean> => {
    // Simple authentication - in production, this would call an API
    // For demo purposes, we'll accept any non-empty credentials
    if (userId.trim() && password.trim()) {
      const authData = {
        isAuthenticated: true,
        userId: userId.trim(),
      };
      localStorage.setItem('identity_vault_auth', JSON.stringify(authData));
      setState(authData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('identity_vault_auth');
    setState({
      isAuthenticated: false,
      userId: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

