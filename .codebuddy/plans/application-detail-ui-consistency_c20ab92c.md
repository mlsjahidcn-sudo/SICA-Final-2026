---
name: application-detail-ui-consistency
overview: Standardize UI and responsive design across admin application detail pages (Partner Applications and Individual Applications)
design:
  styleKeywords:
    - Minimalist
    - Card-based
    - Professional
    - Consistent
    - Responsive
  fontSystem:
    fontFamily: system-ui
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
todos:
  - id: standardize-individual-app-detail
    content: Standardize Individual Application Detail page UI to match Partner Application pattern
    status: completed
  - id: refine-partner-app-detail
    content: Refine Partner Application Detail page for full consistency
    status: completed
    dependencies:
      - standardize-individual-app-detail
  - id: test-responsive-layout
    content: Test responsive layout on all detail pages
    status: completed
    dependencies:
      - standardize-individual-app-detail
---

## User Requirements

Make the admin detail pages UI consistent and responsive across Partner Applications, Individual Applications, and Partner Students pages.

## Current Issues Identified

1. **Card Title Sizes**: Partner pages use `text-base` with `h-4 w-4` icons; Individual Application uses `text-lg` with `h-5 w-5` icons
2. **Header Hierarchy**: Partner pages use `h2`, Individual Application uses `h1`
3. **Back Button**: Partner pages have text "Back", Individual Application has icon-only
4. **InfoRow Component**: Different styling between pages (stacking vs inline)
5. **Status Timeline**: Only Partner Applications has visual timeline
6. **Sidebar Cards**: Different header styles (`text-sm font-medium` vs `text-base`)
7. **Responsive Issues**: Some elements may not scale well on mobile

## Core Features

- Standardize card component styling across all detail pages
- Make header consistent (h2, back button with text, proper hierarchy)
- Use consistent InfoItem/StatRow components
- Ensure responsive grid layouts work on all screen sizes
- Add status timeline to Individual Application detail if beneficial

## Tech Stack

- Framework: Next.js with React + TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui (Card, Button, Badge, Avatar, Separator)
- Icons: Lucide React

## Implementation Approach

Standardize all admin detail pages to follow the same design pattern used in Partner Students and Partner Application detail pages (the more polished versions):

1. **Card Headers**: Use `text-base` with `h-4 w-4` icons, left-aligned with gap-2
2. **Page Headers**: Use `h2` with consistent back button and separator
3. **Info Components**: Create shared `InfoItem` and `StatRow` components
4. **Grid Layout**: Use `grid-cols-1 lg:grid-cols-3` with `lg:col-span-2` for main content
5. **Sidebar**: Consistent card styling with `text-sm font-medium text-muted-foreground` headers

## Key Files to Modify

- `/src/app/admin/(admin-v2)/v2/applications/[id]/page.tsx` - Individual Application Detail (main standardization target)
- `/src/app/admin/(admin-v2)/v2/partner-applications/[id]/page.tsx` - Minor refinements if needed
- `/src/app/admin/(admin-v2)/v2/partner-students/[id]/page.tsx` - Reference for consistency