"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { BUTTON_PRIMARY } from "../styles/styles";
import { motion } from "framer-motion";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

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

  const handleLogin = async () => {
    // Prefer a fixed base URL to avoid preview subdomain issues
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${base}/dashboard`,
      },
    });
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center bg-slate-200">
      <h1 className="text-5xl font-extrabold mb-8 text-slate-700 flex items-center gap-3">
        🐌 StudyTrail
      </h1>

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
