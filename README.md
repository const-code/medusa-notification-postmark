# @const-code/medusa-notification-postmark

A Postmark notification provider for Medusa v2. Supports sending emails using custom HTML (React Email, Handlebars, plain HTML) or Postmark's hosted templates.

## Features

- **Dual Mode** - Use custom HTML or Postmark's hosted templates
- **Auto CID Conversion** - Automatically converts `data:image` URLs to email attachments
- **Message Streams** - Supports transactional, broadcasts, and custom streams
- **Full Postmark API** - Tracking, tags, metadata, and custom headers
- **TypeScript** - Fully typed for type safety
- **Zero Templates** - Bring your own templates or use Postmark's
- **Framework Agnostic** - Works with any rendering engine

## Two Ways to Send Emails

This provider gives you full flexibility in how you design and send your emails:

### 1. Custom HTML Templates
Build your email templates in code using React Email, Handlebars, or plain HTML. Perfect for transactional emails where you need full control and version control.

### 2. Postmark Templates
Use Postmark's template editor to design and customize emails directly in the Postmark dashboard. No code changes needed - fully customizable via Postmark's interface. Ideal for marketing emails and when non-technical team members need to edit templates.

## Installation

```bash
npm install @const-code/medusa-notification-postmark postmark
```

Or with yarn:

```bash
yarn add @const-code/medusa-notification-postmark postmark
```

## Quick Start

### 1. Configure in `medusa-config.ts`

```typescript
import { defineConfig } from "@medusajs/framework/utils"

export default defineConfig({
  modules: [
    {
      resolve: "@const-code/medusa-notification-postmark",
      options: {
        serverToken: process.env.POSTMARK_SERVER_TOKEN,
        from: "orders@yourstore.com",
        messageStream: "outbound", // Optional
        trackOpens: true, // Optional
      },
    },
  ],
})
```

### 2. Add Environment Variables

```env
POSTMARK_SERVER_TOKEN=your-server-token-here
```

### 3. Use in Subscribers

**Option A: Custom HTML (React Email)**

```typescript
import { render } from "@react-email/components"
import { OrderEmail } from "../emails/order"

export default async function({ event, container }) {
  const notificationService = container.resolve("notification")
  const order = event.data
  
  // Render your template
  const html = await render(<OrderEmail order={order} />)
  
  // Send via Postmark
  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-placed",
    data: {
      subject: `Order #${order.display_id} Confirmed`,
      html: html,
    },
  })
}
```

**Option B: Postmark Templates**

```typescript
export default async function({ event, container }) {
  const notificationService = container.resolve("notification")
  const user = event.data
  
  // Use Postmark template from dashboard
  await notificationService.createNotifications({
    to: user.email,
    channel: "email",
    template: "welcome",
    data: {
      templateAlias: "welcome-email", // or templateId: 12345
      templateModel: {
        user_name: user.name,
        login_url: "https://yourstore.com/login",
      },
    },
  })
}
```

## Configuration Options

### Provider Options (medusa-config.ts)

Configure these when registering the provider:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `serverToken` | `string` | Yes | - | Your Postmark server API token |
| `from` | `string` | Yes | - | Default "from" email address |
| `messageStream` | `string` | No | `"outbound"` | Default message stream |
| `convertDataUrlsToCID` | `boolean` | No | `true` | Auto-convert data URLs to CID attachments |
| `trackOpens` | `boolean` | No | `undefined` | Track email opens by default |
| `trackLinks` | `string` | No | `undefined` | Track link clicks: `"None"`, `"HtmlAndText"`, `"HtmlOnly"`, `"TextOnly"` |

---

### Notification Data Options (data field)

These are passed in the `data` object when calling `createNotifications()`:

#### **Mode 1: Custom HTML**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `html` | `string` | Yes | Rendered HTML content |
| `subject` | `string` | Yes | Email subject line |

#### **Mode 2: Postmark Templates**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateId` | `number` | One required | Postmark template ID |
| `templateAlias` | `string` | One required | Postmark template alias |
| `templateModel` | `object` | Yes | Variables for the template |
| `subject` | `string` | No | Optional subject override |

#### **Common Options (Both Modes)**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `from` | `string` | Override default from address | `"noreply@store.com"` |
| `replyTo` | `string` | Reply-to address | `"support@store.com"` |
| `cc` | `string \| string[]` | CC recipients | `"manager@store.com"` |
| `bcc` | `string \| string[]` | BCC recipients | `["archive@store.com", "compliance@store.com"]` |
| `tag` | `string` | Tag for categorization in Postmark | `"order-confirmation"` |
| `metadata` | `Record<string, string>` | Custom key-value metadata | `{ orderId: "123" }` |
| `attachments` | `Attachment[]` | File attachments | See Attachment type below |
| `messageStream` | `string` | Override message stream | `"broadcasts"` |
| `trackOpens` | `boolean` | Override open tracking | `true` |
| `trackLinks` | `string` | Override link tracking | `"HtmlAndText"` |
| `headers` | `Array<{Name, Value}>` | Custom email headers | `[{ Name: "X-Custom", Value: "test" }]` |

