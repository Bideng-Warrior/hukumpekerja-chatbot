import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** POST /api/users — Register a new user */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json({ error: 'Nama dan password wajib diisi' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Check if username already exists
    const [existing] = await db.select()
      .from(users)
      .where(eq(users.name, name.trim()))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Nama pengguna sudah dipakai' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [newUser] = await db.insert(users).values({
      name: name.trim(),
      password: hashedPassword,
    }).returning({ id: users.id, name: users.name, createdAt: users.createdAt });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** GET /api/users?name=...&password=... — Login */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const password = searchParams.get('password');

    if (!name || !password) {
      return NextResponse.json({ error: 'Nama dan password wajib diisi' }, { status: 400 });
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.name, name.trim()))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    // Return user WITHOUT password hash
    return NextResponse.json({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
