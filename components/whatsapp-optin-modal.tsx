import { useState } from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, MessageCircle, Bell, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function WhatsappOptInModal({ weddingId, currentOptIn, onUpdate }: { weddingId: string, currentOptIn?: boolean, onUpdate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [preference, setPreference] = useState("Daily");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      await supabase.from("weddings").update({
        whatsapp_number: phone,
        whatsapp_opt_in: true,
        notification_preference: preference,
      }).eq("id", weddingId);
      setOpen(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (currentOptIn) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
        <MessageCircle size={14} /> WhatsApp Enabled
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="rounded-full shadow-sm bg-stone-900 text-white hover:bg-stone-800 border-none px-6">
          <MessageCircle size={16} className="mr-2" /> Enable WhatsApp
        </Button>
      } />
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <DialogContent className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6 relative overflow-y-auto max-h-[90vh]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <DialogClose className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </DialogClose>

            <div className="space-y-2 text-center relative z-10">
              <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-serif text-stone-900">WhatsApp Assistant</DialogTitle>
              <DialogDescription className="text-muted-foreground max-w-xs mx-auto">
                Get smart reminders, weekly summaries, and alerts directly to your phone.
              </DialogDescription>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 text-stone-500 font-medium sm:text-sm">
                    +91
                  </span>
                  <Input 
                    type="tel"
                    placeholder="10-digit mobile number" 
                    className="rounded-l-none border-stone-200 focus-visible:ring-primary shadow-sm h-12"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Frequency</label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setPreference("Daily")}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${preference === "Daily" ? "border-green-500 bg-green-50/50" : "border-stone-200 hover:border-stone-300"}`}
                  >
                    <div className={`p-2 rounded-full ${preference === "Daily" ? "bg-green-100 text-green-600" : "bg-stone-100 text-stone-500"}`}>
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${preference === "Daily" ? "text-green-900" : "text-stone-700"}`}>Daily Updates</p>
                      <p className="text-xs text-stone-500">Daily "Next Best Action" at 9 AM.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setPreference("Weekly")}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${preference === "Weekly" ? "border-green-500 bg-green-50/50" : "border-stone-200 hover:border-stone-300"}`}
                  >
                    <div className={`p-2 rounded-full ${preference === "Weekly" ? "bg-green-100 text-green-600" : "bg-stone-100 text-stone-500"}`}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${preference === "Weekly" ? "text-green-900" : "text-stone-700"}`}>Weekly Summary</p>
                      <p className="text-xs text-stone-500">Every Monday overview of the week.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setPreference("Alerts")}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${preference === "Alerts" ? "border-green-500 bg-green-50/50" : "border-stone-200 hover:border-stone-300"}`}
                  >
                    <div className={`p-2 rounded-full ${preference === "Alerts" ? "bg-green-100 text-green-600" : "bg-stone-100 text-stone-500"}`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${preference === "Alerts" ? "text-green-900" : "text-stone-700"}`}>Important Alerts Only</p>
                      <p className="text-xs text-stone-500">Only when tasks are overdue or blocked.</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={loading || !phone} className="w-full rounded-xl h-12 text-md font-bold shadow-lg shadow-primary/20">
                {loading ? "Saving..." : "Confirm & Enable"}
              </Button>
              <p className="text-[10px] text-center text-stone-400 mt-4 uppercase tracking-widest font-black">
                We respect your privacy. No spam.
              </p>
            </div>
          </DialogContent>
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  );
}
