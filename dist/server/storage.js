import { users, quizzes, questions, quizAttempts } from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
// Database storage implementation using Drizzle ORM
export class DatabaseStorage {
    // User methods
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async createUser(userData) {
        const id = nanoid();
        const [user] = await db.insert(users).values({
            ...userData,
            id
        }).returning();
        return user;
    }
    async getUserByEmail(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
    }
    // Quiz methods
    async getQuiz(id) {
        const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
        return quiz;
    }
    async getQuizByAccessCode(accessCode) {
        const [quiz] = await db.select().from(quizzes).where(eq(quizzes.accessCode, accessCode));
        return quiz;
    }
    async getQuizByUrlSlug(urlSlug) {
        const [quiz] = await db.select().from(quizzes).where(eq(quizzes.urlSlug, urlSlug));
        return quiz;
    }
    async getQuizByDashboardToken(token) {
        const [quiz] = await db.select().from(quizzes).where(eq(quizzes.dashboardToken, token));
        return quiz;
    }
    async createQuiz(quizData) {
        const id = nanoid();
        const [quiz] = await db.insert(quizzes).values({
            ...quizData,
            id
        }).returning();
        return quiz;
    }
    // Question methods
    async getQuestions(quizId) {
        const result = await db.select().from(questions).where(eq(questions.quizId, quizId));
        return result;
    }
    async createQuestion(questionData) {
        const id = nanoid();
        const [question] = await db.insert(questions).values({
            ...questionData,
            id
        }).returning();
        return question;
    }
    // Quiz Attempt methods
    async getQuizAttempts(quizId) {
        const result = await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
        return result.reverse(); // Reverse to get highest scores first
    }
    async createQuizAttempt(attemptData) {
        const id = nanoid();
        const [attempt] = await db.insert(quizAttempts).values({
            ...attemptData,
            id
        }).returning();
        return attempt;
    }
    // Check if a quiz is expired (older than 7 days)
    isQuizExpired(quiz) {
        if (!quiz || !quiz.createdAt)
            return true;
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
