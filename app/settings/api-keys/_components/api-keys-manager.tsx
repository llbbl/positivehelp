"use client";

import { Check, Copy, Key, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Token {
	id: number;
	name: string;
	createdAt: string;
	lastUsedAt: string | null;
}

interface NewToken extends Token {
	value: string;
}

export function ApiKeysManager() {
	const [tokens, setTokens] = useState<Token[]>([]);
	const [newToken, setNewToken] = useState<NewToken | null>(null);
	const [tokenName, setTokenName] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [copied, setCopied] = useState(false);
	const { toast } = useToast();

	const fetchTokens = useCallback(async () => {
		try {
			const response = await fetch("/api/tokens");
			if (!response.ok) {
				throw new Error("Failed to fetch tokens");
			}
			const data = await response.json();
			setTokens(data.tokens);
		} catch {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load API keys. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		fetchTokens();
	}, [fetchTokens]);

	const createToken = async () => {
		if (!tokenName.trim()) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Please enter a name for your API key.",
			});
			return;
		}

		setIsCreating(true);
		try {
			const response = await fetch("/api/tokens", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: tokenName.trim() }),
			});

			if (!response.ok) {
				throw new Error("Failed to create token");
			}

			const data = await response.json();
			setNewToken(data.token);
			setTokenName("");
			await fetchTokens();

			toast({
				title: "Success",
				description: "API key created successfully. Copy it now - you won't be able to see it again!",
			});
		} catch {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to create API key. Please try again.",
			});
		} finally {
			setIsCreating(false);
		}
	};

	const deleteToken = async (id: number) => {
		setDeletingId(id);
		try {
			const response = await fetch(`/api/tokens/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete token");
			}

			await fetchTokens();

			toast({
				title: "Success",
				description: "API key revoked successfully.",
			});
		} catch {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to revoke API key. Please try again.",
			});
		} finally {
			setDeletingId(null);
		}
	};

	const copyToken = async () => {
		if (!newToken) return;

		try {
			await navigator.clipboard.writeText(newToken.value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);

			toast({
				title: "Copied",
				description: "API key copied to clipboard.",
			});
		} catch {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to copy to clipboard.",
			});
		}
	};

	const dismissNewToken = () => {
		setNewToken(null);
		setCopied(false);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="h-10 w-full animate-pulse rounded bg-gray-200" />
				<div className="h-24 w-full animate-pulse rounded bg-gray-200" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Create new token form */}
			<div className="rounded-lg border bg-white p-6 shadow-sm">
				<h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
					<Key className="h-5 w-5" />
					Generate New API Key
				</h2>
				<div className="flex gap-4">
					<Input
						type="text"
						placeholder="API key name (e.g., Desktop App)"
						value={tokenName}
						onChange={(e) => setTokenName(e.target.value)}
						className="flex-1"
						disabled={isCreating}
					/>
					<Button onClick={createToken} disabled={isCreating || !tokenName.trim()}>
						{isCreating ? (
							"Generating..."
						) : (
							<>
								<Plus className="h-4 w-4" />
								Generate
							</>
						)}
					</Button>
				</div>
			</div>

			{/* New token display (shown only once after creation) */}
			{newToken && (
				<div className="rounded-lg border-2 border-green-500 bg-green-50 p-6 shadow-sm">
					<h3 className="mb-2 font-semibold text-green-800">
						Your new API key has been created!
					</h3>
					<p className="mb-4 text-sm text-green-700">
						Copy this key now. You will not be able to see it again.
					</p>
					<div className="flex items-center gap-2">
						<code className="flex-1 overflow-x-auto rounded bg-white p-3 font-mono text-sm">
							{newToken.value}
						</code>
						<Button
							variant="outline"
							size="icon"
							onClick={copyToken}
							className="shrink-0"
						>
							{copied ? (
								<Check className="h-4 w-4 text-green-600" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
					</div>
					<Button
						variant="ghost"
						onClick={dismissNewToken}
						className="mt-4 text-green-700 hover:text-green-800"
					>
						I've copied the key
					</Button>
				</div>
			)}

			{/* Token list */}
			<div className="rounded-lg border bg-white p-6 shadow-sm">
				<h2 className="mb-4 text-lg font-semibold">Your API Keys</h2>
				{tokens.length === 0 ? (
					<p className="text-gray-500">
						You don't have any API keys yet. Generate one above to get started.
					</p>
				) : (
					<div className="space-y-4">
						{tokens.map((token) => (
							<div
								key={token.id}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<Key className="h-4 w-4 text-gray-400" />
										<span className="font-medium">{token.name}</span>
									</div>
									<div className="mt-1 text-sm text-gray-500">
										Created: {formatDate(token.createdAt)}
										{token.lastUsedAt && (
											<span className="ml-4">
												Last used: {formatDate(token.lastUsedAt)}
											</span>
										)}
									</div>
								</div>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => deleteToken(token.id)}
									disabled={deletingId === token.id}
								>
									{deletingId === token.id ? (
										"Revoking..."
									) : (
										<>
											<Trash2 className="h-4 w-4" />
											Revoke
										</>
									)}
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
