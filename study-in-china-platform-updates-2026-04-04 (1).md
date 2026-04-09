# Study in China Academy Platform - Final Updates Summary

**Date:** April 4, 2026
**Status:** Updated with all requested features

---

## 📋 OVERVIEW

**Platform Name:** Study In China Academy - SICA
**Business Model:** B2B2C - Connecting international students with Chinese universities through education consultancy partners
**Revenue Model:** Service fees from students for admission assistance, NO commission system, Admin manually sets fees

---

## 👥 USER ROLES (4 Total)

### 1. ADMIN (Platform Owner)
- Manage all universities (directory)
- Manage all partners
- View all applications
- **Manually set service fees per application**
- Manage partner subscriptions
- Platform settings
- Analytics & reporting
- Content management
- User management
- Payment management


### 3. PARTNER (Education Consultancy)
- Manage own profile
- Manage team members
- Submit applications on behalf of students
- View own applications
- Access marketing materials
- Generate reports
- View earnings from service fees
- Pay platform subscription

### 4. PARTNER STAFF (Team Members)
- Submit applications
- Manage assigned students
- View own application stats
- Access assigned resources
- Communicate with students

### 5. STUDENT (International Student)
- Browse university directory
- Search programs
- Submit direct applications
- Track application status
- Upload documents
- Chat with assigned consultant
- Make payments
- View offers & decisions


---

## 🎓 KEY FEATURES

### 1. UNIVERSITY DIRECTORY

#### University Directory (Public)
- Browse all universities
- Search universities
- Filter by:
  - Province/Region
  - City
  - University type (985, 211, Public, Private)
  - Ranking
  - Teaching language
  - Popular programs
  - Scholarship available
- Sort by:
  - Popularity
  - Ranking (national/international)
  - Alphabetical
  - Newest
- Quick view cards
- List view
- Grid view

#### University Detail Page
- University overview
- Key facts:
  - Rankings (national, international)
  - Founded year
  - Student count
  - International student count
  - Faculty count
- Location & campuses
- Programs offered
- Available scholarships
- Admission requirements
- Tuition & fees
- Accommodation options
- Student reviews
- Contact information
- Apply button
- Save to comparison

#### University Categories
- Top Ranked (985/211)
- Double First-Class
- Public Universities
- Private Universities
- Medical Universities
- Technical Universities
- Language Universities
- Comprehensive Universities

#### University Search
- Keyword search
- Advanced filters
- Search suggestions
- Recent searches
- Popular searches
- Trending universities

#### University Reviews
- Student reviews
- Ratings (overall, academics, facilities, etc.)
- Review summary
- Helpful votes
- Write review
- Photo reviews
- Verified student badge

---

### 2. PROGRAMS CATALOG

#### Programs Catalog
- Browse by category:
  - Bachelor's Degrees
  - Master's Degrees
  - PhD Programs
  - Foundation Programs
  - Language Programs (Chinese)
  - Short-term Programs
  - Summer/Winter Camps
  - Vocational Programs
- Filter by:
  - Degree type
  - Discipline/Major
  - Teaching language
  - Duration
  - Tuition range
  - Entry requirements
  - Scholarship available
- Sort options
- Popular programs section
- Featured programs section
- New programs section

#### Program Detail Pages
- Program overview
- Curriculum highlights
- Duration
- Teaching language
- Degree awarded
- Entry requirements
- Required documents
- Tuition fees breakdown
- Scholarship information
- Career prospects
- Instructor profiles
- Application deadline
- Intake information
- Student reviews
- Similar programs
- Apply now button

---

### 3. COMPARISON SYSTEM

#### University Comparison (up to 4 at a time)
- Side-by-side comparison
- Ranking comparison
- Tuition comparison
- Scholarship comparison
- Location comparison
- Program comparison
- Requirements comparison
- Accommodation comparison
- Student reviews comparison
- Photos comparison

#### Program Comparison (up to 4 at a time)
- Tuition comparison
- Duration comparison
- Entry requirements comparison
- Scholarship comparison
- Career prospects comparison
- Teaching language comparison
- Ranking comparison

#### Comparison Features
- Save comparison lists
- Share comparison
- Print comparison
- Download comparison as PDF
- Featured comparisons

---

### 4. APPLICATION SYSTEM

#### Application Workflow (Multi-step Wizard)

**For Students:**
Step 1: Choose Program
- Search and select university
- Search and select program
- Select intake (Spring/Fall)
- View program summary
- Check eligibility

