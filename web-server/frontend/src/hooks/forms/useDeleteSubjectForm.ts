import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useDeleteSubjectForm = () => {
  const { t } = useTranslation()

  // Define the form schema for deleting a subject
  const deleteSubjectFormSchema = z.object({
    subjectId: z.string().min(1, {
      message: t('Subject ID must be at least 1 character.'),
    }),
  })

  // Define the form
  const form = useForm<z.infer<typeof deleteSubjectFormSchema>>({
    resolver: zodResolver(deleteSubjectFormSchema),
    defaultValues: {
      subjectId: '',
    },
  })

  // Define the submit handler for deleting a subject
  const onSubmit = async (values: z.infer<typeof deleteSubjectFormSchema>) => {
    const apiUrl = getEnv().API_BASE_URL
    const fullUrl = `${apiUrl}/subjects/${values.subjectId}`
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
      console.log('Subject deleted')
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useDeleteSubjectForm
