"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Star, MapPin, ShieldCheck, ChevronRight, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Vendor } from "@/lib/vendors";
import { useRouter } from "next/navigation";

interface VendorCardProps {
  vendor: Vendor & { distance: number; score: number };
}

export function VendorCard({ vendor }: VendorCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Only trigger AI enrichment when card enters the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Only fire once
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchInsight = useCallback(async () => {
    try {
      const res = await fetch("/api/vendors/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsight(data);
      }
    } catch (err) {
      console.error("Failed to fetch insight");
    } finally {
      setLoading(false);
    }
  }, [vendor]);

  useEffect(() => {
    if (inView) fetchInsight();
  }, [inView, fetchInsight]);

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer relative"
      onClick={() => router.push(`/app/vendors/${vendor.id}`)}
    >
      <Card className="overflow-hidden rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0 relative flex flex-col h-full">
          <div className="h-48 relative overflow-hidden">
            <img 
              src={vendor.image_url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"} 
              alt={vendor.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
              {vendor.distance.toFixed(1)} km away
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
               <div>
                  <h3 className="text-2xl font-serif font-bold text-white drop-shadow-md">{vendor.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary/80 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full w-max mt-1">
                    {vendor.category} <ShieldCheck size={12} />
                  </div>
               </div>
               <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md text-stone-800">
                  <Star className="fill-yellow-400 text-yellow-400" size={14} /> 
                  {vendor.rating} <span className="text-stone-400 font-medium">({vendor.total_reviews})</span>
               </div>
            </div>
          </div>
          
          <div className="p-5 md:p-6 flex-1 flex flex-col bg-stone-50/50">
            {loading ? (
              <div className="space-y-3 animate-pulse py-2">
                 <div className="h-4 bg-stone-200 rounded w-3/4" />
                 <div className="h-3 bg-stone-200 rounded w-full" />
                 <div className="h-3 bg-stone-200 rounded w-2/3" />
              </div>
            ) : insight ? (
              <div className="space-y-3 flex-1">
                 <p className="text-sm font-bold text-stone-800 italic border-l-2 border-primary pl-3 bg-gradient-to-r from-primary/10 to-transparent py-1.5 rounded-r flex items-start gap-2">
                    <span className="text-primary text-lg leading-none">“</span>
                    {insight.tagline}
                    <span className="text-primary text-lg leading-none">”</span>
                 </p>
                 <div className="space-y-1">
                   <p className="text-xs font-black uppercase tracking-widest text-stone-400 flex items-center gap-1">
                      <Activity size={10} className="text-secondary" /> Why Choose Them
                   </p>
                   <p className="text-sm text-stone-600 leading-relaxed font-medium">
                     {insight.why_choose}
                   </p>
                 </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                 <p className="text-sm text-stone-500 italic">Premium {vendor.category.toLowerCase()} services tailored to your needs.</p>
              </div>
            )}
            
            <div className="mt-5 border-t border-stone-200/60 pt-4 flex justify-between items-center">
               <div className="flex items-center gap-1 text-muted-foreground text-[10px] sm:text-xs font-bold">
                 <MapPin size={12} className="text-stone-400" /> {vendor.address}
               </div>
               <Button variant="ghost" className="rounded-full text-primary hover:text-primary hover:bg-primary/10 pl-4 pr-2 h-8 text-xs font-bold uppercase tracking-widest">
                  Details <ChevronRight size={14} />
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
