import { useState, useEffect } from 'react'

interface ValidationResult {
  email: string
  valid: boolean
}

interface Base {
  base_id: string
  description: string
}

const useCreateSubject = (onSuccess: () => void) => {
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
  const [useQcow2, setUseQcow2] = useState(false)
  const [qcow2File, setQcow2File] = useState<File | null>(null)
  const [templateDescription, setTemplateDescription] = useState('')

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await fetch('/api/bases')
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

    setError('') // Clear previous errors

    const emails = studentEmails
      .split('\n')
      .map((email) => email.trim())
      .filter((email) => email !== '')
    const results = emails.map((email) => ({
      email,
      valid: email.endsWith('@edu.tecnocampus.cat'),
    }))
    setValidationResults(results)

    const invalidEmails = results.filter((result) => !result.valid)
    if (invalidEmails.length > 0) {
      setError('Some student emails are invalid')
      return
    }

    // Aquí puedes agregar la lógica para crear la asignatura
    console.log('Creating subject with:', {
      subjectName,
      subjectCode,
      professorEmails,
      studentEmails: emails,
      vmConfig: {
        os: vmOs,
        ram: vmRam,
        cpu: vmCpu,
        storage: vmStorage,
        useQcow2,
        qcow2File,
      },
    })

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
    setUseQcow2(false)
    setQcow2File(null)
    setTemplateDescription('')

    // Call onSuccess callback
    onSuccess()
  }

  return {
    subjectName,
    setSubjectName,
    subjectCode,
    setSubjectCode,
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
    handleSubjectCodeChange,
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
    useQcow2,
    setUseQcow2,
    qcow2File,
    setQcow2File,
    templateDescription,
    setTemplateDescription,
    bases,
    isLoadingBases,
  }
}

export default useCreateSubject
