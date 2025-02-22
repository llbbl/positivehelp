import { currentUser } from "@clerk/nextjs/server";
import { AddMessageForm } from "./add-message-form";
import { isUserAdmin } from '@/lib/auth';

export default async function AddPage() {
  const user = await currentUser();

  if ( !user ) {
    return (
      <div className="min-h-screen bg-custom-cream">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Please Log In</h2>
            <p className="text-gray-600">
              You must be logged in to add a new message.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = await isUserAdmin( user );

  if ( !isAdmin ) {
    return (
      <div className="min-h-screen bg-custom-cream">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto rounded-lg mb-7">
            <h2 className="text-xl font-semibold mb-4">Public Submission Policy</h2>
            <p className="text-gray-600">
              Your message will be reviewed by the admin team before it is published.
              <br/> Thank you for your understanding.
            </p>
          </div>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Add New Message</h1>
          <AddMessageForm/>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-cream">
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Add New Message</h1>
          <AddMessageForm/>
        </div>
      </div>
    </div>
  );
}

