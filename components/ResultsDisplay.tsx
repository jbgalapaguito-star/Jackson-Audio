import React from 'react';
import { AnalysisResult } from '../types';
import { Target, History, FileText, CheckSquare, Calendar, Users, MapPin, Clock } from 'lucide-react';

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
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn text-sm md:text-base">
      
      {/* Meta Info Card */}
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
             <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-600"><Calendar size={16} /> <span className="font-medium">Fecha:</span></div>
                <span className="text-slate-900">{data.meetingDate}</span>
             </div>
             <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-600"><Clock size={16} /> <span className="font-medium">Hora:</span></div>
                <span className="text-slate-900">{data.meetingTime}</span>
             </div>
             <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-600"><MapPin size={16} /> <span className="font-medium">Lugar:</span></div>
                <span className="text-slate-900">{data.meetingLocation}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
        
        {/* Objective & Background */}
        <section>
          <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg font-bold uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
            <Target size={16} /> Objetivo, Antecedentes
          </div>
          
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-2">Objetivo General</h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
              {data.generalObjective || "No especificado."}
            </p>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-2">Antecedentes</h4>
            <p className="text-slate-700 leading-relaxed">
              {data.background || "Sin antecedentes previos mencionados."}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">Desarrollo</h4>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {data.development}
            </p>
          </div>
        </section>

        {/* Commitments Table */}
        <section>
          <div className="bg-slate-800 text-white px-4 py-2 rounded-t-lg font-bold uppercase text-sm tracking-wider mb-0 flex items-center gap-2">
            <CheckSquare size={16} /> Compromisos
          </div>
          <div className="overflow-x-auto border border-t-0 border-slate-200 rounded-b-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider">
                  <th className="p-4 border-b border-slate-200 w-1/2">Resoluciones / Acuerdos</th>
                  <th className="p-4 border-b border-slate-200 w-1/4">Responsable</th>
                  <th className="p-4 border-b border-slate-200 w-1/4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.commitments.length > 0 ? (
                  data.commitments.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 align-top">
                        <span className="font-mono text-slate-400 mr-2 text-xs">{idx + 1}.</span>
                        {item.resolution}
                      </td>
                      <td className="p-4 text-slate-600 align-top text-sm font-medium">{item.responsible}</td>
                      <td className="p-4 text-slate-600 align-top text-sm">{item.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 italic">No se detectaron compromisos explícitos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Next Meeting */}
        <section className="border-t border-slate-100 pt-6">
           <div className="flex items-center gap-2 mb-2">
             <Calendar className="text-yellow-600" size={18} />
             <h4 className="font-bold text-slate-900 uppercase text-sm">Próxima Reunión</h4>
           </div>
           <p className="text-slate-700 ml-7">{data.nextMeeting || "Por definir."}</p>
        </section>
      </div>
    </div>
  );
};