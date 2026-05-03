"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";

export default function About() {
  return (
    <section id="about" className="py-20 px-6 md:px-12 lg:px-24 border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto">
        <SectionHeading 
          title="About Me" 
          subtitle="A brief introduction to who I am and what I do." 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6 text-gray-600 text-lg leading-relaxed"
          >
            <p>
              For more than six years, I have been a dedicated contributor in the vast landscape of the web. My expertise spans full-stack development, automation, and R&D engineering, delivering industrial-grade web applications.
            </p>
            <p>
              My passion lies in the intersection of computer science and mathematics. Whether it's building performant React applications, developing scalable REST APIs in Rust and Node.js, or creating complex 3D data visualization systems with Cesium JS, Three JS, and OpenLayers, I thrive on solving complex technical challenges that require both robust backend architecture and smooth UX.
            </p>
            <p>
              Currently, I'm an <span className="text-gray-900 font-semibold">R&D Software Engineer at Ideaforge</span>, where I build end-to-end geospatial machine learning pipelines, drone map simulator viewers, and real-time drone data management platforms. Prior to this, I spent over 6 years at <span className="text-gray-900 font-semibold">Tata Steel</span> shaping their core industrial applications.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: "Years Experience", value: "6+" },
              { label: "Completed Projects", value: "30+" },
              { label: "Core Focus", value: "Full Stack & R&D" },
              { label: "Education", value: "MCA (Master's)" },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors shadow-sm">
                <span className="text-3xl font-bold text-gray-900 font-heading mb-2">{stat.value}</span>
                <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
