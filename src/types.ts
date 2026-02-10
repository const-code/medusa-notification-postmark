export interface PostmarkOptions {
  /** Postmark server token */
  serverToken: string
  
  /** Default from email address */
  from: string
  
  /** Postmark message stream (default: "outbound") */
  messageStream?: string
  
  /** Automatically convert data URLs to CID attachments (default: true) */
  convertDataUrlsToCID?: boolean
  
  /** Track email opens (default: undefined - uses Postmark server default) */
  trackOpens?: boolean
  
  /** Track link clicks */
  trackLinks?: "None" | "HtmlAndText" | "HtmlOnly" | "TextOnly"
}

export interface NotificationPayload {
  /** Recipient email address */
  to: string
  
  /** Notification channel (e.g., "email") */
  channel: string
  
  /** Template identifier (optional - for reference) */
  template: string
  
  /** Notification data */
  data: Record<string, unknown> | null
}

export interface EmailOptions {
  From: string
  To: string
  Subject: string
  HtmlBody: string
  MessageStream: string
  ReplyTo?: string
  Cc?: string
  Bcc?: string
  Tag?: string
  Metadata?: Record<string, string>
  Attachments?: Attachment[]
  TrackOpens?: boolean
  TrackLinks?: "None" | "HtmlAndText" | "HtmlOnly" | "TextOnly"
  Headers?: Array<{ Name: string; Value: string }>
}

export interface TemplateOptions {
  From: string
  To: string
  TemplateId?: number
  TemplateAlias?: string
  TemplateModel: Record<string, any>
  MessageStream: string
  ReplyTo?: string
  Cc?: string
  Bcc?: string
  Tag?: string
  Metadata?: Record<string, string>
  Attachments?: Attachment[]
  TrackOpens?: boolean
  TrackLinks?: "None" | "HtmlAndText" | "HtmlOnly" | "TextOnly"
  Headers?: Array<{ Name: string; Value: string }>
}

export interface Attachment {
  /** File name */
  Name: string
  
  /** Base64-encoded content */
  Content: string
  
  /** MIME type */
  ContentType: string
  
  /** Content ID for inline images (e.g., "cid:logo") */
  ContentID?: string
}

/**
 * Data object passed to createNotifications()
 * Use this interface to see what you can pass in the 'data' field
 */
export interface PostmarkNotificationData {
  // === For Custom HTML Mode ===
  /** Email subject line (required for custom HTML) */
  subject?: string
  
  /** Rendered HTML content (required for custom HTML) */
  html?: string
  
  // === For Postmark Template Mode ===
  /** Postmark template ID (use this OR templateAlias) */
  templateId?: number
  
  /** Postmark template alias (use this OR templateId) */
  templateAlias?: string
  
  /** Variables to pass to Postmark template */
  templateModel?: Record<string, any>
  
  // === Common Options (both modes) ===
  /** Override default from address */
  from?: string
  
  /** Reply-to address */
  replyTo?: string
  
  /** CC recipients (comma-separated or array) */
  cc?: string | string[]
  
  /** BCC recipients (comma-separated or array) */
  bcc?: string | string[]
  
  /** Tag for categorizing emails in Postmark */
  tag?: string
  
  /** Custom metadata (key-value pairs) */
  metadata?: Record<string, string>
  
  /** File attachments */
  attachments?: Attachment[]
  
  /** Message stream (e.g., "outbound", "broadcasts") */
  messageStream?: string
  
  /** Track email opens */
  trackOpens?: boolean
  
  /** Track link clicks */
  trackLinks?: "None" | "HtmlAndText" | "HtmlOnly" | "TextOnly"
  
  /** Custom email headers */
  headers?: Array<{ Name: string; Value: string }>
}

