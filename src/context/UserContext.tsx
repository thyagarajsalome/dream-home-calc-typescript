import React, { createContext, useContext, useState, useEffect } from "react";
// FIX: Point to new config location
import { supabase } from "../config/supabaseClient";
import { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  hasPaid: boolean;
  setHasPaid: (status: boolean) => void;
  loading: boolean;
  installPrompt: any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // Pass the email to fetchProfile
      if (session?.user) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Pass the email to fetchProfile
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setHasPaid(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Updated to accept email for the admin check
  const fetchProfile = async (userId: string, email?: string) => {
    // ADMIN OVERRIDE FOR TESTING: Bypasses database and grants Pro access
    if (email === 'thyagaraja1983@gmail.com') {
      setHasPaid(true);
      return;
    }

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
    <UserContext.Provider value={{ user, hasPaid, setHasPaid, loading, installPrompt }}>
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