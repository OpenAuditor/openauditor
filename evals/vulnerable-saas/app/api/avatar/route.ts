import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const path = `${user.id}/${file.name}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
