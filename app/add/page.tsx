import { currentUser } from "@clerk/nextjs/server"; 
import { AddMessageForm } from "./add-message-form";

export default async function AddPage() {
  const user = await currentUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Please Log In</h2>
          <p className="text-gray-600">
            Currently, only a limited number of people are allowed to add new messages. 
            Please log in to check if you have access. Thank you for your understanding.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = await checkIfUserIsAdmin(user);
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Limited Access</h2>
          <p className="text-gray-600">
            Currently, only a limited number of people are allowed to add new messages. 
            Thank you for your understanding.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New Message</h1>
        <AddMessageForm />
      </div>
    </div>
  );
}

async function checkIfUserIsAdmin(user: any) {
  try {
    const metadata = user.publicMetadata;
    return metadata?.isAdmin === "true" || metadata?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

