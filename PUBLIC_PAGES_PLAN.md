# Public Pages Development Plan

## Overview
Building public-facing pages for SICA (Study In China Academy) - a B2B2C education platform connecting international students with Chinese universities.

---

## Current State Analysis

### Existing Public Pages
| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Homepage | `/` | ✅ Complete | Hero, features, stats, CTAs |
| Programs List | `/programs` | ✅ Complete | Filter, search, pagination |
| Program Detail | `/programs/[id]` | ✅ Complete | Details, apply CTA, favorite |
| Universities List | `/universities` | ✅ Complete | Filter, search, pagination |
| University Detail | `/universities/[id]` | ✅ Complete | Stats, programs, favorite |
| Apply | `/apply/[programId]` | ✅ Complete | Application form |
| Login | `/login` | ✅ Complete | Auth form |
| Register | `/register` | ✅ Complete | Registration form |

### Missing Public Pages
| Priority | Page | Route | Purpose |
|----------|------|-------|---------|
| 🔴 High | About Us | `/about` | Company story, team, mission |
| 🔴 High | Contact | `/contact` | Contact form, support channels |
| 🔴 High | FAQ | `/faq` | Common questions and answers |
| 🟡 Medium | Scholarships | `/scholarships` | Scholarship info and search |
| 🟡 Medium | How It Works | `/how-it-works` | Step-by-step guide |
| 🟡 Medium | Privacy Policy | `/privacy` | Legal compliance |
| 🟡 Medium | Terms of Service | `/terms` | Legal compliance |
| 🟢 Low | Blog | `/blog` | Articles, news, updates |
| 🟢 Low | Testimonials | `/testimonials` | Student success stories |
| 🟢 Low | Partners | `/partners` | Partner universities & agents |

---

## Detailed Page Specifications

### 1. About Us Page (`/about`) 🔴 HIGH

**Purpose**: Build trust and credibility with visitors

**Sections**:
1. **Hero Section**
   - Company tagline
   - Brief introduction
   - Background image/visual

2. **Our Story**
   - Timeline of company history
   - Key milestones
   - Mission and vision statements

3. **Why Choose SICA**
   - Value propositions
   - Key differentiators
   - Success metrics

4. **Team Section**
   - Leadership profiles
   - Team photos (optional)
   - Brief bios

5. **Partnerships**
   - University partnerships
   - Certifications
   - Awards

6. **CTA Section**
   - Start application CTA
   - Contact CTA

**Data Requirements**: None (static content)

---

### 2. Contact Page (`/contact`) 🔴 HIGH

**Purpose**: Provide multiple contact channels and capture leads

**Sections**:
1. **Contact Form**
   - Name, email, phone
   - Subject dropdown
   - Message textarea
   - Submit button
   - Success/error states

2. **Contact Information**
   - Email addresses
   - Phone numbers
   - Office address
   - Business hours

3. **Support Channels**
   - WhatsApp link
   - WeChat QR code
   - Social media links

4. **Map Integration**
   - Google Maps embed (optional)
   - Office location

5. **FAQ Link**
   - Quick answers before contacting

**Data Requirements**:
- Contact form submission → Email notification
- Store inquiries in database

**API Endpoint**: `POST /api/contact`

---

### 3. FAQ Page (`/faq`) 🔴 HIGH

**Purpose**: Answer common questions, reduce support load

**Sections**:
1. **Search Bar**
   - Search through questions
   - Instant filtering

2. **Category Tabs**
   - Application Process
   - Scholarships
   - Visa & Immigration
   - Living in China
   - Payment & Fees
   - Technical Support

3. **Accordion Q&A**
   - Expandable questions
   - Rich text answers
   - Related links

4. **Still Have Questions**
   - Contact CTA
   - Live chat link

**Data Requirements**:
- FAQ items (could be static or database-driven)

**Schema** (optional):
```sql
CREATE TABLE faqs (
  id UUID PRIMARY KEY,
  category VARCHAR(50),
  question TEXT,
  answer TEXT,
  sort_order INT,
  is_active BOOLEAN DEFAULT true
);
```

---

### 4. Scholarships Page (`/scholarships`) 🟡 MEDIUM

**Purpose**: Showcase scholarship opportunities

**Sections**:
1. **Hero Section**
   - Title and description
   - Key statistics

2. **Scholarship Types**
   - Chinese Government Scholarship (CSC)
   - Provincial Scholarships
   - University Scholarships
   - Confucius Institute Scholarship

3. **Scholarship Search**
   - Filter by type
   - Filter by coverage amount
   - Filter by university

4. **Featured Scholarships**
   - Card display
   - Coverage details
   - Application deadline
   - Apply button

5. **How to Apply**
   - Step-by-step guide
   - Requirements checklist

6. **Success Stories**
   - Student testimonials
   - Photo and quote

