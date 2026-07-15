import { apiClient } from './api-client';
import type { IRDiagram, LayoutResult, ValidationReport } from '@speakdraw/shared';

export interface GenerateParams {
  text: string;
  apiKey: string;
  provider: string;
  model?: string;
  sessionId?: string;
}

export interface GenerateResult {
  sessionId: string;
  xml: string;
  ir: IRDiagram;
  layout: LayoutResult;
}

export const coreBridge = {
  generate: (params: GenerateParams): Promise<GenerateResult> =>
    apiClient.post<GenerateResult>('/generate', params),

  validate: (xml: string): Promise<ValidationReport> =>
    apiClient.post<ValidationReport>('/validate', { xml }),

  layout: (ir: IRDiagram): Promise<{ xml: string; layout: LayoutResult }> =>
    apiClient.post<{ xml: string; layout: LayoutResult }>('/layout', { ir }),

  createSession: (): Promise<{ sessionId: string; createdAt: number }> =>
    apiClient.post<{ sessionId: string; createdAt: number }>('/sessions', {}),

  getSession: (id: string): Promise<{ sessionId: string; xml: string | null }> =>
    apiClient.get<{ sessionId: string; xml: string | null }>(`/sessions/${id}`),
};
