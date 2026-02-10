import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import { ServerClient } from "postmark"
import {
  PostmarkOptions,
  NotificationPayload,
  EmailOptions,
  TemplateOptions,
  Attachment,
} from "./types"
import { convertDataUrlsToCID } from "./utils"

export default class PostmarkNotificationService extends AbstractNotificationProviderService {
  static identifier = "postmark"
  
  protected client: ServerClient
  protected options: PostmarkOptions
  protected logger: Logger

  constructor(
    { logger }: { logger: Logger },
    options: PostmarkOptions
  ) {
    super()
    
    if (!options.serverToken) {
      throw new Error("Postmark server token is required")
    }
    
    if (!options.from) {
      throw new Error("From email address is required")
    }

    this.logger = logger
    this.options = {
      messageStream: "outbound",
      convertDataUrlsToCID: true,
      ...options,
    }
    this.client = new ServerClient(options.serverToken)
  }

  /**
   * Send notification via Postmark
   * 
   * Supports two modes:
   * 1. Custom HTML - Pass `html` and `subject` in data
   * 2. Postmark Template - Pass `templateId` or `templateAlias` in data
   * 
   * @param notification - Notification payload from Medusa
   * @returns Object with sent message ID
   */
  async send(notification: NotificationPayload): Promise<{ id: string }> {
    const { to, data } = notification

    // Check if using Postmark templates or custom HTML
    const templateId = data?.templateId as number | string | undefined
    const templateAlias = data?.templateAlias as string | undefined
    
    if (templateId || templateAlias) {
      return this.sendWithTemplate(to, data)
    } else {
      return this.sendWithHtml(to, data)
    }
  }

  /**
   * Send email with custom HTML
   */
  private async sendWithHtml(
    to: string,
    data: Record<string, unknown> | null
  ): Promise<{ id: string }> {
    const html = data?.html as string | undefined
    const subject = data?.subject as string | undefined
    const from = (data?.from as string) || this.options.from
    const replyTo = data?.replyTo as string | undefined
    const messageStream = (data?.messageStream as string) || this.options.messageStream
    
    if (!html) {
      throw new Error(
        "No HTML content provided. Pass 'html' in notification data or use 'templateId'/'templateAlias' for Postmark templates"
      )
    }

    if (!subject) {
      throw new Error(
        "No subject provided. Pass 'subject' in notification data"
      )
    }

    // Handle attachments
    let finalHtml = html
    let attachments: Attachment[] = []

    if (this.options.convertDataUrlsToCID && html.includes('data:image')) {
      const converted = convertDataUrlsToCID(html, (data?.attachments as any[]) || [])
      finalHtml = converted.html
      attachments = converted.attachments
    } else if (data?.attachments) {
      attachments = data.attachments as Attachment[]
    }

    // Build email options
    const emailOptions: any = {
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: finalHtml,
      MessageStream: messageStream,
    }

    // Add optional fields
    this.addOptionalFields(emailOptions, data, attachments)

    try {
      this.logger.debug(`Sending email via Postmark (custom HTML) to ${to}`)

      const response = await this.client.sendEmail(emailOptions)

      this.logger.info(`Email sent successfully via Postmark: ${response.MessageID}`)

      return { id: response.MessageID }
    } catch (error: any) {
      this.logger.error(`Failed to send email via Postmark: ${error?.message || "Unknown error"}`)
      throw error
    }
  }

  /**
   * Send email using Postmark template
   */
  private async sendWithTemplate(
    to: string,
    data: Record<string, unknown> | null
  ): Promise<{ id: string }> {
    const templateId = data?.templateId as number | undefined
    const templateAlias = data?.templateAlias as string | undefined
    const templateModel = (data?.templateModel as Record<string, any>) || {}
    const from = (data?.from as string) || this.options.from
    const replyTo = data?.replyTo as string | undefined
    const messageStream = (data?.messageStream as string) || this.options.messageStream

    if (!templateId && !templateAlias) {
      throw new Error(
        "Either 'templateId' (number) or 'templateAlias' (string) must be provided for Postmark templates"
      )
    }

    // Build template options
    const templateOptions: any = {
      From: from,
      To: to,
      TemplateModel: templateModel,
      MessageStream: messageStream,
    }

    // Use TemplateId or TemplateAlias
    if (templateAlias) {
      templateOptions.TemplateAlias = templateAlias
    } else {
      templateOptions.TemplateId = templateId as number
    }

    // Add optional fields
    const attachments: Attachment[] = (data?.attachments as Attachment[]) || []
    this.addOptionalFields(templateOptions, data, attachments)

    try {
      this.logger.debug(`Sending email via Postmark (template ${templateId || templateAlias}) to ${to}`)

      const response = await this.client.sendEmailWithTemplate(templateOptions)

      this.logger.info(`Email sent successfully via Postmark template: ${response.MessageID}`)

      return { id: response.MessageID }
    } catch (error: any) {
      this.logger.error(`Failed to send email via Postmark template: ${error?.message || "Unknown error"}`)
      throw error
    }
  }

  /**
   * Add optional fields to email options
   */
  private addOptionalFields(
    emailOptions: any,
    data: Record<string, unknown> | null,
    attachments: Attachment[]
  ): void {
    const replyTo = data?.replyTo as string | undefined
    
    if (replyTo) emailOptions.ReplyTo = replyTo
    if (data?.cc) emailOptions.Cc = data.cc as string
    if (data?.bcc) emailOptions.Bcc = data.bcc as string
    if (data?.tag) emailOptions.Tag = data.tag as string
    if (data?.metadata) emailOptions.Metadata = data.metadata as Record<string, string>
    if (attachments.length > 0) emailOptions.Attachments = attachments

    // Tracking options
    if (data?.trackOpens !== undefined) {
      emailOptions.TrackOpens = data.trackOpens as boolean
    } else if (this.options.trackOpens !== undefined) {
      emailOptions.TrackOpens = this.options.trackOpens
    }

    if (data?.trackLinks !== undefined) {
      emailOptions.TrackLinks = data.trackLinks as any
    } else if (this.options.trackLinks !== undefined) {
      emailOptions.TrackLinks = this.options.trackLinks
    }

    // Headers
    if (data?.headers) {
      emailOptions.Headers = data.headers as Array<{ Name: string; Value: string }>
    }
  }
}

