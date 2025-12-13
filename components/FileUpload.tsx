import React, { useCallback, useState } from 'react';
import { UploadCloud, FileAudio, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  compact?: boolean;
}

const MAX_SIZE_MB = 500; // Increased limit for Files API support

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled, compact }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndPassFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('audio/')) {
      setError("Por favor sube un archivo de audio válido (MP3, WAV, M4A, etc).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_SIZE_MB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !disabled) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0] && !disabled) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div
        className={`relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out flex-grow min-h-[250px]
          ${dragActive ? "border-indigo-500 bg-indigo-50 scale-[1.01]" : "border-slate-300 bg-white hover:bg-slate-50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="dropzone-file"
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          onChange={handleChange}
          accept="audio/*"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center p-6 text-center z-0">
          <div className={`p-4 rounded-full mb-4 shadow-sm ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            {dragActive ? <UploadCloud size={32} /> : <FileAudio size={32} />}
          </div>
          <p className="mb-2 text-lg font-semibold text-slate-800">
            {dragActive ? "Suelta el audio" : "Subir Audio"}
          </p>
          <p className="text-xs text-slate-500 mb-4 px-4 leading-relaxed">
            Arrastra o haz clic para buscar. <br/>
            Soporta MP3, WAV, M4A.<br/>
            <span className="font-medium text-slate-600">Máx {MAX_SIZE_MB}MB</span>
          </p>
          <div 
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md shadow-md"
          >
            Explorar Archivos
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 text-red-700 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-fadeIn text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};