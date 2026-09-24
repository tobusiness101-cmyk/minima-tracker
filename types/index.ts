export interface TreatmentItem {
  taskId: string;
  customName?: string;
  count: number;
  isOfficialMinima: boolean;
}

export interface PatientEntry {
  id: string;
  date: string;
  patientNumber: string;
  supervisor: string;
  supervisorEmail?: string;
  treatments: TreatmentItem[];
  notes?: string;
  createdAt: number;
}