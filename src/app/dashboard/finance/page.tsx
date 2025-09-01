// file: app/dashboard/finance/page.tsx

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { format, subMonths, subYears } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { ArrowLeft, Edit, Trash2, TrendingUp, Wallet, Search, Plus, Save, X, MinusCircle, Calendar as CalendarIcon, FileSpreadsheet, FileText, ChevronDown, Loader2 } from "lucide-react";

// Interface dan helper function
interface Finance { id: number; modal: number; harga_jual: number; profit: number; fee: number | null; created_at: string; transaction_type: 'sale' | 'expense'; description: string | null; platform: string | null; platform_detail: string | null; }
const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
const platforms = ["E-Money", "Bank", "Qris", "Tunai", "Lainnya"];
const eWallets = ["Dana", "GoPay", "OVO", "ShopeePay", "Lainnya"];
const banks = ["BCA", "BRI", "BNI", "Seabank", "Mandiri", "Jago", "Lainnya"];
const dayPickerStyles = { caption_label: { color: '#1e293b' }, head: { color: '#475569' }, day: { color: '#334155' }, day_selected: { backgroundColor: '#4338ca', color: '#ffffff', fontWeight: 'bold' }, day_today: { color: '#4f46e5', fontWeight: 'bold' }, day_outside: { color: '#94a3b8' }, };

