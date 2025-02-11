import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useDeleteUserForm = () => {
  const { t } = useTranslation()

  // Define the form schema for deleting a user
  const deleteUserFormSchema = z.object({
    userId: z.string().min(1, {
      message: t('User ID must be at least 1 character.'),
    }),
  })

  // Define the form
  const form = useForm<z.infer<typeof deleteUserFormSchema>>({
    resolver: zodResolver(deleteUserFormSchema),
    defaultValues: {
      userId: '',
    },
  })

  // Define the submit handler for deleting a user
  const onSubmit = async (values: z.infer<typeof deleteUserFormSchema>) => {
    const apiUrl = getEnv().API_BASE_URL
    const fullUrl = `${apiUrl}/users/${values.userId}`
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
      console.log('User deleted')
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useDeleteUserForm
