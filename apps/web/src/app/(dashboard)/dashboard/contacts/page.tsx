"use client";

import { useState, useEffect } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  Users,
  UserPlus,
  Upload,
  FolderPlus,
  Search,
  Trash2,
  Edit2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Plus,
  X,
} from "lucide-react";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";

interface ContactGroup {
  id: string;
  name: string;
  color: string;
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  groupId: string | null;
  groupName?: string;
  customVariables?: Record<string, any>;
  notes?: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");

  const confirm = useConfirm();

  // Add Contact Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactGroupId, setContactGroupId] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [contactCity, setContactCity] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Group Management Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#10b981");
  const [savingGroup, setSavingGroup] = useState(false);

  // Import CSV Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawCsvText, setRawCsvText] = useState("");
  const [targetImportGroup, setTargetImportGroup] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/contacts", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (selectedGroup !== "ALL") url.searchParams.set("groupId", selectedGroup);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setContacts(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/contacts/groups");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGroups(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [selectedGroup]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone.trim()) return;

    setSavingContact(true);
    setContactError(null);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          phoneNumber: contactPhone,
          groupId: contactGroupId || null,
          notes: contactNotes || null,
          customVariables: contactCity ? { kota: contactCity } : {},
        }),
      });
      const json = await res.json();

      if (json.success) {
        setIsAddModalOpen(false);
        setContactName("");
        setContactPhone("");
        setContactGroupId("");
        setContactNotes("");
        setContactCity("");
        fetchContacts();
      } else {
        setContactError(json.error || "Gagal menambahkan kontak");
      }
    } catch (err: any) {
      setContactError(err.message || "Network error");
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus Kontak",
      message: "Apakah Anda yakin ingin menghapus kontak ini dari buku kontak?",
      confirmText: "Ya, Hapus",
      variant: "danger",
    });
    if (!isConfirmed) return;

    // Optimistic UI
    setContacts((prev) => prev.filter((c) => c.id !== id));

    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      fetchContacts();
    } catch (err) {
      console.error("Failed to delete contact", err);
      fetchContacts();
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setSavingGroup(true);
    try {
      const res = await fetch("/api/contacts/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, color: newGroupColor }),
      });
      const json = await res.json();
      if (json.success) {
        setNewGroupName("");
        fetchGroups();
      }
    } catch (err) {
      console.error("Failed to create group", err);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Hapus Grup",
      message: "Hapus grup ini? Kontak yang ada di dalam grup ini tidak akan ikut terhapus.",
      confirmText: "Ya, Hapus Grup",
      variant: "danger",
    });
    if (!isConfirmed) return;

    // Optimistic UI
    setGroups((prev) => prev.filter((g) => g.id !== id));

    try {
      await fetch(`/api/contacts/groups/${id}`, { method: "DELETE" });
      fetchGroups();
      fetchContacts();
    } catch (err) {
      console.error("Failed to delete group", err);
      fetchGroups();
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCsvText.trim()) return;

    setImporting(true);
    setImportResult(null);

    // Parse CSV / Line-by-line format
    const lines = rawCsvText.trim().split("\n");
    const parsedItems: any[] = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Check if CSV with comma or tab or semicolon
      let parts = cleanLine.includes(",")
        ? cleanLine.split(",")
        : cleanLine.includes(";")
        ? cleanLine.split(";")
        : cleanLine.split("\t");

      parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ""));

      if (parts.length >= 2) {
        // Format: Nama, Nomor, [Kota/Variabel]
        parsedItems.push({
          name: parts[0],
          phoneNumber: parts[1],
          groupName: targetImportGroup || undefined,
          customVariables: parts[2] ? { kota: parts[2] } : {},
        });
      } else if (parts.length === 1 && parts[0].length >= 8) {
        // Format: Nomor only
        parsedItems.push({
          phoneNumber: parts[0],
          groupName: targetImportGroup || undefined,
        });
      }
    });

    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: parsedItems }),
      });
      const json = await res.json();

      if (json.success) {
        setImportResult(json.data);
        setRawCsvText("");
        fetchContacts();
        fetchGroups();
      }
    } catch (err) {
      console.error("Failed to import", err);
    } finally {
      setImporting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts();
  };

  return (
    <PlanFeatureGuard
      feature="contacts"
      featureName="Contacts & Groups Management"
      minPlanName="Starter"
      description="Fitur Manajemen Kontak & Grup memungkinkan Anda menyimpan database pelanggan tanpa batas, mengorganisasi label grup target, dan mengimpor kontak dari CSV."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts & Groups</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Kelola buku kontak pelanggan, label grup, dan import data massal untuk kampanye broadcast.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="btn btn-outline btn-sm gap-1.5"
          >
            <FolderPlus className="w-4 h-4" /> Kelola Grup
          </button>
          <button
            onClick={() => {
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="btn btn-outline btn-sm gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
          >
            <Upload className="w-4 h-4" /> Import CSV / Excel
          </button>
          <button
            onClick={() => {
              setContactError(null);
              setIsAddModalOpen(true);
            }}
            className="btn btn-primary btn-sm gap-1.5 shadow-md shadow-primary/25"
          >
            <UserPlus className="w-4 h-4" /> Tambah Kontak
          </button>
        </div>
      </div>

      {/* Group Tags Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedGroup("ALL")}
          className={`btn btn-sm rounded-full gap-1.5 font-medium ${
            selectedGroup === "ALL" ? "btn-primary" : "btn-ghost bg-base-200"
          }`}
        >
          Semua Kontak
          <span className="badge badge-sm badge-ghost">{contacts.length}</span>
        </button>
        {groups.map((grp) => (
          <button
            key={grp.id}
            onClick={() => setSelectedGroup(grp.id)}
            className={`btn btn-sm rounded-full gap-1.5 font-medium ${
              selectedGroup === grp.id
                ? "btn-primary"
                : "btn-ghost bg-base-200 hover:bg-base-300"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: grp.color || "#10b981" }}
            ></span>
            {grp.name}
          </button>
        ))}
      </div>

      {/* Contacts Table Card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-base-content/40" />
            <input
              type="text"
              placeholder="Cari nama, nomor, atau catatan..."
              className="input input-bordered input-sm w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="text-xs text-base-content/60 font-medium">
            Menampilkan {contacts.length} kontak
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-base-content/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar kontak...
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-sm">Belum Ada Kontak</div>
              <p className="text-xs text-base-content/50 mt-0.5">
                Tambahkan kontak manual atau import dari file CSV untuk mulai broadcast.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="btn btn-outline btn-sm gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Import CSV
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary btn-sm gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Tambah Kontak
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-200/50 text-xs">
                  <th>Nama Kontak</th>
                  <th>Nomor WhatsApp</th>
                  <th>Grup / Label</th>
                  <th>Variabel Kustom</th>
                  <th>Catatan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="text-xs hover:bg-base-200/30">
                    <td className="font-semibold text-base-content">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px]">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="font-mono font-medium">+{c.phoneNumber}</td>
                    <td>
                      {c.groupName ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {c.groupName}
                        </span>
                      ) : (
                        <span className="text-base-content/40">-</span>
                      )}
                    </td>
                    <td>
                      {c.customVariables && Object.keys(c.customVariables).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(c.customVariables).map(([k, v]) => (
                            <span key={k} className="badge badge-xs badge-ghost text-[10px]">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-base-content/40">-</span>
                      )}
                    </td>
                    <td className="text-base-content/60 max-w-xs truncate">
                      {c.notes || "-"}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        title="Hapus Kontak"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tambah Kontak Baru */}
      {isAddModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Tambah Kontak Baru
                </h3>
                <button
                  type="button"
                  onClick={() => !savingContact && setIsAddModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              {contactError && (
                <div className="alert alert-error text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{contactError}</span>
                </div>
              )}

              <form onSubmit={handleAddContact} className="space-y-3.5 mt-2">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Nama Lengkap</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    className="input input-bordered w-full text-sm"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Nomor WhatsApp</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    className="input input-bordered w-full text-sm font-mono"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Grup / Label</span>
                  </label>
                  <select
                    className="select select-bordered w-full text-sm"
                    value={contactGroupId}
                    onChange={(e) => setContactGroupId(e.target.value)}
                  >
                    <option value="">(Tanpa Grup)</option>
                    {groups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Kota / Variabel (Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jakarta / Surabaya"
                    className="input input-bordered w-full text-sm"
                    value={contactCity}
                    onChange={(e) => setContactCity(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Catatan Tambahan (Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pelanggan order via Shopee"
                    className="input input-bordered w-full text-sm"
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={savingContact}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm gap-2"
                    disabled={savingContact || !contactPhone.trim()}
                  >
                    {savingContact && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan Kontak
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Kelola Grup */}
      {isGroupModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-primary" />
                  Kelola Grup Kontak
                </h3>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              {/* Existing Groups List */}
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {groups.map((grp) => (
                  <div
                    key={grp.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-base-200/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: grp.color || "#10b981" }}
                      ></span>
                      <span className="font-semibold text-base-content">{grp.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(grp.id)}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Group Form */}
              <form onSubmit={handleCreateGroup} className="space-y-3 mt-4 pt-3 border-t border-base-200">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Tambah Grup Baru</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nama grup (e.g. Member Gold)"
                      className="input input-bordered input-sm flex-1 text-xs"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                    />
                    <input
                      type="color"
                      className="w-10 h-8 p-0 rounded-lg border border-base-300 cursor-pointer"
                      value={newGroupColor}
                      onChange={(e) => setNewGroupColor(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm gap-1"
                      disabled={savingGroup || !newGroupName.trim()}
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsGroupModalOpen(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Import CSV / Excel */}
      {isImportModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-base-100 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-4 shadow-2xl border border-base-200 my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Import Kontak Massal (CSV / Teks)
                </h3>
                <button
                  type="button"
                  onClick={() => !importing && setIsImportModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              {importResult && (
                <div className="alert alert-success text-xs text-white my-3 space-y-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <div>
                    <strong>Berhasil Mengimpor Kontak!</strong>
                    <div>
                      {importResult.imported} kontak baru berhasil ditambahkan ({importResult.skipped} duplikat/invalid dilewati).
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleImportCsv} className="space-y-4 mt-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Masukkan ke Grup (Opsional)</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full text-xs"
                    value={targetImportGroup}
                    onChange={(e) => setTargetImportGroup(e.target.value)}
                  >
                    <option value="">Grup Bawaan (Otomatis)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">
                      Tempel Data CSV / Nomor Baris per Baris:
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder={`Contoh Format:\nBudi Santoso, 081234567890, Jakarta\nSiti Rahmawati, 085712345678, Surabaya\nAhmad Fauzi, 089698765432, Bandung\n\nAtau cukup masukkan nomor saja:\n081234567890\n085712345678`}
                    className="textarea textarea-bordered font-mono text-xs w-full"
                    value={rawCsvText}
                    onChange={(e) => setRawCsvText(e.target.value)}
                    required
                  ></textarea>
                  <label className="label py-1">
                    <span className="label-text-alt text-base-content/50 text-[11px]">
                      Format baris: <code>Nama, Nomor_WhatsApp, Kota/Variabel</code> atau nomor saja.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={importing}
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm gap-2"
                    disabled={importing || !rawCsvText.trim()}
                  >
                    {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Proses & Impor Sekarang
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  </PlanFeatureGuard>
  );
}
