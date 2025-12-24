import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { analyzeAudioFile } from './services/geminiService';
import { AppStatus, AnalysisResult } from './types';
import { Loader2, Plus, FileAudio, FileVideo, LayoutDashboard, Download, ChevronDown, FileText, Printer, AlignLeft, Mic, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.ANALYZING);
    setError(null);
    setFileName(file.name);
    setIsVideo(file.type.startsWith('video/'));
    try {
      const data = await analyzeAudioFile(file);
      setResult(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("Error al procesar el archivo. Si es un video muy largo, asegúrate de tener una conexión estable.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setFileName("");
    setIsVideo(false);
  };

  // --- EXPORT HELPERS ---
  const generateDocHtml = () => {
    if (!result) return "";
    
    // Formatear la transcripción para el DOC
    const formattedTranscript = result.fullTranscription.split('\n').map(line => {
      if (!line.trim()) return '<br>';
      const speakerEndIndex = line.indexOf(':');
      if (speakerEndIndex !== -1 && speakerEndIndex < 40) {
        const speaker = line.substring(0, speakerEndIndex);
        const content = line.substring(speakerEndIndex + 1);
        return `<p style="margin-bottom: 10pt; border-left: 3px solid #333; padding-left: 10pt;">
                  <b style="background: #333; color: white; padding: 2pt 5pt; font-size: 8pt; text-transform: uppercase;">${speaker}</b>
                  <span style="color: #444;">${content}</span>
                </p>`;
      }
      return `<p style="margin-bottom: 10pt; color: #666;">${line}</p>`;
    }).join("");

    return `
      <html><head><meta charset="utf-8"><style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        h1 { color: #000; border-bottom: 2px solid #000; padding-bottom: 5pt; text-transform: uppercase; font-style: italic; }
        h2 { color: #854d0e; border-bottom: 1px solid #e2e8f0; padding-top: 20pt; text-transform: uppercase; font-size: 14pt; }
        h3 { background: #f8fafc; padding: 5pt; border-left: 4px solid #854d0e; font-size: 12pt; margin-top: 15pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15pt; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 10pt; }
        .header-cell { background: #f1f5f9; font-weight: bold; width: 25%; }
        .transcript-container { background: #fafafa; padding: 20pt; border: 1px solid #ddd; font-family: 'Courier New', Courier, monospace; font-size: 10pt; }
      </style></head><body>
        <h1>ACTA DE REUNIÓN - JACKSON ACTAS</h1>
        <table>
          <tr><td class="header-cell">Fecha</td><td>${result.meetingDate}</td><td class="header-cell">Hora</td><td>${result.meetingTime}</td></tr>
          <tr><td class="header-cell">Lugar</td><td colspan="3">${result.meetingLocation}</td></tr>
          <tr><td class="header-cell">Asistentes</td><td colspan="3">${result.participants.join(", ")}</td></tr>
        </table>
        
        <h3>Objetivo de la Sesión</h3>
        <p>${result.generalObjective}</p>
        
        <h3>Antecedentes</h3>
        <p>${result.background}</p>
        
        <h3>Resumen del Desarrollo</h3>
        <p><i>${result.development}</i></p>
        
        <h3>Compromisos y Acuerdos</h3>
        <table>
          <tr style="background: #334155; color: white; font-weight: bold;">
            <td>#</td><td>Acuerdo / Resolución</td><td>Responsable</td><td>Plazo</td>
          </tr>
          ${result.commitments.map((c, i) => `<tr><td>${i+1}</td><td>${c.resolution}</td><td>${c.responsible}</td><td>${c.date}</td></tr>`).join("")}
        </table>

        <br clear="all" style="page-break-before:always">
        
        <h2>TRANSCRIPCIÓN ÍNTEGRA DE LA SESIÓN</h2>
        <div class="transcript-container">
          ${formattedTranscript}
        </div>
        
        <p style="text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 40pt;">
          Generado automáticamente por Jackson Actas - The Legend Series
        </p>
      </body></html>
    `;
  };

  const handleExportDoc = () => {
    const blob = new Blob(['\ufeff', generateDocHtml()], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Acta_y_Transcripcion_${fileName.split('.')[0]}.doc`;
    link.click();
  };

  const handleExportTranscription = () => {
    if (!result) return;
    const content = `TRANSCRIPCIÓN COMPLETA - ${fileName}\n\n${result.fullTranscription}`;
    const blob = new Blob(['\ufeff', content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transcripcion_${fileName.split('.')[0]}.txt`;
    link.click();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      <header className="bg-white border-b border-slate-200 h-16 flex-shrink-0 z-20 flex items-center justify-between px-6 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-default">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 shadow-2xl overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 opacity-50"></div>
               <Mic className="text-yellow-500 w-5 h-5 relative z-10" />
               <Sparkles className="absolute top-1 right-1 w-2.5 h-2.5 text-yellow-200 animate-pulse z-10" />
            </div>
          </div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Jackson <span className="text-yellow-600">Actas</span></h1>
        </div>
        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">
          The Legend Series v3.0
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col shadow-xl no-print">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LayoutDashboard size={14} /> Panel de Control
          </h2>
          
          {status === AppStatus.IDLE ? (
            <div className="h-64"><FileUpload onFileSelect={handleFileSelect} /></div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700">
                  {isVideo ? <FileVideo size={20} /> : <FileAudio size={20} />}
                </div>
                <div className="truncate text-sm font-bold text-slate-800">{fileName}</div>
              </div>
              <button onClick={handleReset} className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors">
                <Plus size={14} /> Nuevo Análisis
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50">
          {status === AppStatus.IDLE && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center max-w-sm mx-auto">
              <div className="flex gap-4 mb-4 opacity-20">
                <FileAudio size={60} strokeWidth={1} />
                <FileVideo size={60} strokeWidth={1} />
              </div>
              <p className="text-lg font-medium text-slate-400 leading-tight">Sube una grabación de audio o video para comenzar el análisis inteligente</p>
            </div>
          )}

          {status === AppStatus.ANALYZING && (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 size={48} className="text-yellow-600 animate-spin" />
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900">PROCESANDO GRABACIÓN</h2>
                <p className="text-slate-500 text-sm">Gemini está {isVideo ? 'analizando el video,' : 'escuchando el audio,'} transcribiendo y redactando el acta...</p>
              </div>
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="h-full flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-2xl border border-red-100 p-10 text-center">
              <p className="text-xl font-bold mb-2">¡Oops! Algo falló</p>
              <p className="text-sm opacity-80 mb-6">{error}</p>
              <button onClick={handleReset} className="px-6 py-2 bg-red-600 text-white rounded-full font-bold">Reintentar</button>
            </div>
          )}

          {status === AppStatus.SUCCESS && result && (
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-10 border-b border-slate-200 pb-6 no-print">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Análisis Completado</h2>
                  <p className="text-slate-500 text-sm font-medium">Acta y Transcripción disponibles para exportar</p>
                </div>
                <div className="relative" ref={exportMenuRef}>
                  <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
                  >
                    <Download size={16} /> Exportar Resultados <ChevronDown size={14} />
                  </button>
                  {isExportMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-fadeIn">
                      <button onClick={handleExportDoc} className="w-full text-left p-3 text-sm font-bold hover:bg-slate-50 rounded-xl flex items-center gap-3">
                        <FileText size={18} className="text-blue-500" /> Acta + Transcr. (.doc)
                      </button>
                      <button onClick={() => window.print()} className="w-full text-left p-3 text-sm font-bold hover:bg-slate-50 rounded-xl flex items-center gap-3 border-t border-slate-50">
                        <Printer size={18} className="text-red-500" /> Imprimir Todo (PDF)
                      </button>
                      <button 
                        onClick={handleExportTranscription} 
                        className="w-full text-left p-3 text-sm font-black text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center gap-3 border-t border-slate-50"
                      >
                        <AlignLeft size={18} /> Transcripción Solo (.txt)
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <ResultsDisplay data={result} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;