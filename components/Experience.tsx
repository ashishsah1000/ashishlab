"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";

const experiences = [
  {
    role: "R&D Software Engineer I",
    company: "Ideaforge Technology Ltd.",
    period: "04 Nov 2024 - Present",
    location: "Bengaluru, Karnataka",
    description: [
      "Working on Flyght Cloud, an all-in-one drone data management platform for drone-based mapping and 3D analytics.",
      "Developed an end-to-end geospatial machine learning pipeline to detect stockpiles from high-resolution DEM data using Python.",
      "Built multi-scale elevation differences, generated labeled datasets by rasterizing GeoJSON, and trained Random Forest classifiers with memory-efficient chunk processing.",
      "Created REST APIs in Rust Axum and developed user interfaces in React.js.",
      "Integrated Three JS by customizing the Potree.js library to handle 3D models in the browser, and worked on CesiumJs to integrate the 3D company use cases.",
      "Implemented Mission Planner web map drone viewer simulator using OpenLayers JS.",
      "Lead frontend testing initiatives using JEST and auto-generation of unit test cases using LLM."
    ]
  },
  {
    role: "Senior Associate",
    company: "Tata Steel",
    period: "04/2018 - 10/2024",
    location: "Jamshedpur, Jharkhand",
    description: [
      "Contributed to the development and maintenance of industrial-grade web applications.",
      "Played a key role in creating and optimizing RESTful services using Node.js.",
      "Co-developed an employee-facing e-learning platform using React.js, Node.js, and Express.js, delivering a smooth UX.",
      "Translated wireframes and mockups into clean, semantic HTML/CSS code.",
      "Followed best practices in coding standards, modular design, and test-driven development.",
      "Won First prize for web development at Nationals and multiple Gold Medals at Tata Ideas for developing app prototypes."
    ]
  }
];

export default function Experience() {
  return (
    <section id="experience" className="py-20 px-6 md:px-12 lg:px-24 border-t border-gray-200 bg-background">
      <div className="max-w-4xl mx-auto">
        <SectionHeading 
          title="Work Experience" 
          subtitle="My professional journey and roles." 
        />
        
        <div className="mt-16 space-y-12">
          {experiences.map((exp, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className="relative pl-8 md:pl-0"
            >
              <div className="md:grid md:grid-cols-5 md:gap-8 items-start">
                <div className="hidden md:block col-span-1 pt-1 text-gray-500 text-sm text-right font-semibold">
                  {exp.period}
                </div>
                
                <div className="md:col-span-4 relative border-l-2 border-gray-200 pl-8 pb-8">
                  {/* Timeline dot */}
                  <div className="absolute w-4 h-4 rounded-full bg-primary -left-[9px] top-1 ring-4 ring-background" />
                  
                  <div className="md:hidden text-primary text-sm font-semibold mb-2">
                    {exp.period}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{exp.role}</h3>
                  <div className="text-lg text-gray-700 font-medium mb-4 flex items-center gap-2">
                    <span>{exp.company}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-sm">{exp.location}</span>
                  </div>
                  
                  <ul className="space-y-3 text-gray-600">
                    {exp.description.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-primary mt-1.5 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
