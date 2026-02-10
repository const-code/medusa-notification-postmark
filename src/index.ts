import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import PostmarkNotificationService from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [PostmarkNotificationService],
})

// Export types for users
export * from "./types"
export * from "./utils"
export { PostmarkNotificationService }

