import { create } from 'zustand';
import type { ChatMessage, StepState } from '../types/chat';

interface SessionState {
  sessionId: string | null;
  xml: string | null;
  messages: ChatMessage[];
  currentStep: StepState;
  setSessionId: (id: string) => void;
  setXml: (xml: string) => void;
  addUserMessage: (text: string) => void;
  addAssistantMessage: (text: string, xml: string) => void;
  setStep: (step: StepState) => void;
  clearMessages: () => void;
}

let messageCounter = 0;

export const useSessionStore = create<SessionState>()((set) => ({
  sessionId: null,
  xml: null,
  messages: [],
  currentStep: { phase: 'idle', message: '' },
  setSessionId: (sessionId: string): void => {
    set({ sessionId });
  },
  setXml: (xml: string): void => {
    set({ xml });
  },
  addUserMessage: (content: string): void => {
    set((state) => ({
      messages: [
        ...state.messages,
        { id: `msg-${++messageCounter}`, role: 'user', content, timestamp: Date.now() },
      ],
    }));
  },
  addAssistantMessage: (content: string, xml: string): void => {
    set((state) => ({
      messages: [
        ...state.messages,
        { id: `msg-${++messageCounter}`, role: 'assistant', content, timestamp: Date.now(), xml },
      ],
    }));
  },
  setStep: (currentStep: StepState): void => {
    set({ currentStep });
  },
  clearMessages: (): void => {
    set({ messages: [] });
  },
}));
