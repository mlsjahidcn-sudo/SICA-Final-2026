# Component Migration Guide

This guide explains how to migrate existing admin pages to use the new reusable components created for reducing code duplication and standardizing page layouts.

## New Components

### 1. PageContainer
**Location**: `src/components/admin/page-container.tsx`

**Purpose**: Provides the standard sidebar layout for admin pages, eliminating the need to repeat sidebar, header, and layout code in every page.

**Usage**:
```tsx
import { PageContainer } from '@/components/admin'

export default function MyPage() {
  return (
    <PageContainer title="Page Title">
      {/* Your page content */}
    </PageContainer>
  )
}
```

**Before**:
```tsx
return (
  <TooltipProvider>
    <SidebarProvider style={{...} as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Page Title" />
        {/* Page content */}
      </SidebarInset>
    </SidebarProvider>
  </TooltipProvider>
)
```

**After**:
```tsx
return (
  <PageContainer title="Page Title">
    {/* Page content */}
  </PageContainer>
)
```

---

### 2. PageHeader
**Location**: `src/components/admin/page-header.tsx`

**Purpose**: Standardizes page headers with back button, title, description, and action buttons.

**Props**:
- `title` (string): Page title
- `description` (string, optional): Page description
- `backHref` (string, optional): URL for back button
- `backLabel` (string, optional): Back button text (default: "Back")
- `actions` (ReactNode, optional): Action buttons

**Usage**:
```tsx
import { PageHeader } from '@/components/admin'

<PageHeader
  title="Edit Application"
  description="Update application details"
  backHref="/admin/v2/applications"
  backLabel="Back to Applications"
  actions={
    <Button>Save Changes</Button>
  }
/>
```

**Before**:
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="sm" asChild>
      <Link href="/admin/v2/applications">
        <IconArrowLeft className="mr-2 h-4 w-4" />
        Back to Applications
      </Link>
    </Button>
  </div>
  <div>
    <h1 className="text-2xl font-semibold">Edit Application</h1>
    <p className="text-muted-foreground">Update application details</p>
  </div>
  <div className="flex gap-2">
    <Button>Save Changes</Button>
  </div>
</div>
```

**After**:
```tsx
<PageHeader
  title="Edit Application"
  description="Update application details"
  backHref="/admin/v2/applications"
  backLabel="Back to Applications"
  actions={<Button>Save Changes</Button>}
/>
```

---

### 3. FormSection
**Location**: `src/components/admin/form-layout.tsx`

**Purpose**: Creates consistent form sections with title and optional description.

**Usage**:
```tsx
import { FormSection } from '@/components/admin'

<FormSection
  title="Personal Information"
  description="Student's personal details"
>
  <div className="space-y-4">
    {/* Form fields */}
  </div>
</FormSection>
```

**Before**:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">Personal Information</CardTitle>
    <CardDescription>Student's personal details</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Form fields */}
    </div>
  </CardContent>
</Card>
```

**After**:
```tsx
<FormSection
  title="Personal Information"
  description="Student's personal details"
>
  <div className="space-y-4">
    {/* Form fields */}
  </div>
</FormSection>
```

---

### 4. FormGrid
**Location**: `src/components/admin/form-layout.tsx`

**Purpose**: Responsive grid layout for form fields.

**Props**:
- `columns` (1 | 2 | 3 | 4, optional): Number of columns (default: 2)
- `children`: Form fields
- `className` (string, optional): Additional CSS classes

**Usage**:
```tsx
import { FormGrid } from '@/components/admin'

<FormGrid columns={2}>
  <FormField label="First Name">
    <Input placeholder="John" />
  </FormField>
  <FormField label="Last Name">
    <Input placeholder="Doe" />
  </FormField>
</FormGrid>
```

---

### 5. FormField
**Location**: `src/components/admin/form-layout.tsx`

**Purpose**: Standardized form field with label.

**Props**:
- `label` (string): Field label
- `value` (string | null, optional): Read-only value
- `children` (ReactNode, optional): Input component

