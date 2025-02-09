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

const DeleteUserForm = () => {
  const { t } = useTranslation()

  // Define the form schema for deleting a user
  const deleteUserFormSchema = z.object({
    userId: z.string().min(1, {
      message: t('User ID must be at least 1 character.'),
    }),
  })
  // Define the form
  const form = useForm<z.infer<typeof deleteUserFormSchema>>({
    resolver: zodResolver(deleteUserFormSchema),
    defaultValues: {
      userId: '',
    },
  })

  // Define the submit handler for deleting a user
  async function onSubmit(values: z.infer<typeof deleteUserFormSchema>) {
    try {
      const response = await fetch(`/users/${values.userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      console.log('User deleted')
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Delete User')}
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
          <Button type="submit">{t('Delete User')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default DeleteUserForm
