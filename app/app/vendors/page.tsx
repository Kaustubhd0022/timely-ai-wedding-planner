"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { getRecommendedVendors, Vendor } from "@/lib/vendors";
import { VendorCard } from "@/components/vendor-card";

const VENDOR_CATEGORIES = [
  "All", "Venue", "Catering", "Photographer", "Decorator", "Makeup Artist"
];

// Mock user location for NYC
const USER_LOCATION = { lat: 40.7128, lng: -74.0060 };

export default function VendorsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<(Vendor & { distance: number; score: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd get location from browser: navigator.geolocation.getCurrentPosition
    // For now, we simulate fetching ranked vendors
    setLoading(true);
    setTimeout(() => {
      const results = getRecommendedVendors(USER_LOCATION, activeCategory);
      setVendors(results);
      setLoading(false);
    }, 400); // simulate network delay
  }, [activeCategory]);

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 bg-gradient-to-r from-primary/10 to-transparent p-6 md:p-8 rounded-[2.5rem] mt-4 border border-primary/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="h-1 w-6 bg-primary rounded-full" />
             <p className="text-primary font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-1">
               <Sparkles size={12} /> AI-Powered Matchmaking
             </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight">Curated Local Experts</h1>
          <p className="text-muted-foreground text-lg mt-2 max-w-lg">
            We've found the highest-rated vendors within 100km, ranked specifically for your profile.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-stone-600 border border-stone-100">
          <MapPin size={16} className="text-primary" /> New York City
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2 pb-2">
          {VENDOR_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm ${
                activeCategory === cat ? "bg-stone-900 text-white shadow-md transform scale-105" : "bg-white text-stone-500 hover:text-stone-900 hover:bg-stone-50 border border-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border rounded-full bg-white shadow-sm max-w-md focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <Input 
            placeholder={`Search recommended ${activeCategory !== "All" ? activeCategory.toLowerCase() + "s" : "vendors"}...`} 
            className="border-none shadow-none focus-visible:ring-0 p-0 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-96 rounded-[2.5rem] bg-stone-100 animate-pulse border border-stone-200" />
          ))
        ) : filteredVendors.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-200 text-muted-foreground">
            <h3 className="text-2xl font-serif text-stone-800 mb-2">No recommendations found</h3>
            <p className="text-lg">Try widening your search or changing the category.</p>
          </div>
        ) : (
          filteredVendors.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))
        )}
      </div>
    </div>
  );
}
