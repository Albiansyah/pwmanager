// file: app/page.tsx

"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar"; // <-- 1. Import Navbar
import { ShieldCheck, Users, FileText, Wallet, LogIn, UserPlus } from "lucide-react";

export default function HomePage() {
  return (
    // 2. Ubah struktur div utama menjadi flex-col
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Navbar /> {/* <-- 3. Panggil komponen Navbar di sini */}
      
      {/* Konten utama sekarang dibungkus dalam <main> */}
      <main className="relative flex-grow flex items-center justify-center overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 -left-48 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-48 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 items-center gap-12">
            
            {/* Left Column: Visual/Illustration */}
            <div className="hidden md:flex justify-center items-center">
              <div className="w-full max-w-sm h-80 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 flex flex-col gap-3">
                  <div className="w-1/3 h-6 bg-slate-200 rounded-md animate-pulse"></div>
                  <div className="w-full h-12 bg-slate-100 rounded-lg animate-pulse animation-delay-200"></div>
                  <div className="w-full h-12 bg-slate-100 rounded-lg animate-pulse animation-delay-400"></div>
                  <div className="w-full h-12 bg-slate-100 rounded-lg animate-pulse animation-delay-600"></div>
                  <div className="flex justify-end gap-2 mt-auto">
                      <div className="w-24 h-8 bg-slate-200 rounded-md animate-pulse"></div>
                      <div className="w-24 h-8 bg-indigo-200 rounded-md animate-pulse"></div>
                  </div>
              </div>
            </div>
            
            {/* Right Column: Content & CTA */}
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                      <ShieldCheck size={16} />
                      <span>Aman dan Terorganisir</span>
                  </div>
              </div>

              <h1 className="text-4xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">
                Kelola Semua Akun dan Keuanganmu di Satu Tempat
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Platform terpadu untuk mengatur akun, menyimpan lampiran penting, dan memonitor keuangan dari penjualan aset digital Anda.
              </p>

              <ul className="space-y-4 mb-10 text-left">
                <li className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-slate-700">Manajemen akun dengan catatan detail.</span>
                </li>
                <li className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-slate-700">Simpan file dan lampiran dengan aman.</span>
                </li>
                <li className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-slate-700">Lacak profit dan pengeluaran transaksi.</span>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition"
                >
                  <LogIn size={18} />
                  Login ke Akun Anda
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 transition"
                >
                  <UserPlus size={18} />
                  Daftar Sekarang
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}