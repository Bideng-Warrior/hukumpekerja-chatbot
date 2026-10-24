import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { chats } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '../../../../lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const authUserId = getUserIdFromRequest(request);
    if (!authUserId) {
      return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }

    const resolvedParams = await params;
    const chatId = resolvedParams.chatId;
    const body = await request.json();
    const { messages } = body;

    if (!messages) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const [existing] = await db.select({ userId: chats.userId })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    if (existing.userId !== authUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updatedChat] = await db.update(chats)
      .set({
        messages,
        updatedAt: new Date()
      })
      .where(eq(chats.id, chatId))
      .returning();

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
