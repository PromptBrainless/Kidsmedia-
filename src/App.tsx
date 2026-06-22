import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Activity,
  AlertOctagon,
  Search,
  BookOpen,
  Database,
  History,
  Send,
  Loader2,
  Trash2,
  CheckCircle,
  Clock,
  Plus,
  HelpCircle,
  Sparkles,
  FileText,
  Lock,
  User,
  LogOut,
  Brain,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  X,
  Info,
  Award,
  Play,
  Pause,
  Volume2,
  Check,
  Gamepad2,
  Sliders,
  Settings,
  UserPlus,
  FolderOpen,
  Star,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, googleAuthProvider } from "./lib/firebase.ts";
import { YouthPanel } from "./components/YouthPanel";
import { ContributorPanel } from "./components/ContributorPanel";
import { AdminPanel } from "./components/AdminPanel";

// Available Target Age Groups
const DIAGNOSES = [
  { id: "Alter 4-7 Jahre", name: "Alter 4–7 Jahre (Vorschule)", desc: "Einfache Sätze, bildhafte alltagsnahe Vergleiche, kurze strukturierte Ansprache ohne Fachwörter." },
  { id: "Alter 8-11 Jahre", name: "Alter 8–11 Jahre (Grundschule)", desc: "Spannende Zusatzfakten, humorvoll und neugierig, anschauliche logische Herleitungen." },
  { id: "Alter 12+ Jahre", name: "Alter 12+ Jahre (Jugendliche)", desc: "Sachliche, mitreißende Sprache, Erörterung komplexer Sachverhalte, Fachbegriffe erlaubt." }
];

// Content Categories
const DEESCALATION_PHASES = [
  { id: "Natur & Biologie", name: "Natur & Biologie", desc: "Tiersteckbriefe, Wald, Pflanzen, Meeresbiologie und biologische Zusammenhänge." },
  { id: "Geografie & Länder", name: "Geografie & Länder", desc: "Reisebeschreibungen, Flaggen, Kontinente, Hauptstädte und Gebräuche." },
  { id: "Wissenschaft & Technik", name: "Wissenschaft & Technik", desc: "Vulkane, Mechanik, Astronomie, Weltraum und physikalische Experimente." },
  { id: "Literatur & Märchen", name: "Literatur & Märchen", desc: "Sagen, Zusammenfassungen klassischer Werke, Hörspiele und Charaktere." },
  { id: "Quiz & Interaktion", name: "Quiz & Interaktion", desc: "Generierung neuer kindgerechter Quizfragen mit Antwortmöglichkeiten." }
];

// Clinical Targets
const CLINICAL_DIAGNOSES = [
  { id: "ADHS", name: "ADHS (Impulsivität & Reizüberflutung)", desc: "Schnelle Reizüberflutung, massive Impulsivität, geringe Frustrationstoleranz." },
  { id: "PTBS", name: "PTBS (Trauma-Trigger & Hyperarousal)", desc: "Ankündigung aller Pflege-Handlungen, extrem hoher Eigenschutzabstand, Grounding-Techniken (5-4-3-2-1)." },
  { id: "Psychose", name: "Psychose (Wahn & Halluzinationen)", desc: "Wahninhalte weder validieren (bestätigen) noch dekonstruieren (ausreden), Gefühle spiegeln." },
  { id: "Borderline", name: "Borderline-Persönlichkeitsstörung", desc: "Spaltungs- & Idealisierungstendenzen managen, klare neutrale Abgrenzung, Validierung ohne Verstärkung von Dysfunktion." },
  { id: "Autismus", name: "Autismus-Spektrum-Störung (ASS)", desc: "Absolute strukturelle Vorhersehbarkeit, keine Metaphern/Redewendungen, Reizreduktion." }
];

// Clinical Crisis Intervention Phases
const CLINICAL_PHASES = [
  { id: "Phase I: Prä-Krise", name: "Phase I: Prä-Krise (Anspannung)", desc: "Aktives non-direktives Zuhören, sensorischer Abbau (Snoezelenraum), Bedarfsmedikation anbieten." },
  { id: "Phase II: Akute Krise", name: "Phase II: Akute Krise (Eskalation)", desc: "Physischer Eigenschutz, monotone ruhige Zurufe, seitliche Ausrichtung der Körpersprache." },
  { id: "Phase III: Nachsorge", name: "Phase III: Nachsorge (Reflexion)", desc: "Physisches Wohlbefinden sichern (Decke, Wasser), retrospektives Debriefing mit Patient & Pflegeteam." }
];

interface ChatSession {
  id: number;
  sessionName: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "model";
  text: string;
  createdAt: string;
}

interface ApiLogEntry {
  id: number;
  apiName: string;
  endpoint: string;
  status: number;
  createdAt: string;
}

