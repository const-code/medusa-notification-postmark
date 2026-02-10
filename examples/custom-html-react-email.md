# Example: Custom HTML with React Email

This example shows how to use the provider with custom React Email templates.

## 1. Install React Email

```bash
npm install @react-email/components react
```

## 2. Create Email Template

```tsx
// src/emails/order-confirmation.tsx
import { Html, Head, Body, Container, Heading, Text } from "@react-email/components"

interface OrderEmailProps {
  order: {
    display_id: string
    total: number
    customer_name: string
  }
}

export function OrderConfirmation({ order }: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Heading style={{ fontSize: "24px" }}>
            Order Confirmation
          </Heading>
          <Text>
            Hi {order.customer_name},
          </Text>
          <Text>
            Thank you for your order #{order.display_id}.
          </Text>
          <Text style={{ fontWeight: "bold", fontSize: "18px" }}>
            Total: ${(order.total / 100).toFixed(2)}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

## 3. Use in Subscriber

```typescript
// src/subscribers/order-placed.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { render } from "@react-email/components"
import { OrderConfirmation } from "../emails/order-confirmation"

export default async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const notificationService = container.resolve("notification")

  // Fetch order
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: ["id", "email", "display_id", "total", "customer.*"],
    filters: { id: data.id },
  })

  // Render React Email template
  const html = await render(
    <OrderConfirmation
      order={{
        display_id: order.display_id,
        total: order.total,
        customer_name: order.customer?.first_name || "Customer",
      }}
    />
  )

  // Send via Postmark
  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-confirmation",
    data: {
      subject: `Order #${order.display_id} Confirmed`,
      html: html,
      tag: "order-confirmation",
      metadata: {
        orderId: order.id,
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
```

## 4. Configure Provider

```typescript
// medusa-config.ts
export default defineConfig({
  modules: [
    {
      resolve: "@cb4kas17/medusa-notification-postmark",
      options: {
        serverToken: process.env.POSTMARK_SERVER_TOKEN,
        from: "orders@yourstore.com",
        trackOpens: true,
      },
    },
  ],
})
```

## Benefits

- Full control over email design
- Type-safe templates
- Version controlled
- Easy to preview and test

