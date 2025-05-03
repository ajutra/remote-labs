import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

export const useUserSettings = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sshKeys, setSshKeys] = useState<string[]>([])
  const [newSshKey, setNewSshKey] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (password && password !== confirmPassword) {
      setError(t('Passwords do not match'))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${getEnv().API_BASE_URL}/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          password: password || '',
          publicSshKeys: sshKeys.length > 0 ? sshKeys : [''],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      setSuccess(t('Profile updated successfully'))
      setPassword('')
      setConfirmPassword('')
    } catch {
      setError(t('Failed to update profile'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSshKey = () => {
    if (newSshKey.trim()) {
      setSshKeys([...sshKeys, newSshKey.trim()])
      setNewSshKey('')
    }
  }

  const handleRemoveSshKey = (index: number) => {
    setSshKeys(sshKeys.filter((_, i) => i !== index))
  }

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    success,
    sshKeys,
    newSshKey,
    setNewSshKey,
    handleSubmit,
    handleAddSshKey,
    handleRemoveSshKey,
  }
}
