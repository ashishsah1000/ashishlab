import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-blue-100 blur-3xl opacity-50 rounded-full w-48 h-48 mx-auto translate-y-1/4"></div>
          <h1 className="text-9xl md:text-[12rem] font-black font-heading text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 tracking-tighter relative z-10 drop-shadow-sm">
            404
          </h1>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Page Not Found
        </h2>
        
        <p className="text-lg text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
          Oops! The page you're looking for doesn't exist, has been moved, or is private.
        </p>
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all hover:scale-105 shadow-md shadow-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Return Home
        </Link>
      </div>
    </main>
  );
}
