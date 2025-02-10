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
import useDeleteSubjectForm from '@/hooks/useDeleteSubjectForm'

const DeleteSubjectForm = () => {
  const { form, onSubmit, t } = useDeleteSubjectForm()

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
