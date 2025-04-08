import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = async (
  base64Image: string,
  folder: string = "snippets"
) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: "auto",
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Error uploading to cloudinary:", error);
    return {
      success: false,
      error,
    };
  }
};

export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === "ok",
      result,
    };
  } catch (error) {
    console.error("Error deleting from cloudinary:", error);
    return {
      success: false,
      error,
    };
  }
};