Step 2: Personal Information
- Full name (English & Chinese)
- Date of birth
- Gender
- Nationality
- Passport details
- Contact information
- Current address
- Emergency contact
- Current education

Step 3: Academic Background
- Highest degree held
- Institution name
- Field of study
- Graduation date
- GPA/Score
- Academic transcripts upload

Step 4: Language Proficiency
- Chinese proficiency (HSK level)
- HSK certificate upload
- English proficiency (IELTS/TOEFL)
- English test certificate upload
- Other language skills

Step 5: Program Documents
- Passport copy
- Academic certificates (notarized)
- Academic transcripts (notarized)
- Personal statement
- Study plan
- Recommendation letters (2)
- CV/Resume
- Photos (passport size)
- Health examination form
- Non-criminal record

Step 6: Additional Information
- Work experience (if any)
- Extracurricular activities
- Awards and achievements
- Publications (if any)
- Research experience (if any)
- Scholarship application
- Financial guarantee

Step 7: Review & Submit
- Review all information
- Edit any section
- Digital agreement
- Submit application

**For Partners:**
- Create application for student
- Submit application to university
- Track application status
- Document management
- Communication with university
- Receive university updates

**For Partner Staff:**
- Submit application
- Manage assigned students
- View own application stats

#### Application Tracking
- Application status timeline
- Current status
- Next steps
- University decision
- Acceptance letter download
- Rejection reason (if any)
- Visa application status
- Enrollment confirmation

---

### 5. DOCUMENT MANAGEMENT

#### Document Features
- Secure document upload
- Document verification status
- Required vs optional documents
- Auto-fill from previous applications
- Document templates (study plan, financial guarantee, etc.)
- Document expiration alerts

---

### 6. COMMUNICATION SYSTEM

#### Messaging Features
- Chat with assigned consultant
- Message university
- Email notifications
- SMS notifications (optional)
- In-app notifications
- Real-time chat
- File sharing

---

### 7. PAYMENT SYSTEM

#### Payment Features
- Application service fee payment
- Service fee (manually set by admin)
- Payment history
- Invoice generation
- Refund management

---

## 🗄️ DATABASE TABLES

### Core Tables:
1. users
2. user_profiles
3. partners
4. partner_staff
5. universities
6. university_facilities
7. campuses
8. programs
9. scholarships
10. students
11. applications
12. application_documents
13. application_timeline
14. university_partners
15. service_fee_transactions
16. conversations
17. messages
18. reviews
19. blog_posts
20. notifications
21. activity_logs
22. payments
23. comparison_lists
24. comparison_criteria

---

## 🔧 API ENDPOINTS

### Authentication APIs
- POST /api/auth/register/student
- POST /api/auth/register/partner
- POST /api/auth/register/partner-staff
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### University Directory APIs
- GET /api/universities
- GET /api/universities/:id
- GET /api/universities/:id/programs
- GET /api/universities/:id/scholarships
- GET /api/universities/:id/reviews
- GET /api/universities/:id/campuses
- GET /api/universities/:id/facilities
- GET /api/universities/search
- GET /api/universities/featured
- GET /api/universities/popular

### Program APIs
- GET /api/programs
- GET /api/programs/:id
- GET /api/programs/:id/scholarships
- GET /api/programs/search
- GET /api/programs/featured
- GET /api/programs/popular
- GET /api/programs/categories
- GET /api/programs/disciplines

### Comparison APIs
- GET /api/comparison/universities?ids=id1,id2,id3
- GET /api/comparison/programs?ids=id1,id2,id3
- GET /api/comparison/criteria
- POST /api/comparison/lists
- GET /api/comparison/lists
- GET /api/comparison/lists/:id
- PUT /api/comparison/lists/:id
- DELETE /api/comparison/lists/:id
- POST /api/comparison/lists/:id/share
- GET /api/comparison/lists/shared/:shareLink

### Student APIs
- GET /api/students/me
- PUT /api/students/me
- GET /api/students/me/profile
- PUT /api/students/me/profile
- POST /api/students/me/documents
- GET /api/students/me/applications
- GET /api/students/me/notifications
- GET /api/students/me/messages
- GET /api/students/me/favorites

### Partner APIs
- GET /api/partners/me
- PUT /api/partners/me
- GET /api/partners/me/stats
- GET /api/partners/me/students
- POST /api/partners/me/students
- GET /api/partners/me/students/:id
- GET /api/partners/me/applications
- GET /api/partners/me/earnings
- GET /api/partners/me/subscription
- GET /api/partners/me/team
- POST /api/partners/me/team/invite
- PUT /api/partners/me/team/:staffId
- DELETE /api/partners/me/team/:staffId

