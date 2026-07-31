import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { chats } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const resolvedParams = await params;
    const chatId = resolvedParams.chatId;
    const body = await request.json();
    const { messages } = body;

    if (!messages) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const [updatedChat] = await db.update(chats)
      .set({ 
        messages,
        updatedAt: new Date()
      })
      .where(eq(chats.id, chatId))
      .returning();

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
