import {createClient as createServerClient} from "@/lib/supabase/server";

export async function uploadFile(bucket: string, path: string, file: File | Blob | ArrayBuffer) {
  const supabase = await createServerClient();
  const {data, error} = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return data;
}

export async function getFileUrl(bucket: string, path: string) {
  const supabase = await createServerClient();
  const {data} = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = await createServerClient();
  const {error} = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function listFiles(bucket: string, prefix?: string) {
  const supabase = await createServerClient();
  const {data, error} = await supabase.storage.from(bucket).list(prefix);
  if (error) throw error;
  return data;
}
