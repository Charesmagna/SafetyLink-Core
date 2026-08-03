import React, { useState } from 'react';
import { FileText, Save, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { useAppStore } from '../utils/store';

export const IncidentReportingTemplates: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const { addToast } = useAppStore();

  const templates = [
    { id: 't-1', name: 'Post-Dispatch Debrief', description: 'Automated logging of responder dispatch details, timelines, and resolution.', color: 'blue' },
    { id: 't-2', name: 'Hardware Failure Report', description: 'Template for reporting mesh node disconnections and hardware telemetry failures.', color: 'amber' },
    { id: 't-3', name: 'Severe Security Breach', description: 'High-priority template for verified physical security breaches.', color: 'red' }
  ];

  const handleRunTemplate = (id: string) => {
    addToast('Executing automated report generation...', 'info');
    setTimeout(() => {
      addToast('Report template populated from telemetry logs.', 'success');
      setActiveTemplate(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-black text-slate-200 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Automated Incident Reporting Templates
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Standardize incident documentation. Templates automatically inject telemetry, timeline data, and responder metrics.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-2">{t.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{t.description}</p>
              </div>
              <button
                onClick={() => handleRunTemplate(t.id)}
                className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-colors
                  ${t.color === 'blue' ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20' : ''}
                  ${t.color === 'amber' ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20' : ''}
                  ${t.color === 'red' ? 'bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20' : ''}
                `}
              >
                <Play className="w-3 h-3" /> Execute
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
