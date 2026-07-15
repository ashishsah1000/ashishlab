import { pgTable, serial, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

export const labnotes = pgTable("labnotes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subHeading: varchar("sub_heading", { length: 255 }),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  tags: varchar("tags", { length: 255 }),
  visibility: varchar("visibility", { length: 20 }).default("public").notNull(),
  shareToken: varchar("share_token", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
