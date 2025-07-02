import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/utils/Env'

const useValidateUserForm = () => {
  const { t } = useTranslation()

  // Define the form schema for validating user credentials
  const validateUserFormSchema = z.object({
    mail: z.string().email(t('Invalid email address.')),
    password: z.string().min(6, t('Password must be at least 6 characters.')),
  })

  // Define the form
  const form = useForm<z.infer<typeof validateUserFormSchema>>({
    resolver: zodResolver(validateUserFormSchema),
    defaultValues: {
      mail: '',
      password: '',
    },
  })

  // Define the submit handler for validating user credentials
  const onSubmit = async (values: z.infer<typeof validateUserFormSchema>) => {
    const apiUrl = getEnv().API_VALIDATE_USER
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
      console.error('Error validating user:', error)
    }
  }

  return {
    form,
    onSubmit,
    t,
  }
}

export default useValidateUserForm
