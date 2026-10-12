"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Minimize2, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageItem {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

interface AiCoachDrawerProps {
  goalId?: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AiCoachDrawer({ goalId, isOpen, onToggle }: AiCoachDrawerProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const url = goalId ? `/api/ai/goal-coach?goalId=${goalId}` : "/api/ai/goal-coach";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([
            {
              role: "assistant",
              content: "👋 Hi! I'm your AI Goal Coach. I'm tracking your milestones and tasks. If you're stuck, overwhelmed, or wondering what to tackle next today, let me know!",
            },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, goalId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: MessageItem = { role: "user", content: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/goal-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          goalId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply.content }]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What should I prioritize today?",
    "I feel blocked on my milestone tasks.",
    "How can I hit 80% consistency this week?",
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-xl shadow-blue-500/25 flex items-center gap-2 font-bold text-sm transition-all hover:scale-105"
      >
        <Bot className="w-5 h-5 animate-bounce" />
        <span>Ask AI Coach</span>
      </button>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] md:w-[500px] bg-white z-50 shadow-2xl border-l border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gray-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI Habit &amp; Goal Coach</h3>
                  <p className="text-[11px] text-blue-400">Context-Aware Realtime Guidance</p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  disabled={loading}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] text-xs leading-relaxed p-3.5 rounded-2xl ${
                      m.role === "user"
                        ? "bg-gray-900 text-white rounded-br-xs"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-xs max-w-none text-gray-800 leading-relaxed text-xs [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:my-2 [&>li]:my-1 [&>strong]:text-gray-900 [&>strong]:font-bold [&>h1]:text-sm [&>h1]:font-bold [&>h1]:mb-1.5 [&>h2]:text-xs [&>h2]:font-bold [&>h2]:mb-1 [&>h3]:text-xs [&>h3]:font-bold [&>h3]:mb-1 [&>code]:bg-gray-100 [&>code]:text-blue-600 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-[11px] [&>pre]:bg-gray-900 [&>pre]:text-white [&>pre]:p-2.5 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>blockquote]:border-l-2 [&>blockquote]:border-blue-500 [&>blockquote]:pl-2.5 [&>blockquote]:italic [&>blockquote]:my-1.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Thinking and structuring recommendations...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Ask your coach anything about today's tasks..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 text-xs px-3.5 py-2.5 bg-gray-100 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
