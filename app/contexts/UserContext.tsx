"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthPayload {
  user: User;
  token: string;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  login: (authPayload: AuthPayload) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("workoutUser");
    const savedToken = localStorage.getItem("workoutToken");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (error) {
        console.error("Error parsing saved user/token:", error);
        localStorage.removeItem("workoutUser");
        localStorage.removeItem("workoutToken");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (authPayload: AuthPayload) => {
    setUser(authPayload.user);
    setToken(authPayload.token);
    localStorage.setItem("workoutUser", JSON.stringify(authPayload.user));
    localStorage.setItem("workoutToken", authPayload.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("workoutUser");
    localStorage.removeItem("workoutToken");
  };

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("workoutUser", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("workoutUser");
    }
  };

  const isAuthenticated = !!user && !!token;

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        setUser: updateUser,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
