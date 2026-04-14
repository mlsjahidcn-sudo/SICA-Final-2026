import { pgTable, serial, timestamp, foreignKey, unique, uuid, varchar, text, index, check, date, integer, numeric, boolean, pgPolicy, jsonb, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const partnerProfiles = pgTable("partner_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	companyName: varchar("company_name", { length: 255 }),
	position: varchar({ length: 255 }),
	address: text(),
	website: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "partner_profiles_user_id_fkey"
		}).onDelete("cascade"),
	unique("partner_profiles_user_id_key").on(table.userId),
]);

export const partnerShowcases = pgTable("partner_showcases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nameEn: varchar("name_en", { length: 255 }).notNull(),
	nameCn: varchar("name_cn", { length: 255 }),
	logoUrl: text("logo_url"),
	logoAlt: varchar("logo_alt", { length: 255 }),
	partnerType: varchar("partner_type", { length: 50 }).notNull(),
	category: varchar({ length: 100 }),
	websiteUrl: text("website_url"),
	descriptionEn: text("description_en"),
	descriptionCn: text("description_cn"),
	country: varchar({ length: 100 }),
	countryCode: varchar("country_code", { length: 10 }),
	city: varchar({ length: 100 }),
	partnershipLevel: varchar("partnership_level", { length: 20 }).default('standard').notNull(),
	partnershipSince: date("partnership_since"),
	studentsReferred: integer("students_referred").default(0),
	successRate: numeric("success_rate", { precision: 5, scale:  2 }),
	isFeatured: boolean("is_featured").default(false),
	displayOrder: integer("display_order").default(0),
	status: varchar({ length: 20 }).default('active').notNull(),
	contactName: varchar("contact_name", { length: 255 }),
	contactEmail: varchar("contact_email", { length: 255 }),
	contactPhone: varchar("contact_phone", { length: 50 }),
	linkedinUrl: text("linkedin_url"),
	facebookUrl: text("facebook_url"),
	twitterUrl: text("twitter_url"),
	wechatId: varchar("wechat_id", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_partner_showcases_featured").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("idx_partner_showcases_order").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("idx_partner_showcases_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_partner_showcases_type").using("btree", table.partnerType.asc().nullsLast().op("text_ops")),
	check("partner_showcases_partner_type_check", sql`(partner_type)::text = ANY (ARRAY[('university'::character varying)::text, ('education_agency'::character varying)::text, ('government'::character varying)::text, ('enterprise'::character varying)::text, ('ngo'::character varying)::text, ('other'::character varying)::text])`),
	check("partner_showcases_partnership_level_check", sql`(partnership_level)::text = ANY (ARRAY[('platinum'::character varying)::text, ('gold'::character varying)::text, ('silver'::character varying)::text, ('standard'::character varying)::text])`),
	check("partner_showcases_status_check", sql`(status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('pending'::character varying)::text])`),
]);

