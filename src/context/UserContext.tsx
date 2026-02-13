import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig"; // Ensure this path matches your firebase setup
import { onAuthStateChanged, User } from "firebase/auth";
import { supabase } from "../supabaseClient"; // Used to fetch profile data from DB

interface UserContextType {
  user: User | null;
  hasPaid: boolean;
  setHasPaid: (status: boolean) => void;
  loading: boolean;
  installPrompt: any; // For PWA
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // 1. PWA Install Prompt Logic
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

  // 2. Firebase Auth Observer
  useEffect(() => {
    // onAuthStateChanged is the Firebase equivalent of onAuthStateChange
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setHasPaid(false);
        setLoading(false);
      }
      // If user exists, loading remains true until fetchUserProfile finishes below
    });

    return () => unsubscribe();
  }, []);

  // 3. Fetch "has_paid" status from Supabase DB using Firebase UID
  useEffect(() => {
    const fetchUserProfile = async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("has_paid")
          .eq("id", uid) // We assume Firebase UID matches the 'id' in your profiles table
          .single();

        if (data) {
          setHasPaid(data.has_paid);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile(user.uid);
    }
  }, [user]);

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
