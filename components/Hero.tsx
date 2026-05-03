"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, DownloadCloud, MapPin, MountainSnow, Rocket } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center relative px-6 md:px-12 lg:px-24 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" />
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000" />
      
      <div className="w-full max-w-6xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/50 shadow-sm mb-6 text-sm font-medium text-gray-600">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Available for new opportunities
            </div>
            
            <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tight text-gray-900 mb-6 leading-[1.1]">
              AI, <span className="inline-flex items-center gap-2 md:gap-4">Mountains <MountainSnow className="w-10 h-10 md:w-16 md:h-16 text-gray-400 -mt-2" /></span>,<br />
              <span className="text-gradient inline-flex items-center gap-2 md:gap-4">and Cosmos. <Rocket className="w-10 h-10 md:w-16 md:h-16 text-blue-500 -mt-2" /></span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 font-light mb-10 max-w-2xl leading-relaxed">
              Hi, I'm <strong className="font-semibold text-gray-900">Ashish Sah</strong>. A Full Stack & R&D Software Engineer bridging the gap between complex algorithms and stunning interfaces.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-6"
          >
            <Link href="#projects" className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium transition-all flex items-center gap-3 shadow-xl shadow-gray-900/20 hover:-translate-y-1">
              View Work <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="flex items-center gap-4">
              <a href="https://github.com/ashishsah1000" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl hover:bg-white transition-colors hover:-translate-y-1 shadow-sm text-gray-700 hover:text-black">
                <FaGithub className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/in/ashishsah1000/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl hover:bg-white transition-colors hover:-translate-y-1 shadow-sm text-gray-700 hover:text-[#0A66C2]">
                <FaLinkedin className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="lg:col-span-4 flex flex-col gap-6"
        >
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-24 h-24" />
            </div>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-widest mb-2">Location</h3>
            <p className="text-2xl font-bold text-gray-900 font-heading">Bengaluru, IN</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm p-8 rounded-3xl group cursor-pointer hover:bg-gray-900 transition-colors">
            <a href="/Ashish resume 26-05.pdf" target="_blank" rel="noopener noreferrer" className="block">
              <h3 className="text-gray-500 group-hover:text-gray-400 text-sm font-medium uppercase tracking-widest mb-2 transition-colors">Curriculum Vitae</h3>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900 group-hover:text-white font-heading transition-colors">Download Resume</p>
                <DownloadCloud className="w-6 h-6 text-gray-900 group-hover:text-white transition-colors" />
              </div>
            </a>
          </div>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400"
      >
        <span className="text-xs font-medium tracking-widest uppercase">Scroll Down</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </motion.div>
    </section>
  );
}
