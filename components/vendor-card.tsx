"use client";

import { useEffect, useState } from "react";
import { Star, MapPin, ChevronRight, Activity, Sparkles, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BookingModal } from "@/components/booking-modal";

interface VendorCardProps {
  vendor: any;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const router = useRouter();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);

  useEffect(() => {
    setWeddingId(localStorage.getItem("wedding_id"));
  }, []);

  const handleBookingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookingOpen(true);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group cursor-pointer relative h-full"
        onClick={() => router.push(`/app/vendors/${vendor.id}`)}
      >
        <Card className="overflow-hidden rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm h-full flex flex-col">
          <CardContent className="p-0 relative flex flex-col h-full">
            <div className="h-56 relative overflow-hidden">
              <img 
                src={vendor.image || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"} 
                alt={vendor.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {vendor.rating >= 4.5 && (
                  <div className="bg-amber-400 text-stone-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                    <Tag size={10} className="fill-stone-900" /> High Demand
                  </div>
                )}
                <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                  {vendor.category}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="max-w-[70%] text-left">
                    <h3 className="text-2xl font-serif font-bold text-white drop-shadow-md leading-tight">{vendor.name}</h3>
                    <div className="flex items-center gap-1.5 text-white/80 text-[10px] font-bold uppercase tracking-wider mt-1">
                      <MapPin size={12} className="text-primary" /> {vendor.address?.split(",")[0] || "Local Expert"}
                    </div>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1 shadow-2xl text-stone-800 scale-110">
                    <Star className="fill-yellow-400 text-yellow-400" size={14} /> 
                    {vendor.rating} <span className="text-stone-400 font-medium text-[10px]">({vendor.total_reviews})</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="space-y-3 flex-1 text-left">
                <p className="text-sm text-stone-600 leading-relaxed font-medium">
                  {vendor.description}
                </p>
                
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-[1.5rem] relative overflow-hidden group/why">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Why choose this</span>
                  </div>
                  <p className="text-xs text-stone-700 font-bold leading-relaxed relative z-10">
                    {vendor.why_choose}
                  </p>
                  <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-primary/10 rounded-full blur-xl group-hover/why:scale-150 transition-transform duration-700" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button 
                  onClick={handleBookingClick}
                  className="flex-1 rounded-2xl bg-stone-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest h-12 shadow-xl shadow-stone-900/10 active:scale-95 transition-all"
                >
                  Book Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleBookingClick}
                  className="rounded-2xl border-stone-200 text-stone-600 px-4 h-12 hover:bg-stone-50 active:scale-95 transition-all shadow-sm"
                >
                  <Activity size={18} />
                </Button>
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
