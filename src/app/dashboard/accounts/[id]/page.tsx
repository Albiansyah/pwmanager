// file: app/dashboard/accounts/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, Clipboard, Download, AlertTriangle } from "lucide-react";

interface Account {
  id: number;
  email: string;
  password: string;
  notes: string | null;
  attachment_url: string | null;
  type: string;
  status?: string | null;
}

const typeLabels: Record<string, string> = {
  email: "📧 Email",
  instagram: "📷 Instagram",
  facebook: "📘 Facebook",
  tiktok: "🎵 Tiktok",
  sosmed: "📱 Social Media",
  efootball: "🎮 eFootball",
  lainnya: "📂 Lainnya",
};

export default function AccountDetailPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    if (id) {
      fetchAccount(Array.isArray(id) ? id[0] : id);
    }
  }, [id]);

  const fetchAccount = async (accountId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error) {
      console.error(error);
      setError("Akun tidak ditemukan atau terjadi kesalahan.");
      setAccount(null);
    } else {
      setAccount(data as Account);
      setError(null);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!account) return;
    if (!confirm("Anda yakin ingin menghapus akun ini secara permanen?")) return;

    const { error } = await supabase.from("accounts").delete().eq("id", account.id);
    if (error) {
      alert("Gagal menghapus akun: " + error.message);
    } else {
      alert("Akun berhasil dihapus.");
      router.push("/dashboard/accounts");
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Berhasil disalin ke clipboard!");
    }).catch(err => {
      console.error('Gagal menyalin: ', err);
    });
  };
  
  const handleDownload = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(path, 3600);
    if (error) {
      console.error(error);
      alert("Gagal membuat link download.");
    } else {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <p className="text-slate-500">Memuat detail akun...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-slate-800">Terjadi Kesalahan</h2>
            <p className="mt-2 text-slate-500">{error}</p>
            <button
                onClick={() => router.push("/dashboard/accounts")}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
                <ArrowLeft size={16} />
                Kembali ke Daftar Akun
            </button>
        </div>
      </div>
    );
  }
  
  const InfoField = ({ label, value, isPassword = false }: { label: string, value: string | null | undefined, isPassword?: boolean }) => (
    <div>
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        {isPassword && value ? (
            <div className="flex items-center gap-2 mt-1">
                <p className="text-base text-slate-800 font-mono">{showPassword ? value : '••••••••'}</p>
                <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-indigo-600">
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
                <button onClick={() => handleCopyToClipboard(value)} className="text-slate-400 hover:text-indigo-600">
                    <Clipboard size={16}/>
                </button>
            </div>
        ) : (
            <div className="flex items-center gap-2 mt-1">
                <p className="text-base text-slate-800 break-all">{value || '-'}</p>
                {value && !isPassword && (
                    <button onClick={() => handleCopyToClipboard(value)} className="text-slate-400 hover:text-indigo-600">
                        <Clipboard size={16}/>
                    </button>
                )}
            </div>
        )}
    </div>
  );


  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={() => router.push('/dashboard/accounts')}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Kembali ke Daftar</span>
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push(`/dashboard/accounts/edit/${account?.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 shadow-sm transition"
                    >
                        <Edit size={16} />
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition"
                    >
                        <Trash2 size={16} />
                        Hapus
                    </button>
                </div>
            </div>

            {/* Account Detail Card */}
            {account && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8 pb-6 border-b border-slate-200">
                    <div className="text-4xl">{typeLabels[account.type]?.split(' ')[0] || '📁'}</div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 break-all">{account.email}</h1>
                        <span className="text-sm bg-indigo-100 text-indigo-700 font-medium px-2 py-1 rounded-full">{typeLabels[account.type] || 'Lainnya'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InfoField label="Email" value={account.email} />
                    <InfoField label="Password" value={account.password} isPassword={true} />
                    
                    {account.type === 'efootball' && (
                        <div>
                            <h3 className="text-sm font-medium text-slate-500">Status</h3>
                            <p className="mt-1">
                                {account.status ? (
                                     <span className="text-sm bg-green-100 text-green-700 font-medium px-2 py-1 rounded-full">{account.status}</span>
                                ) : '-'}
                            </p>
                        </div>
                    )}
                    
                    <div>
                        <h3 className="text-sm font-medium text-slate-500">Attachment</h3>
                        {account.attachment_url ? (
                            <button
                                onClick={() => handleDownload(account.attachment_url)}
                                className="mt-1 inline-flex items-center gap-2 text-indigo-600 hover:underline"
                            >
                                <Download size={16}/>
                                Download File Lampiran
                            </button>
                        ) : (
                            <p className="mt-1 text-slate-800">-</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-slate-500">Catatan</h3>
                        <p className="mt-1 text-base text-slate-700 whitespace-pre-wrap">{account.notes || '-'}</p>
                    </div>

                </div>
            </div>
            )}
        </div>
    </div>
  );
}