import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Edit,
  CheckCircle,
  FileText,
  Bookmark,
  Activity,
  Award,
  Sparkles,
  Search,
  Upload,
  User,
  ArrowRight,
  Info
} from "lucide-react";

interface ContributorPanelProps {
  libraryItemsList: any[];
  loadLibrary: () => void;
  loadingLibrary: boolean;
  handleManualUpload: () => void;
  handleDeleteLibraryItem: (id: number) => void;
  handleEditLibraryItemDetails: (id: number, fields: any) => void;
  manualTitle: string;
  setManualTitle: (val: string) => void;
  manualAuthor: string;
  setManualAuthor: (val: string) => void;
  manualDescription: string;
  setManualDescription: (val: string) => void;
  manualContent: string;
  setManualContent: (val: string) => void;
  manualCategory: string;
  setManualCategory: (val: string) => void;
  manualAgeRating: number;
  setManualAgeRating: (val: number) => void;
  manualMediaType: "book" | "audiobook" | "article";
  setManualMediaType: (val: "book" | "audiobook" | "article") => void;
  editingItem: any;
  setEditingItem: (val: any) => void;
  activeChildId: string;
  childProfiles: any[];
  addUiLog: (msg: string, type: "info" | "success" | "warn") => void;

  // Importer functions from App.tsx
  handleImportLibraryItem: (item: {
    title: string;
    description: string;
    author?: string;
    coverUrl?: string;
    sourceType: "article" | "book" | "audiobook";
    metadata?: any;
  }) => Promise<void>;
  selectedMode: string;
  selectedDiagnosis: string;
  selectedPhase: string;
  setSelectedDiagnosis: (val: string) => void;
  setSelectedPhase: (val: string) => void;
  DIAGNOSES: any[];
  DEESCALATION_PHASES: any[];
  activeSessionId: number | null;
  setActiveSessionId: (id: number | null) => void;
  sessions: any[];
  handleCreateSession: (e: React.FormEvent) => void;
  handleDeleteSession: (id: number) => void;
  newSessionName: string;
  setNewSessionName: (val: string) => void;
  loadingSessions: boolean;
  messagesList: any[];
  loadingMessages: boolean;
  messageText: string;
  setMessageText: (val: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isCrisisEscalated: (text: string) => boolean;
  oberarztAlert: string | null;
  generatingTestContent?: boolean;
  handleGenerateTestContent?: () => Promise<void>;
}

export const ContributorPanel: React.FC<ContributorPanelProps> = ({
  libraryItemsList,
  loadLibrary,
  loadingLibrary,
  handleManualUpload,
  handleDeleteLibraryItem,
  handleEditLibraryItemDetails,
  manualTitle,
  setManualTitle,
  manualAuthor,
  setManualAuthor,
  manualDescription,
  setManualDescription,
  manualContent,
  setManualContent,
  manualCategory,
  setManualCategory,
  manualAgeRating,
  setManualAgeRating,
  manualMediaType,
  setManualMediaType,
  editingItem,
  setEditingItem,
  activeChildId,
  childProfiles,
  addUiLog,

  // Importer stuff
  handleImportLibraryItem,
  selectedMode,
  selectedDiagnosis,
  selectedPhase,
  setSelectedDiagnosis,
  setSelectedPhase,
  DIAGNOSES,
  DEESCALATION_PHASES,
  activeSessionId,
  setActiveSessionId,
  sessions,
  handleCreateSession,
  handleDeleteSession,
  newSessionName,
  setNewSessionName,
  loadingSessions,
  messagesList,
  loadingMessages,
  messageText,
  setMessageText,
  handleSendMessage,
  isCrisisEscalated,
  oberarztAlert,
  generatingTestContent,
  handleGenerateTestContent
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"einreichen" | "meine_beitraege" | "ki_kuration">("einreichen");
  const [wikiKeywordInput, setWikiKeywordInput] = useState("");
  const [lookupEngine, setLookupEngine] = useState<"wikipedia" | "openlibrary" | "librivox">("wikipedia");
  const [importingState, setImportingState] = useState(false);

  // Edit item form local states
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAge, setEditAge] = useState<number>(0);

  const startEditing = (item: any) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditAuthor(item.author || "");
    setEditDesc(item.description || "");
    setEditContent(item.localContent || "");
    setEditCategory(item.category || "Allgemein");
    setEditAge(item.ageRating || 0);
  };

