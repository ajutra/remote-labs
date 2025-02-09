import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const ValidateUserForm = () => {
  const { t } = useTranslation()

  // Define the form schema
  const validateUserFormSchema = z.object({
    mail: z.string().email(t('Invalid email address.')),
    password: z.string().min(8, t('Password must be at least 6 characters.')),
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
  async function onSubmit(values: z.infer<typeof validateUserFormSchema>) {
    try {
      const response = await fetch('/users/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      console.log('User validated:', data)
    } catch (error) {
      console.error('Error validating user:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Validate User Credentials')}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="mail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Email')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('user@edu.tecnocampus.cat')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('This is your email address.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Password')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormDescription>{t('This is your password.')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t('Validate User Credentials')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default ValidateUserForm
