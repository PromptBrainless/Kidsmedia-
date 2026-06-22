import { db } from "./index.ts";
import { users } from "./schema.ts";

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user syncer failed:", error);
    throw new Error("Synchronisation des Benutzers in der Datenbank fehlgeschlagen.", { cause: error });
  }
}