  const saveEdit = async () => {
    if (!editTitle) return;
    await handleEditLibraryItemDetails(editingItem.id, {
      title: editTitle,
      author: editAuthor,
      description: editDesc,
      localContent: editContent,
      category: editCategory,
      ageRating: editAge,
      publishStatus: "draft" // Resubmitted as draft for safety
    });
    setEditingItem(null);
  };

  // Automated Crawler lookup for Wikipedia or OpenLibrary
  const triggerAutoCuration = async () => {
    if (!wikiKeywordInput) return;
    setImportingState(true);
    addUiLog(`Frage Kuration-Schnittstelle (${lookupEngine}) ab für: "${wikiKeywordInput}"...`, "info");
    
    try {
      if (lookupEngine === "wikipedia") {
        await handleImportLibraryItem({
          title: wikiKeywordInput,
          description: `Zusammenfassung des Wikipedia-Artikels über ${wikiKeywordInput}.`,
          author: "Wikipedia-Autoren",
          sourceType: "article",
          metadata: { engine: "wikipedia" }
        });
        setWikiKeywordInput("");
      } else if (lookupEngine === "openlibrary") {
        // Open library book downloader proxy simulation
        await handleImportLibraryItem({
          title: `Das Buch von ${wikiKeywordInput}`,
          description: `Klassisches literarisches Werk zum Thema ${wikiKeywordInput}.`,
          author: "Historischer Autor",
          sourceType: "book",
          metadata: { engine: "openlibrary" }
        });
        setWikiKeywordInput("");
      } else {
        // Librivox audiobook lookup proxy simulation
        await handleImportLibraryItem({
          title: `Hörbuch: ${wikiKeywordInput}`,
          description: `Frei lizenziertes Hörspiel zum Thema ${wikiKeywordInput}.`,
          author: "Sprechergemeinschaft LibriVox",
          sourceType: "audiobook",
          metadata: { engine: "librivox" }
        });
        setWikiKeywordInput("");
      }
      loadLibrary();
    } catch (err: any) {
      addUiLog(`Curation fehlgeschlagen: ${err.message}`, "warn");
    } finally {
      setImportingState(false);
    }
  };

