import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

export const useUserSettings = () => {
  const { user, fetchUserDetails } = useAuth()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sshKeys, setSshKeys] = useState<string[]>([])
  const [newSshKey, setNewSshKey] = useState('')

  // Inicializar las claves SSH desde el contexto
  useEffect(() => {
    if (user?.publicSshKeys) {
      setSshKeys(user.publicSshKeys)
    }
  }, [user])

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
      const requestBody = {
        userId: user?.id,
        password: password || '',
        publicSshKeys: sshKeys,
      }

      const response = await fetch(`${getEnv().API_BASE_URL}/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error('Failed to update user')
      }

      const responseData = await response.json()

      setSuccess(t('Profile updated successfully'))
      setPassword('')
      setConfirmPassword('')

      // Recargar los datos del usuario desde el servidor
      if (user?.id) {
        await fetchUserDetails(user.id)
      }
    } catch (err) {
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