**Usage**:
```tsx
// Read-only field
<FormField label="Email" value="john@example.com" />

// Input field
<FormField label="Email">
  <Input type="email" placeholder="john@example.com" />
</FormField>
```

---

## Migration Steps

### Step 1: Import New Components
```tsx
import { PageContainer, PageHeader, FormSection, FormGrid, FormField } from '@/components/admin'
```

### Step 2: Replace Layout Wrapper
Replace the entire `TooltipProvider` > `SidebarProvider` structure with `PageContainer`:

**Before**:
```tsx
return (
  <TooltipProvider>
    <SidebarProvider style={{...}}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Page Title" />
        <Content />
      </SidebarInset>
    </SidebarProvider>
  </TooltipProvider>
)
```

**After**:
```tsx
return (
  <PageContainer title="Page Title">
    <Content />
  </PageContainer>
)
```

### Step 3: Replace Page Headers
Replace custom header implementations with `PageHeader`:

**Before**:
```tsx
<div className="flex items-center gap-4">
  <Button variant="ghost" size="sm" asChild>
    <Link href="/admin/v2/students">
      <IconArrowLeft className="mr-2 h-4 w-4" />
      Back to Students
    </Link>
  </Button>
  <div>
    <h1 className="text-2xl font-semibold">Student Details</h1>
  </div>
</div>
```

**After**:
```tsx
<PageHeader
  title="Student Details"
  backHref="/admin/v2/students"
  backLabel="Back to Students"
/>
```

### Step 4: Replace Form Sections
Replace `Card` structures with `FormSection`:

**Before**:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">Personal Information</CardTitle>
    <CardDescription>Student details</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Fields */}
    </div>
  </CardContent>
</Card>
```

**After**:
```tsx
<FormSection title="Personal Information" description="Student details">
  <FormGrid columns={2}>
    {/* Fields */}
  </FormGrid>
</FormSection>
```

---

## Benefits

1. **Reduced Code Duplication**: Common layout code is extracted to reusable components
2. **Consistent UI**: All pages follow the same structure and styling
3. **Easier Maintenance**: Changes to layout need to be made in only one place
4. **Faster Development**: New pages can be created quickly using these components
5. **Better Type Safety**: TypeScript types ensure correct usage

---

## Example: Complete Migration

### Before
```tsx
"use client"

import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MyPage() {
  return (
    <TooltipProvider>
      <SidebarProvider style={{"--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)"} as React.CSSProperties}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Edit Student" />
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/v2/students">
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold">Edit Student</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Personal Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
```

### After
```tsx
"use client"

import { PageContainer, PageHeader, FormSection, FormGrid, FormField } from '@/components/admin'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MyPage() {
  return (
    <PageContainer title="Edit Student">
      <div className="p-6 space-y-6">
        <PageHeader
          title="Edit Student"
          backHref="/admin/v2/students"
          backLabel="Back"
        />

        <FormSection title="Personal Info">
          <FormGrid columns={2}>
            <FormField label="First Name">
              <Input />
            </FormField>
            <FormField label="Last Name">
              <Input />
            </FormField>
          </FormGrid>
        </FormSection>
      </div>
    </PageContainer>
  )
}
```

---

## Migrated Pages

The following pages have already been migrated to use the new components:

1. ✅ `/admin/v2/applications/new` - Application creation page
2. ✅ `/admin/v2/applications/[id]/edit` - Application edit page
3. ✅ `/partner-v2/applications/[id]/documents` - Document upload page
4. ✅ `/admin/v2/students/[id]` - Student detail page

---

## Next Steps

Continue migrating remaining pages:

- `/admin/v2/programs/new` - Program creation
- `/admin/v2/programs/[id]/edit` - Program edit
- `/admin/v2/universities/new` - University creation
- `/admin/v2/universities/[id]/edit` - University edit
- All other form-based admin pages

---

## Notes

- The `PageContainer` component automatically includes the sidebar and header
- Use `FormSection` for any form grouping that needs a title
- `FormGrid` automatically adjusts columns based on screen size
- `FormField` can display read-only values or wrap input components
- All components maintain the same styling as the original shadcn/ui components
