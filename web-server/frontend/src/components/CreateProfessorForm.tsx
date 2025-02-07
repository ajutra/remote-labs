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

// Define the form schema for creating a professor
const professorFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  mail: z.string().email({
    message: "Invalid email address.",
  }),
})

const CreateProfessorForm = () => {
  // Define the form
  const form = useForm<z.infer<typeof professorFormSchema>>({
    resolver: zodResolver(professorFormSchema),
    defaultValues: {
      name: "",
      mail: "",
    },
  })

  // Define the submit handler for creating a professor
  async function onSubmit(values: z.infer<typeof professorFormSchema>) {
    try {
      const response = await fetch('/users/professors', {
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
      console.log('Professor created:', data)
    } catch (error) {
      console.error('Error creating professor:', error)
    }
  }

  return (
    <div className="bg-card p-8 rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-card-foreground">Create Professor</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormDescription>
                  This is the full name of the professor.
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="jane.doe@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  This is the email address of the professor.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Create Professor</Button>
        </form>
      </Form>
    </div>
  )
}

export default CreateProfessorForm;