export default function FinancePage() {
  const [records, setRecords] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);

  const [transactionType, setTransactionType] = useState<'sale' | 'expense'>('sale');
  const [modal, setModal] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [fee, setFee] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [platformDetail, setPlatformDetail] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [isFormDatePickerOpen, setIsFormDatePickerOpen] = useState(false);
  const formDatePickerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) { setIsDatePickerOpen(false); }
      if (formDatePickerRef.current && !formDatePickerRef.current.contains(event.target as Node)) { setIsFormDatePickerOpen(false); }
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) { setIsDeleteMenuOpen(false); }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { fetchFinance(); }, []);
  useEffect(() => { setPlatformDetail(""); }, [platform]);

  const fetchFinance = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("finance").select("*").order('created_at', { ascending: false });
    if (error) console.error("Error fetching finance:", error);
    else setRecords(data as Finance[]);
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const searchText = search.toLowerCase();
      const recordDate = new Date(r.created_at);
      if (dateRange?.from && recordDate < dateRange.from) return false;
      if (dateRange?.to) { const toDate = new Date(dateRange.to); toDate.setHours(23, 59, 59, 999); if (recordDate > toDate) return false; }
      const desc = r.description?.toLowerCase() || "";
      return ( desc.includes(searchText) || r.modal.toString().includes(searchText) || r.harga_jual.toString().includes(searchText) );
    });
  }, [records, search, dateRange]);

  const calculateSummary = (data: Finance[]) => {
    let totalJual = 0;
    let totalExpense = 0;
    let totalFee = 0;
    data.forEach(r => {
      if (r.transaction_type === 'sale') {
        totalJual += Number(r.harga_jual);
        totalExpense += Number(r.modal);
        totalFee += Number(r.fee || 0);
      } else if (r.transaction_type === 'expense') {
        totalExpense += Number(r.modal);
      }
    });
    const netProfit = (totalJual - totalFee) - totalExpense;
    return { totalJual, totalExpense, netProfit };
  };

  const totalSummary = useMemo(() => calculateSummary(records), [records]);
  const filteredSummary = useMemo(() => calculateSummary(filteredRecords), [filteredRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let dataToSubmit: any;
    const submissionDate = transactionDate.toISOString();
    if (transactionType === 'sale') {
      if (!description || !modal || !hargaJual) { alert("Mohon lengkapi deskripsi, modal, dan harga jual."); setSubmitting(false); return; }
      const finalFee = Number(fee) || 0;
      dataToSubmit = { created_at: submissionDate, transaction_type: 'sale', description, modal: Number(modal), harga_jual: Number(hargaJual), fee: finalFee, profit: (Number(hargaJual) - finalFee) - Number(modal), platform, platform_detail: platform === 'Bank' || platform === 'E-Money' ? platformDetail : null };
    } else {
      if (!expenseAmount || !description) { alert("Mohon lengkapi jumlah dan deskripsi pengeluaran."); setSubmitting(false); return; }
      dataToSubmit = { created_at: submissionDate, transaction_type: 'expense', modal: Number(expenseAmount), description, harga_jual: 0, profit: -Number(expenseAmount), fee: null, platform, platform_detail: platform === 'Bank' || platform === 'E-Money' ? platformDetail : null };
    }
    const query = editId ? supabase.from("finance").update(dataToSubmit).eq("id", editId) : supabase.from("finance").insert([dataToSubmit]);
    const { error } = await query;
    if (error) alert(`Gagal menyimpan data: ${error.message}`);
    else { resetForm(); await fetchFinance(); }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => { if (!confirm("Anda yakin ingin menghapus data ini?")) return; const { error } = await supabase.from("finance").delete().eq("id", id); if (error) alert(`Gagal menghapus data: ${error.message}`); else await fetchFinance(); };

  const startEdit = (record: Finance) => {
    setEditId(record.id);
    setTransactionType(record.transaction_type);
    setPlatform(record.platform || "");
    setPlatformDetail(record.platform_detail || "");
    setTransactionDate(new Date(record.created_at));
    setDescription(record.description || "");
    if (record.transaction_type === 'sale') {
      setModal(record.modal.toString());
      setHargaJual(record.harga_jual.toString());
      setFee(record.fee?.toString() || "");
    } else {
      setExpenseAmount(record.modal.toString());
    }
  };

  const resetForm = () => { setEditId(null); setTransactionType('sale'); setModal(""); setHargaJual(""); setFee(""); setExpenseAmount(""); setDescription(""); setPlatform(""); setPlatformDetail(""); setTransactionDate(new Date()); };

  const handleExportExcel = () => { const dataToExport = filteredRecords.map(r => ({ 'Tanggal': format(new Date(r.created_at), 'dd-MM-yyyy'), 'Tipe': r.transaction_type === 'sale' ? 'Penjualan' : 'Pengeluaran', 'Detail': r.description, 'Platform': r.platform_detail ? `${r.platform} - ${r.platform_detail}` : r.platform, 'Modal': r.transaction_type === 'sale' ? r.modal : '-', 'Harga Jual': r.transaction_type === 'sale' ? r.harga_jual : '-', 'Biaya Lain': r.transaction_type === 'sale' ? (r.fee || 0) : '-', 'Pengeluaran': r.transaction_type === 'expense' ? r.modal : '-', 'Profit/Loss': r.profit })); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan"); XLSX.writeFile(workbook, `Laporan_Keuangan_${format(new Date(), 'yyyyMMdd')}.xlsx`); };
  const handleExportPdf = () => { const doc = new jsPDF(); const tableData = filteredRecords.map(r => [ format(new Date(r.created_at), 'dd/MM/yy'), r.transaction_type === 'sale' ? 'Penjualan' : 'Pengeluaran', r.description || '-', r.platform || '-', formatCurrency(r.profit) ]); doc.text("Laporan Keuangan", 14, 16); doc.setFontSize(10); doc.text(`Periode: ${dateRange?.from ? format(dateRange.from, 'd LLL y', {locale: idLocale}) : 'Semua'} - ${dateRange?.to ? format(dateRange.to, 'd LLL y', {locale: idLocale}) : 'Semua'}`, 14, 22); autoTable(doc, { startY: 28, head: [['Tanggal', 'Tipe', 'Detail', 'Platform', 'Jumlah']], body: tableData, theme: 'grid', headStyles: { fillColor: [41, 128, 185], textColor: 255 } }); doc.save(`Laporan_Keuangan_${format(new Date(), 'yyyyMMdd')}.pdf`); };

  const handleBulkDelete = async (period: 'selected' | '1m' | '3m' | '6m' | '1y') => {
    setIsDeleteMenuOpen(false);
    let recordsToDelete: Finance[] = [];
    let confirmationMessage = "";
    const now = new Date();
    switch(period) {
        case 'selected':
            if (!dateRange || !dateRange.from) { alert("Pilih rentang tanggal terlebih dahulu pada filter."); return; }
            recordsToDelete = filteredRecords;
            confirmationMessage = `Anda yakin ingin menghapus ${recordsToDelete.length} transaksi dari periode yang difilter?`;
            break;
        case '1m':
            const oneMonthAgo = subMonths(now, 1);
            recordsToDelete = records.filter(r => new Date(r.created_at) < oneMonthAgo);
            confirmationMessage = `Anda yakin ingin menghapus ${recordsToDelete.length} transaksi yang lebih lama dari 1 bulan?`;
            break;
        case '3m':
            const threeMonthsAgo = subMonths(now, 3);
            recordsToDelete = records.filter(r => new Date(r.created_at) < threeMonthsAgo);
            confirmationMessage = `Anda yakin ingin menghapus ${recordsToDelete.length} transaksi yang lebih lama dari 3 bulan?`;
            break;
        case '6m':
             const sixMonthsAgo = subMonths(now, 6);
            recordsToDelete = records.filter(r => new Date(r.created_at) < sixMonthsAgo);
            confirmationMessage = `Anda yakin ingin menghapus ${recordsToDelete.length} transaksi yang lebih lama dari 6 bulan?`;
            break;
        case '1y':
            const oneYearAgo = subYears(now, 1);
            recordsToDelete = records.filter(r => new Date(r.created_at) < oneYearAgo);
            confirmationMessage = `Anda yakin ingin menghapus ${recordsToDelete.length} transaksi yang lebih lama dari 1 tahun?`;
            break;
    }
    if (recordsToDelete.length === 0) { alert("Tidak ada data untuk dihapus pada periode ini."); return; }
    if (!confirm(`${confirmationMessage}\n\nAKSI INI TIDAK BISA DIBATALKAN!`)) return;
    setDeleting(true);
    const idsToDelete = recordsToDelete.map(r => r.id);
    const { error } = await supabase.from("finance").delete().in('id', idsToDelete);
    if (error) { alert(`Gagal menghapus data: ${error.message}`); } 
    else { alert(`${idsToDelete.length} transaksi berhasil dihapus secara permanen.`); await fetchFinance(); }
    setDeleting(false);
  }

  const SummaryCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: string, colorClass: string }) => ( <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex items-start gap-4"><div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg ${colorClass.replace('text-', 'bg-').replace('600', '100')}`}>{icon}</div><div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-800">{value}</p></div></div> );
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition group mb-6"> <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> <span className="font-medium">Kembali ke Dashboard</span> </button>
            <h1 className="text-3xl font-bold text-slate-800">Manajemen Keuangan</h1>
            <p className="text-slate-500 mt-1">Lacak semua transaksi penjualan dan pengeluaran Anda di sini.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard icon={<TrendingUp size={24} className="text-green-600"/>} title="Total Penjualan (Omset)" value={formatCurrency(totalSummary.totalJual)} colorClass="text-green-600"/>
            <SummaryCard icon={<MinusCircle size={24} className="text-red-600"/>} title="Total Pengeluaran (Termasuk Modal)" value={formatCurrency(totalSummary.totalExpense)} colorClass="text-red-600"/>
            <SummaryCard icon={<Wallet size={24} className="text-indigo-600"/>} title="Profit Bersih" value={formatCurrency(totalSummary.netProfit)} colorClass="text-indigo-600"/>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 sticky top-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{editId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Transaksi</label>
                             <div className="relative" ref={formDatePickerRef}>
                                <div onClick={() => setIsFormDatePickerOpen(true)} className="cursor-pointer w-full flex items-center justify-between p-2 border border-slate-300 rounded-lg shadow-sm text-slate-800 text-left">
                                    <span>{format(transactionDate, "d LLLL yyyy", { locale: idLocale })}</span>
                                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                {isFormDatePickerOpen && (
                                    <div className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg z-50">
                                      <DayPicker mode="single" selected={transactionDate} onSelect={(date) => { if(date) setTransactionDate(date); setIsFormDatePickerOpen(false); }} locale={idLocale} initialFocus styles={dayPickerStyles} captionLayout="dropdown" fromYear={currentYear - 5} toYear={currentYear + 5}/>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Transaksi</label>
                            <div className="flex gap-4">
                                <label className="flex items-center text-slate-800"><input type="radio" value="sale" checked={transactionType === 'sale'} onChange={() => setTransactionType('sale')} className="mr-2"/> Penjualan</label>
                                <label className="flex items-center text-slate-800"><input type="radio" value="expense" checked={transactionType === 'expense'} onChange={() => setTransactionType('expense')} className="mr-2"/> Pengeluaran</label>
                            </div>
                        </div>
                        {transactionType === 'sale' ? ( <> <div> <label htmlFor="description-sale" className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Penjualan</label> <input id="description-sale" type="text" placeholder="Akun Efootball via Rekber A" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/> </div> <div> <label htmlFor="modal" className="block text-sm font-medium text-slate-700 mb-1">Modal (Rp)</label> <input id="modal" type="number" placeholder="50000" value={modal} onChange={(e) => setModal(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/> </div> <div className="grid grid-cols-2 gap-4"> <div> <label htmlFor="hargaJual" className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Rp)</label> <input id="hargaJual" type="number" placeholder="100000" value={hargaJual} onChange={(e) => setHargaJual(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/> </div> <div> <label htmlFor="fee" className="block text-sm font-medium text-slate-700 mb-1">Biaya Rekber (Rp)</label> <input id="fee" type="number" placeholder="5000" value={fee} onChange={(e) => setFee(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/> </div> </div> </> ) : ( <> <div> <label htmlFor="expenseAmount" className="block text-sm font-medium text-slate-700 mb-1">Jumlah Pengeluaran (Rp)</label> <input id="expenseAmount" type="number" placeholder="15000" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/> </div> <div> <label htmlFor="description-expense" className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Pengeluaran</label> <input id="description-expense" type="text" placeholder="Beli lisensi software" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/> </div> </> )}
                        <hr className="my-2"/>
                        <div> <label htmlFor="platform" className="block text-sm font-medium text-slate-700 mb-1">Platform Pembayaran</label> <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"> <option value="" disabled>Pilih Platform</option> {platforms.map(p => <option key={p} value={p}>{p}</option>)} </select> </div>
                        {platform === 'E-Money' && ( <div> <label htmlFor="platformDetail" className="block text-sm font-medium text-slate-700 mb-1">Pilih E-Money</label> <select id="platformDetail" value={platformDetail} onChange={(e) => setPlatformDetail(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"> <option value="" disabled>Pilih E-Money...</option> {eWallets.map(b => <option key={b} value={b}>{b}</option>)} </select> </div> )}
                        {platform === 'Bank' && ( <div> <label htmlFor="platformDetail" className="block text-sm font-medium text-slate-700 mb-1">Nama Bank</label> <select id="platformDetail" value={platformDetail} onChange={(e) => setPlatformDetail(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"> <option value="" disabled>Pilih Bank...</option> {banks.map(b => <option key={b} value={b}>{b}</option>)} </select> </div> )}
                        <div className="flex items-center gap-3 pt-2"> <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-indigo-400"> {submitting ? (editId ? 'Memperbarui...' : 'Menyimpan...') : (editId ? <><Save size={16}/> Update</> : <><Plus size={16}/> Tambah</>)} </button> {editId && ( <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"> <X size={16}/> Batal </button> )} </div>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-2">
                 <div className="bg-white rounded-xl shadow-md border border-slate-200">
                    <div className="p-4 border-b border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input type="text" placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-2 pl-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800"/>
                            </div>
                            <div className="relative" ref={datePickerRef}>
                                <div onClick={() => setIsDatePickerOpen(true)} className="cursor-pointer w-full sm:w-auto flex items-center justify-between gap-2 p-2 border border-slate-300 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50">
                                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                                    <span className="text-slate-800"> {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d LLL y")} - ${format(dateRange.to, "d LLL y")}`: format(dateRange.from, "d LLL y")) : "Filter Tanggal"} </span>
                                </div>
                                {isDatePickerOpen && (
                                    <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg z-50">
                                        <DayPicker mode="range" selected={dateRange} onSelect={setDateRange} footer={<button onClick={() => { setDateRange(undefined); setIsDatePickerOpen(false); }} className="w-full mt-2 p-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md">Reset Filter</button>} locale={idLocale} styles={dayPickerStyles} captionLayout="dropdown" fromYear={currentYear - 5} toYear={currentYear + 5}/>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={handleExportExcel} className="flex-1 inline-flex items-center justify-center gap-2 text-sm px-3 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition shadow-sm"> <FileSpreadsheet size={16}/> Export Excel</button>
                            <button onClick={handleExportPdf} className="flex-1 inline-flex items-center justify-center gap-2 text-sm px-3 py-2 bg-white text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition shadow-sm"> <FileText size={16}/> Export PDF</button>
                            
                            <div className="relative" ref={deleteMenuRef}>
                                <button onClick={() => setIsDeleteMenuOpen(!isDeleteMenuOpen)} disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 text-sm px-3 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition shadow-sm disabled:opacity-50">
                                    {deleting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                                    Hapus Data
                                    <ChevronDown size={16}/>
                                </button>
                                {isDeleteMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 p-2">
                                  <p className="text-xs text-black p-2">Pilih periode untuk hapus data:</p>
                                  <button
                                    onClick={() => handleBulkDelete('selected')}
                                    className="w-full text-left text-sm p-2 rounded-md hover:bg-slate-100 text-black">
                                    Hapus Sesuai Filter Tanggal
                                  </button>
                                  <button
                                    onClick={() => handleBulkDelete('1m')}
                                    className="w-full text-left text-sm p-2 rounded-md hover:bg-slate-100 text-black">
                                    Hapus Data &gt; 1 Bulan
                                  </button>
                                  <button
                                    onClick={() => handleBulkDelete('3m')}
                                    className="w-full text-left text-sm p-2 rounded-md hover:bg-slate-100 text-black">
                                    Hapus Data &gt; 3 Bulan
                                  </button>
                                  <button
                                    onClick={() => handleBulkDelete('6m')}
                                    className="w-full text-left text-sm p-2 rounded-md hover:bg-slate-100 text-black">
                                    Hapus Data &gt; 6 Bulan
                                  </button>
                                  <button
                                    onClick={() => handleBulkDelete('1y')}
                                    className="w-full text-left text-sm p-2 rounded-md hover:bg-slate-100 text-black">
                                    Hapus Data &gt; 1 Tahun
                                  </button>
                                </div>
                              )}
                            </div>
                        </div>
                    </div>
                     {loading ? ( <p className="p-6 text-center text-slate-500">Memuat data...</p> ) : (
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left"> <thead className="bg-slate-100 text-xs text-slate-500 uppercase"> <tr> <th scope="col" className="p-4">Detail Transaksi</th> <th scope="col" className="p-4">Tipe</th> <th scope="col" className="p-4">Jumlah</th> <th scope="col" className="p-4">Platform</th> <th scope="col" className="p-4">Tanggal</th> <th scope="col" className="p-4 text-right">Aksi</th> </tr> </thead> <tbody className="text-slate-700"> {filteredRecords.length === 0 ? ( <tr><td colSpan={6} className="p-6 text-center text-slate-500">Tidak ada data untuk filter yang dipilih.</td></tr> ) : ( filteredRecords.map((r) => ( <tr key={r.id} className="bg-white border-b border-slate-200 hover:bg-slate-50 transition"> <td className="p-4 font-medium text-slate-800"><div className="max-w-xs truncate">{r.description}</div><div className="text-xs font-normal text-slate-500">{r.transaction_type === 'sale' && `(Modal: ${formatCurrency(r.modal)} | Jual: ${formatCurrency(r.harga_jual)} | Fee: ${formatCurrency(r.fee || 0)})`}</div></td> <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.transaction_type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.transaction_type === 'sale' ? 'Penjualan' : 'Pengeluaran'}</span></td> <td className={`p-4 font-semibold ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(r.profit)}</td> <td className="p-4">{r.platform_detail ? `${r.platform} - ${r.platform_detail}` : r.platform}</td> <td className="p-4">{new Date(r.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}</td> <td className="p-4 text-right"><div className="flex items-center justify-end gap-4"><button onClick={() => startEdit(r)} className="text-slate-500 hover:text-yellow-600" title="Edit"><Edit size={16} /></button><button onClick={() => handleDelete(r.id)} className="text-slate-500 hover:text-red-600" title="Hapus"><Trash2 size={16} /></button></div></td> </tr> )) )} </tbody> </table>
                            <div className="p-4 bg-slate-50 border-t border-slate-200 text-sm">
                                <h4 className="font-semibold text-slate-700 mb-2">Ringkasan untuk Periode Terpilih</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                    <div><p className="text-xs text-slate-500">Penjualan</p><p className="font-semibold text-green-600">{formatCurrency(filteredSummary.totalJual)}</p></div>
                                    <div><p className="text-xs text-slate-500">Pengeluaran</p><p className="font-semibold text-red-600">{formatCurrency(filteredSummary.totalExpense)}</p></div>
                                    <div className="col-span-2 md:col-span-1"><p className="text-xs text-slate-500">Profit Bersih Periode Ini</p><p className="font-bold text-indigo-600 text-base">{formatCurrency(filteredSummary.netProfit)}</p></div>
                                </div>
                            </div>
                        </div>
                     )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}