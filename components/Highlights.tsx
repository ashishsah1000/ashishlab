"use client";

import { motion } from "framer-motion";
import { 
  Server, 
  BrainCircuit, 
  Map, 
  Video, 
  Search, 
  ShieldCheck, 
  BookOpen, 
  CreditCard,
  Box
} from "lucide-react";
import { useRef } from "react";

const highlights = [
  {
    title: "Backend Architecture & Optimization",
    description: "Architected  backend APIs across diverse ecosystems using Rust, Python, and Node.js. Designed efficient data processing pipelines and implemented rigorous memory optimization strategies, reducing server load and dramatically improving response times for concurrent requests.",
    icon: <Server className="w-8 h-8 text-blue-600" />,
    color: "bg-blue-50 border-blue-100"
  },
  {
    title: "Geospatial ML & R&D",
    description: "Transformed  research concepts into production-ready geospatial solutions, including real-time flood simulation and autonomous terrain and stockpile detection. Developed proprietary classification mathematical models utilizing complex algorithms to accurately detect slopes and map empty landscapes from raw drone data.",
    icon: <BrainCircuit className="w-8 h-8 text-purple-600" />,
    color: "bg-purple-50 border-purple-100"
  },
  {
    title: "Web 3D Rendering",
    description: "Engineered immersive, high-performance 3D models for the web leveraging advanced libraries like Potree and Three.js. Implemented cutting-edge techniques, including Gaussian Splatting algorithms, to optimize 3D rendering pipelines and deliver seamless interactive visualizations directly in the browser.",
    icon: <Box className="w-8 h-8 text-cyan-600" />,
    color: "bg-cyan-50 border-cyan-100"
  },
  {
    title: "Dynamic Interactive Mapping",
    description: "Engineered rich, highly interactive mapping interfaces utilizing libraries such as OpenLayers and Leaflet. Implemented real-time telemetry rendering to track live drone locations, visualize historical flight journeys, and deploy complex spatial annotations with sub-second latency.",
    icon: <Map className="w-8 h-8 text-emerald-600" />,
    color: "bg-emerald-50 border-emerald-100"
  },
  {
    title: "AI Video Intelligence",
    description: "Pioneered intelligent video analysis pipelines that automatically process footage captured by drones. Built advanced AI-driven auto-summarization engines capable of extracting meaningful metadata and generating actionable, time-stamped business insights directly from unstructured video data.",
    icon: <Video className="w-8 h-8 text-orange-600" />,
    color: "bg-orange-50 border-orange-100"
  },
  {
    title: "Tooling & SEO Automation",
    description: "Developed comprehensive internal tooling ecosystems, including an advanced automated asset management platform. Spearheaded deep technical SEO optimization initiatives for React.js applications, implementing dynamic rendering techniques to maximize search engine visibility and accessibility.",
    icon: <Search className="w-8 h-8 text-pink-600" />,
    color: "bg-pink-50 border-pink-100"
  },
  {
    title: "Quality Assurance & Testing",
    description: "Led comprehensive testing initiatives to safeguard system reliability during aggressive, fast-paced AI product development cycles. Established robust testing frameworks targeting mission-critical user flows, significantly elevating overall test coverage and preventing critical regressions.",
    icon: <ShieldCheck className="w-8 h-8 text-teal-600" />,
    color: "bg-teal-50 border-teal-100"
  },
  {
    title: "RAG & Advanced LLMs",
    description: "Engineered robust Retrieval-Augmented Generation (RAG) architectures leveraging FastAPI and LlamaIndex. Designed scalable semantic search systems capable of parsing vast data repositories to generate highly accurate, source-verified information retrieval and contextual conversational agents.",
    icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
    color: "bg-indigo-50 border-indigo-100"
  },
  {
    title: "Real-time Comm & Payments",
    description: "Integrated the complex Zoom Video SDK into Study Send to facilitate seamless, high-quality live video tutoring sessions directly within the browser. Architected the accompanying secure, end-to-end payment gateway flows to handle global transactions safely and efficiently.",
    icon: <CreditCard className="w-8 h-8 text-rose-600" />,
    color: "bg-rose-50 border-rose-100"
  }
];

export default function Highlights() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-24 mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 mb-4 tracking-tight">
            What I <span className="text-gradient">Understand.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl">
            A highlight reel of my core expertise and impactful contributions.
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={scrollLeft}
            className="p-4 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm text-gray-700"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={scrollRight}
            className="p-4 rounded-full bg-gray-900 border border-gray-900 hover:bg-gray-800 transition-colors shadow-sm text-white"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="relative w-full">
        {/* Left/Right Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div 
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 md:px-12 lg:px-24 pb-12 pt-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {highlights.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`w-[320px] md:w-[320px] lg:w-[340px] snap-center shrink-0 p-8 rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 ${item.color} bg-opacity-50 backdrop-blur-sm whitespace-normal`}
            >
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-white/50">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 font-heading leading-tight">
                {item.title}
              </h3>
              <p className="text-gray-700 leading-relaxed text-base text-balance">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
