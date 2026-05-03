"use client";

import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { SectionHeading } from "./ui/SectionHeading";

export default function Contact() {
  return (
    <section id="contact" className="py-20 px-6 md:px-12 lg:px-24 border-t border-gray-200 bg-background relative">
      <div className="max-w-4xl mx-auto text-center">
        <SectionHeading 
          title="Get In Touch" 
          subtitle="I'm currently looking for new opportunities. Whether you have a question or just want to say hi, I'll try my best to get back to you!" 
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <a 
            href="mailto:ashishsah1000@gmail.com" 
            className="w-full md:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-3 text-lg shadow-lg shadow-primary/30"
          >
            <Mail className="w-5 h-5" />
            Say Hello
          </a>
          <a 
            href="tel:9631640767" 
            className="w-full md:w-auto px-8 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 text-lg shadow-sm"
          >
            <Phone className="w-5 h-5" />
            Call Me
          </a>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-20 pt-10 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <p className="text-gray-500 text-sm">
            Designed & Built by Ashish Sah
          </p>
          
          <div className="flex items-center gap-4 text-gray-500">
            <a href="https://github.com/ashishsah1000" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
              <FaGithub className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/ashishsah1000/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A66C2] transition-colors">
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a href="mailto:ashishsah1000@gmail.com" className="hover:text-red-500 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
