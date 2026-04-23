import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { User } from "@supabase/supabase-js";

export type PlanTier = 'free' | 'basic' | 'standard' | 'pro';

interface UserContextType {
  user: User | null;
  role: string; // Added role field
  hasPaid: boolean; // Kept for backward compatibility
  planTier: PlanTier;
  tierValue: number;
  setHasPaid: (status: boolean) => void;
  loading: boolean;
  installPrompt: any;
  markup: number;
  setMarkup: (val: number) => void;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('user'); // Added role state
  const [hasPaid, setHasPaid] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTier>('free');
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [markup, setMarkup] = useState(0);

  // Helper to easily check hierarchy: free=0, basic=1, standard=2, pro=3
  const tierValue = { free: 0, basic: 1, standard: 2, pro: 3 }[planTier];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_paid, plan_tier, role') // Added role to the select query
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) console.error("Error fetching profile:", error);
      
      setHasPaid(data?.has_paid || false);
      // Fallback to 'pro' if they paid previously before we added tiers
      setPlanTier(data?.plan_tier || (data?.has_paid ? 'pro' : 'free'));
      setRole(data?.role || 'user'); // Set the user role
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      setHasPaid(false);
      setPlanTier('free');
      setRole('user');
    }
  };

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
        setPlanTier('free');
        setRole('user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, role, hasPaid, planTier, tierValue, setHasPaid, loading, installPrompt, markup, setMarkup, 
      refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve() 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error("useUser must be used within a UserProvider");
  return context;
};