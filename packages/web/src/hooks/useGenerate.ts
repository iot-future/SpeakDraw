import { useCallback } from 'react';
import { useSessionStore } from '../stores/session-store';
import { useConfigStore } from '../stores/config-store';
import { coreBridge } from '../services/core-bridge';

export function useGenerate(): {
  generate: (text: string) => Promise<void>;
  isGenerating: boolean;
} {
  // Batch all session selectors into a single subscription to reduce re-renders
  const {
    addUserMessage,
    addAssistantMessage,
    setStep,
    setXml,
    setSessionId,
    sessionId,
    isGenerating,
  } = useSessionStore((s) => ({
    addUserMessage: s.addUserMessage,
    addAssistantMessage: s.addAssistantMessage,
    setStep: s.setStep,
    setXml: s.setXml,
    setSessionId: s.setSessionId,
    sessionId: s.sessionId,
    isGenerating:
      s.currentStep.phase !== 'idle' &&
      s.currentStep.phase !== 'done' &&
      s.currentStep.phase !== 'error',
  }));

  const generate = useCallback(
    async (text: string) => {
      const { apiKey, provider, model } = useConfigStore.getState();

      if (!apiKey) {
        setStep({ phase: 'error', message: 'Please set your API key in Settings first.' });
        return;
      }

      addUserMessage(text);
      setStep({ phase: 'analyzing', message: 'Analyzing your description...' });
      const startTime = Date.now();

      try {
        const result = await coreBridge.generate({
          text,
          apiKey,
          provider,
          model,
          sessionId: sessionId ?? undefined,
        });

        setStep({ phase: 'laying-out', message: 'Computing layout...' });
        // Yield to React for re-render
        await new Promise<void>((r) => setTimeout(r, 0));

        setStep({ phase: 'rendering', message: 'Rendering diagram...' });

        setSessionId(result.sessionId);
        setXml(result.xml);
        addAssistantMessage(
          `Generated diagram with ${result.ir.nodes.length} nodes and ${result.ir.edges.length} edges.`,
          result.xml,
        );

        setStep({
          phase: 'done',
          message: 'Done',
          durationMs: Date.now() - startTime,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setStep({ phase: 'error', message });
      }
    },
    [addUserMessage, addAssistantMessage, setStep, setXml, setSessionId, sessionId],
  );

  return { generate, isGenerating };
}
