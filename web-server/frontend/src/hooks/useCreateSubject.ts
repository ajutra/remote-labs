import { useState } from 'react'

interface ValidationResult {
  email: string
  valid: boolean
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

  const handleCreateSubject = () => {
    setError('') // Clear previous errors

    if (!subjectName) {
      setError('Subject name is required')
      return
    }
    if (!subjectCode) {
      setError('Subject code is required')
      return
    }

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
    })

    // Clear form fields
    setSubjectName('')
    setSubjectCode('')
    setProfessorEmails([])
    setEmailInput('')
    setStudentEmails('')
    setValidationResults([])

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
  }
}

export default useCreateSubject
