import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import { join } from 'path';
import { quizzes, questions, quizAttempts, type Quiz, type Question } from '../shared/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';
import { db } from './db.js';
import { uploadToCloudinary } from './cloudinary.js';
import { safeDelete, ensureTempDir, formatErrorResponse } from './utils.js';
import { z } from 'zod';
import type { Server } from 'http';

// Configure multer for handling file uploads
const tempUploadsDir = 'dist/temp_uploads/';
const upload = multer({ dest: tempUploadsDir });

// Create router instance
const router = Router();

// Validation schemas
const insertQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  accessCode: z.string().min(4),
  urlSlug: z.string().min(1),
  dashboardToken: z.string().min(1)
});

const insertQuestionSchema = z.object({
  quizId: z.string(),
  question: z.string().min(1),
  type: z.literal('multiple-choice'),
  options: z.array(z.string()),  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().nullable(),
  order: z.number(),
  imageUrl: z.string().nullable()
});

const questionAnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.union([z.string(), z.array(z.string())]),
  isCorrect: z.boolean()
});

const insertAttemptSchema = z.object({
  quizId: z.string(),
  userAnswerId: z.string(),
  userName: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  answers: z.array(questionAnswerSchema)
});

// Error handling middleware
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response) => {
    fn(req, res).catch((error) => {
      console.error('API Error:', error);
      res.status(500).json(formatErrorResponse(error));
    });
  };
};

// Quiz routes
router.post("/api/quizzes", asyncHandler(async (req: Request, res: Response) => {
  const quizData = insertQuizSchema.parse(req.body);

  // Check for duplicate accessCode or urlSlug
  const existingQuiz = await db
    .select()
    .from(quizzes)
    .where(or(
      eq(quizzes.accessCode, quizData.accessCode),
      eq(quizzes.urlSlug, quizData.urlSlug)
    ))
    .limit(1);

  if (existingQuiz.length > 0) {
    return res.status(409).json({
      error: 'Duplicate quiz',
      details: 'A quiz with this access code or URL already exists'
    });
  }

  // Create quiz with expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  const [newQuiz] = await db.insert(quizzes)
    .values({
      id: crypto.randomUUID(),
      title: quizData.title,
      description: quizData.description,
      accessCode: quizData.accessCode,
      urlSlug: quizData.urlSlug,
      dashboardToken: quizData.dashboardToken,
      expiresAt: expiryDate,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  res.status(201).json(newQuiz);
}));

// Get quiz by access code
router.get("/api/quizzes/code/:accessCode", asyncHandler(async (req: Request, res: Response) => {
  const { accessCode } = req.params;
  
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.accessCode, accessCode))
    .limit(1);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  res.json(quiz);
}));

// Get quiz by URL slug
router.get("/api/quizzes/slug/:urlSlug", asyncHandler(async (req: Request, res: Response) => {
  const { urlSlug } = req.params;
  
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.urlSlug, urlSlug))
    .limit(1);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  res.json(quiz);
}));

// Get quiz by dashboard token
router.get("/api/quizzes/dashboard/:token", asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.dashboardToken, token))
    .limit(1);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  res.json(quiz);
}));

// Get quiz by ID
router.get("/api/quizzes/:id", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  res.json(quiz);
}));

// Create question
router.post("/api/questions", asyncHandler(async (req: Request, res: Response) => {
  const questionData = insertQuestionSchema.parse(req.body);
  const [question] = await db.insert(questions)
    .values({
      id: crypto.randomUUID(),
      quizId: questionData.quizId,
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation || null,
      order: questionData.order,
      imageUrl: questionData.imageUrl || null
    })
    .returning();

  res.status(201).json(question);
}));

// Get questions for quiz
router.get("/api/quizzes/:quizId/questions", asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  
  const questionsList = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(desc(questions.order));

  res.json(questionsList);
}));

// Create quiz attempt
router.post("/api/quiz-attempts", asyncHandler(async (req: Request, res: Response) => {
  const attemptData = insertAttemptSchema.parse(req.body);
  
  // Verify quiz exists
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, attemptData.quizId))
    .limit(1);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Create attempt
  const [newAttempt] = await db.insert(quizAttempts)
    .values({
      id: crypto.randomUUID(),
      quizId: attemptData.quizId,
      score: attemptData.score,
      createdAt: new Date()
    })
    .returning();

  const attempt = {
    ...newAttempt,
    userName: attemptData.userName,
    userAnswerId: attemptData.userAnswerId,
    totalQuestions: attemptData.totalQuestions,
    answers: attemptData.answers,
    completedAt: newAttempt.createdAt
  };

  res.status(201).json(attempt);
}));

// Get attempts for quiz
router.get("/api/quizzes/:quizId/attempts", asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, quizId))
    .orderBy(desc(quizAttempts.createdAt));

  res.json({
    data: attempts,
    serverTime: Date.now()
  });
}));

// Image upload endpoint
router.post("/api/upload-image", upload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'MISSING_FILE'
    });
  }

  try {
    await ensureTempDir(tempUploadsDir);
    
    const quizId = req.body.quizId;
    const result = await uploadToCloudinary(req.file.path, quizId);
    
    res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    await safeDelete(req.file.path);
    throw error;
  }
}));

export function registerRoutes(app: express.Application): Promise<Server> {
  // Register API routes
  app.use('/api', router);
  
  // Catch-all route for non-API requests
  app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.status(404).json({ error: 'Not found', message: 'This is an API server. Please use the frontend application to access this service.' });
    }
  });

  // Start server
  const port = process.env.PORT || 10000;
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      resolve(server);
    });
  });
}
