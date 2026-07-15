import type { ValidationOptions, ValidationReport } from '@speakdraw/shared';

/**
 * Validation port interface.
 *
 * Defines the contract for static geometry validation of draw.io XML.
 * Different implementations provide different detection strategies (static AABB / VLM visual / etc.).
 */
export interface ValidationPort {
  /**
   * Perform static geometry validation on draw.io XML.
   *
   * @param xml - draw.io mxGraphModel XML string
   * @param options - Validation options (tolerance, label detection, etc.)
   * @returns Validation report with conflict list and pass/fail status
   */
  validate(xml: string, options?: ValidationOptions): ValidationReport;
}
