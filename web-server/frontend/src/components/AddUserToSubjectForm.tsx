import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Define the form schema for adding a user to a subject
const addUserToSubjectFormSchema = z.object({
  subjectId: z.string().min(1, {
    message: "Subject ID must be at least 1 character.",
  }),
  userId: z.string().min(1, {
    message: "User ID must be at least 1 character.",
  }),
})

const AddUserToSubjectForm = () => {
  // Define the form
  const form = useForm<z.infer<typeof addUserToSubjectFormSchema>>({
    resolver: zodResolver(addUserToSubjectFormSchema),
    defaultValues: {
      subjectId: "",
      userId: "",
    },
  })

  // Define the submit handler for adding a user to a subject
  async function onSubmit(values: z.infer<typeof addUserToSubjectFormSchema>) {
    try {
      const response = await fetch(`/subjects/${values.subjectId}/add/users/${values.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      console.log('User added to subject')
    } catch (error) {
      console.error('Error adding user to subject:', error)
    }
  }

  return (
    <div className="bg-card p-8 rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-card-foreground">Add User to Subject</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject ID</FormLabel>
                <FormControl>
                  <Input placeholder="Subject ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input placeholder="User ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Add User to Subject</Button>
        </form>
      </Form>
    </div>
  )
}

export default AddUserToSubjectForm;