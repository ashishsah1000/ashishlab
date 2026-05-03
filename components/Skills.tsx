"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";

const skillCategories = [
  {
    title: "Frontend Development",
    skills: ["React.js", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Redux", "Figma", "Antd"]
  },
  {
    title: "Backend & Systems",
    skills: ["Node.js", "Rust", "Python", "Express.js", "Fast API", "Hapi JS", "Rust Axum", "Django"]
  },
  {
    title: "Geospatial & 3D",
    skills: ["Cesium JS", "Three JS", "OpenLayers", "Leaflet JS", "Potree", "Rasterio", "Photogrammetry"]
  },
  {
    title: "Databases & Tools",
    skills: ["MongoDB", "PostgreSQL", "Docker", "Jest", "Grafana", "dexDB", "PyMavlink"]
  }
];

export default function Skills() {
  return (
    <section id="skills" className="py-20 px-6 md:px-12 lg:px-24 border-t border-gray-200 relative bg-white">
      <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="max-w-5xl mx-auto">
        <SectionHeading 
          title="Technical Skills" 
          subtitle="Technologies and tools I use to build robust software." 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {skillCategories.map((category, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {idx + 1}
                </span>
                {category.title}
              </h3>
              
              <div className="flex flex-wrap gap-3">
                {category.skills.map((skill, sIdx) => (
                  <span 
                    key={sIdx}
                    className="px-4 py-2 rounded-full bg-white text-gray-700 text-sm border border-gray-200 hover:border-primary/50 hover:text-primary transition-colors cursor-default shadow-sm"
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
