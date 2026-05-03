"use client";

import { motion } from "framer-motion";
import { ExternalLink, Sparkles } from "lucide-react";

const projects = [
  {
    title: "Study Send",
    url: "https://www.studysend.com/",
    description: "An AI-powered education platform to upload study materials, generate AI-powered exams, and create revision cards. Integrated Zoom SDK and full RAG pipeline.",
    tags: ["Llama", "Python", "Drizzle ORM", "Zoom SDK", "RAG"],
    color: "bg-orange-50",
    borderColor: "border-orange-100",
    textColor: "text-orange-600"
  },
  {
    title: "Grad AI",
    url: "https://www.gradai.in/",
    description: "An AI-powered resume builder featuring prompt chaining, langchain integration, multiple templates, and robust authentication flow.",
    tags: ["Next.js", "Rust", "Gemini AI", "Python", "MongoDB"],
    color: "bg-emerald-50",
    borderColor: "border-emerald-100",
    textColor: "text-emerald-600"
  }
];

export default function Projects() {
  return (
    <section id="projects" className="py-24 px-6 md:px-12 lg:px-24 bg-background relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 md:flex justify-between items-end">
          <div>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 mb-4 tracking-tight">
              Selected <span className="text-gradient">Works.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-xl">
              Showcasing my best production-ready applications.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600 mt-6 md:mt-0">
            <Sparkles className="w-4 h-4 text-yellow-500" /> Curated Projects
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`group relative rounded-[2rem] p-8 md:p-10 ${project.color} border ${project.borderColor} overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-xl`}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">
                    {project.title}
                  </h3>
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white rounded-2xl hover:scale-110 transition-transform shadow-sm"
                  >
                    <ExternalLink className="w-6 h-6 text-gray-900" />
                  </a>
                </div>
                
                <p className="text-gray-700 text-lg mb-10 leading-relaxed flex-1">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tags.map((tag, tIdx) => (
                    <span 
                      key={tIdx}
                      className={`text-sm font-semibold px-4 py-2 bg-white rounded-xl ${project.textColor} shadow-sm`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
