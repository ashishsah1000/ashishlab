import { pgTable, serial, text, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  tier: varchar("tier", { length: 20 }).notNull(), // 'small' | 'medium' | 'large'
  valueInr: integer("value_inr").default(0).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  isRedeemed: boolean("is_redeemed").default(false).notNull(),
  redeemedAt: timestamp("redeemed_at"),
  associatedGoalId: integer("associated_goal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deadline: timestamp("deadline").notNull(),
  durationMonths: integer("duration_months").default(1),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'completed' | 'paused' | 'abandoned'
  rewardCategory: varchar("reward_category", { length: 20 }).default("medium").notNull(), // 'medium' | 'large'
  rewardId: integer("reward_id").references(() => rewards.id, { onDelete: "set null" }),
  mediumRewardUnlocked: boolean("medium_reward_unlocked").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topic: varchar("topic", { length: 255 }).notNull(),
  dailyAllottedMinutes: integer("daily_allotted_minutes").default(30).notNull(),
  targets: text("targets").notNull(),
  endOutput: text("end_output").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'completed'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const goalTasks = pgTable("goal_tasks", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  goalId: integer("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // 'YYYY-MM-DD'
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'completed' | 'skipped'
  estimatedMinutes: integer("estimated_minutes").default(30).notNull(),
  actualMinutes: integer("actual_minutes"),
  completionNotes: text("completion_notes"),
  aiSuggestion: text("ai_suggestion"),
  isWeekendBonus: boolean("is_weekend_bonus").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const weeklyRewardClaims = pgTable("weekly_reward_claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardId: integer("reward_id").references(() => rewards.id, { onDelete: "set null" }),
  weekStart: varchar("week_start", { length: 10 }).notNull(), // 'YYYY-MM-DD' of Monday
  completionRate: integer("completion_rate").notNull(),
  notes: text("notes"),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

export const goalChatMessages = pgTable("goal_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  goalId: integer("goal_id"),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
