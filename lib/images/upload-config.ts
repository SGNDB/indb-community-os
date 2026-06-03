export type ImageUploadKind = "avatar" | "cover" | "post" | "memory";

export type ImageValidationError = "invalidType" | "tooLarge";

export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const IMAGE_UPLOAD_CONFIG: Record<
  ImageUploadKind,
  {
    maxOriginalBytes: number;
    targetMaxBytes: number;
    compressionMaxSizeMB: number;
    maxWidthOrHeight: number;
  }
> = {
  avatar: {
    maxOriginalBytes: 5 * 1024 * 1024,
    targetMaxBytes: 1 * 1024 * 1024,
    compressionMaxSizeMB: 1,
    maxWidthOrHeight: 1024,
  },
  cover: {
    maxOriginalBytes: 10 * 1024 * 1024,
    targetMaxBytes: 2 * 1024 * 1024,
    compressionMaxSizeMB: 2,
    maxWidthOrHeight: 1920,
  },
  post: {
    maxOriginalBytes: 10 * 1024 * 1024,
    targetMaxBytes: 2 * 1024 * 1024,
    compressionMaxSizeMB: 2,
    maxWidthOrHeight: 1920,
  },
  memory: {
    maxOriginalBytes: 15 * 1024 * 1024,
    targetMaxBytes: 3 * 1024 * 1024,
    compressionMaxSizeMB: 3,
    maxWidthOrHeight: 2400,
  },
};

export function validateImageFile(file: File, kind: ImageUploadKind): ImageValidationError | null {
  if (!isAllowedImageFile(file)) {
    return "invalidType";
  }

  if (file.size > IMAGE_UPLOAD_CONFIG[kind].maxOriginalBytes) {
    return "tooLarge";
  }

  return null;
}

export function validateCompressedImageFile(file: File, kind: ImageUploadKind): ImageValidationError | null {
  if (!isAllowedImageFile(file)) {
    return "invalidType";
  }

  if (file.size > IMAGE_UPLOAD_CONFIG[kind].targetMaxBytes) {
    return "tooLarge";
  }

  return null;
}

function isAllowedImageFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return (
    ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]) ||
    ALLOWED_IMAGE_EXTENSIONS.includes(extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])
  );
}
