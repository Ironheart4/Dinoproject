export interface StorageProvider {
  uploadPublicImage(path: string, body: Buffer, contentType: string): Promise<string>;
  removeObject(path: string): Promise<void>;
  publicUrlToObjectPath(publicUrl: string): string | null;
}