  return (
    <div className="col-span-1 lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6 font-sans">
      {/* SIDER BAR */}
      <div className="md:col-span-1 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center space-y-3 relative overflow-hidden">
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-950 border border-amber-700 flex items-center justify-center font-bold text-amber-400 text-xl shadow-lg shadow-amber-950/40">
            🍎
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Lernportal-Mitgestalter</h4>
            <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-900 mt-1 inline-block">
              Eltern &amp; Lehrkräfte
            </span>
          </div>
        </div>

        {/* CONTRIBUTOR EXPLANATORY NOTIFICATION */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 text-xs text-slate-400 space-y-2">
          <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">💡 Eigene Beiträge beisteuern</span>
          <p className="leading-relaxed">
            Als Erzieher oder Elternteil können Sie die Bibliothek bereichern! Laden Sie eigene Geschichten oder Wissenskarten hoch, oder lassen Sie sich durch unsere künstliche Intelligenz bei der Themengestaltung unterstützen. Die Administration prüft diese im Anschluss für maximale Sicherheit.
          </p>
        </div>

        {/* SIDE MENU */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
          <button
            onClick={() => setActiveSubTab("einreichen")}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === "einreichen" ? "bg-indigo-950 text-indigo-300 border border-indigo-900" : "text-slate-300 hover:bg-slate-950/40"
            }`}
          >
            <span>📥 Beitrag vorschlagen</span>
          </button>
          <button
            onClick={() => setActiveSubTab("meine_beitraege")}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === "meine_beitraege" ? "bg-indigo-950 text-indigo-300 border border-indigo-900" : "text-slate-300 hover:bg-slate-950/40"
            }`}
          >
            <span>📜 Eigene Vorschläge ({libraryItemsList.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("ki_kuration")}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === "ki_kuration" ? "bg-indigo-950 text-indigo-300 border border-indigo-900" : "text-slate-300 hover:bg-slate-950/40"
            }`}
          >
            <span>🤖 KI-Assistent &amp; Kuration</span>
          </button>
        </div>
      </div>

      {/* VIEWPORT AREA */}
      <div className="md:col-span-3 space-y-6">
        
        {/* SUBTAB 1: FORMULAR EINREICHEN */}
        {activeSubTab === "einreichen" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* MANUAL UPLOAD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-5 h-5 text-indigo-400" />
                  Eigene Wissenskarte erstellen
                </h3>
                <p className="text-xs text-slate-400">
                  Geben Sie Ihren eigenen spannenden Text, eine Gutenachtgeschichte oder ein Kurzrätsel per Hand ein.
                </p>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-450 font-bold uppercase text-[9px] tracking-wider">Titel des Artikels *</label>
                    <input
                      type="text"
                      placeholder="z.B. Das Geheimnis der Bienen"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full bg-slate-950 text-xs px-3.5 py-2.5 rounded-xl border border-slate-850 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-450 font-bold uppercase text-[9px] tracking-wider">Autor / Urheber</label>
                    <input
                      type="text"
                      placeholder="z.B. Sabine Fuchs"
                      value={manualAuthor}
                      onChange={(e) => setManualAuthor(e.target.value)}
                      className="w-full bg-slate-950 text-xs px-3.5 py-2.5 rounded-xl border border-slate-850 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-450 font-bold uppercase text-[9px] tracking-wider">Thema / Fach</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full bg-slate-950 text-xs rounded-xl border border-slate-850 p-2.5 text-white"
                    >
                      <option value="Natur & Biologie">Natur &amp; Biologie</option>
                      <option value="Wissenschaft">Wissenschaft</option>
                      <option value="Mathe">Mathe</option>
                      <option value="Medienkompetenz">Medienkompetenz</option>
                      <option value="Märchen & Geschichten">Märchen &amp; Geschichten</option>
                      <option value="Allgemein">Allgemein</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-450 font-bold uppercase text-[9px] tracking-wider">Format</label>
                    <select
                      value={manualMediaType}
                      onChange={(e) => setManualMediaType(e.target.value as any)}
                      className="w-full bg-slate-950 text-xs rounded-xl border border-slate-850 p-2.5 text-white"
                    >
                      <option value="article">📝 Wissenskarte / Text</option>
                      <option value="book">📖 Lesebuch / PDF</option>
                      <option value="audiobook">🎙️ Hörspiel / MP3</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-450 font-bold uppercase text-[9px] tracking-wider">Altersfreigabe</label>
                    <select
                      value={manualAgeRating}
                      onChange={(e) => setManualAgeRating(parseInt(e.target.value))}
                      className="w-full bg-slate-950 text-xs rounded-xl border border-slate-850 p-2.5 text-white"
                    >
                      <option value="0">Ohne Altersgrenze (0+)</option>
                      <option value="6">Schulkinder (6+)</option>
                      <option value="12">Jugendliche (12+)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-450 font-bold uppercase text-[9px] tracking-wider">Kurzbeschreibung / Vorschau</label>
                  <textarea
                    rows={2}
                    placeholder="Worum dreht es sich in diesem Beitrag?"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full bg-slate-950 text-xs px-3.5 py-2.5 rounded-xl border border-slate-850 text-white focus:outline-none focus:border-indigo-500"
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-450 font-bold uppercase text-[9px] tracking-wider">Artikel Volltext / Inhalt-Daten</label>
                  <textarea
                    rows={4}
                    placeholder="Füge hier den lesbaren Fachartikel, Arbeitsanweisungen oder Verknüpfungen ein..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full bg-slate-950 text-xs px-3.5 py-2.5 rounded-xl border border-slate-850 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  ></textarea>
                </div>

                <button
                  onClick={handleManualUpload}
                  disabled={!manualTitle}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-indigo-950/20"
                >
                  📥 Beitrag als Entwurf einsenden
                </button>
              </div>
            </div>

            {/* AUTOMATIC API CRAWLER */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Search className="w-5 h-5 text-indigo-400" />
                  Freie Bibliotheken durchsuchen
                </h3>
                <p className="text-xs text-slate-400">
                  Laden Sie auf Knopfdruck Artikel aus Wikipedia, LibriVox-Hörbüchern oder freien Registern direkt ins Archiv.
                </p>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <div className="space-y-2">
                  <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Suchquelle wählen</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "wikipedia", label: "Wikipedia 📝" },
                      { key: "openlibrary", label: "OpenLibrary 📖" },
                      { key: "librivox", label: "LibriVox Hörspiele 🎙️" }
                    ].map((api) => (
                      <button
                        key={api.key}
                        type="button"
                        onClick={() => setLookupEngine(api.key as any)}
                        className={`py-3 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                          lookupEngine === api.key ? "bg-indigo-950/60 border-indigo-700/80 text-indigo-300" : "bg-slate-950 border-slate-850 text-slate-400"
                        }`}
                      >
                        {api.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Erwünschter Suchbegriff</label>
                  <input
                    type="text"
                    value={wikiKeywordInput}
                    onChange={(e) => setWikiKeywordInput(e.target.value)}
                    placeholder="z.B. Astronomie, Dinosaurier, Albert Einstein..."
                    className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-850 text-xs text-white placeholder:text-slate-650"
                  />
                </div>

                <button
                  onClick={triggerAutoCuration}
                  disabled={importingState || !wikiKeywordInput}
                  className="w-full bg-indigo-600 disabled:bg-slate-800 text-white hover:bg-indigo-500 py-4 rounded-2xl font-black font-sans text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-950/20"
                >
                  {importingState ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Laden des Artikels läuft...
                    </>
                  ) : (
                    <>
                      <span>Holen &amp; als Entwurf spiegeln</span>
                      <ArrowRight className="w-4 h-4 text-white animate-pulse" />
                    </>
                  )}
                </button>

                <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                  <span className="font-bold text-slate-200 flex items-center gap-1 text-[11px]">
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Wie funktioniert das?
                  </span>
                  <p>
                    Unser Crawler durchsucht öffentliche Archive, befreit die Rohdaten von störenden Links oder Quelltextzeilen und speichert den bereinigten Text ab. Danach stuft die künstliche Intelligenz den Entwurf automatisch nach Altersgruppen ein.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 2: LISTE DER EIGENEN BEITRÄGE & EDIT */}
        {activeSubTab === "meine_beitraege" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">Hochgeladene Medien &amp; Status</h3>
                <p className="text-xs text-slate-400">Zeigt deine Entwürfe und die aktuellen Qualitätsprüfungen durch den Schul-Admin.</p>
              </div>
              <button
                onClick={loadLibrary}
                disabled={loadingLibrary}
                className="bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 px-3 py-1 text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLibrary ? "animate-spin" : ""}`} /> Aktualisieren
              </button>
            </div>

            {loadingLibrary ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
                <span>Synchronisiere PostgreSQL Einträge...</span>
              </div>
            ) : libraryItemsList.length === 0 ? (
              <p className="py-12 text-center text-slate-500 italic text-xs">Noch keine Einreichungen vorgenommen. Trage oben das erste Thema ein!</p>
            ) : (
              <div className="space-y-4">
                {libraryItemsList.map((item) => {
                  const status = item.publishStatus || "approved";
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-800 transition"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-indigo-300 border border-indigo-950 font-mono font-bold uppercase truncate">
                            {item.itemType === "book" ? "📖 Buch" : item.itemType === "audiobook" ? "🎙️ Hörbuch" : "📝 Artikel"}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            status === "approved"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-900"
                              : status === "rejected"
                              ? "bg-rose-950 text-rose-300 border border-rose-900"
                              : status === "revision_requested"
                              ? "bg-amber-950 text-amber-300 border border-amber-900"
                              : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}>
                            {status === "approved"
                              ? "✓ Freigegeben & Live"
                              : status === "rejected"
                              ? "❌ Abgelehnt / Nicht unbedenklich"
                              : status === "revision_requested"
                              ? "⚠️ Korrektur angefordert"
                              : "⏳ In Prüfung / Entwurf"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-white truncate">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-1">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 p-2 rounded-xl transition cursor-pointer"
                          title="Eintrag bearbeiten"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLibraryItem(item.id)}
                          className="text-slate-500 hover:text-rose-450 p-2 rounded-xl"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* EDITING DIALOG MODAL INNER */}
            {editingItem && (
              <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Medienartikel bearbeiten</h3>
                    <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="space-y-3 text-xs font-sans">
                    <div className="space-y-1">
                      <label className="block text-slate-450 font-bold">TITEL</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-950 p-2 border border-slate-850 rounded text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-450 font-bold">AUTOR</label>
                      <input
                        type="text"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="w-full bg-slate-950 p-2 border border-slate-850 rounded text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-450 font-bold">BESCHREIBUNG</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-slate-950 p-2 border border-slate-850 rounded text-slate-100"
                      ></textarea>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-450 font-bold">VOLLTEXT CONTENT</label>
                      <textarea
                        rows={5}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-slate-950 p-2 border border-slate-850 rounded text-slate-100 font-mono"
                      ></textarea>
                    </div>

                    <button
                      onClick={saveEdit}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition cursor-pointer"
                    >
                      Änderungen speichern &amp; neu einreichen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: ASSISTANT FOR CURATION OR CLINICAL SCENARIOS */}
        {activeSubTab === "ki_kuration" && (
          <div className="space-y-6">
            {/* KI TEST DATA BOOSTER */}
            {handleGenerateTestContent && (
              <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-900/60 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-700/50 uppercase tracking-wider inline-block">
                      Massen-Kuration &amp; API-Schnittstellentest
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Gemini-Testdatenstudio 
                    </h3>
                    <p className="text-xs text-slate-350 max-w-2xl mt-1">
                      Generiert für <strong>alle 6 Themenbereiche</strong> ("Natur & Biologie", "Wissenschaft", "Mathe", "Medienkompetenz", "Märchen & Geschichten", "Allgemein") je ein fesselndes Lernmedium und 2 interaktive Quizfragen (insgesamt 12 Fragen) live per Google Gemini. Ideal um Medienplattform und Quizersteller vollumfänglich zu testen.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateTestContent}
                    disabled={generatingTestContent}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-2xl flex items-center gap-1.5 transition whitespace-nowrap shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {generatingTestContent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Inhalte werden generiert...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        6 Kategorien befüllen (Gemini API)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* INSTRUCTOR CONFIG COLS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-indigo-400 block uppercase">Betriebs-Szenario</span>
                <p className="text-xs text-slate-400">
                  Der KI-Inhaltskurator spricht dank des Phasenmodells stationsnahes Deutsch und erkennt Kriseneskalationen sofort.
                </p>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500">SYSTEM-FACHBEREICH / ALTER</label>
                  <select
                    value={selectedDiagnosis}
                    onChange={(e) => setSelectedDiagnosis(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white rounded-lg border border-slate-850 p-2"
                  >
                    {DIAGNOSES.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500">SCHWERPUNKT / KATEGORIE</label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white rounded-lg border border-slate-850 p-2"
                  >
                    {DEESCALATION_PHASES.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SESSIONS PICKER ON DEESCALATION TRAINER */}
              <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-1">Kurations-Historie (Sitzungen)</span>
                  <form onSubmit={handleCreateSession} className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      placeholder="Neue Sitzung..."
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="flex-1 bg-slate-950 text-xs px-2.5 py-1.5 rounded-lg border border-slate-850 text-white"
                    />
                    <button
                      type="submit"
                      disabled={!newSessionName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs"
                    >
                      +
                    </button>
                  </form>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 text-xs max-h-[140px]">
                  {loadingSessions ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mx-auto" />
                  ) : sessions.length === 0 ? (
                    <p className="text-slate-600 text-center py-4 italic text-[11px]">Keine aktiven Befragungen.</p>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setActiveSessionId(s.id)}
                        className={`p-2 rounded border flex items-center justify-between cursor-pointer transition ${
                          activeSessionId === s.id
                            ? "bg-indigo-950/40 border-indigo-700 text-indigo-300"
                            : "bg-slate-950 border-slate-900 hover:bg-slate-900 text-slate-450"
                        }`}
                      >
                        <span className="truncate">{s.sessionName}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }} className="text-slate-500 hover:text-rose-400 text-[10px]">Löschen</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* INTERACTIVE CHAT BODY */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[400px]">
              {/* OBERARZT ALERTS */}
              {oberarztAlert && (
                <div className="bg-red-950/80 border-b border-red-800 px-6 py-2 flex items-center justify-between animate-pulse">
                  <span className="text-[10px] text-red-100 font-bold">🚨 KRITISCHES REPRO-WARNUNG: {oberarztAlert}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeSessionId === null ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                    <BookOpen className="w-8 h-8 animate-pulse mb-2 text-indigo-400" />
                    <p className="text-xs">Bitte Sitzung auswählen oder links eine Befragung starten.</p>
                  </div>
                ) : loadingMessages ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mt-[100px]" />
                ) : messagesList.length === 0 ? (
                  <p className="text-slate-600 text-center py-12 italic text-xs">Der Chatverlauf ist leer. Fragen Sie das Modell!</p>
                ) : (
                  messagesList.map((m) => {
                    const isAssistant = m.role === "model";
                    return (
                      <div key={m.id} className={`flex flex-col ${isAssistant ? "items-start" : "items-end"} space-y-1`}>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {isAssistant ? "KI-Kurator" : "Erzieher / Lehrkraft"}
                        </span>
                        <div className={`p-3 rounded-2xl text-xs max-w-sm leading-relaxed ${
                          isAssistant ? "bg-slate-950 text-slate-200" : "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* CHAT FORM */}
              {activeSessionId !== null && (
                <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Frag das Modell nach einer kindgerechten Zusammenfassung..."
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 focus:outline-none"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl">
                    Senden
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
