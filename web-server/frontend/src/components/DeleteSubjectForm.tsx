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

const DeleteSubjectForm = () => {
  const { t } = useTranslation()
  // Define the form schema for deleting a subject
  const deleteSubjectFormSchema = z.object({
    subjectId: z.string().min(1, {
      message: t('Subject ID must be at least 1 character.'),
    }),
  })

  // Define the form
  const form = useForm<z.infer<typeof deleteSubjectFormSchema>>({
    resolver: zodResolver(deleteSubjectFormSchema),
    defaultValues: {
      subjectId: '',
    },
  })

  // Define the submit handler for deleting a subject
  async function onSubmit(values: z.infer<typeof deleteSubjectFormSchema>) {
    try {
      const response = await fetch(`/subjects/${values.subjectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      console.log('Subject deleted')
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Delete Subject')}
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
          <Button type="submit">{t('Delete Subject')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default DeleteSubjectForm
