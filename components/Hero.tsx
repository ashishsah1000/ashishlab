"use client";

import { motion } from "framer-motion";
import { ArrowRight, Download, Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20 pb-12 px-6 md:px-12 lg:px-24 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary font-medium tracking-wider uppercase text-sm mb-4 block">
              Hello, I am
            </span>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-gray-900 mb-6 leading-tight">
              Ashish Sah
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-700 font-medium mb-8">
              Full Stack Engineer & <br className="hidden md:block" /> R&D Software Engineer
            </h2>
            <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed">
              I specialize in building scalable web applications, robust APIs, and geospatial machine learning pipelines. I have over 6 years of experience bridging the gap between complex mathematical algorithms and beautiful, user-friendly interfaces.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center md:justify-start gap-4"
          >
            <Link href="#contact" className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/30 group">
              Get in Touch <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <a href="/Ashish resume 26-05.pdf" target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-full font-medium shadow-sm transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Resume
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex items-center justify-center md:justify-start gap-6 text-gray-500"
          >
            <a href="https://github.com/ashishsah1000" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors p-2 hover:bg-black/5 rounded-full">
              <FaGithub className="w-6 h-6" />
            </a>
            <a href="https://www.linkedin.com/in/ashishsah1000/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A66C2] transition-colors p-2 hover:bg-black/5 rounded-full">
              <FaLinkedin className="w-6 h-6" />
            </a>
            <a href="mailto:ashishsah1000@gmail.com" className="hover:text-red-500 transition-colors p-2 hover:bg-black/5 rounded-full">
              <Mail className="w-6 h-6" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
