// a class to save a message to the database, using the positiveMsg model

import { NextApiRequest, NextApiResponse } from "next";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { PositiveMsg, PrismaClient } from "@prisma/client"
import { Session } from "next-auth"


class SaveMessage {
  async handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const session: Session|null = await getServerAuthSession({ req, res });
    const prisma: PrismaClient = new PrismaClient();

    if (session) {
      const { msg, slug, hash } = req.body;
      const newMessage: PositiveMsg = await prisma.positiveMsg.create({
        data: {
          msg,
          slug,
          hash,
        },
      });
      res.status(200).json(newMessage);
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  }
}

export default new SaveMessage().handler;
