import { pgTable, serial, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

export const labnotes = pgTable("labnotes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subHeading: varchar("sub_heading", { length: 255 }),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  tags: varchar("tags", { length: 255 }), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Resume Tables

export const resumeAbout = pgTable("resume_about", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  bio: text("bio").notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  location: varchar("location", { length: 100 }),
  github: varchar("github", { length: 200 }),
  linkedin: varchar("linkedin", { length: 200 }),
});

export const resumeExperience = pgTable("resume_experience", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 200 }).notNull(),
  company: varchar("company", { length: 200 }).notNull(),
  period: varchar("period", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }),
  description: jsonb("description").notNull(), // Array of strings
  orderIdx: serial("order_idx"),
});

export const resumeProjects = pgTable("resume_projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }),
  description: text("description").notNull(),
  tags: jsonb("tags").notNull(), // Array of strings
  orderIdx: serial("order_idx"),
});

export const resumeSkills = pgTable("resume_skills", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  skills: jsonb("skills").notNull(), // Array of strings
  orderIdx: serial("order_idx"),
});