export const partners = pgTable("partners", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	contactPerson: varchar("contact_person", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	address: text(),
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	website: varchar({ length: 255 }),
	logoUrl: varchar("logo_url", { length: 500 }),
	description: text(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	subscriptionPlan: varchar("subscription_plan", { length: 50 }),
	subscriptionStartDate: date("subscription_start_date"),
	subscriptionEndDate: date("subscription_end_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("partners_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("partners_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	pgPolicy("partners_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("partners_登录用户可写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("partners_登录用户可更新", { as: "permissive", for: "update", to: ["public"] }),
]);

export const programs = pgTable("programs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	universityId: uuid("university_id").notNull(),
	nameEn: varchar("name_en", { length: 255 }).notNull(),
	nameCn: varchar("name_cn", { length: 255 }),
	degreeType: varchar("degree_type", { length: 50 }).notNull(),
	discipline: varchar({ length: 100 }),
	major: varchar({ length: 255 }).notNull(),
	teachingLanguage: varchar("teaching_language", { length: 50 }).notNull(),
	durationMonths: integer("duration_months"),
	durationDescription: varchar("duration_description", { length: 100 }),
	tuitionPerYear: numeric("tuition_per_year", { precision: 10, scale:  2 }),
	tuitionCurrency: varchar("tuition_currency", { length: 10 }).default('CNY'),
	applicationFee: numeric("application_fee", { precision: 10, scale:  2 }),
	accommodationFeePerYear: numeric("accommodation_fee_per_year", { precision: 10, scale:  2 }),
	scholarshipAvailable: boolean("scholarship_available").default(false),
	scholarshipDetails: text("scholarship_details"),
	entryRequirements: text("entry_requirements"),
	requiredDocuments: jsonb("required_documents"),
	intakeMonths: jsonb("intake_months"),
	applicationDeadlineFall: varchar("application_deadline_fall", { length: 50 }),
	applicationDeadlineSpring: varchar("application_deadline_spring", { length: 50 }),
	description: text(),
	curriculum: text(),
	careerProspects: text("career_prospects"),
	isFeatured: boolean("is_featured").default(false),
	isPopular: boolean("is_popular").default(false),
	isActive: boolean("is_active").default(true).notNull(),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	slug: varchar({ length: 255 }),
	riskLevel: varchar("risk_level", { length: 50 }),
	code: varchar({ length: 50 }),
	category: varchar({ length: 100 }),
	subCategory: varchar("sub_category", { length: 255 }),
	nameFr: varchar("name_fr", { length: 255 }),
	descriptionEn: text("description_en"),
	descriptionCn: text("description_cn"),
	curriculumEn: text("curriculum_en"),
	curriculumCn: text("curriculum_cn"),
	careerProspectsEn: text("career_prospects_en"),
	careerProspectsCn: text("career_prospects_cn"),
	durationYears: numeric("duration_years", { precision: 3, scale:  1 }),
	startMonth: varchar("start_month", { length: 50 }),
	applicationStartDate: date("application_start_date"),
	applicationEndDate: date("application_end_date"),
	minGpa: numeric("min_gpa", { precision: 3, scale:  2 }),
	languageRequirement: text("language_requirement"),
	entranceExamRequired: boolean("entrance_exam_required").default(false),
	entranceExamDetails: text("entrance_exam_details"),
	prerequisites: jsonb(),
	capacity: integer(),
	currentApplications: integer("current_applications").default(0),
	applicationFeeCurrency: varchar("application_fee_currency", { length: 10 }).default('CNY'),
	accommodationFeeCurrency: varchar("accommodation_fee_currency", { length: 10 }).default('CNY'),
	scholarshipTypes: jsonb("scholarship_types"),
	scholarshipCoverage: text("scholarship_coverage"),
	coverImage: varchar("cover_image", { length: 500 }),
	tags: jsonb(),
	rating: numeric({ precision: 2, scale:  1 }).default('0'),
	reviewCount: integer("review_count").default(0),
	accreditation: jsonb(),
	outcomes: jsonb(),
	applicationRequirements: text("application_requirements"),
}, (table) => [
	index("programs_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("programs_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("programs_degree_type_idx").using("btree", table.degreeType.asc().nullsLast().op("text_ops")),
	index("programs_discipline_idx").using("btree", table.discipline.asc().nullsLast().op("text_ops")),
	index("programs_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("programs_is_featured_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("programs_is_popular_idx").using("btree", table.isPopular.asc().nullsLast().op("bool_ops")),
	index("programs_major_idx").using("btree", table.major.asc().nullsLast().op("text_ops")),
	index("programs_min_gpa_idx").using("btree", table.minGpa.asc().nullsLast().op("numeric_ops")),
	index("programs_prerequisites_idx").using("gin", table.prerequisites.asc().nullsLast().op("jsonb_ops")),
	index("programs_rating_idx").using("btree", table.rating.asc().nullsLast().op("numeric_ops")),
	index("programs_scholarship_available_idx").using("btree", table.scholarshipAvailable.asc().nullsLast().op("bool_ops")),
	index("programs_scholarship_types_idx").using("gin", table.scholarshipTypes.asc().nullsLast().op("jsonb_ops")),
	index("programs_start_month_idx").using("btree", table.startMonth.asc().nullsLast().op("text_ops")),
	index("programs_tags_idx").using("gin", table.tags.asc().nullsLast().op("jsonb_ops")),
	index("programs_teaching_language_idx").using("btree", table.teachingLanguage.asc().nullsLast().op("text_ops")),
	index("programs_university_id_idx").using("btree", table.universityId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.universityId],
			foreignColumns: [universities.id],
			name: "programs_university_id_universities_id_fk"
		}).onDelete("cascade"),
	pgPolicy("programs_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("programs_登录用户可写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("programs_登录用户可删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("programs_登录用户可更新", { as: "permissive", for: "update", to: ["public"] }),
]);

export const leads = pgTable("leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: text().notNull(),
	status: text().default('new').notNull(),
	source: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text(),
	phone: text(),
	nationality: text(),
	desiredProgram: text("desired_program"),
	desiredIntake: text("desired_intake"),
	organizationName: text("organization_name"),
	contactPerson: text("contact_person"),
	organizationEmail: text("organization_email"),
	organizationPhone: text("organization_phone"),
	website: text(),
	country: text(),
	organizationType: text("organization_type"),
	assigneeId: uuid("assignee_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_leads_assignee").using("btree", table.assigneeId.asc().nullsLast().op("uuid_ops")),
	index("idx_leads_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_leads_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("idx_leads_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_leads_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "leads_assignee_id_fkey"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	role: varchar({ length: 20 }).default('student').notNull(),
	phone: varchar({ length: 50 }),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	partnerId: uuid("partner_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	approvalStatus: varchar("approval_status", { length: 20 }).default('approved'),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: uuid("approved_by"),
	rejectionReason: text("rejection_reason"),
	referredByPartnerId: uuid("referred_by_partner_id"),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("users_partner_id_idx").using("btree", table.partnerId.asc().nullsLast().op("uuid_ops")),
	index("users_referred_by_partner_id_idx").using("btree", table.referredByPartnerId.asc().nullsLast().op("uuid_ops")),
	index("users_role_idx").using("btree", table.role.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [partners.id],
			name: "users_partner_id_partners_id_fk"
		}),
	foreignKey({
			columns: [table.referredByPartnerId],
			foreignColumns: [table.id],
			name: "users_referred_by_partner_id_fkey"
		}).onDelete("set null"),
	unique("users_email_unique").on(table.email),
	pgPolicy("users_用户创建自己的数据", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(( SELECT auth.uid() AS uid) = id)`  }),
	pgPolicy("users_用户更新自己的数据", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("users_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("users_管理员可更新所有用户", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("users_管理员可读取所有用户", { as: "permissive", for: "select", to: ["public"] }),
]);

export const leadActivities = pgTable("lead_activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	leadId: uuid("lead_id"),
	userId: uuid("user_id").notNull(),
	activityType: text("activity_type").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_lead_activities_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_lead_activities_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_activities_lead_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "lead_activities_user_id_fkey"
		}),
]);

export const applicationStatusHistory = pgTable("application_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	oldStatus: varchar("old_status", { length: 30 }),
	newStatus: varchar("new_status", { length: 30 }).notNull(),
	notes: text(),
	changedBy: uuid("changed_by"),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_status_history_app_id").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "application_status_history_application_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "application_status_history_changed_by_fkey"
		}),
]);

export const applicationDocuments = pgTable("application_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	documentType: varchar("document_type", { length: 50 }).notNull(),
	fileUrl: text("file_url"),
	fileName: varchar("file_name", { length: 255 }),
	fileSize: integer("file_size"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }),
	verificationStatus: varchar("verification_status", { length: 20 }).default('pending'),
	verificationNotes: text("verification_notes"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	verifiedBy: uuid("verified_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	fileKey: text("file_key"),
	contentType: varchar("content_type", { length: 100 }),
	uploadedBy: uuid("uploaded_by"),
	status: varchar({ length: 20 }).default('pending'),
	rejectionReason: text("rejection_reason"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_application_documents_app_id").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("idx_application_documents_file_key").using("btree", table.fileKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "application_documents_application_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "application_documents_uploaded_by_fkey"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "application_documents_verified_by_fkey"
		}),
	pgPolicy("app_docs_via_application", { as: "permissive", for: "all", to: ["public"], using: sql`(application_id IN ( SELECT applications.id
   FROM applications
  WHERE ((applications.student_id = auth.uid()) OR (applications.partner_id = auth.uid()) OR is_admin())))` }),
	check("valid_doc_status", sql`(verification_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('verified'::character varying)::text, ('rejected'::character varying)::text])`),
	check("valid_doc_status_check", sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('verified'::character varying)::text, ('rejected'::character varying)::text])`),
]);

export const assessmentApplications = pgTable("assessment_applications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	whatsappNumber: varchar("whatsapp_number", { length: 50 }),
	country: varchar({ length: 100 }).notNull(),
	dateOfBirth: date("date_of_birth"),
	currentEducationLevel: varchar("current_education_level", { length: 100 }),
	gpa: numeric({ precision: 4, scale:  2 }),
	englishProficiency: varchar("english_proficiency", { length: 50 }),
	englishScore: varchar("english_score", { length: 20 }),
	targetDegree: varchar("target_degree", { length: 100 }),
	targetMajor: varchar("target_major", { length: 255 }),
	preferredUniversities: jsonb("preferred_universities"),
	budgetRange: varchar("budget_range", { length: 100 }),
	additionalNotes: text("additional_notes"),
	status: varchar({ length: 50 }).default('pending').notNull(),
	trackingCode: varchar("tracking_code", { length: 20 }).notNull(),
	emailSent: boolean("email_sent").default(false),
	emailSentAt: timestamp("email_sent_at", { withTimezone: true, mode: 'string' }),
	whatsappSent: boolean("whatsapp_sent").default(false),
	whatsappSentAt: timestamp("whatsapp_sent_at", { withTimezone: true, mode: 'string' }),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	reviewedBy: uuid("reviewed_by"),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("assessment_applications_country_idx").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("assessment_applications_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("assessment_applications_reviewed_by_idx").using("btree", table.reviewedBy.asc().nullsLast().op("uuid_ops")),
	index("assessment_applications_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("assessment_applications_submitted_at_idx").using("btree", table.submittedAt.asc().nullsLast().op("timestamptz_ops")),
	index("assessment_applications_tracking_code_idx").using("btree", table.trackingCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "assessment_applications_reviewed_by_fkey"
		}),
	unique("assessment_applications_tracking_code_unique").on(table.trackingCode),
	pgPolicy("assessment_applications_admin_all", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("assessment_applications_public_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("assessment_applications_public_select_tracking", { as: "permissive", for: "select", to: ["public"] }),
]);

export const applications = pgTable("applications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	programId: uuid("program_id").notNull(),
	universityId: uuid("university_id").notNull(),
	partnerId: uuid("partner_id"),
	submittedBy: uuid("submitted_by").notNull(),
	intake: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('draft').notNull(),
	currentStep: integer("current_step").default(1),
	serviceFee: numeric("service_fee", { precision: 10, scale:  2 }),
	serviceFeeCurrency: varchar("service_fee_currency", { length: 10 }).default('CNY'),
	paymentStatus: varchar("payment_status", { length: 50 }).default('pending'),
	personalStatement: text("personal_statement"),
	studyPlan: text("study_plan"),
	profileSnapshot: jsonb("profile_snapshot"),
	universityDecision: varchar("university_decision", { length: 50 }),
	decisionDate: timestamp("decision_date", { withTimezone: true, mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	notes: text(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("applications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("applications_intake_idx").using("btree", table.intake.asc().nullsLast().op("text_ops")),
	index("applications_partner_id_idx").using("btree", table.partnerId.asc().nullsLast().op("uuid_ops")),
	index("applications_payment_status_idx").using("btree", table.paymentStatus.asc().nullsLast().op("text_ops")),
	index("applications_program_id_idx").using("btree", table.programId.asc().nullsLast().op("uuid_ops")),
	index("applications_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("applications_student_id_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	index("applications_submitted_by_idx").using("btree", table.submittedBy.asc().nullsLast().op("uuid_ops")),
	index("applications_university_id_idx").using("btree", table.universityId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [partners.id],
			name: "applications_partner_id_partners_id_fk"
		}),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "applications_program_id_programs_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "applications_student_id_students_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.submittedBy],
			foreignColumns: [users.id],
			name: "applications_submitted_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.universityId],
			foreignColumns: [universities.id],
			name: "applications_university_id_universities_id_fk"
		}).onDelete("cascade"),
	pgPolicy("applications_admin_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_admin()` }),
	pgPolicy("applications_partner_view", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("applications_student_own", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("applications_用户删除自己的数据", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("applications_用户插入自己的数据", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("applications_用户更新自己的数据", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("applications_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const applicationTemplates = pgTable("application_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	personalStatement: text("personal_statement"),
	studyPlan: text("study_plan"),
	isDefault: boolean("is_default").default(false),
	useCount: integer("use_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_application_templates_is_default").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isDefault.asc().nullsLast().op("bool_ops")),
	index("idx_application_templates_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "application_templates_user_id_fkey"
		}).onDelete("cascade"),
]);

export const assessmentDocuments = pgTable("assessment_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	documentType: varchar("document_type", { length: 50 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assessment_documents_application_id_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("assessment_documents_document_type_idx").using("btree", table.documentType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [assessmentApplications.id],
			name: "assessment_documents_application_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("assessment_documents_admin_all", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("assessment_documents_public_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("assessment_documents_public_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const students = pgTable("students", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	// Personal information
	nationality: varchar({ length: 100 }),
	dateOfBirth: date("date_of_birth"),
	gender: varchar({ length: 20 }),
	currentAddress: text("current_address"),
	permanentAddress: text("permanent_address"),
	postalCode: varchar("postal_code", { length: 20 }),
	chineseName: varchar("chinese_name", { length: 100 }),
	maritalStatus: varchar("marital_status", { length: 20 }),
	religion: varchar("religion", { length: 50 }),
	// Emergency contact
	emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
	emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 50 }),
	// Passport information (no visa - consultancy handles that)
	passportNumber: varchar("passport_number", { length: 100 }),
	passportExpiryDate: date("passport_expiry_date"),
	passportIssuingCountry: varchar("passport_issuing_country", { length: 100 }),
	// Academic information (JSONB arrays for multiple entries)
	educationHistory: jsonb("education_history").default(sql`'[]'`),
	workExperience: jsonb("work_experience").default(sql`'[]'`),
	// Language test scores
	hskLevel: integer("hsk_level"),
	hskScore: integer("hsk_score"),
	ieltsScore: numeric("ielts_score", { precision: 4, scale: 1 }),
	toeflScore: integer("toefl_score"),
	// Family information (JSONB array for multiple family members)
	familyMembers: jsonb("family_members").default(sql`'[]'`),
	// Additional information (JSONB arrays for multiple entries)
	extracurricularActivities: jsonb("extracurricular_activities").default(sql`'[]'`),
	awards: jsonb("awards").default(sql`'[]'`),
	publications: jsonb("publications").default(sql`'[]'`),
	researchExperience: jsonb("research_experience").default(sql`'[]'`),
	// Scholarship application (JSONB single object)
	scholarshipApplication: jsonb("scholarship_application"),
	// Financial guarantee (JSONB single object)
	financialGuarantee: jsonb("financial_guarantee"),
	// Study preferences
	studyMode: varchar("study_mode", { length: 20 }).default('full_time'),
	fundingSource: varchar("funding_source", { length: 50 }),
	// Communication
	wechatId: varchar("wechat_id", { length: 50 }),
	// Legacy single-education fields (kept for backward compat / simple cases)
	highestEducation: varchar("highest_education", { length: 100 }),
	institutionName: varchar("institution_name", { length: 255 }),
	fieldOfStudy: varchar("field_of_study", { length: 255 }),
	graduationDate: date("graduation_date"),
	gpa: numeric({ precision: 4, scale: 2 }),
	// Admin fields
	assignedPartnerId: uuid("assigned_partner_id"),
	assignedStaffId: uuid("assigned_staff_id"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("students_assigned_partner_id_idx").using("btree", table.assignedPartnerId.asc().nullsLast().op("uuid_ops")),
	index("students_assigned_staff_id_idx").using("btree", table.assignedStaffId.asc().nullsLast().op("uuid_ops")),
	index("students_nationality_idx").using("btree", table.nationality.asc().nullsLast().op("text_ops")),
	index("students_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("students_funding_source_idx").using("btree", table.fundingSource.asc().nullsLast().op("text_ops")),
	index("students_study_mode_idx").using("btree", table.studyMode.asc().nullsLast().op("text_ops")),
	index("students_passport_issuing_country_idx").using("btree", table.passportIssuingCountry.asc().nullsLast().op("text_ops")),
	index("students_work_experience_idx").using("gin", table.workExperience),
	index("students_education_history_idx").using("gin", table.educationHistory),
	index("students_family_members_idx").using("gin", table.familyMembers),
	index("students_extracurricular_activities_idx").using("gin", table.extracurricularActivities),
	index("students_awards_idx").using("gin", table.awards),
	index("students_publications_idx").using("gin", table.publications),
	index("students_research_experience_idx").using("gin", table.researchExperience),
	foreignKey({
			columns: [table.assignedPartnerId],
			foreignColumns: [partners.id],
			name: "students_assigned_partner_id_partners_id_fk"
		}),
	foreignKey({
			columns: [table.assignedStaffId],
			foreignColumns: [users.id],
			name: "students_assigned_staff_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "students_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("students_user_id_key").on(table.userId),
	// RLS policies: students own data, admins full access, partners read linked students
	pgPolicy("students_select_own", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'partner') AND partner_id IN (SELECT p.id FROM public.partners p WHERE p.user_id = auth.uid())))` }),
	pgPolicy("students_insert_own", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))` }),
	pgPolicy("students_update_own", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))`, withCheck: sql`(user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))` }),
	pgPolicy("students_delete_own", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))` }),
]);

export const assessmentStatusHistory = pgTable("assessment_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	oldStatus: varchar("old_status", { length: 50 }),
	newStatus: varchar("new_status", { length: 50 }).notNull(),
	changedBy: uuid("changed_by"),
	notes: text(),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assessment_status_history_application_id_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [assessmentApplications.id],
			name: "assessment_status_history_application_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "assessment_status_history_changed_by_fkey"
		}),
]);

export const blogCategories = pgTable("blog_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nameEn: varchar("name_en", { length: 100 }).notNull(),
	nameCn: varchar("name_cn", { length: 100 }),
	slug: varchar({ length: 100 }).notNull(),
	descriptionEn: text("description_en"),
	descriptionCn: text("description_cn"),
	icon: varchar({ length: 50 }),
	color: varchar({ length: 20 }),
	parentId: uuid("parent_id"),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_blog_categories_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "blog_categories_parent_id_fkey"
		}).onDelete("set null"),
	unique("blog_categories_slug_key").on(table.slug),
]);

