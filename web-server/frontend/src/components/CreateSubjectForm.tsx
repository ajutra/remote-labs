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
import useCreateSubjectForm from '@/hooks/useCreateSubjectForm'

const CreateSubjectForm = () => {
  const { form, onSubmit, t } = useCreateSubjectForm()

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
