// ─── Webhook Event Status ─────────────────────────────────────────
export type WebhookEventStatus =
  | 'Pending'
  | 'Processing'
  | 'Processed'
  | 'Failed'
  | 'Retrying'
  | 'Dead'
  | 'Ignored'
  | 'InvalidSignature'
  | 'Duplicate'

// ─── Provider ────────────────────────────────────────────────────
export type WebhookProvider =
  | 'Generic'
  | 'GitHub'
  | 'GenericHmac'
  | 'Payment'
  | 'CiCd'
  | 'Internal'

// ─── Processing Attempt ──────────────────────────────────────────
export interface ProcessingAttempt {
  id: string
  attemptNumber: number
  status: 'Success' | 'Failed'
  startedAt: string
  finishedAt: string | null
  durationMs: number | null
  errorMessage: string | null
  workerName: string | null
}

// ─── Webhook Event ───────────────────────────────────────────────
export interface WebhookEvent {
  id: string
  externalEventId: string | null
  eventType: string
  endpointId: string
  endpointName: string
  endpointSlug: string
  projectId: string
  projectName: string
  provider: WebhookProvider
  status: WebhookEventStatus
  signatureValid: boolean | null
  retryCount: number
  maxRetryAttempts?: number | null
  nextRetryAt: string | null
  errorMessage: string | null
  lastErrorMessage?: string | null
  sourceIp: string | null
  payloadJson: string | Record<string, unknown> | null
  headersJson: string | Record<string, string> | null
  receivedAt: string
  processedAt: string | null
  durationMs: number | null
  processingAttempts?: ProcessingAttempt[]
}

// ─── Webhook Endpoint ─────────────────────────────────────────────
export interface WebhookEndpoint {
  id: string
  projectId: string
  projectName: string
  name: string
  slug: string
  webhookUrl: string
  provider: WebhookProvider
  isActive: boolean
  allowedEventTypes: string[] | null
  maxRetryAttempts: number
  signatureHeaderName: string
  rejectInvalidSignature: boolean
  eventsToday: number
  failureRate: number
  lastReceivedAt: string | null
  createdAt: string
}

// ─── Project ─────────────────────────────────────────────────────
export interface Project {
  id: string
  name: string
  description: string | null
  status: 'Active' | 'Inactive' | 'Archived'
  endpointCount: number
  eventCount: number
  failureRate: number
  createdAt: string
  updatedAt: string
}

// ─── Dashboard ────────────────────────────────────────────────────
export interface DashboardSummary {
  totalEvents: number
  processedEvents: number
  failedEvents: number
  retryingEvents: number
  deadEvents: number
  pendingEvents: number
  failureRate: number
  avgProcessingTimeMs: number
  eventsToday: number
}