### Admin APIs
- GET /api/admin/dashboard
- GET /api/admin/users
- GET /api/admin/partners
- GET /api/admin/universities
- GET /api/admin/programs
- GET /api/admin/applications
- GET /api/admin/service-fees
- GET /api/admin/subscription-tiers
- GET /api/admin/analytics
- GET /api/admin/settings
- PUT /api/admin/settings

### Application APIs
- POST /api/applications
- GET /api/applications
- GET /api/applications/:id
- PUT /api/applications/:id
- POST /api/applications/:id/submit
- POST /api/applications/:id/documents
- GET /api/applications/:id/timeline
- POST /api/applications/:id/withdraw

### Payment APIs
- POST /api/payments/create-intent
- POST /api/payments/confirm
- GET /api/payments/:id
- POST /api/payments/:id/refund

### Communication APIs
- GET /api/conversations
- POST /api/conversations
- GET /api/conversations/:id/messages
- POST /api/conversations/:id/messages

---

## 🎨 FRONTEND COMPONENTS

### Student Portal Components
- StudentDashboard
- UniversitySearch
- UniversityCard
- UniversityDetail
- UniversityCompare
- UniversityQuickView
- ProgramCatalog
- ProgramCard
- ProgramDetail
- ProgramCompare
- ComparisonWidget
- ComparisonTable
- ComparisonChart
- ApplicationWizard
- ApplicationStep
- DocumentUploader
- DocumentChecklist
- ApplicationTracker
- ApplicationTimeline
- PaymentForm
- ChatWidget
- NotificationBell
- ProfileCard
- FavoritesList
- SavedComparisons
- SearchFilters
- FilterPanel
- RankingBadge
- ScholarshipBadge

### Partner Portal Components
- PartnerDashboard
- StudentManagement
- StudentCard
- StudentProfile
- StudentForm
- ApplicationManager
- ApplicationCard
- ApplicationWorkflow
- TeamManagement
- TeamMemberCard
- InviteMemberModal
- ResourceLibrary
- ReportBuilder
- PartnerStaffDashboard
- StaffTaskList
- StaffPerformance

### Admin Portal Components
- AdminDashboard
- UserManagement
- UserTable
- UserDetail
- PartnerManagement
- PartnerApprovalList
- UniversityManagement
- UniversityForm
- ProgramManagement
- ProgramForm
- ApplicationManagement
- ServiceFeeManagement
- ComparisonCriteriaManager
- SubscriptionManagement
- ReportBuilder
- SettingsPanel
- NotificationCenter
- ChatbotManager
- ContentManager

### Shared Components
- Header
- Sidebar
- Footer
- SearchBar
- FilterPanel
- DataTable
- Pagination
- Modal
- Toast
- LoadingSpinner
- EmptyState
- ErrorBoundary
- Avatar
- Badge
- Card
- Button
- Input
- Select
- Checkbox
- Radio
- DatePicker
- FileUpload
- RichTextEditor
- Chart
- Map
- VideoPlayer

---

## 🤖 AI-POWERED FEATURES

### Chatbot
- 24/7 availability
- Answer student questions
- Guide application process
- Collect leads
- Multilingual support

### Smart Features
- Program recommendations
- University suggestions
- Admission probability calculator
- Scholarship finder
- Document verification assistance

---

## 🔒 SECURITY FEATURES

- JWT authentication
- Role-based access control
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Data encryption
- Secure password hashing

---

## 📱 TECHNICAL STACK

### Frontend
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- 

### Database
- PostgreSQL
- Redis (caching)

### Authentication
- 

### Storage


### Email
- Resend


---

## ✅ SUCCESS CRITERIA

The platform should:
- ✅ Support 4 user roles (Admin, Partner, Partner Staff, Student)
- ✅ Include comprehensive University Directory with advanced search
- ✅ Include comprehensive Programs Catalog with advanced search
- ✅ Include Comparison System (universities and programs)
- ✅ Allow students to search and apply to programs
- ✅ Allow partners to manage students and submit applications
- ✅ Allow partner staff to manage assigned students
- ✅ Allow universities to review and manage applications
- ✅ Allow admin to manually set service fees per application
- ✅ Include partner subscription management
- ✅ Include communication system
- ✅ Include document management
- ✅ Include payment processing
- ✅ Include AI chatbot
- ✅ Be fully responsive
- ✅ Support multiple languages
- ✅ Have excellent UX
- ✅ Be production-ready

---

## 📁 FILES


---

**Ready to use! Copy the content to Coze Code.** 🚀
