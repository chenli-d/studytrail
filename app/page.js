"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { BUTTON_PRIMARY } from "../styles/styles";
import { motion } from "framer-motion";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Check if a user session already exists on page load.
  // If logged in, immediately redirect to the dashboard.
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        router.push("/dashboard");
      }
    };
    getUser();
  }, [router]);

  // Trigger GitHub OAuth login flow.
  // No redirectTo is needed here because Supabase uses
  // the Site URL and Redirect URLs configured in the dashboard.
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  // Listen for authentication state changes (sign in / sign out).
  // When the user successfully signs in, redirect them to the dashboard.
  // When signed out, clear the local user state.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          setUser(session.user);
          router.push("/dashboard");
        }
        if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-slate-200">
      {/* App title */}
      <h1 className="text-5xl font-extrabold mb-8 text-slate-700 flex items-center gap-3">
        🐌 StudyTrail
      </h1>

      {/* Welcome text with waving hand animation */}
      <motion.p
        className="mb-6 text-2xl text-slate-700 flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [20, -5, 0] }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
      >
        <motion.span
          style={{ display: "inline-block", transformOrigin: "70% 70%" }}
          animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          👋
        </motion.span>
        Welcome! Please sign in to continue.
      </motion.p>

      {/* GitHub login button */}
      <motion.button
        onClick={handleLogin}
        className={`${BUTTON_PRIMARY} px-6 py-3 text-lg`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Sign in with GitHub
      </motion.button>
    </main>
  );
}
