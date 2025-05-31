import { mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
// Safely delete a file, ignoring if it doesn't exist
export async function safeDelete(filepath) {
    try {
        if (existsSync(filepath)) {
            await unlink(filepath);
        }
    }
    catch (error) {
        console.warn(`Warning: Could not delete file ${filepath}:`, error);
    }
}
// Create temp directory if it doesn't exist
export async function ensureTempDir(tempDir) {
    try {
        if (!existsSync(tempDir)) {
            await mkdir(tempDir, { recursive: true });
        }
    }
    catch (error) {
        console.error(`Error creating temp directory ${tempDir}:`, error);
        throw new Error('Failed to create temporary upload directory');
    }
}
// Format error message for client
export function formatErrorResponse(error) {
    if (error instanceof Error) {
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
            const zodError = error;
            return {
                message: 'Validation Error',
                code: 'VALIDATION_ERROR',
                validation: zodError.errors.reduce((acc, err) => {
                    const path = err.path.join('.');
                    if (!acc[path])
                        acc[path] = [];
                    acc[path].push(err.message);
                    return acc;
                }, {})
            };
        }
        return {
            message: error.message,
            details: error.stack,
            code: error.code || 'UNKNOWN_ERROR'
        };
    }
    return {
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR'
    };
}
// Format validation error response
export function formatValidationError(errors) {
    return {
        message: 'Validation Error',
        code: 'VALIDATION_ERROR',
        validation: errors
    };
}