export const assessmentReports = pgTable("assessment_reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	reportContent: text("report_content").notNull(),
	reportHtml: text("report_html"),
	overallScore: numeric("overall_score", { precision: 5, scale:  2 }),
	recommendedUniversities: jsonb("recommended_universities"),
	recommendedPrograms: jsonb("recommended_programs"),
	scholarshipOpportunities: jsonb("scholarship_opportunities"),
	strengths: jsonb(),
	areasForImprovement: jsonb("areas_for_improvement"),
	nextSteps: jsonb("next_steps"),
	generatedBy: uuid("generated_by"),
	generatedAt: timestamp("generated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("assessment_reports_application_id_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("assessment_reports_generated_by_idx").using("btree", table.generatedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [assessmentApplications.id],
			name: "assessment_reports_application_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.generatedBy],
			foreignColumns: [users.id],
			name: "assessment_reports_generated_by_fkey"
		}),
	pgPolicy("assessment_reports_admin_all", { as: "permissive", for: "all", to: ["public"] }),
	pgPolicy("assessment_reports_public_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const blogPosts = pgTable("blog_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	titleEn: varchar("title_en", { length: 255 }).notNull(),
	titleCn: varchar("title_cn", { length: 255 }),
	slug: varchar({ length: 255 }).notNull(),
	excerptEn: text("excerpt_en"),
	excerptCn: text("excerpt_cn"),
	contentEn: text("content_en").notNull(),
	contentCn: text("content_cn"),
	featuredImageUrl: text("featured_image_url"),
	featuredImageAlt: varchar("featured_image_alt", { length: 255 }),
	categoryId: uuid("category_id"),
	authorId: uuid("author_id"),
	authorName: varchar("author_name", { length: 100 }),
	authorAvatarUrl: text("author_avatar_url"),
	status: varchar({ length: 20 }).default('draft'),
	isFeatured: boolean("is_featured").default(false),
	allowComments: boolean("allow_comments").default(true),
	viewCount: integer("view_count").default(0),
	readingTimeMinutes: integer("reading_time_minutes"),
	seoTitle: varchar("seo_title", { length: 255 }),
	seoDescription: text("seo_description"),
	seoKeywords: text("seo_keywords").array(),
	faqs: jsonb("faqs").default(sql`'[]'`),
	internalLinks: jsonb("internal_links").default(sql`'[]'`),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_blog_posts_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_blog_posts_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_blog_posts_published_at").using("btree", table.publishedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_blog_posts_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_blog_posts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "blog_posts_author_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [blogCategories.id],
			name: "blog_posts_category_id_fkey"
		}).onDelete("set null"),
	unique("blog_posts_slug_key").on(table.slug),
	check("blog_posts_status_check", sql`(status)::text = ANY (ARRAY[('draft'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])`),
]);

