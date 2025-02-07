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

// Define the form schema for deleting a user
const deleteUserFormSchema = z.object({
  userId: z.string().min(1, {
    message: "User ID must be at least 1 character.",
  }),
})

const DeleteUserForm = () => {
  // Define the form
  const form = useForm<z.infer<typeof deleteUserFormSchema>>({
    resolver: zodResolver(deleteUserFormSchema),
    defaultValues: {
      userId: "",
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
    <div className="bg-card p-8 rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-card-foreground">Delete User</h1>
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
          <Button type="submit">Delete User</Button>
        </form>
      </Form>
    </div>
  )
}

export default DeleteUserForm;