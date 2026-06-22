import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./src/db/index.ts";
import { users, chats, messages, apiLogs, libraryItems, savedQuizzes, quizScores } from "./src/db/schema.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getClinicalSystemPrompt as getEduSystemPrompt } from "./src/lib/edu-prompt.ts";
import { getClinicalSystemPrompt as getClinicalDeescalationSystemPrompt } from "./src/lib/clinical-prompt.ts";
import { eq, desc, and } from "drizzle-orm";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SCHEMAS = {
  brandBible: {
    type: Type.OBJECT,
    properties: {
      brandName: { type: Type.STRING },
      tagline: { type: Type.STRING },
      missionSummary: { type: Type.STRING },
      brandValues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["value", "description"]
        }
      },
      primaryLogoConcept: { type: Type.STRING, description: "Highly specific, visually evocative scene prompt for an AI image generator. Describe composition, shapes, textures, primary colors, minimalist or abstract style, suitable to generate a brand logo." },
      secondaryMarksConcept: { type: Type.STRING, description: "Alternate styles, iconography, or badges that complement the logo concept." },
      palette: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hex: { type: Type.STRING, description: "Hexadecimal color code, e.g., #2C3E50" },
            name: { type: Type.STRING, description: "Creative color name" },
            type: { type: Type.STRING, description: "One of: Primary, Secondary, Accent, Dark Neutral, Light Neutral" },
            usageNotes: { type: Type.STRING, description: "Guideline on what elements use this color (text, backing, headers, borders, etc.)" }
          },
          required: ["hex", "name", "type", "usageNotes"]
        }
      },
      typography: {
        type: Type.OBJECT,
        properties: {
          headerFont: {
            type: Type.OBJECT,
            properties: {
              fontName: { type: Type.STRING, description: "Google Font name, e.g., Space Grotesk, Syne, Playfair Display" },
              classification: { type: Type.STRING, description: "Sans-Serif, Serif, Display, Monospace, etc." },
              stylingNotes: { type: Type.STRING, description: "Weight instructions, letter-spacing, or casing recommendation" }
            },
            required: ["fontName", "classification", "stylingNotes"]
          },
          bodyFont: {
            type: Type.OBJECT,
            properties: {
              fontName: { type: Type.STRING, description: "Google Font name, e.g., Inter, Source Sans 3, Lora" },
              classification: { type: Type.STRING, description: "Sans-Serif, Serif, Monospace" },
              stylingNotes: { type: Type.STRING, description: "Standard weight, line height recommendations" }
            },
            required: ["fontName", "classification", "stylingNotes"]
          }
        },
        required: ["headerFont", "bodyFont"]
      },
      brandVoice: {
        type: Type.OBJECT,
        properties: {
          toneKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 to 5 adjectives" },
          guidelines: { type: Type.STRING, description: "Short explanation of how the brand speaks to its audience" }
        },
        required: ["toneKeywords", "guidelines"]
      }
    },
    required: [
      "brandName", "tagline", "missionSummary", "brandValues",
      "primaryLogoConcept", "secondaryMarksConcept", "palette", "typography", "brandVoice"
    ]
  }
};

