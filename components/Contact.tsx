"use client";

import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 md:px-12 lg:px-24 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-heading font-black mb-8 tracking-tight">
            Let's build something <span className="text-blue-400">extraordinary.</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            I'm currently looking for new opportunities. Whether you have a question or just want to say hi, I'll try my best to get back to you!
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a 
              href="mailto:ashishsah1000@gmail.com" 
              className="w-full md:w-auto px-10 py-5 bg-white text-gray-900 rounded-2xl font-bold transition-transform hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-xl shadow-white/10"
            >
              <Mail className="w-6 h-6 text-blue-600" />
              Say Hello
            </a>
            <a 
              href="tel:9631640767" 
              className="w-full md:w-auto px-10 py-5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Phone className="w-6 h-6 text-gray-400" />
              Call Me
            </a>
          </div>
        </motion.div>
        
        <div className="mt-32 pt-10 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 font-medium">
            © {new Date().getFullYear()} Ashish Sah. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a href="https://github.com/ashishsah1000" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-800 rounded-full hover:bg-white hover:text-black transition-colors text-gray-400">
              <FaGithub className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/ashishsah1000/" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-800 rounded-full hover:bg-[#0A66C2] hover:text-white transition-colors text-gray-400">
              <FaLinkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
