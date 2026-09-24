export interface TaskDefinition {
  id: string;
  discipline: 'CON' | 'PROTH UP' | 'PROTH K&B' | 'ORD' | 'PAR' | 'MKA' | 'Stage';
  category: string;
  name: string;
  code: string;
  target: number | null;
  isRegisteredOnly: boolean;
  maxPerForm?: string;
}

export const M1_TASKS: TaskDefinition[] = [
  // CON
  { id: 'mo', discipline: 'CON', category: 'Mondgezondheidsbilan/Preventie', name: 'Mondonderzoek', code: 'MO', target: 18, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'dpsi_con', discipline: 'CON', category: 'Mondgezondheidsbilan/Preventie', name: 'Parodontale Index', code: 'DPSI-CON', target: 15, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'prev', discipline: 'CON', category: 'Mondgezondheidsbilan/Preventie', name: 'Preventie: anamnese, advies en instructie', code: 'PREV', target: 15, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'f', discipline: 'CON', category: 'Mondgezondheidsbilan/Preventie', name: 'Fluoridering', code: 'F', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'prof', discipline: 'CON', category: 'Mondgezondheidsbilan/Preventie', name: 'Professionele reiniging', code: 'PROF', target: 15, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 's', discipline: 'CON', category: 'Mondgezondheidsbilan/Preventie', name: 'Verzegeling', code: 'S', target: null, isRegisteredOnly: true, maxPerForm: '1-4' },
  { id: 'vull', discipline: 'CON', category: 'Direct herstel', name: 'Definitieve vulling (per tand - GI & composiet)', code: 'VULL', target: 14, isRegisteredOnly: false, maxPerForm: '1-6' },
  { id: 'rd', discipline: 'CON', category: 'Direct herstel', name: 'Rubberdam', code: 'RD', target: 12, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'ext', discipline: 'CON', category: 'Extractie', name: 'Extractie', code: 'EXT', target: null, isRegisteredOnly: true, maxPerForm: '1-4' },
  { id: 'kv', discipline: 'CON', category: 'Endodontologie', name: 'Kanaalvulling (per kanaal)', code: 'KV', target: 1, isRegisteredOnly: false, maxPerForm: '1-5' },
  { id: 'exp', discipline: 'CON', category: 'Endodontologie', name: 'Expulp/acute expulp (per tand)', code: 'EXP', target: null, isRegisteredOnly: true, maxPerForm: '1' },

  // PROTH UP
  { id: 'sa_up', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Standaard afdruk', code: 'SA-UP', target: 2, isRegisteredOnly: false, maxPerForm: '1-2' },
  { id: 'ia', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Individuele afdruk', code: 'IA', target: 1, isRegisteredOnly: false, maxPerForm: '1-2' },
  { id: 'dreb', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Directe rebasing/relining prothese/Herstel', code: 'DREB', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'br', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Beetrelatiebepaling', code: 'BR', target: 1, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'piw', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Pas tandopstelling', code: 'PIW', target: 1, isRegisteredOnly: false, maxPerForm: '1-2' },
  { id: 'pp', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Plaatsen prothese', code: 'PP', target: 1, isRegisteredOnly: false, maxPerForm: '1-2' },
  { id: 'cpp', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Controle na plaatsen prothese', code: 'CPP', target: 1, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'sfp', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Slijpen nissen ifv frameprothese', code: 'SFP', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'pfm', discipline: 'PROTH UP', category: 'Uitneembare prothese', name: 'Pas frame-metaal', code: 'PFM', target: 1, isRegisteredOnly: false, maxPerForm: '1-2' },

  // PROTH K&B
  { id: 'sa_kbw', discipline: 'PROTH K&B', category: 'Kroon- en Brugwerk', name: 'Standaard afdruk KBW (dentaat)', code: 'SA', target: 4, isRegisteredOnly: false, maxPerForm: '1-2' },
  { id: 'sau_kbw', discipline: 'PROTH K&B', category: 'Kroon- en Brugwerk', name: 'Standaard afdruk uitgieten (dentaat)', code: 'SAU-KBW', target: 2, isRegisteredOnly: false, maxPerForm: '1-2' },
  { id: 'ia_kbw', discipline: 'PROTH K&B', category: 'Kroon- en Brugwerk', name: 'Ingipsen in articulator (dentaat)', code: 'IA-K&B', target: 1, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'kl', discipline: 'PROTH K&B', category: 'Kroon- en Brugwerk', name: 'Kleurbepaling KBW', code: 'KL', target: 2, isRegisteredOnly: false, maxPerForm: '1' },

  // ORD
  { id: 'kd', discipline: 'ORD', category: 'Orthodontie', name: 'Klinische diagnose', code: 'KD', target: 2, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'ca', discipline: 'ORD', category: 'Orthodontie', name: 'Cefalometrische analyse', code: 'CA', target: 1, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'ua_fa', discipline: 'ORD', category: 'Orthodontie', name: 'Uitneembare apparatuur (participatie)', code: 'UA/FA', target: 2, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'fa', discipline: 'ORD', category: 'Orthodontie', name: 'Vaste apparatuur (participatie)', code: 'FA', target: 4, isRegisteredOnly: false, maxPerForm: '1' },

  // PAR
  { id: 'dpsi_par', discipline: 'PAR', category: 'Parodontologie', name: 'Parodontale Index', code: 'DPSI', target: 8, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'ps', discipline: 'PAR', category: 'Parodontologie', name: 'Parodontale status', code: 'PS', target: 1, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'gipi', discipline: 'PAR', category: 'Parodontologie', name: 'GIPI en instructie mondhygiëne', code: 'GIPI', target: 5, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'te', discipline: 'PAR', category: 'Parodontologie', name: 'Theoretische uitleg', code: 'TE', target: 2, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'rx', discipline: 'PAR', category: 'Parodontologie', name: 'RX peri-apicaal', code: 'RX', target: 8, isRegisteredOnly: false, maxPerForm: '1-10' },
  { id: 'sc', discipline: 'PAR', category: 'Parodontologie', name: 'Scaling (volledige mond)', code: 'SC', target: 5, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'rp', discipline: 'PAR', category: 'Parodontologie', name: 'Rootplaning per kwadrant', code: 'RP', target: null, isRegisteredOnly: true, maxPerForm: '1-2' },
  { id: 'pe', discipline: 'PAR', category: 'Parodontale chirurgie', name: 'Papilexcisie of gengivectomie', code: 'PE', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'paror', discipline: 'PAR', category: 'Parodontale chirurgie', name: 'Participatie in de operatiezaal', code: 'PAROR', target: 1, isRegisteredOnly: false, maxPerForm: '1' },

  // MKA
  { id: 'ext_h', discipline: 'MKA', category: 'MKA', name: 'Extracties inclusief hechtingen', code: 'EXT+H', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'la', discipline: 'MKA', category: 'MKA', name: 'Lokale anesthesie onder supervisie', code: 'LA', target: 2, isRegisteredOnly: false, maxPerForm: '1' },
  { id: 'ra', discipline: 'MKA', category: 'MKA', name: 'Halve dag raadpleging St Raf/onco GHB', code: 'RA', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'cdc_ok', discipline: 'MKA', category: 'MKA', name: 'Halve dag CDC St Raf/OK1/OK2 GHB', code: 'CDC-OK', target: null, isRegisteredOnly: true, maxPerForm: '1' },

  // Stage / Assistentie
  { id: 'a_stk', discipline: 'Stage', category: 'Assistentie', name: 'Assistentie medestudent in STK (halve dag)', code: 'A-STK', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'a_res', discipline: 'Stage', category: 'Assistentie', name: 'Assistentie Restoratieve THK (halve dag)', code: 'A-RES', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'a_end', discipline: 'Stage', category: 'Assistentie', name: 'Assistentie Endodontologie (halve dag)', code: 'A-END', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'a_ord', discipline: 'Stage', category: 'Assistentie', name: 'Assistentie Orthodontie (halve dag)', code: 'A-ORD', target: null, isRegisteredOnly: true, maxPerForm: '1' },
  { id: 'a_par', discipline: 'Stage', category: 'Assistentie', name: 'Assistentie Parodontologie (halve dag)', code: 'A-PAR', target: null, isRegisteredOnly: true, maxPerForm: '1' },
];