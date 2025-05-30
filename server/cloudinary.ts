import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

// Cloudinary setup with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djkecqprm',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to create read streams
function createReadStream(filePath: string) {
  return fs.createReadStream(filePath);
}

/**
 * Uploads an image file to Cloudinary with optimization
 * @param filePath Path to the local image file
 * @param quizId ID of the quiz for tagging
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(filePath: string, quizId: number) {
  try {
    console.log(`Uploading file to Cloudinary: ${filePath} for quiz ${quizId}`);
    
    // Get file extension to help identify file type
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Upload to Cloudinary with optimization (resize to 800px width and convert to WebP)
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'quiz-images',
          tags: [`quiz_${quizId}`],
          transformation: [
            { width: 800, crop: "limit" },
            { fetch_format: "auto", quality: "auto" }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      // Pipe the file to the upload stream
      createReadStream(filePath).pipe(uploadStream);
    });
    
    // Clean up the temporary file
    await fs.promises.unlink(filePath);
    
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Deletes all images from Cloudinary that match the given tag
 * @param quizId The quiz ID for tag matching
 * @returns Promise resolving to the deletion result
 */
export async function deleteImagesByQuizId(quizId: number) {
  try {
    console.log(`Deleting images for quiz ${quizId} from Cloudinary`);
    
    const result = await cloudinary.api.delete_resources_by_tag(`quiz:${quizId}`);
    
    console.log(`Successfully deleted images for quiz ${quizId}:`, result);
    return result;
  } catch (error) {
    console.error(`Error deleting images for quiz ${quizId}:`, error);
    throw error;
  }
}

/**
 * Cleanup function to delete all images for expired quizzes
 * @param oldQuizIds Array of expired quiz IDs to clean up
 * @returns Promise resolving to the cleanup result
 */
export async function cleanupOldQuizImages(oldQuizIds: number[]) {
  try {
    console.log(`Starting cleanup of images for ${oldQuizIds.length} expired quizzes`);
    
    const results = [];
    
    // Process deletions in batches to avoid rate limits
    for (const quizId of oldQuizIds) {
      try {
        const result = await deleteImagesByQuizId(quizId);
        results.push({ quizId, success: true, result });
      } catch (error) {
        results.push({ quizId, success: false, error });
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Completed cleanup of expired quiz images:`, results);
    return results;
  } catch (error) {
    console.error("Error in cleanupOldQuizImages:", error);
    throw error;
  }
}

/**
 * Tests the Cloudinary connection
 * @returns Promise resolving to the test result
 */
export async function testCloudinaryConnection() {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection successful:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Cloudinary connection error:', error);
    return { success: false, error };
  }
}