"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function SaathiChat({ weddingId }: { weddingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Saathi AI, your intelligent wedding planner. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !weddingId) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch("/api/saathi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history, weddingId })
      });

      const data = await res.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply
        }]);

        // Trigger any action
        if (data.action) {
          console.log("AI triggered action:", data.action, data.data);
          // E.g., if action === 'CREATE_TASK', we can trigger toast or refresh the task list magically.
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops, I had a momentary lapse. Could you say that again?"
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="mb-4 w-[380px] h-[550px] max-h-[80vh] bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col glass"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/30 bg-white/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                    <Sparkles size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">Saathi AI</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                      Smart Planner
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="h-8 w-8 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors text-stone-600">
                  <X size={16} />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-stone-900 text-white rounded-br-sm' 
                        : 'bg-white border border-stone-100 text-stone-800 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-white border border-stone-100 text-stone-800 rounded-bl-sm flex items-center gap-2 shadow-sm">
                       <Loader2 size={16} className="animate-spin text-primary" />
                       <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white/50 border-t border-white/30">
                <form onSubmit={sendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Saathi to plan something..."
                    disabled={loading}
                    className="w-full bg-white/80 border border-stone-200 text-stone-900 placeholder:text-stone-400 rounded-full pl-5 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow text-sm shadow-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="absolute right-1.5 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-[#d4b568] transition-colors disabled:opacity-50"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-colors border-4 border-white z-50 ${
            isOpen ? 'bg-stone-200 text-stone-600' : 'bg-primary text-primary-foreground hover:bg-[#d4b568]'
          }`}
        >
          {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
        </motion.button>
      </div>
    </>
  );
}
