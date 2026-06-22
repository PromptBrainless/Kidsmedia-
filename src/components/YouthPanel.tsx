import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Star,
  Play,
  Download,
  CheckCircle,
  Eye,
  Award,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Plus,
  Sliders,
  Check,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface YouthPanelProps {
  libraryItemsList: any[];
  activeChildId: string;
  setActiveChildId: (id: string) => void;
  childProfiles: any[];
  setChildProfiles: React.Dispatch<React.SetStateAction<any[]>>;
  favouriteItems: number[];
  setFavouriteItems: React.Dispatch<React.SetStateAction<number[]>>;
  downloadingItems: number[];
  setDownloadingItems: React.Dispatch<React.SetStateAction<number[]>>;
  downloadedItems: number[];
  setDownloadedItems: React.Dispatch<React.SetStateAction<number[]>>;
  activeVideoItem: any;
  setActiveVideoItem: (item: any) => void;
  activeGalleryItem: any;
  setActiveGalleryItem: (item: any) => void;
  activeImageIdx: number;
  setActiveImageIdx: (idx: number) => void;
  setSelectedReadingItem: (item: any) => void;
  tagesplanList: any[];
  setTagesplanList: React.Dispatch<React.SetStateAction<any[]>>;
  tasksList: any[];
  setTasksList: React.Dispatch<React.SetStateAction<any[]>>;
  fontScale: number;
  contrastHigh: boolean;
  addUiLog: (msg: string, type: "info" | "success" | "warn") => void;
}

