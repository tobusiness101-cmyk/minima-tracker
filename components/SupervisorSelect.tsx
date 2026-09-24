'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SUPERVISORS, Supervisor } from '@/data/supervisors';

interface SupervisorSelectProps {
  value: string;
  emailValue: string;
  onChange: (name: string, email: string) => void;
}

export default function SupervisorSelect({ value, emailValue, onChange }: SupervisorSelectProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Sluit dropdown bij klikken buiten component
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim() === ''
    ? SUPERVISORS.slice(0, 10)
    : SUPERVISORS.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.department.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  const handleSelect = (sup: Supervisor) => {
    setQuery(sup.name);
    onChange(sup.name, sup.email);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        Supervisor / Zaalassistent
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(e.target.value, ''); // Reset email als er handmatig een nieuwe naam getypt wordt
          }}
          placeholder="Typ naam of afdeling (bv. Bergmans, KTH)..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('', '');
            }}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggesties dropdown */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {filtered.map((s) => (
            <li
              key={s.email}
              onClick={() => handleSelect(s)}
              className="cursor-pointer px-3 py-2 text-xs hover:bg-blue-50 transition border-b border-slate-50 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{s.name}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  {s.department}
                </span>
              </div>
              <div className="text-[11px] text-blue-600 mt-0.5">{s.email}</div>
            </li>
          ))}
        </ul>
      )}

      {/* Toon geselecteerde e-mail badge */}
      {emailValue ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
          <span>✉️</span>
          <span className="font-mono text-[11px]">{emailValue}</span>
        </div>
      ) : query ? (
        <p className="mt-1 text-[11px] text-slate-400">Handmatige supervisor (geen officieel e-mailadres)</p>
      ) : null}
    </div>
  );
}