import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function handler(event, context) {
  const { image } = JSON.parse(event.body);
  try {
    const result = await cloudinary.uploader.upload(image);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
