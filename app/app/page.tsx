"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  Trophy, 
  ShieldCheck, 
  Wallet, 
  AlertCircle, 
  Lock,
  Activity,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getNextBestAction, getSmartAlerts, isTaskBlocked } from "@/lib/orchestrator";
import { WhatsAppOptinModal } from "@/components/whatsapp-optin-modal";
import { TiltCard } from "@/components/tilt-card";

function DashboardContent() {
  const searchParams = useSearchParams();
  const [weddingId, setWeddingId] = useState<string | null>(searchParams.get("wedding_id"));
  const [wedding, setWedding] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMessage, setMockMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [dailyPlans, setDailyPlans] = useState<Record<string, string>>({});
  const [isAiLoading, setIsAiLoading] = useState(false);

  const simulateWhatsApp = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`/api/whatsapp/trigger?wedding_id=${weddingId}&type=daily`, { method: "POST" });
      const data = await res.json();
      if (data.content) {
        setMockMessage(data.content);
        setTimeout(() => setMockMessage(null), 8000);
      } else if (data.skipped) {
        alert("WhatsApp message skipped: " + data.reason);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

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
        .select("*, whatsapp_opt_in")
        .eq("id", id)
        .single();
      
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("wedding_id", id)
        .order("deadline_date", { ascending: true });

      const { data: depsData } = await supabase
        .from("task_dependencies")
        .select("*")
        .in("task_id", tasksData?.map(t => t.id) || []);

      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("wedding_id", id);

      const { data: guestsData } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", id);

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("wedding_id", id)
        .order("event_date", { ascending: true });

      setWedding(weddingData);
      setTasks(tasksData || []);
      setDependencies(depsData || []);
      setBudgets(budgetsData || []);
      setGuests(guestsData || []);
      setBookings(bookingsData || []);
      
      if (tasksData && tasksData.length > 0) {
        generateDailyAIPlans(tasksData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const completedCount = tasks.filter(t => t.status === "Done").length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  
  const nextAction = getNextBestAction(tasks, dependencies);
  const alerts = getSmartAlerts(tasks, dependencies);

  const [isOptinOpen, setIsOptinOpen] = useState(false);

  const daysToWedding = wedding?.wedding_date 
    ? Math.ceil((new Date(wedding.wedding_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
    : 0;

  const weddingStatus = () => {
    if (!wedding?.wedding_date) return "The big day is coming!";
    const today = new Date().setHours(0,0,0,0);
    const wDay = new Date(wedding.wedding_date).setHours(0,0,0,0);
    if (today === wDay) return "Today is your big day 🎉";
    if (today > wDay) return "Wedding completed";
    return `Only ${daysToWedding} days until the big day`;
  };

  // Filter Top 3 Tasks: High priority, soonest deadlines, not done
  const topTasks = tasks
    .filter(t => t.status !== "Done")
    .sort((a, b) => {
      // Sort by priority (1 is highest) then by date
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
    })
    .slice(0, 3);

  async function generateDailyAIPlans(allTasks: any[]) {
    const currentTop = allTasks
      .filter(t => t.status !== "Done")
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
      })
      .slice(0, 3);

    if (currentTop.length === 0) return;
    
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: currentTop })
      });
      const data = await res.json();
      const planMap: Record<string, string> = {};
      data.plans?.forEach((p: any) => {
        planMap[p.task_id] = p.explanation;
      });
      setDailyPlans(planMap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleToggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "Done" ? "To Do" : "Done";
    try {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateDate(newDate: string) {
    if (!weddingId || !wedding?.wedding_date) return;
    const oldDate = new Date(wedding.wedding_date);
    const updatedDate = new Date(newDate);
    const diffTime = updatedDate.getTime() - oldDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    setLoading(true);
    try {
      // 1. Update wedding date
      const { error: wError } = await supabase.from("weddings").update({ wedding_date: newDate }).eq("id", weddingId);
      if (wError) throw wError;

      // 2. Shift all task deadlines
      const updatedTasks = tasks.map(t => {
        const d = new Date(t.deadline_date);
        d.setDate(d.getDate() + diffDays);
        return {
          ...t,
          deadline_date: d.toISOString().split('T')[0]
        };
      });

      // Batch update tasks (sequential for simplicity here, or just refetch)
      for (const t of updatedTasks) {
        await supabase.from("tasks").update({ deadline_date: t.deadline_date }).eq("id", t.id);
      }

      await fetchData(weddingId);
    } catch (err) {
      console.error(err);
      alert("Failed to update date");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-8 p-8">
      <div className="h-20 bg-muted rounded-xl w-1/3" />
      <div className="grid gap-6 md:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
      </div>
    </div>;
  }

  if (!weddingId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          <CalendarIcon size={40} />
        </div>
        <h2 className="text-3xl font-serif text-stone-800">Ready to start your journey?</h2>
        <p className="max-w-md text-muted-foreground text-lg">
          Your wedding is a beautiful story. Let's write the first chapter together with our AI planner.
        </p>
        <Button onClick={() => window.location.href='/onboarding'} className="rounded-full px-10 py-7 text-lg shadow-xl shadow-primary/20">
          Start My AI Roadmap
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <AnimatePresence>
        {mockMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-6 rounded-t-[2rem] rounded-bl-[2rem] rounded-br-sm shadow-2xl shadow-green-900/20 max-w-sm border-4 border-white"
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={16} />
              <span className="font-bold text-[10px] uppercase tracking-widest text-white/90">AI Wedding Assistant</span>
            </div>
            <p className="font-medium text-sm leading-relaxed whitespace-pre-wrap">{mockMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Warm Countdown Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 pt-4">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-stone-900 tracking-tight">You're doing great — stay on track.</h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium flex items-center justify-center md:justify-start gap-2 text-center md:text-left">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            {weddingStatus() === "Only " + daysToWedding + " days until the big day" ? (
              <>
                Only <span className="font-extrabold text-stone-900">{daysToWedding} days</span> until {wedding?.wedding_date ? (
                  <span className="relative group cursor-pointer border-b border-dotted border-primary">
                    {new Date(wedding.wedding_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    <input 
                      type="date" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => handleUpdateDate(e.target.value)}
                    />
                  </span>
                ) : 'the big day'}.
              </>
            ) : (
              <span className="font-extrabold text-stone-900">{weddingStatus()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/50 p-2 rounded-full border shadow-sm">
          {wedding?.whatsapp_opt_in && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={simulateWhatsApp} 
              disabled={simulating}
              className="rounded-full shadow-sm bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 ml-1"
            >
              <MessageCircle size={14} className="mr-2" />
              {simulating ? "Generating..." : "Simulate Daily Msg"}
            </Button>
          )}
          <WhatsAppOptinModal 
            isOpen={isOptinOpen} 
            onClose={() => setIsOptinOpen(false)} 
            weddingId={weddingId || ""} 
          />
        </div>
      </header>
      
      {/* 2. AI Daily Planner Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* 1. Today's Focus - Intelligent Prioritization */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2 px-2">
             <div className="h-1 w-4 bg-primary rounded-full" />
             <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400">Today's Focus</h2>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="h-40 w-full bg-stone-50 rounded-[2.5rem] animate-pulse border-2 border-transparent" />
            ) : topTasks.length > 0 ? (
              topTasks.map((task, idx) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  >
                    {task.status === "Done" && <CheckCircle2 size={14} className="text-primary fill-primary/10" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-serif text-lg text-stone-900 leading-tight">{task.name}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100 flex items-center gap-1">
                        <Clock size={8} /> {new Date(task.deadline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[9px] font-black uppercase text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">Priority {task.priority}</span>
                    </div>
                    {isAiLoading ? (
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded mt-2" />
                    ) : dailyPlans[task.id] && (
                      <p className="text-xs text-stone-500 font-medium italic border-l-2 border-primary/20 pl-3 py-1">
                        “{dailyPlans[task.id]}”
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center bg-stone-50 rounded-[2rem] border-2 border-dashed border-stone-200">
                <Trophy className="mx-auto mb-2 text-green-500" size={32} />
                <p className="text-sm font-serif text-stone-800">Everything settled for today!</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border shadow-sm space-y-4 h-full relative overflow-hidden">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex justify-between items-center px-2">
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-stone-100 rounded" />
                  <div className="h-8 w-32 bg-stone-100 rounded" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-3 w-16 bg-stone-100 ml-auto rounded" />
                  <div className="h-4 w-20 bg-stone-100 ml-auto rounded" />
                </div>
              </div>
              <div className="h-5 w-full bg-stone-50 rounded-full border" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <div className="h-12 w-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800">No progress data yet</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Add tasks to see your roadmap</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4 sm:gap-0">
                <div className="space-y-1">
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-stone-400">Current Progress</h3>
                  <p className="text-2xl md:text-3xl font-serif text-stone-900">{progress}% complete</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-stone-400 text-[10px] md:text-xs font-bold uppercase">{completedCount} / {totalTasks}</p>
                  <p className="text-stone-900 text-xs md:text-sm font-bold">Tasks Settled</p>
                </div>
              </div>
              <div className="h-4 md:h-5 w-full bg-stone-50 rounded-full overflow-hidden p-1 shadow-inner border">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-primary rounded-full shadow-lg shadow-primary/20"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3. Next Best Action - Prime Guidance */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-4">
           <div className="h-1 w-8 bg-primary rounded-full" />
           <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400">Next Best Action</h2>
        </div>

        {loading ? (
          <div className="bg-stone-50 h-32 w-full rounded-[2.5rem] animate-pulse" />
        ) : !nextAction ? (
          <div className="p-10 bg-stone-50/50 rounded-[2.5rem] border-2 border-dashed border-stone-200 text-center">
            <Trophy className="mx-auto mb-2 text-green-500 opacity-50" size={24} />
            <p className="text-sm font-serif text-stone-500 italic">No pending actions. You're completely on track!</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                <div className="grid md:grid-cols-3">
                  <div className="md:col-span-2 p-6 md:p-10 space-y-6 md:space-y-8 relative z-10 w-full overflow-hidden">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className="px-3 md:px-4 py-1.5 bg-primary/20 text-primary-foreground border border-primary/30 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shrink-0">Priority {nextAction.task.priority}</span>
                          <span className="text-secondary text-xs md:text-sm font-bold uppercase tracking-widest shrink-0">Recommended Focus</span>
                      </div>
                      <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif text-stone-900 leading-tight drop-shadow-sm break-words">{nextAction.task.name}</h3>
                      <p className="text-stone-500 leading-relaxed text-lg md:text-xl max-w-xl font-medium italic">
                        "{nextAction.reason}"
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:gap-4 w-full">
                      <div className="w-full sm:w-auto flex items-center gap-3 px-6 py-3 bg-white/60 rounded-full border border-white/40 text-stone-700 text-xs md:text-sm font-bold shadow-sm">
                        <Clock size={18} className="text-primary shrink-0" /> <span className="truncate">Target: {new Date(nextAction.task.deadline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <Button 
                        onClick={() => window.location.href=`/app/tasks?wedding_id=${weddingId}`}
                        className="w-full sm:w-auto rounded-full px-8 py-6 md:px-12 md:py-7 text-lg md:text-xl font-serif bg-primary text-primary-foreground hover:bg-[#d4b568] transition-all shadow-xl hover:shadow-2xl md:hover:scale-105"
                      >
                        Take this step now
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-md flex flex-row md:flex-col items-center justify-start md:justify-center p-6 md:p-10 border-t md:border-t-0 md:border-l border-white/20 text-left md:text-center space-x-4 md:space-x-0 md:space-y-4">
                      <div className="h-24 w-24 bg-white/60 rounded-full flex items-center justify-center border border-white/40 shadow-sm transition-transform group-hover:rotate-12 group-hover:scale-110 duration-700">
                        <ShieldCheck size={48} className="text-secondary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">Verified Logic</p>
                        <p className="text-stone-800 font-serif text-lg leading-tight">AI Orchestration<br/>System</p>
                      </div>
                  </div>
                </div>
              </Card>
            </TiltCard>
          </motion.div>
        ) : (
          <Card className="p-16 text-center rounded-[3rem] bg-stone-50 border-2 border-dashed border-stone-200">
             <div className="h-20 w-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trophy size={40} className="text-green-600" />
             </div>
             <h3 className="text-3xl font-serif text-stone-900">Your roadmap is clear.</h3>
             <p className="text-stone-500 text-lg max-w-md mx-auto mt-2">You've completed every unblocked task. A perfect moment to rest and look forward to the celebration.</p>
          </Card>
        )}
      </section>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* 4. AI Insights & Smart Alerts */}
        <div className="lg:col-span-1 space-y-8">
          <div className="flex items-center gap-2 px-2">
             <div className="h-1 w-4 bg-stone-300 rounded-full" />
             <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 flex items-center gap-2">
               System Alerts
             </h2>
          </div>
          
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className={`p-6 rounded-[2rem] border-2 flex gap-5 transition-all hover:scale-[1.02] ${
                    alert.type === 'overdue' ? 'bg-white border-red-50 shadow-sm' :
                    alert.type === 'upcoming' ? 'bg-white border-amber-50 shadow-sm' :
                    'bg-white border-stone-100 shadow-sm'
                  }`}
                >
                  <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center ${
                    alert.type === 'overdue' ? 'bg-red-50 text-red-600' :
                    alert.type === 'upcoming' ? 'bg-amber-50 text-amber-600' :
                    'bg-stone-50 text-stone-600'
                  }`}>
                    {alert.type === 'overdue' ? <AlertCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-black uppercase tracking-widest ${
                      alert.type === 'overdue' ? 'text-red-600' : 
                      alert.type === 'upcoming' ? 'text-amber-600' : 
                      'text-stone-400'
                    }`}>
                      {alert.type}
                    </p>
                    <p className="text-sm font-medium text-stone-700 leading-relaxed">{alert.message}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 grayscale opacity-50 space-y-3">
                 <ShieldCheck size={32} className="mx-auto text-stone-300" />
                 <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">Plan is healthy</p>
              </div>
            )}
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 px-2">
                 <div className="h-1 w-4 bg-stone-300 rounded-full" />
                 <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400">Upcoming Bookings</h2>
              </div>
              {bookings.length > 0 ? (
                bookings.map((booking, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={booking.id}
                    className="p-4 bg-white rounded-3xl border border-stone-100 shadow-sm space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{booking.event_type}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <h5 className="font-serif text-stone-900 group-hover:text-primary transition-colors">{booking.vendor_name}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold">
                       <Clock size={10} /> {new Date(booking.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center py-8 text-[10px] text-stone-400 font-bold uppercase tracking-widest italic">No bookings yet</p>
              )}
            </div>
            
            <TiltCard>
              <Card className="rounded-[2.5rem] glass border border-white/50 p-8 shadow-sm mt-12 overflow-hidden relative group transition-all duration-700 hover:shadow-xl hover:-translate-y-1">
                 <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mb-16 blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
                 <div className="flex items-center gap-3 mb-8 relative z-10">
                   <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/30 transition-transform group-hover:scale-110 duration-700">
                      <CheckCircle2 size={20} className="text-white" />
                   </div>
                   <h4 className="font-serif text-stone-900 text-xl">Planning Snapshot</h4>
                 </div>
                 <div className="grid grid-cols-1 gap-6 relative z-10">
                   <div className="bg-white/60 border border-white/40 p-4 rounded-3xl transition-transform hover:scale-105 duration-300">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Confirmed Guests</p>
                      <p className="text-3xl font-serif text-stone-800">{guests.length || wedding?.guest_count}</p>
                   </div>
                   <div className="bg-white/60 border border-white/40 p-4 rounded-3xl transition-transform hover:scale-105 duration-300">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Total Spending</p>
                      <p className="text-3xl font-serif text-primary italic drop-shadow-sm">
                        ₹{budgets.reduce((acc, b) => acc + Number(b.actual_amount), 0).toLocaleString()}
                      </p>
                   </div>
                 </div>
              </Card>
            </TiltCard>
          </div>
        </div>

        {/* 5. Simplified Roadmap (Tasks) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end mb-2 px-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 bg-stone-300 rounded-full" />
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400">Roadmap Overview</h2>
            </div>
            {tasks.length > 0 && (
              <Button variant="ghost" size="sm" className="text-primary font-black uppercase tracking-widest text-[10px] hover:bg-transparent" onClick={() => window.location.href=`/app/tasks?wedding_id=${weddingId}`}>View Entire List</Button>
            )}
          </div>
          
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-28 w-full bg-stone-50 rounded-[2.5rem] animate-pulse border-2 border-transparent" />
              ))
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-stone-300">
                  <CalendarIcon size={32} />
                </div>
                <div>
                  <p className="text-lg font-serif text-stone-800">Your roadmap is waiting</p>
                  <p className="text-xs text-stone-400 mt-1 max-w-[200px] mx-auto">Generate your timeline to see your personalized wedding journey.</p>
                </div>
              </div>
            ) : (
              <>
                {tasks.filter(t => t.status !== "Done").slice(0, 6).map((task) => {
                  const blocked = isTaskBlocked(task.id, tasks, dependencies);
                  
                  return (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className={`flex items-center gap-6 p-6 rounded-[2.5rem] border-2 border-transparent transition-all group ${
                        blocked ? 'bg-stone-50/50 grayscale-[0.6] opacity-60 border-stone-100' : 'bg-stone-50 border-stone-50 hover:bg-white hover:border-primary/10 hover:shadow-xl'
                      }`}
                    >
                      <div className={`h-14 w-14 shrink-0 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 ${
                        blocked ? 'bg-stone-200 text-stone-500' : 'bg-white shadow-sm text-primary'
                      }`}>
                        {blocked ? <Lock size={24} /> : <div className="h-6 w-6 border-2 border-stone-200 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-stone-800 flex items-center gap-3">
                          {task.name} 
                          {blocked && <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-stone-200 text-stone-500 px-2 py-1 rounded-lg border border-stone-300">Blocked</span>}
                        </h4>
                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em] mt-1">{task.category}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-stone-800">{new Date(task.deadline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                        <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.2em]">Deadline</p>
                      </div>
                    </motion.div>
                  );
                })}
                
                {tasks.length > 6 && (
                  <Button 
                    variant="outline" 
                    className="w-full rounded-[2rem] py-8 border-dashed border-2 text-stone-400 hover:text-stone-900 font-bold uppercase tracking-widest text-xs"
                    onClick={() => window.location.href=`/app/tasks?wedding_id=${weddingId}`}
                  >
                    + See {tasks.length - 6} more planning steps
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-muted rounded-2xl flex items-center justify-center">
      {icon}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-8">Loading your dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
