import {uploadFile, getFileUrl, deleteFile} from "@/core/sdk/storage";

export interface SDKMediaUploadOptions {
  bucket?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export async function uploadMedia(
  file: File,
  path: string,
  options: SDKMediaUploadOptions = {},
) {
  const bucket = options.bucket ?? "media";
  if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
    throw new Error(`File exceeds maximum size of ${options.maxSizeMB}MB`);
  }
  return uploadFile(bucket, path, file);
}

export async function getMediaUrl(path: string, bucket = "media") {
  return getFileUrl(bucket, path);
}

export async function deleteMedia(path: string, bucket = "media") {
  return deleteFile(bucket, path);
}
