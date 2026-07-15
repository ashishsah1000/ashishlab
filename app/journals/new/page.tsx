"use client";

import Navbar from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import FlowMode from "./FlowMode";

export default function NewJournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"normal" | "flow">("normal");
  const [generatedStory, setGeneratedStory] = useState("");
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeDraft, setActiveDraft] = useState<any | null>(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await fetch("/api/journals?drafts=true");
        if (res.ok) {
          const data = await res.json();
          setDrafts(data);
        }
      } catch (err) {
        console.error("Failed to fetch drafts", err);
      }
    };
    fetchDrafts();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error("Failed to create journal");
      }
      
      router.push("/journals");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create journal");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (nodes: any[], edges: any[]) => {
    // Basic draft save logic
    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Draft Flow",
          content: "Flow Draft",
          isFlow: true,
          isDraft: true,
          flowState: { nodes, edges }
        })
      });
      if (res.ok) {
        alert("Draft saved!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-32">
        <Link 
          href="/journals" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Journals
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black font-heading text-gray-900 mb-2">
                Write a <span className="text-blue-600">Journal.</span>
              </h1>
              <p className="text-gray-500">Document your daily logs, thoughts, or ideas using Markdown.</p>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => {
                  setMode("normal");
                  setActiveDraft(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "normal" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Normal
              </button>
              <button 
                onClick={() => setMode("flow")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "flow" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Flow Mode
              </button>
            </div>
          </div>

          {mode === "normal" && drafts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span> 
                Saved Draft Flows
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {drafts.map((draft) => {
                  const nodeCount = draft.flowState?.nodes?.length || 0;
                  return (
                    <button
                      key={draft.id}
                      onClick={() => {
                        setActiveDraft(draft);
                        setMode("flow");
                      }}
                      className="snap-start shrink-0 w-64 text-left bg-gradient-to-br from-white to-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Draft</div>
                        <div className="text-xs text-gray-400 font-medium">
                          {new Date(draft.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <h3 className="font-heading font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{draft.title || "Untitled Draft"}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {nodeCount} {nodeCount === 1 ? 'thought node' : 'thought nodes'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === "flow" ? (
            <FlowMode 
              key={activeDraft ? activeDraft.id : 'new'}
              initialNodes={activeDraft?.flowState?.nodes}
              initialEdges={activeDraft?.flowState?.edges}
              onClose={() => {
                setMode("normal");
                setActiveDraft(null);
              }}
              onSaveDraft={handleSaveDraft}
              onGenerateStory={(story) => {
                setGeneratedStory(story);
                setMode("normal"); // Switch to normal mode to edit the generated story
              }} 
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900">Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  required
                  placeholder="e.g. Day 1: Exploring the Cosmos" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="subHeading" className="block text-sm font-semibold text-gray-900">Subheading / Excerpt</label>
                <input 
                  type="text" 
                  id="subHeading" 
                  name="subHeading" 
                  placeholder="A brief summary of what this journal entry is about..." 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-900">Cover Image URL</label>
                <input 
                  type="url" 
                  id="imageUrl" 
                  name="imageUrl" 
                  placeholder="https://example.com/image.jpg" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-900">Tags</label>
                <input 
                  type="text" 
                  id="tags" 
                  name="tags" 
                  placeholder="cosmos, research, python (comma separated)" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="visibility" className="block text-sm font-semibold text-gray-900">Visibility</label>
                <select 
                  id="visibility" 
                  name="visibility" 
                  defaultValue="public"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="public">Public - Visible to everyone</option>
                  <option value="link_only">Link Only - Visible to anyone with the link</option>
                  <option value="private">Private - Only visible to you</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex justify-between items-center">
                <label htmlFor="content" className="block text-sm font-semibold text-gray-900">Content <span className="text-red-500">*</span></label>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Markdown Supported</span>
              </div>
              <textarea 
                id="content" 
                name="content" 
                required
                rows={15}
                defaultValue={generatedStory}
                placeholder="Write your journal here using Markdown...&#10;&#10;## Heading 2&#10;&#10;**Bold text**&#10;&#10;![Image Alt](https://image.url)&#10;&#10;- Item 1&#10;- Item 2" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y"
              />
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-end gap-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto mt-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[52px]"
              >
                {loading ? "Publishing..." : "Publish Journal"}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </main>
  );
}
