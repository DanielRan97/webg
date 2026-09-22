export interface StorageAdapter {
  /** Stores the bytes under a fresh, unguessable key and returns the public URL to save in the database. */
  save(bytes: Buffer, mime: string): Promise<string>;
  /** Best-effort delete of a previously-saved URL. Must silently no-op for any URL it did not produce. */
  remove(url: string): Promise<void>;
}
