import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useCreateUserForm = () => {
  const { t } = useTranslation()

  // Define the form schema for creating a user
  const userFormSchema = z.object({
    name: z.string().min(2, {
      message: t('Name must be at least 2 characters.'),
    }),
    mail: z.string().email({
      message: t('Invalid email address.'),
    }),
    password: z.string().min(6, {
      message: t('Password must be at least 6 characters.'),
    }),
  })

  // Define the form
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      mail: '',
      password: '',
    },
  })

  // Define the submit handler for creating a user
  const onSubmit = async (values: z.infer<typeof userFormSchema>) => {
    const apiUrl = getEnv().API_CREATE_USER
    const jsonData = JSON.stringify(values)
    try {
      const response = await fetch(`${apiUrl}`, {
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
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useCreateUserForm
