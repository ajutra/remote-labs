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
import useCreateProfessorForm from '@/hooks/useCreateProfessorFrom'

const CreateProfessorForm = () => {
  const { form, onSubmit, t } = useCreateProfessorForm()

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Create Proffesor')}
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
                  {t('This is the name of the professor.')}
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
          <Button type="submit">{t('Create Proffesor')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateProfessorForm
