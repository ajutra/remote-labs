import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useCreateProfessorForm = () => {
  const { t } = useTranslation()

  // Define the form schema for creating a professor
  const professorFormSchema = z.object({
    name: z.string().min(2, {
      message: t('Name must be at least 2 characters.'),
    }),
    mail: z.string().email({
      message: t('Invalid email address.'),
    }),
  })

  // Define the form
  const form = useForm<z.infer<typeof professorFormSchema>>({
    resolver: zodResolver(professorFormSchema),
    defaultValues: {
      name: '',
      mail: '',
    },
  })

  // Define the submit handler for creating a professor
  const onSubmit = async (values: z.infer<typeof professorFormSchema>) => {
    const apiUrl = getEnv().API_CREATE_PROFESSOR
    console.log('API URL:', apiUrl) // Log the API URL
    const jsonData = JSON.stringify(values)
    console.log('Submitting JSON:', jsonData) // Log the JSON data being submitted
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
      const data = await response.json()
      console.log('Professor created:', data)
    } catch (error) {
      console.error('Error creating professor:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useCreateProfessorForm
