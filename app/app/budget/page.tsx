"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight,
  PieChart as PieChartIcon,
  Filter,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function BudgetContent() {
  const searchParams = useSearchParams();
  const [weddingId, setWeddingId] = useState<string | null>(searchParams.get("wedding_id"));
  const [wedding, setWedding] = useState<any>(null);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "Venue",
    estimated_amount: 0,
    actual_amount: 0,
    paid_amount: 0,
    status: "Pending" as "Pending" | "Paid" | "Partially Paid"
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const id = searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (id) {
      setWeddingId(id);
      fetchBudgetData(id);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  async function fetchBudgetData(id: string) {
    setLoading(true);
    try {
      const { data: weddingData } = await supabase
        .from("weddings")
        .select("*")
        .eq("id", id)
        .single();
      
      const { data: items } = await supabase
        .from("budgets")
        .select("*")
        .eq("wedding_id", id)
        .order("created_at", { ascending: false });

      setWedding(weddingData);
      setBudgetItems(items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddExpense = async () => {
    if (!weddingId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("budgets").insert({
        wedding_id: weddingId,
        ...newExpense
      });
      if (error) throw error;
      await fetchBudgetData(weddingId);
      setIsAddModalOpen(false);
      setNewExpense({
        category: "Venue",
        estimated_amount: 0,
        actual_amount: 0,
        paid_amount: 0,
        status: "Pending"
      });
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      setBudgetItems(items => items.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete expense");
    }
  };

  const totalEstimated = budgetItems.reduce((acc, item) => acc + Number(item.estimated_amount), 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + Number(item.actual_amount), 0);
  const totalPaid = budgetItems.reduce((acc, item) => acc + Number(item.paid_amount), 0);
  const remainingBudget = (wedding?.total_budget || 0) - totalActual;
  const unpaidAmount = totalActual - totalPaid;

  const budgetUsagePercent = wedding?.total_budget > 0 
    ? (totalActual / wedding.total_budget) * 100 
    : 0;

  if (!weddingId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          <Wallet size={40} />
        </div>
        <h2 className="text-3xl font-serif">No Budget Found</h2>
        <p className="max-w-md text-muted-foreground">
          Generate your wedding timeline first to get AI-suggested budget allocations.
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
          <h1 className="text-4xl font-serif">Budget Tracker</h1>
          <p className="text-muted-foreground mt-2">Manage your wedding finances with AI precision.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto rounded-full px-6 py-6 shadow-lg shadow-primary/20">
          <Plus className="mr-2" size={18} /> Add Expense
        </Button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Planning Budget</p>
          <p className="text-3xl font-serif mt-1">₹{(wedding?.total_budget || 0).toLocaleString()}</p>
          <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
              className={`h-full ${budgetUsagePercent > 100 ? 'bg-red-500' : 'bg-primary'}`}
            />
          </div>
          <p className="text-[10px] font-bold mt-2 text-muted-foreground uppercase">{budgetUsagePercent.toFixed(1)}% utilized</p>
        </Card>

        <Card className="premium-card">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Actual Spent</p>
          <p className="text-3xl font-serif mt-1">₹{totalActual.toLocaleString()}</p>
          <p className="text-[10px] font-bold mt-2 text-red-600 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp size={10} /> Based on Actual Costs
          </p>
        </Card>

        <Card className="premium-card">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Paid Amount</p>
          <p className="text-3xl font-serif mt-1">₹{totalPaid.toLocaleString()}</p>
          <p className="text-[10px] font-bold mt-2 text-green-600 uppercase tracking-widest">Confirmed Transactions</p>
        </Card>

        <Card className="premium-card">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Remaining</p>
          <p className={`text-3xl font-serif mt-1 ${remainingBudget < 0 ? 'text-red-500' : ''}`}>
            ₹{remainingBudget.toLocaleString()}
          </p>
          <p className="text-[10px] font-bold mt-2 text-amber-600 uppercase tracking-widest">{unpaidAmount.toLocaleString()} unpaid debt</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown */}
        <Card className="lg:col-span-1 border rounded-3xl overflow-hidden shadow-sm flex flex-col h-fit">
          <CardHeader className="bg-muted/30 pb-6 border-b px-6 pt-6">
            <div className="flex items-center gap-2">
              <PieChartIcon size={20} className="text-primary" />
              <CardTitle className="font-serif">Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex-1">
            {budgetItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic">No expenses added yet</div>
            ) : (
              budgetItems.map(item => (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">{item.category}</span>
                    <span className="text-muted-foreground">₹{Number(item.actual_amount).toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(Number(item.actual_amount) / (totalActual || 1)) * 100}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card className="lg:col-span-2 border rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 pb-6 border-b flex flex-row items-center justify-between px-6 pt-6 gap-2">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-primary" />
              <CardTitle className="font-serif">Expense Details</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold uppercase tracking-widest text-[10px]">Export PDF</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/10 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actual</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Paid</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {budgetItems.map(item => (
                    <tr key={item.id} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-6 py-4 font-bold">{item.category}</td>
                      <td className="px-6 py-4 font-medium">₹{Number(item.actual_amount).toLocaleString()}</td>
                      <td className="px-6 py-4">₹{Number(item.paid_amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          item.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' :
                          item.status === 'Partially Paid' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteExpense(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {budgetItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic">
                        No budget items found. Start by adding an expense or generating your timeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Modal (Inline implementation for speed/reliability) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif">Add New Expense</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</label>
                <select 
                  className="w-full p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                >
                  {["Venue", "Catering", "Clothing", "Photography", "Decor", "Invitations", "Rituals", "Logistics", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimated Amount (₹)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                    value={newExpense.estimated_amount}
                    onChange={(e) => setNewExpense({ ...newExpense, estimated_amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actual Amount (₹)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                    value={newExpense.actual_amount}
                    onChange={(e) => setNewExpense({ ...newExpense, actual_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paid Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                  value={newExpense.paid_amount}
                  onChange={(e) => setNewExpense({ ...newExpense, paid_amount: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Status</label>
                <div className="flex gap-2">
                  {["Pending", "Partially Paid", "Paid"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewExpense({ ...newExpense, status: s as any })}
                      className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${newExpense.status === s ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-transparent'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleAddExpense} disabled={isSaving} className="w-full py-8 text-lg rounded-2xl shadow-xl shadow-primary/20">
              {isSaving ? "Saving..." : "Add to Budget"}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading budget...</div>}>
      <BudgetContent />
    </Suspense>
  );
}
