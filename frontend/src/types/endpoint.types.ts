export interface WebhookEndpoint {
  id: string
  projectId: string
  projectName: string
  name: string
  description: string | null
  slug: string
  webhookUrl: string
  provider: string
  isActive: boolean
  allowedEventTypes: string[] | null
  signatureHeaderName: string
  rejectInvalidSignature: boolean
  maxRetryAttempts: number
  retryStrategy: string
  createdAt: string
  updatedAt: string
}

export interface CreateEndpointRequest {
  projectId: string
  name: string
  description?: string
  provider: string
  allowedEventTypes?: string[]
  signatureHeaderName: string
  rejectInvalidSignature: boolean
  maxRetryAttempts: number
  retryStrategy: string
}

export interface UpdateEndpointRequest {
  name: string
  description?: string
  allowedEventTypes?: string[]
  signatureHeaderName: string
  rejectInvalidSignature: boolean
  maxRetryAttempts: number
  retryStrategy: string
}

export interface EndpointSecretResponse {
  endpoint: WebhookEndpoint
  secretKey: string
}

export interface RotatedSecretResponse {
  secretKey: string
}
