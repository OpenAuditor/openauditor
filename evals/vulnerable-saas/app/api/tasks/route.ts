import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Query = z.object({ projectId: z.uuid() });

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid project' }, { status: 400 });

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('project_id', parsed.data.projectId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, done')
    .eq('project_id', parsed.data.projectId);

  return NextResponse.json(tasks ?? []);
}
