// file: app/login/page.tsx

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, AlertCircle, Loader2, X } from "lucide-react"; // Ditambahkan ikon X

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Email atau password yang Anda masukkan salah.");
      } else {
        setError(error.message);
      }
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    
    setSubmitting(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50 overflow-hidden font-sans">
      
      <div className="absolute top-0 -left-48 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-0 -right-48 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md border border-slate-200">
        
        <div className="text-center">
            <KeyRound className="mx-auto h-12 w-12 text-indigo-500" />
            <h2 className="mt-4 text-2xl font-bold text-slate-800">Selamat Datang Kembali</h2>
            <p className="mt-2 text-sm text-slate-500">Silakan login untuk melanjutkan ke dashboard Anda.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="anda@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 pr-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg">
                <AlertCircle size={18}/>
                <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
            <Link
              href="/"
              className="w-full inline-flex justify-center items-center gap-2 p-3 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"
            >
              <X size={18}/>
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex justify-center items-center gap-2 p-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-slate-600">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}