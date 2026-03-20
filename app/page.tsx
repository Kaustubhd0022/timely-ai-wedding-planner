"use client";

import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-media-query";

const FloatingRings3D = dynamic(() => import("@/components/floating-rings"), { ssr: false });

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const { scrollY } = useScroll();
  
  // Conditionally disable parallax values for mobile
  const y1 = useTransform(scrollY, [0, 1000], [0, isMobile ? 0 : 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, isMobile ? 1 : 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 md:py-32 px-4 relative min-h-[100dvh]">
      {mounted && !isMobile && (
        <Suspense fallback={null}>
          <FloatingRings3D />
        </Suspense>
      )}

      <motion.div 
        style={mounted && !isMobile ? { y: y1, opacity } : {}}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-4xl mx-auto w-full"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-wrap justify-center items-center gap-2 md:gap-3 mb-6 md:mb-8 text-primary font-serif italic text-lg md:text-2xl w-full"
        >
          <Heart className="w-5 h-5 md:w-6 md:h-6 fill-primary animate-pulse" />
          <span>Plan your wedding, without the chaos</span>
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
        </motion.div>
        
        <h1 className="text-4xl sm:text-5xl md:text-8xl font-serif mb-6 md:mb-8 tracking-tight leading-[1.2] md:leading-[1.1] text-foreground">
          Plan your wedding, <br />
          <span className="text-secondary italic">without the chaos.</span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed md:leading-relaxed font-light px-2">
          Your AI wedding planner that thinks ahead. Experience calm luxury and let us guide you precisely when you need it.
        </p>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 md:gap-6 px-4 sm:px-0">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-full bg-primary text-primary-foreground text-lg md:text-xl font-bold transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 hover:bg-[#d4b568]"
          >
            Start Planning
          </Link>
          <Link
            href="/app"
            className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-full glass border border-white/40 text-foreground text-lg md:text-xl font-medium hover:-translate-y-1 transition-all"
          >
            View Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
