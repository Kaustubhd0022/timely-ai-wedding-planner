"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Filter, Search, CheckCircle2, Circle, Clock, AlertTriangle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { NewTaskModal } from "@/components/new-task-modal";
import { isTaskBlocked, getBlockers } from "@/lib/orchestrator";

function TasksContent() {
  const searchParams = useSearchParams();
  const [weddingId, setWeddingId] = useState<string | null>(searchParams.get("wedding_id"));
  const [tasks, setTasks] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (id) {
      setWeddingId(id);
      localStorage.setItem("wedding_id", id);
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  async function fetchTasks() {
    const id = searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (!id) return;

    setLoading(true);
    try {
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("wedding_id", id)
        .order("deadline_date", { ascending: true });
      setTasks(tasksData || []);

      const { data: depsData } = await supabase
        .from("task_dependencies")
        .select("*")
        .in("task_id", tasksData?.map((t: any) => t.id) || []);
      setDependencies(depsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleTask = async (taskId: string, currentStatus: string) => {
    if (isTaskBlocked(taskId, tasks, dependencies)) return;
    const newStatus = currentStatus === "Done" ? "Todo" : "Done";
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  };

  const delayTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Shift deadline by 7 days
    const newDeadline = new Date(task.deadline_date);
    newDeadline.setDate(newDeadline.getDate() + 7);
    
    // Find dependent tasks and push them
    const depsOfThis = dependencies.filter(d => d.depends_on_id === taskId).map(d => d.task_id);
    const updates = [{ id: taskId, deadline_date: newDeadline.toISOString().split('T')[0] }];
    
    for (const depId of depsOfThis) {
      const depTask = tasks.find(t => t.id === depId);
      if (depTask) {
        const depDeadline = new Date(depTask.deadline_date);
        depDeadline.setDate(depDeadline.getDate() + 7);
        updates.push({ id: depId, deadline_date: depDeadline.toISOString().split('T')[0] });
      }
    }

    setTasks(tasks.map(t => {
      const update = updates.find(u => u.id === t.id);
      return update ? { ...t, deadline_date: update.deadline_date } : t;
    }));

    // Optimistic UI, background update
    for (const update of updates) {
      supabase.from("tasks").update({ deadline_date: update.deadline_date }).eq("id", update.id).then();
    }
    
    setNotification("⚡ We've adjusted your plan based on recent changes.");
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || t.status === activeFilter || t.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const categories = Array.from(new Set(tasks.map(t => t.category)));

  if (!weddingId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          <Clock size={40} />
        </div>
        <h2 className="text-3xl font-serif">No Tasks Found</h2>
        <p className="max-w-md text-muted-foreground">
          You need to generate your wedding timeline first. 
          Use our AI engine to get 50+ custom tasks in seconds.
        </p>
        <Button onClick={() => window.location.href='/onboarding'} className="rounded-full px-8 py-6">
          Start AI Generation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 w-max"
          >
            <span className="text-xl">⚡</span>
            <span className="font-medium text-sm">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif">Task Manager</h1>
          <p className="text-muted-foreground mt-2">Personalized planning journey for your special day.</p>
        </div>
        <div className="w-full md:w-auto">
          <NewTaskModal weddingId={weddingId || ""} onTaskCreated={fetchTasks} />
        </div>
      </header>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border shadow-sm">
        <div className="w-full sm:flex-1 min-w-[300px] flex items-center gap-2 px-3 border rounded-xl bg-background">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <Input 
            placeholder="Search tasks (e.g. Venue, Catering...)" 
            className="border-none shadow-none focus-visible:ring-0 px-0 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-hide">
          {["All", "Todo", "Done", ...categories].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted text-muted-foreground">
              <AlertTriangle className="mx-auto mb-4" size={48} />
              <p className="text-lg font-serif">No tasks found matching your filters.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const blocked = isTaskBlocked(task.id, tasks, dependencies);
              const blockers = blocked ? getBlockers(task.id, tasks, dependencies) : [];

              return (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-6 rounded-[2rem] border bg-card/60 backdrop-blur-md transition-all duration-500 ease-out ${
                  task.status === "Done" ? "opacity-60 grayscale-[0.5]" : 
                  blocked ? "opacity-30 grayscale bg-muted/20 border-dashed" : "shadow-sm border-white/40 hover:bg-white/80 hover:shadow-xl sm:hover:-translate-y-1"
                }`}
              >
                <button 
                  disabled={blocked}
                  onClick={() => toggleTask(task.id, task.status)}
                  className={`relative transition-all duration-300 ${blocked ? "" : "hover:scale-110 active:scale-95"} ${
                    task.status === "Done" ? "text-secondary" : "text-muted-foreground hover:text-secondary"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {task.status === "Done" ? (
                      <motion.div 
                        key="done"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                         <CheckCircle2 size={36} />
                      </motion.div>
                    ) : blocked ? (
                      <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Lock size={36} className="opacity-50" />
                      </motion.div>
                    ) : (
                      <motion.div key="todo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Circle size={36} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                
                <div className="flex-1 w-full">
                  <h3 className={`text-xl font-bold mb-1 ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}>
                    {task.name} {blocked && <span className="text-[10px] font-bold uppercase tracking-wider bg-muted-foreground/10 px-2 py-0.5 rounded text-muted-foreground ml-2">Blocked</span>}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs">
                    <span className="flex items-center gap-1.5 font-medium px-2.5 py-1 bg-muted rounded-full">
                      <Clock size={12} /> {new Date(task.deadline_date).toLocaleDateString()}
                    </span>
                    <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      {task.category}
                    </span>
                    {task.priority <= 2 && (
                      <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        High Priority
                      </span>
                    )}
                    {blocked && blockers.length > 0 && (
                      <span className="text-muted-foreground italic truncate max-w-xs xl:max-w-md w-full sm:w-auto mt-2 sm:mt-0">
                        Requires: {blockers.map((b: any) => b.name).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex sm:hidden group-hover:flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="rounded-full font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => delayTask(task.id)}>Delay 1 Week</Button>
                  <Button variant="ghost" size="sm" className="rounded-full">Edit</Button>
                  <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50">Delete</Button>
                </div>
              </motion.div>
            )})
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading tasks...</div>}>
      <TasksContent />
    </Suspense>
  );
}
