import type { IRDiagram } from '@speakdraw/shared';

/**
 * Options for LLM-generated IR.
 */
export interface GenerateIROptions {
  /** Max retry count (default 3) */
  maxRetries?: number;
  /** Single-call timeout in ms (default 30000) */
  timeout?: number;
  /** Custom system prompt (overrides built-in) */
  systemPrompt?: string;
  /** Explicit diagram type (auto-detected if omitted) */
  diagramType?: IRDiagram['type'];
}

/**
 * LLM Provider interface — abstraction port for semantic extraction.
 * Each LLM vendor implements this interface.
 *
 * To add a new implementation: 1) implement interface 2) register in provider factory 3) add tests.
 */
export interface LLMProvider {
  /** Unique provider name, e.g. "openai", "anthropic" */
  readonly name: string;

  /**
   * Convert natural language text to IRDiagram intermediate representation.
   * Auto-detects diagram type and layout direction.
   *
   * @param text - Natural language description
   * @param options - Optional configuration
   * @returns Validated IRDiagram
   */
  generateIR(text: string, options?: GenerateIROptions): Promise<IRDiagram>;
}
