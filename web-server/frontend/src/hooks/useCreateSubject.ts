import { useState, useEffect } from 'react'
import { getEnv } from '../utils/Env'
import { useAuth } from '../context/AuthContext'
import { useDefineTemplate } from './useDefineTemplate'
import { useAlertDialog } from '../context/AlertDialogContext'

interface Base {
  baseId: string
  description: string
}

interface CreateSubjectResponse {
  subjectId: string
}

interface EnrollmentError {
  email: string
  error: string
}

interface CreateInstanceFrontendRequest {
  userId: string
  subjectId: string
  sourceVmId: string
  username: string
  password: string
  publicSshKeys: string[]
  sizeMB: number
  vcpuCount: number
  vramMB: number
}

interface DefineTemplateRequest {
  sourceInstanceId: string
  sizeMB: number
  vcpuCount: number
  vramMB: number
  subjectId: string
  description: string
  isValidated: boolean
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
  console.log('[useCreateSubject] Hook initialized')
  const { user } = useAuth()
  const { defineTemplate } = useDefineTemplate()
  const { showAlert } = useAlertDialog()
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)
  const [bases, setBases] = useState<Base[]>([])
  const [isLoadingBases, setIsLoadingBases] = useState(true)
  const [enrollmentErrors, setEnrollmentErrors] = useState<EnrollmentError[]>(
    []
  )

  useEffect(() => {
    const fetchBases = async () => {
      console.log('[useCreateSubject] Starting to fetch bases')
      try {
        console.log(
          '[useCreateSubject] Fetching bases from',
          getEnv().API_BASES
        )
        const response = await fetch(getEnv().API_BASES)
        console.log('[useCreateSubject] Response status:', response.status)
        const text = await response.text()
        console.log('[useCreateSubject] Raw response text:', text)
        let data
        try {
          data = JSON.parse(text)
          console.log(
            '[useCreateSubject] Successfully parsed bases data:',
            data
          )
        } catch (jsonErr) {
          console.error('[useCreateSubject] Error parsing JSON:', jsonErr)
          setBases([])
          return
        }
        setBases(data)
      } catch (error) {
        console.error('[useCreateSubject] Error fetching bases:', error)
        setBases([])
      } finally {
        setIsLoadingBases(false)
        console.log('[useCreateSubject] Finished loading bases')
      }
    }
    fetchBases()
  }, [])

  const enrollUserToSubject = async (
    subjectId: string,
    userEmail: string
  ): Promise<boolean> => {
    console.log(
      `[useCreateSubject] Attempting to enroll user ${userEmail} to subject ${subjectId}`
    )
    try {
      const response = await fetch(
        getEnv()
          .API_ENROLL_USER_IN_SUBJECT.replace('{subjectId}', subjectId)
          .replace('{userEmail}', userEmail),
        {
          method: 'PUT',
        }
      )
      if (!response.ok) {
        console.error(
          `[useCreateSubject] Failed to enroll user ${userEmail}. Status:`,
          response.status
        )
        throw new Error('Failed to enroll user')
      }
      console.log(`[useCreateSubject] Successfully enrolled user ${userEmail}`)
      return true
    } catch (error) {
      console.error(
        `[useCreateSubject] Error enrolling user ${userEmail}:`,
        error
      )
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
    templateId: string,
    username: string,
    password: string,
    vmRam: string,
    vmCpu: string,
    vmStorage: string
  ): Promise<string> => {
    console.log('[useCreateSubject] Starting professor VM creation', {
      subjectId,
      templateId,
      username,
    })
    if (!user?.id) {
      console.error('[useCreateSubject] No user ID available')
      throw new Error('User ID is required')
    }
    if (!user?.publicSshKeys) {
      console.error('[useCreateSubject] No SSH keys available')
      throw new Error('SSH keys are required')
    }
    const request: CreateInstanceFrontendRequest = {
      userId: user.id,
      subjectId,
      sourceVmId: templateId,
      username,
      password,
      publicSshKeys: user.publicSshKeys,
      sizeMB: parseInt(vmStorage) * 1024, // Convert GB to MB
      vcpuCount: parseInt(vmCpu),
      vramMB: parseInt(vmRam) * 1024, // Convert GB to MB
    }
    console.log('[useCreateSubject] Sending VM creation request:', {
      ...request,
      password: '[REDACTED]',
    })
    const response = await fetch(getEnv().API_CREATE_INSTANCE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      console.error(
        '[useCreateSubject] Failed to create professor VM. Status:',
        response.status
      )
      throw new Error('Failed to create professor VM')
    }

    // Procesar correctamente el JSON de respuesta
    const responseData = await response.json()
    const instanceId = responseData.instanceId

    if (!instanceId) {
      throw new Error('Response does not contain instanceId')
    }

    console.log('[useCreateSubject] Successfully created professor VM:', {
      instanceId,
    })

    return instanceId
  }

  const handleCreateSubject = async (params: CreateSubjectParams) => {
    console.log('[useCreateSubject] Starting subject creation with params:', {
      ...params,
      vmPassword: '[REDACTED]',
    })
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

    if (!user?.mail) {
      console.error('[useCreateSubject] No user email available')
      throw new Error('No user email available')
    }

    setCreationError(null)
    setEnrollmentErrors([])
    setIsCreating(true)

    try {
      // Add current user's email to the beginning of professor emails list
      const allProfessorEmails = [
        user.mail,
        ...professorEmails.filter((email) => email !== user.mail),
      ]
      console.log(
        '[useCreateSubject] All professor emails:',
        allProfessorEmails
      )

      // Step 1: Create the subject
      console.log('[useCreateSubject] Step 1: Creating subject')
      const subjectResponse = await fetch(getEnv().API_CREATE_SUBJECT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subjectName,
          code: subjectCode,
          professorMail: user.mail,
        }),
      })
      if (!subjectResponse.ok) {
        console.error(
          '[useCreateSubject] Failed to create subject. Status:',
          subjectResponse.status,
          'Response:',
          await subjectResponse.json()
        )
        throw new Error('Failed to create subject')
      }
      const { subjectId }: CreateSubjectResponse = await subjectResponse.json()
      console.log('[useCreateSubject] Subject created successfully:', {
        subjectId,
      })

      // Step 2: Enroll professors
      console.log(
        '[useCreateSubject] Step 2: Enrolling professors:',
        allProfessorEmails
      )
      await Promise.all(
        allProfessorEmails.map((email) => enrollUserToSubject(subjectId, email))
      )

      // Step 3: Enroll students
      console.log('[useCreateSubject] Step 3: Enrolling students')
      const studentEmailsList = studentEmails
        .split('\n')
        .map((email) => email.trim())
        .filter((email) => email !== '')
      console.log(
        '[useCreateSubject] Student emails to enroll:',
        studentEmailsList
      )
      await Promise.all(
        studentEmailsList.map((email) => enrollUserToSubject(subjectId, email))
      )

      // Step 4: Create template or create Professor's vm
      console.log('[useCreateSubject] Step 4: Creating template/VM')
      try {
        if (customizeVm) {
          console.log('[useCreateSubject] Creating customized VM')
          await createProfessorVm(
            subjectId,
            base, // Use base as templateId
            vmUsername,
            vmPassword,
            vmRam,
            vmCpu,
            vmStorage
          )

          console.log(
            '[useCreateSubject] VM creation initiated. Informing user.'
          )
          showAlert(
            'Virtual Machine Creation',
            'Your virtual machine is being created. This process may take a few minutes. Please check your subject later to verify its creation.'
          )
        } else {
          console.log('[useCreateSubject] Creating template directly from base')
          const templateParams: DefineTemplateRequest = {
            sourceInstanceId: base,
            sizeMB: parseInt(vmStorage) * 1024, // Convert GB to MB
            vcpuCount: parseInt(vmCpu),
            vramMB: parseInt(vmRam) * 1024, // Convert GB to MB
            subjectId,
            description: templateDescription,
            isValidated: true,
          }
          await defineTemplate(templateParams)
        }
        console.log(
          '[useCreateSubject] Template/VM creation completed successfully'
        )
      } catch (error) {
        console.error(
          '[useCreateSubject] Error in template/VM creation:',
          error
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 15000))

      console.log('[useCreateSubject] Subject creation completed successfully')
      onSuccess()
    } catch (error) {
      console.error(
        '[useCreateSubject] Error in subject creation process:',
        error
      )
      setCreationError(
        error instanceof Error ? error.message : 'Failed to create subject'
      )
    } finally {
      setIsCreating(false)
      console.log('[useCreateSubject] Creation process finished')
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
