"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      setMessage({ type: "success", text: "Check your email for the login link!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
      <div className="mx-auto w-full max-w-[400px] p-8 text-center glass rounded-[2rem] shadow-xl">
        <h1 className="text-4xl font-serif mb-2 text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground mb-8">Login to your wedding dashboard</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full p-4 rounded-xl border border-white/40 bg-white/60 outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition-all text-stone-800"
            required
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:shadow-lg hover:-translate-y-[1px] hover:bg-[#d4b568] transition-all disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? "Sending link..." : "Send Login Link"}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${
            message.type === "success" ? "bg-secondary/10 text-secondary" : "bg-red-50 text-red-600 border border-red-100"
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
