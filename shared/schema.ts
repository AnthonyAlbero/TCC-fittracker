import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Foods table - banco de alimentos com calorias por porção
export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Proteína, Carboidrato, Vegetal, Fruta, etc.
  calories: integer("calories").notNull(), // calorias por porção padrão
  portion: integer("portion").notNull(), // porção em gramas
  protein: real("protein"), // proteína em gramas
  carbs: real("carbs"), // carboidratos em gramas
  fat: real("fat"), // gordura em gramas
});

export const insertFoodSchema = createInsertSchema(foods).omit({ id: true });
export type InsertFood = z.infer<typeof insertFoodSchema>;
export type Food = typeof foods.$inferSelect;

// Exercises table - banco de exercícios com gasto calórico
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Cardio, Força, Flexibilidade, Esporte
  caloriesPerMinute: real("calories_per_minute").notNull(), // calorias gastas por minuto para pessoa de 70kg
  intensity: text("intensity").notNull(), // Leve, Moderado, Intenso
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// User profiles - perfil do usuário
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  age: integer("age").notNull(),
  height: integer("height").notNull(), // em cm
  weight: real("weight").notNull(), // em kg
  gender: text("gender").notNull(), // male ou female
  activityLevel: text("activity_level").notNull(), // sedentary, light, moderate, active, very_active
  goal: text("goal").default('maintain'), // maintain, lean_bulk, aggressive_bulk, cut, aggressive_cut
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, updatedAt: true }).extend({
  goal: createInsertSchema(userProfiles).shape.goal.optional().default('maintain')
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Food entries - registro de alimentos consumidos
export const foodEntries = pgTable("food_entries", {
  id: serial("id").primaryKey(),
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull(),
  portion: real("portion").notNull(), // em gramas
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:MM
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFoodEntrySchema = createInsertSchema(foodEntries).omit({ id: true, createdAt: true });
export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;
export type FoodEntry = typeof foodEntries.$inferSelect;

// Workout entries - registro de treinos realizados
export const workoutEntries = pgTable("workout_entries", {
  id: serial("id").primaryKey(),
  exerciseName: text("exercise_name").notNull(),
  category: text("category").notNull(),
  duration: integer("duration").notNull(), // em minutos
  caloriesBurned: integer("calories_burned").notNull(),
  intensity: text("intensity"),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:MM
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkoutEntrySchema = createInsertSchema(workoutEntries).omit({ id: true, createdAt: true });
export type InsertWorkoutEntry = z.infer<typeof insertWorkoutEntrySchema>;
export type WorkoutEntry = typeof workoutEntries.$inferSelect;
