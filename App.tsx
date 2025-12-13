import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { analyzeAudioFile } from './services/geminiService';
import { AppStatus, AnalysisResult } from './types';
import { Loader2, AudioLines, Plus, FileAudio, LayoutDashboard, Download, ChevronDown, FileText, Printer } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.ANALYZING);
    setError(null);
    setFileName(file.name);

    try {
      const data = await analyzeAudioFile(file);
      setResult(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al procesar el audio. Verifica tu conexión o intenta de nuevo.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setError(null);
    setFileName("");
    setIsExportMenuOpen(false);
  };

  // --- EXPORT HELPERS ---

  const generateCommitmentRows = (commitments: AnalysisResult['commitments']) => {
    const rows = commitments.map((c, i) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">${i + 1}) ${c.resolution}</td>
        <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">${c.responsible}</td>
        <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">${c.date}</td>
      </tr>
    `).join('');

    // Ensure at least a few empty rows for aesthetics if list is short
    const emptyRowsCount = Math.max(0, 5 - commitments.length);
    const emptyRows = Array(emptyRowsCount).fill(0).map((_, i) => {
        const num = commitments.length + i + 1;
        return `
        <tr>
            <td style="border: 1px solid #000; padding: 4px; vertical-align: top; height: 24px;">${num})</td>
            <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">&nbsp;</td>
        </tr>`;
    }).join('');

    return rows + emptyRows;
  };

  // CSS for the content inside the document (shared between PDF and Word)
  const getContentStyles = () => `
    font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.3; color: #000;
  `;

  // CSS for tables and structures
  const getStructuralStyles = () => `
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; border: 1px solid black; }
    td, th { border: 1px solid black; padding: 5px; vertical-align: top; }
    .header-dark { background-color: #444; color: white; text-align: center; font-weight: bold; text-transform: uppercase; padding: 6px; font-size: 9pt; }
    .section-label { font-weight: bold; width: 25%; background-color: #f9f9f9; }
    .title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px; text-transform: uppercase; }
    .logo-container { text-align: center; margin-bottom: 20px; }
    .logo-jb {
      display: inline-block;
      width: 60px;
      height: 60px;
      border: 3px solid #000;
      border-radius: 50%;
      text-align: center;
      line-height: 54px;
      font-family: 'Times New Roman', serif;
      font-weight: 900;
      font-size: 28pt;
      color: #000;
      margin-bottom: 10px;
    }
    .signatures { margin-top: 40px; }
    .signature-box { height: 80px; vertical-align: bottom; text-align: center; }
  `;

  const getDocumentBody = () => {
    if (!result) return '';
    const commitmentRowsHTML = generateCommitmentRows(result.commitments);
    return `
      <div class="logo-container">
          <div class="logo-jb">JB</div>
          <div class="title">ACTA DE REUNIÓN NRO. ${Math.floor(Math.random() * 100).toString().padStart(2, '0')}</div>
      </div>

      <!-- Header Information -->
      <table>
        <tr>
          <td rowspan="5" style="width: 25%;">
            <strong>Asistentes:</strong><br/><br/>
            ${result.participants.map(p => `• ${p}`).join('<br/>')}
          </td>
          <td style="width: 25%; background-color: #f9f9f9;"><strong>Elaborado por:</strong></td>
          <td style="width: 50%;">Jackson Audio AI</td>
        </tr>
        <tr>
          <td style="background-color: #f9f9f9;"><strong>Fecha elaboración:</strong></td>
          <td>${new Date().toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="background-color: #f9f9f9;"><strong>Lugar de reunión:</strong></td>
          <td>${result.meetingLocation}</td>
        </tr>
        <tr>
          <td style="background-color: #f9f9f9;"><strong>Fecha de reunión:</strong></td>
          <td>${result.meetingDate}</td>
        </tr>
        <tr>
          <td style="background-color: #f9f9f9;"><strong>Hora de la reunión:</strong></td>
          <td>${result.meetingTime}</td>
        </tr>
      </table>

      <!-- Objectives -->
      <table style="border-top: none;">
          <tr>
              <td colspan="2" class="header-dark">OBJETIVO, ANTECEDENTES</td>
          </tr>
          <tr>
              <td class="section-label">Objetivo General</td>
              <td>${result.generalObjective}</td>
          </tr>
          <tr>
              <td class="section-label">Antecedentes</td>
              <td>${result.background}</td>
          </tr>
          <tr>
              <td class="section-label">Desarrollo</td>
              <td>${result.development}</td>
          </tr>
      </table>

      <!-- Commitments -->
      <table style="border-top: none;">
          <tr>
              <td colspan="3" class="header-dark">COMPROMISOS</td>
          </tr>
          <tr style="text-align: center; font-weight: bold; font-size: 9pt; background-color: #f0f0f0;">
              <td style="width: 60%;">RESOLUCIONES</td>
              <td style="width: 20%;">RESPONSABLE</td>
              <td style="width: 20%;">FECHA</td>
          </tr>
          ${commitmentRowsHTML}
      </table>

      <!-- Next Meeting -->
      <table style="border-top: none;">
          <tr>
              <td class="section-label" style="width: 30%;">PRÓXIMA REUNIÓN</td>
              <td>${result.nextMeeting}</td>
          </tr>
      </table>

      <!-- Signatures -->
      <table style="border-top: none;" class="signatures">
          <tr>
              <td colspan="2" style="text-align: center; font-size: 9pt; border-bottom: none; background-color: #f0f0f0; font-weight: bold;">FIRMAS</td>
          </tr>
          <tr>
              <td style="width: 50%; border-top: none;" class="signature-box">
                  __________________________<br/>
                  Firma Responsable
              </td>
              <td style="width: 50%; border-top: none;" class="signature-box">
                  __________________________<br/>
                  Firma Secretario
              </td>
          </tr>
      </table>
    `;
  };

  const handlePrintPdf = () => {
    setIsExportMenuOpen(false);
    if (!result) return;

    const bodyContent = getDocumentBody();
    if (!bodyContent) return;

    // Open a new window with a specific name to avoid tab clutter
    const windowName = `print_window_${Date.now()}`;
    const printWindow = window.open('', windowName, 'width=950,height=900,menubar=yes,toolbar=no,location=no,status=yes,scrollbars=yes');
    
    if (printWindow) {
      const doc = printWindow.document;
      doc.open();
      // We build a full "Document Viewer" UI inside the popup
      doc.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Vista Previa - Acta de Reunión</title>
          <style>
            /* Base Reset */
            body { margin: 0; padding: 0; background-color: #525659; font-family: sans-serif; }
            
            /* Toolbar for Manual Actions */
            .toolbar {
               position: sticky; top: 0; left: 0; right: 0;
               background: #333; color: white;
               padding: 12px 24px;
               display: flex; justify-content: space-between; align-items: center;
               z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .toolbar-title { font-weight: 600; font-size: 16px; }
            .btn {
               background: #3b82f6; color: white; border: none;
               padding: 8px 16px; border-radius: 6px; cursor: pointer;
               font-weight: 500; font-size: 14px; transition: background 0.2s;
            }
            .btn:hover { background: #2563eb; }
            .btn-close { background: #ef4444; margin-left: 10px; }
            .btn-close:hover { background: #dc2626; }

            /* The "Paper" sheet */
            .page-container {
               background: white;
               width: 21cm; /* A4 width */
               min-height: 29.7cm; /* A4 height */
               margin: 30px auto;
               padding: 2cm;
               box-sizing: border-box;
               box-shadow: 0 0 15px rgba(0,0,0,0.5);
               ${getContentStyles()}
            }
            
            ${getStructuralStyles()}

            /* Print Media Query - Critical for clean output */
            @media print {
               body { background: white; margin: 0; }
               .toolbar { display: none !important; }
               .page-container { 
                  box-shadow: none; margin: 0; padding: 0; width: 100%; max-width: none; min-height: 0;
               }
               * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
             <span class="toolbar-title">Vista Previa de Documento</span>
             <div>
               <button class="btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
               <button class="btn btn-close" onclick="window.close()">Cerrar</button>
             </div>
          </div>
          
          <div class="page-container">
            ${bodyContent}
          </div>

          <script>
            // Attempt to trigger print automatically after render
            // We use a try-catch in case browsers block auto-print
            setTimeout(() => {
              try {
                window.print();
              } catch (e) { console.log('Auto-print prevented, user must click button'); }
            }, 800);
          </script>
        </body>
        </html>
      `);
      doc.close(); 
    } else {
        alert("Por favor habilita las ventanas emergentes (pop-ups) en tu navegador para ver y descargar el PDF.");
    }
  };

  const handleExportDoc = () => {
    setIsExportMenuOpen(false);
    if (!result) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Acta de Reunión</title>
        <style>
          body { ${getContentStyles()} margin: 20px; }
          ${getStructuralStyles()}
        </style>
      </head>
      <body>
        ${getDocumentBody()}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Acta_Reunion_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 h-20 flex-shrink-0 z-20 shadow-sm relative">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img 
                src="https://i.ibb.co/3sN62k4/Jackson-Legend.png" 
                alt="Jackson Legend Logo" 
                className="relative h-14 w-auto object-contain transform group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase italic" style={{ fontFamily: 'sans-serif' }}>
                Jackson <span className="text-yellow-600">Audio</span>
              </h1>
              <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">The Legend Series</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full text-xs font-bold text-slate-700 border border-slate-200 shadow-inner">
               v2.1 Pro
             </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar / Upload Menu */}
        <aside className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          <div className="p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <LayoutDashboard size={14} />
              Panel de Control
            </h2>
            
            {/* Upload Area */}
            <div className="mb-6">
               {status === AppStatus.IDLE ? (
                 <div className="h-80">
                   <FileUpload onFileSelect={handleFileSelect} />
                 </div>
               ) : (
                 <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-50 p-2.5 rounded-lg text-yellow-600 border border-yellow-100">
                        <FileAudio size={24} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 truncate" title={fileName}>{fileName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {status === AppStatus.ANALYZING ? (
                            <span className="text-amber-600 font-medium animate-pulse">Procesando...</span>
                          ) : status === AppStatus.SUCCESS ? (
                            <span className="text-emerald-600 font-medium">Completado</span>
                          ) : (
                            <span className="text-red-500">Error</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleReset}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Plus size={16} />
                      Analizar nuevo archivo
                    </button>
                 </div>
               )}
            </div>

            {/* Sidebar Stats / Info */}
            <div className="border-t border-slate-100 pt-6">
              <div className="space-y-4">
                 <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-900 text-sm">
                    <div className="mt-0.5"><AudioLines size={16} /></div>
                    <p className="leading-snug">Soporte ampliado para archivos grandes (hasta <strong>500MB</strong>) usando Gemini Files API.</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50">
             <p className="text-xs text-center text-slate-400">
               Powered by Google Gemini 2.5 Flash
             </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10 scroll-smooth">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            
            {status === AppStatus.IDLE && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-400">
                  <LayoutDashboard size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Esperando archivo</h3>
                <p className="text-slate-500 max-w-md">
                  Utiliza el menú de la izquierda para subir tu audio. Los resultados del análisis aparecerán aquí automáticamente.
                </p>
              </div>
            )}

            {status === AppStatus.ANALYZING && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-yellow-200 rounded-full animate-ping opacity-50"></div>
                  <div className="relative bg-white p-6 rounded-full shadow-lg border border-yellow-100">
                    <Loader2 size={64} className="text-yellow-600 animate-spin" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Analizando reunión</h2>
                <div className="flex flex-col gap-2 text-center text-slate-500 max-w-lg">
                   <p>Jackson Audio está transcribiendo y extrayendo insights.</p>
                   <p className="text-sm bg-white px-3 py-1 rounded-full border border-slate-200 inline-block mx-auto shadow-sm">
                     Esto puede tardar unos momentos para archivos grandes...
                   </p>
                </div>
              </div>
            )}

            {status === AppStatus.ERROR && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3">
                  <AudioLines size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Algo salió mal</h3>
                <p className="text-slate-600 mb-8 max-w-md text-center bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                  {error}
                </p>
              </div>
            )}

            {status === AppStatus.SUCCESS && result && (
              <div className="animate-slideUp pb-10">
                <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-4 no-print">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Resultados del Análisis</h2>
                    <p className="text-slate-500 mt-1">Formato: Acta de Reunión Nro. {Math.floor(Math.random() * 1000)}</p>
                  </div>
                  <div className="flex items-center gap-2 relative">
                     {/* Export Button & Menu */}
                     <div className="relative" ref={exportMenuRef}>
                       <button 
                         onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                         className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium text-sm"
                       >
                         <Download size={16} />
                         Exportar
                         <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                       </button>

                       {isExportMenuOpen && (
                         <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button 
                              onClick={handleExportDoc}
                              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                            >
                              <FileText size={16} className="text-blue-500" />
                              Word (.doc)
                            </button>
                            <button 
                              onClick={handlePrintPdf}
                              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-red-600 flex items-center gap-2 transition-colors border-t border-slate-50"
                            >
                              <Printer size={16} className="text-red-500" />
                              PDF / Imprimir
                            </button>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
                <ResultsDisplay data={result} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;