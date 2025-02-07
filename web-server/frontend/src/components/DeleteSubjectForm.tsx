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

// Define the form schema for deleting a subject
const deleteSubjectFormSchema = z.object({
  subjectId: z.string().min(1, {
    message: "Subject ID must be at least 1 character.",
  }),
})

const DeleteSubjectForm = () => {
  // Define the form
  const form = useForm<z.infer<typeof deleteSubjectFormSchema>>({
    resolver: zodResolver(deleteSubjectFormSchema),
    defaultValues: {
      subjectId: "",
    },
  })

  // Define the submit handler for deleting a subject
  async function onSubmit(values: z.infer<typeof deleteSubjectFormSchema>) {
    try {
      const response = await fetch(`/subjects/${values.subjectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      console.log('Subject deleted')
    } catch (error) {
      console.error('Error deleting subject:', error)
    }
  }

  return (
    <div className="bg-card p-8 rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-card-foreground">Delete Subject</h1>
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
          <Button type="submit">Delete Subject</Button>
        </form>
      </Form>
    </div>
  )
}

export default DeleteSubjectForm;