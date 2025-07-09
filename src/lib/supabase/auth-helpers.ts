import { DatabaseService } from './database-service'

// Helper function to handle post-login database registration
export async function handleUserLogin(authData: {
  userId: string
  email?: string
  fullName?: string
  name?: string
  avatarUrl?: string
  metadata?: any
}) {
  // Register/update user in subscribers table
  const result = await DatabaseService.registerUser({
    user_id: authData.userId,
    email: authData.email,
    full_name: authData.fullName,
    name: authData.name,
    avatar_url: authData.avatarUrl,
    metadata: authData.metadata
  })

  if (!result.success) {
    console.error('Failed to register user in database:', result.error)
    // Don't block login, just log the error
  }

  return result
}

// Helper function to handle credit purchases
export async function handleCreditPurchase(purchaseData: {
  userId: string
  credits: number
  paymentMethod: string
  amountUsd: number
  transactionHash?: string
  packageInfo?: any
}) {
  // Record the purchase in database
  const result = await DatabaseService.recordCreditPurchase({
    userId: purchaseData.userId,
    credits: purchaseData.credits,
    paymentMethod: purchaseData.paymentMethod,
    amountUsd: purchaseData.amountUsd,
    transactionHash: purchaseData.transactionHash,
    packageInfo: purchaseData.packageInfo
  })

  if (!result.success) {
    console.error('Failed to record credit purchase:', result.error)
    // This should probably block the purchase completion
    throw new Error('Failed to record purchase in database')
  }

  return result
}

// Helper function to get user's current credit balance
export async function getUserCredits(userId: string) {
  return await DatabaseService.getUserCredits(userId)
}

// Helper function to get user's transaction history
export async function getUserTransactions(userId: string) {
  return await DatabaseService.getUserTransactions(userId)
}

// Helper function to get subscriber profile
export async function getSubscriberProfile(userId: string) {
  return await DatabaseService.getSubscriberProfile(userId)
}

// Helper function to use credits (for API calls)
export async function useCredits(userId: string, credits: number, description?: string) {
  return await DatabaseService.useCredits(userId, credits, description)
} 