# Example: Using Postmark Templates

This example shows how to use Postmark's hosted templates instead of custom HTML.

## 1. Create Template in Postmark

1. Log into Postmark dashboard
2. Go to Templates
3. Create a new template
4. Design your template using their editor
5. Use variables like `{{user_name}}`, `{{order_id}}`, etc.
6. Note the Template ID or set an Alias

Example template content:
```html
<h1>Welcome, {{user_name}}!</h1>
<p>Thanks for joining {{store_name}}.</p>
<a href="{{login_url}}">Login to your account</a>
```

## 2. Use in Subscriber

```typescript
// src/subscribers/user-created.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"

export default async function handleUserCreated({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve("notification")
  const user = data

  // Send using Postmark template
  await notificationService.createNotifications({
    to: user.email,
    channel: "email",
    template: "welcome", // Just for reference
    data: {
      // Use template alias (or templateId: 12345)
      templateAlias: "user-welcome",
      
      // Pass variables to template
      templateModel: {
        user_name: user.first_name,
        store_name: "My Store",
        login_url: `${process.env.STORE_URL}/login`,
      },
      
      // Optional
      tag: "user-onboarding",
      messageStream: "outbound",
    },
  })
}

export const config: SubscriberConfig = {
  event: "user.created",
}
```

## 3. Marketing Newsletter Example

```typescript
// src/subscribers/send-newsletter.ts
export default async function handleNewsletter({
  event: { data },
  container,
}: SubscriberArgs) {
  const notificationService = container.resolve("notification")
  const subscribers = data.subscribers

  for (const subscriber of subscribers) {
    await notificationService.createNotifications({
      to: subscriber.email,
      channel: "email",
      template: "newsletter",
      data: {
        templateAlias: "monthly-newsletter",
        templateModel: {
          subscriber_name: subscriber.name,
          month: new Date().toLocaleString('default', { month: 'long' }),
          featured_products: data.featuredProducts,
          discount_code: data.discountCode,
        },
        messageStream: "broadcasts", // Use broadcasts for marketing
        tag: "newsletter",
      },
    })
  }
}
```

## 4. Password Reset Example

```typescript
// src/subscribers/password-reset.ts
export default async function handlePasswordReset({
  event: { data },
  container,
}: SubscriberArgs) {
  const notificationService = container.resolve("notification")
  const { email, resetToken } = data

  await notificationService.createNotifications({
    to: email,
    channel: "email",
    template: "password-reset",
    data: {
      templateId: 123456, // Using template ID instead of alias
      templateModel: {
        reset_url: `${process.env.STORE_URL}/reset-password?token=${resetToken}`,
        expires_in: "1 hour",
      },
      tag: "password-reset",
    },
  })
}
```

## Benefits

- Non-technical team can edit templates
- A/B testing in Postmark dashboard
- No deployment needed for changes
- Multi-language template support
- Postmark's email deliverability features

## When to Use

- Marketing emails (newsletters, campaigns)
- User-facing emails that change frequently
- Multi-language emails
- Emails managed by non-technical team
- A/B testing requirements

