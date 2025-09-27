export interface Command {
  name: string
  description?: string
  category?: string
  usage?: string
  aliases?: string[]
  permissions?: string
  cooldown?: number
  lastModified?: string
  size?: number
  usageCount?: number
  successRate?: number
  errorRate?: number
  isActive?: boolean
  developer?: string
  lineCount?: number
  hide?: boolean
  onPrefix?: boolean
  usedby?: number
  dev?: string
  info?: string
  usages?: string
  cooldowns?: number
  lastUsed?: string
  fileSize?: string
}
