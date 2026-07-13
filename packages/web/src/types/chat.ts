export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  xml?: string; // Only for assistant messages with generated diagram
}

export interface StepState {
  phase: 'idle' | 'analyzing' | 'laying-out' | 'rendering' | 'done' | 'error';
  message: string;
  durationMs?: number;
}
