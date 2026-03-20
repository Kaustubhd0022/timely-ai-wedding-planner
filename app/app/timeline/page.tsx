"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Circle, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

function TimelineContent() {
  const searchParams = useSearchParams();
  const [weddingId, setWeddingId] = useState<string | null>(searchParams.get("wedding_id"));
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState("All");
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const id = searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (id) {
      setWeddingId(id);
      localStorage.setItem("wedding_id", id);
      fetchData(id);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  async function fetchData(id: string) {
    setLoading(true);
    try {
      const { data: weddingData } = await supabase
        .from("weddings")
        .select("events_selected")
        .eq("id", id)
        .single();
      
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("wedding_id", id)
        .order("deadline_date", { ascending: true });

      setEvents(weddingData?.events_selected || []);
      setTasks(tasksData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Done" ? "Todo" : "Done";
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);
  };

  const filteredTasks = tasks.filter(t => activeEvent === "All" || t.event_type === activeEvent);

  if (loading) {
    return <div className="space-y-4">
      {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
    </div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif">Planning Timeline</h1>
          <p className="text-muted-foreground mt-2">Your week-by-week guide to the perfect wedding.</p>
        </div>
        <div className="flex gap-2">
          {["All", ...events].map((e) => (
            <button
              key={e}
              onClick={() => setActiveEvent(e)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                activeEvent === e 
                  ? "bg-primary text-white border-primary" 
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <Calendar className="mx-auto text-muted mb-4" size={48} />
            <h3 className="text-xl font-serif">No tasks found for this event</h3>
            <p className="text-muted-foreground">Try selecting a different category or wait for the generator.</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`group flex items-center gap-6 p-6 rounded-[2rem] border bg-card/50 hover:bg-card transition-all ${
                task.status === "Done" ? "opacity-60" : "shadow-sm"
              }`}
            >
              <button 
                onClick={() => toggleTask(task.id, task.status)}
                className={`transition-colors ${
                  task.status === "Done" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {task.status === "Done" ? <CheckCircle2 size={32} /> : <Circle size={32} />}
              </button>
              
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-1 ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}>
                  {task.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(task.deadline_date).toLocaleDateString()}</span>
                  <span className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{task.category}</span>
                </div>
              </div>

              <ChevronRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading timeline...</div>}>
      <TimelineContent />
    </Suspense>
  );
}
