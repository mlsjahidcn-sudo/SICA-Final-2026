---
name: Enhance Admin Add Application Form UI/UX
overview: Improve the Add Application dialog with better progress indicators, form validation, layout design, and user feedback mechanisms
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Modern
    - Clean
    - Professional
    - Wizard-style
    - Form-heavy
  fontSystem:
    fontFamily: Inter
    heading:
      size: 18px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#0F172A"
      - "#3B82F6"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
      - "#F1F5F9"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#22C55E"
      - "#F59E0B"
      - "#EF4444"
      - "#3B82F6"
todos:
  - id: setup-form-validation
    content: Install zod dependency and create validation schema with type definitions
    status: completed
  - id: create-step-components
    content: Extract step content into separate components (StudentSelectionStep, ProgramSelectionStep, DetailsStep, ReviewStep)
    status: completed
    dependencies:
      - setup-form-validation
  - id: integrate-progress-steps
    content: Replace custom step indicators with ProgressSteps component from ui/progress-steps.tsx
    status: completed
    dependencies:
      - create-step-components
  - id: migrate-to-react-hook-form
    content: Migrate AddApplicationDialog from useState to react-hook-form with FormProvider
    status: completed
    dependencies:
      - setup-form-validation
  - id: add-inline-validation
    content: Implement inline validation with FormField wrappers showing errors below fields
    status: completed
    dependencies:
      - migrate-to-react-hook-form
  - id: enhance-layout
    content: Improve field grouping, spacing, and visual hierarchy across all steps
    status: completed
    dependencies:
      - create-step-components
  - id: add-helper-text
    content: Add FormDescription and tooltips for complex fields (personal statement, study plan)
    status: completed
    dependencies:
      - enhance-layout
  - id: implement-step-validation
    content: Add step-level validation before navigation with error highlighting
    status: completed
    dependencies:
      - migrate-to-react-hook-form
  - id: add-accessibility
    content: Implement keyboard navigation and ARIA labels for step jumping and form fields
    status: completed
    dependencies:
      - integrate-progress-steps
---

## Product Overview

Enhance the Add Application form in the admin panel to provide a superior user experience with modern UI/UX design patterns.

## Core Features

- **Improved Progress Indicators**: Visual step completion percentage, animated progress bar, clickable step navigation
- **Real-time Form Validation**: Inline validation feedback with field-level error messages, validation on blur/change
- **Better Layout & Visual Hierarchy**: Grouped fields with clear sections, improved spacing and typography
- **Enhanced Guidance**: Helper text for complex fields, tooltips for additional context, placeholder improvements
- **Superior Feedback**: Loading states, success/error indicators, smooth transitions between steps
- **Accessibility**: Keyboard navigation support, proper ARIA labels, focus management

## Tech Stack Selection

- **Frontend Framework**: Next.js 16 + React 19 (existing)
- **UI Components**: shadcn/ui (existing) + enhanced components
- **Form Management**: react-hook-form + zod (replacing manual useState)
- **Styling**: Tailwind CSS 4 (existing)
- **Icons**: Lucide React icons (existing)
- **Validation**: Zod schemas for type-safe validation

## Implementation Approach

Replace the current manual state management with react-hook-form for better validation control and performance. Integrate the existing `ProgressSteps` component for a more polished step indicator. Add inline validation feedback using FormField, FormItem, FormLabel, FormControl, FormDescription, and FormMessage components from shadcn/ui.

**Key Technical Decisions**:

1. **Form Library Migration**: react-hook-form provides better validation, performance (reduces re-renders), and type safety compared to manual useState
2. **Zod Integration**: Schema-based validation ensures consistency between frontend and backend
3. **Existing Components**: Leverage `ProgressSteps` (horizontal variant with progress bar) instead of custom step indicators
4. **Progressive Validation**: Validate each step before proceeding, show inline errors immediately

## Implementation Notes

- **Performance**: react-hook-form minimizes re-renders by using uncontrolled components internally
- **Validation Strategy**: Validate on blur for better UX, validate entire form on submit
- **Error Handling**: Field-level errors shown inline, global errors shown as toast
- **State Persistence**: Consider using form state persistence for draft recovery (future enhancement)
- **Accessibility**: Ensure all interactive elements have proper focus states and ARIA attributes

## Architecture Design

### Component Structure

```
AddApplicationDialog (Enhanced)
├── ProgressSteps (Existing component from ui/progress-steps.tsx)
│   ├── Step 1: Select Student
│   ├── Step 2: Select Program
│   ├── Step 3: Details
│   └── Step 4: Review
├── FormProvider (react-hook-form context)
│   ├── StepContent Components
│   │   ├── StudentSelectionStep
│   │   ├── ProgramSelectionStep
│   │   ├── DetailsStep
│   │   └── ReviewStep
│   └── FormField wrappers with validation
└── DialogFooter with navigation
```

### Validation Schema (Zod)

```typescript
const applicationSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  program_id: z.string().optional(),
  requested_university_program_note: z.string().optional(),
  intake: z.string().optional(),
  personal_statement: z.string().max(5000, "Personal statement too long").optional(),
  study_plan: z.string().max(5000, "Study plan too long").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  priority: z.number().min(0).max(3),
}).refine(
  data => data.program_id || data.requested_university_program_note,
  { message: "Either program or custom request is required" }
);
```

