"use client";

import { motion } from "framer-motion";
import { Code2, Database, Globe2, LayoutTemplate } from "lucide-react";

const skillCategories = [
  {
    title: "Frontend",
    icon: <LayoutTemplate className="w-8 h-8" />,
    skills: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Antd"],
    color: "bg-pink-50 text-pink-600",
    border: "border-pink-100"
  },
  {
    title: "Backend & Systems",
    icon: <Code2 className="w-8 h-8" />,
    skills: ["Node.js", "Rust", "Python", "Express.js", "FastAPI", "Rust Axum"],
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100"
  },
  {
    title: "Geospatial & 3D",
    icon: <Globe2 className="w-8 h-8" />,
    skills: ["Cesium JS", "Three JS", "OpenLayers", "Potree", "Photogrammetry"],
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-100"
  },
  {
    title: "Databases & Tools",
    icon: <Database className="w-8 h-8" />,
    skills: ["MongoDB", "PostgreSQL", "Docker", "Jest", "Grafana"],
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100"
  }
];

export default function Skills() {
  return (
    <section id="skills" className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-background relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 mb-4 md:mb-6 tracking-tight">
            Technical <span className="text-gradient">Arsenal.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl">
            A comprehensive list of technologies and tools I've mastered.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillCategories.map((category, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`p-6 md:p-8 rounded-3xl md:rounded-[2rem] bg-white border ${category.border} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col`}
            >
              <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center mb-6`}>
                {category.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 font-heading tracking-tight">
                {category.title}
              </h3>
              
              <div className="flex flex-wrap gap-2 mt-auto">
                {category.skills.map((skill, sIdx) => (
                  <span 
                    key={sIdx}
                    className="px-4 py-2 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium border border-gray-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
