"use client";

import imageCompression from "browser-image-compression";

import {
  IMAGE_UPLOAD_CONFIG,
  type ImageUploadKind,
  type ImageValidationError,
  validateCompressedImageFile,
  validateImageFile,
} from "@/lib/images/upload-config";

export class ImageUploadError extends Error {
  code: ImageValidationError | "compressionFailed";

  constructor(code: ImageUploadError["code"]) {
    super(code);
    this.code = code;
  }
}

export async function prepareImageForUpload(file: File, kind: ImageUploadKind): Promise<File> {
  const validationError = validateImageFile(file, kind);
  if (validationError) {
    throw new ImageUploadError(validationError);
  }

  try {
    const config = IMAGE_UPLOAD_CONFIG[kind];
    const compressed = await imageCompression(file, {
      maxSizeMB: config.compressionMaxSizeMB,
      maxWidthOrHeight: config.maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: 0.82,
    });

    const uploadFile = new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: Date.now(),
    });

    const compressedValidationError = validateCompressedImageFile(uploadFile, kind);
    if (compressedValidationError) {
      throw new ImageUploadError(compressedValidationError);
    }

    return uploadFile;
  } catch (error) {
    if (error instanceof ImageUploadError) {
      throw error;
    }

    throw new ImageUploadError("compressionFailed");
  }
}
