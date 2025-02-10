import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useRemoveUserFromSubjectForm = () => {
  const { t } = useTranslation()

  // Define the form schema for removing a user from a subject
  const removeUserFromSubjectFormSchema = z.object({
    subjectId: z
      .string()
      .nonempty(t('Subject ID must be at least 1 character')),
    userId: z.string().nonempty(t('User ID must be at least 1 character')),
  })

  // Define the form
  const form = useForm<z.infer<typeof removeUserFromSubjectFormSchema>>({
    resolver: zodResolver(removeUserFromSubjectFormSchema),
    defaultValues: {
      subjectId: '',
      userId: '',
    },
  })

  // Define the submit handler for removing a user from a subject
  const onSubmit = async (
    values: z.infer<typeof removeUserFromSubjectFormSchema>
  ) => {
    const apiUrl = getEnv().API_BASE_URL
    const fullUrl = `${apiUrl}/subjects/${values.subjectId}/remove/users/${values.userId}`
    console.log('Full URL:', fullUrl) // Log the full URL
    console.log('Submitting values:', values) // Log the values being submitted
    try {
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      console.log('User removed from subject')
    } catch (error) {
      console.error('Error removing user from subject:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useRemoveUserFromSubjectForm
