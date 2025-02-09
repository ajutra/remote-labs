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
import '@/index.css'
import { useTranslation } from 'react-i18next'

const CreateUserForm = () => {
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
  async function onSubmit(values: z.infer<typeof userFormSchema>) {
    try {
      const response = await fetch('/users', {
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
      console.log('User created:', data)
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Create User')}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Name Surname')} {...field} />
                </FormControl>
                <FormDescription>
                  {t('This is your full name.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <Input type="password" placeholder={t('******')} {...field} />
                </FormControl>
                <FormDescription>{t('This is your password.')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t('Create User')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateUserForm
