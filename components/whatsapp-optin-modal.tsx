"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface WhatsAppOptinModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
}

export function WhatsAppOptinModal({ isOpen, onClose, weddingId }: WhatsAppOptinModalProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!phone || phone.replace(/\D/g, "").length !== 10) {
      alert("Please provide a valid 10-digit phone number.");
      return;
    }
    
    setLoading(true);
    try {
      const formattedPhone = `+91${phone.replace(/\D/g, "")}`;
      const { error } = await supabase.from("weddings").update({
        whatsapp_number: formattedPhone,
        whatsapp_opt_in: true,
      }).eq("id", weddingId);
      
      if (error) throw error;
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to enable WhatsApp updates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 rounded-[2.5rem] overflow-hidden border-none max-h-[90vh] flex flex-col focus:ring-0">
        <div className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
          <div className="relative h-44 bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center overflow-hidden">
            <motion.div 
               animate={{ 
                 scale: [1, 1.1, 1],
                 rotate: [0, 5, -5, 0]
               }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
               className="absolute inset-0 opacity-10"
            >
              <div className="w-full h-full border-[20px] border-white rounded-full opacity-20" />
            </motion.div>
            <div className="relative z-10 h-20 w-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
              <MessageSquare className="text-white fill-white" size={36} />
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-serif text-stone-900 tracking-tight">Stay Connected</h1>
              <p className="text-stone-500 font-medium text-sm">Get daily wedding updates and smart reminders directly on WhatsApp.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 pl-1">WhatsApp Number</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">+91</div>
                   <Input 
                     type="tel"
                     placeholder="99999 00000" 
                     className="rounded-2xl border-stone-200 h-12 bg-stone-50 pl-12 focus-visible:ring-primary shadow-sm" 
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                   />
                </div>
              </div>
              <Button 
                onClick={handleSave}
                disabled={loading || !phone}
                className="w-full h-14 rounded-2xl bg-stone-900 hover:bg-black text-white text-lg font-serif shadow-xl shadow-stone-900/10 transition-all active:scale-[0.98]"
              >
                {loading ? "Enabling..." : "Opt-in & Save"}
              </Button>
            </div>

            <p className="text-[10px] text-center text-stone-400 font-bold uppercase tracking-widest leading-relaxed">
              * We only send 1 daily digest. <br />You can opt-out anytime by typing "STOP".
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
