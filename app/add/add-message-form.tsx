"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMessage } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function AddMessageForm() {
	const [isPending, setIsPending] = useState(false);
	const [formData, setFormData] = useState({ content: "", author: "" });
	const router = useRouter();
	const { toast } = useToast();
	const { userId } = useAuth();

	async function handleSubmit(formDataObj: FormData) {
		if (!userId) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "You must be logged in to add a message",
			});
			return;
		}

		const _content = formDataObj.get("content") as string;
		const _author = formDataObj.get("author") as string;

		// Optimistic UI update - show success message immediately
		toast({
			title: "Submitting...",
			description: "Your message is being submitted for review.",
		});

		setIsPending(true);
		formDataObj.append("userId", userId);

		try {
			const result = await createMessage(formDataObj);

			if (result.error) {
				toast({
					variant: "destructive",
					title: "Error",
					description: result.error,
				});
				return;
			}

			// Clear form on success
			setFormData({ content: "", author: "" });

			toast({
				title: "Success",
				description: "Your message has been submitted for review!",
			});
			router.push("/");
			router.refresh();
		} catch (_error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to submit message. Please try again.",
			});
		} finally {
			setIsPending(false);
		}
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
					className="min-h-[100px] bg-white/70"
					value={formData.content}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, content: e.target.value }))
					}
					disabled={isPending}
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
					className="bg-white/70"
					value={formData.author}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, author: e.target.value }))
					}
					disabled={isPending}
				/>
			</div>
			<Button type="submit" disabled={isPending}>
				{isPending ? "Adding..." : "Add Message"}
			</Button>
		</form>
	);
}
