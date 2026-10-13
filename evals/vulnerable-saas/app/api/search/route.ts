import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const q = new URL(req.url).searchParams.get('q') ?? '';

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, project_id')
    .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
  return NextResponse.json(data, { headers: corsHeaders });
}
