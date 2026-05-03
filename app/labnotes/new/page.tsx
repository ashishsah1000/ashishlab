"use client";

import { createLabnote } from "@/app/actions/labnotes";
import Navbar from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewLabNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      await createLabnote(formData);
      router.push("/labnotes");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-32">
        <Link 
          href="/labnotes" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Notes
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black font-heading text-gray-900 mb-2">
              Write a <span className="text-blue-600">Note.</span>
            </h1>
            <p className="text-gray-500">Share your research, thoughts, or discoveries using Markdown.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900">Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  required
                  placeholder="e.g. Exploring the Cosmos: A Deep Dive into Black Holes" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="subHeading" className="block text-sm font-semibold text-gray-900">Subheading / Excerpt</label>
                <input 
                  type="text" 
                  id="subHeading" 
                  name="subHeading" 
                  placeholder="A brief summary of what this note is about..." 
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
                placeholder="Write your note here using Markdown...&#10;&#10;## Heading 2&#10;&#10;**Bold text**&#10;&#10;![Image Alt](https://image.url)&#10;&#10;- Item 1&#10;- Item 2" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y"
              />
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-64 space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900">Admin Password <span className="text-red-500">*</span></label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  required
                  placeholder="Enter password to publish" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto mt-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[52px]"
              >
                {loading ? "Publishing..." : "Publish Note"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
