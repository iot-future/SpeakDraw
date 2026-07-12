import { describe, it, expect } from 'vitest';

describe('@ai-diagram/core', () => {
  it('should export core module', async () => {
    const mod = await import('./index.js');
    expect(mod).toBeDefined();
  });
});
