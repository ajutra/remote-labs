import { useState, useEffect } from 'react'
import { getEnv } from '../utils/Env'
import { useAuth } from '../context/AuthContext'

interface ValidationResult {
  email: string
  valid: boolean
}

interface Base {
  base_id: string
  description: string
}

interface CreateSubjectResponse {
  subject_id: string
}

interface EnrollmentError {
  email: string
  error: string
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

const useCreateSubject = (onSuccess: () => void) => {
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [professorEmails, setProfessorEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [studentEmails, setStudentEmails] = useState('')
  const [error, setError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([])
  const [bases, setBases] = useState<Base[]>([])
  const [isLoadingBases, setIsLoadingBases] = useState(true)

  // VM Configuration
  const [vmOs, setVmOs] = useState('')
  const [vmRam, setVmRam] = useState('2')
  const [vmCpu, setVmCpu] = useState('1')
  const [vmStorage, setVmStorage] = useState('20')
  const [customizeVm, setCustomizeVm] = useState(false)
  const [templateDescription, setTemplateDescription] = useState('')
  const [vmUsername, setVmUsername] = useState('')
  const [vmPassword, setVmPassword] = useState('')

  const [enrollmentErrors, setEnrollmentErrors] = useState<EnrollmentError[]>(
    []
  )

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await fetch(getEnv().API_BASES)
        if (!response.ok) {
          throw new Error('Failed to fetch bases')
        }
        const data = await response.json()
        setBases(data)
        if (data.length > 0) {
          setVmOs(data[0].base_id)
        }
      } catch (error) {
        console.error('Error fetching bases:', error)
        setBases([])
        setVmOs('')
      } finally {
        setIsLoadingBases(false)
      }
    }

    fetchBases()
  }, [])

  const handleAddEmail = () => {
    if (
      emailInput &&
      emailInput.endsWith('@tecnocampus.cat') &&
      !professorEmails.includes(emailInput)
    ) {
      setProfessorEmails([...professorEmails, emailInput])
      setEmailInput('')
      setError('')
    } else {
      setError('Email must be a valid @tecnocampus.cat address')
    }
  }

  const handleRemoveEmail = (email: string) => {
    setProfessorEmails(professorEmails.filter((e) => e !== email))
  }

  const handleSubjectCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value)) {
      setSubjectCode(value)
      setCodeError('')
    } else {
      setCodeError('Subject code must be numeric')
    }
  }

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

  const createTemplate = async (
    subjectId: string,
    sourceId: string
  ): Promise<void> => {
    const templateRequest: DefineTemplateRequest = {
      sourceInstanceId: sourceId,
      sizeMB: parseInt(vmStorage) * 1024,
      vcpuCount: parseInt(vmCpu),
      vramMB: parseInt(vmRam) * 1024,
      subjectId,
      description: templateDescription,
      isValidated: !customizeVm,
    }

    const response = await fetch(getEnv().API_CREATE_TEMPLATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateRequest),
    })

    if (!response.ok) {
      throw new Error('Failed to create template')
    }
  }

  const createProfessorVm = async (
    subjectId: string,
    username: string,
    password: string
  ): Promise<string> => {
    if (!user?.id || !user?.publicSshKeys) {
      throw new Error('User information is required')
    }

    const request: CreateInstanceFrontendRequest = {
      userId: user.id,
      subjectId,
      templateId: vmOs, // Usamos el base_id como templateId para crear la VM
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

  const handleCreateSubject = async () => {
    if (
      !subjectName ||
      !subjectCode ||
      !vmOs ||
      !vmRam ||
      !vmCpu ||
      !vmStorage ||
      !templateDescription
    ) {
      setError('All fields are required')
      return
    }

    setError('')
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

      // If user is a professor, add their email to professorEmails if not already present
      if (
        user?.role === 'professor' &&
        !professorEmails.includes(professorEmail)
      ) {
        setProfessorEmails([professorEmail, ...professorEmails])
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
          await createProfessorVm(subject_id, vmUsername, vmPassword)
        } else {
          // Create template directly from base
          await createTemplate(subject_id, vmOs)
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

      // Clear form fields
      setSubjectName('')
      setSubjectCode('')
      setProfessorEmails([])
      setEmailInput('')
      setStudentEmails('')
      setValidationResults([])
      setVmOs('')
      setVmRam('2')
      setVmCpu('1')
      setVmStorage('20')
      setCustomizeVm(false)
      setTemplateDescription('')
      setVmUsername('')
      setVmPassword('')

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
    subjectName,
    setSubjectName,
    subjectCode,
    handleSubjectCodeChange,
    professorEmails,
    emailInput,
    setEmailInput,
    studentEmails,
    setStudentEmails,
    error,
    codeError,
    validationResults,
    handleAddEmail,
    handleRemoveEmail,
    handleCreateSubject,
    // VM Configuration
    vmOs,
    setVmOs,
    vmRam,
    setVmRam,
    vmCpu,
    setVmCpu,
    vmStorage,
    setVmStorage,
    customizeVm,
    setCustomizeVm,
    templateDescription,
    setTemplateDescription,
    vmUsername,
    setVmUsername,
    vmPassword,
    setVmPassword,
    bases,
    isLoadingBases,
    isCreating,
    creationError,
    enrollmentErrors,
  }
}

export default useCreateSubject
