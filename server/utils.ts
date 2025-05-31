import { mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { ZodError } from 'zod';

// Safely delete a file, ignoring if it doesn't exist
export async function safeDelete(filepath: string): Promise<void> {
    try {
        if (existsSync(filepath)) {
            await unlink(filepath);
        }
    } catch (error) {
        console.warn(`Warning: Could not delete file ${filepath}:`, error);
    }
}

// Create temp directory if it doesn't exist
export async function ensureTempDir(tempDir: string): Promise<void> {
    try {
        if (!existsSync(tempDir)) {
            await mkdir(tempDir, { recursive: true });
        }
    } catch (error) {
        console.error(`Error creating temp directory ${tempDir}:`, error);
        throw new Error('Failed to create temporary upload directory');
    }
}

interface ErrorResponse {
    message: string;
    code: string;
    details?: any;
    validation?: Record<string, string[]>;
}

// Format error message for client
export function formatErrorResponse(error: unknown): ErrorResponse {
    if (error instanceof Error) {
        // Handle Zod validation errors
        if ((error as any).name === 'ZodError') {
            const zodError = error as ZodError;
            return {
                message: 'Validation Error',
                code: 'VALIDATION_ERROR',
                validation: zodError.errors.reduce((acc, err) => {
                    const path = err.path.join('.');
                    if (!acc[path]) acc[path] = [];
                    acc[path].push(err.message);
                    return acc;
                }, {} as Record<string, string[]>)
            };
        }

        return {
            message: error.message,
            details: error.stack,
            code: (error as any).code || 'UNKNOWN_ERROR'
        };
    }
    
    return {
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR'
    };
}

// Format validation error response
export function formatValidationError(errors: Record<string, string[]>): ErrorResponse {
    return {
        message: 'Validation Error',
        code: 'VALIDATION_ERROR',
        validation: errors
    };
}
