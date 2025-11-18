export default function NotFound() {
	return (
		<div className="min-h-screen bg-custom-blue">
			<main className="container mx-auto p-6 flex items-center justify-center min-h-screen">
				<div className="bg-white rounded-lg p-8 shadow-sm text-center max-w-md">
					<h1 className="text-2xl font-bold text-gray-800 mb-4">
						Message Not Found
					</h1>
					<p className="text-gray-600 mb-6">
						The message you're looking for doesn't exist or may have been
						removed.
					</p>
					<a
						href="/"
						className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
					>
						Back to Messages
					</a>
				</div>
			</main>
		</div>
	);
}
