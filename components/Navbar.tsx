"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "py-4" : "py-6"}`}
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className={`flex items-center justify-between px-6 py-4 rounded-full transition-all duration-300 ${scrolled ? "bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/50" : "bg-transparent"}`}>
          <Link href="/" className="font-heading font-black text-xl tracking-tight text-gray-900">
            A<span className="text-blue-600">.</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
            <Link href="/#about" className="hover:text-gray-900 transition-colors">About</Link>
            <Link href="/#skills" className="hover:text-gray-900 transition-colors">Skills</Link>
            <Link href="/#experience" className="hover:text-gray-900 transition-colors">Experience</Link>
            <Link href="/#projects" className="hover:text-gray-900 transition-colors">Projects</Link>
            <Link href="/labnotes" className="hover:text-gray-900 transition-colors">Lab Notes</Link>
          </div>
          
          <div className="hidden md:block">
            <Link href="/#contact" className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
              Contact
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </motion.nav>

    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 left-6 right-6 bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6 z-40 flex flex-col gap-4 text-center md:hidden"
        >
          <Link href="/#about" onClick={() => setMobileMenuOpen(false)} className="text-gray-900 font-medium py-2 text-lg">About</Link>
          <Link href="/#skills" onClick={() => setMobileMenuOpen(false)} className="text-gray-900 font-medium py-2 text-lg">Skills</Link>
          <Link href="/#experience" onClick={() => setMobileMenuOpen(false)} className="text-gray-900 font-medium py-2 text-lg">Experience</Link>
          <Link href="/#projects" onClick={() => setMobileMenuOpen(false)} className="text-gray-900 font-medium py-2 text-lg">Projects</Link>
          <Link href="/labnotes" onClick={() => setMobileMenuOpen(false)} className="text-gray-900 font-medium py-2 text-lg">Lab Notes</Link>
          <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} className="mx-auto mt-4 px-8 py-3 bg-gray-900 text-white rounded-full text-base font-semibold hover:bg-gray-800 transition-colors shadow-sm">
            Contact
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