export const blogTags = pgTable("blog_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nameEn: varchar("name_en", { length: 50 }).notNull(),
	nameCn: varchar("name_cn", { length: 50 }),
	slug: varchar({ length: 50 }).notNull(),
	color: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_blog_tags_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("blog_tags_slug_key").on(table.slug),
]);

export const chatbotConversations = pgTable("chatbot_conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 255 }).notNull(),
	message: text().notNull(),
	response: text(),
	messageType: varchar("message_type", { length: 50 }).default('user'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chatbot_conversations_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("chatbot_conversations_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("chatbot_conversations_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chatbot_conversations_user_id_users_id_fk"
		}).onDelete("cascade"),
	pgPolicy("chatbot_conversations_用户插入自己的数据", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(( SELECT auth.uid() AS uid) = user_id)`  }),
	pgPolicy("chatbot_conversations_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const comparisons = pgTable("comparisons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	comparisonType: varchar("comparison_type", { length: 50 }).notNull(),
	itemIds: jsonb("item_ids").notNull(),
	name: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("comparisons_comparison_type_idx").using("btree", table.comparisonType.asc().nullsLast().op("text_ops")),
	index("comparisons_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comparisons_user_id_users_id_fk"
		}).onDelete("cascade"),
	pgPolicy("comparisons_用户删除自己的数据", { as: "permissive", for: "delete", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("comparisons_用户插入自己的数据", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("comparisons_用户更新自己的数据", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("comparisons_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	documentType: varchar("document_type", { length: 100 }).notNull(),
	documentName: varchar("document_name", { length: 255 }).notNull(),
	fileUrl: varchar("file_url", { length: 500 }).notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	verificationStatus: varchar("verification_status", { length: 50 }).default('pending'),
	verificationNotes: text("verification_notes"),
	uploadedBy: uuid("uploaded_by").notNull(),
	verifiedBy: uuid("verified_by"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("documents_application_id_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("documents_document_type_idx").using("btree", table.documentType.asc().nullsLast().op("text_ops")),
	index("documents_uploaded_by_idx").using("btree", table.uploadedBy.asc().nullsLast().op("uuid_ops")),
	index("documents_verification_status_idx").using("btree", table.verificationStatus.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "documents_application_id_applications_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "documents_uploaded_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "documents_verified_by_users_id_fk"
		}),
	pgPolicy("documents_用户删除自己的数据", { as: "permissive", for: "delete", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = uploaded_by)` }),
	pgPolicy("documents_用户插入自己的数据", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("documents_用户更新自己的数据", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("documents_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const emailLogs = pgTable("email_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	emailType: varchar("email_type", { length: 50 }).notNull(),
	recipient: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	error: text(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_email_logs_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_email_logs_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_email_logs_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_logs_user_id_fkey"
		}).onDelete("cascade"),
	check("email_logs_status_check", sql`(status)::text = ANY (ARRAY[('sent'::character varying)::text, ('failed'::character varying)::text, ('pending'::character varying)::text])`),
]);

