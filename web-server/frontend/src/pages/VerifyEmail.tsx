import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const verificationAttempted = useRef(false)

  useEffect(() => {
    const verifyEmail = async () => {
      if (verificationAttempted.current) {
        return
      }

      verificationAttempted.current = true
      const token = searchParams.get('token')
      if (!token) {
        setError('No verification token provided')
        setLoading(false)
        return
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const response = await fetch(
          `http://localhost:8080/verify-email/${token}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Verification failed')
        }

        const data = await response.json()

        if (
          data.message === 'User verified successfully' ||
          data.message === 'User already verified'
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          setVerified(true)
        } else {
          throw new Error('Invalid response from server')
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred during verification'
        )
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-md">
          <h1 className="mb-6 text-2xl font-bold text-card-foreground">
            Email Verification
          </h1>
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-card-foreground">Verifying your email...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-md">
          <h1 className="mb-6 text-2xl font-bold text-card-foreground">
            Verification Error
          </h1>
          <div className="text-center text-destructive">
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-md">
          <h1 className="mb-6 text-2xl font-bold text-card-foreground">
            Email Verified Successfully
          </h1>
          <div className="text-center text-green-600">
            <p className="mb-4">
              Your email has been verified successfully! You can close this
              window and return to login page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default VerifyEmail
