"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";

const projects = [
  {
    title: "Study Send",
    url: "https://www.studysend.com/",
    description: "An AI-powered education platform to upload study materials, generate AI-powered exams, and create revision cards from documents. Integrated Zoom Video SDK for live calls and implemented RAG for note generation.",
    tags: ["Llama", "TypeScript", "Python", "AWS S3", "Drizzle ORM", "Zoom SDK", "FastAPI", "RAG", "Vectors"],
    featured: true
  },
  {
    title: "Grad AI",
    url: "https://www.gradai.in/",
    description: "An AI-powered resume builder to create professional resumes effortlessly. Features include prompt chaining, langchain integration, multiple templates, and robust authentication flow.",
    tags: ["Next.js", "React.js", "Node.js", "Rust", "Gemini", "Google Gen AI SDK", "Python", "MongoDB"],
    featured: true
  }
];

export default function Projects() {
  return (
    <section id="projects" className="py-20 px-6 md:px-12 lg:px-24 border-t border-gray-200 relative bg-white">
      <div className="absolute left-0 top-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <div className="max-w-5xl mx-auto">
        <SectionHeading 
          title="Featured Projects" 
          subtitle="Some of the recent projects I've built." 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {projects.map((project, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className="group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all hover:-translate-y-1 flex flex-col h-full shadow-sm"
            >
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full hover:bg-gray-100 border border-gray-200 transition-colors text-gray-600 shadow-sm"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                
                <p className="text-gray-600 mb-8 leading-relaxed flex-1">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tags.map((tag, tIdx) => (
                    <span 
                      key={tIdx}
                      className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20"
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
