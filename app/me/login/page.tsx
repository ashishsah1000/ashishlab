"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      // Success
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-md mx-auto w-full px-6 flex flex-col justify-center py-20">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
        </Link>
        
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-black font-heading text-gray-900 mb-2">
              Welcome <span className="text-blue-600">Back.</span>
            </h1>
            <p className="text-gray-500">Sign in to access creator features.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-900">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                required
                placeholder="Enter your username" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required
                placeholder="Enter your password" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 px-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-sm disabled:opacity-50 h-[52px]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
