import React, { useState } from "react";
import {
  Shield,
  UserPlus,
  Trash2,
  Lock,
  Loader2,
  FolderOpen,
  Sliders,
  CheckCircle,
  Database,
  Activity,
  Award,
  Sparkles,
  Info,
  RefreshCw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AdminPanelProps {
  libraryItemsList: any[];
  loadLibrary: () => void;
  loadingLibrary: boolean;
  handleUpdateItemStatus: (id: number, status: string) => Promise<void>;
  handleDeleteLibraryItem: (id: number) => Promise<void>;
  simulatedUsers: any[];
  setSimulatedUsers: React.Dispatch<React.SetStateAction<any[]>>;
  newUserName: string;
  setNewUserName: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserRole: "admin" | "provider" | "youth";
  setNewUserRole: (val: "admin" | "provider" | "youth") => void;
  newUserGroup: string;
  setNewUserGroup: (val: string) => void;
  addUiLog: (msg: string, type: "info" | "success" | "warn") => void;
  parentPin: string;
  setParentPin: (val: string) => void;
  allowVideos: boolean;
  setAllowVideos: (val: boolean) => void;
  allowAudio: boolean;
  setAllowAudio: (val: boolean) => void;
  allowPdf: boolean;
  setAllowPdf: (val: boolean) => void;
  generatingTestContent?: boolean;
  handleGenerateTestContent?: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  libraryItemsList,
  loadLibrary,
  loadingLibrary,
  handleUpdateItemStatus,
  handleDeleteLibraryItem,
  simulatedUsers,
  setSimulatedUsers,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserRole,
  setNewUserRole,
  newUserGroup,
  setNewUserGroup,
  addUiLog,
  parentPin,
  setParentPin,
  allowVideos,
  setAllowVideos,
  allowAudio,
  setAllowAudio,
  allowPdf,
  setAllowPdf,
  generatingTestContent,
  handleGenerateTestContent
}) => {
  const [adminTab, setAdminTab] = useState<"freigaben" | "benutzer" | "stats" | "sicherungen">("freigaben");
  
  // Backup progress states
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStep, setBackupStep] = useState(0);
  const [backupLimit, setBackupLimit] = useState(1.0); // GB disk space
  
  // Add simulated user
  const handleCreateSimulatedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      addUiLog("Name und E-Mail dürfen nicht leer sein.", "warn");
      return;
    }
    const newU = {
      id: "u-" + (simulatedUsers.length + 1),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      group: newUserGroup,
      status: "Aktiv",
      createdAt: new Date().toISOString().split("T")[0]
    };
    setSimulatedUsers((prev) => [...prev, newU]);
    addUiLog(`Benutzer "${newUserName}" als "${newUserRole}" angelegt.`, "success");
    setNewUserName("");
    setNewUserEmail("");
  };

  // Lock simulated user
  const toggleUserStatus = (userId: string, name: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Aktiv" ? "Gesperrt" : "Aktiv";
    setSimulatedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );
    if (nextStatus === "Gesperrt") {
      addUiLog(`Konto von ${name} gesperrt. Zugriff verwehrt! ⚠️`, "warn");
    } else {
      addUiLog(`Konto von ${name} reaktiviert.`, "success");
    }
  };

  // Change user role
  const changeUserRole = (userId: string, newRole: "admin" | "provider" | "youth") => {
    setSimulatedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole, group: newRole === "youth" ? "Jugendliche" : newRole === "provider" ? "Lehrkräfte" : "Administrator" } : u))
    );
    addUiLog(`Rolle für ID ${userId} auf "${newRole}" abgeändert.`, "info");
  };

  // Delete simulated user
  const deleteSimulatedUser = (userId: string, name: string) => {
    if (!confirm(`Möchten Sie den Benutzer "${name}" wirklich löschen?`)) return;
    setSimulatedUsers((prev) => prev.filter((u) => u.id !== userId));
    addUiLog(`Benutzer "${name}" aus dem Katalog gelöscht.`, "warn");
  };

  // Trigger simulated system backup with multi-step progress bar
  const triggerFullSystemBackup = () => {
    setBackupLoading(true);
    setBackupStep(1);
    addUiLog("Initiiere vollständige System-Datensicherung...", "info");

    setTimeout(() => {
      setBackupStep(2);
      addUiLog("Kopiere Tabellen 'users', 'chats', 'messages' & 'library_items'...", "info");
    }, 600);

    setTimeout(() => {
      setBackupStep(3);
      addUiLog("Komprimiere SQL-Dumps zu ZIP-Archiv...", "info");
    }, 1200);

    setTimeout(() => {
      setBackupStep(4);
      addUiLog("Backup erfolgreich auf redundantem Cloud-Bucket persistiert (ID: backup-2026-csql.zip).", "success");
      setBackupLoading(false);
    }, 1800);
  };

  // Draft review queue
  const reviewQueue = libraryItemsList.filter((item) => {
    const status = item.publishStatus || "approved";
    return status === "draft" || status === "review" || status === "revision_requested" || status === "rejected";
  });

  // Approved library items
  const liveItems = libraryItemsList.filter((item) => {
    const status = item.publishStatus || "approved";
    return status === "approved";
  });

  // Calculate stats for chart
  const getCategoryStats = () => {
    const categories = ["Natur & Biologie", "Wissenschaft", "Mathe", "Medienkompetenz", "Märchen & Geschichten", "Allgemein"];
    return categories.map((cat) => {
      const count = libraryItemsList.filter((i) => i.category === cat).length;
      return { name: cat, count: count || 0 };
    });
  };

  const chartData = getCategoryStats();
  const COLORS = ["#6366f1", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#64748b"];

  // Calculate simulated file size
  const totalFileSizeMb = (libraryItemsList.length * 1.45).toFixed(1);

  return (
    <div className="col-span-1 lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6 font-sans">
      
      {/* LEFT SIDE CONFIG TOOLS (1 COL) */}
      <div className="md:col-span-1 space-y-4">
        {/* AVATAR BADGE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center font-bold text-white text-xl shadow shadow-indigo-600/20">
            👑
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">System-Zentrale</h4>
            <span className="text-[10px] bg-indigo-955 bg-indigo-950 text-indigo-300 font-bold px-3 py-1 rounded-full border border-indigo-900 mt-1 inline-block">
              Leitung &amp; Moderation
            </span>
          </div>
        </div>

        {/* BRIEF FRIENDLY EXPLANATION FOR PARENTS / ADMINS */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 text-xs text-slate-400 space-y-2">
          <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">💡 Was geschieht hier?</span>
          <p className="leading-relaxed">
            In diesem Kontrollzentrum verwalten Sie das gesamte Angebot für Ihre Kinder. Sie prüfen eingesandte Medien, steuern die Benutzerrechte der Kinder und sichern Lernfortschritte ab – ganz ohne technisches Hintergrundwissen.
          </p>
        </div>

        {/* ADMIN TAB NAVIGATION MENU */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
          <button
            onClick={() => setAdminTab("freigaben")}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer md:py-3.5 ${
              adminTab === "freigaben" ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "text-slate-300 hover:bg-slate-950/40"
            }`}
          >
            <span>⏳ Inhaltsprüfung ({reviewQueue.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("benutzer")}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer md:py-3.5 ${
              adminTab === "benutzer" ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "text-slate-300 hover:bg-slate-950/40"
            }`}
          >
            <span>👥 Benutzerkonten ({simulatedUsers.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("stats")}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer md:py-3.5 ${
              adminTab === "stats" ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "text-slate-300 hover:bg-slate-950/40"
            }`}
          >
            <span>📊 Themen &amp; Statistiken</span>
          </button>
          <button
            onClick={() => setAdminTab("sicherungen")}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer md:py-3.5 ${
              adminTab === "sicherungen" ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "text-slate-300 hover:bg-slate-950/40"
            }`}
          >
            <span>⚙️ Sicherheit &amp; Eltern-PIN</span>
          </button>
        </div>
      </div>

      {/* VIEWPORT CONTROLLERS (3 COLS) */}
      <div className="md:col-span-3 space-y-6">
        
        {/* SUBTAB 1: DRAFTS APPROVAL QUALITY QUEUE */}
        {adminTab === "freigaben" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 font-sans text-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-800 gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Inhaltsprüfung &amp; Portal-Freigabe</h3>
                <p className="text-xs text-slate-400">Prüfen und sichten Sie Beiträge, bevor sie für die Kinder spielerisch freigegeben werden.</p>
              </div>
              <button
                onClick={loadLibrary}
                disabled={loadingLibrary}
                className="bg-indigo-950 border border-indigo-900 hover:bg-indigo-900 text-indigo-300 px-4 py-2.5 text-xs rounded-xl flex items-center gap-1.5 transition font-bold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLibrary ? "animate-spin" : ""}`} /> Aktualisieren
              </button>
            </div>

            {loadingLibrary ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                <span className="mt-2 block">Aktualisiere Prüfliste...</span>
              </div>
            ) : reviewQueue.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl max-w-sm mx-auto p-4 space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-slate-200">Gute Arbeit! Keine offenen Anträge</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Sämtliche Bildungsmedien wurden erfolgreich kontrolliert und freigegeben. Kinder können alles uneingeschränkt lesen!
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <span className="text-[10px] text-indigo-400 font-bold tracking-wider bg-indigo-950 border border-indigo-900 px-3 py-1 rounded-full uppercase">
                  Offene Einsendungen zur Begutachtung
                </span>

                {reviewQueue.map((item) => {
                  const status = item.publishStatus || "draft";
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950/85 border border-slate-850 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] bg-slate-900 border border-slate-800 text-indigo-300 font-bold px-2 py-0.5 rounded font-mono uppercase">
                              {item.category || "Allgemein"}
                            </span>
                            <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded">
                              Zielgruppe: Alter {item.ageRating}+
                            </span>
                            <span className="text-[9px] bg-slate-900 border border-slate-850 px-1.5 py-0.5 text-slate-400 rounded">
                              ID: #{item.id}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-100">{item.title}</h4>
                          <p className="text-slate-350 leading-normal font-sans text-xs">{item.description}</p>
                        </div>

                        {/* EXPLICIT STATUS BADGES */}
                        <div className="sm:text-right shrink-0">
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                            status === "revision_requested"
                              ? "bg-amber-950 text-amber-300 border-amber-900"
                              : status === "rejected"
                              ? "bg-rose-950 text-rose-300 border-rose-900"
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }`}>
                            {status === "revision_requested"
                              ? "⏳ Korrektur angefordert"
                              : status === "rejected"
                              ? "Abgelehnt / Gesperrt"
                              : "Prüfung ausstehend"}
                          </span>
                        </div>
                      </div>

                      {/* COLLAPSIBLE INTERNAL FULL TEXT CONTENT VIEW */}
                      {item.localContent && (
                        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 text-[11px] leading-relaxed max-h-32 overflow-y-auto font-mono text-slate-400">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">INHALTS-VOLLTEXT:</span>
                          {item.localContent}
                        </div>
                      )}

                      {/* ACTION CONTROLS */}
                      <div className="pt-3 border-t border-slate-900/60 flex flex-col sm:flex-row gap-3 justify-between sm:items-center text-xs">
                        <span className="text-slate-400">Urheber: <span className="font-bold text-slate-200">{item.author || "Anonym"}</span></span>
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            onClick={() => handleUpdateItemStatus(item.id, "approved")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-5 py-3 rounded-xl transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                          >
                            ✓ Freigeben für Kinder
                          </button>
                          <button
                            onClick={() => handleUpdateItemStatus(item.id, "revision_requested")}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] px-5 py-3 rounded-xl transition shadow-lg shadow-amber-950/40 cursor-pointer"
                          >
                            📖 Überarbeitung anfordern
                          </button>
                          <button
                            onClick={() => handleUpdateItemStatus(item.id, "rejected")}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] px-5 py-3 rounded-xl transition shadow-lg shadow-rose-950/40 cursor-pointer"
                          >
                            ❌ Beitrag ablehnen
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: COMPREHENSIVE USER MANAGER */}
        {adminTab === "benutzer" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 font-sans text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Benutzerprofile &amp; Berechtigungen
              </h3>
              <p className="text-xs text-slate-400">Verwalten Sie hier spielerisch, welche Eltern, Lehrkräfte oder Kinder Zugriff auf die Lernbibliothek haben.</p>
            </div>

            {/* CREATE USER COLLAPSIBLE FORM */}
            <form onSubmit={handleCreateSimulatedUser} className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-4">
              <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">Neues Mitglied hinzufügen</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">NAME DES NUTZERS</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Christian Binder"
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 text-xs rounded-xl text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">E-MAIL-ADRESSE</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="binder@medienakut.de"
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 text-xs rounded-xl text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold text-[10px]">ZUGANGSLEVEL</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      setNewUserRole(e.target.value as any);
                      setNewUserGroup(e.target.value === "admin" ? "Administrator" : e.target.value === "provider" ? "Lehrkräfte" : "Jugendliche");
                    }}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 text-xs rounded-xl text-stone-100"
                  >
                    <option value="youth">Jugendlicher (U18)</option>
                    <option value="provider">Erzieher (Eltern/Lehrer)</option>
                    <option value="admin">Administrator (Zentrale 👑)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-3 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-indigo-600/10 h-[38px] flex items-center justify-center"
                >
                  ➕ Mitglied anlegen
                </button>
              </div>
            </form>

            {/* USERS TABLES */}
            <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/40">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-950 font-bold border-b border-slate-850 text-slate-400">
                    <th className="p-3">BENUTZERNAME</th>
                    <th className="p-3">GRUPPE</th>
                    <th className="p-3">ZUGRIFFS-ROLLE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">AKTIONEN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {simulatedUsers.map((u) => (
                    <tr key={u.id} className="text-slate-300 hover:bg-slate-900/30">
                      <td className="p-3 font-semibold">
                        {u.name}
                        <span className="block font-mono text-[9px] text-slate-500 mt-0.5">{u.email}</span>
                      </td>
                      <td className="p-3 text-slate-400">{u.group}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => changeUserRole(u.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 text-[11px] p-1 rounded text-white"
                        >
                          <option value="admin">Admin (👑)</option>
                          <option value="provider">Provider (🍎)</option>
                          <option value="youth">Youth (U18)</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          u.status === "Aktiv" ? "bg-emerald-950 text-emerald-300 border border-emerald-900" : "bg-rose-950 text-rose-300 border border-rose-900"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right flex gap-1 justify-end">
                        <button
                          onClick={() => toggleUserStatus(u.id, u.name, u.status)}
                          className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${
                            u.status === "Aktiv" ? "bg-red-950/50 hover:bg-red-900/50 text-red-200" : "bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-200"
                          }`}
                        >
                          {u.status === "Aktiv" ? "Sperren" : "Entsperren"}
                        </button>
                        <button
                          onClick={() => deleteSimulatedUser(u.id, u.name)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* SUBTAB 3: CHARTS STATS */}
        {adminTab === "stats" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 font-sans">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                📚 Bibliotheks-Übersicht &amp; Themenvielfalt
              </h3>
              <p className="text-xs text-slate-400">Verfolgen Sie das Wachstum und die Verteilung Ihrer Lernmaterialien nach Fächern.</p>
            </div>

            {/* KI TEST DATA BOOSTER */}
            {handleGenerateTestContent && (
              <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/60 border border-indigo-850/80 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-3 py-1 rounded-full border border-indigo-700/50 uppercase tracking-wider inline-block">
                      Intelligente Inhalts-Kuration
                    </span>
                    <h4 className="text-base font-bold text-white flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Ganze Bibliothek auf Knopfdruck befüllen
                    </h4>
                    <p className="text-xs text-slate-300 leading-normal max-w-2xl">
                      Generieren Sie sofort für <strong>alle 6 Hauptthemengebiete</strong> einen faszinierenden, kindgerechten Bildungsartikel und 12 Quizaufgaben live mit der Google Gemini-Schnittstelle. Ideal, um die gesamte Plattform und Interaktionen sofort einsatzbereit zu machen.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateTestContent}
                    disabled={generatingTestContent}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-6 py-4 rounded-2xl flex items-center gap-2 transition whitespace-nowrap cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/20 hover:scale-102 transform duration-200"
                  >
                    {generatingTestContent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Inhalte werden generiert...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
                        Lernfächer befüllen (Gemini AI)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* BENTO STAT BLOCKS */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Artikel Gesamt</span>
                <span className="text-xl md:text-2xl font-black text-white block mt-1">{libraryItemsList.length}</span>
              </div>
              <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-sans text-emerald-400">Für Kinder lesbar</span>
                <span className="text-xl md:text-2xl font-black text-emerald-400 block mt-1">{liveItems.length}</span>
              </div>
              <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider text-amber-400">In Prüfung</span>
                <span className="text-xl md:text-2xl font-black text-amber-400 block mt-1">{reviewQueue.length}</span>
              </div>
            </div>

            {/* BAR CHART RECHARTS */}
            <div className="bg-slate-950 border border-slate-855 rounded-3xl p-4 h-[240px]">
              <span className="text-[10px] text-slate-400 block font-bold mb-3 font-mono uppercase">Medien-Breakdown nach Fachgebieten</span>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", border: "1px style #334155", borderRadius: "10px", fontSize: "11px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SUBTAB 4: BACKUP & RESTORE PROCESS */}
        {adminTab === "sicherungen" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
            
            {/* BACKUP COMPONENT */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Sicherungskopie erstellen
                </h3>
                <p className="text-xs text-slate-400">Erstellen Sie ein vollständiges Sicherheitsabbild Ihres Wissensarchivs.</p>
              </div>

              {/* DISK USAGE */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Belegter Archivspeicher</span>
                  <strong>{totalFileSizeMb} MB von {backupLimit.toFixed(1)} GB</strong>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${(parseFloat(totalFileSizeMb) / (backupLimit * 1024)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* BACKUP STEP GRAPH */}
              {backupStep > 0 && (
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-300 animate-pulse">Sicherung läuft...</span>
                    <span className="font-mono text-[10px] text-slate-500">Stufe: {backupStep} / 4</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-350"
                      style={{ width: `${(backupStep / 4) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-300 block">
                    {backupStep === 1 && "⏳ Bereite Bildungsdaten für die Sicherung vor..."}
                    {backupStep === 2 && "⚡ Kopiere Wissenskarten &amp; Artikeltexte..."}
                    {backupStep === 3 && "📦 Komprimiere Datenpaket in die Cloud..."}
                    {backupStep === 4 && "✅ Archivierung erfolgreich und sicher abgeschlossen!"}
                  </span>
                </div>
              )}

              <button
                onClick={triggerFullSystemBackup}
                disabled={backupLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl text-xs transition relative cursor-pointer shadow-lg shadow-indigo-950/20"
              >
                📥 Datensicherung jetzt starten
              </button>
            </div>

            {/* SECURITY PARENTAL PIN CONFIG */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div>
                <h3 className="font-bold text-white text-base">Jugendschutz-Einstellungen ⚙️</h3>
                <p className="text-xs text-slate-400">Verwalten Sie hier Sicherheitsregeln für die Kinderschnittstelle.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <label className="block text-slate-300 font-bold block uppercase tracking-wider text-[10px]">ELTERN-SCHRANKE PIN CODE</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={parentPin}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        setParentPin(e.target.value);
                        addUiLog(`Eltern-PIN auf "${e.target.value}" abgeändert.`, "info");
                      }
                    }}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-center text-lg font-mono tracking-widest text-white font-black focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Geben Sie eine 4-stellige Zahlenkombination an (Standard: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">1234</code>).</p>
                </div>

                <div className="space-y-3 border-t border-slate-800/80 pt-4">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">Zugelassene Medienformate</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900">
                      <span className="text-slate-300">Film- und Videotutorials erlauben</span>
                      <input type="checkbox" checked={allowVideos} onChange={(e) => setAllowVideos(e.target.checked)} className="cursor-pointer w-4 h-4 rounded text-indigo-600 bg-slate-900 focus:ring-0" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900">
                      <span className="text-slate-300">Hörspiele &amp; Audiobooks freigeben</span>
                      <input type="checkbox" checked={allowAudio} onChange={(e) => setAllowAudio(e.target.checked)} className="cursor-pointer w-4 h-4 rounded text-indigo-600 bg-slate-900 focus:ring-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
