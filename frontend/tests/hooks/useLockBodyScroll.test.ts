import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLockBodyScroll } from '../../src/hooks/useLockBodyScroll';

describe('useLockBodyScroll', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('sets overflow:hidden when isLocked is true', () => {
    renderHook(() => useLockBodyScroll(true));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('does not change overflow when isLocked is false', () => {
    document.body.style.overflow = 'auto';
    renderHook(() => useLockBodyScroll(false));
    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores original overflow on unmount', () => {
    document.body.style.overflow = 'scroll';
    const { unmount } = renderHook(() => useLockBodyScroll(true));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('restores overflow when isLocked switches from true to false', () => {
    // Original is '' (cleared in beforeEach)
    const { rerender } = renderHook(
      ({ locked }: { locked: boolean }) => useLockBodyScroll(locked),
      { initialProps: { locked: true } },
    );
    expect(document.body.style.overflow).toBe('hidden');
    // Re-render with locked=false: cleanup from the true-run fires, restoring ''
    rerender({ locked: false });
    expect(document.body.style.overflow).toBe('');
  });
});
