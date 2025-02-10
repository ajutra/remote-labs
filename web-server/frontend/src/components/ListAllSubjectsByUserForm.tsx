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
import useListAllSubjectsByUserForm from '@/hooks/useListAllSubjectsByUserForm'

const ListAllSubjectsByUserForm = () => {
  const { form, onSubmit, t } = useListAllSubjectsByUserForm()

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