export default function App() {
  // USER STATE
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // 3-TIER PLATFORM ROLE STATES
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "provider" | "youth">("admin");
  const [activeMainTab, setActiveMainTab] = useState<string>("startseite");
  const [favouriteItems, setFavouriteItems] = useState<number[]>([]);
  const [roleGatePendingRole, setRoleGatePendingRole] = useState<"admin" | "provider" | "youth" | null>(null);
  const [rolePinEntry, setRolePinEntry] = useState<string>("");
  const [rolePinError, setRolePinError] = useState<string>("");

  // Simulated platform user catalog (for Benutzerverwaltung)
  const [simulatedUsers, setSimulatedUsers] = useState<any[]>([
    { id: "u-1", name: "Dr. Elena Weber", email: "elena.weber@medienakut.de", role: "admin", group: "Administrator", status: "Aktiv", createdAt: "2026-01-12" },
    { id: "u-2", name: "Christian Binder", email: "binder@medienakut.de", role: "provider", group: "Lehrkräfte", status: "Aktiv", createdAt: "2026-02-15" },
    { id: "u-3", name: "Sabine Fuchs", email: "fuchs@medienakut.de", role: "provider", group: "Erzieher", status: "Aktiv", createdAt: "2026-03-01" },
    { id: "u-4", name: "Fynn Levin (U18)", email: "fynn.levin.hirt@gmail.com", role: "youth", group: "Jugendliche", status: "Aktiv", createdAt: "2026-04-10" },
    { id: "u-5", name: "Lea Sophie (U18)", email: "lea@medienakut.de", role: "youth", group: "Kinder", status: "Aktiv", createdAt: "2026-05-04" },
    { id: "u-6", name: "Tom Krause (U18)", email: "tom@medienakut.de", role: "youth", group: "Jugendliche", status: "Gesperrt", createdAt: "2026-06-20" },
  ]);

  // NEW USER FORM STATES
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "provider" | "youth">("youth");
  const [newUserGroup, setNewUserGroup] = useState("Jugendliche");

  // MEDIA EXPERIENCE STATES
  const [activeVideoItem, setActiveVideoItem] = useState<any | null>(null);
  const [activeGalleryItem, setActiveGalleryItem] = useState<any | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [downloadingItems, setDownloadingItems] = useState<number[]>([]);
  const [downloadedItems, setDownloadedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAgeRating, setSearchAgeRating] = useState<number>(-1); // -1 means All
  const [searchCategory, setSearchCategory] = useState<string>("All");
  const [searchMediaType, setSearchMediaType] = useState<string>("All");

  // MANUAL CONTRIBUTOR UPLOAD FORM STATES
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualCategory, setManualCategory] = useState("Natur & Biologie");
  const [manualAgeRating, setManualAgeRating] = useState<number>(0);
  const [manualMediaType, setManualMediaType] = useState<"book" | "audiobook" | "article">("article");

  // EDIT DIALOG MODAL STATE
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // APP TABS: "assistant" (Chat Room) | "apis" (API-Importeur) | "library" (Offline-Mediathek) | "audit" (Cloud SQL logs) | "config" (Profile & Tagesplan)
  const [activeTab, setActiveTab] = useState<"assistant" | "apis" | "library" | "audit" | "config">("library");

  // SYSTEM MODES: "educational" (EduSpace) | "clinical" (Clinical Deescalation)
  const [selectedMode, setSelectedMode] = useState<"educational" | "clinical">("educational");
  const [oberarztAlert, setOberarztAlert] = useState<string | null>(null);

  // KIDS MEDIA OFFLINE SANDBOX STATES
  const [kidsSandboxMode, setKidsSandboxMode] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [contrastHigh, setContrastHigh] = useState<boolean>(false);
  const [allowVideos, setAllowVideos] = useState<boolean>(true);
  const [allowAudio, setAllowAudio] = useState<boolean>(true);
  const [allowPdf, setAllowPdf] = useState<boolean>(true);
  const [allowQuiz, setAllowQuiz] = useState<boolean>(true);
  const [activeChildId, setActiveChildId] = useState<string>("fynn");
  
  // Parent gate PIN protection code
  const [parentPin, setParentPin] = useState<string>("1234");
  const [pinpadVisible, setPinpadVisible] = useState<boolean>(false);
  const [pinEntry, setPinEntry] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // Simulated Day Schedule (Tagesplan) state matching the Saisoplan requirements
  const [tagesplanList, setTagesplanList] = useState<any[]>([
    { id: "tp-1", timeRange: "08:30 - 12:30", title: "Schule & Lernzeit", emoji: "📚", desc: "Arbeite an deinen Hausaufgaben oder lies ein Buch", completed: false },
    { id: "tp-2", timeRange: "12:30 - 13:30", title: "Mittagessen & Pause", emoji: "🍎", desc: "Leckeres Essen und Kraft für den Nachmittag sammeln", completed: true },
    { id: "tp-3", timeRange: "14:00 - 15:30", title: "Kreative Bastelstunde", emoji: "🎨", desc: "Male oder fertige ein schönes Ausmalbuch an", completed: false },
    { id: "tp-4", timeRange: "16:00 - 17:30", title: "Freie Offline-Medienzeit", emoji: "🎙️", desc: "Löse ein spannendes Wissensquiz oder höre Radio", completed: false },
    { id: "tp-5", timeRange: "19:00 - 19:30", title: "Bettzeit & Abendgeschichten", emoji: "😴", desc: "Kuscheln und entspannt ins Traumland reisen", completed: false }
  ]);

  // Simulated Chores/Tasks (Aufgaben) state with XP rewards
  const [tasksList, setTasksList] = useState<any[]>([
    { id: "task-1", title: "15 Minuten Lesen im Buch", emoji: "📖", xpReward: 150, completedBy: ["tom"] },
    { id: "task-2", title: "Schulaufgaben fleißig beendet", emoji: "✏️", xpReward: 250, completedBy: ["fynn", "tom"] },
    { id: "task-3", title: "Zähne geputzt vor dem Schlafen", emoji: "🦷", xpReward: 105, completedBy: [] },
    { id: "task-4", title: "Eigenes Zimmer aufgeräumt", emoji: "🧹", xpReward: 200, completedBy: ["lea"] },
    { id: "task-5", title: "Lernquiz fehlerfrei gelöst", emoji: "🦊", xpReward: 220, completedBy: [] }
  ]);
  
  // Custom Child Profile List state (multi-user simulation matching profiles/child_id.json structures)
  const [childProfiles, setChildProfiles] = useState<any[]>([
    {
      id: "fynn",
      name: "Fynn",
      age: 9,
      interests: ["Weltraum 🚀", "Tiere 🦁", "Technik ⚙️"],
      xp: 1250,
      level: 4,
      badges: ["Wissens-Meister 🦉", "Erster Sternenflug 🚀"],
      completedSteps: ["astronomy-step-1"],
      videosWatched: 2,
      quizzesSolved: 3,
      pathsFinished: 0
    },
    {
      id: "lea",
      name: "Lea",
      age: 6,
      interests: ["Märchen ✨", "Wald 🌲", "Musik 🎵"],
      xp: 350,
      level: 1,
      badges: ["Märchenstunde 🦄"],
      completedSteps: [],
      videosWatched: 1,
      quizzesSolved: 0,
      pathsFinished: 0
    },
    {
      id: "tom",
      name: "Tom",
      age: 13,
      interests: ["Geschichte 🏛️", "Dinosaurier 🦕", "Geografie 🌍"],
      xp: 2900,
      level: 8,
      badges: ["Expeditions-Leiter 🗺️", "Quiz-Blitz ⚡", "Wissens-Meister 🦉"],
      completedSteps: ["astronomy-step-1", "astronomy-step-2", "astronomy-step-3", "astronomy-step-4"],
      videosWatched: 6,
      quizzesSolved: 14,
      pathsFinished: 1
    }
  ]);

  // Profiles Overlay management
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [creationName, setCreationName] = useState<string>("");
  const [creationAge, setCreationAge] = useState<number>(8);
  const [creationInterests, setCreationInterests] = useState<string[]>([]);
  
  // Active Path Exploration
  const [activeLearningPathId, setActiveLearningPathId] = useState<string>("astronomy");
  
  // Active Simulated Playback Overlay
  const [playingMedia, setPlayingMedia] = useState<any | null>(null);
  const [simulatedScore, setSimulatedScore] = useState<number>(0);
  const [simulatedQuizStepIdx, setSimulatedQuizStepIdx] = useState<number>(0);
  const [simulatedQuizAnswered, setSimulatedQuizAnswered] = useState<boolean>(false);
  const [simulatedSelectedAns, setSimulatedSelectedAns] = useState<string>("");
  const [customNotify, setCustomNotify] = useState<{ text: string; details: string } | null>(null);

  // EDU CHAT PARAMETERS
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("Alter 8-11 Jahre");
  const [selectedPhase, setSelectedPhase] = useState("Natur & Biologie");

  // DATABASE CHAT STATES
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messagesList, setMessagesList] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [inputText, setInputText] = useState("");
  const [newSessionName, setNewSessionName] = useState("");

  // VOLKSBILDUNG & INTERAKTIVER ANREICHERUNGS- IMPORT (5 FREIE APIs)
  const [apiType, setApiType] = useState<"wikipedia" | "wikimedia" | "openlibrary" | "librivox" | "opentrivia">("wikipedia");
  const [searchTerms, setSearchTerms] = useState("");
  const [apiResults, setApiResults] = useState<any>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [apiError, setApiError] = useState("");

  // EDUCATION LOCAL ARCHIVE STATES (PERSISTIERT IN POSTGRES / CLOUD SQL FÜR OFFLINE-NUTZUNG)
  const [libraryItemsList, setLibraryItemsList] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [savedQuizzesList, setSavedQuizzesList] = useState<any[]>([]);
  const [loadingSavedQuizzes, setLoadingSavedQuizzes] = useState(false);
  const [quizScoresList, setQuizScoresList] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);

  // INTERACTIVE PLAYING QUIZ STATE
  const [quizState, setQuizState] = useState<"idle" | "playing" | "finished">("idle");
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [isOfflineQuiz, setIsOfflineQuiz] = useState(true);
  const [selectedReadingItem, setSelectedReadingItem] = useState<any | null>(null);
  const [readerTheme, setReaderTheme] = useState<"sepia" | "dark">("sepia");
  const [readerFontSize, setReaderFontSize] = useState<"text-xs" | "text-sm" | "text-base" | "text-lg">("text-sm");

  // AUDIT LOGS FROM CLOUD SQL
  const [auditLogs, setAuditLogs] = useState<ApiLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // SYSTEM LOGS (UI TELEMETRY)
  const [uiLogs, setUiLogs] = useState<{ id: string; time: string; msg: string; type: "info" | "success" | "warn" }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ADD TELEMETRY LOG
  const addUiLog = (msg: string, type: "info" | "success" | "warn" = "info") => {
    const time = new Date().toLocaleTimeString("de-DE");
    setUiLogs((prev) => [{ id: Math.random().toString(), time, msg, type }, ...prev].slice(0, 30));
  };

  // FETCH HELPER WITH OAUTH TOKEN INJECTION
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!auth.currentUser) {
      throw new Error("Authentifizierung erforderlich.");
    }
    const currentToken = await auth.currentUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });
  };

  // HANDLE AUTH CHANGES
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const t = await u.getIdToken();
        setToken(t);
        addUiLog(`Benutzer erfolgreich authentifiziert: ${u.email}`, "success");
        
        // Sync user profile to SQL
        try {
          const res = await fetch("/api/users/sync", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${t}`,
              "Content-Type": "application/json",
            }
          });
          if (res.ok) {
            addUiLog("Benutzerprofil mit Cloud SQL abgeglichen", "success");
          }
        } catch (err) {
          console.error("SQL User Sync Error:", err);
        }
      } else {
        setUser(null);
        setToken(null);
        setSessions([]);
        setActiveSessionId(null);
        setMessagesList([]);
        addUiLog("Keine aktive Sitzung. Bitte mit Google anmelden.", "info");
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // LOAD SESSIONS FROM CLOUD SQL AFTER AUTH
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  // SCROLL TO CHAT END
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesList]);

  // DETECT OBERARZT ALERTS IN ACTIVE CONVERSATION
  useEffect(() => {
    if (selectedMode !== "clinical") {
      setOberarztAlert(null);
      return;
    }
    const hasAlarm = messagesList.some(m =>
      m.role === "model" &&
      (m.text.includes("OBERARZT INFORMIEREN") || m.text.includes("OA informieren") || m.text.includes("Pflegeteam alarmieren") || m.text.includes("Oberarzt (OA) informieren"))
    );
    if (hasAlarm) {
      setOberarztAlert("🚨 OBERARZT-MELDEPFLICHT AUSGELÖST: In diesem Szenario liegt eine akute Fremd- oder Selbstgefährdung vor! Bitte alarmieren Sie unverzüglich Ihr Stations-Team.");
    } else {
      setOberarztAlert(null);
    }
  }, [messagesList, selectedMode]);

  // CLINICAL DB CHAT LOADING METHODS
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetchWithAuth("/api/chats");
      if (!res.ok) throw new Error("Fehler beim Laden der Sitzungen");
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && activeSessionId === null) {
        setActiveSessionId(data[0].id);
      }
    } catch (err: any) {
      addUiLog(`Fehler beim Laden der Sitzungen: ${err.message}`, "warn");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    setLoadingMessages(true);
    try {
      const res = await fetchWithAuth(`/api/chats/${chatId}/messages`);
      if (!res.ok) throw new Error("Sitzungsverlauf konnte nicht geladen werden.");
      const data = await res.json();
      setMessagesList(data);
    } catch (err: any) {
      addUiLog(`Fehler beim Nachrichtenabruf: ${err.message}`, "warn");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  // --- KIDS GAMIFICATION REWARD SERVICE (SIMULATOR FOR OFFLINE CONTRACTS) ---
  const earnXp = (amount: number, reason: string) => {
    setChildProfiles(prev => prev.map(child => {
      if (child.id === activeChildId) {
        const newXp = child.xp + amount;
        const currentLevel = child.level;
        const newLevel = Math.floor(newXp / 500) + 1; // 500 XP per level
        
        let leveledUp = false;
        if (newLevel > currentLevel) {
          leveledUp = true;
          setCustomNotify({
            text: `🎉 LEVEL-UP! ${child.name} ist jetzt Level ${newLevel}!`,
            details: `Klasse Leistung! Du hast Stufe ${newLevel} erreicht. Ein neues Offline-Abzeichen wurde verdient!`
          });
          // Track in statistics
          child.pathsFinished += 1;
        } else {
          setCustomNotify({
            text: `⭐ +${amount} XP verdient!`,
            details: `${reason}`
          });
        }
        
        // Auto dismiss notification
        setTimeout(() => setCustomNotify(null), 5000);

        return {
          ...child,
          xp: newXp,
          level: newLevel,
          badges: leveledUp && !child.badges.includes("Niveau-Aufsteiger 🌟") 
            ? [...child.badges, "Niveau-Aufsteiger 🌟"] 
            : child.badges
        };
      }
      return child;
    }));
    addUiLog(`EP verdient (+${amount} XP): ${reason}`, "success");
  };

  // --- EDUCATION LIBRARY & QUIZ INTEGRATION SERVICE METHODS (LOCAL PERSISTENCE) ---
  const [generatingTestContent, setGeneratingTestContent] = useState(false);

  const handleGenerateTestContent = async () => {
    setGeneratingTestContent(true);
    addUiLog("Zentraler Testdaten-Generator: Initiiere Kuration für alle 6 Themenbereiche...", "info");
    try {
      const res = await fetchWithAuth("/api/admin/generate-test-items", {
        method: "POST"
      });
      if (!res.ok) {
        throw new Error("Fehler beim Generieren der Test-Inhalte.");
      }
      const data = await res.json();
      addUiLog(`Erfolgreich! Es wurden ${data.count} neue bildende Artikel & zugehörige Quizfragen in die DB eingespeist!`, "success");
      await loadLibrary();
      await loadSavedQuizzes();
    } catch (err: any) {
      addUiLog(`Fehler beim Erzeugen der Testdaten: ${err.message}`, "warn");
    } finally {
      setGeneratingTestContent(false);
    }
  };

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      addUiLog("Lade lokale Offline-Bibliothek aus PostgreSQL...", "info");
      const res = await fetchWithAuth("/api/library");
      if (!res.ok) throw new Error("Bibliothek konnte nicht geladen werden.");
      const data = await res.json();
      setLibraryItemsList(data);
      addUiLog(`${data.length} Offline-Inhalte aus lokaler DB geladen.`, "success");
    } catch (err: any) {
      addUiLog(`Fehler beim Laden der Bibliothek: ${err.message}`, "warn");
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleImportLibraryItem = async (item: {
    title: string;
    description: string;
    author?: string;
    coverUrl?: string;
    sourceType: "article" | "book" | "audiobook";
    metadata?: any;
  }) => {
    try {
      addUiLog(`Importiere "${item.title}" in lokale Bildungsmedienzensur...`, "info");
      const res = await fetchWithAuth("/api/library/import", {
        method: "POST",
        body: JSON.stringify({
          ...item,
          apiSource: item.metadata?.engine || "wikipedia",
        }),
      });
      if (!res.ok) throw new Error("Import fehlgeschlagen.");
      const data = await res.json();
      setLibraryItemsList((prev) => [data, ...prev]);
      addUiLog(`Erfolgreich importiert: "${item.title}" ist jetzt 100% offline-fähig!`, "success");
    } catch (err: any) {
      addUiLog(`Bibliotheks-Import-Fehler: ${err.message}`, "warn");
    }
  };

  const handleManualUpload = async () => {
    if (!manualTitle) {
      addUiLog("Fehler: Bitte geben Sie mindestens einen Titel an.", "warn");
      return;
    }
    try {
      addUiLog(`Reiche Medienvorschlag "${manualTitle}" als Entwurf ein...`, "info");
      const res = await fetchWithAuth("/api/library/import", {
        method: "POST",
        body: JSON.stringify({
          title: manualTitle,
          author: manualAuthor || "Eltern & Lehrkräfte",
          description: manualDescription,
          localContent: manualContent,
          itemType: manualMediaType,
          category: manualCategory,
          ageRating: manualAgeRating,
          publishStatus: "draft",
          apiSource: "manual_upload",
        }),
      });
      if (!res.ok) throw new Error("Übertragung fehlgeschlagen.");
      const data = await res.json();
      setLibraryItemsList((prev) => [data, ...prev]);
      addUiLog(`"${manualTitle}" wurde erfolgreich als Entwurf eingereicht! Ein Administrator wird es prüfen.`, "success");
      
      // Reset manual fields after submit
      setManualTitle("");
      setManualAuthor("");
      setManualDescription("");
      setManualContent("");
    } catch (err: any) {
      addUiLog(`Fehler beim Medien-Einreichen: ${err.message}`, "warn");
    }
  };

  const handleUpdateItemStatus = async (id: number, status: string) => {
    try {
      addUiLog(`Aktualisiere Status auf "${status}" für Eintrag ID ${id}...`, "info");
      const res = await fetchWithAuth(`/api/library/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ publishStatus: status }),
      });
      if (!res.ok) throw new Error("Status-Aktualisierung im Backend schlug fehl.");
      const data = await res.json();
      setLibraryItemsList((prev) => prev.map((item) => (item.id === id ? data : item)));
      addUiLog(`Status für "${data.title}" wurde auf "${status}" geändert!`, "success");
    } catch (err: any) {
      addUiLog(`Statusänderung fehlgeschlagen: ${err.message}`, "warn");
    }
  };

  const handleEditLibraryItemDetails = async (id: number, fields: any) => {
    try {
      addUiLog(`Mache Änderungen an Medien ID ${id} wirksam...`, "info");
      const res = await fetchWithAuth(`/api/library/${id}`, {
        method: "PUT",
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Bearbeitung im Backend schlug fehl.");
      const data = await res.json();
      setLibraryItemsList((prev) => prev.map((item) => (item.id === id ? data : item)));
      addUiLog(`Eintrag "${data.title}" erfolgreich aktualisiert.`, "success");
    } catch (err: any) {
      addUiLog(`Bearbeitungsfehler: ${err.message}`, "warn");
    }
  };

  const handleDeleteLibraryItem = async (id: number) => {
    if (!confirm("Medienartikel wirklich aus dem lokalen Speicher löschen?")) return;
    try {
      addUiLog(`Entferne Medienartikel ID ${id} aus lokaler Datenbank...`, "info");
      const res = await fetchWithAuth(`/api/library/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen.");
      setLibraryItemsList((prev) => prev.filter((item) => item.id !== id));
      addUiLog("Medienartikel erfolgreich gelöscht.", "success");
    } catch (err: any) {
      addUiLog(`Löschfehler: ${err.message}`, "warn");
    }
  };

  const loadSavedQuizzes = async () => {
    setLoadingSavedQuizzes(true);
    try {
      addUiLog("Lade gespeicherte Quizfragen aus lokaler DB...", "info");
      const res = await fetchWithAuth("/api/quizzes/offline");
      if (!res.ok) throw new Error("Quizfragen konnten nicht geladen werden.");
      const data = await res.json();
      setSavedQuizzesList(data);
      addUiLog(`${data.length} Offline-Quizfragen geladen.`, "success");
    } catch (err: any) {
      addUiLog(`Fehler beim Laden der Fragen: ${err.message}`, "warn");
    } finally {
      setLoadingSavedQuizzes(false);
    }
  };

  const handleImportQuizQuestions = async (questions: Array<{
    question: string;
    correctAnswer: string;
    incorrectAnswers: string[];
    category: string;
    difficulty: string;
  }>) => {
    try {
      addUiLog(`Sichere ${questions.length} Quizfragen in lokaler Cloud SQL DB für Offline-Modus...`, "info");
      const res = await fetchWithAuth("/api/quizzes/import", {
        method: "POST",
        body: JSON.stringify({ questions }),
      });
      if (!res.ok) throw new Error("Fragen-Import fehlgeschlagen.");
      const data = await res.json();
      addUiLog(`${questions.length} Quizfragen erfolgreich offline gespeichert!`, "success");
      loadSavedQuizzes();
    } catch (err: any) {
      addUiLog(`Quiz-Import-Fehler: ${err.message}`, "warn");
    }
  };

  const handleDeleteSavedQuiz = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/api/quizzes/offline/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Frage konnte nicht gelöscht werden.");
      setSavedQuizzesList((prev) => prev.filter((q) => q.id !== id));
      addUiLog("Lokal gespeicherte Frage gelöscht.", "success");
    } catch (err: any) {
      addUiLog(`Fehler beim Löschen der Frage: ${err.message}`, "warn");
    }
  };

  const loadQuizScores = async () => {
    setLoadingScores(true);
    try {
      const res = await fetchWithAuth("/api/quizzes/scores");
      if (!res.ok) throw new Error("Highscores konnten nicht geladen werden.");
      const data = await res.json();
      setQuizScoresList(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingScores(false);
    }
  };

  const handleSaveQuizScore = async (category: string, score: number, totalQuestions: number) => {
    try {
      addUiLog(`Sichere Score (${score}/${totalQuestions}) in Cloud SQL...`, "info");
      const res = await fetchWithAuth("/api/quizzes/scores", {
        method: "POST",
        body: JSON.stringify({ category, score, totalQuestions }),
      });
      if (!res.ok) throw new Error("Score-Speicherung fehlgeschlagen.");
      const data = await res.json();
      setQuizScoresList((prev) => [data, ...prev]);
      addUiLog("Score erfolgreich persistiert!", "success");
    } catch (err: any) {
      addUiLog(`Score-Speicherungsfehler: ${err.message}`, "warn");
    }
  };

  // --- INTERACTIVE QUIZ MOTOR FUNCTIONS ---

  const prepareAnswers = (q: any) => {
    if (!q) return;
    // incorrectAnswers can be parsed if it's stored as plain JSON string or already parsed array
    let incorrect: string[] = [];
    try {
      incorrect = typeof q.incorrectAnswers === "string" ? JSON.parse(q.incorrectAnswers) : q.incorrectAnswers || [];
    } catch (e) {
      incorrect = Array.isArray(q.incorrectAnswers) ? q.incorrectAnswers : [];
    }
    const answers = [...incorrect, q.correctAnswer].sort(() => 0.5 - Math.random());
    setShuffledAnswers(answers);
  };

  const startOfflineQuiz = () => {
    if (savedQuizzesList.length === 0) {
      addUiLog("Keine Quizfragen im lokalen Speicher registriert.", "warn");
      return;
    }
    
    addUiLog("Starte Offline-Quiz mit 10 zufälligen Fragen...", "info");
    const shuffled = [...savedQuizzesList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    setCurrentQuizQuestions(selected);
    setCurrentQuestionIdx(0);
    setQuizScore(0);
    setSelectedAnswer("");
    setAnswered(false);
    setIsOfflineQuiz(true);
    setQuizState("playing");
    
    prepareAnswers(selected[0]);
  };

  const handleAnswerSubmit = (ans: string) => {
    if (answered) return;
    setSelectedAnswer(ans);
    setAnswered(true);
    const currentQ = currentQuizQuestions[currentQuestionIdx];
    if (ans === currentQ.correctAnswer) {
      setQuizScore((prev) => prev + 1);
      addUiLog(`Frage ${currentQuestionIdx + 1}: Korrekt geantwortet!`, "success");
    } else {
      addUiLog(`Frage ${currentQuestionIdx + 1}: Falsch geantwortet!`, "info");
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < currentQuizQuestions.length) {
      setCurrentQuestionIdx(nextIdx);
      setSelectedAnswer("");
      setAnswered(false);
      prepareAnswers(currentQuizQuestions[nextIdx]);
    } else {
      setQuizState("finished");
      // Persist score immediately
      const cat = currentQuizQuestions[0]?.category || "Allgemein";
      handleSaveQuizScore(cat, quizScore, currentQuizQuestions.length);
    }
  };

  // TRIGGER LIEFERSYSTEME
  useEffect(() => {
    if (user) {
      loadLibrary();
      loadSavedQuizzes();
      loadQuizScores();
    }
  }, [user]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    try {
      addUiLog(`Erstelle neue Chat-Sitzung: "${newSessionName}"...`, "info");
      const res = await fetchWithAuth("/api/chats", {
        method: "POST",
        body: JSON.stringify({ sessionName: newSessionName }),
      });
      if (!res.ok) throw new Error("Erstellung fehlgeschlagen.");
      const data = await res.json();
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
      setNewSessionName("");
      addUiLog("Sitzung in Cloud SQL gespeichert.", "success");
    } catch (err: any) {
      addUiLog(`Erstellungsfehler: ${err.message}`, "warn");
    }
  };

  const handleDeleteSession = async (chatId: number) => {
    if (!confirm("Sitzung wirklich unwiderruflich löschen?")) return;
    try {
      addUiLog(`Lösche Sitzung ID ${chatId} aus Cloud SQL...`, "info");
      const res = await fetchWithAuth(`/api/chats/${chatId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen.");
      setSessions((prev) => prev.filter((s) => s.id !== chatId));
      if (activeSessionId === chatId) {
        setActiveSessionId(null);
        setMessagesList([]);
      }
      addUiLog("Sitzung gelöscht.", "success");
    } catch (err: any) {
      addUiLog(`Löschfehler: ${err.message}`, "warn");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSessionId) return;

    const userText = inputText;
    setInputText("");
    setSendingMessage(true);
    addUiLog("Sende Nachricht an Gemini...", "info");

    try {
      const res = await fetchWithAuth(`/api/chats/${activeSessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          text: userText,
          diagnosis: selectedDiagnosis,
          phase: selectedPhase,
          mode: selectedMode,
        }),
      });

      if (!res.ok) throw new Error("Serverfehler beim Senden.");
      const data = await res.json();
      
      // Update local message list with user and model responses
      setMessagesList((prev) => [...prev, data.userMessage, data.modelMessage]);
      addUiLog("Konversation erfolgreich via Cloud SQL protokolliert.", "success");
    } catch (err: any) {
      addUiLog(`Fehler beim Senden: ${err.message}`, "warn");
    } finally {
      setSendingMessage(false);
    }
  };

  // OAUTH GOOGLE SIGN IN
  const handleLogin = async () => {
    try {
      setLoadingAuth(true);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      addUiLog(`Login-Fehler: ${err.message}`, "warn");
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      addUiLog(`Logout-Fehler: ${err.message}`, "warn");
    }
  };

  // CALL EDUCATION OPEN APIS (WITH CLOUD SQL LOGGING TELEMETRY & IMPORT FEEDBACK)
  const handleCallApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerms.trim() && apiType !== "opentrivia") return;

    setLoadingApi(true);
    setApiError("");
    setApiResults(null);
    addUiLog(`Frage Bildungs-Schnittstelle (${apiType.toUpperCase()}) für "${searchTerms || 'Standard'}" ab...`, "info");

    try {
      let endpoint = "";
      if (apiType === "wikipedia") {
        endpoint = `/api/education-api/wikipedia?q=${encodeURIComponent(searchTerms)}`;
      } else if (apiType === "wikimedia") {
        endpoint = `/api/education-api/wikimedia?q=${encodeURIComponent(searchTerms)}`;
      } else if (apiType === "openlibrary") {
        endpoint = `/api/education-api/openlibrary?q=${encodeURIComponent(searchTerms)}`;
      } else if (apiType === "librivox") {
        endpoint = `/api/education-api/librivox?q=${encodeURIComponent(searchTerms)}`;
      } else {
        // Open Trivia DB: can choose a numerical category based on term or empty for all
        const catParam = searchTerms.trim() ? `&category=${searchTerms.trim()}` : "";
        endpoint = `/api/education-api/opentrivia?amount=10${catParam}`;
      }

      const res = await fetchWithAuth(endpoint);
      if (!res.ok) throw new Error("Der Server meldet einen Abruffehler für die ausgewählte Schnittstelle.");
      const data = await res.json();
      setApiResults(data);
      addUiLog(`Schnittstellen-Abfrage geloggt in Cloud SQL Tabelle 'api_logs'.`, "success");
    } catch (err: any) {
      setApiError(err.message || "Unerwarteter Fehler beim Abruf der Bildungsdaten.");
      addUiLog(`Schnittstellen-Fehler: ${err.message}`, "warn");
    } finally {
      setLoadingApi(false);
    }
  };

  // LOAD CLOUD SQL AUDIT LOGS
  const loadCloudSqlLogs = async () => {
    setLoadingLogs(true);
    try {
      addUiLog("Lade Logs aus PostgreSQL Tabelle: api_logs...", "info");
      const res = await fetchWithAuth("/api/clinical-api/logs");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setAuditLogs(data);
      addUiLog("Audit-Logs aus der Datenbank ausgelesen.", "success");
    } catch (err: any) {
      addUiLog(`Audit-Fehler: ${err.message}`, "warn");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit" && user) {
      loadCloudSqlLogs();
    }
  }, [activeTab]);

  // CHECK IF THE KI HIGHLIGHTS QUALITY REVIEWS OR MANUAL VERIFICATIONS
  const isCrisisEscalated = (text: string) => {
    const keywords = ["Wissensgrenze erreicht", "Review empfohlen", "manuell prüfen", "vor Freigabe manuell prüfen", "historisch/wissenschaftlich nicht eindeutig"];
    return keywords.some(k => text.toLowerCase().includes(k.toLowerCase()));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      
      {/* BRAND HEADER */}
      <header className="bg-slate-900/90 border-b border-indigo-950/40 px-6 py-4 sticky top-0 z-50 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-inner text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-violet-300 to-teal-400 bg-clip-text text-transparent">
                  EduSpace Mediathek
                </h1>
                <span className="text-[10px] bg-indigo-950/60 border border-indigo-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                  NETFLIX FÜR BILDUNG
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Geschlossene Offline-Edukations-Plattform &amp; Kuration mit Cloud SQL Persistenz
              </p>
            </div>
          </div>

          {/* CLOUD RUN & DATABASE CONFIGURATION INDICATORS */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>europe-west3 (Cloud SQL Active)</span>
            </div>
            {user ? (
              <div className="flex items-center gap-2 pl-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-300 truncate max-w-[120px] font-mono">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Abmelden"
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1 rounded-lg flex items-center gap-1.5 transition text-xs shadow"
              >
                <Lock className="w-3 h-3" />
                Mit Google einloggen
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SUB-HEADER NAVIGATION FOR THE PORTAL */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              id="tab-btn-library"
              onClick={() => setActiveTab("library")}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wide transition-all transform duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "library"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 border-t border-indigo-400/25 text-white shadow-lg shadow-indigo-950/50 scale-102"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Lokale Offline-Bibliothek &amp; Quiz
            </button>
            <button
              id="tab-btn-apis"
              onClick={() => setActiveTab("apis")}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wide transition-all transform duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "apis"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 border-t border-indigo-400/25 text-white shadow-lg shadow-indigo-950/50 scale-102"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <Database className="w-4 h-4" /> Live-Kuration &amp; API-Importeur
            </button>
            <button
              id="tab-btn-assistant"
              onClick={() => setActiveTab("assistant")}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wide transition-all transform duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "assistant"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-t border-violet-400/25 text-white shadow-lg shadow-violet-950/50 scale-102"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <Sparkles className="w-4 h-4" /> KI-Inhaltskurator &amp; Assistent
            </button>
            <button
              id="tab-btn-audit"
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wide transition-all transform duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "audit"
                  ? "bg-gradient-to-r from-slate-700 to-slate-800 border-t border-slate-500/25 text-white shadow-lg shadow-slate-950/50 scale-102"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <History className="w-4 h-4" /> Cloud SQL Logs Monitor (api_logs)
            </button>
            <button
              id="tab-btn-config"
              onClick={() => setActiveTab("config")}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wide transition-all transform duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "config"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 border-t border-indigo-400/25 text-white shadow-lg shadow-indigo-950/50 scale-102"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <Settings className="w-4 h-4" /> Profile &amp; Tagesplan-Zentrum
            </button>
            <button
              onClick={() => {
                setKidsSandboxMode(true);
                addUiLog("Kindersichere Sandbox aktiviert. Viel Spaß beim Lernen!", "success");
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-900/20 glow animate-pulse ml-2"
            >
              <Gamepad2 className="w-4 h-4 animate-bounce" />
              Kindermodus starten 👶
            </button>
          </div>
          <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
            Status: EduSpace Content Hub v4.0 (Active)
          </span>
        </div>
      </div>

      {loadingAuth ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm mt-3 font-medium">Sicheres EduSpace-System wird geladen...</p>
        </div>
      ) : !user ? (
        /* BLOCKING USER GATE */
        <div className="flex-1 max-w-lg mx-auto w-full px-6 py-16 flex flex-col justify-center">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-850 shadow-2xl space-y-6 text-center transform scale-100 transition-all">
            <div className="w-16 h-16 bg-indigo-950/50 border border-indigo-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-lg">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">Kurator- &amp; Administrator-Zugang</h2>
              <p className="text-xs text-slate-400 leading-relaxed px-2">
                Diese geschlossene Content-Plattform verbindet sich mit einer sicheren Cloud SQL Datenbank für Ihre Kuration im geschlossenen Ökosystem.
                Bitte authentifizieren Sie sich, um den Inhaltskatalog zu bearbeiten, Mediatheken anzulegen und freigegebene Offline-Inhalte zu verwalten.
              </p>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-900/60 p-4 rounded-xl text-left text-xs space-y-2">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                Sicherer Bildungsraum
              </span>
              <p className="text-slate-350 leading-relaxed">
                Dieses geschlossene System schützt Kinder vor unkontrollierten Webinhalten. Nur freigegebene (Approved) Inhalte werden synchronisiert.
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Sicheren Google Login starten &amp; Cloud SQL aktivieren
            </button>

            <div className="flex items-center my-2 text-slate-500">
              <hr className="flex-1 border-slate-800" />
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider">oder</span>
              <hr className="flex-1 border-slate-800" />
            </div>

            <button
              onClick={() => {
                // Set a mock user to trigger logged-in state without hitting Firebase Auth
                const mockUser = {
                  uid: "demo-parent-uid",
                  email: "eltern.demo@medienakut.de",
                  displayName: "Demo Eltern",
                  getIdToken: async () => "demo-token"
                } as any;
                setUser(mockUser);
                setToken("demo-token");
                addUiLog("Demo-Modus gestartet. Lokaler Speicher wird genutzt, keine Cloud SQL-Verbindung erforderlich.", "success");
              }}
              className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 font-bold py-2.5 px-4 rounded-xl shadow transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Demo-Modus starten (Ohne Anmeldung)
            </button>
          </div>
        </div>
      ) : kidsSandboxMode ? (
        /* ========================================================
           KIDS SAFE WORKSPACE: OFFLINE SANDBOX & MEDIA LAND
           ======================================================== */
        <div id="kids_sandbox_container" className={`flex-1 flex flex-col p-4 md:p-6 space-y-6 ${
          contrastHigh ? "bg-black text-white" : "bg-slate-950 text-slate-100"
        }`} style={{ fontSize: `${fontScale}rem` }}>
          
          {/* OFFLINE SANDBOX HEADER */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
            contrastHigh ? "border-4 border-white bg-black" : "bg-slate-900 border-slate-800 shadow-xl"
          }`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-950/45 border border-indigo-500/30 rounded-xl text-teal-400">
                <Gamepad2 className="w-8 h-8 shrink-0 text-emerald-400 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">Kinder-Lernbereich (Offline Sandbox)</h2>
                  <span className="text-[10px] bg-emerald-950/60 border border-emerald-500 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase">
                    Geschützter Raum
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Deine sichere Mediathek zum Lesen, Raten und Lernen. Keine Links nach draußen!
                </p>
              </div>
            </div>

            {/* ACCESSIBILITY & PARENT EXIT CONTROLS */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2 border border-slate-800 rounded-xl">
              
              {/* ACCESSIBILITY CONTROLS */}
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
                <button
                  onClick={() => setFontScale((p) => Math.min(1.4, p + 0.1))}
                  className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-xs font-bold font-mono text-slate-300 cursor-pointer"
                  title="Schriftgröße vergrößern"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontScale((p) => Math.max(0.9, p - 0.1))}
                  className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded text-xs font-bold font-mono text-slate-300 cursor-pointer"
                  title="Schriftgröße verkleinern"
                >
                  a-
                </button>
                <button
                  onClick={() => setContrastHigh((p) => !p)}
                  className={`p-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    contrastHigh ? "bg-white text-black font-semibold" : "bg-slate-900 text-slate-300 hover:bg-slate-850"
                  }`}
                  title="Kontrastmodus umschalten"
                >
                  <Eye className="w-3.5 h-3.5" /> Kontrast
                </button>
              </div>

              {/* LOCK GATE BUTTON FOR PARENTS */}
              <button
                onClick={() => {
                  setPinEntry("");
                  setPinError("");
                  setPinpadVisible(true);
                }}
                className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Elternbereich verlassen
              </button>
            </div>
          </div>

          {/* DYNAMIC CHILD CHOOSE PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* COLUMN 1: LEFT SUB-FRAME CHILD INFORMATION HUB */}
            <div className="md:col-span-1 space-y-6">
              
              {/* PROFILES GRID */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                contrastHigh ? "border-4 border-white bg-black" : "bg-slate-900 border-slate-800 shadow"
              }`}>
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-400" />
                  Wer lernt gerade?
                </h3>
                
                <div className="space-y-2.5">
                  {childProfiles.map((child) => {
                    const isActive = child.id === activeChildId;
                    return (
                      <button
                        key={child.id}
                        onClick={() => {
                          setActiveChildId(child.id);
                          addUiLog(`Aktives Kind gewechselt auf: ${child.name}`, "info");
                        }}
                        className={`w-full p-3.5 rounded-xl border text-left transition transform flex items-center justify-between cursor-pointer ${
                          isActive
                            ? contrastHigh
                              ? "bg-white border-white text-black text-sm font-bold"
                              : "bg-indigo-950/60 border-indigo-500 text-white shadow shadow-indigo-950/50 scale-102 font-bold"
                            : contrastHigh
                              ? "bg-black border-slate-600 text-slate-400 hover:text-white"
                              : "bg-slate-950/50 border-slate-850 text-slate-400 hover:bg-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl bg-slate-900 p-2 rounded-xl border border-slate-800">
                            {child.name === "Fynn" ? "🚀" : child.name === "Lea" ? "✨" : child.name === "Tom" ? "🦖" : "🎈"}
                          </span>
                          <div>
                            <span className="text-sm block">{child.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{child.age} Jahre • Level {child.level}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PERFORMANCE METRICS & BADGES FOR SELECTED PROFILE */}
              {(() => {
                const child = childProfiles.find((p) => p.id === activeChildId) || childProfiles[0];
                const xpBoundary = child.level * 500;
                const xpLastBoundary = (child.level - 1) * 500;
                const progressPct = Math.min(100, Math.floor(((child.xp - xpLastBoundary) / 500) * 100));

                return (
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    contrastHigh ? "border-4 border-white bg-black" : "bg-slate-900 border-slate-800 shadow"
                  }`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
                        Sterne &amp; Level
                      </h3>
                      <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-900/65">
                        Level {child.level}
                      </span>
                    </div>

                    <div className="text-center py-2 space-y-1">
                      <span className="text-4xl block leading-none">🎖️</span>
                      <span className="text-lg font-bold text-white block">{child.name}</span>
                      <span className="text-[11px] text-slate-400">{child.xp} EP gesamt gesammelt</span>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-medium text-slate-400">
                        <span>{child.xp} XP</span>
                        <span>{xpBoundary} XP</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 italic block text-center font-sans">Noch {xpBoundary - child.xp} EP bis Level-Up!</span>
                    </div>

                    {/* BADGES */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Auszeichnungen ({child.badges?.length || 0}):</span>
                      <div className="flex flex-wrap gap-1.5 font-sans">
                        {child.badges?.map((bg: string) => (
                          <span
                            key={bg}
                            className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-1 rounded-lg text-slate-300 font-sans shadow"
                          >
                            {bg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* COLUMN 2: MAIN PLAYGROUND BENTO TILES */}
            <div className="md:col-span-3 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TILE 1: TIMELINE (TAGESPLAN) */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  contrastHigh ? "border-4 border-white bg-black" : "bg-slate-900 border-slate-800 shadow"
                }`}>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    Interaktiver Saisoplan &amp; Tagesplan 📑
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400 font-sans">
                    Schau auf deine Uhr! Klicke auf deine erledigten Stationen, wenn du sie abgeschlossen hast:
                  </p>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {tagesplanList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setTagesplanList(prev => prev.map(p => p.id === item.id ? { ...p, completed: !p.completed } : p));
                          const child = childProfiles.find(cp => cp.id === activeChildId);
                          if (!item.completed && child) {
                            earnXp(40, `Station '${item.title}' absolviert`);
                            addUiLog(`${child.name} hat '${item.title}' auf erledigt geschaltet.`, "success");
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition transform hover:scale-101 cursor-pointer flex items-center justify-between ${
                          item.completed
                            ? contrastHigh
                              ? "bg-white text-black border-white"
                              : "bg-emerald-950/20 border-emerald-500/40 text-emerald-100"
                            : contrastHigh
                              ? "bg-black border-slate-700 text-slate-300"
                              : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl bg-slate-900 p-1 rounded border border-slate-850 leading-none">{item.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold leading-none">{item.title}</span>
                              <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-teal-400 px-1 py-0.5 rounded leading-none">{item.timeRange}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          item.completed
                            ? "bg-emerald-500 border-emerald-400 text-white"
                            : "border-slate-750"
                        }`}>
                          {item.completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TILE 2: DAILY MISSIONS (AUFGABEN & XP) */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  contrastHigh ? "border-4 border-white bg-black" : "bg-slate-900 border-slate-800 shadow"
                }`}>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-violet-400 animate-pulse" />
                    Erlebnismissionen &amp; Aufgaben 🏆
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400 font-sans">
                    Schließe Aufgaben ab, um sofort wertvolle Sterne (+EP) für dein eigenes Profil zu verdienen!
                  </p>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {tasksList.map((tsk) => {
                      const activeChild = childProfiles.find(cp => cp.id === activeChildId);
                      const isCompleted = tsk.completedBy?.includes(activeChild?.id || "");
                      return (
                        <div
                          key={tsk.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isCompleted
                              ? contrastHigh
                                ? "bg-white text-black border-white text-xs"
                                : "bg-violet-955/20 border-violet-800/40 text-violet-100 opacity-80"
                              : contrastHigh
                                ? "bg-black border-slate-700 text-slate-300"
                                : "bg-slate-950 border-slate-850 text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl bg-slate-900 p-1 rounded border border-slate-850 leading-none">{tsk.emoji}</span>
                            <div>
                              <span className="text-xs font-bold block">{tsk.title}</span>
                              <span className="text-[10px] text-violet-400 font-mono font-bold mt-1 block">+ {tsk.xpReward} XP Belohnung</span>
                            </div>
                          </div>

                          {isCompleted ? (
                            <span className="text-[10px] bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded font-bold font-mono">
                              Erledigt ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                // Add child ID to completedBy
                                setTasksList(prev => prev.map(t => {
                                  if (t.id === tsk.id) {
                                    return {
                                      ...t,
                                      completedBy: [...(t.completedBy || []), activeChild?.id || ""]
                                    };
                                  }
                                  return t;
                                }));
                                earnXp(tsk.xpReward, `Aufgabe '${tsk.title}' gemeistert`);
                                addUiLog(`${activeChild?.name} hat Aufgabe '${tsk.title}' erledigt.`, "success");
                              }}
                              className="px-3 py-1 bg-violet-600 hover:bg-violet-500 font-bold text-xs text-white rounded-lg transition active:scale-95 cursor-pointer block text-center shrink-0"
                            >
                              Erledigt!
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* TILE 3: DIGITAL MEDIC CORATION (LIBRARY & APIS & OFFLINE READING HUB) */}
              <div className={`p-6 rounded-2xl border space-y-6 ${
                contrastHigh ? "border-4 border-white bg-black" : "bg-slate-900 border-slate-800 shadow"
              }`}>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      Dein Offline-Inhaltsarchiv 📖
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      Nutze das lokale Bildungsarchiv, um spannende Artikel offline zu lesen oder das Wissensquiz zu starten!
                    </p>
                  </div>
                  
                  {/* CONTENT TYPE CHIPS COUPLING ALLOW CONTROLLING VARS */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-850 rounded-xl text-[11px] font-bold font-mono">
                    <span className="px-2 py-0.5 opacity-60 text-slate-450 text-slate-400">STATUS:</span>
                    <span className={`px-2 py-0.5 rounded-lg ${allowPdf ? "text-indigo-400 bg-indigo-950/45" : "text-rose-500 line-through bg-rose-950/10"}`}>
                      Bücher
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg ${allowAudio ? "text-indigo-400 bg-indigo-950/45" : "text-rose-500 line-through bg-rose-950/10"}`}>
                      Audios
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg ${allowQuiz ? "text-indigo-400 bg-indigo-950/45" : "text-rose-500 line-through bg-rose-955/10"}`}>
                      Quizze
                    </span>
                  </div>
                </div>

                {/* OFFLINE LIBRARY ITEMS */}
                <div className="space-y-4">
                  
                  {/* LOCAL QUIZ BOOSTER BOX */}
                  {allowQuiz && (
                    <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-violet-950/20 to-indigo-950/40 border border-indigo-900/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-3xl">🧠</span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-none">Tages-Wissensquiz starten!</h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-sans">Löse 10 spannende Fragen über Tiere, Planeten und Weltraum!</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          startOfflineQuiz();
                          addUiLog("Wissensarena über Offline Sandbox betreten.", "info");
                        }}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Gamepad2 className="w-4 h-4" /> Quiz-Arena betreten!
                      </button>
                    </div>
                  )}

                  {/* ACTIVE QUIZ PLAYBOARD (IF STATE == PLAYING) */}
                  {quizState === "playing" && (
                    <div className="p-5 bg-slate-950 border border-indigo-900/60 rounded-2xl space-y-4 shadow-2xl text-left">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="text-indigo-400 font-bold uppercase tracking-wider">Aktives Quiz</span>
                        <span>Frage {currentQuestionIdx + 1} von {currentQuizQuestions.length}</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-bold text-white leading-relaxed">
                          {currentQuizQuestions[currentQuestionIdx]?.question}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                        {shuffledAnswers.map((ans) => {
                          const isSel = selectedAnswer === ans;
                          const correctAns = currentQuizQuestions[currentQuestionIdx]?.correctAnswer;
                          const isCorrect = ans === correctAns;

                          return (
                            <button
                              key={ans}
                              disabled={answered}
                              onClick={() => handleAnswerSubmit(ans)}
                              className={`p-3 text-left rounded-xl transition font-sans text-xs flex justify-between items-center border cursor-pointer ${
                                answered
                                  ? isCorrect
                                    ? "bg-emerald-950 border-emerald-500 text-emerald-255"
                                    : isSel
                                      ? "bg-rose-955 border-rose-500 text-rose-200"
                                      : "bg-slate-900 border-slate-850 text-slate-500"
                                  : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-200 hover:text-white"
                              }`}
                            >
                              <span>{ans}</span>
                              {answered && isCorrect && <span className="text-emerald-400 font-bold font-mono text-[10px]">✓ RICHTIG</span>}
                              {answered && isSel && !isCorrect && <span className="text-rose-450 font-bold font-mono text-[10px]">FALSCH</span>}
                            </button>
                          );
                        })}
                      </div>

                      {answered && (
                        <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-900">
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                            {selectedAnswer === currentQuizQuestions[currentQuestionIdx]?.correctAnswer ? (
                              <span className="text-emerald-400 font-bold block">✓ Bravo! Du hast +10 EP erhalten!</span>
                            ) : (
                              <span className="text-slate-400 block">Die richtige Antwort ist: <span className="font-bold text-teal-400">{currentQuizQuestions[currentQuestionIdx]?.correctAnswer}</span></span>
                            )}
                          </p>
                          <button
                            onClick={() => {
                              if (selectedAnswer === currentQuizQuestions[currentQuestionIdx]?.correctAnswer) {
                                earnXp(10, `Quizfrage richtig beantwortet`);
                              }
                              handleNextQuestion();
                            }}
                            className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            Weiter <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {quizState === "finished" && (
                    <div className="p-5 bg-gradient-to-r from-emerald-950/20 via-slate-950 to-emerald-950/20 border border-emerald-900/40 rounded-xl text-center space-y-3 shadow">
                      <span className="text-4xl block leading-none">🏆</span>
                      <h4 className="text-sm font-bold text-white">Quiz erfolgreich beendet!</h4>
                      <p className="text-[11px] text-slate-300">
                        Du hast insgesamt <span className="font-bold text-teal-400">{quizScore} von {currentQuizQuestions.length} Fragen</span> richtig beantwortet.
                      </p>
                      <button
                        onClick={() => {
                          setQuizState("idle");
                          const finalBonus = quizScore * 20;
                          earnXp(finalBonus, `Quizmeister Bonus erhalten!`);
                        }}
                        className="px-4 py-1.5 bg-emerald-650 hover:bg-emerald-600 font-bold text-xs text-white rounded-lg transition"
                      >
                        Bonus abholen &amp; schließen
                      </button>
                    </div>
                  )}

                  {/* READABLE CONTENT LIST */}
                  {allowPdf ? (
                    <div className="space-y-3 text-left">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokale Wissenslektüren ({libraryItemsList.length} Bücher):</h4>
                      
                      {libraryItemsList.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs font-sans">
                          Keine Bücher im Offline-Speicher gefunden. Synchronisiere Bücher im "Schnittstellen-Importeur" Bereich als Eltern!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {libraryItemsList.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedReadingItem(item);
                                addUiLog(`Buch '${item.title}' aufgeschlagen.`, "info");
                              }}
                              className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 hover:bg-slate-900 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-between shadow"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl p-1 bg-slate-900 border border-slate-800 rounded">📖</span>
                                <div>
                                  <span className="text-xs font-bold text-white block truncate max-w-[190px]">{item.title}</span>
                                  <span className="text-[10px] text-slate-450 mt-1 block truncate max-w-[190px]">{item.apiSource || "MedienAkut"} Archiv</span>
                                </div>
                              </div>
                              <Play className="w-3.5 h-3.5 text-indigo-400 opacity-60 hover:opacity-100" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic block text-center py-4 font-sans">Bücher und Lesetexte wurden temporär gesperrt.</p>
                  )}

                  {/* SENSATIONAL MOCK AUDIO PLAYS FOR LEA & CO */}
                  {allowAudio && (
                    <div className="space-y-3 pt-3 border-t border-slate-900 text-left">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokale Hörspiele &amp; Audios (Offline):</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {[
                          { id: "aud-1", title: "Astronomie für Kinder: Der Mars", dur: "12:15 Min", author: "Hörspiel Crew" },
                          { id: "aud-2", title: "Die Bremer Stadtmusikanten (Gelesen)", dur: "09:40 Min", author: "Märchenonkel" },
                          { id: "aud-3", title: "Entdeckung der Dinosaurer: T-Rex", dur: "15:05 Min", author: "Bildungsradio" }
                        ].map((aud) => (
                          <div
                            key={aud.id}
                            onClick={() => {
                              setSelectedReadingItem({
                                title: aud.title,
                                description: `Du hörst jetzt die Audio-Geschichte: "${aud.title}" (${aud.dur}). Vorgelesen von: ${aud.author}.\n\n[SIMULIERTE AUDIO-PRODUKTION]\n00:01 ───⬤───────────── 15:00\n\nEin Sprecher liest mit warmer Stimme: "Es war einmal vor langer, langer Zeit..."`,
                                sourceUrl: "",
                                apiSource: "Audio-Archiv"
                              });
                              earnXp(5, `Hörspiel gestartet`);
                            }}
                            className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 hover:bg-slate-900 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-between shadow"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl p-1 bg-slate-900 border border-slate-800 rounded">🎙️</span>
                              <div>
                                <span className="text-xs font-bold text-white block">{aud.title}</span>
                                <span className="text-[10px] text-slate-400 mt-1 block">{aud.dur} • {aud.author}</span>
                              </div>
                            </div>
                            <Volume2 className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

          {/* EXIT PASSWORD PROTECTED MODAL GATE */}
          <AnimatePresence>
            {pinpadVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 font-sans"
                >
                  <div className="mx-auto w-12 h-12 bg-rose-955/50 border border-rose-800 rounded-xl flex items-center justify-center text-rose-400">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-white">Sicherheitsbereich der Eltern</h3>
                    <p className="text-xs text-slate-400 mt-1">Geben Sie die 4-stellige Eltern-PIN ein, um den Kindermodus zu beenden.</p>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="password"
                      maxLength={6}
                      readOnly
                      value={pinEntry}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 text-xl font-mono text-center tracking-widest text-white focus:outline-none"
                    />
                    {pinError ? (
                      <span className="text-xs text-rose-400 font-bold block">{pinError}</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic block">Zahlentasten unten verwenden (Standard PIN ist "1234")</span>
                    )}
                  </div>

                  {/* NUMPAD */}
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setPinError("");
                          setPinEntry((prev) => (prev.length < 4 ? prev + num : prev));
                        }}
                        className="py-3 bg-slate-950 hover:bg-slate-850 text-white font-mono text-lg font-bold rounded-xl transition active:scale-90 cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setPinEntry("")}
                      className="py-3 bg-slate-950 text-rose-400 font-bold rounded-xl transition text-xs cursor-pointer"
                    >
                      CLEAR
                    </button>
                    <button
                      onClick={() => {
                        setPinError("");
                        setPinEntry((prev) => (prev.length < 4 ? prev + "0" : prev));
                      }}
                      className="py-3 bg-slate-950 text-white font-mono text-lg font-bold rounded-xl transition cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      onClick={() => {
                        if (pinEntry === parentPin) {
                          setKidsSandboxMode(false);
                          setPinpadVisible(false);
                          addUiLog("Kindermodus erfolgreich über Eltern-PIN deaktiviert.", "success");
                        } else {
                          setPinError("Falscher PIN! Versuche es noch einmal.");
                          setPinEntry("");
                        }
                      }}
                      className="py-3 bg-emerald-650 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs cursor-pointer"
                    >
                      ENTER
                    </button>
                  </div>

                  <button
                    onClick={() => setPinpadVisible(false)}
                    className="w-full text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      ) : (
        /* MAIN WORKSPACE AFTER VALID OAUTH ACCESS */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
          
          {/* TOP DEMO SWITCHER ACCENT */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="space-y-1 relative z-10 text-center md:text-left">
              <span className="text-[10px] bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded">
                PROJEKT MEDIEN_AKUT • DEMO-ROLLENSCHALTER
              </span>
              <h2 className="text-sm font-extrabold text-white">Sichten-Simulationspult für Prüfzwecke</h2>
              <p className="text-[11px] text-slate-450 leading-relaxed max-w-lg text-slate-400">
                Klicken Sie auf eine der Rollen, um die jeweilige Benutzeroberfläche und die Berechtigungen (PostgreSQL, Alterssperren) live zu testen.
              </p>
            </div>

            {/* CONTROL CHIPS */}
            <div className="flex flex-wrap gap-2 relative z-10 w-full md:w-auto justify-center">
              {[
                { role: "youth", label: "Jugendliche (U18)", color: "bg-emerald-950 border-emerald-800 text-emerald-300" },
                { role: "provider", label: "Eltern / Lehrer", color: "bg-amber-955 bg-amber-950 border-amber-800 text-amber-300" },
                { role: "admin", label: "Super-Admin (👑)", color: "bg-indigo-950 border-indigo-700 text-indigo-300" }
              ].map((chip) => (
                <button
                  key={chip.role}
                  id={`role-chip-${chip.role}`}
                  onClick={() => {
                    if (chip.role === "admin" || chip.role === "provider") {
                      setRoleGatePendingRole(chip.role as any);
                      setRolePinEntry("");
                      setRolePinError("");
                    } else {
                      setCurrentUserRole("youth");
                      addUiLog("Auf Jugendschutz-Modus (U18) zurückgesetzt.", "info");
                    }
                  }}
                  className={`px-4 py-2 text-xs rounded-xl font-bold cursor-pointer transition border ${
                    currentUserRole === chip.role
                      ? "bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/30 font-extrabold scale-105"
                      : "bg-slate-950 hover:bg-slate-900 text-slate-400 border-slate-855"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* INTERNAL SAFETY ROLE GATE SECURITY PINPAD MODAL */}
          <AnimatePresence>
            {roleGatePendingRole && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 font-sans"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs text-center space-y-4"
                >
                  <div className="space-y-1">
                    <span className="text-xl">🛡️</span>
                    <h3 className="font-bold text-sm text-white">Kinder-Verifizierung Schranke</h3>
                    <p className="text-[11px] text-slate-450 leading-relaxed text-slate-400 font-sans">
                      Bitte geben Sie den 4-stelligen Eltern-PIN ein, um den geschützten Administrationsbereich zu betreten.
                    </p>
                  </div>

                  {/* PIN FIELD */}
                  <div className="space-y-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={rolePinEntry}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) setRolePinEntry(e.target.value);
                      }}
                      placeholder="PIN eingeben (z.B. 1234)"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                    />
                    {rolePinError && <span className="text-[10px] text-rose-400 block">{rolePinError}</span>}
                  </div>

                  <div className="flex gap-2 text-xs pt-1">
                    <button
                      onClick={() => setRoleGatePendingRole(null)}
                      className="flex-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 py-2.5 rounded-xl text-slate-400 cursor-pointer font-bold"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => {
                        const targetPin = parentPin || "1234";
                        if (rolePinEntry === targetPin) {
                          setCurrentUserRole(roleGatePendingRole);
                          addUiLog(`Eltern-Verifizierung erfolgreich! Rolle auf "${roleGatePendingRole}" gesetzt.`, "success");
                          setRoleGatePendingRole(null);
                        } else {
                          setRolePinError("Zutritt verwehrt. Falscher PIN.");
                          addUiLog("Kinder-Sicherung: Falsche PIN-Eingabe registriert.", "warn");
                        }
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-white font-bold cursor-pointer"
                    >
                      Bestätigen
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CORE RENDER DECISION RAIL PER USER ROLE */}
          <div className="w-full min-h-[500px]">
            {currentUserRole === "youth" && (
              <YouthPanel
                libraryItemsList={libraryItemsList}
                activeChildId={activeChildId}
                setActiveChildId={setActiveChildId}
                childProfiles={childProfiles}
                setChildProfiles={setChildProfiles}
                favouriteItems={favouriteItems}
                setFavouriteItems={setFavouriteItems}
                downloadingItems={downloadingItems}
                setDownloadingItems={setDownloadingItems}
                downloadedItems={downloadedItems}
                setDownloadedItems={setDownloadedItems}
                activeVideoItem={activeVideoItem}
                setActiveVideoItem={setActiveVideoItem}
                activeGalleryItem={activeGalleryItem}
                setActiveGalleryItem={setActiveGalleryItem}
                activeImageIdx={activeImageIdx}
                setActiveImageIdx={setActiveImageIdx}
                setSelectedReadingItem={setSelectedReadingItem}
                tagesplanList={tagesplanList}
                setTagesplanList={setTagesplanList}
                tasksList={tasksList}
                setTasksList={setTasksList}
                fontScale={fontScale}
                contrastHigh={contrastHigh}
                addUiLog={addUiLog}
              />
            )}

            {currentUserRole === "provider" && (
              <ContributorPanel
                libraryItemsList={libraryItemsList}
                loadLibrary={loadLibrary}
                loadingLibrary={loadingLibrary}
                handleManualUpload={handleManualUpload}
                handleDeleteLibraryItem={handleDeleteLibraryItem}
                handleEditLibraryItemDetails={handleEditLibraryItemDetails}
                manualTitle={manualTitle}
                setManualTitle={setManualTitle}
                manualAuthor={manualAuthor}
                setManualAuthor={setManualAuthor}
                manualDescription={manualDescription}
                setManualDescription={setManualDescription}
                manualContent={manualContent}
                setManualContent={setManualContent}
                manualCategory={manualCategory}
                setManualCategory={setManualCategory}
                manualAgeRating={manualAgeRating}
                setManualAgeRating={setManualAgeRating}
                manualMediaType={manualMediaType}
                setManualMediaType={setManualMediaType}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                activeChildId={activeChildId}
                childProfiles={childProfiles}
                addUiLog={addUiLog}
                handleImportLibraryItem={handleImportLibraryItem}
                selectedMode={selectedMode}
                selectedDiagnosis={selectedDiagnosis}
                selectedPhase={selectedPhase}
                setSelectedDiagnosis={setSelectedDiagnosis}
                setSelectedPhase={setSelectedPhase}
                DIAGNOSES={DIAGNOSES}
                DEESCALATION_PHASES={DEESCALATION_PHASES}
                activeSessionId={activeSessionId}
                setActiveSessionId={setActiveSessionId}
                sessions={sessions}
                handleCreateSession={handleCreateSession}
                handleDeleteSession={handleDeleteSession}
                newSessionName={newSessionName}
                setNewSessionName={setNewSessionName}
                loadingSessions={loadingSessions}
                messagesList={messagesList}
                loadingMessages={loadingMessages}
                messageText={inputText}
                setMessageText={setInputText}
                handleSendMessage={handleSendMessage}
                isCrisisEscalated={isCrisisEscalated}
                oberarztAlert={oberarztAlert}
                generatingTestContent={generatingTestContent}
                handleGenerateTestContent={handleGenerateTestContent}
              />
            )}

            {currentUserRole === "admin" && (
              <AdminPanel
                libraryItemsList={libraryItemsList}
                loadLibrary={loadLibrary}
                loadingLibrary={loadingLibrary}
                handleUpdateItemStatus={handleUpdateItemStatus}
                handleDeleteLibraryItem={handleDeleteLibraryItem}
                simulatedUsers={simulatedUsers}
                setSimulatedUsers={setSimulatedUsers}
                newUserName={newUserName}
                setNewUserName={setNewUserName}
                newUserEmail={newUserEmail}
                setNewUserEmail={setNewUserEmail}
                newUserRole={newUserRole}
                setNewUserRole={setNewUserRole}
                newUserGroup={newUserGroup}
                setNewUserGroup={setNewUserGroup}
                addUiLog={addUiLog}
                parentPin={parentPin}
                setParentPin={setParentPin}
                allowVideos={allowVideos}
                setAllowVideos={setAllowVideos}
                allowAudio={allowAudio}
                setAllowAudio={setAllowAudio}
                allowPdf={allowPdf}
                setAllowPdf={setAllowPdf}
                generatingTestContent={generatingTestContent}
                handleGenerateTestContent={handleGenerateTestContent}
              />
            )}
          </div>

          {/* DUMMY SWITCH CONTAINER HOLDING LEGACY TAB LAYOUT */}
          {false && (
            <>
              {/* VIEW TAB 1: FACHASSISTENT CHATROOM & CONFIG */}
              {activeTab === "assistant" && (
            <>
              {/* LEFT SIDE PANEL: DIAGNOSES AND SESSIONS */}
              <div className="lg:col-span-1 space-y-6">

                {/* MODUS-UMSCHALTER: PÄDAGOGIK VS KLINIK */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 flex items-center gap-1.5 uppercase mb-3">
                    <Activity className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                    System-Betriebsmodus
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="mode-btn-edu"
                      onClick={() => {
                        setSelectedMode("educational");
                        setSelectedDiagnosis("Alter 8-11 Jahre");
                        setSelectedPhase("Natur & Biologie");
                        addUiLog("Betriebsmodus auf Schulung & Kuration geschaltet.", "info");
                      }}
                      className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center border cursor-pointer ${
                        selectedMode === "educational"
                          ? "bg-indigo-950/50 border-indigo-500/80 text-indigo-300 shadow-md"
                          : "bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mb-1 shrink-0" />
                      <span>EduSpace</span>
                    </button>
                    <button
                      id="mode-btn-clinical"
                      onClick={() => {
                        setSelectedMode("clinical");
                        setSelectedDiagnosis("ADHS");
                        setSelectedPhase("Phase I: Prä-Krise");
                        addUiLog("Betriebsmodus auf Deeskalations-Trainer geschaltet.", "info");
                      }}
                      className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center border cursor-pointer ${
                        selectedMode === "clinical"
                          ? "bg-emerald-950/50 border-emerald-500/80 text-emerald-300 shadow-md"
                          : "bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      <Activity className="w-4 h-4 mb-1 shrink-0" />
                      <span>Stations-Trainer</span>
                    </button>
                  </div>
                </div>
                
                {/* 1. ENVIRONMENT SPECIFIC SELECTOR */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
                  <span className="text-xs font-bold tracking-wider text-indigo-400 flex items-center gap-1.5 uppercase mb-3">
                    {selectedMode === "clinical" ? (
                      <>
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Klinischer Selektor</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Kurations-Selektor</span>
                      </>
                    )}
                  </span>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold mb-1">
                        {selectedMode === "clinical" ? "PATIENTENHINTERGRUND / DIAGNOSE:" : "ZIEL-ALTERSGRUPPE:"}
                      </label>
                      <select
                        value={selectedDiagnosis}
                        onChange={(e) => {
                          setSelectedDiagnosis(e.target.value);
                          addUiLog(`Fokus gewechselt auf: ${e.target.value}`, "info");
                        }}
                        className="w-full bg-slate-950 text-xs text-slate-100 rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        {(selectedMode === "clinical" ? CLINICAL_DIAGNOSES : DIAGNOSES).map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 italic mt-1 font-sans">
                        {(selectedMode === "clinical" ? CLINICAL_DIAGNOSES : DIAGNOSES).find(d => d.id === selectedDiagnosis)?.desc}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold mb-1">
                        {selectedMode === "clinical" ? "DEESKALATIONSPHASE:" : "THEMENSCHWERPUNKT:"}
                      </label>
                      <select
                        value={selectedPhase}
                        onChange={(e) => {
                          setSelectedPhase(e.target.value);
                          addUiLog(`Kategorie gewechselt auf: ${e.target.value}`, "info");
                        }}
                        className="w-full bg-slate-950 text-xs text-slate-100 rounded-lg border border-slate-800 px-3 py-2 focus:outline-none focus:border-indigo-505"
                      >
                        {(selectedMode === "clinical" ? CLINICAL_PHASES : DEESCALATION_PHASES).map(phase => (
                          <option key={phase.id} value={phase.id}>{phase.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 italic mt-1 font-sans">
                        {(selectedMode === "clinical" ? CLINICAL_PHASES : DEESCALATION_PHASES).find(p => p.id === selectedPhase)?.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. CHAT SESSIONS SELECTOR */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow flex flex-col h-[320px]">
                  <span className="text-xs font-bold tracking-wider text-violet-400 flex items-center gap-1.5 uppercase mb-3">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    Kurations-Sitzungen (SQL)
                  </span>

                  {/* Create New Session form */}
                  <form onSubmit={handleCreateSession} className="flex gap-1.5 mb-3">
                    <input
                      type="text"
                      placeholder="Name der Sitzung..."
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="flex-1 bg-slate-950 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-rose-800"
                    />
                    <button
                      type="submit"
                      disabled={!newSessionName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition disabled:bg-slate-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Session List */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {loadingSessions ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <p className="text-slate-500 text-center py-8 italic text-[11px]">Keine Fälle geladen.</p>
                    ) : (
                      sessions.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setActiveSessionId(s.id)}
                          className={`group w-full text-left p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                            activeSessionId === s.id
                              ? "bg-rose-950/20 border-rose-800 text-rose-200"
                              : "bg-slate-950/40 border-slate-850 hover:bg-slate-900 text-slate-300"
                          }`}
                        >
                          <span className="truncate pr-2 font-medium">{s.sessionName}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(s.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-900 transition shrink-0"
                            title="Fall löschen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT MAIN PANEL: INTERACTIVE CHAT DIALOG */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* CHAT CONTAINER */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[525px] relative">
                  
                  {/* Active Context Header */}
                  <div className="bg-slate-950/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] font-bold font-mono tracking-wider uppercase ${selectedMode === "clinical" ? "text-emerald-400" : "text-indigo-400"}`}>
                        {selectedMode === "clinical" ? "Simulations-Lauf • Deeskalations-Trainer" : "Arbeits-Sitzung • EduSpace-KI-Kuration"}
                      </span>
                      <h2 className="font-bold text-white text-sm">
                        {sessions.find(s => s.id === activeSessionId)?.sessionName || "Keine aktive Konversation"}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] bg-slate-900 border px-2 py-0.5 rounded font-mono font-medium ${selectedMode === "clinical" ? "text-emerald-300 border-emerald-900/60" : "text-indigo-300 border-indigo-900/60"}`}>
                        {selectedMode === "clinical" ? "Patient: " : "Altersgrenze: "}{selectedDiagnosis}
                      </span>
                      <span className={`text-[10px] bg-slate-900 border px-2 py-0.5 rounded font-mono font-medium ${selectedMode === "clinical" ? "text-emerald-300 border-emerald-900/60" : "text-indigo-300 border-indigo-900/60"}`}>
                        {selectedMode === "clinical" ? "Phase: " : "Fachgebiet: "}{selectedPhase}
                      </span>
                    </div>
                  </div>

                  {/* OBERARZT EMERGENCY ALERT BANNER */}
                  {oberarztAlert && (
                    <div className="bg-red-950/70 border-b border-red-800 px-6 py-2.5 flex items-start gap-2.5 animate-pulse">
                      <div className="bg-red-900/80 border border-red-500 rounded p-1 text-red-100 shrink-0 select-none">
                        <AlertOctagon className="w-5 h-5 animate-bounce" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-red-200">Kritische Eskalation detektiert!</p>
                        <p className="text-red-300/90 text-[10px] font-mono leading-tight mt-0.5">{oberarztAlert}</p>
                      </div>
                    </div>
                  )}

                  {/* MESSAGES DISPLAY */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeSessionId === null ? (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                        <BookOpen className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
                        <h3 className="font-bold text-white text-sm mb-1">Keine aktive Sitzung ausgewählt</h3>
                        <p className="text-xs text-slate-400">
                          Bitte legen Sie links unter "Kurations-Sitzungen" eine neue Sitzung an oder wählen Sie einen bestehenden Eintrag aus.
                        </p>
                      </div>
                    ) : loadingMessages ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                        <span className="text-xs text-slate-400 font-medium">Lade Sitzung aus der Cloud SQL DB...</span>
                      </div>
                    ) : messagesList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                        <Sparkles className="w-10 h-10 text-slate-705 text-indigo-550 mb-2" />
                        <h4 className="font-bold text-white text-xs mb-1">Kurationsverlauf ist leer</h4>
                        <p className="text-[11px] text-slate-400">
                          Geben Sie ein Thema, einen Lernwunsch oder einen Quizersteller-Befehl ein, um das Modell nach kindgerechten Formulierungen zu befragen!
                        </p>
                      </div>
                    ) : (
                      messagesList.map((m) => {
                        const isAssistant = m.role === "model";
                        const isCrisis = isAssistant && isCrisisEscalated(m.text);

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isAssistant ? "items-start" : "items-end"} space-y-1 animate-fadeIn`}
                          >
                            <div className="flex items-center gap-1.5 px-1 font-mono text-[10px] text-slate-500">
                              <span>{isAssistant ? "EduSpace Inhalts-Fachassistent (KI)" : "System-Administrator / Kurator"}</span>
                              <span>•</span>
                              <span>{new Date(m.createdAt).toLocaleTimeString("de-DE")}</span>
                            </div>

                            <div
                              className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                isAssistant
                                  ? isCrisis
                                    ? "bg-amber-950/80 border-2 border-amber-600/80 text-amber-100 shadow-lg shadow-amber-950/30 font-semibold"
                                    : "bg-slate-900 border border-slate-800 text-slate-200"
                                  : "bg-indigo-600 text-white"
                              }`}
                            >
                              {/* QUALITY CHECK ALERT HEADER */}
                              {isCrisis && (
                                <div className="mb-2 bg-amber-900/50 border border-amber-700/60 p-2 rounded-lg text-amber-100 flex items-start gap-1.5 animate-pulse text-[11px]">
                                  <AlertOctagon className="w-4 h-4 shrink-0 text-amber-400" />
                                  <div>
                                    <span className="font-bold block uppercase tracking-wider text-[9px]">🚨 HINWEIS: INHALTS-QUALITÄTSPRÜFUNG EMPFOHLEN</span>
                                    Die KI hat Wissensgrenzen, unbelegte Fakten oder Verifizierungsbedarf signalisiert. Bitte Fakten vor Freigabe sorgfältig manuell prüfen!
                                  </div>
                                </div>
                              )}

                              <p className="whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {sendingMessage && (
                      <div className="flex flex-col items-start space-y-1">
                        <span className="font-mono text-[10px] text-slate-500">EduSpace-Modell formuliert kindgerechten Entwurf...</span>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                          <span>Bitte warten...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* INPUT BAR */}
                  <form onSubmit={handleSendMessage} className="bg-slate-950 border-t border-slate-800 p-4 flex gap-2">
                    <input
                      type="text"
                      disabled={activeSessionId === null || sendingMessage}
                      placeholder={activeSessionId === null ? "Bitte links Sitzung auswählen..." : "Lerninhalt, Wikipedia-Thema oder Quiz-Anweisung eingeben..."}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-slate-900 disabled:bg-slate-950/40 text-xs px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 placeholder-slate-500 text-slate-200"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sendingMessage || activeSessionId === null}
                      className="bg-indigo-650 hover:bg-indigo-550 disabled:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition font-bold text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Erstellen
                    </button>
                  </form>
                </div>

                {/* VISUAL OF THE ACTIVE QUALITY CONFIGURATION UNDERNEATH SYSTEM FOR HIGHLIGHTS */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-indigo-950/40 border border-indigo-900 text-indigo-400 rounded-lg">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Qualitäts- und Kindersicherung</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Sollten Themen oder Formulierungen unvollständige Belege aufweisen oder die Wissensgrenze berühren, blendet das System automatisch einen <strong>Prüfhinweis</strong> ein. Der Administrator entscheidet eigenverantwortlich über die Freigabe des Mediums.
                    </p>
                  </div>
                </div>

              </div> {/* Close lg:col-span-3 */}
            </>
          )}

          {/* VIEW TAB 2.5: OFFLINE-BIBLIOTHEK & INTERAKTIVES QUIZ */}
          {activeTab === "library" && (
            <div className="lg:col-span-4 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* LINKE SPALTE: MEDIATHEK ARCHIV */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                          Lokales Offline-Archiv
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Sämtliche hier sichtbaren Medien wurden durch Ihre Kuration über APIs heruntergeladen. Sie sind lokal in Cloud SQL persistiert und 100% offline-bereit.
                        </p>
                      </div>
                      <button
                        onClick={loadLibrary}
                        disabled={loadingLibrary}
                        className="self-start sm:self-center bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingLibrary ? "animate-spin" : ""}`} />
                        Aktualisieren
                      </button>
                    </div>

                    {/* MEDIATHEK CONTENT SCREEN */}
                    {loadingLibrary ? (
                      <div className="py-12 text-center text-slate-450">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
                        <span>Katalogisiere lokale Speicherstände...</span>
                      </div>
                    ) : libraryItemsList.length === 0 ? (
                      <div className="py-16 text-center border-2 border-slate-800/80 border-dashed rounded-2xl max-w-lg mx-auto px-6">
                        <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-200 text-sm mb-1">Keine Medien im lokalen Archiv</h4>
                        <p className="text-xs text-slate-450 leading-relaxed mb-4">
                          Wechseln Sie oben auf den Reiter <strong>"Live-Kuration &amp; API-Importeur"</strong>, um wikipedia-Artikel, freie Bilder, Open Library Bücher oder Hörspiele hierhin zu spiegeln.
                        </p>
                        <button
                          onClick={() => setActiveTab("apis")}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                        >
                          Jetzt Inhalte kuratieren
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {libraryItemsList.map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow"
                          >
                            <div className="flex gap-4">
                              <div className="w-16 h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                {item.coverUrl ? (
                                  <img
                                    src={item.coverUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <BookOpen className="w-6 h-6 text-slate-700" />
                                )}
                              </div>
                              <div className="space-y-1 flex-1 min-w-0">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono inline-block truncate ${
                                  (item.itemType || item.sourceType) === "book" ? "bg-amber-950 text-amber-300 border border-amber-900" : (item.itemType || item.sourceType) === "audiobook" ? "bg-indigo-950 text-indigo-300 border border-indigo-900" : "bg-emerald-950 text-emerald-300 border border-emerald-900"
                                }`}>
                                  {(item.itemType || item.sourceType) === "book" ? "📖 Buch" : (item.itemType || item.sourceType) === "audiobook" ? "🎙️ Hörbuch" : "📝 Wissenskarte"}
                                </span>
                                <h3 className="font-bold text-slate-100 text-xs truncate" title={item.title}>
                                  {item.title}
                                </h3>
                                {item.author && (
                                  <p className="text-[10px] text-slate-400 truncate">Urheber: {item.author}</p>
                                )}
                                <p className="text-[11px] text-slate-350 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-900 pt-2.5">
                              {(item.itemType || item.sourceType) === "audiobook" && item.metadata?.url_zip_file ? (
                                <a
                                  href={item.metadata.url_zip_file}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-400 hover:text-white bg-slate-900 px-2 py-1 rounded border border-slate-800 transition"
                                >
                                  📥 Audio streamen
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">ID: #{item.id}</span>
                              )}

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedReadingItem(item);
                                  }}
                                  className="bg-indigo-950/60 hover:bg-slate-800 text-indigo-300 hover:text-white text-[10px] font-bold px-2 py-1 rounded transition border border-indigo-900/60"
                                >
                                  👁️ Lesen
                                </button>
                                <button
                                  onClick={() => handleDeleteLibraryItem(item.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition"
                                  title="Artikel archivieren"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RECHTE SPALTE: OFFLINE-QUIZ-ZENTRUM */}
                <div className="space-y-6">
                  
                  {/* PLAYABLE QUIZ PANEL */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4 animate-fadeIn">
                    <span className="text-xs font-bold tracking-wider text-rose-450 flex items-center gap-1.5 uppercase">
                      <HelpCircle className="w-4 h-4 text-rose-500" />
                      Interaktives Lernquiz (Offline)
                    </span>

                    {quizState === "idle" ? (
                      <div className="space-y-4 text-center py-6">
                        <HelpCircle className="w-12 h-12 text-slate-700 animate-pulse mx-auto" />
                        <div>
                          <h3 className="font-bold text-slate-100 text-sm">Prüfe dein Wissen offline</h3>
                          <p className="text-xs text-slate-400 leading-relaxed px-2 mt-1">
                            Das Quiz zieht 10 zufällige Fragen aus deiner lokal gespeicherten Datenbank. Du kannst jederzeit völlig offline spielen, um dein Wissen zu trainieren!
                          </p>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-left text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Verfügbare Offline-Fragen:</span>
                            <span className="font-bold text-white font-mono">{savedQuizzesList.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Gespielte Runden gesamt:</span>
                            <span className="font-bold text-white font-mono">{quizScoresList.length}</span>
                          </div>
                        </div>

                        <button
                          onClick={startOfflineQuiz}
                          disabled={savedQuizzesList.length === 0}
                          className="w-full bg-gradient-to-r from-indigo-650 to-indigo-750 hover:from-indigo-505 hover:to-indigo-655 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition transform active:scale-95 text-xs disabled:from-slate-850 disabled:to-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed"
                        >
                          {savedQuizzesList.length === 0 ? "Erst Fragen importieren (Live-Kuration)" : "Offline Quiz starten (10 Fragen)"}
                        </button>
                      </div>
                    ) : quizState === "playing" ? (
                      <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <span className="font-mono text-[10px] text-slate-450">
                            Frage {currentQuestionIdx + 1} von {currentQuizQuestions.length}
                          </span>
                          <span className="font-bold font-mono text-emerald-400">Punkte: {quizScore}</span>
                        </div>

                        <div>
                          <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider mb-2 inline-block">
                            {currentQuizQuestions[currentQuestionIdx]?.category || "Generell"}
                          </span>
                          <p
                            className="font-bold text-slate-150 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: currentQuizQuestions[currentQuestionIdx]?.question || "" }}
                          />
                        </div>

                        {/* MUTLIPLE CHOICE BUTTONS */}
                        <div className="space-y-2 pt-2">
                          {shuffledAnswers.map((ans, idx) => {
                            const isCorrect = ans === currentQuizQuestions[currentQuestionIdx]?.correctAnswer;
                            const isSelected = ans === selectedAnswer;

                            let buttonStyle = "bg-slate-950 hover:bg-slate-900/60 border-slate-850 text-slate-200";
                            if (answered) {
                              if (isCorrect) {
                                buttonStyle = "bg-green-950 border-green-700 text-green-300 font-bold";
                              } else if (isSelected) {
                                buttonStyle = "bg-rose-955 border-rose-800 text-rose-300";
                              } else {
                                buttonStyle = "bg-slate-950 opacity-40 border-slate-900 text-slate-400";
                              }
                            }

                            return (
                              <button
                                key={idx}
                                disabled={answered}
                                onClick={() => handleAnswerSubmit(ans)}
                                className={`w-full text-left p-3 rounded-xl border text-xs transition-all duration-300 ${buttonStyle}`}
                                dangerouslySetInnerHTML={{ __html: ans }}
                              />
                            );
                          })}
                        </div>

                        {answered && (
                          <div className="pt-3 border-t border-slate-850/60">
                            <button
                              onClick={handleNextQuestion}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition text-xs select-none"
                            >
                              {currentQuestionIdx + 1 === currentQuizQuestions.length ? "Ergebnisse ausrechnen" : "Nächste Frage ➔"}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* FINISHED STATE */
                      <div className="space-y-4 text-center py-6 animate-fadeIn">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                        <div>
                          <h3 className="font-bold text-slate-105 text-sm">Quiz beendet!</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Du hast hervorragende <span className="font-bold text-white text-sm font-mono bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900 ml-1 mr-1">{quizScore} von {currentQuizQuestions.length}</span> Fragen richtig beantwortet!
                          </p>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-left text-xs text-slate-400 space-y-1">
                          <p className="text-center font-bold text-[11px] text-indigo-300 mb-1">Dauerhaftigkeit:</p>
                          <p className="text-center">Dein Ergebns wurde automatisch als neuer Eintrag in Ihrer Cloud SQL Highscore-Tabelle abgesichert.</p>
                        </div>

                        <button
                          onClick={() => setQuizState("idle")}
                          className="w-full bg-slate-950 hover:bg-slate-910 text-slate-300 font-bold border border-slate-800 py-2.5 rounded-xl transition text-xs"
                        >
                          Fenster schließen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SCOREBOARD TAB */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3 animate-fadeIn">
                    <span className="text-xs font-bold tracking-wider text-teal-400 flex items-center gap-1.5 uppercase">
                      <History className="w-4 h-4 text-teal-400" />
                      PostgreSQL Highscore-Liste
                    </span>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {loadingScores ? (
                        <div className="text-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-teal-500 mx-auto" />
                        </div>
                      ) : quizScoresList.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-6 text-[11px]">Keinerlei Score-Einträge gefunden.</p>
                      ) : (
                        quizScoresList.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-205 truncate text-[11px]">{entry.category}</p>
                              <span className="text-[10px] text-slate-450">
                                {new Date(entry.playedAt).toLocaleDateString("de-DE")}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-teal-400 bg-teal-950/40 border border-teal-900 px-2 py-0.5 rounded text-[11px] shrink-0">
                              {entry.score} / {entry.totalQuestions}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* VIEW TAB 2: EDUCATION APIS LIVE IMPORT WORKSPACE */}
          {activeTab === "apis" && (
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Live Bildungs-Kuration &amp; API-Importeur
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Suchen Sie Inhalte aus Wikipedia, Wikimedia Commons, Open Library, LibriVox oder Trivia und klicken Sie auf Importieren. Das System lädt die Metadaten herunter und sichert sie permanent in Ihrer lokalen PostgreSQL-Tabelle für den 100% Offline-Betrieb.
                  </p>
                </div>

                {/* API SELECTOR TABS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-850">
                  <button
                    onClick={() => {
                      setApiType("wikipedia");
                      setSearchTerms("");
                      setApiResults(null);
                      setApiError("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      apiType === "wikipedia" ? "bg-indigo-650 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    📝 Wikipedia Artikel
                  </button>
                  <button
                    onClick={() => {
                      setApiType("wikimedia");
                      setSearchTerms("");
                      setApiResults(null);
                      setApiError("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      apiType === "wikimedia" ? "bg-indigo-650 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🖼️ Wikimedia Medien
                  </button>
                  <button
                    onClick={() => {
                      setApiType("openlibrary");
                      setSearchTerms("");
                      setApiResults(null);
                      setApiError("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      apiType === "openlibrary" ? "bg-indigo-650 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    📚 Open Library Bücher
                  </button>
                  <button
                    onClick={() => {
                      setApiType("librivox");
                      setSearchTerms("");
                      setApiResults(null);
                      setApiError("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      apiType === "librivox" ? "bg-indigo-650 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🎙️ LibriVox Hörspiele
                  </button>
                  <button
                    onClick={() => {
                      setApiType("opentrivia");
                      setSearchTerms("");
                      setApiResults(null);
                      setApiError("");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      apiType === "opentrivia" ? "bg-indigo-650 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    ❓ Trivia Quiz-Fragen
                  </button>
                </div>

                {/* API RUN SEARCH FORM */}
                <form onSubmit={handleCallApi} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required={apiType !== "opentrivia"}
                    placeholder={
                      apiType === "wikipedia"
                        ? "Wissensartikel suchen (z.B. Delfine, Eisenbahn, Sonnensystem)..."
                        : apiType === "wikimedia"
                        ? "Freie Medien suchen (z.B. Dinosaurier, Space, Wald)..."
                        : apiType === "openlibrary"
                        ? "Buch oder Autor suchen (z.B. Huckleberry Finn, Shakespeare)..."
                        : apiType === "librivox"
                        ? "Hörbuch-Titel suchen (z.B. Alice in Wonderland, Peter Pan)..."
                        : "Optional: Wikipedia-Kategorie ID (z.B. 9 für General, 17 für Science, leer für alle)..."
                    }
                    value={searchTerms}
                    onChange={(e) => setSearchTerms(e.target.value)}
                    className="flex-1 bg-slate-950 text-xs px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={loadingApi}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-6 py-2.5 rounded-xl transition font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    {loadingApi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Abfrage...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Schnittstelle abfragen
                      </>
                    )}
                  </button>
                </form>

                {/* API QUERY RESULTS SCREEN */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 min-h-[180px] flex flex-col justify-center">
                  {loadingApi ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Rufe sichere Server-Schnittstelle auf und schreibe Cloud SQL SQL_Logs...</p>
                    </div>
                  ) : apiError ? (
                    <div className="bg-rose-950/20 border border-rose-900 border-dashed p-4 rounded-xl text-xs text-rose-350">
                      <strong>Schnittstellen-Fehler:</strong> {apiError}
                    </div>
                  ) : !apiResults ? (
                    <div className="text-center py-8 text-slate-500 italic text-xs">
                      Suchen Sie oben nach Bildungsinhalten, um Wikipedia, Open Library, LibriVox, Wikimedia oder Trivia live abzurufen.
                    </div>
                  ) : (
                    /* RENDER CORRESPONDING RESULTS */
                    <div className="space-y-4">
                      
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2 text-xs">
                        <span className="font-bold text-indigo-300">
                          {apiType === "wikipedia" ? "Suchergebnisse von Wikipedia DE" : apiType === "wikimedia" ? "Illustrationen von Wikimedia Commons" : apiType === "openlibrary" ? "Klassische Werke von Open Library" : apiType === "librivox" ? "Gemeinfreie Hörbücher von LibriVox" : "Fragen aus der Open Trivia DB (Mehrfachauswahl)"}
                        </span>
                        <span className="text-[10px] text-green-400 bg-green-950/40 border border-green-800 px-2 py-0.5 rounded font-mono">
                          HTTP Status: 200 • SQL Logged
                        </span>
                      </div>

                      {/* 1. WIKIPEDIA */}
                      {apiType === "wikipedia" && (
                        <div className="space-y-3">
                          {apiResults.length > 0 ? (
                            apiResults.map((item: any, i: number) => (
                              <div key={i} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-slate-100 text-sm">{item.title}</h3>
                                  <p className="text-xs text-slate-400 leading-relaxed pr-2 max-w-2xl">{item.snippet}</p>
                                </div>
                                <button
                                  onClick={() => handleImportLibraryItem({
                                    title: item.title,
                                    description: item.snippet,
                                    sourceType: "article",
                                    metadata: { pageid: item.pageid, engine: "wikipedia" }
                                  })}
                                  className="self-start sm:self-center bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  💾 Importieren
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 italic text-xs">Keine Wikipedia-Einträge gefunden.</p>
                          )}
                        </div>
                      )}

                      {/* 2. WIKIMEDIA COMMONS */}
                      {apiType === "wikimedia" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {apiResults.length > 0 ? (
                            apiResults.map((item: any, i: number) => (
                              <div key={i} className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex flex-col justify-between space-y-3">
                                <div className="flex gap-3">
                                  {item.url && (
                                    <img
                                      src={item.url}
                                      alt={item.title}
                                      className="w-20 h-20 object-cover rounded-xl border border-slate-800 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-200 text-xs truncate" title={item.title}>
                                      {item.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                      {item.description}
                                    </p>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      Urheber: {item.artist}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                                  <span className="text-[10px] text-indigo-400 font-mono">{item.license}</span>
                                  <button
                                    onClick={() => handleImportLibraryItem({
                                      title: item.title,
                                      description: item.description,
                                      author: item.artist,
                                      coverUrl: item.url,
                                      sourceType: "article",
                                      metadata: { license: item.license, engine: "wikimedia" }
                                    })}
                                    className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    💾 Mediathek sichern
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 italic text-xs">Keine Bilder auf Wikimedia Commons gefunden.</p>
                          )}
                        </div>
                      )}

                      {/* 3. OPEN LIBRARY */}
                      {apiType === "openlibrary" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {apiResults.length > 0 ? (
                            apiResults.map((item: any, i: number) => (
                              <div key={i} className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex flex-col justify-between space-y-3">
                                <div className="flex gap-3">
                                  <div className="w-16 h-24 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-850 overflow-hidden shrink-0">
                                    {item.coverUrl ? (
                                      <img
                                        src={item.coverUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <BookOpen className="w-6 h-6 text-slate-700" />
                                    )}
                                  </div>
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-100 text-xs truncate">{item.title}</h4>
                                    <p className="text-[11px] text-slate-300">Autor: <span className="font-semibold">{item.author}</span></p>
                                    {item.firstPublishYear && (
                                      <p className="text-[10px] text-slate-400">Erstveröffentlichung: {item.firstPublishYear}</p>
                                    )}
                                    {item.publisher && (
                                      <p className="text-[10px] text-slate-500 font-mono truncate">Verlag: {item.publisher}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-end border-t border-slate-800/60 pt-2.5">
                                  <button
                                    onClick={() => handleImportLibraryItem({
                                      title: item.title,
                                      description: `Ein literarisches Werk von ${item.author}. Erstmals erschienen im Jahr ${item.firstPublishYear}. Verlag: ${item.publisher}.`,
                                      author: item.author,
                                      coverUrl: item.coverUrl,
                                      sourceType: "book",
                                      metadata: { key: item.key, publisher: item.publisher, engine: "openlibrary" }
                                    })}
                                    className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    💾 Buch registrieren
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 italic text-xs">Keine Bücher auf Open Library unter diesem Begriff gefunden.</p>
                          )}
                        </div>
                      )}

                      {/* 4. LIBRIVOX */}
                      {apiType === "librivox" && (
                        <div className="space-y-3">
                          {apiResults.length > 0 ? (
                            apiResults.map((item: any, i: number) => (
                              <div key={i} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5 flex-1 max-w-3xl">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-100 text-sm">{item.title}</h4>
                                    <span className="text-[9px] bg-indigo-950/40 border border-indigo-900 text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                                      Hörbuch
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                                    {item.description}
                                  </p>
                                  <p className="text-[10px] text-slate-400 italic">Sprecher/Autoren: {item.authors}</p>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0 self-start md:self-center">
                                  {item.url_zip_file && (
                                    <a
                                      href={item.url_zip_file}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-nowrap text-center text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-mono py-1 px-2.5 rounded-lg transition"
                                    >
                                      📥 ZIP Audio herunterladen
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleImportLibraryItem({
                                      title: item.title,
                                      description: item.description,
                                      author: item.authors,
                                      sourceType: "audiobook",
                                      metadata: { url_zip_file: item.url_zip_file, engine: "librivox" }
                                    })}
                                    className="bg-indigo-650 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center justify-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    💾 Offline importieren
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 italic text-xs">Keine gemeinfreien Hörbücher auf LibriVox gefunden.</p>
                          )}
                        </div>
                      )}

                      {/* 5. OPEN TRIVIA DATABASE */}
                      {apiType === "opentrivia" && (
                        <div className="space-y-3 text-xs">
                          {apiResults.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between bg-indigo-950/20 border border-indigo-900/60 p-3 rounded-xl">
                                <p className="text-[11px] text-slate-300">
                                  Es wurden <span className="font-bold text-indigo-400">{apiResults.length} Quizfragen</span> live bezogen. Klicken Sie auf den Massen-Importeur, um alle diese Fragen sofort lokal offline verfügbar zu machen!
                                </p>
                                <button
                                  onClick={() => handleImportQuizQuestions(apiResults)}
                                  className="bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  💾 Alle Fragen importieren
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {apiResults.map((item: any, i: number) => (
                                  <div key={i} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col justify-between space-y-2">
                                    <div>
                                      <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[9px] bg-slate-950 font-semibold px-2 py-0.5 rounded text-indigo-400">
                                          {item.category}
                                        </span>
                                        <span className={`text-[9px] font-bold font-mono px-1.5 rounded ${
                                          item.difficulty === "easy" ? "text-emerald-400 bg-emerald-950/40" : item.difficulty === "medium" ? "text-amber-400 bg-amber-950/40" : "text-rose-400 bg-rose-950/40"
                                        }`}>
                                          {item.difficulty?.toUpperCase()}
                                        </span>
                                      </div>
                                      <p className="font-medium text-slate-200 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: item.question }} />
                                    </div>

                                    <div className="space-y-1 border-t border-slate-850/60 pt-2 text-[10px]">
                                      <p className="text-emerald-400"><span className="text-slate-500 font-bold">Richtig:</span> <span dangerouslySetInnerHTML={{ __html: item.correct_answer }} /></p>
                                      <p className="text-slate-400"><span className="text-slate-500 font-bold">Falsch:</span> {item.incorrect_answers?.join(", ")}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">Keine Fragen in dieser Kategorie geliefert. Bitte nochmals anfragen.</p>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* VIEW TAB 3: CLOUD SQL AUDIT LOGS DISPLAY */}
          {activeTab === "audit" && (
            <div className="lg:col-span-4 space-y-6 animate-fadeIn">
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-teal-400" />
                      PostgreSQL Cloud SQL Audit-Protokolle (api_logs)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Live-Auslesung des SQL-Schemas für Dokumentenkontrollen und API-Auditing.
                    </p>
                  </div>

                  <button
                    onClick={loadCloudSqlLogs}
                    disabled={loadingLogs}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                    Tabelle neu laden
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
                    <span>Lese Tabellenreihen aus Cloud SQL aus...</span>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-8 bg-slate-950 border border-slate-850 rounded-2xl text-center text-slate-500 italic text-xs">
                    Keine Auditeinträge in der Tabelle "api_logs" vorhanden. Tätigen Sie eine Suche im Clinical-API-Workspace.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950 border border-slate-850">
                        <tr>
                          <th className="px-4 py-3">Log-ID</th>
                          <th className="px-4 py-3">Schnittstellen-Name</th>
                          <th className="px-4 py-3">Endpunkt / Parameter</th>
                          <th className="px-4 py-3">HTTP Status</th>
                          <th className="px-4 py-3">Protokoll-Zeitpunkt (UTC)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-950/60 transition">
                            <td className="px-4 py-3 font-mono text-indigo-400">#{log.id}</td>
                            <td className="px-4 py-3 font-semibold text-white">{log.apiName}</td>
                            <td className="px-4 py-3 font-mono text-slate-450 truncate max-w-[250px]" title={log.endpoint}>
                              {log.endpoint}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-1.5 py-0.5 rounded bg-green-950 text-green-400 font-mono font-bold text-[10px]">
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {new Date(log.createdAt).toLocaleString("de-DE")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW TAB 5: PARENT CONFIG DASHBOARD */}
          {activeTab === "config" && (
            <div className="lg:col-span-4 space-y-6">
              
              {/* CONFIG SECTION 1: PERMISSIONS & SEGREGATION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Medienberechtigungen &amp; Filter
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sperren oder erlauben Sie spezifische Medientypen im Kindermodus. Erlaubte Medien sind sofort für alle Profile spielbar.
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                        🎥 Videos erlauben
                      </span>
                      <input 
                        type="checkbox" 
                        checked={allowVideos} 
                        onChange={(e) => setAllowVideos(e.target.checked)} 
                        className="w-4 h-4 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-0 checked:bg-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                        🎙️ Audio &amp; Hörspiele
                      </span>
                      <input 
                        type="checkbox" 
                        checked={allowAudio} 
                        onChange={(e) => setAllowAudio(e.target.checked)} 
                        className="w-4 h-4 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-0 checked:bg-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                        📖 Buchtitel &amp; PDFs
                      </span>
                      <input 
                        type="checkbox" 
                        checked={allowPdf} 
                        onChange={(e) => setAllowPdf(e.target.checked)} 
                        className="w-4 h-4 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-0 checked:bg-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                        🎮 Quizze &amp; Fragen
                      </span>
                      <input 
                        type="checkbox" 
                        checked={allowQuiz} 
                        onChange={(e) => setAllowQuiz(e.target.checked)} 
                        className="w-4 h-4 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-0 checked:bg-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    Eltern-PIN Sicherheit
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definieren Sie das numerische Passwort, um den Sandboxbereich des Kindes sicher zu verlassen.
                  </p>
                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Kindersicherung PIN-Code:</label>
                    <input 
                      type="text" 
                      maxLength={6} 
                      value={parentPin} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setParentPin(val || "1234");
                      }} 
                      placeholder="PIN eingeben (z.B. 1234)" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-center text-white tracking-widest focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-slate-500 italic">Standard PIN ist "1234". Nur Zahlen verwenden.</p>
                  </div>

                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-400 block mb-1">Sandbox-Sicherheitsregel:</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Der Kindersicherungsraum sperrt den Zugriff auf den Browser, die Konsole, alle Import-APIs sowie die Gemini-Promptkonfiguration.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-violet-400" />
                    Kinderprofil hinzufügen
                  </h3>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Name des Kindes:</label>
                      <input 
                        type="text" 
                        id="new-child-name" 
                        placeholder="z.B. Emma" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const nameEl = document.getElementById("new-child-name") as HTMLInputElement;
                            const ageEl = document.getElementById("new-child-age") as HTMLInputElement;
                            if (nameEl && nameEl.value.trim()) {
                              const newProf = {
                                id: nameEl.value.trim().toLowerCase(),
                                name: nameEl.value.trim(),
                                age: parseInt(ageEl?.value || "6"),
                                interests: ["Bildung 🦉"],
                                xp: 0,
                                level: 1,
                                badges: ["Medien-Entdecker 🎈"],
                                completedSteps: [],
                                videosWatched: 0,
                                quizzesSolved: 0,
                                pathsFinished: 0
                              };
                              setChildProfiles(prev => [...prev, newProf]);
                              addUiLog(`Profil für ${newProf.name} angelegt.`, "success");
                              nameEl.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Alter (für Inhaltsaussteuerung):</label>
                      <input 
                        type="number" 
                        id="new-child-age" 
                        defaultValue={6} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const nameEl = document.getElementById("new-child-name") as HTMLInputElement;
                        const ageEl = document.getElementById("new-child-age") as HTMLInputElement;
                        if (nameEl && nameEl.value.trim()) {
                          const newProf = {
                            id: nameEl.value.trim().toLowerCase(),
                            name: nameEl.value.trim(),
                            age: parseInt(ageEl?.value || "6"),
                            interests: ["Entdeckung 🌍"],
                            xp: 100,
                            level: 1,
                            badges: ["Medien-Entdecker 🎈"],
                            completedSteps: [],
                            videosWatched: 0,
                            quizzesSolved: 0,
                            pathsFinished: 0
                          };
                          setChildProfiles(prev => [...prev, newProf]);
                          addUiLog(`Profil für ${newProf.name} angelegt.`, "success");
                          nameEl.value = "";
                        } else {
                          alert("Bitte Name eingeben!");
                        }
                      }}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer block text-center"
                    >
                      Profil erstellen
                    </button>
                  </div>
                </div>

              </div>

              {/* CONFIG SECTION 2: TAGESPLAN-KONFIGURATOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TAGESPLAN CREATOR */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-400" />
                      Tagesplan-Saisoplaner 📑
                    </h3>
                    <span className="text-[9px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-400 font-mono">
                      {tagesplanList.length} Einheiten
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Definieren Sie zeitgesteuerte Tagesaktivitäten. Die Kinder sehen diese Zeitschienen als bunte Stationen in ihrem Sandbox-Interface und können sie abhaken.
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
                    <div className="col-span-3 text-[10px] font-bold text-teal-500 uppercase">Aktivität hinzufügen:</div>
                    <div className="col-span-1">
                      <label className="text-[8px] uppercase text-slate-500 mb-0.5 block">Intervall:</label>
                      <input id="tp-add-time" type="text" placeholder="15:00 - 16:00" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[8px] uppercase text-slate-500 mb-0.5 block">Titel des Intervalls:</label>
                      <input id="tp-add-title" type="text" placeholder="Hausaufgabenzeit" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none" />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[8px] uppercase text-slate-500 mb-0.5 block">Emoji:</label>
                      <input id="tp-add-emoji" type="text" defaultValue="✏️" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-center text-white focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[8px] uppercase text-slate-500 mb-0.5 block">Beschreibung:</label>
                      <input id="tp-add-desc" type="text" placeholder="Spannende Themen lernen" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none" />
                    </div>
                    <div className="col-span-3 pt-2">
                      <button
                        onClick={() => {
                          const timeEl = document.getElementById("tp-add-time") as HTMLInputElement;
                          const titleEl = document.getElementById("tp-add-title") as HTMLInputElement;
                          const emojiEl = document.getElementById("tp-add-emoji") as HTMLInputElement;
                          const descEl = document.getElementById("tp-add-desc") as HTMLInputElement;
                          if (timeEl?.value && titleEl?.value) {
                            const newItem = {
                              id: `tp-${Date.now()}`,
                              timeRange: timeEl.value,
                              title: titleEl.value,
                              emoji: emojiEl?.value || "✏️",
                              desc: descEl?.value || "",
                              completed: false
                            };
                            setTagesplanList(prev => [...prev, newItem]);
                            addUiLog(`Tagesplan station '${newItem.title}' hinzugefügt.`, "success");
                            timeEl.value = "";
                            titleEl.value = "";
                            descEl.value = "";
                          } else {
                            alert("Bitte Intervall und Titel ausfüllen!");
                          }
                        }}
                        className="w-full bg-teal-650 hover:bg-teal-600 text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer block text-center"
                      >
                        Aktivität sichern
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {tagesplanList.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl bg-slate-900 p-1.5 rounded-lg">{item.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white leading-none">{item.title}</span>
                              <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 px-1 py-0.5 text-teal-400 rounded leading-none">{item.timeRange}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTagesplanList(prev => prev.filter(p => p.id !== item.id));
                            addUiLog(`Aktivität gelöscht: ${item.title}`, "info");
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

                {/* TASKS CREATOR */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-violet-400" />
                      Missions- &amp; Aufgaben-System 🏆
                    </h3>
                    <span className="text-[9px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-slate-400 font-mono">
                      {tasksList.length} Aufgaben
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Definieren Sie Hauspflichten und Lernaufträge. Kinder erhalten nach dem Abhaken sofort echte XP-Punkte (Erfahrungspunkte), die Profile leveln lässt!
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
                    <div className="col-span-3 text-[10px] font-bold text-violet-400 uppercase">Aufgabe hinzufügen:</div>
                    <div className="col-span-2">
                      <label className="text-[8px] uppercase text-slate-500 mb-0.5 block">Inhalt der Aufgabe:</label>
                      <input id="tsk-add-title" type="text" placeholder="Zimmer aufräumen" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none" />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[8px] uppercase text-slate-500 mb-0.5 block">XP-Belohnung:</label>
                      <input id="tsk-add-xp" type="number" defaultValue={150} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-center text-white focus:outline-none" />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[8px] uppercase text-slate-500 mb-0.5 block">Emoji:</label>
                      <input id="tsk-add-emoji" type="text" defaultValue="🧹" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-center text-white focus:outline-none" />
                    </div>
                    <div className="col-span-2 pt-3 flex items-end">
                      <button
                        onClick={() => {
                          const titleEl = document.getElementById("tsk-add-title") as HTMLInputElement;
                          const xpEl = document.getElementById("tsk-add-xp") as HTMLInputElement;
                          const emojiEl = document.getElementById("tsk-add-emoji") as HTMLInputElement;
                          if (titleEl?.value) {
                            const newItem = {
                              id: `tsk-${Date.now()}`,
                              title: titleEl.value,
                              emoji: emojiEl?.value || "🧹",
                              xpReward: parseInt(xpEl?.value || "150"),
                              completedBy: []
                            };
                            setTasksList(prev => [...prev, newItem]);
                            addUiLog(`Aufgabe '${newItem.title}' hinzugefügt (+${newItem.xpReward} XP).`, "success");
                            titleEl.value = "";
                          } else {
                            alert("Bitte Inhalt der Aufgabe ausfüllen!");
                          }
                        }}
                        className="w-full bg-violet-650 hover:bg-violet-600 text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer block text-center"
                      >
                        Aufgabe erstellen
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {tasksList.map((tsk) => (
                      <div key={tsk.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl bg-slate-900 p-1.5 rounded-lg">{tsk.emoji}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">{tsk.title}</span>
                            <div className="flex gap-1 items-center mt-1">
                              <span className="text-[9px] font-mono bg-violet-950 border border-violet-800 text-violet-300 px-1 py-0.5 rounded leading-none">+{tsk.xpReward} XP</span>
                              {tsk.completedBy?.length > 0 && (
                                <span className="text-[8px] text-slate-500 font-mono">Erledigt von: {tsk.completedBy.join(", ")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTasksList(prev => prev.filter(p => p.id !== tsk.id));
                            addUiLog(`Aufgabe gelöscht: ${tsk.title}`, "info");
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TELEMETRY FEED AT BASE OF PAGE */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3 shadow shadow-indigo-950/10">
            <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase block">
              🔧 System Telemetrie (Datenbank &amp; Auth-Protokoll)
            </span>
            <div className="bg-slate-950/80 border border-slate-850 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1">
              {uiLogs.length === 0 ? (
                <p className="text-slate-600 italic">Keine Telemetriegeräusche registriert...</p>
              ) : (
                uiLogs.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-slate-500 font-medium">{log.time}</span>
                    <span className={
                      log.type === "success" ? "text-emerald-400" : log.type === "warn" ? "text-rose-450 font-semibold" : "text-slate-350"
                    }>
                      {log.type === "success" ? "[OK]" : log.type === "warn" ? "[WARNUNG]" : "[INFO]"} {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          </>
          )}

        </main>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950/80 border-t border-slate-900 py-6 text-center text-[10px] text-slate-500 px-4">
        <p>© 2026 EduSpace Mediathek Framework. Geschlossene Lernumgebung für Kinder.</p>
        <p className="mt-1">Persistiert in Google Cloud SQL (PostgreSQL Instance in Region europe-west3). Datensicher nach DSGVO- u. Kinderschutz-Richtlinien.</p>
      </footer>

      {/* PERSISTENT FULL-PAGE ARTICLE & BOOK READER MODAL */}
      <AnimatePresence>
        {selectedReadingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
            onClick={() => setSelectedReadingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl h-[85vh] flex flex-col rounded-3xl border shadow-2xl transition-colors duration-300 overflow-hidden ${
                readerTheme === "sepia"
                  ? "bg-[#fbf9f4] border-[#ebd4b8] text-[#2c2013]"
                  : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              {/* READER HEADER */}
              <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
                readerTheme === "sepia" ? "border-[#ebd4b8]/60 bg-[#f5efe4]" : "border-slate-800 bg-slate-950/40"
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                      readerTheme === "sepia" ? "bg-[#ebd4b8] text-[#5c3e1e]" : "bg-indigo-950 text-indigo-300"
                    }`}>
                      {(selectedReadingItem.itemType || selectedReadingItem.sourceType || "article").toUpperCase()}
                    </span>
                    {selectedReadingItem.author && (
                      <span className="text-[10px] opacity-75 truncate">
                        • Urheber: {selectedReadingItem.author}
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-sm md:text-base truncate mt-0.5" title={selectedReadingItem.title}>
                    {selectedReadingItem.title}
                  </h2>
                </div>

                {/* CONTROLS AREA */}
                <div className="flex items-center gap-3">
                  {/* FONT SIZES */}
                  <div className={`flex items-center rounded-lg p-0.5 border ${
                    readerTheme === "sepia" ? "bg-[#fbf9f4] border-[#ebd4b8]" : "bg-slate-900 border-slate-800"
                  }`}>
                    {(["xs", "sm", "base", "lg"] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setReaderFontSize(`text-${sz}` as any)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase transition ${
                          readerFontSize === `text-${sz}`
                            ? readerTheme === "sepia"
                              ? "bg-[#ebd4b8] text-[#2c2013]"
                              : "bg-indigo-600 text-white"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title={`Schriftgröße: ${sz}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  {/* THEME SWITCHERS */}
                  <div className={`flex items-center rounded-lg p-0.5 border ${
                    readerTheme === "sepia" ? "bg-[#fbf9f4] border-[#ebd4b8]" : "bg-slate-900 border-slate-800"
                  }`}>
                    <button
                      onClick={() => setReaderTheme("sepia")}
                      className={`p-1 rounded transition ${
                        readerTheme === "sepia"
                          ? "bg-[#ebd4b8]/70 text-[#2c2013]"
                          : "opacity-60 hover:opacity-100 text-slate-400"
                      }`}
                      title="Sonniges Sepia (Auge-schonend)"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setReaderTheme("dark")}
                      className={`p-1 rounded transition ${
                        readerTheme === "dark"
                          ? "bg-slate-800 text-white"
                          : "opacity-60 hover:opacity-100 text-[#5c3e1e]"
                      }`}
                      title="Nachtmodus"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* CLOSE */}
                  <button
                    onClick={() => setSelectedReadingItem(null)}
                    className={`p-1.5 rounded-lg border transition ${
                      readerTheme === "sepia"
                        ? "border-[#ebd4b8] hover:bg-[#ebd4b8]/30"
                        : "border-slate-800 hover:bg-slate-800"
                    }`}
                    title="Schließen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {selectedReadingItem.coverUrl && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={selectedReadingItem.coverUrl}
                      alt={selectedReadingItem.title}
                      className="max-h-48 rounded-xl border object-contain shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* DYNAMIC ARTICLE RENDERER */}
                {selectedReadingItem.localContent && selectedReadingItem.localContent.includes("<") ? (
                  <div
                    className={`max-w-none leading-relaxed break-words space-y-4 ${readerFontSize} ${
                      readerTheme === "sepia"
                        ? "[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[#5c3e1e] [&_h2]:border-b [&_h2]:border-[#ebd4b8]/40 [&_h2]:pb-1 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:text-[#5c3e1e]/90 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed"
                        : "[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:border-b [&_h2]:border-slate-800 [&_h2]:pb-1 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:text-slate-200 [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-slate-300 [&_li]:leading-relaxed"
                    }`}
                    dangerouslySetInnerHTML={{ __html: selectedReadingItem.localContent }}
                  />
                ) : (
                  <div className={`whitespace-pre-line leading-relaxed max-w-none ${readerFontSize} ${
                    readerTheme === "sepia" ? "text-[#3d2f20]" : "text-slate-200"
                  }`}>
                    {selectedReadingItem.localContent || selectedReadingItem.description}
                  </div>
                )}

                {selectedReadingItem.sourceUrl && (
                  <div className={`mt-8 pt-4 border-t text-[10px] flex items-center justify-between ${
                    readerTheme === "sepia" ? "border-[#ebd4b8]/40 text-[#4a3e30]" : "border-slate-800/60 text-slate-500"
                  }`}>
                    <span>Quelle: {selectedReadingItem.apiSource ? selectedReadingItem.apiSource : "Wikipedia"} Archiv</span>
                    <a
                      href={selectedReadingItem.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium hover:text-indigo-400 flex items-center gap-1"
                    >
                      Original im Browser öffnen <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
