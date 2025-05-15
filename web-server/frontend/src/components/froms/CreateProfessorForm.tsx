import { useState } from 'react'
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
import useCreateProfessorForm from '@/hooks/forms/useCreateProfessorFrom'

const CreateProfessorForm = () => {
  const { form, onSubmit, t } = useCreateProfessorForm()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<{ name: string; mail: string }>({
    name: '',
    mail: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Paso 1: Recoge datos y pasa al resumen
  const handleNext = (values: { name: string; mail: string }) => {
    setFormData(values)
    setStep(2)
  }

  // Paso 2: Vuelve atrás
  const handleBack = () => setStep(1)

  // Paso 2: Confirma y envía
  const handleConfirm = async () => {
    setIsSubmitting(true)
    await onSubmit(formData)
    setIsSubmitting(false)
    setSuccess(true)
  }

  return (
    <div className="w-full max-w-md rounded bg-card p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-card-foreground">
        {t('Create Proffesor')}
      </h1>
      {step === 1 && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleNext)}
            className="space-y-6"
            autoComplete="off"
          >
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
            <Button type="submit" className="w-full">
              {t('Next')}
            </Button>
          </form>
        </Form>
      )}
      {step === 2 && !success && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Confirm data</h2>
            <div className="mb-4 rounded bg-muted p-4">
              <div>
                <span className="font-medium">Name:</span> {formData.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {formData.mail}
              </div>
            </div>
            <p className="mb-2 text-gray-600">
              Is the email correct? A temporary password will be sent to this
              address.
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleBack} type="button">
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Confirm and create professor'}
            </Button>
          </div>
        </div>
      )}
      {success && (
        <div className="space-y-6 text-center">
          <h2 className="mb-2 text-lg font-semibold">
            Professor created successfully
          </h2>
          <p className="mb-2 text-gray-600">
            An email has been sent to the professor with their temporary
            password.
          </p>
          <Button
            onClick={() => {
              setStep(1)
              setSuccess(false)
              form.reset()
            }}
          >
            Create another professor
          </Button>
        </div>
      )}
    </div>
  )
}

export default CreateProfessorForm