export const favorites = pgTable("favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	itemType: varchar("item_type", { length: 50 }).notNull(),
	itemId: uuid("item_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("favorites_item_id_idx").using("btree", table.itemId.asc().nullsLast().op("uuid_ops")),
	index("favorites_item_type_idx").using("btree", table.itemType.asc().nullsLast().op("text_ops")),
	index("favorites_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_favorites_item").using("btree", table.itemType.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("text_ops")),
	index("idx_favorites_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "favorites_user_id_users_id_fk"
		}).onDelete("cascade"),
	pgPolicy("favorites_用户删除自己的数据", { as: "permissive", for: "delete", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("favorites_用户插入自己的数据", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("favorites_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id"),
	senderId: uuid("sender_id").notNull(),
	receiverId: uuid("receiver_id"),
	subject: varchar({ length: 255 }),
	content: text().notNull(),
	messageType: varchar("message_type", { length: 50 }).default('text'),
	attachmentUrl: varchar("attachment_url", { length: 500 }),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("messages_application_id_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("messages_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("messages_is_read_idx").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("messages_receiver_id_idx").using("btree", table.receiverId.asc().nullsLast().op("uuid_ops")),
	index("messages_sender_id_idx").using("btree", table.senderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "messages_application_id_applications_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}),
	pgPolicy("messages_用户删除自己的数据", { as: "permissive", for: "delete", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = sender_id)` }),
	pgPolicy("messages_用户插入自己的数据", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("messages_用户更新自己的数据", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("messages_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text(),
	link: varchar({ length: 500 }),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("notifications_is_read_idx").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("notifications_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
	pgPolicy("notifications_用户更新自己的数据", { as: "permissive", for: "update", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = user_id)`, withCheck: sql`(( SELECT auth.uid() AS uid) = user_id)`  }),
	pgPolicy("notifications_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const partnerNotes = pgTable("partner_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	applicationId: uuid("application_id"),
	studentId: uuid("student_id"),
	content: text().notNull(),
	isPrivate: boolean("is_private").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_partner_notes_application_id").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("idx_partner_notes_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_partner_notes_student_id").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	index("idx_partner_notes_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "partner_notes_application_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "partner_notes_student_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "partner_notes_user_id_fkey"
		}).onDelete("cascade"),
	check("partner_notes_target_check", sql`(application_id IS NOT NULL) OR (student_id IS NOT NULL)`),
]);

export const meetings = pgTable("meetings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	studentId: uuid("student_id").notNull(),
	scheduledBy: uuid("scheduled_by").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	meetingDate: timestamp("meeting_date", { withTimezone: true, mode: 'string' }).notNull(),
	durationMinutes: integer("duration_minutes").default(30).notNull(),
	meetingType: varchar("meeting_type", { length: 50 }).default('video').notNull(),
	platform: varchar({ length: 50 }),
	meetingUrl: text("meeting_url"),
	meetingIdExternal: varchar("meeting_id_external", { length: 255 }),
	meetingPassword: varchar("meeting_password", { length: 255 }),
	status: varchar({ length: 50 }).default('scheduled').notNull(),
	notes: text(),
	reminderSent: boolean("reminder_sent").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_meetings_application_id").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("idx_meetings_date").using("btree", table.meetingDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_meetings_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_meetings_student_id").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "meetings_student_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "meetings_application_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.scheduledBy],
			foreignColumns: [users.id],
			name: "meetings_scheduled_by_fkey"
		}).onDelete("cascade"),
]);

