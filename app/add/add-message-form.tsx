"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createMessage } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@clerk/nextjs"

export function AddMessageForm() {
  const [ isPending, setIsPending ] = useState( false )
  const router = useRouter()
  const { toast } = useToast()
  const { userId } = useAuth()

  async function handleSubmit( formData: FormData ) {
    if ( !userId ) {
      toast( {
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to add a message",
      } )
      return
    }

    setIsPending( true )
    formData.append( "userId", userId )
    const result = await createMessage( formData )
    setIsPending( false )

    if ( result.error ) {
      toast( {
        variant: "destructive",
        title: "Error",
        description: result.error,
      } )
      return
    }

    toast( {
      title: "Success",
      description: "Your message has been added!",
    } )
    router.push( "/" )
    router.refresh()
  }

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget));
      }} 
      className="space-y-4 max-w-2xl"
    >
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
      <div className="space-y-2">
        <label
          htmlFor="author"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Author or Attribution
        </label>
        <Input
          id="author"
          name="author"
          placeholder="Who said or wrote this? Leave blank for anonymous."
        />
      </div>
      <Button type="submit" disabled={ isPending }>
        { isPending ? "Adding..." : "Add Message" }
      </Button>
    </form>
  )
}

