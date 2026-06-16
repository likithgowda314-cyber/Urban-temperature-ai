import React, { useState } from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import { Check, X, Edit2, Save, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function ReviewField({ label, initialValue, confidence, source, onUpdate, fieldKey }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState('pending'); // pending, approved, rejected, edited

  const cn = (...args) => twMerge(clsx(...args));

  const handleApprove = () => {
    setStatus('approved');
    onUpdate(fieldKey, value, 'approved');
  };

  const handleReject = () => {
    setStatus('rejected');
    onUpdate(fieldKey, value, 'rejected');
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    setStatus('edited');
    onUpdate(fieldKey, value, 'edited');
  };

  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-start justify-between p-5 mb-4 rounded-2xl border bg-white shadow-sm transition-all duration-300",
      status === 'approved' && "border-green-300 bg-green-50/40 shadow-green-100/50",
      status === 'rejected' && "border-red-300 bg-red-50/40 shadow-red-100/50",
      status === 'edited' && "border-blue-300 bg-blue-50/40 shadow-blue-100/50",
      status === 'pending' && "border-slate-200 hover:shadow-md hover:border-slate-300"
    )}>
      <div className="flex-1 min-w-0 pr-0 md:pr-6 mb-4 md:mb-0">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</h3>
          <ConfidenceBadge level={confidence} />
          {source && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1.5 md:ml-2 border border-slate-200" title="Source location in document">
              <FileText size={12} className="text-blue-500" /> {source}
            </span>
          )}
        </div>
        
        {isEditing ? (
          <div className="flex items-start gap-2 mt-2">
            <textarea
              className="w-full text-slate-900 border border-slate-300 rounded-xl shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base p-3 bg-white outline-none transition-shadow"
              value={Array.isArray(value) ? value.join('\n') : value || ''}
              onChange={(e) => {
                const newValue = Array.isArray(initialValue) ? e.target.value.split('\n') : e.target.value;
                setValue(newValue);
              }}
              rows={Array.isArray(value) ? 4 : 2}
            />
            <button
              onClick={handleSaveEdit}
              className="p-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shrink-0"
              title="Save changes"
            >
              <Save size={20} />
            </button>
          </div>
        ) : (
          <div className="text-lg font-medium text-slate-800 break-words mt-1">
            {Array.isArray(value) ? (
              <ul className="list-none space-y-2 mt-1">
                {value.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-500 mt-1.5 text-xs">●</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span>{value || <span className="text-slate-400 italic font-normal">Not extracted</span>}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 md:pt-1">
        <button
          onClick={handleApprove}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border",
            status === 'approved' 
              ? "bg-green-100 text-green-800 border-green-200 shadow-sm" 
              : "bg-white text-slate-600 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 shadow-sm"
          )}
        >
          <Check size={16} strokeWidth={2.5} /> Approve
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border",
            isEditing || status === 'edited'
              ? "bg-blue-100 text-blue-800 border-blue-200 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-sm"
          )}
        >
          <Edit2 size={16} strokeWidth={2.5} /> Edit
        </button>
        <button
          onClick={handleReject}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border",
            status === 'rejected'
              ? "bg-red-100 text-red-800 border-red-200 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm"
          )}
        >
          <X size={16} strokeWidth={2.5} /> Reject
        </button>
      </div>
    </div>
  );
}
