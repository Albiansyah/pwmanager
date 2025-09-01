// file: app/dashboard/accounts/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, Search, FileDown, Edit, Trash2, ArrowLeft } from "lucide-react";

interface Account {
  id: number;
  email: string;
  password: string;
  notes: string | null;
  attachment_url: string | null;
  type: string;
  status?: string | null;
  user_id?: string; // Pastikan ini ada jika Anda sudah menerapkan RLS
}

const typeLabels: Record<string, string> = {
  email: "📧 Email Accounts",
  instagram: "📷 Instagram Accounts",
  facebook: "📘 Facebook Accounts",
  tiktok: "🎵 Tiktok Accounts",
  sosmed: "📱 Social Media Accounts",
  efootball: "🎮 eFootball Accounts",
  lainnya: "📂 Lainnya",
};

// REVISI: Definisikan tab dan grupnya
const tabs = [
    { id: 'all', label: 'Semua Akun' },
    { id: 'email', label: 'Email' },
    { id: 'gaming', label: 'eFootball' },
    { id: 'social', label: 'Sosial Media' },
    { id: 'other', label: 'Lainnya' },
];

const socialMediaTypes = ['instagram', 'facebook', 'tiktok', 'sosmed'];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const router = useRouter();

  // REVISI: State untuk tab yang aktif
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    // Jika Anda sudah menerapkan RLS per user, aktifkan baris di bawah
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) { router.push('/login'); return; }

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      // .eq('user_id', user.id) // Filter berdasarkan user yang login
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(error);
    } else {
      setAccounts(data as Account[]);
    }
    setLoading(false);
  };

  const getSignedUrl = async (path: string) => { /* ... (tidak berubah) ... */ const { data, error } = await supabase.storage.from("attachments").createSignedUrl(path, 3600); if (error) { console.error(error); return null; } return data.signedUrl; };
  const handleDownload = async (e: React.MouseEvent, path: string | null) => { /* ... (tidak berubah) ... */ e.stopPropagation(); if (!path) return; const url = await getSignedUrl(path); if (url) { window.open(url, "_blank"); } };
  const handleDelete = async (e: React.MouseEvent, id: number) => { /* ... (tidak berubah) ... */ e.stopPropagation(); if (!confirm("Anda yakin ingin menghapus akun ini secara permanen?")) return; const { error } = await supabase.from("accounts").delete().eq("id", id); if (error) { alert("Gagal menghapus akun: " + error.message); } else { setAccounts(accounts.filter((acc) => acc.id !== id)); alert("Akun berhasil dihapus."); } };
  const toggleShowPassword = (e: React.MouseEvent, id: number) => { /* ... (tidak berubah) ... */ e.stopPropagation(); setShowPassword(prev => ({ ...prev, [id]: !prev[id] })); };
  
  const handleExport = () => {
    const dataToExport = activeTab === 'all' ? accounts : accounts.filter(acc => {
        if (activeTab === 'email') return acc.type === 'email';
        if (activeTab === 'gaming') return acc.type === 'efootball';
        if (activeTab === 'social') return socialMediaTypes.includes(acc.type);
        if (activeTab === 'other') return acc.type === 'lainnya';
        return true;
    });

    const csvHeader = "Type,Email,Password,Notes,Status\n";
    const csvRows = dataToExport.map(acc => `"${acc.type}","${acc.email}","${acc.password}","${(acc.notes || "").replace(/"/g, '""')}","${acc.status || ""}"`);
    const csvContent = csvHeader + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `accounts_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredAccounts = accounts.filter(acc => acc.email.toLowerCase().includes(search.toLowerCase()) || (acc.notes?.toLowerCase() || "").includes(search.toLowerCase()) );

  const groupedAccounts = useMemo(() => {
    return filteredAccounts.reduce((groups: Record<string, Account[]>, account) => {
        const type = account.type?.toLowerCase() || "lainnya";
        if (!groups[type]) groups[type] = [];
        groups[type].push(account);
        return groups;
    }, {});
  }, [filteredAccounts]);

  // REVISI: Memo untuk memfilter grup mana yang akan ditampilkan
  const displayedGroups = useMemo(() => {
    if (activeTab === 'all') return groupedAccounts;
    
    const newDisplayedGroups: Record<string, Account[]> = {};
    Object.keys(groupedAccounts).forEach(type => {
        if (activeTab === 'email' && type === 'email') newDisplayedGroups[type] = groupedAccounts[type];
        if (activeTab === 'gaming' && type === 'efootball') newDisplayedGroups[type] = groupedAccounts[type];
        if (activeTab === 'social' && socialMediaTypes.includes(type)) newDisplayedGroups[type] = groupedAccounts[type];
        if (activeTab === 'other' && type === 'lainnya') newDisplayedGroups[type] = groupedAccounts[type];
    });
    return newDisplayedGroups;
  }, [activeTab, groupedAccounts]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition group mb-6">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali ke Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Akun</h1>
          <p className="text-slate-500 mt-1">Kelola semua akun Anda di satu tempat.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input type="text" placeholder="Cari email atau catatan..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 pl-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 transition text-slate-800"/>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={handleExport} className="flex-1 sm:flex-initial w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 shadow-sm transition whitespace-nowrap">
              <FileDown size={16} /> Export
            </button>
            <button onClick={() => router.push("/dashboard/accounts/new")} className="flex-1 sm:flex-initial w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition whitespace-nowrap">
              <Plus size={16} /> Tambah Akun
            </button>
          </div>
        </div>

        {/* REVISI: Navigasi Tab */}
        <div className="border-b border-slate-200 mb-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                            activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>


        {/* Content */}
        {loading ? (
          <div className="text-center py-10"><p className="text-slate-500">Memuat data akun...</p></div>
        ) : Object.keys(displayedGroups).length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <p className="text-slate-500">{search ? 'Tidak ada akun yang cocok dengan pencarian Anda.' : 'Tidak ada akun untuk kategori ini.'}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.keys(displayedGroups).map((type) => (
              <div key={type}>
                <h3 className="text-xl font-semibold mb-4 text-slate-700">{typeLabels[type] || typeLabels["lainnya"]}</h3>
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-100 text-xs text-slate-500 uppercase">
                      <tr>
                        <th scope="col" className="p-4">Email</th>
                        <th scope="col" className="p-4">Password</th>
                        <th scope="col" className="p-4">Catatan</th>
                        {type === "efootball" && <th scope="col" className="p-4">Status</th>}
                        <th scope="col" className="p-4">Attachment</th>
                        <th scope="col" className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedGroups[type].map((acc) => (
                        <tr key={acc.id} className="bg-white border-b border-slate-200 hover:bg-slate-50 transition cursor-pointer" onClick={() => router.push(`/dashboard/accounts/${acc.id}`)}>
                          <td className="p-4 font-medium text-slate-900 break-all">{acc.email}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span>{showPassword[acc.id] ? acc.password : "••••••••"}</span>
                              <button onClick={(e) => toggleShowPassword(e, acc.id)} className="text-slate-400 hover:text-indigo-600" title={showPassword[acc.id] ? "Sembunyikan" : "Tampilkan"}>
                                {showPassword[acc.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 max-w-xs truncate">{acc.notes || "-"}</td>
                          {type === "efootball" && <td className="p-4">{acc.status || "-"}</td>}
                          <td className="p-4">
                            {acc.attachment_url ? (
                              <button onClick={(e) => handleDownload(e, acc.attachment_url)} className="font-medium text-indigo-600 hover:underline">Download</button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex items-center justify-end gap-4">
                               <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/accounts/edit/${acc.id}`); }} className="text-slate-500 hover:text-green-600" title="Edit"><Edit size={16} /></button>
                               <button onClick={(e) => handleDelete(e, acc.id)} className="text-slate-500 hover:text-red-600" title="Hapus"><Trash2 size={16} /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}