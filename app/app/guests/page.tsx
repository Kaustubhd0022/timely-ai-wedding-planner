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
  MoreVertical,
  X
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    group_tag: "Bride Side",
    role: "Family",
    rsvp_status: "Pending" as "Pending" | "Attending" | "Declined"
  });

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
      
      if (!data || data.length === 0) {
        await seedDemoData(id);
      } else {
        setGuests(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function seedDemoData(id: string) {
    const demoGuests = [
      { first_name: "Rahul", last_name: "Sharma", group_tag: "Groom Side", role: "Groom", rsvp_status: "Attending", phone: "9876543210" },
      { first_name: "Priya", last_name: "Patel", group_tag: "Bride Side", role: "Bride", rsvp_status: "Attending", phone: "9876501234" },
      { first_name: "Amit", last_name: "Verma", group_tag: "Groom Side", role: "Family", rsvp_status: "Pending" },
      { first_name: "Anjali", last_name: "Gupta", group_tag: "Bride Side", role: "Family", rsvp_status: "Attending" },
      { first_name: "Vikram", last_name: "Singh", group_tag: "Friends", role: "Family", rsvp_status: "Pending" },
      { first_name: "Neha", last_name: "Malhotra", group_tag: "Groom Side", role: "Family", rsvp_status: "Declined" },
      { first_name: "Sanjay", last_name: "Joshi", group_tag: "Bride Side", role: "Family", rsvp_status: "Pending" },
      { first_name: "Kiran", last_name: "Rao", group_tag: "Friends", role: "Family", rsvp_status: "Attending" },
      { first_name: "Deepak", last_name: "Desai", group_tag: "Groom Side", role: "Family", rsvp_status: "Pending" },
      { first_name: "Meera", last_name: "Nair", group_tag: "Bride Side", role: "Family", rsvp_status: "Attending" },
    ].map(g => ({ ...g, wedding_id: id }));

    const { data, error } = await supabase.from("guests").insert(demoGuests).select();
    if (!error && data) setGuests(data);
  }

  const handleSaveGuest = async () => {
    if (!weddingId) return;
    setIsSaving(true);
    try {
      if (editingGuest) {
        const { error } = await supabase.from("guests").update(formData).eq("id", editingGuest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guests").insert({ ...formData, wedding_id: weddingId });
        if (error) throw error;
      }
      await fetchGuests(weddingId);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to save guest");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await supabase.from("guests").delete().eq("id", id);
      setGuests(guests.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (guest: any) => {
    setEditingGuest(guest);
    setFormData({
      first_name: guest.first_name,
      last_name: guest.last_name || "",
      phone: guest.phone || "",
      email: guest.email || "",
      group_tag: guest.group_tag || "Bride Side",
      role: guest.role || "Family",
      rsvp_status: guest.rsvp_status as any
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingGuest(null);
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      group_tag: "Bride Side",
      role: "Family",
      rsvp_status: "Pending"
    });
  };

  const handleWhatsAppInvite = (guest: any) => {
    if (!guest.phone) return alert("No phone number provided");
    const message = `Namaste ${guest.first_name}! You're invited to our wedding celebration. Please RSVP here: ${window.location.origin}/rsvp?id=${guest.id}`;
    window.open(`https://wa.me/91${guest.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, "_blank");
  };

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

  const groups = ["Bride Side", "Groom Side", "Friends"];

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
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif">Guest List</h1>
          <p className="text-muted-foreground mt-2">Manage RSVPs, groups, and special requests.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full md:w-auto rounded-full px-6 py-4 md:py-6 shadow-lg shadow-primary/20">
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

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
        <div className="w-full flex-1 min-w-[300px] flex items-center gap-2 px-3 border rounded-xl bg-background">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <Input 
            placeholder="Search guests by name..." 
            className="border-none shadow-none focus-visible:ring-0 px-0 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["All", ...groups].map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-grow sm:flex-grow-0 text-center ${
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
                className="premium-card group hover:border-primary/30 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-serif text-xl cursor-pointer" onClick={() => openEditModal(guest)}>
                    {guest.first_name[0]}{guest.last_name?.[0] || ""}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    guest.rsvp_status === 'Attending' ? 'bg-green-50 text-green-600 border-green-200' :
                    guest.rsvp_status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {guest.rsvp_status}
                  </div>
                </div>
                
                <h3 className="text-xl font-serif mb-1">{guest.first_name} {guest.last_name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">{guest.group_tag}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">{guest.role}</span>
                </div>
                
                <div className="mt-6 flex flex-col gap-2 border-t pt-4">
                  {guest.phone && (
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleWhatsAppInvite(guest)}
                    className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest border-green-200 hover:bg-green-50 text-green-600"
                   >
                     Invite via WhatsApp
                   </Button>
                  )}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(guest)} className="flex-1 text-[10px] font-black uppercase tracking-widest">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGuest(guest.id)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600">Delete</Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Guest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif">{editingGuest ? "Edit Guest" : "Add New Guest"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">First Name</label>
                  <Input value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Name</label>
                  <Input value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp Number</label>
                <Input placeholder="91..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Group</label>
                  <select className="w-full p-2 rounded-xl border" value={formData.group_tag} onChange={e => setFormData({...formData, group_tag: e.target.value})}>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</label>
                  <select className="w-full p-2 rounded-xl border" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    {["Bride", "Groom", "Family"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RSVP Status</label>
                <div className="flex gap-2">
                  {["Pending", "Attending", "Declined"].map(s => (
                    <button key={s} onClick={() => setFormData({...formData, rsvp_status: s as any})} className={`flex-1 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${formData.rsvp_status === s ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-transparent'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleSaveGuest} disabled={isSaving} className="w-full py-6 rounded-2xl shadow-xl shadow-primary/20">
              {isSaving ? "Saving..." : (editingGuest ? "Update Guest" : "Add to List")}
            </Button>
          </motion.div>
        </div>
      )}
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