export const programComparisons = pgTable("program_comparisons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	programIds: jsonb("program_ids").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "program_comparisons_user_id_fkey"
		}).onDelete("cascade"),
	unique("program_comparisons_user_id_key").on(table.userId),
	pgPolicy("program_comparisons_用户删除自己的对比", { as: "permissive", for: "delete", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("program_comparisons_用户插入自己的对比", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("program_comparisons_用户更新自己的对比", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("program_comparisons_用户读取自己的对比", { as: "permissive", for: "select", to: ["public"] }),
]);

export const programTranslations = pgTable("program_translations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	programId: uuid("program_id").notNull(),
	language: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 255 }),
	description: text(),
	curriculum: text(),
	careerProspects: text("career_prospects"),
	applicationRequirements: text("application_requirements"),
	scholarshipDetails: text("scholarship_details"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("program_translations_language_idx").using("btree", table.language.asc().nullsLast().op("text_ops")),
	index("program_translations_program_id_idx").using("btree", table.programId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_translations_program_id_fkey"
		}).onDelete("cascade"),
	unique("program_translations_program_id_language_key").on(table.programId, table.language),
	pgPolicy("program_translations_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("program_translations_登录用户可写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("program_translations_登录用户可删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("program_translations_登录用户可更新", { as: "permissive", for: "update", to: ["public"] }),
]);

export const programStats = pgTable("program_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	programId: uuid("program_id").notNull(),
	statDate: date("stat_date").notNull(),
	viewCount: integer("view_count").default(0),
	applicationCount: integer("application_count").default(0),
	admissionCount: integer("admission_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("program_stats_program_id_idx").using("btree", table.programId.asc().nullsLast().op("uuid_ops")),
	index("program_stats_stat_date_idx").using("btree", table.statDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_stats_program_id_fkey"
		}).onDelete("cascade"),
	unique("program_stats_program_id_stat_date_key").on(table.programId, table.statDate),
	pgPolicy("program_stats_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("program_stats_登录用户可写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("program_stats_登录用户可删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("program_stats_登录用户可更新", { as: "permissive", for: "update", to: ["public"] }),
]);

export const programFavorites = pgTable("program_favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	programId: uuid("program_id").notNull(),
	userId: uuid("user_id").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("program_favorites_program_id_idx").using("btree", table.programId.asc().nullsLast().op("uuid_ops")),
	index("program_favorites_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_favorites_program_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "program_favorites_user_id_fkey"
		}).onDelete("cascade"),
	unique("program_favorites_program_id_user_id_key").on(table.programId, table.userId),
	pgPolicy("program_favorites_用户删除自己的收藏", { as: "permissive", for: "delete", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("program_favorites_用户插入自己的收藏", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("program_favorites_用户更新自己的收藏", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("program_favorites_用户读取自己的收藏", { as: "permissive", for: "select", to: ["public"] }),
]);

export const programReviews = pgTable("program_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	programId: uuid("program_id").notNull(),
	userId: uuid("user_id").notNull(),
	rating: integer().notNull(),
	title: varchar({ length: 255 }),
	content: text(),
	isVerified: boolean("is_verified").default(false),
	isPublished: boolean("is_published").default(true),
	helpfulCount: integer("helpful_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("program_reviews_program_id_idx").using("btree", table.programId.asc().nullsLast().op("uuid_ops")),
	index("program_reviews_rating_idx").using("btree", table.rating.asc().nullsLast().op("int4_ops")),
	index("program_reviews_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [programs.id],
			name: "program_reviews_program_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "program_reviews_user_id_fkey"
		}).onDelete("cascade"),
	unique("program_reviews_program_id_user_id_key").on(table.programId, table.userId),
	pgPolicy("program_reviews_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`(is_published = true)` }),
	pgPolicy("program_reviews_用户删除自己的评论", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("program_reviews_用户更新自己的评论", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("program_reviews_登录用户可写入", { as: "permissive", for: "insert", to: ["public"] }),
	check("program_reviews_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const universityScholarships = pgTable("university_scholarships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	universityId: uuid("university_id").notNull(),
	nameEn: varchar("name_en", { length: 255 }).notNull(),
	nameCn: varchar("name_cn", { length: 255 }),
	type: varchar({ length: 100 }),
	coveragePercentage: integer("coverage_percentage"),
	coverageTuition: boolean("coverage_tuition").default(false),
	coverageAccommodation: boolean("coverage_accommodation").default(false),
	coverageStipend: boolean("coverage_stipend").default(false),
	coverageMedical: boolean("coverage_medical").default(false),
	stipendAmount: numeric("stipend_amount", { precision: 10, scale:  2 }),
	stipendCurrency: varchar("stipend_currency", { length: 10 }).default('CNY'),
	description: text(),
	eligibility: text(),
	applicationProcess: text("application_process"),
	deadline: varchar({ length: 100 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_university_scholarships_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_university_scholarships_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_university_scholarships_university_id").using("btree", table.universityId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.universityId],
			foreignColumns: [universities.id],
			name: "university_scholarships_university_id_fkey"
		}).onDelete("cascade"),
]);

export const userSettings = pgTable("user_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_settings_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_settings_user_id_key").on(table.userId),
]);

export const universities = pgTable("universities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nameEn: varchar("name_en", { length: 255 }).notNull(),
	nameCn: varchar("name_cn", { length: 255 }),
	shortName: varchar("short_name", { length: 100 }),
	logoUrl: varchar("logo_url", { length: 500 }),
	coverImageUrl: varchar("cover_image_url", { length: 500 }),
	province: varchar({ length: 100 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	address: text(),
	addressEn: text("address_en"),
	addressCn: text("address_cn"),
	website: varchar({ length: 255 }),
	type: jsonb().notNull(), // Changed to JSONB array for multi-select support
	category: varchar({ length: 50 }),
	rankingNational: integer("ranking_national"),
	rankingInternational: integer("ranking_international"),
	foundedYear: integer("founded_year"),
	studentCount: integer("student_count"),
	internationalStudentCount: integer("international_student_count"),
	facultyCount: integer("faculty_count"),
	teachingLanguages: jsonb("teaching_languages"),
	scholarshipAvailable: boolean("scholarship_available").default(false),
	description: text(),
	facilities: text(),
	accommodationInfo: text("accommodation_info"),
	contactEmail: varchar("contact_email", { length: 255 }),
	contactPhone: varchar("contact_phone", { length: 50 }),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	isActive: boolean("is_active").default(true).notNull(),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	country: varchar({ length: 100 }),
	tuitionMin: numeric("tuition_min", { precision: 12, scale:  2 }),
	tuitionMax: numeric("tuition_max", { precision: 12, scale:  2 }),
	tuitionCurrency: varchar("tuition_currency", { length: 10 }),
	images: jsonb(),
	videoUrls: jsonb("video_urls"),
	metaTitle: varchar("meta_title", { length: 500 }),
	metaDescription: text("meta_description"),
	metaKeywords: jsonb("meta_keywords"),
	ogImage: varchar("og_image", { length: 500 }),
	slug: varchar({ length: 255 }),
	applicationDeadline: varchar("application_deadline", { length: 50 }),
	intakeMonths: jsonb("intake_months"),
	defaultTuitionPerYear: numeric("default_tuition_per_year", { precision: 12, scale:  2 }),
	defaultTuitionCurrency: varchar("default_tuition_currency", { length: 10 }),
	useDefaultTuition: boolean("use_default_tuition").default(false),
	scholarshipPercentage: integer("scholarship_percentage").default(0),
	tuitionByDegree: jsonb("tuition_by_degree"),
	scholarshipByDegree: jsonb("scholarship_by_degree"),
	tier: varchar({ length: 20 }),
	acceptanceFlexibility: varchar("acceptance_flexibility", { length: 50 }),
	cscaRequired: boolean("csca_required").default(false),
	hasApplicationFee: boolean("has_application_fee").default(false),
	descriptionEn: text("description_en"),
	descriptionCn: text("description_cn"),
	facilitiesEn: text("facilities_en"),
	facilitiesCn: text("facilities_cn"),
	accommodationInfoEn: text("accommodation_info_en"),
	accommodationInfoCn: text("accommodation_info_cn"),
	addressEn: text("address_en"),
	addressCn: text("address_cn"),
}, (table) => [
	index("universities_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("universities_city_idx").using("btree", table.city.asc().nullsLast().op("text_ops")),
	index("universities_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("universities_province_idx").using("btree", table.province.asc().nullsLast().op("text_ops")),
	index("universities_ranking_national_idx").using("btree", table.rankingNational.asc().nullsLast().op("int4_ops")),
	index("universities_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	pgPolicy("universities_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("universities_管理员可写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("universities_管理员可删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("universities_管理员可更新", { as: "permissive", for: "update", to: ["public"] }),
]);

export const userFavorites = pgTable("user_favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	entityId: uuid("entity_id").notNull(),
	entityType: varchar("entity_type", { length: 20 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_favorites_entity").using("btree", table.entityId.asc().nullsLast().op("text_ops"), table.entityType.asc().nullsLast().op("uuid_ops")),
	index("idx_user_favorites_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_favorites_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_favorites_user_id_entity_id_entity_type_key").on(table.userId, table.entityId, table.entityType),
	check("user_favorites_entity_type_check", sql`(entity_type)::text = ANY (ARRAY[('university'::character varying)::text, ('program'::character varying)::text])`),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicationId: uuid("application_id").notNull(),
	userId: uuid("user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('CNY').notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentType: varchar("payment_type", { length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	transactionId: varchar("transaction_id", { length: 255 }),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	refundedAt: timestamp("refunded_at", { withTimezone: true, mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("payments_application_id_idx").using("btree", table.applicationId.asc().nullsLast().op("uuid_ops")),
	index("payments_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("payments_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("payments_transaction_id_idx").using("btree", table.transactionId.asc().nullsLast().op("text_ops")),
	index("payments_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "payments_application_id_applications_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payments_user_id_users_id_fk"
		}),
	pgPolicy("payments_用户删除自己的数据", { as: "permissive", for: "delete", to: ["public"], using: sql`(( SELECT auth.uid() AS uid) = user_id)` }),
	pgPolicy("payments_用户插入自己的数据", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("payments_用户更新自己的数据", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("payments_用户读取自己的数据", { as: "permissive", for: "select", to: ["public"] }),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	universityId: uuid("university_id").notNull(),
	userId: uuid("user_id").notNull(),
	ratingOverall: integer("rating_overall").notNull(),
	ratingAcademics: integer("rating_academics"),
	ratingFacilities: integer("rating_facilities"),
	ratingAccommodation: integer("rating_accommodation"),
	ratingLocation: integer("rating_location"),
	title: varchar({ length: 255 }),
	content: text(),
	isVerifiedStudent: boolean("is_verified_student").default(false),
	isPublished: boolean("is_published").default(true),
	helpfulCount: integer("helpful_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("reviews_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("reviews_is_published_idx").using("btree", table.isPublished.asc().nullsLast().op("bool_ops")),
	index("reviews_rating_overall_idx").using("btree", table.ratingOverall.asc().nullsLast().op("int4_ops")),
	index("reviews_university_id_idx").using("btree", table.universityId.asc().nullsLast().op("uuid_ops")),
	index("reviews_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.universityId],
			foreignColumns: [universities.id],
			name: "reviews_university_id_universities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}),
	pgPolicy("reviews_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("reviews_登录用户可写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("reviews_登录用户可删除", { as: "permissive", for: "delete", to: ["public"] }),
	pgPolicy("reviews_登录用户可更新", { as: "permissive", for: "update", to: ["public"] }),
]);

export const scholarships = pgTable("scholarships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameChinese: varchar("name_chinese", { length: 255 }),
	type: varchar({ length: 50 }),
	amountMin: numeric("amount_min", { precision: 12, scale:  2 }),
	amountMax: numeric("amount_max", { precision: 12, scale:  2 }),
	currency: varchar({ length: 10 }).default('CNY'),
	description: text(),
	eligibility: text(),
	deadline: varchar({ length: 50 }),
	coverage: text(),
	durationYears: numeric("duration_years", { precision: 4, scale:  1 }),
	universityId: uuid("university_id"),
	programIds: jsonb("program_ids"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	requiredDocuments: jsonb("required_documents"),
	notes: text(),
	isGeneric: boolean("is_generic").default(false),
	category: varchar({ length: 100 }),
	applicationProcess: text("application_process"),
	applicationUrl: varchar("application_url", { length: 500 }),
	slug: varchar({ length: 255 }),
	degreeLevels: jsonb("degree_levels"),
}, (table) => [
	index("scholarships_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("scholarships_is_generic_idx").using("btree", table.isGeneric.asc().nullsLast().op("bool_ops")),
	index("scholarships_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("scholarships_university_id_idx").using("btree", table.universityId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.universityId],
			foreignColumns: [universities.id],
			name: "scholarships_university_id_fkey"
		}).onDelete("cascade"),
]);

export const blogPostTags = pgTable("blog_post_tags", {
	postId: uuid("post_id").notNull(),
	tagId: uuid("tag_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [blogPosts.id],
			name: "blog_post_tags_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [blogTags.id],
			name: "blog_post_tags_tag_id_fkey"
		}).onDelete("cascade"),
		primaryKey({ columns: [table.postId, table.tagId], name: "blog_post_tags_pkey"}),
	]);

export const testimonials = pgTable("testimonials", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userNameEn: varchar("user_name_en", { length: 255 }).notNull(),
	userNameCn: varchar("user_name_cn", { length: 255 }),
	userAvatarUrl: text("user_avatar_url"),
	userCountry: varchar("user_country", { length: 100 }),
	userCountryCode: varchar("user_country_code", { length: 10 }),
	userRoleEn: varchar("user_role_en", { length: 255 }),
	userRoleCn: varchar("user_role_cn", { length: 255 }),
	universityNameEn: varchar("university_name_en", { length: 255 }),
	universityNameCn: varchar("university_name_cn", { length: 255 }),
	programNameEn: varchar("program_name_en", { length: 255 }),
	programNameCn: varchar("program_name_cn", { length: 255 }),
	contentEn: text("content_en").notNull(),
	contentCn: text("content_cn"),
	rating: integer().default(5).notNull(),
	videoUrl: text("video_url"),
	imageUrl: text("image_url"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	isFeatured: boolean("is_featured").default(false),
	displayOrder: integer("display_order").default(0),
	source: varchar({ length: 50 }).default('manual'),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	reviewedBy: uuid("reviewed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("testimonials_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("testimonials_display_order_idx").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("testimonials_is_featured_idx").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("testimonials_rating_idx").using("btree", table.rating.asc().nullsLast().op("int4_ops")),
	index("testimonials_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("testimonials_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "testimonials_reviewed_by_fkey"
		}),
	pgPolicy("testimonials_允许公开读取", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("testimonials_登录用户可写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("testimonials_登录用户可更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("testimonials_登录用户可删除", { as: "permissive", for: "delete", to: ["public"] }),
]);
