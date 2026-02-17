// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  hasPaid: boolean;
  setHasPaid: (status: boolean) => void;
  loading: boolean;
  installPrompt: any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
  }, []);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setHasPaid(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

 // ... inside fetchProfile function ...

const fetchProfile = async (userId: string) => {
  try {
    // CHANGE THIS LINE: use .maybeSingle() instead of .single()
    const { data, error } = await supabase
      .from('profiles')
      .select('has_paid')
      .eq('id', userId)
      .maybeSingle(); 

    if (error) {
      console.error("Error fetching profile:", error);
    }
    
    // If data is null (no profile found), has_paid defaults to false
    setHasPaid(data?.has_paid || false);
  } catch (err) {
    console.error("Unexpected error fetching profile:", err);
    setHasPaid(false);
  }
};

  return (
    <UserContext.Provider
      value={{ user, hasPaid, setHasPaid, loading, installPrompt }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};