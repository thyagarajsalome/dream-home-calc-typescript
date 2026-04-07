import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  hasPaid: boolean;
  setHasPaid: (status: boolean) => void;
  loading: boolean;
  installPrompt: any;
  markup: number;
  setMarkup: (val: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // NEW: Hidden Builder Profit Margin
  const [markup, setMarkup] = useState(0);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setHasPaid(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Removed the 'email' parameter since we no longer need to check it on the client side
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) console.error("Error fetching profile:", error);
      
      setHasPaid(data?.has_paid || false);
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      setHasPaid(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, hasPaid, setHasPaid, loading, installPrompt, markup, setMarkup }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error("useUser must be used within a UserProvider");
  return context;
};