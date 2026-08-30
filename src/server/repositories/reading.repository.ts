import type { ReadingSession } from "@/types/reading";

// In-Memory storage for development / transient reading sessions
const readingStore = new Map<string, ReadingSession>();

export class ReadingRepository {
  static async findById(id: string): Promise<ReadingSession | null> {
    return readingStore.get(id) || null;
  }

  static async save(session: ReadingSession): Promise<ReadingSession> {
    session.updatedAt = new Date().toISOString();
    readingStore.set(session.id, session);
    return session;
  }

  static async delete(id: string): Promise<boolean> {
    return readingStore.delete(id);
  }

  static async clearAll(): Promise<void> {
    readingStore.clear();
  }
}
