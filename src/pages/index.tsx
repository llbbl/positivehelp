import type { NextPage } from "next";
import Head from "next/head";
// import { trpc } from "../utils/trpc";
import React from 'react';
import slug from 'slugify';
import { PrismaClient } from '@prisma/client';
import { MessageData } from "../schema/msg.schema"

import { createHash} from "crypto"

const Home: NextPage = () => {

  const [message, setMessage] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Add code to store the message in the database here

    const prisma = new PrismaClient();

    const hash = createHash('sha1');

    try {
      let slugifiedMessage = slug(message);
      let hashed = hash.update(message);

      //convert hashed to string
      let hashedMessage = hashed.digest('hex');

      const data: MessageData = {
        msg: message,
        slug: slugifiedMessage,
        hashedMessage: hashedMessage,
      };

      // await prisma.positiveMsg.create({
      //   // data: data,
      // });

      console.log('Message stored successfully');
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
