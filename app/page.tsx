'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { M1_TASKS } from '@/data/tasks';
import { PatientEntry, TreatmentItem } from '@/types';
import SupervisorSelect from '@/components/SupervisorSelect';

// Hulpfunctie om snelle cijferinvoer naar ISO-datum om te zetten
function parseSmartDateInput(input: string): string | null {
  const clean = input.replace(/\D/g, '');
  if (clean.length === 8) {
    const d = parseInt(clean.slice(0, 2), 10);
    const m = parseInt(clean.slice(2, 4), 10);
    const y = parseInt(clean.slice(4, 8), 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  } else if (clean.length === 6) {
    const d = parseInt(clean.slice(0, 2), 10);
    const m = parseInt(clean.slice(2, 4), 10);
    const y = parseInt('20' + clean.slice(4, 6), 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

function formatIsoToDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export default function DentistryTrackerPage() {
  const [entries, setEntries] = useState<PatientEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'minima' | 'nieuw' | 'geschiedenis'>('nieuw');

  // Bewerken status
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Datum state
  const [dateIso, setDateIso] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateInputText, setDateInputText] = useState<string>(
    formatIsoToDisplay(new Date().toISOString().split('T')[0])
  );
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // Formulier state (optionele velden)
  const [patientNumber, setPatientNumber] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('CON');

  // Aantallen direct bijhouden per taak-id
  const [taskCountsInForm, setTaskCountsInForm] = useState<Record<string, number>>({});
  const [customTreatments, setCustomTreatments] = useState<{ id: string; name: string; count: number }[]>([]);
  const [newCustomName, setNewCustomName] = useState('');

  // Zoekfilter logboek
  const [searchTerm, setSearchTerm] = useState('');

  // Synchronisatie met LocalStorage
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

  // Datum tekstverandering afhandelen
  const handleDateTextChange = (val: string) => {
    setDateInputText(val);
    const parsedIso = parseSmartDateInput(val);
    if (parsedIso) {
      setDateIso(parsedIso);
    }
  };

  const handleNativeDatePickerChange = (iso: string) => {
    setDateIso(iso);
    setDateInputText(formatIsoToDisplay(iso));
  };

  // Totaal behaalde minima over alle opgeslagen sessies
  const totalMinimaCounts = useMemo(() => {
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

  // Direct verhogen / verlagen op de knoppen zelf
  const adjustTaskCount = (taskId: string, delta: number) => {
    setTaskCountsInForm((prev) => {
      const current = prev[taskId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[taskId];
      } else {
        updated[taskId] = next;
      }
      return updated;
    });
  };

  const adjustCustomCount = (id: string, delta: number) => {
    setCustomTreatments((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, count: item.count + delta } : item))
        .filter((item) => item.count > 0)
    );
  };

  const handleAddCustomTreatment = () => {
    if (!newCustomName.trim()) return;
    setCustomTreatments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newCustomName.trim(), count: 1 },
    ]);
    setNewCustomName('');
  };

  const totalItemsSelected =
    Object.values(taskCountsInForm).reduce((a, b) => a + b, 0) +
    customTreatments.reduce((a, b) => a + b.count, 0);

  // Formulier opslaan (Zowel nieuw als bewerken)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItemsSelected === 0) {
      alert('Kies minstens 1 verrichting door op het plusje (+) te tikken.');
      return;
    }

    const treatments: TreatmentItem[] = [
      ...Object.entries(taskCountsInForm).map(([taskId, count]) => ({
        taskId,
        count,
        isOfficialMinima: true,
      })),
      ...customTreatments.map((c) => ({
        taskId: c.id,
        customName: c.name,
        count: c.count,
        isOfficialMinima: false,
      })),
    ];

    if (editingEntryId) {
      // Bewerken van bestaande sessie
      const updated = entries.map((en) =>
        en.id === editingEntryId
          ? {
              ...en,
              date: dateIso,
              patientNumber: patientNumber.trim() || 'Geen nr.',
              supervisor: supervisor.trim() || 'Niet gespecificeerd',
              supervisorEmail: supervisorEmail.trim(),
              treatments,
              notes: notes.trim(),
            }
          : en
      );
      saveEntries(updated);
      setEditingEntryId(null);
    } else {
      // Nieuwe sessie
      const newEntry: PatientEntry = {
        id: crypto.randomUUID(),
        date: dateIso,
        patientNumber: patientNumber.trim() || 'Geen nr.',
        supervisor: supervisor.trim() || 'Niet gespecificeerd',
        supervisorEmail: supervisorEmail.trim(),
        treatments,
        notes: notes.trim(),
        createdAt: Date.now(),
      };
      saveEntries([newEntry, ...entries]);
    }

    // Reset velden
    setPatientNumber('');
    setSupervisor('');
    setSupervisorEmail('');
    setNotes('');
    setTaskCountsInForm({});
    setCustomTreatments([]);
    setActiveTab('minima');
  };

  // Laad sessie in om te bewerken
  const handleEditClick = (entry: PatientEntry) => {
    setEditingEntryId(entry.id);
    setDateIso(entry.date);
    setDateInputText(formatIsoToDisplay(entry.date));
    setPatientNumber(entry.patientNumber === 'Geen nr.' ? '' : entry.patientNumber);
    setSupervisor(entry.supervisor === 'Niet gespecificeerd' ? '' : entry.supervisor);
    setSupervisorEmail(entry.supervisorEmail || '');
    setNotes(entry.notes || '');

    const taskMap: Record<string, number> = {};
    const customs: { id: string; name: string; count: number }[] = [];

    entry.treatments.forEach((t) => {
      if (t.isOfficialMinima) {
        taskMap[t.taskId] = t.count;
      } else {
        customs.push({ id: t.taskId, name: t.customName || 'Vrije verrichting', count: t.count });
      }
    });

    setTaskCountsInForm(taskMap);
    setCustomTreatments(customs);
    setActiveTab('nieuw');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Wil je deze sessie verwijderen?')) {
      saveEntries(entries.filter((e) => e.id !== id));
    }
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
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦷</span>
            <div>
              <h1 className="text-base font-bold text-blue-900 leading-none">Minima Tracker</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Master 1 Tandheelkunde</p>
            </div>
          </div>
          {totalItemsSelected > 0 && activeTab === 'nieuw' && (
            <span className="text-xs bg-blue-600 text-white font-bold px-2.5 py-1 rounded-full animate-pulse">
              {totalItemsSelected} gekozen
            </span>
          )}
        </div>

        {/* Tab navigatie */}
        <div className="max-w-4xl mx-auto px-2 flex border-t border-slate-100 text-sm">
          <button
            onClick={() => setActiveTab('nieuw')}
            className={`flex-1 py-2.5 font-bold border-b-2 text-center transition ${
              activeTab === 'nieuw' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            ➕ {editingEntryId ? 'Bewerken' : 'Registreren'}
          </button>
          <button
            onClick={() => setActiveTab('minima')}
            className={`flex-1 py-2.5 font-bold border-b-2 text-center transition ${
              activeTab === 'minima' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            📊 Minima Voortgang
          </button>
          <button
            onClick={() => setActiveTab('geschiedenis')}
            className={`flex-1 py-2.5 font-bold border-b-2 text-center transition ${
              activeTab === 'geschiedenis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            📋 Logboek ({entries.length})
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-4">
        {/* ============================================================== */}
        {/* TAB 1: REGISTREREN MET COMPACTE SELECTIE EN SLIM DATUMVELD */}
        {/* ============================================================== */}
        {activeTab === 'nieuw' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingEntryId && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                <span>⚠️ Je bewerkt momenteel een bestaande sessie.</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntryId(null);
                    setTaskCountsInForm({});
                    setCustomTreatments([]);
                    setPatientNumber('');
                    setSupervisor('');
                    setSupervisorEmail('');
                  }}
                  className="font-bold underline text-amber-900"
                >
                  Annuleren
                </button>
              </div>
            )}

            {/* Bovenste gegevens (Geen enkel veld verplicht) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Slim datumveld */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Datum (Typ bv. 020526 of klik kalender)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={dateInputText}
                      onChange={(e) => handleDateTextChange(e.target.value)}
                      placeholder="DD/MM/JJJJ of 020526"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => hiddenDateInputRef.current?.showPicker()}
                      className="absolute right-2 p-1.5 text-slate-400 hover:text-blue-600 text-lg"
                      title="Kies via kalender"
                    >
                      📅
                    </button>
                    {/* Verborgen native datepicker */}
                    <input
                      ref={hiddenDateInputRef}
                      type="date"
                      value={dateIso}
                      onChange={(e) => handleNativeDatePickerChange(e.target.value)}
                      className="sr-only"
                    />
                  </div>
                </div>

                {/* Patiëntnummer (Optioneel) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Patiëntnummer (Optioneel)
                  </label>
                  <input
                    type="text"
                    placeholder="bv. 104829"
                    value={patientNumber}
                    onChange={(e) => setPatientNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Supervisor autocomplete (Optioneel) */}
                <SupervisorSelect
                  value={supervisor}
                  emailValue={supervisorEmail}
                  onChange={(name, email) => {
                    setSupervisor(name);
                    setSupervisorEmail(email);
                  }}
                />
              </div>
            </div>

            {/* Verrichtingen Kiezen (Direct tellen op het kaartje) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Selecteer verrichtingen (tik op + of -)
                </span>
                {/* Tabs voor disciplines */}
                <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                  {disciplines.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setSelectedDiscipline(d)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                        selectedDiscipline === d
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lijst van taken in actieve discipline */}
              <div className="space-y-2 pt-1">
                {M1_TASKS.filter((t) => t.discipline === selectedDiscipline).map((t) => {
                  const count = taskCountsInForm[t.id] || 0;
                  const isSelected = count > 0;

                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{t.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                            {t.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t.target ? `Minima: ${t.target}` : 'Registreren'}{' '}
                          {t.maxPerForm ? `· max ${t.maxPerForm}/form` : ''}
                        </p>
                      </div>

                      {/* Directe Counter Knoppen naast de naam */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => adjustTaskCount(t.id, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 text-sm flex items-center justify-center active:scale-95 shadow-2xs"
                          >
                            -
                          </button>
                        )}

                        <span
                          className={`w-7 text-center font-extrabold text-sm ${
                            isSelected ? 'text-blue-700 font-mono text-base' : 'text-slate-300'
                          }`}
                        >
                          {count}
                        </span>

                        <button
                          type="button"
                          onClick={() => adjustTaskCount(t.id, 1)}
                          className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center active:scale-95 shadow-2xs transition ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vrije/Extra verrichting toevoegen */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                  Niet-minima verrichting (Consult, Hechting, Spoed...)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Omschrijving..."
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTreatment}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    + Toevoegen
                  </button>
                </div>

                {customTreatments.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {customTreatments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-xs"
                      >
                        <span className="font-semibold text-slate-800">{c.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustCustomCount(c.id, -1)}
                            className="w-6 h-6 rounded bg-white border border-slate-300 font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold w-4 text-center">{c.count}</span>
                          <button
                            type="button"
                            onClick={() => adjustCustomCount(c.id, 1)}
                            className="w-6 h-6 rounded bg-white border border-slate-300 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notities (Optioneel) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Klinische notities / Elementnummers (Optioneel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="bv. 46 MO composiet gelegd onder rubberdam."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Grote Opslaan Knop */}
            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition text-white ${
                totalItemsSelected > 0
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-98'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {editingEntryId
                ? '✓ Wijzigingen Opslaan'
                : `Sessie Opslaan (${totalItemsSelected} verrichtingen)`}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MINIMA VOORTGANG */}
        {/* ============================================================== */}
        {activeTab === 'minima' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-500">Totaal Geregistreerd</p>
                <p className="text-2xl font-bold text-slate-800">{entries.length} sessies</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-xs font-semibold text-slate-500">Minima Voltooid</p>
                <p className="text-2xl font-bold text-blue-600">
                  {
                    M1_TASKS.filter(
                      (t) => t.target !== null && (totalMinimaCounts[t.id] || 0) >= t.target
                    ).length
                  }{' '}
                  / {M1_TASKS.filter((t) => t.target !== null).length}
                </p>
              </div>
            </div>

            {disciplines.map((disc) => {
              const discTasks = M1_TASKS.filter((t) => t.discipline === disc);
              return (
                <div key={disc} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> {disc}
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {discTasks.map((t) => {
                      const completed = totalMinimaCounts[t.id] || 0;
                      const hasTarget = t.target !== null;
                      const remaining = hasTarget ? Math.max(0, t.target! - completed) : null;
                      const pct = hasTarget ? Math.min(100, Math.round((completed / t.target!) * 100)) : 100;
                      const isFinished = hasTarget && remaining === 0;

                      return (
                        <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-xs text-slate-900 block truncate">
                              {t.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{t.code}</span>
                          </div>

                          <div className="w-32 text-right shrink-0">
                            {hasTarget ? (
                              <>
                                <div className="text-[11px] font-bold flex justify-between">
                                  <span>
                                    {completed}/{t.target}
                                  </span>
                                  <span className={isFinished ? 'text-green-600' : 'text-amber-600'}>
                                    {isFinished ? 'Klaar ✓' : `Nog ${remaining}`}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isFinished ? 'bg-green-500' : 'bg-blue-600'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {completed}× gelogd
                              </span>
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

        {/* ============================================================== */}
        {/* TAB 3: LOGBOEK MET BEWERK-OPTIE (✎) */}
        {/* ============================================================== */}
        {activeTab === 'geschiedenis' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800">Klinisch Logboek</h2>
              <input
                type="text"
                placeholder="Zoek in logboek..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {filteredEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Nog geen registraties gevonden.</p>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs border-b pb-2">
                    <span className="font-bold text-blue-700">{formatIsoToDisplay(entry.date)}</span>
                    <span className="text-slate-500">
                      Pt: <strong>{entry.patientNumber}</strong>
                    </span>
                    <span className="text-slate-500 truncate max-w-[120px]">
                      Sup: <strong>{entry.supervisor}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {entry.treatments.map((t, idx) => {
                      const def = M1_TASKS.find((x) => x.id === t.taskId);
                      return (
                        <span
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                            t.isOfficialMinima
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {def ? `${def.code}` : t.customName}: <strong>x{t.count}</strong>
                        </span>
                      );
                    })}
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                      “{entry.notes}”
                    </p>
                  )}

                  {/* Knoppen voor Bewerken en Verwijderen */}
                  <div className="flex justify-end gap-3 pt-1 border-t border-slate-50 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleEditClick(entry)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      ✎ Bewerken
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      🗑 Verwijderen
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