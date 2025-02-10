import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useAddUserToSubjectForm = () => {
  const { t } = useTranslation()

  // Define the form schema
  const addUserToSubjectFormSchema = z.object({
    subjectId: z
      .string()
      .nonempty(t('Subject ID must be at least 1 character')),
    userId: z.string().nonempty(t('User ID must be at least 1 character')),
  })

  // Define the form
  const form = useForm<z.infer<typeof addUserToSubjectFormSchema>>({
    resolver: zodResolver(addUserToSubjectFormSchema),
    defaultValues: {
      subjectId: '',
      userId: '',
    },
  })

  // Define the submit handler for adding a user to a subject
  const onSubmit = async (
    values: z.infer<typeof addUserToSubjectFormSchema>
  ) => {
    const apiUrl = getEnv().API_BASE_URL
    const fullUrl = `${apiUrl}/subjects/${values.subjectId}/add/users/${values.userId}`
    console.log('API URL:', fullUrl) // Log the API URL
    console.log('Submitting values:', values) // Log the values being submitted
    try {
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      console.log('User added to subject')
    } catch (error) {
      console.error('Error adding user to subject:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useAddUserToSubjectForm
