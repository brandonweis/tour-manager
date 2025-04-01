import { pgTable, text, serial, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Driver Schema
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
});

export const insertDriverSchema = createInsertSchema(drivers).pick({
  name: true,
  location: true,
});

// Tour Schema
export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  shipmentDate: date("shipment_date").notNull(),
  locationFrom: text("location_from").notNull(),
  locationTo: text("location_to").notNull(),
  driverId: integer("driver_id"),
});

export const insertTourSchema = createInsertSchema(tours).pick({
  customerName: true,
  shipmentDate: true,
  locationFrom: true,
  locationTo: true,
  driverId: true,
});

// Custom validation for driver location (no numbers allowed)
export const driverLocationSchema = z.string().refine(
  (value) => !/\d/.test(value),
  { message: "Location cannot contain numbers" }
);

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;
