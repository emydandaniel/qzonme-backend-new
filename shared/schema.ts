import { pgTable, text, timestamp, integer, json } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

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
  options: json('options').$type<string[]>().notNull(),
  correctAnswer: integer('correct_answer').notNull(),
  explanation: text('explanation'),
  order: integer('order').notNull()
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Zod Schemas
export const UserSchema = createSelectSchema(users);
export const QuizSchema = createSelectSchema(quizzes);
export const QuestionSchema = createSelectSchema(questions);
export const QuizAttemptSchema = createSelectSchema(quizAttempts);

// Insert Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts);

// Additional Schemas
export const questionAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.number()
});

// Types
export type User = z.infer<typeof UserSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;
export type QuestionAnswer = z.infer<typeof questionAnswerSchema>;

// Insert Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>; 