"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { getRecommendedVendors, Vendor } from "@/lib/vendors";
import { VendorCard } from "@/components/vendor-card";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const VENDOR_CATEGORIES = [
  "All", "Venue", "Catering", "Photographer", "Decorator", "Makeup Artist"
];

// Mock user location for NYC
const USER_LOCATION = { lat: 40.7128, lng: -74.0060 };

export default function VendorsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState("Mumbai");
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [newCityInput, setNewCityInput] = useState("");

  useEffect(() => {
    const weddingId = localStorage.getItem("wedding_id");
    if (weddingId) {
      fetchWeddingCity(weddingId);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userCity) {
      fetchLiveVendors(userCity, activeCategory);
    }
  }, [userCity, activeCategory]);

  async function fetchWeddingCity(id: string) {
    try {
      const { data } = await supabase.from("weddings").select("user_city").eq("id", id).single();
      if (data?.user_city) {
        setUserCity(data.user_city);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchLiveVendors(city: string, category: string) {
    setLoading(true);
    try {
      const resp = await fetch("/api/vendors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, category })
      });
      const data = await resp.json();
      if (Array.isArray(data)) {
        setVendors(data);
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.error("Vendor search error:", err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLocation() {
    if (!newCityInput.trim()) return;
    const weddingId = localStorage.getItem("wedding_id");
    if (!weddingId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("weddings").update({ user_city: newCityInput }).eq("id", weddingId);
      if (error) throw error;
      
      setUserCity(newCityInput);
      setIsChangingLocation(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update location");
      setLoading(false);
    }
  }

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
            We've found the highest-rated vendors within 100km of {userCity}, ranked specifically for your profile.
          </p>
        </div>
        
        {isChangingLocation ? (
          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-full shadow-sm border border-primary/30">
            <Input 
              value={newCityInput}
              onChange={e => setNewCityInput(e.target.value)}
              placeholder="Enter city..."
              className="border-none shadow-none h-8 w-32 px-2 text-sm focus-visible:ring-0"
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs font-bold text-primary" onClick={handleUpdateLocation}>Save</Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs font-bold text-muted-foreground" onClick={() => setIsChangingLocation(false)}>Cancel</Button>
          </div>
        ) : (
          <div 
            onClick={() => { setNewCityInput(userCity); setIsChangingLocation(true); }}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm text-sm font-bold text-stone-600 border border-stone-100 cursor-pointer hover:border-primary/30 transition-all group"
          >
            <MapPin size={16} className="text-primary group-hover:scale-110 transition-transform" /> 
            {userCity}
            <span className="text-[10px] uppercase text-primary ml-1 font-black opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
          </div>
        )}
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
            <h3 className="text-2xl font-serif text-stone-800 mb-2">No recommendations found within 100km</h3>
            <p className="text-lg">Try widening your search or changing to a major city like Mumbai or Delhi.</p>
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

