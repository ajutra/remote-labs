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

const RemoveUserFromSubjectForm = () => {
  const { t } = useTranslation()

  // Define the form schema
  const removeUserFromSubjectFormSchema = z.object({
    subjectId: z
      .string()
      .nonempty(t('Subject ID must be at least 1 character')),
    userId: z.string().nonempty(t('User ID must be at least 1 character')),
  })
  // Define the form
  const form = useForm<z.infer<typeof removeUserFromSubjectFormSchema>>({
    resolver: zodResolver(removeUserFromSubjectFormSchema),
    defaultValues: {
      subjectId: '',
      userId: '',
    },
  })

  // Define the submit handler for removing a user from a subject
  async function onSubmit(
    values: z.infer<typeof removeUserFromSubjectFormSchema>
  ) {
    try {
      const response = await fetch(
        `/subjects/${values.subjectId}/remove/users/${values.userId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      console.log('User removed from subject')
    } catch (error) {
      console.error('Error removing user from subject:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Remove User from Subject')}
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
          <Button type="submit">{t('Remove User from Subject')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default RemoveUserFromSubjectForm
