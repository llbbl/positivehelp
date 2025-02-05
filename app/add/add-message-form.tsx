"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createMessage } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export function AddMessageForm() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    const result = await createMessage(formData)
    setIsPending(false)

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
      return
    }

    toast({
      title: "Success",
      description: "Your message has been added!",
    })
    router.push("/")
    router.refresh()
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <label
          htmlFor="content"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Your Message
        </label>
        <Textarea
          id="content"
          name="content"
          placeholder="Share something positive..."
          className="min-h-[100px]"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add Message"}
      </Button>
    </form>
  )
}

