import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { users } from '../../../db/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    const [newUser] = await db.insert(users).values({
      name: name || null,
    }).returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
