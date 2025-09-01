// file: app/dashboard/accounts/edit/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import FileUploader from "@/components/FileUploader";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Trash2 } from "lucide-react"; // Ditambahkan Trash2

const accountTypes = [
  { value: "email", label: "📧 Email" },
  { value: "instagram", label: "📷 Instagram" },
  { value: "facebook", label: "📘 Facebook" },
  { value: "tiktok", label: "🎵 Tiktok" },
  { value: "sosmed", label: "📱 Social Media" },
  { value: "efootball", label: "🎮 eFootball" },
  { value: "lainnya", label: "📂 Lainnya" },
];

export default function EditAccountPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("lainnya");
  const [status, setStatus] = useState("");
  
  const [newAttachmentUrl, setNewAttachmentUrl] = useState<string | null>(null);
  const [oldAttachmentUrl, setOldAttachmentUrl] = useState<string | null>(null);
  
  const [initialEmail, setInitialEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id]);

  const fetchAccount = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error(error);
      setError("Gagal memuat data akun.");
    } else {
      setEmail(data.email);
      setInitialEmail(data.email);
      setPassword(data.password);
      setNotes(data.notes || "");
      setType(data.type || "lainnya");
      setStatus(data.status || "");
      setOldAttachmentUrl(data.attachment_url || null);
      setNewAttachmentUrl(data.attachment_url || null);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Cek jika ada file baru DAN file lama, serta keduanya berbeda (artinya mengganti file)
    if (newAttachmentUrl && oldAttachmentUrl && newAttachmentUrl !== oldAttachmentUrl) {
      console.log(`Menghapus file lama: ${oldAttachmentUrl}`);
      await supabase.storage.from("attachments").remove([oldAttachmentUrl]);
    }

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        email,
        password,
        notes,
        type,
        status,
        attachment_url: newAttachmentUrl, // Simpan path yang baru (bisa jadi null jika dihapus)
      })
      .eq("id", id);

    setSaving(false);

    if (updateError) {
      console.error(updateError);
      alert("Gagal memperbarui akun: " + updateError.message);
    } else {
      alert("Akun berhasil diperbarui!");
      router.push("/dashboard/accounts");
      router.refresh();
    }
  };
  
  // REVISI: Fungsi baru untuk menghapus attachment
  const handleDeleteAttachment = async () => {
    if (!newAttachmentUrl) return;
    if (!confirm("Anda yakin ingin menghapus lampiran ini secara permanen?")) return;

    setSaving(true); // Tampilkan status loading

    // 1. Hapus file dari storage
    const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([newAttachmentUrl]);

    if (storageError) {
        alert("Gagal menghapus file dari storage. Coba lagi.");
        console.error(storageError);
        setSaving(false);
        return;
    }

    // 2. Kosongkan state di UI agar FileUploader muncul kembali
    setNewAttachmentUrl(null);
    setOldAttachmentUrl(null); // Penting agar tidak dianggap mengganti file saat update
    alert("Lampiran berhasil dihapus. Jangan lupa klik 'Update Akun' untuk menyimpan perubahan.");
    setSaving(false);
  };

  if (loading) { return <div className="flex justify-center items-center min-h-screen bg-slate-50"><p className="text-slate-500">Memuat form...</p></div>; }
  if (error) { return <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4"><div className="text-center"><h2 className="text-xl font-semibold text-slate-800">Terjadi Kesalahan</h2><p className="mt-2 text-slate-500">{error}</p><button onClick={() => router.push("/dashboard/accounts")} className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"><ArrowLeft size={16} />Kembali</button></div></div>; }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition group mb-4">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Kembali</span>
            </button>
          <h1 className="text-3xl font-bold text-slate-800">Edit Akun</h1>
          <p className="text-slate-500 mt-1">Memperbarui detail untuk <span className="font-semibold text-slate-600">{initialEmail}</span></p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Tipe Akun</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition text-slate-800">
                {accountTypes.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input id="email" type="email" placeholder="contoh@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition text-slate-800"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 pr-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition text-slate-800"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-indigo-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {type === "efootball" && ( <div> <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label> <input id="status" type="text" placeholder="Contoh: Aman, Terkait, dll." value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition text-slate-800"/> </div> )}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
              <textarea id="notes" placeholder="Informasi tambahan, pertanyaan keamanan, dll." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition text-slate-800"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lampiran</label>
              
              {/* REVISI: Tampilkan FileUploader HANYA jika tidak ada file */}
              {!newAttachmentUrl && (
                  <FileUploader onUpload={setNewAttachmentUrl} onUploading={setIsUploading} />
              )}

              {/* REVISI: Tampilkan preview & tombol hapus JIKA ADA file */}
              {newAttachmentUrl && (
                <div className="mt-2 flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm text-slate-600 truncate">
                    File saat ini: <span className="font-medium text-indigo-600">{newAttachmentUrl.split('/').pop()}</span>
                  </span>
                  <button type="button" onClick={handleDeleteAttachment} className="ml-4 p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors" title="Hapus lampiran ini">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm">Batal</button>
              <button type="submit" disabled={saving || isUploading} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-indigo-400">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Update Akun</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}