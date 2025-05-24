import { z } from "zod";
import { pgTable, text, timestamp, integer, uuid, boolean } from "drizzle-orm/pg-core";

// Database Schema
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  accessCode: text('access_code'),
  urlSlug: text('url_slug'),
  dashboardToken: text('dashboard_token'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  question: text('question').notNull(),
  options: text('options').array().notNull(),
  correctAnswer: integer('correct_answer').notNull(),
  explanation: text('explanation'),
  order: integer('order').notNull().default(0)
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Zod Schemas for Validation
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;

export const InsertUserSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertUser = z.infer<typeof InsertUserSchema>;

export const QuizSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  accessCode: z.string().nullable(),
  urlSlug: z.string().nullable(),
  dashboardToken: z.string().nullable(),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
    explanation: z.string().nullable(),
    order: z.number()
  })),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Quiz = z.infer<typeof QuizSchema>;

export const InsertQuizSchema = QuizSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  questions: true
});

export type InsertQuiz = z.infer<typeof InsertQuizSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string().nullable(),
  order: z.number()
});

export type Question = z.infer<typeof QuestionSchema>;

export const InsertQuestionSchema = QuestionSchema.omit({ 
  id: true 
});

export type InsertQuestion = z.infer<typeof InsertQuestionSchema>;

export const QuizAttemptSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  score: z.number(),
  createdAt: z.date()
});

export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;

export const InsertQuizAttemptSchema = QuizAttemptSchema.omit({ 
  id: true,
  createdAt: true
});

export type InsertQuizAttempt = z.infer<typeof InsertQuizAttemptSchema>; 