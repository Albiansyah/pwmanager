// src/app/(dashboard)/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Wallet, FileText, Users, LogOut, ArrowRight, TrendingUp, MinusCircle, UserPlus, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Helper
const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

// Interface
interface Stat {
  totalAccounts: number;
  profitLast7Days: number;
  totalSales: number;
  totalExpenses: number;
}
interface Transaction {
  id: number;
  description: string | null;
  accountEmail: string | null;
  profit: number;
  created_at: string;
  transaction_type: 'sale' | 'expense';
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat>({ totalAccounts: 0, profitLast7Days: 0, totalSales: 0, totalExpenses: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Pengguna");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // Fetch user info
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }

      // Fetch total accounts
      const { count: accountsCount, error: accountsError } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true });

      // Fetch finance data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: financeData, error: financeError } = await supabase
        .from("finance")
        .select("*, accounts(email)")
        .order("created_at", { ascending: false });

      if (accountsError || financeError) {
        console.error("Error fetching data:", accountsError || financeError);
        setLoading(false);
        return;
      }

      // Calculate stats
      let profitLast7Days = 0;
      let totalSales = 0;
      let totalExpenses = 0;

      financeData.forEach(t => {
        const transactionDate = new Date(t.created_at);
        if (t.transaction_type === 'sale') {
          totalSales += t.harga_jual;
          if (transactionDate >= sevenDaysAgo) {
            profitLast7Days += t.profit;
          }
        } else {
          totalExpenses += t.modal;
          if (transactionDate >= sevenDaysAgo) {
            profitLast7Days -= t.modal;
          }
        }
      });
      
      setStats({
        totalAccounts: accountsCount || 0,
        profitLast7Days,
        totalSales,
        totalExpenses
      });

      // Set recent transactions
      const recent = financeData.slice(0, 5).map(t => ({
        id: t.id,
        accountEmail: t.accounts?.email,
        description: t.description,
        profit: t.profit,
        created_at: t.created_at,
        transaction_type: t.transaction_type
      }));
      setRecentTransactions(recent);
      
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            </div>
            {icon}
        </div>
        <p className="text-xs text-slate-400 mt-4">{description}</p>
    </div>
  );

  const MenuCard = ({ href, icon, title, description, actionText, color }: { href: string; icon: React.ReactNode; title: string; description: string; actionText: string; color: 'indigo' | 'green' | 'purple'; }) => {
    const colorClasses = { indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-400' }, green: { bg: 'bg-green-100', text: 'text-green-600', hoverBorder: 'hover:border-green-400' }, purple: { bg: 'bg-purple-100', text: 'text-purple-600', hoverBorder: 'hover:border-purple-400' }, };
    return ( <Link href={href} className={`group flex flex-col p-6 bg-white border border-slate-200 rounded-xl shadow-md transition-all duration-300 ${colorClasses[color].hoverBorder} hover:shadow-lg hover:-translate-y-1`}> <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${colorClasses[color].bg} mb-4`}> {icon} </div> <h2 className="font-semibold text-lg text-slate-800">{title}</h2> <p className="text-sm text-slate-500 mt-1 flex-grow"> {description} </p> <div className={`mt-4 font-semibold text-sm ${colorClasses[color].text} flex items-center gap-2`}> {actionText} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /> </div> </Link> );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 mt-1">Selamat datang kembali, <span className="capitalize font-semibold">{userName}</span>! 👋</p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"> <LogOut size={16} /> <span>Logout</span> </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Akun" value={loading ? '...' : stats.totalAccounts.toString()} icon={<Users className="w-8 h-8 text-indigo-400"/>} description="Jumlah semua akun yang terdaftar."/>
            <StatCard title="Profit (7 Hari)" value={loading ? '...' : formatCurrency(stats.profitLast7Days)} icon={<TrendingUp className="w-8 h-8 text-green-400"/>} description="Profit bersih dalam seminggu terakhir."/>
            <StatCard title="Total Penjualan" value={loading ? '...' : formatCurrency(stats.totalSales)} icon={<ShoppingCart className="w-8 h-8 text-blue-400"/>} description="Total pendapatan dari semua penjualan."/>
            <StatCard title="Total Pengeluaran" value={loading ? '...' : formatCurrency(stats.totalExpenses)} icon={<MinusCircle className="w-8 h-8 text-red-400"/>} description="Total semua biaya pengeluaran."/>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side: Menu */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <MenuCard href="/dashboard/accounts" icon={<UserPlus className="w-6 h-6 text-indigo-600" />} title="Manajemen Akun" description="Pusat kendali untuk semua akun digital Anda yang aman dan terorganisir." actionText="Kelola Akun" color="indigo"/>
                <MenuCard href="/dashboard/attachments" icon={<FileText className="w-6 h-6 text-green-600" />} title="Manajemen Lampiran" description="Simpan dan organisir semua dokumen dan file penting Anda di satu tempat." actionText="Kelola Lampiran" color="green"/>
                <div className="md:col-span-2">
                    <MenuCard href="/dashboard/finance" icon={<Wallet className="w-6 h-6 text-purple-600" />} title="Manajemen Keuangan" description="Lacak dan analisis pemasukan serta pengeluaran Anda dengan alat sederhana dan laporan canggih." actionText="Lihat Keuangan" color="purple"/>
                </div>
            </div>

            {/* Right Side: Recent Transactions */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md border border-slate-200 h-full">
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Aktivitas Terbaru</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {loading ? (
                            <p className="text-sm text-slate-500 text-center py-8">Memuat transaksi...</p>
                        ) : recentTransactions.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">Belum ada transaksi.</p>
                        ) : (
                            recentTransactions.map(t => (
                                <div key={t.id} className="flex items-center gap-3">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${t.transaction_type === 'sale' ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {t.transaction_type === 'sale' ? <TrendingUp size={16} className="text-green-600"/> : <MinusCircle size={16} className="text-red-600"/>}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium text-slate-700 truncate">{t.description || t.accountEmail}</p>
                                        <p className="text-xs text-slate-400">{format(new Date(t.created_at), 'd LLL yyyy, HH:mm', {locale: idLocale})}</p>
                                    </div>
                                    <p className={`text-sm font-semibold ${t.transaction_type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(t.profit)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-200">
                        <Link href="/dashboard/finance" className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md py-2 transition">
                            Lihat Semua Transaksi <ArrowRight size={14}/>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}