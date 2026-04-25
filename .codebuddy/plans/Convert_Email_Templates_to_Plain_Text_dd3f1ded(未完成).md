---
name: Convert Email Templates to Plain Text
overview: Convert all 10 email templates from HTML with colors/gradients to clean plain text format
todos:
  - id: convert-application-templates
    content: Convert application-related templates (submitted, status update, document status)
    status: in_progress
  - id: convert-meeting-templates
    content: Convert meeting-related templates (scheduled, reminder, cancelled)
    status: pending
  - id: convert-assessment-templates
    content: Convert assessment-related templates (submitted, report ready)
    status: pending
  - id: convert-other-templates
    content: Convert remaining templates (welcome, admin notification)
    status: pending
---

## User Requirements

用户需要将邮件模板从当前的花哨彩色HTML样式转换为简洁的纯文本格式。

## Current State Analysis

当前 `src/lib/email.ts` 包含 10 个邮件模板，都使用了大量HTML样式：

- 渐变背景标题栏 (`linear-gradient`)
- 彩色边框和背景框 (`#f59e0b`, `#d1fae5`, `#fef3c7` 等)
- 样式化按钮
- 圆角卡片布局
- 内联CSS样式

## Target State

简洁的纯文本邮件，保留必要的信息结构：

- 移除所有颜色、渐变、背景样式
- 使用简单的段落和换行
- 链接直接显示URL文本
- 保持邮件内容清晰可读

## Email Templates to Convert (10 total)

1. Application submission confirmation
2. Application status update
3. Document verification email
4. New application admin notification
5. Welcome email for new users
6. Meeting scheduled email
7. Meeting reminder email
8. Meeting cancelled email
9. Assessment submission confirmation
10. Assessment report ready email

## Tech Stack

- Language: TypeScript
- File: `src/lib/email.ts`
- Email Service: Resend API (supports both `html` and `text` fields)

## Implementation Approach

### Conversion Strategy

1. **保留 `html` 字段**：使用极简HTML（仅段落、换行、粗体）
2. **添加 `text` 字段**：纯文本版本，作为主要展示
3. **移除所有样式**：无渐变、颜色、边框、背景
4. **简化格式**：使用纯文本配合适当的换行
5. **保留链接**：以文本URL形式显示

### Template Pattern

```typescript
export function getApplicationSubmittedTemplate(data: ApplicationEmailData): EmailPayload {
  const subject = `Application Submitted - ${data.programName} at ${data.universityName}`;
  
  const text = `
Study In China Academy
======================

Application Successfully Submitted!

Dear ${data.studentName},

Thank you for submitting your application to ${data.programName} at ${data.universityName}.

Application ID: ${data.applicationId}
Status: Under Review

What's Next?
1. Our team will review your application and documents
2. You may be contacted for additional information
3. You'll receive updates on your application status via email

Track your application: ${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/student/applications

If you have any questions, please contact us at info@studyinchina.academy

Best regards,
Team SICA

© ${new Date().getFullYear()} Study In China Academy. All rights reserved.
  `.trim();

  return { to: data.studentEmail, subject, html: text.replace(/\n/g, '<br>'), text };
}
```

## Directory Structure

```
src/lib/
└── email.ts    # [MODIFY] Convert all 10 email templates to plain text format
```

## Implementation Notes

- The `EmailPayload` interface already supports `text?: string` field
- Resend API accepts both `html` and `text` - email clients will prefer text when available
- Keep the same function signatures to maintain backward compatibility
- Preserve all dynamic data and links