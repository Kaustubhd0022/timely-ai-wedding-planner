"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getRecommendedVendors, Vendor } from "@/lib/vendors";
import { ArrowLeft, MapPin, Star, ShieldCheck, Phone, Globe, Mail, Heart, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const USER_LOCATION = { lat: 40.7128, lng: -74.0060 };

export default function VendorDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [vendor, setVendor] = useState<(Vendor & { distance: number; score: number }) | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load vendor data
    // Usually we would fetch by ID, but since we are using getRecommendedVendors which returns all mock vendors,
    // we can just call it and find.
    const all = getRecommendedVendors(USER_LOCATION, "All", 1000); // large radius to ensure we find it
    const found = all.find(v => v.id === resolvedParams.id);
    
    if (found) {
      setVendor(found);
      
      // Fetch AI enrichment
      fetch("/api/vendors/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor: found }),
      })
      .then(res => res.json())
      .then(data => setInsight(data))
      .catch(console.error)
      .finally(() => setLoading(false));
      
    } else {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 pb-20 p-4 md:p-8">
         <div className="h-64 bg-stone-200 rounded-[2.5rem]" />
         <div className="h-10 bg-stone-200 rounded-full w-1/3" />
         <div className="h-32 bg-stone-200 rounded-[2rem]" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-32 space-y-4">
        <h2 className="text-3xl font-serif">Vendor not found</h2>
        <Button onClick={() => router.back()} variant="outline" className="rounded-full">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="text-muted-foreground hover:text-stone-900 absolute top-4 md:top-8 left-4 md:left-8 z-10 bg-white/50 backdrop-blur rounded-full px-4 h-10 shadow-sm border border-white/40"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Directory
      </Button>

      {/* Hero Header */}
      <div className="relative h-64 md:h-96 w-full rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl mt-4 md:mt-0 border-4 border-white">
        <img 
          src={vendor.image_url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"} 
          alt={vendor.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full w-max mb-3 border border-white/10 backdrop-blur-md">
                {vendor.category} <ShieldCheck size={14} />
              </div>
              <h1 className="text-4xl md:text-6xl font-serif text-white font-bold drop-shadow-lg">{vendor.name}</h1>
              <p className="text-white/80 font-medium text-lg flex items-center gap-2 mt-2">
                 <MapPin size={16} /> {vendor.address} <span className="text-white/40 font-bold px-2">•</span> <span className="text-primary">{vendor.distance.toFixed(1)} km away</span>
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button size="icon" className="rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white border border-white/30 h-12 w-12 shrink-0">
                 <Heart size={20} />
              </Button>
              <Button className="rounded-full bg-primary hover:bg-[#d4b568] text-primary-foreground text-lg px-8 py-6 shadow-xl w-full md:w-auto">
                 Request Quote
              </Button>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 px-2 md:px-0">
        
        {/* Main Info */}
        <div className="md:col-span-2 space-y-8">
          
          {/* AI Insights highlight */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="rounded-[2.5rem] border-none shadow-lg bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
              <CardContent className="p-8 md:p-10 relative z-10 space-y-6">
                 <div>
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400 mb-2">AI Expert Analysis</p>
                   <p className="text-2xl md:text-3xl font-serif text-stone-900 leading-tight">
                     "{insight?.tagline || 'Premium services tailored to your specialized needs.'}"
                   </p>
                 </div>
                 
                 <div className="bg-white/60 p-6 rounded-3xl border border-white/50 space-y-4">
                    <div>
                      <h4 className="font-bold text-stone-800 flex items-center gap-2 text-sm"><Star size={14} className="text-primary fill-primary"/> Why Choose Them</h4>
                      <p className="text-stone-600 font-medium mt-1 leading-relaxed">
                        {insight?.why_choose || 'Highly rated by couples for exceptional reliability and quality.'}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-stone-200/50">
                      <h4 className="font-bold text-stone-800 flex items-center gap-2 text-sm"><LayoutDashboard size={14} className="text-primary"/> The Vibe</h4>
                      <p className="text-stone-600 font-medium mt-1 leading-relaxed">
                        {insight?.description || `A top-tier ${vendor.category.toLowerCase()} expert ready to bring your vision to life.`}
                      </p>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-4">
             <h3 className="text-2xl font-serif text-stone-900">About {vendor.name}</h3>
             <p className="text-lg text-muted-foreground leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
             </p>
          </div>

        </div>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="rounded-[2rem] shadow-sm">
             <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Reputation Score</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-serif text-stone-900">{vendor.rating}</span>
                    <div className="flex pb-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={16} className={i <= Math.round(vendor.rating) ? "fill-yellow-400 text-yellow-400" : "fill-stone-100 text-stone-200"} />)}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-stone-500 mt-1">Based on {vendor.total_reviews} verified reviews</p>
                </div>
                
                <div className="space-y-4 pt-6 border-t font-medium text-sm text-stone-700">
                   <div className="flex items-center gap-3"><Phone size={16} className="text-stone-400" /> +1 (555) 123-4567</div>
                   <div className="flex items-center gap-3"><Mail size={16} className="text-stone-400" /> hello@{vendor.name.toLowerCase().replace(/[^a-z]/g, '')}.com</div>
                   <div className="flex items-center gap-3"><Globe size={16} className="text-stone-400" /> www.{vendor.name.toLowerCase().replace(/[^a-z]/g, '')}.com</div>
                </div>
             </CardContent>
           </Card>

           <Card className="rounded-[2rem] shadow-sm overflow-hidden">
             <CardContent className="p-0">
               <div className="h-48 bg-stone-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')" }} />
                  <MapPin size={40} className="text-primary absolute" />
               </div>
               <div className="p-5 text-sm font-medium text-stone-600 text-center bg-stone-50">
                  {vendor.address}
               </div>
             </CardContent>
           </Card>
        </div>

      </div>
    </div>
  );
}
