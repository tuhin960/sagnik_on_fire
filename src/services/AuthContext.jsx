// FILE: src/services/AuthContext.jsx
//
// Bridges the two halves of Section 8's auth model:
//   Firebase Auth  -> proves identity (uid)
//   Firestore doc  -> decides role / specialId / which dashboard
//
// ProtectedRoute and the sidebar both read from this context so the
// "who is logged in + what can they see" logic lives in exactly one place.
//
// setFirebaseUser / setProfile are exposed so Signup/Login can hydrate
// this context immediately after a successful auth action, instead of
// waiting on the async onAuthStateChanged + Firestore round trip — that
// wait was the cause of the "redirects back to login right after
// creating an account" bug.

import { createContext, useContext, useEffect, useState } from "react";
import { watchAuthState } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // { role, specialId, name, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const doc = await getUserProfile(user.uid);
        setProfile(doc);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, setFirebaseUser, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}