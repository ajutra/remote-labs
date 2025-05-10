import { useState, useEffect } from 'react'
import { getEnv } from '../utils/Env'
import { useAuth } from '../context/AuthContext'
import { useDefineTemplate, DefineTemplateParams } from './useDefineTemplate'

interface ValidationResult {
  email: string
  valid: boolean
}

interface Base {
  baseId: string
  description: string
}

interface CreateSubjectResponse {
  subject_id: string
}

interface EnrollmentError {
  email: string
  error: string
}

interface CreateInstanceFrontendResponse {
  instanceId: string
}

interface CreateInstanceFrontendRequest {
  userId: string
  subjectId: string
  templateId: string
  username: string
  password: string
  publicSshKeys: string[]
}

export interface CreateSubjectParams {
  subjectName: string
  subjectCode: string
  professorEmails: string[]
  studentEmails: string
  base: string
  vmRam: string
  vmCpu: string
  vmStorage: string
  templateDescription: string
  customizeVm: boolean
  vmUsername: string
  vmPassword: string
}

const useCreateSubject = (onSuccess: () => void) => {
  const { user } = useAuth()
  const { defineTemplate } = useDefineTemplate()
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)
  const [bases, setBases] = useState<Base[]>([])
  const [isLoadingBases, setIsLoadingBases] = useState(true)
  const [enrollmentErrors, setEnrollmentErrors] = useState<EnrollmentError[]>(
    []
  )

  useEffect(() => {
    const fetchBases = async () => {
      try {
        console.log('[fetchBases] Fetching bases from', getEnv().API_BASES)
        const response = await fetch(getEnv().API_BASES)
        console.log('[fetchBases] Response status:', response.status)
        const text = await response.text()
        console.log('[fetchBases] Raw response text:', text)
        let data
        try {
          data = JSON.parse(text)
        } catch (jsonErr) {
          console.error('[fetchBases] Error parsing JSON:', jsonErr)
          setBases([])
          return
        }
        console.log('[fetchBases] Parsed data:', data)
        setBases(data)
      } catch (error) {
        console.error('Error fetching bases:', error)
        setBases([])
      } finally {
        setIsLoadingBases(false)
      }
    }
    fetchBases()
  }, [])

  const enrollUserToSubject = async (
    subjectId: string,
    userEmail: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        getEnv()
          .API_ENROLL_USER_IN_SUBJECT.replace('{subjectId}', subjectId)
          .replace('{userEmail}', userEmail),
        {
          method: 'POST',
        }
      )
      if (!response.ok) {
        throw new Error('Failed to enroll user')
      }
      return true
    } catch (error) {
      console.error(`Error enrolling user ${userEmail}:`, error)
      setEnrollmentErrors((prev) => [
        ...prev,
        {
          email: userEmail,
          error:
            error instanceof Error ? error.message : 'Failed to enroll user',
        },
      ])
      return false
    }
  }

  const createProfessorVm = async (
    subjectId: string,
    base: string,
    username: string,
    password: string
  ): Promise<string> => {
    if (!user?.id || !user?.publicSshKeys) {
      throw new Error('User information is required')
    }
    const request: CreateInstanceFrontendRequest = {
      userId: user.id,
      subjectId,
      templateId: base, // Usamos el base_id como templateId para crear la VM
      username,
      password,
      publicSshKeys: user.publicSshKeys,
    }
    const response = await fetch(getEnv().API_CREATE_INSTANCE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      throw new Error('Failed to create professor VM')
    }
    const { instanceId }: CreateInstanceFrontendResponse = await response.json()
    return instanceId
  }

  const handleCreateSubject = async (params: CreateSubjectParams) => {
    const {
      subjectName,
      subjectCode,
      professorEmails,
      studentEmails,
      base,
      vmRam,
      vmCpu,
      vmStorage,
      templateDescription,
      customizeVm,
      vmUsername,
      vmPassword,
    } = params

    setCreationError(null)
    setEnrollmentErrors([])
    setIsCreating(true)
    let subjectId: string | null = null
    try {
      // Step 1: Create the subject
      const professorEmail =
        user?.role === 'admin' && professorEmails.length > 0
          ? professorEmails[0]
          : user?.mail
      if (!professorEmail) {
        throw new Error('No professor email available')
      }
      const subjectResponse = await fetch(getEnv().API_CREATE_SUBJECT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subjectName,
          code: subjectCode,
          professor_email: professorEmail,
        }),
      })
      if (!subjectResponse.ok) {
        throw new Error('Failed to create subject')
      }
      const { subject_id }: CreateSubjectResponse = await subjectResponse.json()
      subjectId = subject_id
      // Step 2: Enroll professors
      await Promise.all(
        professorEmails.map((email) => enrollUserToSubject(subject_id, email))
      )
      // Step 3: Enroll students
      const studentEmailsList = studentEmails
        .split('\n')
        .map((email) => email.trim())
        .filter((email) => email !== '')
      await Promise.all(
        studentEmailsList.map((email) => enrollUserToSubject(subject_id, email))
      )
      // Step 4: Create template or create Professor's vm
      try {
        if (customizeVm) {
          // 1. Create VM for professor
          const instanceId = await createProfessorVm(
            subject_id,
            base,
            vmUsername,
            vmPassword
          )
          // 2. Crear template a partir de la instancia creada
          const templateParams: DefineTemplateParams = {
            name: subjectName,
            description: templateDescription,
            vcpu_count: parseInt(vmCpu),
            vram_mb: parseInt(vmRam) * 1024,
            size_mb: parseInt(vmStorage) * 1024,
            base,
            instance_id: instanceId,
          }
          await defineTemplate(templateParams)
        } else {
          // Crear template directamente desde base
          const templateParams: DefineTemplateParams = {
            name: subjectName,
            description: templateDescription,
            vcpu_count: parseInt(vmCpu),
            vram_mb: parseInt(vmRam) * 1024,
            size_mb: parseInt(vmStorage) * 1024,
            base,
            instance_id: base, // base_id como instance_id para template base
          }
          await defineTemplate(templateParams)
        }
      } catch (error) {
        // If template creation fails, delete the subject
        if (subjectId) {
          await fetch(getEnv().API_DELETE_SUBJECT.replace('{id}', subjectId), {
            method: 'DELETE',
          })
        }
        throw error // Re-throw to trigger the catch block below
      }
      onSuccess()
    } catch (error) {
      console.error('Error creating subject:', error)
      setCreationError(
        error instanceof Error ? error.message : 'Failed to create subject'
      )
    } finally {
      setIsCreating(false)
    }
  }

  return {
    bases,
    isLoadingBases,
    isCreating,
    creationError,
    enrollmentErrors,
    handleCreateSubject,
  }
}

export default useCreateSubject
