"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = [
  { id: "date", title: "The Big Day", description: "When is the celebration?" },
  { id: "events", title: "The Festivities", description: "Which events are we planning?" },
  { id: "guests", title: "The Guests", description: "How many loved ones are joining?" },
  { id: "details", title: "The Style", description: "Budget and Cultural Context" },
];

const EVENT_TYPES = [
  "Roka", "Engagement", "Mehendi", "Sangeet", "Haldi", "Cocktail", "Wedding", "Reception"
];

const CULTURAL_CONTEXTS = [
  "Hindu", "Muslim", "Sikh", "Christian", "Jain", "Parsi", "Inter-faith", "Other"
];

const BUDGET_RANGES = [
  "Under 10L", "10-25L", "25-50L", "50L-1Cr", "Above 1Cr"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [stageIndex, setStageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    wedding_date: "",
    events_selected: [] as string[],
    guest_count: 100,
    budget_range: "10-25L",
    cultural_context: "Hindu",
  });

  const nextStage = () => {
    if (stageIndex < STAGES.length - 1) {
      setStageIndex(stageIndex + 1);
    } else {
      handleFinalize();
    }
  };

  const prevStage = () => setStageIndex(Math.max(0, stageIndex - 1));

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/timeline/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await resp.json();
      if (data.success) {
        localStorage.setItem("wedding_id", data.wedding_id);
        router.push(`/app?wedding_id=${data.wedding_id}`);
      } else {
        alert("Failed to generate timeline: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while generating your timeline.");
    } finally {
      setLoading(false);
    }
  };

  const currentStage = STAGES[stageIndex];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indication */}
        <div className="mb-8 flex justify-between items-center px-2">
          {STAGES.map((s, i) => (
            <div 
              key={s.id}
              className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                i <= stageIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <motion.div 
          key={currentStage.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="premium-card min-h-[400px] flex flex-col"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-foreground mb-2">{currentStage.title}</h1>
            <p className="text-muted-foreground">{currentStage.description}</p>
          </div>

          <div className="flex-1">
            {stageIndex === 0 && (
              <input 
                type="date" 
                className="w-full p-4 rounded-xl border border-border bg-background text-lg focus:ring-2 focus:ring-primary outline-none"
                value={formData.wedding_date}
                onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
              />
            )}

            {stageIndex === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {EVENT_TYPES.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      const selected = formData.events_selected.includes(e)
                        ? formData.events_selected.filter(i => i !== e)
                        : [...formData.events_selected, e];
                      setFormData({ ...formData, events_selected: selected });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.events_selected.includes(e)
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {stageIndex === 2 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <span className="text-6xl font-serif text-primary">{formData.guest_count}</span>
                  <span className="text-muted-foreground text-xl ml-2">guests</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="1000" 
                  step="50"
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  value={formData.guest_count}
                  onChange={(e) => setFormData({ ...formData, guest_count: parseInt(e.target.value) })}
                />
              </div>
            )}

            {stageIndex === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2Caps uppercase tracking-wider">Cultural Context</label>
                  <select 
                    className="w-full p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                    value={formData.cultural_context}
                    onChange={(e) => setFormData({ ...formData, cultural_context: e.target.value })}
                  >
                    {CULTURAL_CONTEXTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Expected Budget</label>
                  <div className="grid grid-cols-1 gap-2">
                    {BUDGET_RANGES.map(b => (
                      <button
                        key={b}
                        onClick={() => setFormData({ ...formData, budget_range: b })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.budget_range === b
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between gap-4">
            <button 
              onClick={prevStage}
              disabled={stageIndex === 0}
              className="px-8 py-3 rounded-full border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 transition-all"
            >
              Back
            </button>
            <button 
              onClick={nextStage}
              disabled={loading || (stageIndex === 0 && !formData.wedding_date)}
              className="flex-1 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? "Generating..." : (stageIndex === STAGES.length - 1 ? "Generate My Timeline" : "Continue")}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
