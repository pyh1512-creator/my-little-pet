export const CLOUDINARY_CLOUD_NAME = 's41oaria';
export const CLOUDINARY_UPLOAD_PRESET = 'my-web';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadImageToCloudinary(
  file: File | Blob,
  options?: { folder?: string; filename?: string }
): Promise<CloudinaryUploadResult> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('이미지 크기는 최대 10MB까지 업로드할 수 있습니다.');
  }

  const formData = new FormData();
  if (file instanceof File) {
    formData.append('file', file);
  } else {
    formData.append('file', file, options?.filename ?? `pet-snapshot-${Date.now()}.png`);
  }
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (options?.folder) {
    formData.append('folder', options.folder);
  }

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  const json = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    error?: { message?: string };
  };

  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message || 'Cloudinary 이미지 업로드에 실패했습니다.');
  }

  return {
    secureUrl: json.secure_url,
    publicId: json.public_id ?? '',
    width: json.width ?? 0,
    height: json.height ?? 0,
  };
}
