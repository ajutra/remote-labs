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

const ListAllUsersOfSubjectForm = () => {
  const { t } = useTranslation()

  // Define the form schema
  const listAllUsersOfSubjectFormSchema = z.object({
    subjectId: z
      .string()
      .nonempty(t('Subject ID must be at least 1 character')),
  })
  // Define the form
  const form = useForm<z.infer<typeof listAllUsersOfSubjectFormSchema>>({
    resolver: zodResolver(listAllUsersOfSubjectFormSchema),
    defaultValues: {
      subjectId: '',
    },
  })

  // Define the submit handler for listing all users of a given subject
  async function onSubmit(
    values: z.infer<typeof listAllUsersOfSubjectFormSchema>
  ) {
    try {
      const response = await fetch(`/subjects/${values.subjectId}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      console.log('Users:', data)
    } catch (error) {
      console.error('Error listing users:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('List all users of a subject')}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Subject ID')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('Subject ID')} {...field} />
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

export default ListAllUsersOfSubjectForm
