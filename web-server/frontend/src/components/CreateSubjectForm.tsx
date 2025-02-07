import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Define the form schema for creating a subject
const subjectFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  code: z.string().min(1, {
    message: "Code must be at least 1 character.",
  }),
  professorMail: z.string().email({
    message: "Invalid email address.",
  }),
})

const CreateSubjectForm = () => {
  // Define the form
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: "",
      code: "",
      professorMail: "",
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
    <div className="bg-card p-8 rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-card-foreground">Create Subject</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Mathematics" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name of the subject.
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
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="MATH101" {...field} />
                </FormControl>
                <FormDescription>
                  This is the code of the subject.
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
                <FormLabel>Professor's Email</FormLabel>
                <FormControl>
                  <Input placeholder="professor@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  This is the email of the main professor.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Create Subject</Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateSubjectForm;