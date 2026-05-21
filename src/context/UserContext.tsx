import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../config/supabaseClient";
import { User } from "@supabase/supabase-js";

export type PlanTier = 'free' | 'basic' | 'standard' | 'pro';

interface UserContextType {
  user: User | null;
  role: string;
  hasPaid: boolean; 
  planTier: PlanTier;
  tierValue: number;
  credits: number; // Added credits field
  setHasPaid: (status: boolean) => void;
  loading: boolean;
  installPrompt: any;
  markup: number;
  setMarkup: (val: number) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('user');
  const [hasPaid, setHasPaid] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTier>('free');
  const [credits, setCredits] = useState<number>(0); // Added credits state
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [markup, setMarkup] = useState(0);

  const tierValue = { free: 0, basic: 1, standard: 2, pro: 3 }[planTier];

  // Refs to prevent duplicate profile queries in parallel and resolve race conditions
  const profilePromiseRef = useRef<Promise<void> | null>(null);
  const fetchedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const fetchProfile = (userId: string): Promise<void> => {
    // If the profile for this user has already been fetched, return a resolved promise immediately
    if (fetchedUserIdRef.current === userId) {
      return Promise.resolve();
    }
    
    // If a profile request is already in-flight for this user, share that existing promise
    if (profilePromiseRef.current) {
      return profilePromiseRef.current;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_paid, plan_tier, role, credits') // Added credits to selection
          .eq('id', userId)
          .maybeSingle(); 
        
        if (error) console.error("Error fetching profile:", error);
        
        setHasPaid(data?.has_paid || false);
        setPlanTier(data?.plan_tier || (data?.has_paid ? 'pro' : 'free'));
        setRole(data?.role || 'user');
        setCredits(data?.credits || 0); // Set the credit count from DB
        fetchedUserIdRef.current = userId;
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        setHasPaid(false);
        setPlanTier('free');
        setRole('user');
        setCredits(0); // Reset credits on error
      } finally {
        profilePromiseRef.current = null;
      }
    })();

    profilePromiseRef.current = promise;
    return promise;
  };

  useEffect(() => {
    let active = true;

    // 1. Fetch current session once on load
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initializeAuth();

    // 2. Setup subscription to react to changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      
      try {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          // Shared promise logic ensures we don't trigger a secondary profile request in parallel
          await fetchProfile(sessionUser.id);
        } else {
          // Reset local states on sign out
          fetchedUserIdRef.current = null;
          setHasPaid(false);
          setPlanTier('free');
          setRole('user');
          setCredits(0); // Reset credits on logout
        }
      } catch (err) {
        console.error("onAuthStateChange error:", err);
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    if (user) {
      fetchedUserIdRef.current = null; // Invalidate cached user ID to force a fresh fetch
      await fetchProfile(user.id);
    }
  };

  const handleSignOut = async () => {
    // 1. Immediately reset React state and clear storage synchronously to make UI responsive
    setUser(null);
    setHasPaid(false);
    setPlanTier('free');
    setRole('user');
    setCredits(0);
    fetchedUserIdRef.current = null;

    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith("sb-"))
        .forEach(key => localStorage.removeItem(key));
      Object.keys(sessionStorage)
        .filter(key => key.startsWith("sb-"))
        .forEach(key => sessionStorage.removeItem(key));
    } catch (err) {
      console.error("Error clearing storage on logout:", err);
    }

    // 2. Perform fire-and-forget Supabase sign out in the background
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out from supabase:", err);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, role, hasPaid, planTier, tierValue, credits, // Exposed credits to the app
      setHasPaid, loading, installPrompt, markup, setMarkup, 
      refreshProfile: handleManualRefresh,
      signOut: handleSignOut
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