import { z } from 'zod'

export const createPostSchema = z.object({
    msg: z.string().max(256, 'Max title length is 356'),
    slug: z.string().min(50, 'Min slug length is 50'),
    hash: z.string().min(64, 'Min hash length is 64'),
    createdAt: z.date(),
})

export type CreateMsgInput = z.TypeOf<typeof createPostSchema>

export const getSinglePostSchema = z.object({
    postId: z.string().uuid(),
});

const Message = z.object({
    msg: z.string(),
    slug: z.string(),
    hashedMessage: z.string(),
});

export type MessageData = z.infer<typeof Message>;