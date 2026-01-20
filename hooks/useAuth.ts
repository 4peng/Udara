"use client"

import {
    type User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithCredential,
} from "firebase/auth"
import { useEffect, useState } from "react"
import { auth } from "../config/firebase"
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { API_CONFIG } from "../config/api";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync user to backend on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      }
    })

    return unsubscribe
  }, [])

  const syncUserWithBackend = async (firebaseUser: User) => {
    try {
      // Prepare payload using Firebase UID as 'clerkUserId' (for backend compatibility)
      const payload = {
        clerkUserId: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
        phone: firebaseUser.phoneNumber || undefined,
        location: "Unknown" // Optional
      };

      console.log("🔄 Syncing user with backend:", payload.email);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("❌ Backend sync failed:", response.status);
      } else {
        const data = await response.json();
        console.log("✅ Backend sync success. MongoID:", data.user?.userId);
      }
    } catch (error) {
      console.error("❌ Error syncing user to backend:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const signInWithGoogle = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in to Google
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    logout,
    resetPassword,
  }
}