export const YouthPanel: React.FC<YouthPanelProps> = ({
  libraryItemsList,
  activeChildId,
  setActiveChildId,
  childProfiles,
  setChildProfiles,
  favouriteItems,
  setFavouriteItems,
  downloadingItems,
  setDownloadingItems,
  downloadedItems,
  setDownloadedItems,
  activeVideoItem,
  setActiveVideoItem,
  activeGalleryItem,
  setActiveGalleryItem,
  activeImageIdx,
  setActiveImageIdx,
  setSelectedReadingItem,
  tagesplanList,
  setTagesplanList,
  tasksList,
  setTasksList,
  fontScale,
  contrastHigh,
  addUiLog,
}) => {
  const [subTab, setSubTab] = useState<"start" | "media" | "videos" | "images" | "docs" | "favs" | "search" | "profile">("start");
  const [searchTxt, setSearchTxt] = useState("");
  const [themeFilter, setThemeFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState<number>(-1);

  // Active child properties
  const activeChild = childProfiles.find((c) => c.id === activeChildId) || childProfiles[0];
  const maxAllowedAge = activeChild.age || 9;

  // Filter approved items
  const approvedItems = libraryItemsList.filter(
    (item) => item.publishStatus === "approved" || !item.publishStatus
  );

  // Filter items matching current child age
  const ageAppropriateItems = approvedItems.filter(
    (item) => !item.ageRating || item.ageRating <= maxAllowedAge
  );

  // Toggle Favorite
  const toggleFav = (id: number) => {
    setFavouriteItems((prev) => {
      if (prev.includes(id)) {
        addUiLog(`Aus Favoriten entfernt.`, "info");
        return prev.filter((item) => item !== id);
      } else {
        addUiLog(`Zu Favoriten hinzugefügt ⭐`, "success");
        return [...prev, id];
      }
    });
  };

  // Start File Download Simulation
  const handleDownload = (id: number, title: string) => {
    if (downloadedItems.includes(id) || downloadingItems.includes(id)) return;

    setDownloadingItems((prev) => [...prev, id]);
    addUiLog(`Starte sicheren Offline-Download: "${title}"...`, "info");

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setDownloadingItems((prev) => prev.filter((i) => i !== id));
        setDownloadedItems((prev) => [...prev, id]);
        addUiLog(`Download abgeschlossen: "${title}" ist offline einsatzbereit.`, "success");
      }
    }, 400);
  };

  // Switch Profiles & award logs
  const handleSwitchProfile = (id: string, name: string) => {
    setActiveChildId(id);
    addUiLog(`Kid-Profil gewechselt auf: ${name} (Fokus-Filter angepasst)`, "success");
  };

  // Complete Schedule Item
  const toggleTagesplanStep = (stepId: string, title: string, isCompleted: boolean) => {
    setTagesplanList((prev) =>
      prev.map((item) => (item.id === stepId ? { ...item, completed: !item.completed } : item))
    );

    if (!isCompleted) {
      // Award XP to active profile
      setChildProfiles((prev) =>
        prev.map((c) => {
          if (c.id === activeChildId) {
            const extraXp = 50;
            const nextXp = c.xp + extraXp;
            const levelUp = nextXp >= c.level * 400;
            return {
              ...c,
              xp: nextXp,
              level: levelUp ? c.level + 1 : c.level,
              badges: levelUp
                ? [...c.badges, `Meister-Level ${c.level + 1} 🏅`]
                : c.badges,
            };
          }
          return c;
        })
      );
      addUiLog(`Tagesplan-Punkt "${title}" abgehakt! +50 XP erhalten! 🎉`, "success");
    } else {
      addUiLog(`Tagesplan-Punkt "${title}" zurückgesetzt.`, "info");
    }
  };

  // Complete Chore / Task
  const completeTask = (taskId: string, title: string, xpReward: number) => {
    setTasksList((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          if (t.completedBy.includes(activeChildId)) {
            return { ...t, completedBy: t.completedBy.filter((c: string) => c !== activeChildId) };
          } else {
            return { ...t, completedBy: [...t.completedBy, activeChildId] };
          }
        }
        return t;
      })
    );

    const wasCompleted = tasksList.find((t) => t.id === taskId)?.completedBy.includes(activeChildId);
    if (!wasCompleted) {
      setChildProfiles((prev) =>
        prev.map((c) => {
          if (c.id === activeChildId) {
            const nextXp = c.xp + xpReward;
            const levelUp = nextXp >= c.level * 400;
            return {
              ...c,
              xp: nextXp,
              level: levelUp ? c.level + 1 : c.level,
              badges: levelUp
                ? [...c.badges, `Fleißbiene Level ${c.level + 1} 🐝`]
                : c.badges,
            };
          }
          return c;
        })
      );
      addUiLog(`Aufgabe "${title}" gelöst! +${xpReward} XP belohnt! 🚀`, "success");
    } else {
      addUiLog(`Aufgabe "${title}" zurückgesetzt.`, "info");
    }
  };

  // Custom static galleries for pictures
  const mockGalleries = [
    {
      id: 101,
      title: "Unser Sonnensystem & die Sterne",
      author: "ESA Kids",
      category: "Wissenschaft",
      ageRating: 0,
      coverUrl: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=600&q=80",
      description: "Eine Reise durch die Planeten unseres Sonnensystems, von Merkur bis Neptun mit atemberaubenden Fotos.",
      images: [
        "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&w=1200&q=85"
      ],
      captions: ["Unsere Erde aus dem All", "Ferner funkelnder Nebel", "Die ringgeschmückte Kugel des Saturn"]
    },
    {
      id: 102,
      title: "Wunderwelt heimischer Wälder",
      author: "Naturforschung e.V.",
      category: "Natur & Biologie",
      ageRating: 0,
      coverUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
      description: "Lerne die Tiere und Bäume in unseren heimischen Wäldern kennen: Rehe, Füchse, Spechte und Eichen.",
      images: [
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?auto=format&fit=crop&w=1200&q=85"
      ],
      captions: ["Sonnenstrahlen im dichten Moos", "Ein junges Reh am Waldrand", "Uralte Baumkronen spannen ein Schutzdach"]
    }
  ];

  // Custom static educational video lists
  const mockVideos = [
    {
      id: 201,
      title: "Wie entsteht ein Regenbogen? 🌈",
      author: "Professor Klug",
      category: "Natur & Biologie",
      coverUrl: "https://images.unsplash.com/photo-1517176118179-652449035ca4?auto=format&fit=crop&w=600&q=80",
      description: "Eine einfache, kinderleichte Erklärung der Lichtbrechung in Wassertropfen.",
      duration: "04:12"
    },
    {
      id: 202,
      title: "Umgang mit Social Media für Kids 📱",
      author: "Medien-Sicherheitsnetz",
      category: "Medienkompetenz",
      coverUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=600&q=80",
      description: "Wertvolle Tipps, worüber man sicher im Internet chatten kann und was man lieber verschweigt.",
      duration: "06:45"
    }
  ];

  // Filter Search
  const filteredSearchList = ageAppropriateItems.filter((item) => {
    const matchesTxt =
      item.title.toLowerCase().includes(searchTxt.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchTxt.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTxt.toLowerCase());
    const matchesTheme = themeFilter === "All" || item.category === themeFilter;
    const matchesType = typeFilter === "All" || item.itemType === typeFilter;
    const matchesAge = ageFilter === -1 || item.ageRating === ageFilter;

    return matchesTxt && matchesTheme && matchesType && matchesAge;
  });

  return (
    <div
      id="youth-portal"
      className="col-span-1 lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6"
      style={{ fontSize: `${fontScale}rem` }}
    >
      {/* SIDEBAR NAVIGATION (LEFT COLS) */}
      <div className="md:col-span-1 space-y-6">
        {/* ACTIVE CHILD BADGE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center font-bold text-white text-3xl shadow-sm">
            {activeChild.name[0]}
          </div>
          <div>
            <h4 id="child-active-username" className="font-bold text-base text-white">
              {activeChild.name} • U18 Bereich
            </h4>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-900">
                Alter: {activeChild.age} Jahre
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-900">
                Level {activeChild.level}
              </span>
            </div>
          </div>

          {/* XP PROGRESS BAR */}
          <div className="space-y-1.5 pt-1 text-left">
            <div className="flex justify-between text-[10px] text-slate-450 font-bold">
              <span>Fortschritt</span>
              <span>{activeChild.xp % 400} / 400 XP</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-350"
                style={{ width: `${((activeChild.xp % 400) / 400) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* QUICK CHOOSE PROFILE TOGGLES */}
          <div className="border-t border-slate-800/80 pt-3">
            <label className="block text-[10px] font-bold text-slate-400 mb-2 truncate">
              PROFIL WECHSELN:
            </label>
            <div className="flex justify-center gap-1.5">
              {childProfiles.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleSwitchProfile(child.id, child.name)}
                  className={`px-3 py-1 text-xs rounded-full cursor-pointer font-bold transition ${
                    activeChildId === child.id
                      ? "bg-indigo-600 text-white shadow shadow-indigo-600/30"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COMPACT LEFT MENU LIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block mb-2">
            Hauptmenü
          </span>

          <button
            onClick={() => setSubTab("start")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "start"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">🏠 Startseite</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            onClick={() => setSubTab("media")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "media"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">📚 Alle Bildungsmedien</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            onClick={() => setSubTab("videos")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "videos"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">🎥 Videos im Stream</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            onClick={() => setSubTab("images")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "images"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">🖼️ Wissens-Bildergalerien</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            onClick={() => setSubTab("docs")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "docs"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">📝 Dokumente &amp; Vorlagen</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            onClick={() => setSubTab("favs")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "favs"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">⭐ Meine Favoriten</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            onClick={() => setSubTab("search")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "search"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">🔍 Volltext-Suche</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            onClick={() => setSubTab("profile")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
              subTab === "profile"
                ? "bg-indigo-950/50 border border-indigo-700/80 text-indigo-300"
                : "text-slate-300 border border-transparent hover:bg-slate-950/40"
            }`}
          >
            <span className="flex items-center gap-2">👤 Mein Tagesplan &amp; Level</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>
      </div>

      {/* VIEWPORT CONTROLLER (RIGHT MAIN VIEW COLS) */}
      <div className="md:col-span-3 space-y-6">
        
        {/* TAB 1: STARTSEITE (NETFLIX STYLE) */}
        {subTab === "start" && (
          <div className="space-y-6">
            {/* HERO PROMOTED CARD */}
            <div className="relative bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden h-[240px] flex flex-col justify-end p-6 md:p-8 group shadow-2xl">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
              
              <div className="relative space-y-2 max-w-lg z-10">
                <div className="flex gap-2">
                  <span className="text-[9px] bg-rose-600 text-slate-100 font-mono font-bold px-2 py-0.5 rounded">WEEKLY TOP</span>
                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded">Wissenschaft</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">Geheimnisse des fernen Weltraums 🌌</h2>
                <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-2">
                  Fliege virtuell durch Galaxien, lerne kosmische Nebel kennen und entdecke, ob das Universum unendlich ist! Exklusiv aufgearbeitet für junge Entdecker.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      const item = ageAppropriateItems.find(i => i.title.toLowerCase().includes("weltraum")) || ageAppropriateItems[0];
                      if (item) setSelectedReadingItem(item);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Jetzt starten
                  </button>
                  <span className="text-[10px] text-slate-450">Alter: Klasse 4-7 • Offline-Speicherplatz belegt</span>
                </div>
              </div>
            </div>

            {/* SECTIONS GRID */}
            <div className="space-y-6">
              {/* BRAND NEW RELEASES */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Neu freigegebene Bildungsmedien
                </h3>
                {ageAppropriateItems.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">Noch keine freigegebenen Medien in dieser Altersklasse vorhanden.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ageAppropriateItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow hover:border-slate-700 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] bg-slate-950 text-indigo-300 font-bold px-2 py-0.5 rounded border border-slate-800">
                              {item.category || "Allgemein"}
                            </span>
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-900">
                              Alter {item.ageRating}+
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedReadingItem(item)}
                            className="bg-indigo-950/60 hover:bg-slate-800 text-indigo-300 hover:text-white text-[10px] font-bold px-3 py-1 rounded-lg transition border border-indigo-900/60 cursor-pointer"
                          >
                            👁️ Lesen
                          </button>
                          <button
                            onClick={() => toggleFav(item.id)}
                            className="p-1 rounded-full text-slate-500 hover:text-amber-400 transition"
                          >
                            <Star className={`w-4 h-4 ${favouriteItems.includes(item.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PERSONAL RECOMMENDATIONS GRID */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-extrabold tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Speziell empfohlen für {activeChild.name}
                </h3>
                {ageAppropriateItems.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">Tritt dem System-Qualitätsprüfer bei oder kuratiere über API neue Themen!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ageAppropriateItems.slice().reverse().slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow hover:border-slate-700 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] bg-slate-950 text-indigo-300 font-bold px-2 py-0.5 rounded border border-slate-800">
                              {item.category || "Allgemein"}
                            </span>
                            <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-900">
                              Freigegeben
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedReadingItem(item)}
                            className="bg-indigo-950/60 hover:bg-slate-800 text-indigo-300 hover:text-white text-[10px] font-bold px-3 py-1 rounded-lg transition border border-indigo-900/60 cursor-pointer"
                          >
                            👁️ Lesen
                          </button>
                          <button
                            onClick={() => toggleFav(item.id)}
                            className="p-1 rounded-full text-slate-500 hover:text-amber-400 transition"
                          >
                            <Star className={`w-4 h-4 ${favouriteItems.includes(item.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALLE BILDUNGSMEDIEN DIRECTORY */}
        {subTab === "media" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Prüfgefilterte Bildungsmediathek 📚</h2>
              <p className="text-xs text-slate-400">
                Lese kindersichere, sorgfältig pädagogisch geprüfte Artikel und Wissenseinträge. Gesteuert nach Jugendschutz.
              </p>
            </div>

            {ageAppropriateItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <BookOpen className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-xs">Der Medienbereich ist leer. Wechsle zu "Eltern" oder "Admin" um Medien zu importieren oder freizugeben.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ageAppropriateItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition"
                  >
                    <div className="flex gap-4">
                      <div className="w-14 h-18 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {item.coverUrl ? (
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <BookOpen className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold font-mono inline-block truncate bg-indigo-950 text-indigo-300`}>
                          {item.itemType === "book" ? "📖 Buch" : item.itemType === "audiobook" ? "🎙️ Hörbuch" : "📝 Wissenskarte"}
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
                      <span className="text-[9px] text-slate-500 font-mono">
                        Freigabe: Alter {item.ageRating || 0}+
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedReadingItem(item)}
                          className="bg-indigo-950/60 hover:bg-slate-800 text-indigo-300 hover:text-white text-[10px] font-bold px-3 py-1 rounded transition border border-indigo-900/60 cursor-pointer"
                        >
                          👁️ Lesen &amp; Lernen
                        </button>
                        <button
                          onClick={() => toggleFav(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-amber-400 transition"
                        >
                          <Star className={`w-3.5 h-3.5 ${favouriteItems.includes(item.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VIDEOS STREAMING IN THEATER */}
        {subTab === "videos" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Kinderleichte Lehrvideos 🎥</h2>
              <p className="text-xs text-slate-400">
                Sichere und didaktisch wertvolle Kurzvideos ohne störende Werbung oder gefährliche Empfehlungen.
              </p>
            </div>

            {/* VIDEO LIST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {mockVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-850 hover:border-slate-700 transition shadow flex flex-col justify-between"
                >
                  <div className="relative h-32 w-full bg-slate-900 overflow-hidden">
                    <img src={video.coverUrl} alt={video.title} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => setActiveVideoItem(video)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-3 shadow-lg transform active:scale-90 transition cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-white" />
                      </button>
                    </div>
                    <span className="absolute bottom-2 right-2 text-[9px] bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                      {video.duration} Min
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center text-[9px] text-indigo-400 font-bold">
                      <span>{video.category}</span>
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded">{video.author}</span>
                    </div>
                    <h4 className="font-bold text-xs text-white">{video.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed truncate">{video.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* IMMERSIVE VIDEO THEATER IF ACTIVE */}
            <AnimatePresence>
              {activeVideoItem && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-slate-950 border border-slate-850 rounded-3xl p-6 shadow-2xl relative space-y-4"
                >
                  <button
                    onClick={() => setActiveVideoItem(null)}
                    className="absolute top-4 right-4 text-slate-450 hover:text-white p-1 rounded-full bg-slate-900 border border-slate-850 cursor-pointer"
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-1.5">
                    📺 Kino-Stream: {activeVideoItem.title}
                  </h3>

                  {/* FAKE VIDEO PLAYER CONTAINER */}
                  <div className="w-full aspect-video bg-black rounded-2xl flex flex-col justify-end p-4 relative overflow-hidden group border border-slate-900">
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      <span className="text-[10px] text-slate-400 font-mono">Streamer verknüpft (Lade Bild...)</span>
                    </div>

                    {/* MOVIE CONTROLS */}
                    <div className="relative bg-slate-950/95 border border-slate-900 rounded-xl p-3 space-y-2 select-none z-10 w-full">
                      {/* SLIDER PROGRESS */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                        <div className="h-full bg-indigo-500 w-[63%]"></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button className="text-white hover:text-indigo-400 transition text-xs">
                            ⏸️ Pause
                          </button>
                          <span className="text-[9px] text-slate-400 font-mono">02:39 / {activeVideoItem.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">🔉 Ton</span>
                          <div className="w-16 h-1 bg-slate-750 rounded-full">
                            <div className="h-full bg-indigo-500 w-[80%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 4: BILDERGALERIEN & INFOGRAPHS */}
        {subTab === "images" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Visualisierte Infografiken 🖼️</h2>
              <p className="text-xs text-slate-400">
                Schöne Bildergalerien zu Sachthemen. Perfekt für visuelles Lernen und Erarbeiten.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockGalleries.map((gal) => (
                <div
                  key={gal.id}
                  className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3 shadow hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <img src={gal.coverUrl} alt={gal.title} className="w-full h-28 object-cover rounded-xl" />
                    <h4 className="font-extrabold text-xs text-slate-100">{gal.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{gal.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-905 flex justify-between items-center">
                    <span className="text-[9px] text-slate-500">Motive: {gal.images.length} Bilder</span>
                    <button
                      onClick={() => {
                        setActiveGalleryItem(gal);
                        setActiveImageIdx(0);
                      }}
                      className="bg-indigo-950 hover:bg-slate-800 text-indigo-300 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-indigo-900/60 transition cursor-pointer"
                    >
                      Öffnen 🔍
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PICTURE GALLERY LIGHTBOX SLIDESHOW */}
            <AnimatePresence>
              {activeGalleryItem && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-slate-950 border border-slate-850 rounded-3xl p-6 shadow-2xl relative space-y-4"
                >
                  <button
                    onClick={() => setActiveGalleryItem(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-900 border border-slate-850 z-20 cursor-pointer"
                  >
                    ✕
                  </button>

                  <div className="space-y-1">
                    <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded font-bold text-indigo-300 border border-indigo-950 font-mono uppercase tracking-wider">
                      {activeGalleryItem.category} • Visuelle Galerie
                    </span>
                    <h3 className="font-bold text-sm text-white">{activeGalleryItem.title}</h3>
                  </div>

                  {/* ACTIVE PHOTO DISPLAY */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-900 flex items-center justify-center">
                    <img
                      src={activeGalleryItem.images[activeImageIdx]}
                      alt="Lightbox focus"
                      className="max-h-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-4 text-center">
                      <p className="text-xs text-white font-medium">
                        {activeGalleryItem.captions[activeImageIdx]}
                      </p>
                    </div>
                  </div>

                  {/* THUMBNAIL STRIPPERS */}
                  <div className="flex gap-2 justify-center">
                    {activeGalleryItem.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border transition ${
                          activeImageIdx === idx ? "border-indigo-500 scale-105" : "border-slate-850 opacity-60"
                        }`}
                      >
                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 5: DOWNLOAD MANAGER (WORKSHEETS / PDF) */}
        {subTab === "docs" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Arbeitsblätter &amp; PDFs 📝</h2>
              <p className="text-xs text-slate-400">
                Lade Lehrmaterialien und Aufgabenzettel offline auf dieses Gerät herab. Ideal für Internetpausen.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 301, title: "Malheft - Tiere im Frühlingswald", size: "2.4 MB", ext: "PDF" },
                { id: 302, title: "Kryptographie - Geheimschriften entziffern", size: "1.8 MB", ext: "PDF" },
                { id: 303, title: "Skelett des Menschen zum Beschriften", size: "3.1 MB", ext: "DOCX" },
              ].map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-indigo-400 text-xs">
                      {doc.ext}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{doc.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Dateigröße: {doc.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {downloadedItems.includes(doc.id) ? (
                      <span className="text-[10px] bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-2 py-1 rounded">
                        ✓ Offline Bereit
                      </span>
                    ) : downloadingItems.includes(doc.id) ? (
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[8px] text-indigo-300">
                          <span>Lädt...</span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 animate-pulse w-[60%]"></div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownload(doc.id, doc.title)}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Laden
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: MY FAVORITES */}
        {subTab === "favs" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Gespeicherte Favoriten ⭐</h2>
              <p className="text-xs text-slate-400">Deine Lesezeichen zum schnellen Wiederfinden.</p>
            </div>

            {favouriteItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Star className="w-10 h-10 mx-auto opacity-35 mb-2" />
                <p className="text-xs">Noch keine Favoriten gespeichert. Klicke auf den Stern bei einem Medienartikel!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ageAppropriateItems
                  .filter((item) => favouriteItems.includes(item.id))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 italic truncate">{item.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedReadingItem(item)}
                          className="bg-indigo-950 hover:bg-slate-800 text-indigo-300 font-bold text-[10px] px-2.5 py-1 rounded transition border border-indigo-900/60 cursor-pointer"
                        >
                          👁️ Lesen
                        </button>
                        <button
                          onClick={() => toggleFav(item.id)}
                          className="text-rose-400 hover:text-rose-350 p-1 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: ADVANCED SEARCH CONTROLS */}
        {subTab === "search" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Volltextsuche &amp; Filter 🔍</h2>
                <p className="text-xs text-slate-400">Verfeinere deine Suche nach Thema, Altersgruppe oder Dateityp.</p>
              </div>

              {/* SEARCH BAR INPUT */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Durchsuche alle geprüften Artikel, Bücher, Podcasts..."
                  value={searchTxt}
                  onChange={(e) => setSearchTxt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-2xl py-2 px-10 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-0 placeholder:text-slate-600"
                />
              </div>

              {/* MULTI FILTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* THEME */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">THEMENBEREICH</label>
                  <select
                    value={themeFilter}
                    onChange={(e) => setThemeFilter(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-300 rounded-xl border border-slate-850 p-2 focus:outline-none"
                  >
                    <option value="All">Alle Themen</option>
                    <option value="Natur & Biologie">Natur &amp; Biologie</option>
                    <option value="Wissenschaft">Wissenschaft</option>
                    <option value="Mathe">Mathe</option>
                    <option value="Medienkompetenz">Medienkompetenz</option>
                    <option value="Märchen & Geschichten">Märchen &amp; Erzählungen</option>
                    <option value="Allgemein">Allgemein</option>
                  </select>
                </div>

                {/* TYPE */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">MEDIENTYP</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-300 rounded-xl border border-slate-850 p-2 focus:outline-none"
                  >
                    <option value="All">Alle Typen</option>
                    <option value="article">📝 Wissenskarten / Wiki</option>
                    <option value="book">📖 Bücher / Lexika</option>
                    <option value="audiobook">🎙️ Hörbücher / Streams</option>
                  </select>
                </div>

                {/* ALTER */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">ALGERANGE (MAX)</label>
                  <select
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(parseInt(e.target.value))}
                    className="w-full bg-slate-950 text-xs text-slate-300 rounded-xl border border-slate-850 p-2 focus:outline-none"
                  >
                    <option value="-1">Jedes Alter zulassen</option>
                    <option value="0">Kinder ohne Altersgrenze (0+)</option>
                    <option value="6">Schulkinder ab 6 Jahren (6+)</option>
                    <option value="12">Jugendliche ab 12 Jahren (12+)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RESULTS VIEW */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                Gefundene Treffer: {filteredSearchList.length} von {ageAppropriateItems.length}
              </span>

              {filteredSearchList.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-855 rounded-2xl text-center text-slate-500">
                  <p className="text-xs italic">Keine passenden Übereinstimmungen. Versuche andere Suchbegriffe.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSearchList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-indigo-400 font-bold px-1.5 py-0.5 rounded">
                          {item.category || "Allgemein"}
                        </span>
                        <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                          Alter {item.ageRating}+
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-xs truncate">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 font-sans">{item.author || "Anonym"}</span>
                        <button
                          onClick={() => setSelectedReadingItem(item)}
                          className="bg-indigo-950 hover:bg-slate-800 text-indigo-300 font-bold text-[10px] px-2.5 py-1 rounded border border-indigo-900/60 transition cursor-pointer"
                        >
                          👁️ Lesen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: SCHEDULE (Saisoplan) & LEVEL GOALS */}
        {subTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TAGESPLAN (SCHEDULE CHECKLIST) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Mien Tagesplan (Saisoplan) 🕒
                </h3>
                <p className="text-xs text-slate-450">
                  Erledige Routinepunkte um wertvolle Medienzylinder-Erfahrungspunkte (XP) freizuschalten!
                </p>
              </div>

              <div className="space-y-2 pt-1 font-sans">
                {tagesplanList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      item.completed
                        ? "bg-emerald-950/20 border-emerald-900/50 text-slate-400"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <span className="text-lg select-none shrink-0">{item.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-450">
                            {item.timeRange}
                          </span>
                          <span className={`text-[10px] font-bold ${item.completed ? "line-through opacity-60" : ""}`}>
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTagesplanStep(item.id, item.title, item.completed)}
                      className={`cursor-pointer w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        item.completed
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "border-slate-800 hover:border-indigo-500 bg-slate-900"
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CHORES / AUFGABEN WITH XP */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-amber-400" />
                  Mitmach-Aufgaben &amp; Chores ⭐️
                </h3>
                <p className="text-xs text-slate-450">
                  Unterstütze deine Familie oder löse Schulrätsel, um Zusatzbelohnungen einzustreichen!
                </p>
              </div>

              <div className="space-y-3 font-sans">
                {tasksList.map((task) => {
                  const done = task.completedBy.includes(activeChildId);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        done
                          ? "bg-indigo-950/20 border-indigo-900/50 text-slate-450"
                          : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex gap-2.5 items-center">
                        <span className="text-lg select-none shrink-0">{task.emoji}</span>
                        <div>
                          <h4 className={`text-[11px] font-bold ${done ? "line-through opacity-60" : ""}`}>
                            {task.title}
                          </h4>
                          <span className="text-[9px] text-amber-400 font-mono font-medium">
                            🏅 Belohnung: +{task.xpReward} XP
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => completeTask(task.id, task.title, task.xpReward)}
                        className={`cursor-pointer px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                          done
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        {done ? "Eingelöst ✓" : "Abschließen"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
