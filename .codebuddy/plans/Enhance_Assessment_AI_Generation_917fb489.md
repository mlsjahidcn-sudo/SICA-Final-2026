---
name: Enhance Assessment AI Generation
overview: Enhance the Assessment AI generation to use real database data (programs, scholarships, universities), filter out CSC scholarships, and verify email functionality
todos:
  - id: enhance-report-api
    content: Enhance report generation API to fetch real data from database
    status: completed
  - id: filter-csc-scholarships
    content: Implement CSC scholarship filtering logic
    status: completed
    dependencies:
      - enhance-report-api
  - id: update-ai-prompt
    content: Update AI prompt to include real database data
    status: completed
    dependencies:
      - filter-csc-scholarships
  - id: populate-structured-fields
    content: Populate JSONB fields with structured recommendations
    status: completed
    dependencies:
      - update-ai-prompt
  - id: verify-email-feature
    content: Verify email notification functionality works correctly
    status: completed
---

## Product Overview

Enhance the Assessment AI report generation system in the admin portal to provide personalized, data-driven recommendations based on actual university, program, and scholarship data from the database.

## Core Features

- Query real university, program, and scholarship data from database
- Exclude CSC (Chinese Government Scholarship) and related types from recommendations
- Match applicant profile against actual database records
- Generate personalized program and scholarship recommendations
- Verify and test email notification functionality

## Tech Stack

- Backend Framework: Next.js 16 App Router
- Database: Supabase (PostgreSQL)
- AI Integration: invokeLLM for report generation
- Email: Custom email service with templates

## Implementation Approach

The enhancement involves fetching real data from the database to enrich the AI prompt, filtering out CSC-related scholarships, and ensuring the report includes structured data. The approach:

1. **Data Fetching Strategy**: Query universities, programs, and scholarships tables with intelligent filtering based on applicant's profile (target degree, major, budget, language proficiency)

2. **Scholarship Filtering**: Exclude CSC-related types (`csc_type_a`, `csc_type_b`, `belt_and_road`, `silk_road`, `confucius`, `mofcom`) and include only university, provincial, city, corporate, and asean scholarships

3. **AI Prompt Enhancement**: Inject real database data into the prompt with structured recommendations section

4. **Structured Output**: Populate `recommended_universities`, `recommended_programs`, and `scholarship_opportunities` JSONB fields in assessment_reports table

## Implementation Details

### Database Query Logic

- Match programs by degree_level matching applicant's target_degree
- Filter scholarships by excluding CSC types
- Query universities with scholarship_available=true
- Consider budget range for tuition filtering
- Rank recommendations by relevance score

### Performance Considerations

- Cache frequently accessed university/program data
- Limit recommendations to top 5-10 matches
- Use indexed columns (degree_level, university_id, scholarship type)

## Directory Structure

```
src/app/api/admin/assessments/[id]/report/
└── route.ts  # [MODIFY] Enhanced report generation with real data
src/lib/
└── email.ts  # [CHECK] Verify email templates and sending
```

## Agent Extensions

### Skill

- **supabase-postgres-best-practices**
- Purpose: Optimize database queries for fetching programs, universities, and scholarships
- Expected outcome: Efficient queries with proper indexing and filtering