async function start() {
  const PORT = 3000;
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // Synchronisierungs- und Registrierungs-Route für User
  app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const user = await getOrCreateUser(uid, email || "no-email@klinik.local");
      res.json(user);
    } catch (error: any) {
      console.error("Error in users/sync:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });

  // Holt alle Chat-Sitzungen des lizenzierten Personals
  app.get("/api/chats", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      // Find database user id
      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const userChats = await db
        .select()
        .from(chats)
        .where(eq(chats.userId, dbUser[0].id))
        .orderBy(desc(chats.createdAt));

      res.json(userChats);
    } catch (error: any) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: error.message || "Fehler beim Laden der Chats." });
    }
  });

  // Erstellt eine neue Chat-Sitzung
  app.post("/api/chats", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const { sessionName } = req.body;
      if (!sessionName) {
        return res.status(400).json({ error: "Sitzungsname erforderlich." });
      }

      // Find db user
      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const newChat = await db
        .insert(chats)
        .values({
          userId: dbUser[0].id,
          sessionName,
        })
        .returning();

      res.status(201).json(newChat[0]);
    } catch (error: any) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: error.message || "Fehler beim Erstellen der Sitzung." });
    }
  });

  // Löscht eine Chat-Sitzung
  app.delete("/api/chats/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const chatId = parseInt(req.params.id);

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      // Check ownership
      const existing = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, dbUser[0].id)))
        .limit(1);

      if (!existing.length) {
        return res.status(403).json({ error: "Nicht berechtigt oder Chat existiert nicht." });
      }

      await db.delete(chats).where(eq(chats.id, chatId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: error.message || "Fehler beim Löschen der Sitzung." });
    }
  });

  // Holt alle Nachrichten einer Sitzung
  app.get("/api/chats/:id/messages", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const chatId = parseInt(req.params.id);

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      // Verify chat ownership
      const chatVerify = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, dbUser[0].id)))
        .limit(1);

      if (!chatVerify.length) {
        return res.status(403).json({ error: "Sitzung existiert nicht oder kein Zugriff." });
      }

      const srvMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      res.json(srvMessages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: error.message || "Fehler beim Laden der Nachrichten." });
    }
  });

  // Sendet Nachricht und generiert Gemini Antwort unter Anwendung des präzisen Systems-Prompts
  app.post("/api/chats/:id/messages", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const chatId = parseInt(req.params.id);
      const { text, diagnosis, phase, mode } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text erforderlich." });
      }

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      // Verify chat ownership
      const chatVerify = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, dbUser[0].id)))
        .limit(1);

      if (!chatVerify.length) {
        return res.status(403).json({ error: "Zugriff verweigert." });
      }

      // 1. Spende User-Nachricht in Datenbank
      const userMsgResult = await db
        .insert(messages)
        .values({
          chatId,
          role: "user",
          text,
        })
        .returning();

      // 2. Lade Chatverlauf zur Kontextbindung
      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      const contents = history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      // Falls Verlauf leer (sollte nicht sein), füge aktuelle Nachricht hinzu
      if (contents.length === 0) {
        contents.push({
          role: "user",
          parts: [{ text }],
        });
      }

      // 3. Generiere System Prompt basierend auf Modus, Diagnose/Altersgruppe und Phase/Fachkategorie
      const customSystemInstruction = mode === "clinical"
        ? getClinicalDeescalationSystemPrompt(
            diagnosis || "ADHS",
            phase || "Phase I: Prä-Krise"
          )
        : getEduSystemPrompt(
            diagnosis || "Alter 8-11 Jahre",
            phase || "Keine Kategorie"
          );

      // Check API Key
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Schnittstelle nicht konfiguriert (GEMINI_API_KEY fehlt).");
      }

      // 4. Hole Antwort von Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: customSystemInstruction,
        },
      });

      const responseText = response.text || "Keine Antwort generiert.";

      // 5. Spende Gemini-Antwort in Datenbank
      const modelMsgResult = await db
        .insert(messages)
        .values({
          chatId,
          role: "model",
          text: responseText,
        })
        .returning();

      res.json({
        userMessage: userMsgResult[0],
        modelMessage: modelMsgResult[0],
      });
    } catch (error: any) {
      console.error("Error in chat messages processing:", error);
      res.status(500).json({ error: error.message || "Fehler bei der Anfrageverarbeitung." });
    }
  });

  // --- EDUCATION APIs ---

  // 1. WIKIPEDIA API
  app.get("/api/education-api/wikipedia", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const query = (req.query.q as string) || "Delfine";

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      const userId = dbUser.length ? dbUser[0].id : null;

      // Log to Cloud SQL
      await db.insert(apiLogs).values({
        userId,
        apiName: "Wikipedia Search",
        endpoint: `/api/education-api/wikipedia?q=${query}`,
        status: 200,
      });

      // 1. Search Wikipedia
      const searchUrl = `https://de.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error(`Wikipedia search failed with status ${searchRes.status}`);
      const searchData = await searchRes.json();
      const results = searchData.query?.search || [];

      // 2. Fetch Page Summaries for the top 4 results if available to enrich description + get images
      const enrichedResults = await Promise.all(
        results.slice(0, 4).map(async (item: any) => {
          try {
            const summaryUrl = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`;
            const sumRes = await fetch(summaryUrl);
            if (sumRes.ok) {
              const sumData = await sumRes.json();
              return {
                title: item.title,
                snippet: item.snippet,
                pageid: item.pageid,
                extract: sumData.extract,
                thumbnail: sumData.thumbnail?.source || null,
                desktopUrl: sumData.content_urls?.desktop?.page || `https://de.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
              };
            }
          } catch (e) {
            // fallback if summary fails
          }
          return {
            title: item.title,
            snippet: item.snippet,
            pageid: item.pageid,
            extract: item.snippet.replace(/<[^>]*>/g, ""), // clean html
            thumbnail: null,
            desktopUrl: `https://de.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
          };
        })
      );

      res.json(enrichedResults);
    } catch (error: any) {
      console.error("Error in Wikipedia proxy:", error);
      res.status(500).json({ error: error.message || "Fehler beim Abruf der Wikipedia-Daten." });
    }
  });

  // 2. WIKIMEDIA COMMONS API
  app.get("/api/education-api/wikimedia", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const query = (req.query.q as string) || "Nature";

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      const userId = dbUser.length ? dbUser[0].id : null;

      await db.insert(apiLogs).values({
        userId,
        apiName: "Wikimedia Commons",
        endpoint: `/api/education-api/wikimedia?q=${query}`,
        status: 200,
      });

      // Search for images on Wikimedia Commons
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Wikimedia Commons failed with status ${response.status}`);
      const data = await response.json();

      const pages = data.query?.pages || {};
      const results = Object.values(pages).map((p: any) => {
        const info = p.imageinfo?.[0] || {};
        const metadata = info.extmetadata || {};
        return {
          pageid: p.pageid,
          title: p.title,
          url: info.url || null,
          description: metadata.ImageDescription?.value?.replace(/<[^>]*>/g, "") || "Keine Beschreibung verfügbar",
          artist: metadata.Artist?.value?.replace(/<[^>]*>/g, "") || "Unbekannter Urheber",
          license: metadata.LicenseShortName?.value || "Gemeinfrei / Creative Commons"
        };
      }).filter(item => item.url);

      res.json(results);
    } catch (error: any) {
      console.error("Error in Wikimedia proxy:", error);
      res.status(500).json({ error: error.message || "Fehler beim Abruf von Wikimedia." });
    }
  });

  // 3. OPEN LIBRARY API
  app.get("/api/education-api/openlibrary", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const query = (req.query.q as string) || "Huckleberry Finn";

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      const userId = dbUser.length ? dbUser[0].id : null;

      await db.insert(apiLogs).values({
        userId,
        apiName: "Open Library",
        endpoint: `/api/education-api/openlibrary?q=${query}`,
        status: 200,
      });

      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Open Library failed with status ${response.status}`);
      const data = await response.json();

      const results = (data.docs || []).map((doc: any) => {
        const coverId = doc.cover_i;
        return {
          key: doc.key,
          title: doc.title,
          author: doc.author_name ? doc.author_name.join(", ") : "Unbekannter Autor",
          firstPublishYear: doc.first_publish_year || "Unbekannt",
          coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
          publisher: doc.publisher ? doc.publisher[0] : "N/A",
          languages: doc.language || []
        };
      });

      res.json(results);
    } catch (error: any) {
      console.error("Error in Open Library proxy:", error);
      res.status(500).json({ error: error.message || "Fehler beim Abruf der Open Library Daten." });
    }
  });

  // 4. LIBRIVOX API
  app.get("/api/education-api/librivox", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const query = (req.query.q as string) || "Alice";

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      const userId = dbUser.length ? dbUser[0].id : null;

      await db.insert(apiLogs).values({
        userId,
        apiName: "LibriVox Catalog",
        endpoint: `/api/education-api/librivox?q=${query}`,
        status: 200,
      });

      const url = `https://librivox.org/api/feed/audiobooks/?title=~${encodeURIComponent(query)}&format=json&limit=10`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`LibriVox failed with status ${response.status}`);
      const data = await response.json();

      // LibriVox returns search results under audiobooks property (can be object or array)
      let books: any[] = [];
      if (data.audiobooks) {
        if (Array.isArray(data.audiobooks)) {
          books = data.audiobooks;
        } else {
          books = [data.audiobooks];
        }
      }

      const results = books.map((b: any) => ({
        id: b.id,
        title: b.title,
        description: b.description?.replace(/<[^>]*>/g, "") || "Keine Hörbuch-Beschreibung dargeboten.",
        url_zip_file: b.url_zip_file || null,
        url_librivox: b.url_librivox || null,
        totaltimesecs: b.totaltimesecs || 0,
        authors: b.authors ? b.authors.map((a: any) => `${a.first_name} ${a.last_name}`).join(", ") : "Unbekannt"
      }));

      res.json(results);
    } catch (error: any) {
      console.error("Error in LibriVox proxy:", error);
      res.status(500).json({ error: error.message || "Fehler beim Abruf der LibriVox Hörbücher." });
    }
  });

  // 5. OPEN TRIVIA DATABASE API
  app.get("/api/education-api/opentrivia", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const amount = parseInt(req.query.amount as string) || 10;
      const category = req.query.category as string || "";
      const difficulty = req.query.difficulty as string || "";

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      const userId = dbUser.length ? dbUser[0].id : null;

      await db.insert(apiLogs).values({
        userId,
        apiName: "Open Trivia DB",
        endpoint: `/api/education-api/opentrivia?amount=${amount}&category=${category}&difficulty=${difficulty}`,
        status: 200,
      });

      let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
      if (category) url += `&category=${category}`;
      if (difficulty) url += `&difficulty=${difficulty}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Open Trivia DB failed with status ${response.status}`);
      const data = await response.json();

      res.json(data.results || []);
    } catch (error: any) {
      console.error("Error in Open Trivia proxy:", error);
      res.status(500).json({ error: error.message || "Fehler beim Abruf der Quizfragen." });
    }
  });

  // --- LOCAL PERSISTENT OFFLINE ARCHIVE ROUTEN ---

  // 1. IMPORT ITEM INTO THE OFFLINE LIBRARY
  app.post("/api/library/import", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const { itemType, sourceType, title, author, description, coverUrl, sourceUrl, apiSource, localContent, publishStatus, ageRating, category } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Titel ist erforderlich." });
      }

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      let finalLocalContent = localContent || "";
      let finalDescription = description || "";
      let resolvedApiSource = apiSource || "wikipedia";

      if (resolvedApiSource === "wikipedia") {
        try {
          // Download complete article as HTML from Wikipedia Action API
          const wikiUrl = `https://de.wikipedia.org/w/api.php?action=query&prop=extracts&titles=${encodeURIComponent(title)}&format=json&origin=*`;
          const wikiRes = await fetch(wikiUrl);
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const pages = wikiData?.query?.pages || {};
            const pageId = Object.keys(pages)[0];
            if (pageId && pageId !== "-1") {
              const extract = pages[pageId].extract;
              if (extract && extract.trim().length > 0) {
                finalLocalContent = extract;
              }
            }
          }
        } catch (wikiErr) {
          console.error("Auto-downloading Wikipedia article failed:", wikiErr);
        }
      }

      const newItem = await db
        .insert(libraryItems)
        .values({
          userId: dbUser[0].id,
          itemType: itemType || sourceType || "article",
          title,
          author: author || "Unbekannt",
          description: finalDescription,
          coverUrl: coverUrl || "",
          sourceUrl: sourceUrl || `https://de.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          apiSource: resolvedApiSource,
          localContent: finalLocalContent || finalDescription,
          publishStatus: publishStatus || "approved",
          ageRating: ageRating ? parseInt(ageRating) : 0,
          category: category || "Allgemein",
        })
        .returning();

      res.status(201).json(newItem[0]);
    } catch (error: any) {
      console.error("Error importing library item:", error);
      res.status(500).json({ error: error.message || "Fehler beim Importieren in die Bibliothek." });
    }
  });

  // 1.5 UPDATE STATUS OF A LIBRARY ITEM (ADMIN CONTROL)
  app.put("/api/library/:id/status", requireAuth, async (req: AuthRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { publishStatus } = req.body;

      if (!publishStatus) {
        return res.status(400).json({ error: "Freigabestatus ist erforderlich." });
      }

      const updated = await db
        .update(libraryItems)
        .set({ publishStatus })
        .where(eq(libraryItems.id, itemId))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ error: "Eintrag nicht gefunden." });
      }

      res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating library item status:", error);
      res.status(500).json({ error: error.message || "Fehler beim Aktualisieren des Freigabestatus." });
    }
  });

  // 1.6 UPDATE FULL LIBRARY ITEM (EDIT EXISTING CONTENT)
  app.put("/api/library/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { title, author, description, localContent, category, ageRating, publishStatus } = req.body;

      const updated = await db
        .update(libraryItems)
        .set({
          title,
          author,
          description,
          localContent,
          category,
          ageRating: ageRating ? parseInt(ageRating) : 0,
          publishStatus: publishStatus || "draft",
        })
        .where(eq(libraryItems.id, itemId))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ error: "Eintrag nicht gefunden." });
      }

      res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating library item:", error);
      res.status(500).json({ error: error.message || "Fehler beim Bearbeiten des Eintrags." });
    }
  });

  // 2. GET ALL LOCAL LIBRARY ITEMS (OFFLINE ARCHIVE)
  app.get("/api/library", requireAuth, async (req: AuthRequest, res) => {
    try {
      const items = await db
        .select()
        .from(libraryItems)
        .orderBy(desc(libraryItems.createdAt));

      res.json(items);
    } catch (error: any) {
      console.error("Error fetching library items:", error);
      res.status(500).json({ error: error.message || "Fehler beim Laden der Offline-Bibliothek." });
    }
  });

  // 3. DELETE LOCAL LIBRARY ITEM
  app.delete("/api/library/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await db.delete(libraryItems).where(eq(libraryItems.id, itemId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting library item:", error);
      res.status(500).json({ error: error.message || "Fehler beim Löschen aus der Bibliothek." });
    }
  });

  // 4. IMPORT TRIVIA QUESTIONS TO LOCAL OFFLINE QUIZ ARCHIVE
  app.post("/api/quizzes/import", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const { questions } = req.body; // array of questions

      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "Fragen-Array erforderlich." });
      }

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const inserted = [];
      for (const q of questions) {
        const item = await db
          .insert(savedQuizzes)
          .values({
            userId: dbUser[0].id,
            category: q.category || "Allgemeines",
            difficulty: q.difficulty || "medium",
            question: q.question,
            correctAnswer: q.correct_answer || q.correctAnswer,
            incorrectAnswers: typeof q.incorrect_answers === "string" ? q.incorrect_answers : JSON.stringify(q.incorrect_answers || q.incorrectAnswers || []),
          })
          .returning();
        inserted.push(item[0]);
      }

      res.status(201).json({ success: true, count: inserted.length });
    } catch (error: any) {
      console.error("Error importing quizzes:", error);
      res.status(500).json({ error: error.message || "Fehler beim Sichern der Quizfragen." });
    }
  });

  // 5. GET ALL LOCAL OFFLINE PLAYABLE QUIZZES
  app.get("/api/quizzes/offline", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const saved = await db
        .select()
        .from(savedQuizzes)
        .where(eq(savedQuizzes.userId, dbUser[0].id))
        .orderBy(desc(savedQuizzes.createdAt));

      res.json(saved);
    } catch (error: any) {
      console.error("Error fetching offline quizzes:", error);
      res.status(500).json({ error: error.message || "Fehler beim Laden lokaler Quizfragen." });
    }
  });

  // 6. DELETE SAVED QUIZZES
  app.delete("/api/quizzes/offline/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const qId = parseInt(req.params.id);

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const existing = await db
        .select()
        .from(savedQuizzes)
        .where(and(eq(savedQuizzes.id, qId), eq(savedQuizzes.userId, dbUser[0].id)))
        .limit(1);

      if (!existing.length) {
        return res.status(403).json({ error: "Nicht berechtigt." });
      }

      await db.delete(savedQuizzes).where(eq(savedQuizzes.id, qId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting local quiz:", error);
      res.status(500).json({ error: "Fehler beim Löschen der Frage." });
    }
  });

  // 7. POST LOCAL QUIZ SCORE
  app.post("/api/quizzes/scores", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const { category, score, totalQuestions } = req.body;

      if (score === undefined || !category) {
        return res.status(400).json({ error: "Kategorie und Punkte erforderlich." });
      }

      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const newScore = await db
        .insert(quizScores)
        .values({
          userId: dbUser[0].id,
          category,
          score: parseInt(score),
          totalQuestions: parseInt(totalQuestions) || 10,
        })
        .returning();

      res.status(201).json(newScore[0]);
    } catch (error: any) {
      console.error("Error saving score:", error);
      res.status(500).json({ error: error.message || "Fehler beim Speichern des Scores." });
    }
  });

  // 8. GET ALL QUIZ SCORES (HIGH-SCORES)
  app.get("/api/quizzes/scores", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const scores = await db
        .select()
        .from(quizScores)
        .where(eq(quizScores.userId, dbUser[0].id))
        .orderBy(desc(quizScores.playedAt));

      res.json(scores);
    } catch (error: any) {
      console.error("Error fetching scores:", error);
      res.status(500).json({ error: error.message || "Fehler beim Abruf der Highscores." });
    }
  });

  // GET RECENT AUDIT LOGS FROM CLOUD SQL
  app.get("/api/education-api/logs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      // Load recent logs for the registered user or general
      const logsResult = await db
        .select()
        .from(apiLogs)
        .where(eq(apiLogs.userId, dbUser[0].id))
        .orderBy(desc(apiLogs.createdAt))
        .limit(20);

      res.json(logsResult);
    } catch (error: any) {
      console.error("Error fetching api logs:", error);
      res.status(500).json({ error: error.message || "Fehler beim Laden der API Audit-Protokolle." });
    }
  });

  // API Route: Generate test content for ALL categories using Gemini
  app.post("/api/admin/generate-test-items", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!dbUser.length) {
        return res.status(404).json({ error: "Nutzer nicht registriert." });
      }

      const activeUserId = dbUser[0].id;

      const topics = [
        {
          category: "Natur & Biologie",
          prompt: "Verfasse einen lebhaften und faszinierenden Bildungsartikel (ca. 120-150 Wörter) auf Deutsch für Kinder zum Thema 'Die Sprache der Buckelwale'. Erkläre, wie Wale singen, warum sie Lieder reisen lassen und was die Töne bedeuten können. Verwende klare Absätze.",
          defaultCover: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=600"
        },
        {
          category: "Wissenschaft",
          prompt: "Verfasse einen spannenden Bildungsartikel (ca. 120-150 Wörter) auf Deutsch für Kinder zum Thema 'Wie reisen elektrische Signale in unserem Gehirn?'. Erkläre Gehirnzellen (Neuronen) und wie Gedanken entstehen wie kleine Blitze. Nutze witzige, verständliche Beispiele.",
          defaultCover: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=600"
        },
        {
          category: "Mathe",
          prompt: "Verfasse einen spielerischen Artikel (ca. 120-150 Wörter) auf Deutsch zum Thema 'Symmetrie: Die Geometrie-Spiegel im Wald'. Erkläre Kindern anhand von Schneeflocken und Schmetterlingsflügeln, was Spiegelung und Achsensymmetrie bedeuten.",
          defaultCover: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=600"
        },
        {
          category: "Medienkompetenz",
          prompt: "Verfasse einen altersgerechten Detektiv-Leitfaden (ca. 120-150 Wörter) auf Deutsch zum Thema 'Wie entlarve ich gefälschte Infos (Fake News) im Internet?'. Gib Kindern praktische Tricks an die Hand, wie Bilder-Suche oder die Frage 'Wer sagt das?'.",
          defaultCover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600"
        },
        {
          category: "Märchen & Geschichten",
          prompt: "Verfasse eine herzerwärmende Kurzgeschichte (ca. 120-150 Wörter) auf Deutsch für Kleinkinder über den 'kleinen Kometen Kimi'. Kimi fliegt traurig alleine durchs All, bis er die fröhlichen Sternbilder trifft und lernt, was Freundschaft ist.",
          defaultCover: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=600"
        },
        {
          category: "Allgemein",
          prompt: "Verfasse eine einfache, warmherzige Erklärung (ca. 120-150 Wörter) auf Deutsch zum Thema 'Was sind Kinderrechte?'. Erkläre am Beispiel von Schulbildung, Schutz vor Gewalt und Mitbestimmung sowie Spielzeit, warum alle Kinder der Welt geschützt sind.",
          defaultCover: "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&q=80&w=600"
        }
      ];

      const testContentSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          description: { type: Type.STRING },
          localContent: { type: Type.STRING },
          ageRating: { type: Type.INTEGER },
          quizzes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                incorrectAnswers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["question", "correctAnswer", "incorrectAnswers"]
            }
          }
        },
        required: ["title", "author", "description", "localContent", "ageRating", "quizzes"]
      };

      const results: any[] = [];

      // Generate in parallel
      await Promise.all(topics.map(async (topic) => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: topic.prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: testContentSchema,
            }
          });

          const responseText = response.text || "{}";
          const parsed = JSON.parse(responseText.trim());

          // Insert into libraryItems
          const newItem = await db.insert(libraryItems).values({
            userId: activeUserId,
            itemType: topic.category === "Märchen & Geschichten" ? "book" : "article",
            title: parsed.title || `Wunder über ${topic.category}`,
            author: parsed.author || "Automatische Kuration",
            description: parsed.description || "Inhaltsangabe",
            coverUrl: topic.defaultCover,
            sourceUrl: "https://kids.example.com",
            apiSource: "wikimedia",
            localContent: parsed.localContent || "Kein Inhalt",
            publishStatus: "approved",
            ageRating: parsed.ageRating || 6,
            category: topic.category,
          }).returning();

          results.push(newItem[0]);

          // Insert quiz questions
          if (parsed.quizzes && Array.isArray(parsed.quizzes)) {
            for (const q of parsed.quizzes) {
              await db.insert(savedQuizzes).values({
                userId: activeUserId,
                category: topic.category,
                difficulty: "medium",
                question: q.question,
                correctAnswer: q.correctAnswer,
                incorrectAnswers: JSON.stringify(q.incorrectAnswers || []),
              });
            }
          }
        } catch (innerError) {
          console.error(`Error generating content for category ${topic.category}:`, innerError);
        }
      }));

      // Log successful operation under API Audit Logs
      await db.insert(apiLogs).values({
        userId: activeUserId,
        apiName: "Gemini Test Data Generator",
        endpoint: "/api/admin/generate-test-items",
        status: 200,
      });

      res.status(201).json({ success: true, count: results.length });
    } catch (error: any) {
      console.error("Error in generate-test-items:", error);
      res.status(500).json({ error: error.message || "Failed to generate test content in all categories." });
    }
  });

  // API Route: Generate Brand Bible
  app.post("/api/generate-brand", async (req, res) => {
    try {
      const { companyName, companyMission, industry, targetAudience, brandKeywords } = req.body;
      if (!companyMission) {
        return res.status(400).json({ error: "Company mission is required." });
      }

      const prompt = `Generate a cohesive and detailed brand identity blueprint (Brand Bible) for a brand based on the following characteristics:
- Company Name: ${companyName || 'Untitled'}
- Mission/Description: ${companyMission}
- Industry: ${industry || 'General / tech'}
- Target Audience: ${targetAudience || 'General public'}
- Keywords/Aesthetic preference: ${brandKeywords || 'Clean, modern'}

Produce a highly creative response following the requested schema. Ensure the color hex codes are valid CSS hex values, and the primaryLogoConcept is written to be a high-quality prompt for an AI image generator (detailed, describing the icon elements, minimalist backdrop, logo layout). Make sure suggested Google Fonts are popular, beautiful choices.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: SCHEMAS.brandBible,
        }
      });

      const text = response.text || "{}";
      const cleaned = text.trim();
      res.json(JSON.parse(cleaned));
    } catch (error: any) {
      console.error("Error generating brand:", error);
      res.status(500).json({ error: error.message || "Failed to generate brand identity." });
    }
  });

  // API Route: Generate Image
  app.post("/api/generate-logo", async (req, res) => {
    try {
      const { prompt, aspectRatio, imageSize, model } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      // Check if GEMINI_API_KEY is present
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured on the server.");
      }

      const targetModel = model || "gemini-3-pro-image-preview";
      const config: any = {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: imageSize || "1K"
        }
      };

      console.log(`Generating logo using model ${targetModel} with config:`, config.imageConfig);

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [{ text: `${prompt}. Minimalist logo design, vector art icon, isolated on solid white background.` }],
        config
      });

      let base64Data = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Data = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Data) {
        // Log parts to see what we received if no image
        console.warn("No inlineData found in parts list:", JSON.stringify(response.candidates?.[0]?.content?.parts));
        throw new Error("The image generator did not return any image parts. Please check your prompt and model permissions.");
      }

      res.json({ imageUrl: `data:image/png;base64,${base64Data}` });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: error.message || "Failed to generate image." });
    }
  });

  // API Route: Chatbot (Brand consultant or clinical training partner)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, systemInstruction, model } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const contents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const activeModel = model || "gemini-3.5-flash";

      const response = await ai.models.generateContent({
        model: activeModel,
        contents,
        config: {
          systemInstruction: systemInstruction || "You are a helpful branding assistant."
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in chat service:", error);
      res.status(500).json({ error: error.message || "Failed to generate chat response." });
    }
  });

  // API Route: Sync Manifest (Point 5 of Content-Ecosystem Architecture)
  app.get("/api/sync/manifest", (req, res) => {
    try {
      const clientVersion = parseInt(req.query.version as string) || 0;
      const serverVersion = 104; // Incremental version number

      const contents = [
        {
          id: "vid_001",
          title: "Leben im Wald und seine Geheimnisse 🌲",
          type: "video",
          category: "natur",
          age_min: 6,
          language: "de",
          duration: 720,
          thumbnail: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=300",
          file: "https://www.w3schools.com/html/mov_bbb.mp4",
          tags: ["tiere", "wald", "natur", "entdecken"]
        },
        {
          id: "aud_002",
          title: "Die fleißigen Bienen im Sommergarten 🐝",
          type: "audio",
          category: "natur",
          age_min: 4,
          language: "de",
          duration: 340,
          thumbnail: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=300",
          file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          tags: ["insekten", "garten", "hörspiel"]
        },
        {
          id: "pdf_003",
          title: "Unser großes Dino-Ausmalbuch 🦕",
          type: "pdf",
          category: "kreativ",
          age_min: 5,
          language: "de",
          duration: 0,
          thumbnail: "https://images.unsplash.com/photo-1540479859555-17af45c78a90?auto=format&fit=crop&q=80&w=300",
          file: "https://pdfobject.com/pdf/sample.pdf",
          tags: ["basteln", "malen", "saurier"]
        }
      ];

      res.json({
        version: serverVersion,
        update_required: clientVersion < serverVersion,
        contents: contents
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate sync manifest." });
    }
  });

  // Setup Vite Dev Server / Static Assets
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Bootstrapping crashed:", err);
  process.exit(1);
});
