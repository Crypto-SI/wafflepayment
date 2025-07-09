# 🔌 Supabase Multi-App Auth Integration Guide

## 🏗️ **Architecture Overview**

This setup enables **one auth system for multiple apps**:

- **`auth.users`** = Central login credentials (email/password) shared across all apps
- **`subscribers`** = App-specific user data (credits, subscription info) for THIS app
- **Other apps** = Can have their own user tables (e.g., `customers`, `members`) linked to the same `auth.users`

## 📋 **Multi-App User Flow**

```
┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│ App 1 Signup │───▶│ auth.users   │───▶│ customers      │
│              │    │ (password)   │    │ (app 1 data)   │
└──────────────┘    └──────────────┘    └────────────────┘
                           │
                           ▼
┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│ App 2 Login  │───▶│ EXISTING     │───▶│ project_members│
│ (first time) │    │ auth.users   │    │ (app 2 data)   │
└──────────────┘    └──────────────┘    └────────────────┘
                           │
                           ▼
┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│ THIS APP     │───▶│ EXISTING     │───▶│ subscribers    │
│ (Waffle Pay) │    │ auth.users   │    │ (credits etc)  │
└──────────────┘    └──────────────┘    └────────────────┘
```

## 🔄 **Three User Scenarios**

### **1. Brand New User (First App)**
- Signs up in **this app** → Creates in `auth.users` + `subscribers`
- **Flow**: `AuthService.signUp()` → Both tables created

### **2. Existing User from Another App**
- Already in `auth.users` (from App 1)
- Logs into **this app** → Auto-creates in `subscribers`
- **Flow**: `AuthService.signIn()` → Detects missing subscriber → Creates subscriber record

### **3. Existing User Already Using This App**
- Already in both `auth.users` + `subscribers`
- **Flow**: `AuthService.signIn()` → Returns both data sets

## Environment Variables
Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 **Full Integration Steps**

### 1. **Database Setup**
Run the SQL in `src/lib/supabase/database.sql` in your Supabase SQL Editor.

### 2. **Replace Your Auth Pages**

#### **Signup Page**
```typescript
import { AuthService } from '@/lib/supabase/auth-service'

// In your signup form handler
const handleSignup = async (formData) => {
  const result = await AuthService.signUp({
    email: formData.email,
    password: formData.password,
    fullName: formData.fullName,
    metadata: { signupSource: 'web' }
  })

  if (result.success) {
    if (result.needsEmailConfirmation) {
      // Show "check your email" message
      setMessage('Please check your email to confirm your account')
    } else {
      // Redirect to dashboard
      router.push('/dashboard')
    }
  } else {
    setError(result.error.message)
  }
}
```

#### **Login Page**
```typescript
import { AuthService } from '@/lib/supabase/auth-service'

// In your login form handler
const handleLogin = async (formData) => {
  const result = await AuthService.signIn({
    email: formData.email,
    password: formData.password
  })

  if (result.success) {
    // User is now authenticated AND has subscriber data
    // (Auto-created if they came from another app)
    console.log('Auth user:', result.user)
    console.log('Subscriber data:', result.subscriber)
    router.push('/dashboard')
  } else {
    setError(result.error.message)
  }
}
```

### 3. **Dashboard Integration**
```typescript
import { AuthService } from '@/lib/supabase/auth-service'

// In your dashboard component
const [userData, setUserData] = useState(null)

useEffect(() => {
  async function loadUserData() {
    const result = await AuthService.getCurrentUser()
    if (result.success) {
      setUserData({
        auth: result.user,
        subscriber: result.subscriber
      })
    }
  }
  loadUserData()
}, [])

// Use the data
return (
  <div>
    <h1>Welcome {userData?.subscriber?.full_name || userData?.auth?.email}</h1>
    <p>Credits: {userData?.subscriber?.credits || 0}</p>
  </div>
)
```

### 4. **Credit Purchase Integration**
```typescript
import { handleCreditPurchase } from '@/lib/supabase/auth-helpers'

// After successful payment
const user = await AuthService.getCurrentUser()
if (user.success) {
  await handleCreditPurchase({
    userId: user.user.id,
    credits: 1000,
    paymentMethod: 'stripe',
    amountUsd: 25.00,
    transactionHash: paymentIntent.id,
    packageInfo: {
      package: '1000-credits',
      price: 25,
      currency: 'USD'
    }
  })
}
```

### 5. **Auth Guard Hook**
```typescript
// src/hooks/use-auth.ts
import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/supabase/auth-service'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [subscriber, setSubscriber] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const result = await AuthService.getCurrentUser()
      if (result.success) {
        setUser(result.user)
        setSubscriber(result.subscriber)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  return { user, subscriber, loading }
}
```

## 🔄 **Multi-App Benefits**

### **For This App:**
- Users get `auth.users` + `subscribers` data
- Credits tracked in `subscribers.credits`
- Full transaction history

### **For Other Apps:**
- Same users can login with same credentials
- Each app has its own user data table
- Shared auth, separate app data

Example for other apps:
```sql
-- App 1: E-commerce
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    shipping_address JSONB,
    payment_methods JSONB
);

-- App 2: Project Management
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    project_role TEXT,
    permissions JSONB
);
```

## 🎯 **Cross-App User Journey Example**

1. **Day 1**: User signs up in your **E-commerce app** → Creates in `auth.users` + `customers`
2. **Day 5**: Same user tries your **Project Management app** → Logs in with same credentials → Auto-creates in `project_members`
3. **Day 10**: Same user discovers **Waffle Payments** → Logs in with same credentials → Auto-creates in `subscribers` with 0 credits
4. **Day 15**: User buys credits in Waffle Payments → Updates `subscribers.credits`

**One account, seamless experience across all apps!** 🚀

## 🔑 **Key Points**

- ✅ **One signup** = Access to all your apps
- ✅ **Passwords stored securely** in `auth.users`
- ✅ **App-specific data** in separate tables
- ✅ **Auto-creates app records** for existing users
- ✅ **Automatic credit tracking** with database triggers
- ✅ **Works with existing Supabase RLS** for security

Your users get a seamless experience across all your applications! 🚀 