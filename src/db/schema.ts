import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { ChatMessage } from '../domain/types';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chats = pgTable('chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  messages: jsonb('messages').$type<ChatMessage[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