### Data Flow

1. User opens dialog → Form initializes with default values
2. ProgressSteps shows current step with percentage
3. User fills fields → real-time validation on blur
4. User clicks "Next" → validate current step → show errors if any
5. All steps complete → Review step shows summary
6. User clicks "Create" → validate all → submit to API

## Directory Structure

```
src/components/admin/
├── add-application-dialog.tsx          # [MODIFY] Main dialog component - migrate to react-hook-form, add ProgressSteps, improve validation
├── add-application/
│   ├── student-selection-step.tsx      # [NEW] Step 1: Student selection with search
│   ├── program-selection-step.tsx      # [NEW] Step 2: Program selection with custom request
│   ├── details-step.tsx                # [NEW] Step 3: Intake, priority, statements
│   ├── review-step.tsx                 # [NEW] Step 4: Final review and confirmation
│   ├── validation-schema.ts            # [NEW] Zod validation schema
│   └── types.ts                        # [NEW] TypeScript types for form data
```

## Key Code Structures

### Form Schema Definition

```typescript
// types.ts
export interface ApplicationFormData {
  student_id: string;
  program_id?: string;
  requested_university_program_note?: string;
  intake?: string;
  personal_statement?: string;
  study_plan?: string;
  notes?: string;
  priority: number;
}

// validation-schema.ts
import { z } from 'zod';

export const applicationSchema = z.object({
  student_id: z.string().min(1, "Please select a student"),
  program_id: z.string().optional(),
  requested_university_program_note: z.string().optional(),
  intake: z.string().optional(),
  personal_statement: z.string().max(5000).optional(),
  study_plan: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  priority: z.number().min(0).max(3),
}).refine(
  data => data.program_id || data.requested_university_program_note,
  { 
    message: "Please select a program or enter a custom request",
    path: ["program_id"]
  }
);
```

### Step Configuration Interface

```typescript
interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: (keyof ApplicationFormData)[];
}
```

## Design Style

Modern wizard-style form with clean, professional aesthetic following shadcn/ui design principles. Uses a horizontal step indicator with progress bar for clear navigation feedback.

## Design Principles

- **Clarity**: Each step has a clear purpose with concise labels
- **Feedback**: Real-time validation provides immediate feedback
- **Efficiency**: Progress bar and percentage show completion status
- **Accessibility**: Keyboard navigation and screen reader support
- **Consistency**: Follows shadcn/ui neutral theme throughout

## Page Layout (Dialog)

The form uses a modal dialog with the following structure:

- **Header**: Title, description, and close button
- **Progress Section**: Horizontal step indicator with progress bar (using ProgressSteps component)
- **Content Area**: Scrollable form content with grouped fields
- **Footer**: Navigation buttons (Back/Next/Cancel/Submit)

## Step Content Design

### Step 1: Select Student

- **Layout**: Full-width searchable combobox
- **Helper Text**: "Search by name, email, or nationality"
- **Selected State**: Card showing student info with clear visual hierarchy
- **Validation**: Inline error if attempting to proceed without selection

### Step 2: Select Program

- **Layout**: Two-column grid on desktop (program selection | custom request)
- **Program Section**: Searchable combobox with university name
- **Custom Request**: Textarea with character counter
- **Helper Text**: "Select from our programs or describe your request"
- **Validation**: Ensure either program or custom request is provided

### Step 3: Details

- **Layout**: Grouped sections with visual separators
- **Section 1 - Timeline**: Intake period (input) + Priority (button group)
- **Section 2 - Content**: Personal statement + Study plan (both with character counters)
- **Section 3 - Admin**: Notes field with "Internal use only" badge
- **Helper Text**: Contextual help for each complex field
- **Validation**: Character limits with inline warnings

### Step 4: Review

- **Layout**: Card-based summary with clear sections
- **Visual Hierarchy**: Bold labels, muted values, clear separation
- **Edit Actions**: Quick edit buttons to jump back to specific steps
- **Confirmation**: Clear "Create Application" CTA with status preview

## Color System Usage

- **Primary**: Step indicators, active elements, CTAs
- **Success**: Completed steps, valid fields
- **Warning**: Character limit warnings
- **Destructive**: Validation errors, required field indicators
- **Muted**: Inactive steps, helper text, descriptions

## Interaction Design

- **Step Navigation**: Click on completed steps to jump back
- **Keyboard Support**: Tab through fields, Enter to proceed
- **Validation Timing**: On blur for fields, on submit for steps
- **Loading States**: Spinner on submit button, disabled state during submission
- **Error Display**: Inline below field, toast for critical errors

## Agent Extensions

### Skill

- **ui-ux-pro-max**
- Purpose: Generate design system and UI/UX guidelines for the enhanced form
- Expected outcome: Consistent design patterns, color palette, and component styling recommendations for form fields, step indicators, and validation feedback

- **lucide-icons**
- Purpose: Download additional icons for form fields and step indicators
- Expected outcome: Consistent iconography for step icons, validation states, and helper tooltips