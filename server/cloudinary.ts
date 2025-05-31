import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Default upload options
export const defaultUploadOptions = {
  folder: 'quiz-images',
  transformation: [
    { width: 1200, height: 1200, crop: 'limit' },
    { quality: 'auto', fetch_format: 'auto' }
  ],
  resource_type: 'auto' as const
};

// Test Cloudinary connection
export async function testCloudinaryConnection() {
  try {
    await cloudinary.api.ping();
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return false;
  }
}

// Upload an image file to Cloudinary
export async function uploadToCloudinary(filePath: string, quizId: number) {
  try {
    console.log(`Uploading file to Cloudinary: ${filePath} for quiz ${quizId}`);
    
    // Upload to Cloudinary with optimization
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          ...defaultUploadOptions,
          tags: [`quiz_${quizId}`],
          transformation: [
            { width: 1200, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
            { dpr: "auto" }
          ],
          eager: [
            { width: 800, fetch_format: "auto", quality: 80 },
            { width: 400, fetch_format: "auto", quality: 75 }
          ],
          eager_async: false,
          invalidate: true,
          overwrite: true,
          use_asset_folder_as_public_id_prefix: true,
          responsive_breakpoints: {
            create_derived: true,
            bytes_step: 20000,
            min_width: 200,
            max_width: 1200,
            transformation: { quality: "auto:good", format: "auto" }
          }
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
      
      fs.createReadStream(filePath).pipe(uploadStream);
    });
    
    // Clean up the temporary file
    await fs.promises.unlink(filePath);
    
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

export { cloudinary };