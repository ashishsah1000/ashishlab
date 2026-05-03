"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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
            <Link href="#about" className="hover:text-gray-900 transition-colors">About</Link>
            <Link href="#skills" className="hover:text-gray-900 transition-colors">Skills</Link>
            <Link href="#experience" className="hover:text-gray-900 transition-colors">Experience</Link>
            <Link href="#projects" className="hover:text-gray-900 transition-colors">Projects</Link>
          </div>
          
          <Link href="#contact" className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
            Contact
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
