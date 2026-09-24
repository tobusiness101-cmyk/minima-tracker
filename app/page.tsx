'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { M1_TASKS, TaskDefinition } from '@/data/tasks';
import { PatientEntry, TreatmentItem } from '@/types';
import SupervisorSelect from '@/components/SupervisorSelect';

export default function DentistryTrackerPage() {
  const [entries, setEntries] = useState<PatientEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'minima' | 'nieuw' | 'geschiedenis'>('minima');

  // Formulier state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [patientNumber, setPatientNumber] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('CON');
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [customTreatmentName, setCustomTreatmentName] = useState('');

  // Zoekfilter voor het logboek
  const [searchTerm, setSearchTerm] = useState('');

  // LocalStorage synchronisatie
  useEffect(() => {
    const saved = localStorage.getItem('thk_minima_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Fout bij laden data', e);
      }
    }
  }, []);

  const saveEntries = (updated: PatientEntry[]) => {
    setEntries(updated);
    localStorage.setItem('thk_minima_entries', JSON.stringify(updated));
  };

  // Aggregatie van behaalde minima
  const taskCounts = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((entry) => {
      entry.treatments.forEach((t) => {
        if (t.isOfficialMinima) {
          map[t.taskId] = (map[t.taskId] || 0) + Number(t.count);
        }
      });
    });
    return map;
  }, [entries]);

  // Toevoegen verrichting aan formulier
  const handleAddTreatment = (taskId: string, isOfficial: boolean, customName?: string) => {
    setTreatments((prev) => {
      const existing = prev.find((t) => t.taskId === taskId && t.customName === customName);
      if (existing) {
        return prev.map((t) =>
          t.taskId === taskId && t.customName === customName
            ? { ...t, count: t.count + 1 }
            : t
        );
      }
      return [...prev, { taskId, count: 1, isOfficialMinima: isOfficial, customName }];
    });
  };

  const handleUpdateTreatmentCount = (index: number, delta: number) => {
    setTreatments((prev) => {
      const updated = [...prev];
      const newCount = updated[index].count + delta;
      if (newCount <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].count = newCount;
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientNumber.trim() || treatments.length === 0) {
      alert('Vul minimaal een patiëntnummer in en selecteer minstens 1 verrichting.');
      return;
    }

    const newEntry: PatientEntry = {
      id: crypto.randomUUID(),
      date,
      patientNumber: patientNumber.trim(),
      supervisor: supervisor.trim() || 'Niet gespecificeerd',
      supervisorEmail: supervisorEmail.trim(),
      treatments,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    saveEntries([newEntry, ...entries]);

    // Reset velden
    setPatientNumber('');
    setSupervisor('');
    setSupervisorEmail('');
    setNotes('');
    setTreatments([]);
    setActiveTab('minima');
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Weet je zeker dat je deze sessie wilt verwijderen?')) {
      const updated = entries.filter((e) => e.id !== id);
      saveEntries(updated);
    }
  };

  // CSV Export voor portfolio
  const exportToCSV = () => {
    const headers = ['Datum', 'Patiëntnummer', 'Supervisor', 'Supervisor Email', 'Verrichting', 'Code', 'Aantal', 'Minima Verrichting', 'Notities'];
    const rows: string[] = [];

    entries.forEach((e) => {
      e.treatments.forEach((t) => {
        const official = M1_TASKS.find((task) => task.id === t.taskId);
        rows.push([
          `"${e.date}"`,
          `"${e.patientNumber}"`,
          `"${e.supervisor}"`,
          `"${e.supervisorEmail || ''}"`,
          `"${official ? official.name : t.customName || 'Onbekend'}"`,
          `"${official ? official.code : '-'}"`,
          t.count,
          t.isOfficialMinima ? 'Ja' : 'Nee',
          `"${e.notes || ''}"`,
        ].join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `minima_kliniek_export_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const disciplines = ['CON', 'PROTH UP', 'PROTH K&B', 'ORD', 'PAR', 'MKA', 'Stage'] as const;

  const filteredEntries = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter((e) => {
      return (
        e.patientNumber.toLowerCase().includes(q) ||
        e.supervisor.toLowerCase().includes(q) ||
        (e.supervisorEmail && e.supervisorEmail.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        e.treatments.some((t) => {
          const def = M1_TASKS.find((m) => m.id === t.taskId);
          return (
            (def && (def.name.toLowerCase().includes(q) || def.code.toLowerCase().includes(q))) ||
            (t.customName && t.customName.toLowerCase().includes(q))
          );
        })
      );
    });
  }, [entries, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <span>🦷</span> Kliniek Minima Tracker
            </h1>
            <p className="text-xs text-slate-500">KU Leuven THK Master 1</p>
          </div>
          <button
            onClick={exportToCSV}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg shadow-sm transition"
          >
            Exporteer Excel/CSV
          </button>
        </div>

        {/* Tab navigatie */}
        <div className="max-w-5xl mx-auto px-4 flex border-t border-slate-100">
          <button
            onClick={() => setActiveTab('minima')}
            className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'minima' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            📊 Voortgang & Minima
          </button>
          <button
            onClick={() => setActiveTab('nieuw')}
            className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'nieuw' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            ➕ Patiënt Invoeren
          </button>
          <button
            onClick={() => setActiveTab('geschiedenis')}
            className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'geschiedenis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            📋 Logboek ({entries.length})
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* TAB 1: MINIMA STATUS OVERZICHT */}
        {activeTab === 'minima' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Patiënten Geholpen</p>
                <p className="text-2xl font-bold text-slate-800">{entries.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Minima Voltooid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {
                    M1_TASKS.filter((t) => t.target !== null && (taskCounts[t.id] || 0) >= t.target).length
                  } / {M1_TASKS.filter((t) => t.target !== null).length}
                </p>
              </div>
            </div>

            {disciplines.map((disc) => {
              const discTasks = M1_TASKS.filter((t) => t.discipline === disc);
              return (
                <div key={disc} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> {disc}
                  </h2>

                  <div className="divide-y divide-slate-100">
                    {discTasks.map((t) => {
                      const completed = taskCounts[t.id] || 0;
                      const hasTarget = t.target !== null;
                      const remaining = hasTarget ? Math.max(0, t.target! - completed) : null;
                      const pct = hasTarget ? Math.min(100, Math.round((completed / t.target!) * 100)) : 100;
                      const isFinished = hasTarget && remaining === 0;

                      return (
                        <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{t.name}</span>
                              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {t.code}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{t.category}</p>
                          </div>

                          <div className="flex items-center gap-4">
                            {hasTarget ? (
                              <div className="w-36 text-right">
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                  <span className={isFinished ? 'text-emerald-600' : 'text-slate-600'}>
                                    {completed} / {t.target}
                                  </span>
                                  <span className={isFinished ? 'text-emerald-600' : 'text-amber-600'}>
                                    {isFinished ? 'Voltooid! ✓' : `Nog ${remaining}`}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isFinished ? 'bg-emerald-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md font-medium">
                                  {completed} geregistreerd
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: NIEUWE PATIËNT / BEHANDELING TOEVOEGEN */}
        {activeTab === 'nieuw' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Sessie Registreren</h2>

            {/* Patiënt & Supervisor Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Datum</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Patiëntnummer</label>
                <input
                  type="text"
                  placeholder="bv. 104829"
                  value={patientNumber}
                  onChange={(e) => setPatientNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* SUPERVISOR AUTOCOMPLETE MET EMAIL KOPPELING */}
              <SupervisorSelect
                value={supervisor}
                emailValue={supervisorEmail}
                onChange={(name, email) => {
                  setSupervisor(name);
                  setSupervisorEmail(email);
                }}
              />
            </div>

            {/* Selectie verrichtingen */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">1. Kies Verrichting(en)</span>
                {/* Discipline switcher */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {disciplines.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setSelectedDiscipline(d)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                        selectedDiscipline === d ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid met taken uit geselecteerde discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {M1_TASKS.filter((t) => t.discipline === selectedDiscipline).map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => handleAddTreatment(t.id, true)}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{t.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.code}</div>
                    </div>
                    <span className="text-blue-600 text-xs font-bold bg-blue-100 px-2 py-0.5 rounded">+ Voeg toe</span>
                  </button>
                ))}
              </div>

              {/* Vrije/Niet-minima verrichting toevoegen */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Niet-minima verrichting toevoegen (bv. Consultatie, Hechting verwijderen)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Omschrijving verrichting..."
                    value={customTreatmentName}
                    onChange={(e) => setCustomTreatmentName(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTreatmentName.trim()) {
                        handleAddTreatment(crypto.randomUUID(), false, customTreatmentName.trim());
                        setCustomTreatmentName('');
                      }
                    }}
                    className="bg-slate-800 text-white px-3 py-1 text-xs rounded-lg font-medium hover:bg-slate-700"
                  >
                    + Toevoegen
                  </button>
                </div>
              </div>
            </div>

            {/* Geselecteerde Verrichtingen Lijst */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                Geselecteerde verrichtingen voor deze sessie ({treatments.length})
              </label>
              {treatments.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nog geen verrichtingen geselecteerd.</p>
              ) : (
                <div className="space-y-2">
                  {treatments.map((t, idx) => {
                    const taskDef = M1_TASKS.find((x) => x.id === t.taskId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="font-semibold text-xs text-blue-950">
                            {taskDef ? taskDef.name : t.customName}
                          </p>
                          <span className="text-[10px] text-blue-600 uppercase font-bold">
                            {t.isOfficialMinima ? `Minima: ${taskDef?.code}` : 'Extra Verrichting'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateTreatmentCount(idx, -1)}
                            className="w-6 h-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center text-slate-600 text-xs"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{t.count}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateTreatmentCount(idx, 1)}
                            className="w-6 h-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center text-slate-600 text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Vrije klinische notities */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Klinische Details / Elementnummers
              </label>
              <textarea
                placeholder="bv. 46 MO composiet gelegd onder rubberdam. Anesthesie infiltratie 1 carpule Articaïne."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition"
            >
              Sessie Opslaan & Minima Bijwerken
            </button>
          </form>
        )}

        {/* TAB 3: GESCHIEDENIS / LOGBOEK */}
        {activeTab === 'geschiedenis' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800">Klinisch Logboek</h2>
              <input
                type="text"
                placeholder="Zoek op patiënt, supervisor, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs max-w-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {filteredEntries.length === 0 ? (
              <p className="text-sm text-slate-400">Geen patiëntensessies gevonden.</p>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex flex-wrap items-center justify-between border-b pb-2 text-xs text-slate-500">
                    <span className="font-bold text-slate-800 text-sm">Patiënt: #{entry.patientNumber}</span>
                    <span>Datum: {entry.date}</span>
                    <div className="flex items-center gap-1.5">
                      <span>Supervisor: <strong>{entry.supervisor}</strong></span>
                      {entry.supervisorEmail && (
                        <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {entry.supervisorEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {entry.treatments.map((t, idx) => {
                      const def = M1_TASKS.find((x) => x.id === t.taskId);
                      return (
                        <span
                          key={idx}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                            t.isOfficialMinima
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {def ? `${def.name} (${def.code})` : t.customName}: <strong>x{t.count}</strong>
                        </span>
                      );
                    })}
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      <strong>Notitie:</strong> {entry.notes}
                    </p>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
                    >
                      Verwijder sessie
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}