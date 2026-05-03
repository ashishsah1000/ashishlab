"use server";

import { db } from "@/db";
import { resumeAbout, resumeExperience, resumeProjects, resumeSkills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ABOUT
export async function getResumeAbout() {
  const abouts = await db.select().from(resumeAbout).limit(1);
  return abouts[0];
}

export async function updateResumeAbout(data: any, password?: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Invalid admin password");
  }
  const existing = await getResumeAbout();
  if (existing) {
    await db.update(resumeAbout).set(data).where(eq(resumeAbout.id, existing.id));
  } else {
    await db.insert(resumeAbout).values(data);
  }
  revalidatePath("/");
  revalidatePath("/resume/edit");
}

// EXPERIENCE
export async function getResumeExperience() {
  return await db.select().from(resumeExperience).orderBy(resumeExperience.orderIdx);
}

export async function updateResumeExperience(items: any[], password?: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Invalid admin password");
  }
  // Simplest way: delete all and insert new
  await db.delete(resumeExperience);
  if (items.length > 0) {
    await db.insert(resumeExperience).values(items);
  }
  revalidatePath("/");
  revalidatePath("/resume/edit");
}

// PROJECTS
export async function getResumeProjects() {
  return await db.select().from(resumeProjects).orderBy(resumeProjects.orderIdx);
}

export async function updateResumeProjects(items: any[], password?: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Invalid admin password");
  }
  await db.delete(resumeProjects);
  if (items.length > 0) {
    await db.insert(resumeProjects).values(items);
  }
  revalidatePath("/");
  revalidatePath("/resume/edit");
}

// SKILLS
export async function getResumeSkills() {
  return await db.select().from(resumeSkills).orderBy(resumeSkills.orderIdx);
}

export async function updateResumeSkills(items: any[], password?: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Invalid admin password");
  }
  await db.delete(resumeSkills);
  if (items.length > 0) {
    await db.insert(resumeSkills).values(items);
  }
  revalidatePath("/");
  revalidatePath("/resume/edit");
}

// SEED DB IF EMPTY
export async function seedResumeData() {
  const about = await getResumeAbout();
  if (!about) {
    await db.insert(resumeAbout).values({
      name: "Ashish Sah",
      title: "Full Stack & R&D Software Engineer",
      bio: "For more than six years, I have been a dedicated contributor in the vast landscape of the web. My expertise spans full-stack development, automation, and R&D engineering.\n\nMy passion lies in the intersection of computer science and mathematics. Whether it's building performant React applications, developing scalable REST APIs in Rust and Node.js, or creating complex 3D data visualization systems with Cesium JS, Three JS, and OpenLayers, I thrive on solving complex technical challenges.\n\nCurrently, I'm an R&D Software Engineer at Ideaforge, where I build end-to-end geospatial machine learning pipelines, drone map simulator viewers, and real-time drone data management platforms. Prior to this, I spent over 6 years at Tata Steel shaping their core industrial applications.",
      email: "ashishsah1000@gmail.com",
      phone: "9631640767",
      location: "Bengaluru, IN",
      github: "https://github.com/ashishsah1000",
      linkedin: "https://www.linkedin.com/in/ashishsah1000/"
    });

    await db.insert(resumeExperience).values([
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
    ]);

    await db.insert(resumeProjects).values([
      {
        title: "Study Send",
        url: "https://www.studysend.com/",
        description: "An AI-powered education platform to upload study materials, generate AI-powered exams, and create revision cards. Integrated Zoom SDK and full RAG pipeline.",
        tags: ["Llama", "Python", "Drizzle ORM", "Zoom SDK", "RAG"]
      },
      {
        title: "Grad AI",
        url: "https://www.gradai.in/",
        description: "An AI-powered resume builder featuring prompt chaining, langchain integration, multiple templates, and robust authentication flow.",
        tags: ["Next.js", "Rust", "Gemini AI", "Python", "MongoDB"]
      }
    ]);

    await db.insert(resumeSkills).values([
      {
        category: "Frontend",
        skills: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Antd"]
      },
      {
        category: "Backend & Systems",
        skills: ["Node.js", "Rust", "Python", "Express.js", "FastAPI", "Rust Axum"]
      },
      {
        category: "Geospatial & 3D",
        skills: ["Cesium JS", "Three JS", "OpenLayers", "Potree", "Photogrammetry"]
      },
      {
        category: "Databases & Tools",
        skills: ["MongoDB", "PostgreSQL", "Docker", "Jest", "Grafana"]
      }
    ]);
  }
}
