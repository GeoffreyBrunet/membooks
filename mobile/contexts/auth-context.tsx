import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getSession,
  getProfile,
} from "@/services/auth";
import type {
  User,
  LoginData,
  RegisterData,
  AuthResponse,
} from "@/types/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await getSession();
        if (session) {
          setUser(session.user);
          // Refresh profile from API to get latest data
          const profileResponse = await getProfile();
          if (profileResponse.success && profileResponse.user) {
            setUser(profileResponse.user);
          } else if (profileResponse.error === "Unauthorized") {
            // Token expired, clear session
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = useCallback(async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiLogin(data);
    if (response.success && response.user) {
      setUser(response.user);
    }
    return response;
  }, []);

  const register = useCallback(
    async (data: RegisterData): Promise<AuthResponse> => {
      const response = await apiRegister(data);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const response = await getProfile();
    if (response.success && response.user) {
      setUser(response.user);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