**Data Requirements**:
- Scholarship database table
- Link to programs/universities

**API Endpoint**: `GET /api/scholarships`

---

### 5. How It Works Page (`/how-it-works`) 🟡 MEDIUM

**Purpose**: Guide users through the application process

**Sections**:
1. **Process Overview**
   - Visual timeline
   - Step indicators

2. **Step Details**
   - Step 1: Create Account
   - Step 2: Browse Programs
   - Step 3: Submit Application
   - Step 4: Document Review
   - Step 5: Interview
   - Step 6: Admission Letter
   - Step 7: Visa Application
   - Step 8: Arrival in China

3. **Timeline Estimate**
   - Duration for each step
   - Total timeline

4. **Tips & Resources**
   - Document checklist
   - Common mistakes to avoid

5. **CTA**
   - Start your application
   - Contact advisor

**Data Requirements**: None (static content)

---

### 6. Privacy Policy Page (`/privacy`) 🟡 MEDIUM

**Purpose**: Legal compliance, user trust

**Sections**:
1. **Policy Content**
   - Information collection
   - Data usage
   - Data protection
   - Cookies policy
   - User rights
   - Contact information

2. **Last Updated Date**
   - Version history

**Data Requirements**: None (static legal content)

---

### 7. Terms of Service Page (`/terms`) 🟡 MEDIUM

**Purpose**: Legal compliance, user agreement

**Sections**:
1. **Terms Content**
   - Acceptance of terms
   - User responsibilities
   - Account terms
   - Service terms
   - Payment terms
   - Intellectual property
   - Disclaimers
   - Limitation of liability
   - Governing law

2. **Last Updated Date**

**Data Requirements**: None (static legal content)

---

### 8. Blog Page (`/blog`) 🟢 LOW

**Purpose**: SEO, content marketing, student engagement

**Sections**:
1. **Blog List**
   - Featured posts
   - Category filter
   - Search

2. **Blog Post Detail**
   - Title, content, images
   - Author info
   - Related posts
   - Social share

**Data Requirements**:
- Blog posts table
- Categories table
- Authors table

---

### 9. Testimonials Page (`/testimonials`) 🟢 LOW

**Purpose**: Social proof, build trust

**Sections**:
1. **Featured Testimonials**
   - Student photos
   - University/Program
   - Success story
   - Video testimonials (optional)

2. **Filter by**
   - Country
   - University
   - Program type

**Data Requirements**:
- Testimonials table

---

### 10. Partners Page (`/partners`) 🟢 LOW

**Purpose**: B2B marketing, showcase partnerships

**Sections**:
1. **Partner Universities**
   - Logos
   - Brief info
   - Programs count

2. **Partner with Us**
   - Benefits
   - Contact form

**Data Requirements**:
- University data (existing)

---

## Navigation Updates

### Header Navigation
```
[Logo] [Programs] [Universities] [Scholarships] [About] [Contact] [Apply Now]
```

### Footer Navigation
```
Quick Links:
- Programs
- Universities
- Scholarships
- How It Works
- FAQ

Company:
- About Us
- Contact Us
- Blog
- Careers

Legal:
- Privacy Policy
- Terms of Service
- Cookie Policy

Connect:
- WhatsApp
- WeChat
- LinkedIn
- Facebook
```

---

## Implementation Order

### Phase 1: Core Public Pages (Week 1)
1. ✅ About Us Page
2. ✅ Contact Page + API
3. ✅ FAQ Page

### Phase 2: Information Pages (Week 2)
4. ✅ Scholarships Page
5. ✅ How It Works Page
6. ✅ Privacy Policy
7. ✅ Terms of Service

### Phase 3: Enhanced Features (Week 3)
8. ✅ Header/Footer Updates
9. ✅ SEO Optimization
10. ✅ Mobile Optimization

### Phase 4: Content Marketing (Week 4+)
11. Blog System
12. Testimonials
13. Partners Page

---

## Technical Considerations

### SEO
- Meta tags for each page
- Open Graph images
- Structured data (JSON-LD)
- Sitemap generation
- Canonical URLs

### Performance
- Static generation where possible
- Image optimization
- Lazy loading for images
- Code splitting

### Accessibility
- ARIA labels
- Keyboard navigation
- Color contrast
- Screen reader support

### Analytics
- Page view tracking
- Event tracking
- Conversion goals

---

## Content Requirements

### For Each Page:
- [ ] Headlines and copy
- [ ] Images and graphics
- [ ] Icons
- [ ] Testimonials/quotes
- [ ] CTAs

### Legal Content:
- [ ] Privacy Policy text
- [ ] Terms of Service text
- [ ] Cookie Policy text

### Marketing Content:
- [ ] Company story
- [ ] Team bios
- [ ] FAQ questions and answers
- [ ] Scholarship information
