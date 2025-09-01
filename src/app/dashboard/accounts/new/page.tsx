// file: app/dashboard/accounts/new/page.tsx

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import FileUploader from "@/components/FileUploader";
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from "lucide-react";

const accountTypes = [
  { value: "email", label: "📧 Email" },
  { value: "instagram", label: "📷 Instagram" },
  { value: "facebook", label: "📘 Facebook" },
  { value: "tiktok", label: "🎵 Tiktok" },
  { value: "sosmed", label: "📱 Social Media" },
  { value: "efootball", label: "🎮 eFootball" },
  { value: "lainnya", label: "📂 Lainnya" },
];

export default function NewAccountPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("lainnya");
  const [status, setStatus] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // State untuk melacak upload
  const [showPassword, setShowPassword] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("accounts")
      .insert([
        {
          email,
          password,
          notes,
          type,
          status,
          attachment_url: attachmentUrl,
        },
      ]);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Gagal membuat akun baru: " + error.message);
    } else {
      alert("Akun baru berhasil dibuat!");
      router.push("/dashboard/accounts");
      router.refresh(); // Memuat ulang data di halaman daftar
    }
  };

  const getButtonText = () => {
    if (saving) return "Menyimpan...";
    if (isUploading) return "Mengunggah file...";
    return "Simpan Akun";
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition group mb-4"
          >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Kembali</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Tambah Akun Baru</h1>
          <p className="text-slate-500 mt-1">Isi detail di bawah untuk menambahkan akun baru.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Tipe Akun</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800">
                {accountTypes.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input id="email" type="email" placeholder="contoh@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full p-2 pr-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-indigo-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {type === "efootball" && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <input id="status" type="text" placeholder="Contoh: Aman, Terkait, dll." value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800"/>
              </div>
            )}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
              <textarea id="notes" placeholder="Informasi tambahan, pertanyaan keamanan, dll." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lampiran (Opsional)</label>
              <FileUploader onUpload={setAttachmentUrl} onUploading={setIsUploading} />
            </div>
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => router.back()} disabled={saving || isUploading}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed">
                Batal
              </button>
              <button type="submit" disabled={saving || isUploading}
                className="inline-flex items-center justify-center gap-2 w-36 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {(saving || isUploading) && <Loader2 size={16} className="animate-spin" />}
                <span>{getButtonText()}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}