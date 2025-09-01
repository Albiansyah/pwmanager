"use client";

import { useState, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UploadCloud, Loader2, File as FileIcon } from "lucide-react";

interface FileUploaderProps {
  onUpload: (filePath: string, publicUrl: string | null) => void;
  onUploading: (isUploading: boolean) => void;
}

export default function FileUploader({
  onUpload,
  onUploading,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      onUploading(true);

      // 🔹 Nama unik file
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`; // simpan di folder "uploads"

      // 🔹 Upload ke Supabase storage dengan upsert
      const { error: uploadError } = await supabase.storage
        .from("attachments") // pastikan bucket bernama "attachments"
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload Error:", uploadError);
        throw uploadError;
      }

      // 🔹 Ambil public URL
      const { data } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath);
      const publicUrl = data?.publicUrl ?? null;

      console.log("✅ File uploaded:", filePath, publicUrl);

      // 🔹 Callback ke parent
      onUpload(filePath, publicUrl);
    } catch (error) {
      if (error instanceof Error) {
        alert("Error: " + error.message);
      } else {
        alert("Terjadi kesalahan saat mengunggah file.");
      }
    } finally {
      setUploading(false);
      onUploading(false);
    }
  };

  return (
    <div>
      <label
        htmlFor="file-upload"
        className={`flex items-center justify-center gap-3 w-full p-3 border-2 border-dashed rounded-lg transition
                    ${
                      uploading
                        ? "cursor-not-allowed bg-slate-100 border-slate-300"
                        : "cursor-pointer bg-white border-slate-300 hover:border-indigo-500 hover:bg-indigo-50"
                    }`}
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="animate-spin text-slate-500" />
            <span className="text-sm font-medium text-slate-500">
              Mengunggah...
            </span>
          </>
        ) : (
          <>
            <UploadCloud size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              Pilih File untuk Diunggah
            </span>
          </>
        )}
      </label>

      <input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {selectedFile && !uploading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <FileIcon size={14} />
          <span>
            File terpilih:{" "}
            <span className="font-medium">{selectedFile.name}</span>
          </span>
        </div>
      )}
    </div>
  );
}
