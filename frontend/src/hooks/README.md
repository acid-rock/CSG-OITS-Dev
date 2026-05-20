# frontend/src/hooks

Custom React hooks shared across the frontend.

## Overview

Currently contains one hook. All modal components in both the public frontend and the admin panel must use this hook.

## Contents

### `useLockBodyScroll.ts`

Prevents background page scroll while a modal is open.

**Behavior:** Sets `document.body.style.overflow = 'hidden'` when called. Captures the original overflow value and restores it on cleanup (when the component unmounts or the dependency changes).

**Usage:**

```tsx
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

const MyModal = ({ isOpen }: { isOpen: boolean }) => {
  useLockBodyScroll(); // call unconditionally — always lock when modal mounts
  // ...
};
```

Since modals are conditionally rendered (mounted/unmounted based on `isOpen` state), calling `useLockBodyScroll()` inside the modal component body is sufficient — it locks on mount and unlocks on unmount.

**Required in:** `Modal.tsx`, `DocumentModal.tsx`, all admin form modals, `DeleteModal.tsx`, `ConfimationModal.tsx`, `SessionExpiredModal.tsx`.

## Conventions

- Every modal component must call `useLockBodyScroll()`.
- If adding a new hook, add it to this directory (not inside a component directory) if it is used by more than one component.

## Related

- [frontend/src/components/README.md](../components/README.md) — modal components that use this hook
- [frontend/src/admin/components/README.md](../admin/components/README.md) — admin modal components
