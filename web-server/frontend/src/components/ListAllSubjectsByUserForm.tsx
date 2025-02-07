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

// Define the form schema for listing all subjects by user
const listAllSubjectsByUserFormSchema = z.object({
  userId: z.string().min(1, {
    message: "User ID must be at least 1 character.",
  }),
})

const ListAllSubjectsByUserForm = () => {
  // Define the form
  const form = useForm<z.infer<typeof listAllSubjectsByUserFormSchema>>({
    resolver: zodResolver(listAllSubjectsByUserFormSchema),
    defaultValues: {
      userId: "",
    },
  })

  // Define the submit handler for listing all subjects by user
  async function onSubmit(values: z.infer<typeof listAllSubjectsByUserFormSchema>) {
    try {
      const response = await fetch(`/users/${values.userId}/subjects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      console.log('Subjects:', data)
    } catch (error) {
      console.error('Error listing subjects:', error)
    }
  }

  return (
    <div className="bg-card p-8 rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-card-foreground">List All Subjects by User</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          <Button type="submit">List Subjects</Button>
        </form>
      </Form>
    </div>
  )
}

export default ListAllSubjectsByUserForm;