import { useState, useEffect } from 'react'
import { getEnv } from '@/utils/Env'

export interface SubjectUser {
  id: string
  name: string
  mail: string
  role: string
}

export function useSubjectUsers(subjectId: string) {
  const [users, setUsers] = useState<SubjectUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Permite refrescar la lista desde fuera
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = getEnv().API_BASE_URL
      const response = await fetch(`${apiUrl}/subjects/${subjectId}/users`)
      if (!response.ok) {
        throw new Error('Failed to fetch subject users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  // Añadir usuario a la asignatura
  const addUser = async (
    userEmail: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const apiUrl = getEnv()
        .API_ENROLL_USER_IN_SUBJECT.replace('{subjectId}', subjectId)
        .replace('{userEmail}', userEmail)
      const response = await fetch(apiUrl, { method: 'PUT' })
      if (!response.ok) {
        const errorText = await response.text()
        return { ok: false, error: errorText || 'Failed to add user' }
      }
      await fetchUsers()
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  // Eliminar usuario de la asignatura
  const removeUser = async (
    userMail: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const apiUrl = getEnv()
        .API_REMOVE_USER_FROM_SUBJECT.replace('{subjectId}', subjectId)
        .replace('{userEmail}', userMail)
      const response = await fetch(apiUrl, { method: 'DELETE' })
      if (!response.ok) {
        const errorText = await response.text()
        return { ok: false, error: errorText || 'Failed to remove user' }
      }
      await fetchUsers()
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  return { users, loading, error, addUser, removeUser, refresh: fetchUsers }
}
