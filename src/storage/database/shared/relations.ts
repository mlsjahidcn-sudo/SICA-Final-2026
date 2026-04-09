import { relations } from "drizzle-orm/relations";
import { users, partnerProfiles, universities, programs, leads, partners, leadActivities, applications, applicationStatusHistory, applicationDocuments, assessmentApplications, students, applicationTemplates, assessmentDocuments, assessmentStatusHistory, blogCategories, assessmentReports, blogPosts, chatbotConversations, comparisons, documents, emailLogs, favorites, messages, notifications, partnerNotes, meetings, programComparisons, programTranslations, programStats, programFavorites, programReviews, universityScholarships, userSettings, userFavorites, payments, reviews, scholarships, blogPostTags, blogTags, testimonials } from "./schema";

export const partnerProfilesRelations = relations(partnerProfiles, ({one}) => ({
	user: one(users, {
		fields: [partnerProfiles.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	partnerProfiles: many(partnerProfiles),
	partner: one(partners, {
		fields: [users.partnerId],
		references: [partners.id]
	}),
	user: one(users, {
		fields: [users.referredByPartnerId],
		references: [users.id],
		relationName: "users_referredByPartnerId_users_id"
	}),
	users: many(users, {
		relationName: "users_referredByPartnerId_users_id"
	}),
	applicationStatusHistories: many(applicationStatusHistory),
	applicationDocuments_uploadedBy: many(applicationDocuments, {
		relationName: "applicationDocuments_uploadedBy_users_id"
	}),
	applicationDocuments_verifiedBy: many(applicationDocuments, {
		relationName: "applicationDocuments_verifiedBy_users_id"
	}),
	assessmentApplications: many(assessmentApplications),
	applications: many(applications),
	applicationTemplates: many(applicationTemplates),
	students_assignedStaffId: many(students, {
		relationName: "students_assignedStaffId_users_id"
	}),
	students_userId: many(students, {
		relationName: "students_userId_users_id"
	}),
	assessmentStatusHistories: many(assessmentStatusHistory),
	assessmentReports: many(assessmentReports),
	blogPosts: many(blogPosts),
	chatbotConversations: many(chatbotConversations),
	comparisons: many(comparisons),
	documents_uploadedBy: many(documents, {
		relationName: "documents_uploadedBy_users_id"
	}),
	documents_verifiedBy: many(documents, {
		relationName: "documents_verifiedBy_users_id"
	}),
	emailLogs: many(emailLogs),
	favorites: many(favorites),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	notifications: many(notifications),
	partnerNotes: many(partnerNotes),
	meetings_studentId: many(meetings, {
		relationName: "meetings_studentId_users_id"
	}),
	meetings_scheduledBy: many(meetings, {
		relationName: "meetings_scheduledBy_users_id"
	}),
	programComparisons: many(programComparisons),
	programFavorites: many(programFavorites),
	programReviews: many(programReviews),
	userSettings: many(userSettings),
	userFavorites: many(userFavorites),
	payments: many(payments),
	reviews: many(reviews),
}));

export const programsRelations = relations(programs, ({one, many}) => ({
	university: one(universities, {
		fields: [programs.universityId],
		references: [universities.id]
	}),
	applications: many(applications),
	programTranslations: many(programTranslations),
	programStats: many(programStats),
	programFavorites: many(programFavorites),
	programReviews: many(programReviews),
}));

export const universitiesRelations = relations(universities, ({many}) => ({
	programs: many(programs),
	applications: many(applications),
	universityScholarships: many(universityScholarships),
	reviews: many(reviews),
	scholarships: many(scholarships),
}));

export const leadsRelations = relations(leads, ({one, many}) => ({
	users: one(users, {
		fields: [leads.assigneeId],
		references: [users.id]
	}),
	leadActivities: many(leadActivities),
}));

export const partnersRelations = relations(partners, ({many}) => ({
	users: many(users),
	applications: many(applications),
	students: many(students),
}));

export const leadActivitiesRelations = relations(leadActivities, ({one}) => ({
	lead: one(leads, {
		fields: [leadActivities.leadId],
		references: [leads.id]
	}),
	users: one(users, {
		fields: [leadActivities.userId],
		references: [users.id]
	}),
}));

export const applicationStatusHistoryRelations = relations(applicationStatusHistory, ({one}) => ({
	application: one(applications, {
		fields: [applicationStatusHistory.applicationId],
		references: [applications.id]
	}),
	user: one(users, {
		fields: [applicationStatusHistory.changedBy],
		references: [users.id]
	}),
}));

export const applicationsRelations = relations(applications, ({one, many}) => ({
	applicationStatusHistories: many(applicationStatusHistory),
	applicationDocuments: many(applicationDocuments),
	partner: one(partners, {
		fields: [applications.partnerId],
		references: [partners.id]
	}),
	program: one(programs, {
		fields: [applications.programId],
		references: [programs.id]
	}),
	student: one(students, {
		fields: [applications.studentId],
		references: [students.id]
	}),
	user: one(users, {
		fields: [applications.submittedBy],
		references: [users.id]
	}),
	university: one(universities, {
		fields: [applications.universityId],
		references: [universities.id]
	}),
	documents: many(documents),
	messages: many(messages),
	partnerNotes: many(partnerNotes),
	meetings: many(meetings),
	payments: many(payments),
}));

export const applicationDocumentsRelations = relations(applicationDocuments, ({one}) => ({
	application: one(applications, {
		fields: [applicationDocuments.applicationId],
		references: [applications.id]
	}),
	user_uploadedBy: one(users, {
		fields: [applicationDocuments.uploadedBy],
		references: [users.id],
		relationName: "applicationDocuments_uploadedBy_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [applicationDocuments.verifiedBy],
		references: [users.id],
		relationName: "applicationDocuments_verifiedBy_users_id"
	}),
}));

export const assessmentApplicationsRelations = relations(assessmentApplications, ({one, many}) => ({
	user: one(users, {
		fields: [assessmentApplications.reviewedBy],
		references: [users.id]
	}),
	assessmentDocuments: many(assessmentDocuments),
	assessmentStatusHistories: many(assessmentStatusHistory),
	assessmentReports: many(assessmentReports),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	applications: many(applications),
	partner: one(partners, {
		fields: [students.assignedPartnerId],
		references: [partners.id]
	}),
	user_assignedStaffId: one(users, {
		fields: [students.assignedStaffId],
		references: [users.id],
		relationName: "students_assignedStaffId_users_id"
	}),
	user_userId: one(users, {
		fields: [students.userId],
		references: [users.id],
		relationName: "students_userId_users_id"
	}),
	partnerNotes: many(partnerNotes),
}));

export const applicationTemplatesRelations = relations(applicationTemplates, ({one}) => ({
	user: one(users, {
		fields: [applicationTemplates.userId],
		references: [users.id]
	}),
}));

export const assessmentDocumentsRelations = relations(assessmentDocuments, ({one}) => ({
	assessmentApplication: one(assessmentApplications, {
		fields: [assessmentDocuments.applicationId],
		references: [assessmentApplications.id]
	}),
}));

export const assessmentStatusHistoryRelations = relations(assessmentStatusHistory, ({one}) => ({
	assessmentApplication: one(assessmentApplications, {
		fields: [assessmentStatusHistory.applicationId],
		references: [assessmentApplications.id]
	}),
	user: one(users, {
		fields: [assessmentStatusHistory.changedBy],
		references: [users.id]
	}),
}));

export const blogCategoriesRelations = relations(blogCategories, ({one, many}) => ({
	blogCategory: one(blogCategories, {
		fields: [blogCategories.parentId],
		references: [blogCategories.id],
		relationName: "blogCategories_parentId_blogCategories_id"
	}),
	blogCategories: many(blogCategories, {
		relationName: "blogCategories_parentId_blogCategories_id"
	}),
	blogPosts: many(blogPosts),
}));

export const assessmentReportsRelations = relations(assessmentReports, ({one}) => ({
	assessmentApplication: one(assessmentApplications, {
		fields: [assessmentReports.applicationId],
		references: [assessmentApplications.id]
	}),
	user: one(users, {
		fields: [assessmentReports.generatedBy],
		references: [users.id]
	}),
}));

export const blogPostsRelations = relations(blogPosts, ({one, many}) => ({
	user: one(users, {
		fields: [blogPosts.authorId],
		references: [users.id]
	}),
	blogCategory: one(blogCategories, {
		fields: [blogPosts.categoryId],
		references: [blogCategories.id]
	}),
	blogPostTags: many(blogPostTags),
}));

export const chatbotConversationsRelations = relations(chatbotConversations, ({one}) => ({
	user: one(users, {
		fields: [chatbotConversations.userId],
		references: [users.id]
	}),
}));

export const comparisonsRelations = relations(comparisons, ({one}) => ({
	user: one(users, {
		fields: [comparisons.userId],
		references: [users.id]
	}),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	application: one(applications, {
		fields: [documents.applicationId],
		references: [applications.id]
	}),
	user_uploadedBy: one(users, {
		fields: [documents.uploadedBy],
		references: [users.id],
		relationName: "documents_uploadedBy_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [documents.verifiedBy],
		references: [users.id],
		relationName: "documents_verifiedBy_users_id"
	}),
}));

export const emailLogsRelations = relations(emailLogs, ({one}) => ({
	user: one(users, {
		fields: [emailLogs.userId],
		references: [users.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	application: one(applications, {
		fields: [messages.applicationId],
		references: [applications.id]
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const partnerNotesRelations = relations(partnerNotes, ({one}) => ({
	application: one(applications, {
		fields: [partnerNotes.applicationId],
		references: [applications.id]
	}),
	student: one(students, {
		fields: [partnerNotes.studentId],
		references: [students.id]
	}),
	user: one(users, {
		fields: [partnerNotes.userId],
		references: [users.id]
	}),
}));

export const meetingsRelations = relations(meetings, ({one}) => ({
	user_studentId: one(users, {
		fields: [meetings.studentId],
		references: [users.id],
		relationName: "meetings_studentId_users_id"
	}),
	application: one(applications, {
		fields: [meetings.applicationId],
		references: [applications.id]
	}),
	user_scheduledBy: one(users, {
		fields: [meetings.scheduledBy],
		references: [users.id],
		relationName: "meetings_scheduledBy_users_id"
	}),
}));

export const programComparisonsRelations = relations(programComparisons, ({one}) => ({
	user: one(users, {
		fields: [programComparisons.userId],
		references: [users.id]
	}),
}));

export const programTranslationsRelations = relations(programTranslations, ({one}) => ({
	program: one(programs, {
		fields: [programTranslations.programId],
		references: [programs.id]
	}),
}));

export const programStatsRelations = relations(programStats, ({one}) => ({
	program: one(programs, {
		fields: [programStats.programId],
		references: [programs.id]
	}),
}));

export const programFavoritesRelations = relations(programFavorites, ({one}) => ({
	program: one(programs, {
		fields: [programFavorites.programId],
		references: [programs.id]
	}),
	user: one(users, {
		fields: [programFavorites.userId],
		references: [users.id]
	}),
}));

export const programReviewsRelations = relations(programReviews, ({one}) => ({
	program: one(programs, {
		fields: [programReviews.programId],
		references: [programs.id]
	}),
	user: one(users, {
		fields: [programReviews.userId],
		references: [users.id]
	}),
}));

export const universityScholarshipsRelations = relations(universityScholarships, ({one}) => ({
	university: one(universities, {
		fields: [universityScholarships.universityId],
		references: [universities.id]
	}),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	user: one(users, {
		fields: [userSettings.userId],
		references: [users.id]
	}),
}));

export const userFavoritesRelations = relations(userFavorites, ({one}) => ({
	user: one(users, {
		fields: [userFavorites.userId],
		references: [users.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	application: one(applications, {
		fields: [payments.applicationId],
		references: [applications.id]
	}),
	user: one(users, {
		fields: [payments.userId],
		references: [users.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	university: one(universities, {
		fields: [reviews.universityId],
		references: [universities.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
}));

export const scholarshipsRelations = relations(scholarships, ({one}) => ({
	university: one(universities, {
		fields: [scholarships.universityId],
		references: [universities.id]
	}),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({one}) => ({
	blogPost: one(blogPosts, {
		fields: [blogPostTags.postId],
		references: [blogPosts.id]
	}),
	blogTag: one(blogTags, {
		fields: [blogPostTags.tagId],
		references: [blogTags.id]
	}),
}));

export const blogTagsRelations = relations(blogTags, ({many}) => ({
	blogPostTags: many(blogPostTags),
}));