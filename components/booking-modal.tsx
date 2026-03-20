"use client";

import { useState } from "react";
import { X, Calendar, MessageSquare, Phone, User, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    id: string;
    name: string;
    category: string;
  };
  weddingId: string;
}

export function BookingModal({ isOpen, onClose, vendor, weddingId }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    event_type: "Wedding",
    event_date: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        wedding_id: weddingId,
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        event_type: formData.event_type,
        event_date: formData.event_date,
        notes: formData.notes,
        status: "pending"
      });

      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({ name: "", phone: "", event_type: "Wedding", event_date: "", notes: "" });
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to create booking request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors">
              <X size={24} />
            </button>

            {submitted ? (
              <div className="py-12 text-center space-y-6">
                <div className="h-20 w-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif text-stone-900">Request Sent!</h2>
                  <p className="text-stone-500">We've notified {vendor.name}. They'll reach out to you within 24 hours.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-serif text-stone-900">Book {vendor.name}</h2>
                  <p className="text-stone-500 mt-1">Securing your date requires a formal request.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1 flex items-center gap-1">
                        <User size={10} /> Your Name
                      </label>
                      <Input 
                        required 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="rounded-2xl border-stone-200 bg-stone-50/50" 
                        placeholder="Rahul Sharma"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1 flex items-center gap-1">
                        <Phone size={10} /> WhatsApp Number
                      </label>
                      <Input 
                        required 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="rounded-2xl border-stone-200 bg-stone-50/50" 
                        placeholder="+91..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1 flex items-center gap-1">
                         Event Type
                      </label>
                      <select 
                        className="w-full h-10 px-3 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm"
                        value={formData.event_type}
                        onChange={e => setFormData({...formData, event_type: e.target.value})}
                      >
                        <option>Wedding</option>
                        <option>Reception</option>
                        <option>Engagement</option>
                        <option>Sangeet / Mehendi</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1 flex items-center gap-1">
                        <Calendar size={10} /> Event Date
                      </label>
                      <Input 
                        required
                        type="date"
                        value={formData.event_date}
                        onChange={e => setFormData({...formData, event_date: e.target.value})}
                        className="rounded-2xl border-stone-200 bg-stone-50/50 h-10" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1 flex items-center gap-1">
                      <MessageSquare size={10} /> Special Notes
                    </label>
                    <textarea 
                      className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50/50 text-sm min-h-[100px]"
                      placeholder="Any specific requests or questions?"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-7 rounded-2xl bg-stone-900 hover:bg-black text-white text-lg font-serif shadow-xl shadow-stone-900/10"
                  >
                    {loading ? "Sending..." : "Submit Booking Request"}
                  </Button>
                  <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                    No payment required at this stage
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
