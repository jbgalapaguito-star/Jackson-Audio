import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Target, FileText, CheckSquare, Calendar, Users, MapPin, Clock, AlignLeft, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface ResultsDisplayProps {
  data: AnalysisResult;
}

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-4 text-slate-800 pb-2 border-b border-slate-200">
    <div className="text-yellow-600">{icon}</div>
    <h3 className="font-bold text-lg uppercase tracking-wide">{title}</h3>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.fullTranscription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Función para formatear la transcripción y resaltar hablantes
  const formatTranscription = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      
      const speakerEndIndex = line.indexOf(':');
      if (speakerEndIndex !== -1 && speakerEndIndex < 40) { // Probable nombre de hablante
        const speaker = line.substring(0, speakerEndIndex);
        const content = line.substring(speakerEndIndex + 1);
        return (
          <p key={i} className="mb-4 border-l-2 border-slate-700 pl-4 py-1 hover:border-yellow-500 transition-colors">
            <span className="font-black text-white bg-slate-800 px-2 py-0.5 rounded mr-2 text-[10px] uppercase tracking-tighter">
              {speaker}
            </span>
            <span className="text-slate-300">{content}</span>
          </p>
        );
      }
      
      return <p key={i} className="mb-4 text-slate-400">{line}</p>;
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn text-sm md:text-base pb-20">
      
      {/* Información General */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SectionHeader title="Asistentes" icon={<Users size={20} />} />
            <div className="flex flex-wrap gap-2">
              {data.participants.length > 0 ? (
                 data.participants.map((p, i) => (
                   <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                     {p}
                   </span>
                 ))
              ) : <span className="text-slate-500 italic">No identificados</span>}
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600"><Calendar size={16} /> <span className="font-medium">Fecha:</span></div>
                <span className="text-slate-900 font-semibold">{data.meetingDate}</span>
             </div>
             <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600"><Clock size={16} /> <span className="font-medium">Hora:</span></div>
                <span className="text-slate-900 font-semibold">{data.meetingTime}</span>
             </div>
             <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600"><MapPin size={16} /> <span className="font-medium">Lugar:</span></div>
                <span className="text-slate-900 font-semibold">{data.meetingLocation}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Cuerpo del Acta */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
        <section>
          <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
            <Target size={14} /> Objetivo y Desarrollo
          </div>
          
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              Objetivo General
            </h4>
            <div className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
              {data.generalObjective}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-2">Antecedentes</h4>
            <p className="text-slate-700 leading-relaxed">{data.background}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">Resumen del Desarrollo</h4>
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-white border border-slate-100 p-4 rounded-lg italic">
              {data.development}
            </div>
          </div>
        </section>

        {/* Tabla de Compromisos */}
        <section>
          <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg font-bold uppercase text-xs tracking-widest flex items-center gap-2">
            <CheckSquare size={14} /> Resoluciones y Acuerdos
          </div>
          <div className="overflow-x-auto border border-t-0 border-slate-200 rounded-b-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4 border-b border-slate-200">Acuerdo</th>
                  <th className="p-4 border-b border-slate-200">Responsable</th>
                  <th className="p-4 border-b border-slate-200">Plazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.commitments.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-800 text-sm">
                      <span className="font-bold text-yellow-600 mr-2">{idx + 1}.</span>
                      {item.resolution}
                    </td>
                    <td className="p-4 text-slate-600 text-sm font-medium">{item.responsible}</td>
                    <td className="p-4 text-slate-500 text-sm italic">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Transcripción Detallada */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
         <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
               <div className="bg-yellow-600 text-white p-2 rounded-lg">
                  <AlignLeft size={18} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900">Transcripción Integra</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Organizada por párrafos e identificación de voz</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={handleCopy}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
               >
                 {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                 {copied ? "Copiado" : "Copiar"}
               </button>
               <button 
                 onClick={() => setShowTranscript(!showTranscript)}
                 className="p-2 hover:bg-slate-200 rounded-full transition-colors"
               >
                 {showTranscript ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
               </button>
            </div>
         </div>

         {showTranscript && (
           <div className="p-6 pt-4 animate-fadeIn">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 max-h-[700px] overflow-y-auto font-mono text-xs leading-relaxed shadow-inner">
                 {formatTranscription(data.fullTranscription)}
              </div>
           </div>
         )}
      </div>
    </div>
  );
};