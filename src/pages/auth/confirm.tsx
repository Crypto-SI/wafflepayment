import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

// TODO: If your Supabase Gotrue is self-hosted, set this to your auth endpoint
const SUPABASE_AUTH_URL = process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL || '/auth/v1/verify'

export default function ConfirmEmail() {
  const router = useRouter()
  const { token, type, redirect_to } = router.query

  const [message, setMessage] = useState('Confirming your email...')

  useEffect(() => {
    if (!token || !type) return

    const verify = async () => {
      try {
        const endpoint = SUPABASE_AUTH_URL.startsWith('http')
          ? SUPABASE_AUTH_URL
          : typeof window !== 'undefined'
            ? SUPABASE_AUTH_URL
            : ''
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, type }),
        })

        if (res.ok) {
          setMessage('Email confirmed! Redirecting...')
          setTimeout(() => {
            if (redirect_to && typeof redirect_to === 'string') {
              window.location.href = redirect_to as string
            } else {
              window.location.href = '/'
            }
          }, 1500)
        } else {
          const { error } = await res.json()
          setMessage(`Error: ${error?.message || 'Could not confirm email.'}`)
        }
      } catch (err) {
        setMessage('An error occurred during confirmation.')
      }
    }

    verify()
  }, [token, type, redirect_to])

  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h2>{message}</h2>
    </div>
  )
} 