---
name: partner-applications-status-sync
overview: Fix partner applications status not updating after admin changes by adding event listener for real-time updates in the applications page
todos:
  - id: add-event-listener
    content: Add useEffect event listener for 'partner-application-update' in partner applications page to refresh data on status changes
    status: completed
---

## Product Overview

Fix the bug where partner application statuses don't update in real-time after admin changes them.

## Core Features

- Add event listener for `partner-application-update` custom events in the partner applications page
- Trigger data refresh when admin status changes are received via WebSocket
- Optionally add fallback polling mechanism for reliability

## Problem Analysis

The `PartnerRealtimeProvider` dispatches `partner-application-update` custom events when WebSocket receives `application_update` messages, and toast notifications work (proving the WebSocket mechanism functions correctly). However, the applications page only calls `fetchApplications()` on mount — no event listener exists to catch these events and refresh the data.

## Tech Stack

- Framework: Next.js 14 App Router with React
- State Management: React useState, useCallback, useEffect
- Realtime: WebSocket via PartnerRealtimeProvider with custom events
- Styling: Tailwind CSS + shadcn/ui

## Implementation Approach

Add a `useEffect` event listener in `src/app/(partner-v2)/partner-v2/applications/page.tsx` to listen for `partner-application-update` custom events dispatched by `PartnerRealtimeProvider`, and call `fetchApplications()` to refresh data when received.

## Key Files

| File | Purpose |
| --- | --- |
| `src/app/(partner-v2)/partner-v2/applications/page.tsx` | Main partner applications page — add event listener here |
| `src/components/partner-v2/partner-realtime-provider.tsx` | Dispatches `partner-application-update` events (reference for event structure) |


## Event Structure

The `PartnerRealtimeProvider` dispatches custom events with:

- Event name: `partner-application-update`
- Detail payload: `{ action: 'updated', applicationId: string, status: string, timestamp: number }`

## Agent Extensions

No extensions required for this task. The fix is straightforward React event handling.