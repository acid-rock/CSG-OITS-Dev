# ADR 003 — Centralized data fetching in Root-layout

**Status:** Accepted
**Date:** 2026-05

## Context

The public-facing site has multiple sections (announcements, documents, events,
officers, committees, organizations, equipment) that appear on both the homepage
and dedicated pages. Fetching data individually in each component creates
duplicated requests and inconsistent loading states.

## Decision

`frontend/src/root-layout/Root-layout.tsx` fetches ALL public data on mount
via a single `Promise.all` call and passes results to child routes via React
Router's outlet context (`useOutletContext`).

## Consequences

- Every page render triggers all API calls regardless of which data the
  specific page actually needs — this is a known trade-off accepted for
  simplicity at the current scale
- Child route components must NOT add their own fetch calls for data already
  in the outlet context — use `useOutletContext()` instead
- If the outlet context grows too large for performance, the fix is to split
  into per-route loaders using React Router's `loader` function API — not to
  add individual component-level fetches

## Rules enforced by this decision

New public data sources (new tables) MUST be added to Root-layout's Promise.all.
New public page components MUST consume data from outlet context, not fetch independently.
