"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-media-query";

export function CinematicBackground() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-background">
      {isMobile ? (
        // Static Background for Mobile
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full bg-[#F8C8DC] opacity-[0.25] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-[#A8C3A0] opacity-[0.25] blur-[120px]" />
          <div className="absolute top-[30%] right-[10%] w-[70vw] h-[70vw] rounded-full bg-[#E6C97A] opacity-[0.15] blur-[90px]" />
        </div>
      ) : (
        // Dynamic Animated Background for Desktop
        <>
          {/* Soft gradient orb 1 - Blush Pink */}
          <motion.div
            animate={{
              x: [0, 50, -50, 0],
              y: [0, -50, 50, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#F8C8DC] opacity-[0.25] blur-[120px]"
          />
          
          {/* Soft gradient orb 2 - Sage Green */}
          <motion.div
            animate={{
              x: [0, -60, 40, 0],
              y: [0, 60, -40, 0],
              scale: [1, 1.2, 0.8, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#A8C3A0] opacity-[0.25] blur-[140px]"
          />

          {/* Soft gradient orb 3 - Soft Gold */}
          <motion.div
            animate={{
              x: [0, 40, -40, 0],
              y: [0, 30, -30, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#E6C97A] opacity-[0.15] blur-[100px]"
          />
        </>
      )}
      
      {/* Noise overlay for cinematic film grain feel */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
