import { z } from "zod";
import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";

// Database Schema
export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  question: text('question').notNull(),
  options: text('options').array().notNull(),
  correctAnswer: integer('correct_answer').notNull(),
  explanation: text('explanation')
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Zod Schemas for Validation
export const QuizSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string().optional()
  })),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Quiz = z.infer<typeof QuizSchema>;

export const CreateQuizSchema = QuizSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type CreateQuiz = z.infer<typeof CreateQuizSchema>;

export const UpdateQuizSchema = CreateQuizSchema.partial();

export type UpdateQuiz = z.infer<typeof UpdateQuizSchema>; 