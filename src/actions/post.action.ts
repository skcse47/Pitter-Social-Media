"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID!,
  },
});

export async function CreateNewPost(content: string, image: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false };

        const post = await prisma.post.create({
            data: {
                content,
                image,
                authorId: userId,
            },
        });
        revalidatePath("/");
        return { success: true, post };
    } catch (error) {
        return { success: false, error: "Failed to create Post"};
    }
}
export async function getPosts() {
    try {
      const posts = await prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });
  
      return posts;
    } catch (error) {
      console.log("Error in getPosts", error);
      throw new Error("Failed to fetch posts");
    }
}
export async function toggleLike(postId: string) {
    try {
      const userId = await getDbUserId();
      if (!userId) return;
  
      // check if like exists
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
  
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
  
      if (!post) throw new Error("Post not found");
  
      if (existingLike) {
        // unlike
        await prisma.like.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
      } else {
        // like and create notification (only if liking someone else's post)
        await prisma.$transaction([
          prisma.like.create({
            data: {
              userId,
              postId,
            },
          }),
          ...(post.authorId !== userId
            ? [
                prisma.notification.create({
                  data: {
                    type: "LIKE",
                    userId: post.authorId, // recipient (post author)
                    creatorId: userId, // person who liked
                    postId,
                  },
                }),
              ]
            : []),
        ]);
      }
  
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("Failed to toggle like:", error);
      return { success: false, error: "Failed to toggle like" };
    }
}
export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;
    if (!content) throw new Error("Content is required");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    // Create comment and notification in a transaction
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create comment first
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      // Create notification if commenting on someone else's post
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}
export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true , image: true},
    });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId) throw new Error("Unauthorized - no delete permission");

    if (post.image) {
      const imageUrl = new URL(post.image);
      const s3Key = `Posts/${imageUrl.pathname.split("/").pop()}`;

      // Step 2: Delete the image from AWS S3
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: s3Key, 
      }));
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/"); // purge the cache
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}