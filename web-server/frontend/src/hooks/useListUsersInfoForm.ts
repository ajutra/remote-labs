import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useListUsersInfoForm = () => {
  const { t } = useTranslation()

  // Define the form schema for listing user info
  const listUsersInfoFormSchema = z.object({
    userId: z.string().nonempty(t('User ID must be at least 1 character')),
  })

  // Define the form
  const form = useForm<z.infer<typeof listUsersInfoFormSchema>>({
    resolver: zodResolver(listUsersInfoFormSchema),
    defaultValues: {
      userId: '',
    },
  })

  // Define the submit handler for listing user info
  const onSubmit = async (values: z.infer<typeof listUsersInfoFormSchema>) => {
    const apiUrl = getEnv().API_BASE_URL
    const fullUrl = `${apiUrl}/users/${values.userId}`
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
      console.log('User Info:', data)
    } catch (error) {
      console.error('Error listing user info:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useListUsersInfoForm
