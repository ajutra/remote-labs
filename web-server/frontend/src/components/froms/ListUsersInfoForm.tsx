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
import useListUsersInfoForm from '@/hooks/forms/useListUsersInfoForm'

const ListUsersInfoForm = () => {
  const { form, onSubmit, t } = useListUsersInfoForm()

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('List Users Info')}
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
          <Button type="submit">{t('List Users Info')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default ListUsersInfoForm
