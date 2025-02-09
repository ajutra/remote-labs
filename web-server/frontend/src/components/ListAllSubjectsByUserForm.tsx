import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const ListAllSubjectsByUserForm = () => {
  const { t } = useTranslation()

  // Define the form schema
  const listAllSubjectsByUserFormSchema = z.object({
    userId: z.string().nonempty(t('User ID must be at least 1 character')),
  })
  // Define the form
  const form = useForm<z.infer<typeof listAllSubjectsByUserFormSchema>>({
    resolver: zodResolver(listAllSubjectsByUserFormSchema),
    defaultValues: {
      userId: '',
    },
  })

  // Define the submit handler for listing all subjects by user
  async function onSubmit(
    values: z.infer<typeof listAllSubjectsByUserFormSchema>
  ) {
    try {
      const response = await fetch(`/users/${values.userId}/subjects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      console.log('Subjects:', data)
    } catch (error) {
      console.error('Error listing subjects:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('List all Subjects by User')}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('User ID')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('User ID')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t('List Subjects')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default ListAllSubjectsByUserForm
