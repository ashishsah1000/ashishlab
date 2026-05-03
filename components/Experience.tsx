"use client";

import { motion } from "framer-motion";
import { Briefcase, Building2 } from "lucide-react";

const experiences = [
  {
    role: "R&D Software Engineer I",
    company: "Ideaforge Technology Ltd.",
    period: "04 Nov 2024 - Present",
    location: "Bengaluru, IN",
    description: [
      "Working on Flyght Cloud, an all-in-one drone data management platform for 3D analytics.",
      "Developed an end-to-end geospatial machine learning pipeline to detect stockpiles from DEM data using Python.",
      "Trained Random Forest classifiers with memory-efficient chunk processing by rasterizing GeoJSON.",
      "Created REST APIs in Rust Axum and developed user interfaces in React.js.",
      "Integrated Three JS with Potree.js and CesiumJs for 3D model processing.",
      "Lead frontend testing initiatives using JEST and auto-generation of unit test cases."
    ]
  },
  {
    role: "Senior Associate",
    company: "Tata Steel",
    period: "04/2018 - 10/2024",
    location: "Jamshedpur, IN",
    description: [
      "Contributed to the development and maintenance of industrial-grade web applications.",
      "Created and optimized RESTful services using Node.js.",
      "Co-developed an employee-facing e-learning platform using React.js and Express.js.",
      "Won First prize for web development at Nationals and multiple Gold Medals at Tata Ideas."
    ]
  }
];

export default function Experience() {
  return (
    <section id="experience" className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 mb-4 md:mb-6 tracking-tight">
            Work <span className="text-gradient">Experience.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl">
            A track record of building robust systems at scale.
          </p>
        </div>
        
        <div className="space-y-8">
          {experiences.map((exp, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/60 backdrop-blur-xl border border-gray-100 shadow-sm p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden bg-gray-50 group hover:border-gray-300"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="p-3 bg-white rounded-xl shadow-sm text-gray-900">
                      {idx === 0 ? <Briefcase className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 font-heading">{exp.role}</h3>
                  </div>
                  <p className="text-lg md:text-xl font-medium text-gray-600 pl-4 md:pl-14">{exp.company}</p>
                </div>
                <div className="flex flex-row md:flex-col gap-2 items-center md:items-end text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-widest pl-4 md:pl-0 flex-wrap">
                  <span className="bg-white px-4 py-2 rounded-lg shadow-sm">{exp.period}</span>
                  <span className="bg-gray-100 px-4 py-2 rounded-lg">{exp.location}</span>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:pl-14 text-gray-700 mt-6 md:mt-0">
                {exp.description.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-sm md:text-base">
                    <span className="text-primary mt-1">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
