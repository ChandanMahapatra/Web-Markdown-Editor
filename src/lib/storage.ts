import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Settings {
  provider?: string;
  model?: string;
  apiKey?: string;
}

interface MyDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
  };
  settings: {
    key: string;
    value: Settings;
  };
}

let db: IDBPDatabase<MyDB> | null = null;

async function getDB(): Promise<IDBPDatabase<MyDB>> {
  if (db) return db;

  db = await openDB<MyDB>('markdown-editor', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return db;
}

export async function saveDocument(id: string, title: string, content: string): Promise<void> {
  const db = await getDB();
  const now = new Date();
  const doc: Document = {
    id,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
  await db.put('documents', doc);
}

export async function loadDocument(id: string): Promise<Document | null> {
  const db = await getDB();
  return (await db.get('documents', id)) || null;
}

export async function listDocuments(): Promise<Document[]> {
  const db = await getDB();
  return await db.getAll('documents');
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'user-settings');
}

export async function loadSettings(): Promise<Settings | null> {
  const db = await getDB();
  return (await db.get('settings', 'user-settings')) || null;
}
