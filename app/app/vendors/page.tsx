"use client";

import { useState } from "react";
import { Search, MapPin, Star, Phone, Instagram, Globe, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const VENDOR_CATEGORIES = [
  "Venue", "Catering", "Photography", "Decor", "Makeup", "Attire", "Planning", "Music", "Invitations", "Jewelry"
];

const MOCK_VENDORS = [
  { id: 1, name: "The Grand Regal", category: "Venue", city: "Mumbai", rating: 4.9, price: "₹₹₹", img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80" },
  { id: 2, name: "Spicy Palette", category: "Catering", city: "Delhi", rating: 4.7, price: "₹₹", img: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80" },
  { id: 3, name: "Lens & Love", category: "Photography", city: "Bangalore", rating: 5.0, price: "₹₹₹", img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80" },
  { id: 4, name: "Petals & Promises", category: "Decor", city: "Pune", rating: 4.8, price: "₹₹", img: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80" },
  { id: 5, name: "Glow by G", category: "Makeup", city: "Hyderabad", rating: 4.6, price: "₹₹", img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80" },
];

export default function VendorsPage() {
  const [activeCategory, setActiveCategory] = useState("Venue");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVendors = MOCK_VENDORS.filter(v => 
    v.category === activeCategory && 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-serif">Vendor Directory</h1>
        <p className="text-muted-foreground mt-2">Find and coordinate with the industry's finest.</p>
      </header>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          {VENDOR_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-sm font-medium transition-all relative ${
                activeCategory === cat ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 border rounded-2xl bg-card shadow-sm max-w-md">
          <Search size={18} className="text-muted-foreground" />
          <Input 
            placeholder={`Search ${activeCategory}s...`} 
            className="border-none shadow-none focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-muted text-muted-foreground">
            <h3 className="text-xl font-serif">No {activeCategory}s found</h3>
            <p>Try searching in another category or city.</p>
          </div>
        ) : (
          filteredVendors.map(vendor => (
            <motion.div
              layout
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group cursor-pointer"
            >
              <Card className="overflow-hidden rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardContent className="p-0 relative">
                  <div className="h-64 overflow-hidden">
                    <img 
                      src={vendor.img} 
                      alt={vendor.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star className="fill-yellow-400 text-yellow-400" size={14} /> {vendor.rating}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase mb-2 tracking-widest">
                      {vendor.category} <ShieldCheck size={12} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-1">{vendor.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
                      <MapPin size={14} /> {vendor.city} • {vendor.price}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <Button variant="outline" className="rounded-full flex items-center gap-2 h-10">
                        <Phone size={14} /> Contact
                       </Button>
                       <Button className="rounded-full shadow-lg h-10">
                        View Portfolio
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
