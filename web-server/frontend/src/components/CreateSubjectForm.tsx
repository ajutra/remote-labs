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

const CreateSubjectForm = () => {
  const { t } = useTranslation()
  // Define the form schema for creating a subject
  const subjectFormSchema = z.object({
    name: z.string().min(2, {
      message: t('Name must be at least 2 characters.'),
    }),
    code: z.string().min(6, {
      message: t('Code must be at least 6 characters.'),
    }),
    professorMail: z.string().email({
      message: t('Invalid email address.'),
    }),
  })

  // Define the form
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: '',
      code: '',
      professorMail: '',
    },
  })

  // Define the submit handler for creating a subject
  async function onSubmit(values: z.infer<typeof subjectFormSchema>) {
    try {
      const response = await fetch('/subjects', {
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
      console.log('Subject created:', data)
    } catch (error) {
      console.error('Error creating subject:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Create Subject')}
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
                  <Input
                    placeholder={t('Programming Fundamentals')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('This is the name of the subject.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Code')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('103111')} {...field} />
                </FormControl>
                <FormDescription>
                  {t('This is the code of the subject.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="professorMail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Professor Email')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('professsor@tecnocampus.cat')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('This is the email of the professor.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t('Create Subject')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateSubjectForm
