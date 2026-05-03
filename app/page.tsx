import About from "@/components/About";
import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Navigation could go here, but keeping it minimal per requirements */}
      
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Contact />
      
    </main>
  );
}
