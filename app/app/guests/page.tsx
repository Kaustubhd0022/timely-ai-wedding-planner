"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function GuestsContent() {
  const searchParams = useSearchParams();
  const [weddingId, setWeddingId] = useState<string | null>(searchParams.get("wedding_id"));
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");

  useEffect(() => {
    const id = searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (id) {
      setWeddingId(id);
      fetchGuests(id);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  async function fetchGuests(id: string) {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", id)
        .order("created_at", { ascending: false });
      setGuests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredGuests = guests.filter(g => {
    const matchesSearch = `${g.first_name} ${g.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = activeGroup === "All" || g.group_tag === activeGroup;
    return matchesSearch && matchesGroup;
  });

  const stats = {
    total: guests.length,
    attending: guests.filter(g => g.rsvp_status === "Attending").length,
    pending: guests.filter(g => g.rsvp_status === "Pending").length,
    declined: guests.filter(g => g.rsvp_status === "Declined").length,
  };

  const groups = Array.from(new Set(guests.map(g => g.group_tag).filter(Boolean)));

  if (!weddingId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          <Users size={40} />
        </div>
        <h2 className="text-3xl font-serif">No Guest List Found</h2>
        <p className="max-w-md text-muted-foreground">
          Start your planning journey to manage guests and RSVPs.
        </p>
        <Button onClick={() => window.location.href='/onboarding'} className="rounded-full px-8 py-6">
          Start AI Generation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif">Guest List</h1>
          <p className="text-muted-foreground mt-2">Manage RSVPs, groups, and special requests.</p>
        </div>
        <Button className="rounded-full px-6 py-6 shadow-lg shadow-primary/20">
          <UserPlus className="mr-2" size={18} /> Add Guest
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="premium-card">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Guests</p>
          <p className="text-4xl font-serif mt-2">{stats.total}</p>
        </Card>
        <Card className="premium-card">
          <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Attending</p>
          <p className="text-4xl font-serif mt-2 text-green-600">{stats.attending}</p>
        </Card>
        <Card className="premium-card">
          <p className="text-sm font-medium text-amber-600 uppercase tracking-wider">Pending</p>
          <p className="text-4xl font-serif mt-2 text-amber-600">{stats.pending}</p>
        </Card>
        <Card className="premium-card">
          <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Declined</p>
          <p className="text-4xl font-serif mt-2 text-red-600">{stats.declined}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
        <div className="flex-1 min-w-[300px] flex items-center gap-2 px-3 border rounded-xl bg-background">
          <Search size={18} className="text-muted-foreground" />
          <Input 
            placeholder="Search guests by name..." 
            className="border-none shadow-none focus-visible:ring-0 px-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["All", ...groups].map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeGroup === group 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-3xl animate-pulse" />)
          ) : filteredGuests.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted text-muted-foreground">
              <Users className="mx-auto mb-4 opacity-20" size={64} />
              <p className="text-xl font-serif">No guests found.</p>
              <p className="mt-1">Add your first guest to start tracking RSVPs.</p>
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <motion.div
                key={guest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="premium-card group hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-serif text-xl">
                    {guest.first_name[0]}{guest.last_name?.[0] || ""}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    guest.rsvp_status === 'Attending' ? 'bg-green-50 text-green-600 border-green-200' :
                    guest.rsvp_status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {guest.rsvp_status}
                  </div>
                </div>
                
                <h3 className="text-xl font-serif mb-1">{guest.first_name} {guest.last_name}</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{guest.group_tag}</p>
                
                <div className="mt-6 space-y-2 border-t pt-4">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} /> {guest.email}
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={14} /> {guest.phone}
                    </div>
                  )}
                  {guest.dietary_requirements && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 font-medium italic">
                      Note: {guest.dietary_requirements}
                    </div>
                  )}
                </div>
                
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon-sm" className="rounded-full">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function GuestsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading guests...</div>}>
      <GuestsContent />
    </Suspense>
  );
}
