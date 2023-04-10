import type { NextPage } from "next";
import Head from "next/head";
import React from 'react';
import slug from 'slugify';
import { MessageData } from "../schema/msg.schema"
import { createHash, Hash } from "crypto"
import { getCsrfToken, useSession } from "next-auth/react"


const Home: NextPage = () => {

  const [message, setMessage] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Add code to store the message in the database here

    const hash: Hash = createHash('sha256');
    const result = useSession();
    const session = result.data;
    const csrfToken = await getCsrfToken()

    try {
      let slugifiedMessage: string = slug(message);
      let hashed: Hash = hash.update(message);

      //convert hashed to string
      let hashedMessage: string = hashed.digest('hex');

      const data: MessageData = {
        msg: message,
        slug: slugifiedMessage,
        hashedMessage: hashedMessage,
      };


      // pass message to api SaveMessage
      const response: Response = await fetch('/api/SaveMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${csrfToken}`,
        },
        body: JSON.stringify(data),
      });

      console.log(response);

    } catch (err) {
      console.error(err);
    } finally {
      // await prisma.disconnect();
    }
  };

  return (
    <>
      <Head>
        <title>Submit Message</title>
        <meta name="description" content="submit a message" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <form onSubmit={handleSubmit}>
          <label>
            Message:
            <input type="text" value={message} onChange={event => setMessage(event.target.value)} />
          </label>
          <button type="submit">Submit</button>
        </form>
      </main>
    </>
  );
};


export default Home;
