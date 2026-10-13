import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, owner_id, billing_status, created_at, tasks(id, title, body, done)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json(project);
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message, stack: e.stack, projectId: id }, { status: 500 });
  }
}
