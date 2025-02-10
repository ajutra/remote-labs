import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useListAllUsersOfSubjectForm = () => {
  const { t } = useTranslation()

  // Define the form schema for listing all users of a subject
  const listAllUsersOfSubjectFormSchema = z.object({
    subjectId: z
      .string()
      .nonempty(t('Subject ID must be at least 1 character')),
  })

  // Define the form
  const form = useForm<z.infer<typeof listAllUsersOfSubjectFormSchema>>({
    resolver: zodResolver(listAllUsersOfSubjectFormSchema),
    defaultValues: {
      subjectId: '',
    },
  })

  // Define the submit handler for listing all users of a subject
  const onSubmit = async (
    values: z.infer<typeof listAllUsersOfSubjectFormSchema>
  ) => {
    const apiUrl = getEnv().API_BASE_URL
    const fullUrl = `${apiUrl}/subjects/${values.subjectId}/users`
    console.log('Full URL:', fullUrl) // Log the full URL
    console.log('Submitting values:', values) // Log the values being submitted
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      console.log('Users:', data)
    } catch (error) {
      console.error('Error listing users:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useListAllUsersOfSubjectForm
