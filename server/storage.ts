import { 
  users, type User, type InsertUser,
  quizzes, type Quiz, type InsertQuiz,
  questions, type Question, type InsertQuestion,
  quizAttempts, type QuizAttempt, type InsertQuizAttempt
} from "@shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'id'>): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Quiz operations
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizByAccessCode(accessCode: string): Promise<Quiz | undefined>;
  getQuizByUrlSlug(urlSlug: string): Promise<Quiz | undefined>;
  getQuizByDashboardToken(token: string): Promise<Quiz | undefined>;
  createQuiz(quiz: Omit<InsertQuiz, 'id'>): Promise<Quiz>;
  
  // Question operations
  getQuestions(quizId: string): Promise<Question[]>;
  createQuestion(question: Omit<InsertQuestion, 'id'>): Promise<Question>;
  
  // Quiz Attempt operations
  getQuizAttempts(quizId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: Omit<InsertQuizAttempt, 'id'>): Promise<QuizAttempt>;
  
  // Quiz expiration check
  isQuizExpired(quiz: Quiz): boolean;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async createUser(userData: Omit<InsertUser, 'id'>): Promise<User> {
    const id = nanoid();
    const [user] = await db.insert(users).values({
      ...userData,
      id
    }).returning();
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  // Quiz methods
  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }
  
  async getQuizByAccessCode(accessCode: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.accessCode, accessCode));
    return quiz;
  }
  
  async getQuizByUrlSlug(urlSlug: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.urlSlug, urlSlug));
    return quiz;
  }
  
  async getQuizByDashboardToken(token: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.dashboardToken, token));
    return quiz;
  }
  
  async createQuiz(quizData: Omit<InsertQuiz, 'id'>): Promise<Quiz> {
    const id = nanoid();
    const [quiz] = await db.insert(quizzes).values({
      ...quizData,
      id
    }).returning();
    return quiz;
  }
  
  // Question methods
  async getQuestions(quizId: string): Promise<Question[]> {
    const result = await db.select().from(questions).where(eq(questions.quizId, quizId));
    return result;
  }
  
  async createQuestion(questionData: Omit<InsertQuestion, 'id'>): Promise<Question> {
    const id = nanoid();
    const [question] = await db.insert(questions).values({
      ...questionData,
      id
    }).returning();
    return question;
  }
  
  // Quiz Attempt methods
  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    const result = await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
    return result.reverse(); // Reverse to get highest scores first
  }
  
  async createQuizAttempt(attemptData: Omit<InsertQuizAttempt, 'id'>): Promise<QuizAttempt> {
    const id = nanoid();
    const [attempt] = await db.insert(quizAttempts).values({
      ...attemptData,
      id
    }).returning();
    return attempt;
  }
  
  // Check if a quiz is expired (older than 7 days)
  isQuizExpired(quiz: Quiz): boolean {
    if (!quiz || !quiz.createdAt) return true;
    
    const now = new Date();
    const createdAt = new Date(quiz.createdAt);
    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    // Changed from 30 days to 7 days expiration policy
    return diffInDays > 7;
  }
}

// Create and export an instance of DatabaseStorage
export const storage = new DatabaseStorage();
