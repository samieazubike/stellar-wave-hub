"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
  stellar_address?: string;
  github_url?: string;
  twitter_url?: string;
  discord_username?: string;
  telegram_url?: string;
  website_url?: string;
  bio?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  connectWallet: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem("swh_token");
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${stored}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(stored);
      } else {
        localStorage.removeItem("swh_token");
        setUser(null);
        setToken(null);
      }
    } catch {
      localStorage.removeItem("swh_token");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("swh_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    localStorage.setItem("swh_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const connectWallet = async () => {
    const { isConnected, requestAccess, getAddress, signTransaction } = await import("@stellar/freighter-api");

    // Check if Freighter is installed
    const connResult = await isConnected();
    if (connResult.error || !connResult.isConnected) {
      throw new Error(
        "Freighter wallet not found. Please install the Freighter browser extension."
      );
    }

    // Request access and get public key
    const accessResult = await requestAccess();
    if (accessResult.error) {
      throw new Error(accessResult.error.message || "Wallet access denied.");
    }

    const addrResult = await getAddress();
    if (addrResult.error || !addrResult.address) {
      throw new Error("Could not retrieve public key from wallet.");
    }
    const publicKey = addrResult.address;

    // Request challenge transaction from server
    const challengeRes = await fetch(`/api/auth/challenge?publicKey=${publicKey}`);
    const challengeData = await challengeRes.json();
    if (!challengeRes.ok) throw new Error(challengeData.error || "Failed to get challenge");

    // Sign the challenge transaction with Freighter
    const signResult = await signTransaction(challengeData.challengeXdr, {
      networkPassphrase: challengeData.networkPassphrase,
    });
    if (signResult.error || !signResult.signedTxXdr) {
      throw new Error("Failed to sign transaction with wallet.");
    }

    // Verify signed transaction with server
    const authRes = await fetch("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey, signedXdr: signResult.signedTxXdr }),
    });
    const authData = await authRes.json();
    if (!authRes.ok) throw new Error(authData.error || "Wallet authentication failed");

    localStorage.setItem("swh_token", authData.token);
    setToken(authData.token);
    setUser(authData.user);
  };

  const logout = () => {
    localStorage.removeItem("swh_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, connectWallet, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
