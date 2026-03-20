"use client";

import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const FloatingRings3D = dynamic(() => import("@/components/floating-rings"), { ssr: false });

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-32 px-4 relative min-h-screen">
      <Suspense fallback={null}>
        <FloatingRings3D />
      </Suspense>

      <motion.div 
        style={{ y: y1, opacity }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-4xl mx-auto"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex items-center gap-3 mb-8 text-primary font-serif italic text-2xl"
        >
          <Heart size={24} className="fill-primary animate-pulse" />
          AI-Powered Wedding Orchestration
          <Sparkles size={24} />
        </motion.div>
        
        <h1 className="text-6xl md:text-8xl font-serif mb-8 tracking-tight leading-[1.1] text-foreground">
          Your Dream Wedding, <br />
          <span className="text-secondary italic">Orchestrated.</span>
        </h1>
        
        <p className="text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
          Experience calm luxury. Let Timely AI manage the complexities of your special day, 
          guiding you precisely when you need it.
        </p>

        <div className="flex gap-6">
          <Link
            href="/onboarding"
            className="px-10 py-5 rounded-full bg-primary text-primary-foreground text-xl font-bold transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 hover:bg-[#d4b568]"
          >
            Start Planning
          </Link>
          <Link
            href="/app"
            className="px-10 py-5 rounded-full glass border border-white/40 text-foreground text-xl font-medium hover:-translate-y-1 transition-all"
          >
            View Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
