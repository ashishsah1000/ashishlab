"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-background relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 mb-6 tracking-tight">
            Behind the <span className="text-gradient">Code.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
            Passionate about mathematics, algorithms, and beautiful interfaces. I thrive on building tools that empower industries.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bio */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm p-8 md:p-12 rounded-3xl bg-gray-50/50"
          >
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                For more than six years, I have been a dedicated contributor in the vast landscape of the web. My expertise spans full-stack development, automation, and R&D engineering.
              </p>
              <p>
                My passion lies in the intersection of computer science and mathematics. Whether it's building performant React applications, developing scalable REST APIs in Rust and Node.js, or creating complex 3D data visualization systems with Cesium JS, Three JS, and OpenLayers, I thrive on solving complex technical challenges.
              </p>
              <p>
                Currently, I'm an <strong className="text-gray-900">R&D Software Engineer at Ideaforge</strong>, where I build end-to-end geospatial machine learning pipelines, drone map simulator viewers, and real-time drone data management platforms. Prior to this, I spent over 6 years at <strong className="text-gray-900">Tata Steel</strong> shaping their core industrial applications.
              </p>
            </div>
          </motion.div>
          
          {/* Stats Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-white/60 backdrop-blur-xl border border-blue-100 shadow-sm p-8 rounded-3xl flex-1 flex flex-col justify-center items-center text-center bg-blue-50/50">
              <h4 className="text-5xl font-black text-blue-600 mb-2 font-heading">6+</h4>
              <p className="text-gray-600 font-medium">Years Experience</p>
            </div>
            <div className="bg-white/60 backdrop-blur-xl border border-purple-100 shadow-sm p-8 rounded-3xl flex-1 flex flex-col justify-center items-center text-center bg-purple-50/50">
              <h4 className="text-5xl font-black text-purple-600 mb-2 font-heading">30+</h4>
              <p className="text-gray-600 font-medium">Projects Delivered</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
