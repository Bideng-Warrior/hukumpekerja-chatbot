import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { chats } from '../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { getUserIdFromRequest } from '../../../lib/auth';

export async function GET(request: Request) {
  try {
    // User identity comes from the signed session token, never from the query string
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Login diperlukan untuk melihat riwayat chat' }, { status: 401 });
    }

    const userChats = await db.select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));

    return NextResponse.json(userChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, messages } = body;

    if (!title || !messages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authUserId = getUserIdFromRequest(request);
    if (body.userId && !authUserId) {
      return NextResponse.json({ error: 'Login diperlukan untuk menyimpan chat' }, { status: 401 });
    }

    const [newChat] = await db.insert(chats).values({
      userId: authUserId,
      title,
      messages,
    }).returning();

    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
