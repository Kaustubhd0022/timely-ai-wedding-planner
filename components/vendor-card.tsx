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

import { BookingModal } from "@/components/booking-modal";
import { Tag } from "lucide-react";

export function VendorCard({ vendor }: VendorCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);

  useEffect(() => {
    setWeddingId(localStorage.getItem("wedding_id"));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchEnrichment = useCallback(async () => {
    try {
      const [enrichRes, recommendRes] = await Promise.all([
        fetch("/api/vendors/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor }),
        }),
        fetch("/api/ai/vendor-recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor }),
        })
      ]);

      if (enrichRes.ok) {
        const data = await enrichRes.json();
        setInsight(data);
      }
      if (recommendRes.ok) {
        const data = await recommendRes.json();
        setRecommendation(data.recommendation);
      }
    } catch (err) {
      console.error("Failed to fetch vendor AI data");
    } finally {
      setLoading(false);
    }
  }, [vendor]);

  useEffect(() => {
    if (inView) fetchEnrichment();
  }, [inView, fetchEnrichment]);

  const handleBookingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookingOpen(true);
  };

  return (
    <>
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
              
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  {vendor.distance.toFixed(1)} km away
                </div>
                {vendor.rating >= 4.7 && (
                  <div className="bg-amber-400 text-stone-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md animate-pulse">
                    <Tag size={10} className="fill-stone-900" /> High Demand
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-serif font-bold text-white drop-shadow-md">{vendor.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary/80 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full w-max mt-1">
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
              ) : (
                <div className="space-y-3 flex-1">
                   {recommendation && (
                     <p className="text-[11px] font-bold text-stone-800 italic border-l-2 border-primary pl-3 bg-primary/5 py-1.5 rounded-r">
                       “{recommendation}”
                     </p>
                   )}
                   {insight && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Expert Insight</p>
                      <p className="text-xs text-stone-600 leading-relaxed font-medium line-clamp-2">
                        {insight.why_choose}
                      </p>
                    </div>
                   )}
                </div>
              )}
              
              <div className="mt-5 space-y-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBookingClick}
                    className="flex-1 rounded-2xl bg-stone-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest h-10 shadow-lg shadow-stone-900/10"
                  >
                    Book Now
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleBookingClick}
                    className="flex-1 rounded-2xl border-stone-200 text-stone-600 text-[10px] font-black uppercase tracking-widest h-10 hover:bg-stone-50"
                  >
                    Callback
                  </Button>
                </div>
                <div className="flex justify-between items-center border-t border-stone-200/60 pt-3">
                  <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    <MapPin size={10} className="text-stone-400" /> {vendor.address.split(",")[0]}
                  </div>
                  <Button variant="ghost" className="rounded-full text-primary hover:text-primary hover:bg-primary/10 px-2 h-6 text-[10px] font-black uppercase tracking-widest">
                      Details <ChevronRight size={12} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {weddingId && (
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
          vendor={vendor} 
          weddingId={weddingId} 
        />
      )}
    </>
  );
}
