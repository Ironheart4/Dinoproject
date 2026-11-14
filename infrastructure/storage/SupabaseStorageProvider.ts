import type { SupabaseClient } from "@supabase/supabase-js";
import { InternalError } from "../../core/errors";
import type { StorageProvider } from "./StorageProvider";

/** Extracts the object path from a Supabase public URL for the given bucket (null if it is not one of ours). */
export function objectPathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  const path = publicUrl.slice(index + marker.length).split("?")[0];
  return path || null;
}

export class SupabaseStorageProvider implements StorageProvider {
  constructor(
    private readonly client: SupabaseClient,
    private readonly bucket: string,
  ) {}

  async uploadPublicImage(path: string, body: Buffer, contentType: string): Promise<string> {
    const { error } = await this.client.storage.from(this.bucket).upload(path, body, {
      contentType,
      upsert: true,
    });
    if (error) throw new InternalError("Failed to upload profile picture");
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async removeObject(path: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([path]);
  }

  publicUrlToObjectPath(publicUrl: string): string | null {
    return objectPathFromPublicUrl(publicUrl, this.bucket);
  }
}
