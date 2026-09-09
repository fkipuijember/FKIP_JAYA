import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle, FileText, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { FileData } from '../types';
import { fileToBase64 } from '../utils/storage';

interface FileUploadFieldProps {
  id: string;
  label: string;
  sublabel?: string;
  accept: string;
  isImageOnly?: boolean;
  isFoto3x4?: boolean;
  value: FileData | null;
  onChange: (fileData: FileData | null) => void;
  required?: boolean;
  error?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  id,
  label,
  sublabel,
  accept,
  isImageOnly = false,
  isFoto3x4 = false,
  value,
  onChange,
  required = false,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = async (file: File) => {
    setLocalError(null);

    // Max 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setLocalError('Ukuran file melebihi batas maksimal 5 MB.');
      return;
    }

    if (isImageOnly && !file.type.startsWith('image/')) {
      setLocalError('File harus berupa gambar (JPG, JPEG, PNG).');
      return;
    }

    try {
      setIsLoading(true);
      const base64 = await fileToBase64(file);
      onChange({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        base64Data: base64,
        uploadedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      setLocalError('Gagal membaca file. Silakan coba unggah kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-1.5" id={`wrapper-${id}`}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        {isFoto3x4 && (
          <span className="text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            Wajib Background Merah
          </span>
        )}
      </div>

      {sublabel && (
        <p className="text-xs text-slate-500">{sublabel}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Box */}
      {!value ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all text-center flex flex-col items-center justify-center min-h-[120px] ${
            isDragging
              ? 'border-emerald-600 bg-emerald-50/70 scale-[0.99]'
              : error || localError
              ? 'border-red-300 bg-red-50/40 hover:border-red-400'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-slate-600">Memproses file...</span>
            </div>
          ) : (
            <>
              <div className={`p-2.5 rounded-full mb-2 ${isFoto3x4 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                {isFoto3x4 ? <ImageIcon className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Klik untuk unggah atau seret file ke sini
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isFoto3x4
                  ? 'Format: JPG/PNG, rasio 3:4 (Maks 5 MB)'
                  : 'Format: PDF, JPG, PNG (Maks 5 MB)'}
              </p>
            </>
          )}
        </div>
      ) : (
        /* File Uploaded State with Preview */
        <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            {isFoto3x4 && value.base64Data ? (
              <div className="relative w-14 h-18 bg-red-600 rounded-md overflow-hidden flex-shrink-0 border-2 border-red-500 shadow-sm">
                <img
                  src={value.base64Data}
                  alt="Preview 3x4"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-bold">
                  3 x 4
                </span>
              </div>
            ) : value.fileType.startsWith('image/') && value.base64Data ? (
              <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
                <img
                  src={value.base64Data}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 border border-emerald-300">
                <FileText className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-slate-800 truncate" title={value.fileName}>
                  {value.fileName}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {formatFileSize(value.fileSize)} • Terunggah
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 pl-2">
            <button
              type="button"
              id={`btn-replace-${id}`}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium px-2 py-1 rounded hover:bg-emerald-100/60 transition-colors"
            >
              Ganti
            </button>
            <button
              type="button"
              id={`btn-delete-${id}`}
              onClick={handleRemove}
              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Hapus berkas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {(error || localError) && (
        <div className="flex items-center space-x-1 text-xs text-red-600 pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error || localError}</span>
        </div>
      )}
    </div>
  );
};
