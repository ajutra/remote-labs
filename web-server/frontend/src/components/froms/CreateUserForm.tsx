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
import '@/index.css'
import useCreateUserForm from '@/hooks/forms/useCreateUserForm'

const CreateUserForm = () => {
  const { form, onSubmit, t } = useCreateUserForm()

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Create User')}
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
                  {t('This is your full name.')}
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
                    placeholder={t('user@edu.tecnocampus.cat')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('This is your email address.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Password')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t('******')} {...field} />
                </FormControl>
                <FormDescription>{t('This is your password.')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t('Create User')}</Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateUserForm
