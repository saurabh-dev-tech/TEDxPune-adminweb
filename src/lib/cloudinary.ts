import axios from "axios";

/**
 * Uploads a file (Image, Video, or Raw Document) to Cloudinary.
 * 1. Tries direct unsigned Cloudinary client upload if credentials/preset exist.
 * 2. Tries backend upload endpoints (/api/v1/upload, /api/v1/admin/upload, /api/v1/posts/upload).
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "posts/images"
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dirarq6it";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const resourceType = file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("image/")
    ? "image"
    : "raw";

  // Attempt 1: Direct Cloudinary Unsigned Upload
  try {
    const directFormData = new FormData();
    directFormData.append("file", file);
    directFormData.append("upload_preset", uploadPreset);
    directFormData.append("folder", folder);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      directFormData
    );
    if (res.data?.secure_url) {
      return res.data.secure_url;
    }
  } catch {
    // Fall through to backend API attempts
  }

  // Attempt 2: Backend Upload Endpoints
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    "Content-Type": "multipart/form-data",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const endpoints = [
    `${baseUrl}/api/v1/upload`,
    `${baseUrl}/api/v1/posts/upload`,
    `${baseUrl}/api/v1/admin/upload`,
  ];

  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      const res = await axios.post(endpoint, formData, { headers });
      const url = res.data?.secure_url || res.data?.url || res.data?.data?.url;
      if (url) return url;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Upload endpoint not found.");
}
