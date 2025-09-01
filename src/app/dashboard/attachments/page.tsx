// file: app/dashboard/attachments/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, Download, Trash2, Search, FileText, X, Loader2 } from "lucide-react";

// (Interface dan Konstanta tidak berubah)
interface AttachmentInfo { accountId: number; accountEmail: string; attachmentUrl: string; fileName: string; createdAt: string; }
interface Account { id: number; email: string; type: string; }
const typeLabels: Record<string, string> = { email: "📧 Email Accounts", instagram: "📷 Instagram Accounts", facebook: "📘 Facebook Accounts", tiktok: "🎵 Tiktok Accounts", sosmed: "📱 Social Media Accounts", efootball: "🎮 eFootball Accounts", lainnya: "📂 Lainnya", };

export default function AttachmentsPage() {
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchAttachments(); }, []);

  const fetchAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("accounts").select("id, email, attachment_url, created_at").not("attachment_url", "is", null).order("created_at", { ascending: false });
    if (error) { console.error("Error fetching attachments:", error); setAttachments([]); } 
    else if (data) { const formattedData = data.map(acc => ({ accountId: acc.id, accountEmail: acc.email, attachmentUrl: acc.attachment_url, fileName: acc.attachment_url.split('/').pop() || 'Unknown File', createdAt: acc.created_at, })); setAttachments(formattedData); }
    setLoading(false);
  };

  const handleDownload = async (path: string) => {
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(path, 3600);
    if (error) { alert("Gagal membuat link unduhan."); console.error(error); } 
    else { window.open(data.signedUrl, "_blank"); }
  };

  const handleDelete = async (accountId: number, path: string) => {
    if (!confirm("Anda yakin ingin menghapus lampiran ini? Akun terkait tidak akan dihapus, hanya tautan filenya.")) return;
    const { error: storageError } = await supabase.storage.from("attachments").remove([path]);
    if (storageError) { alert("Gagal menghapus file dari storage."); console.error(storageError); return; }
    const { error: dbError } = await supabase.from("accounts").update({ attachment_url: null }).eq("id", accountId);
    if (dbError) { alert("Gagal memperbarui data akun."); console.error(dbError); } 
    else { alert("Lampiran berhasil dihapus."); fetchAttachments(); }
  };

  const filteredAttachments = attachments.filter( (att) => att.fileName.toLowerCase().includes(search.toLowerCase()) || att.accountEmail.toLowerCase().includes(search.toLowerCase()) );
  
  // Komponen Modal untuk Upload
  const UploadModal = () => {
    const [accountsWithoutAttachment, setAccountsWithoutAttachment] = useState<Account[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // REVISI: State dipecah menjadi dua
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    useEffect(() => {
      const fetchEligibleAccounts = async () => {
        const { data } = await supabase.from("accounts").select("id, email, type").is("attachment_url", null);
        if (data) setAccountsWithoutAttachment(data as Account[]);
      };
      fetchEligibleAccounts();
    }, []);

    const groupedAccounts = useMemo(() => {
      return accountsWithoutAttachment.reduce((groups, account) => {
        const type = account.type || 'lainnya';
        if (!groups[type]) { groups[type] = []; }
        groups[type].push(account);
        return groups;
      }, {} as Record<string, Account[]>);
    }, [accountsWithoutAttachment]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !selectedAccountId) { alert("Mohon pilih file dan akun terkait."); return; }
        setUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("attachments").upload(filePath, selectedFile);
        if (uploadError) { alert("Gagal mengunggah file."); console.error(uploadError); setUploading(false); return; }
        const { error: dbError } = await supabase.from("accounts").update({ attachment_url: filePath }).eq("id", selectedAccountId);
        if (dbError) { alert("Gagal menautkan file ke akun."); console.error(dbError); } 
        else { alert("File berhasil diunggah dan ditautkan!"); setIsModalOpen(false); fetchAttachments(); }
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Unggah Lampiran Baru</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-red-600"><X size={24}/></button>
                </div>
                <form onSubmit={handleUpload} className="space-y-4">
                    {/* REVISI: Dropdown Pertama - Memilih Tipe Akun */}
                    <div>
                        <label htmlFor="accountType" className="block text-sm font-medium text-slate-700 mb-1">Pilih Tipe Akun</label>
                        <select 
                            id="accountType" 
                            value={selectedType} 
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                setSelectedAccountId(''); // Reset pilihan akun jika tipe berubah
                            }} 
                            required 
                            className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        >
                            <option value="" disabled>Pilih Tipe...</option>
                            {Object.keys(groupedAccounts).map(type => (
                                <option key={type} value={type}>{typeLabels[type] || 'Lainnya'}</option>
                            ))}
                        </select>
                    </div>

                    {/* REVISI: Dropdown Kedua - Memilih Akun (tergantung pilihan pertama) */}
                    <div>
                        <label htmlFor="account" className="block text-sm font-medium text-slate-700 mb-1">Tautkan ke Akun</label>
                        <select 
                            id="account" 
                            value={selectedAccountId} 
                            onChange={(e) => setSelectedAccountId(e.target.value)} 
                            required 
                            disabled={!selectedType} // non-aktif jika tipe belum dipilih
                            className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>Pilih Akun...</option>
                            {selectedType && groupedAccounts[selectedType] ? (
                                groupedAccounts[selectedType].map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.email}</option>
                                ))
                            ) : (
                                <option disabled>Pilih tipe akun terlebih dahulu</option>
                            )}
                        </select>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pilih File</label>
                        <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} required
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </div>
                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm">Batal</button>
                        <button type="submit" disabled={uploading} className="inline-flex items-center justify-center gap-2 w-36 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-indigo-400">
                            {uploading ? <><Loader2 size={16} className="animate-spin" /> Mengunggah...</> : <><UploadCloud size={16}/> Unggah</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {isModalOpen && <UploadModal />}
        <div className="mb-8">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition group mb-6">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali ke Dashboard</span>
          </button>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Manajemen Lampiran</h1>
                <p className="text-slate-500 mt-1">Lihat, unduh, atau hapus semua file lampiran Anda.</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm">
                <UploadCloud size={18} />
                Unggah File Baru
              </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-slate-200">
           <div className="p-4 border-b border-slate-200">
             <div className="relative w-full sm:max-w-xs">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                 <input type="text" placeholder="Cari nama file atau email..." value={search} onChange={(e) => setSearch(e.target.value)}
                   className="w-full p-2 pl-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/>
             </div>
           </div>
            {loading ? ( <p className="p-6 text-center text-slate-500">Memuat data lampiran...</p> ) : 
            filteredAttachments.length === 0 ? ( <p className="p-6 text-center text-slate-500">Tidak ada lampiran yang ditemukan.</p> ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-100 text-xs text-slate-500 uppercase">
                       <tr>
                         <th scope="col" className="p-4">Nama File</th>
                         <th scope="col" className="p-4">Terhubung ke Akun</th>
                         <th scope="col" className="p-4">Tanggal Unggah</th>
                         <th scope="col" className="p-4 text-right">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="text-slate-700">
                       {filteredAttachments.map((att) => (
                         <tr key={att.accountId} className="bg-white border-b border-slate-200 hover:bg-slate-50 transition">
                           <td className="p-4 font-medium text-slate-800">
                            <div className="flex items-center gap-3">
                                <FileText size={18} className="text-slate-400 flex-shrink-0"/>
                                <span className="truncate">{att.fileName}</span>
                            </div>
                           </td>
                           <td className="p-4">{att.accountEmail}</td>
                           <td className="p-4">{new Date(att.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                           <td className="p-4 text-right">
                             <div className="flex items-center justify-end gap-4">
                               <button onClick={() => handleDownload(att.attachmentUrl)} className="text-slate-500 hover:text-indigo-600" title="Download"><Download size={16} /></button>
                               <button onClick={() => handleDelete(att.accountId, att.attachmentUrl)} className="text-slate-500 hover:text-red-600" title="Hapus"><Trash2 size={16} /></button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
               </div>
            )}
       </div>
      </div>
    </div>
  );
}