#### **Attachment Type**

```typescript
{
  Name: string,        // Filename (e.g., "invoice.pdf")
  Content: string,     // Base64-encoded file content
  ContentType: string, // MIME type (e.g., "application/pdf")
  ContentID?: string,  // For inline images (e.g., "cid:logo")
}
```

## Examples

### Example 1: QR Codes (Auto-converted to CID)

```typescript
import QRCode from "qrcode"

const qrCode = await QRCode.toDataURL(ticketId)
const html = await render(<TicketEmail qrCode={qrCode} />)

// Provider automatically converts data:image to CID!
await notificationService.createNotifications({
  to: email,
  channel: "email",
  template: "ticket",
  data: {
    subject: "Your Ticket",
    html: html,
  },
})
```

### Example 2: Message Streams

```typescript
// Transactional email
await notificationService.createNotifications({
  to: email,
  channel: "email",
  template: "receipt",
  data: {
    subject: "Your Receipt",
    html: html,
    messageStream: "outbound", // Default
  },
})

// Marketing email
await notificationService.createNotifications({
  to: email,
  channel: "email",
  template: "newsletter",
  data: {
    subject: "Monthly Newsletter",
    html: html,
    messageStream: "broadcasts",
  },
})
```

### Example 3: Attachments

```typescript
await notificationService.createNotifications({
  to: email,
  channel: "email",
  template: "invoice",
  data: {
    subject: "Your Invoice",
    html: html,
    attachments: [
      {
        Name: "invoice.pdf",
        Content: "base64-content-here",
        ContentType: "application/pdf",
      },
    ],
  },
})
```

### Example 4: Metadata & Tags

```typescript
await notificationService.createNotifications({
  to: email,
  channel: "email",
  template: "order",
  data: {
    subject: "Order Confirmed",
    html: html,
    tag: "order-confirmation",
    metadata: {
      orderId: order.id,
      customerId: customer.id,
    },
  },
})
```

## Message Streams

| Stream | Purpose | Example Use Cases |
|--------|---------|-------------------|
| `outbound` | Transactional emails (default) | Orders, receipts, password resets |
| `broadcasts` | Marketing emails | Newsletters, promotions |
| Custom | Any stream you create in Postmark | VIP customers, internal alerts |

## TypeScript Support

All TypeScript types are exported for autocomplete and type safety:

```typescript
import type {
  PostmarkOptions,           // Provider configuration options
  PostmarkNotificationData,  // What you pass in 'data' field
  NotificationPayload,       // Full notification payload structure
  Attachment,                // File attachment type
} from "@const-code/medusa-notification-postmark"

// Utility functions
import { convertDataUrlsToCID } from "@const-code/medusa-notification-postmark"
```

### Example with Types:

```typescript
import type { PostmarkNotificationData } from "@const-code/medusa-notification-postmark"

// Your IDE will now show all available options!
const emailData: PostmarkNotificationData = {
  subject: "Order Confirmed",
  html: renderedHtml,
  tag: "order-confirmation",
  trackOpens: true,
  metadata: {
    orderId: "123",
    customerId: "456",
  },
}

await notificationService.createNotifications({
  to: customer.email,
  channel: "email",
  template: "order",
  data: emailData,
})
```

## Utility Functions

### convertDataUrlsToCID

Manually convert data URLs to CID attachments:

```typescript
import { convertDataUrlsToCID } from "@const-code/medusa-notification-postmark"

const html = `<img src="data:image/png;base64,..." />`
const { html: finalHtml, attachments } = convertDataUrlsToCID(html)

// finalHtml: <img src="cid:image-0" />
// attachments: [{ Name: "image-0.png", Content: "...", ContentID: "cid:image-0" }]
```

## When to Use Each Approach

### Custom HTML

- Full control over design
- Version controlled with your code
- TypeScript type safety
- Dynamic logic in templates

Best for: Order confirmations, receipts, password resets

### Postmark Templates

- Non-technical team can edit templates
- A/B testing in Postmark dashboard
- No deployment needed for updates
- Multi-language support

Best for: Marketing emails, newsletters, campaigns

## FAQ

**Q: Do I need to include templates in this package?**  
A: No! This is a transport-only provider. You bring your own templates or use Postmark's.

**Q: Can I use both approaches in the same project?**  
A: Yes! Use custom HTML for transactional and Postmark templates for marketing.

**Q: Are QR codes supported?**  
A: Yes! Any `data:image` URL is automatically converted to CID attachments.

**Q: Can I disable CID conversion?**  
A: Yes, set `convertDataUrlsToCID: false` in options.

## License

MIT

## Contributing

Contributions are welcome. Please open an issue or pull request.

## Links

- [GitHub Repository](https://github.com/const-code/medusa-notification-postmark)
- [npm Package](https://www.npmjs.com/package/@const-code/medusa-notification-postmark)
- [Postmark Documentation](https://postmarkapp.com/developer)
- [Medusa Documentation](https://docs.medusajs.com)

