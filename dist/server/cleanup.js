import { Router } from 'express';
import { cloudinary } from './cloudinary.js';
const router = Router();
const EXPIRY_DAYS = 7; // Match quiz expiry period
let currentCleanupJob = null;
const cleanupHistory = [];
let lastCleanupRun = null;
let nextCleanupRun = null;
export function getCleanupStatus() {
    return {
        currentJob: currentCleanupJob,
        history: cleanupHistory.slice(-10), // Keep last 10 jobs
        lastRun: lastCleanupRun,
        nextRun: nextCleanupRun
    };
}
export async function cleanupExpiredImages() {
    const stats = {
        startTime: new Date(),
        endTime: null,
        imagesProcessed: 0,
        imagesDeleted: 0,
        errors: []
    };
    currentCleanupJob = stats;
    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - EXPIRY_DAYS);
        // Get list of resources from Cloudinary
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'quiz-images/',
            max_results: 500
        });
        stats.imagesProcessed = result.resources.length;
        for (const resource of result.resources) {
            try {
                const uploadedAt = new Date(resource.created_at);
                if (uploadedAt < expiryDate) {
                    await cloudinary.uploader.destroy(resource.public_id);
                    stats.imagesDeleted++;
                }
            }
            catch (error) {
                stats.errors.push(error instanceof Error ? error : new Error(String(error)));
            }
        }
    }
    catch (error) {
        stats.errors.push(error instanceof Error ? error : new Error(String(error)));
    }
    finally {
        stats.endTime = new Date();
        cleanupHistory.push(stats);
        currentCleanupJob = null;
        lastCleanupRun = stats.endTime;
        nextCleanupRun = new Date(stats.endTime.getTime() + 24 * 60 * 60 * 1000); // Next run in 24 hours
    }
    return stats;
}
export function scheduleCleanupTask(initialDelay = 300000) {
    setTimeout(() => {
        cleanupExpiredImages().catch(console.error);
        // Schedule next run in 24 hours
        scheduleCleanupTask(24 * 60 * 60 * 1000);
    }, initialDelay);
}
// Add monitoring endpoint
router.get('/api/cleanup/status', (req, res) => {
    res.json(getCleanupStatus());
});
export { router as cleanupRouter };
