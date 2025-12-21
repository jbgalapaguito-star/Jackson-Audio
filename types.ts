export interface Commitment {
  resolution: string;
  responsible: string;
  date: string;
}

export interface AnalysisResult {
  participants: string[];
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  generalObjective: string;
  background: string;
  development: string; // "Desarrollo"
  commitments: Commitment[];
  nextMeeting: string;
  fullTranscription: string; // New field for full text
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ProcessingError {
  message: string;
  details?: string;
}