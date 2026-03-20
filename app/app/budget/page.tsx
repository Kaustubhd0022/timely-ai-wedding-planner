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
  Filter
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
        .eq("wedding_id", id);

      setWedding(weddingData);
      setBudgetItems(items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalEstimated = budgetItems.reduce((acc, item) => acc + Number(item.estimated_amount), 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + Number(item.actual_amount), 0);
  const totalPaid = budgetItems.reduce((acc, item) => acc + Number(item.paid_amount), 0);

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
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif">Budget Tracker</h1>
          <p className="text-muted-foreground mt-2">Manage your wedding finances with AI precision.</p>
        </div>
        <Button className="rounded-full px-6 py-6 shadow-lg shadow-primary/20">
          <Plus className="mr-2" size={18} /> Add Expense
        </Button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Wallet size={24} />
            </div>
            <ArrowUpRight size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Budget</p>
          <p className="text-3xl font-serif mt-1">₹{(wedding?.total_budget || 0).toLocaleString()}</p>
        </Card>

        <Card className="premium-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-100 rounded-2xl text-red-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
              {budgetUsagePercent.toFixed(1)}% used
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Actual Spent</p>
          <p className="text-3xl font-serif mt-1">₹{totalActual.toLocaleString()}</p>
        </Card>

        <Card className="premium-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-100 rounded-2xl text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <CheckCircle2 size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Paid Amount</p>
          <p className="text-3xl font-serif mt-1">₹{totalPaid.toLocaleString()}</p>
        </Card>

        <Card className="premium-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Remaining</p>
          <p className="text-3xl font-serif mt-1">₹{(totalActual - totalPaid).toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown */}
        <Card className="lg:col-span-1 border rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="bg-muted/30 pb-6 border-b">
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
                      animate={{ width: `${(Number(item.actual_amount) / totalActual) * 100}%` }}
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
          <CardHeader className="bg-muted/30 pb-6 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-primary" />
              <CardTitle className="font-serif">Expense Details</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold">Export PDF</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/10 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimated</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actual</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Paid</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {budgetItems.map(item => (
                    <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{item.category}</td>
                      <td className="px-6 py-4 text-muted-foreground">₹{Number(item.estimated_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium">₹{Number(item.actual_amount).toLocaleString()}</td>
                      <td className="px-6 py-4">₹{Number(item.paid_amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          item.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' :
                          item.status === 'Partially Paid' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {item.status}
                        </span>
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
