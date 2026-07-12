import { pgTable, serial, text, varchar, jsonb } from "drizzle-orm/pg-core";

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
