import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { App } from './app.tsx';

describe('App', () => {
  it('mounts', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('anupubba');
  });
});
