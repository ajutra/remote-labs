import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useCreateSubjectForm = () => {
  const { t } = useTranslation()

  // Define the form schema for creating a subject
  const subjectFormSchema = z.object({
    name: z.string().min(2, {
      message: t('Name must be at least 2 characters.'),
    }),
    code: z.string().min(1, {
      message: t('Code must be at least 1 character.'),
    }),
    professorMail: z.string().email({
      message: t('Invalid email address.'),
    }),
  })

  // Define the form
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: '',
      code: '',
      professorMail: '',
    },
  })

  // Define the submit handler for creating a subject
  const onSubmit = async (values: z.infer<typeof subjectFormSchema>) => {
    const apiUrl = getEnv().API_CREATE_SUBJECT
    const jsonData = JSON.stringify(values)
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonData,
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
    } catch (error) {
      console.error('Error creating subject:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useCreateSubjectForm
