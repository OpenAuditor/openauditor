import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { projectId, message } = await req.json();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, body, done')
    .eq('project_id', projectId);

  const { data: comments } = await supabase
    .from('comments')
    .select('body_md, tasks!inner(project_id)')
    .eq('tasks.project_id', projectId);

  const context = [
    ...(tasks ?? []).map((t) => `Task: ${t.title}\n${t.body ?? ''}`),
    ...(comments ?? []).map((c) => `Comment: ${c.body_md}`),
  ].join('\n\n');

  const { text } = await generateText({
    model: openai('gpt-4.1-mini'),
    system: 'You are Tasklane\'s project assistant. Answer using the project context. Format answers in Markdown.',
    prompt: `${context}\n\nUser request: ${message}`,
  });

  return NextResponse.json({ text });
}
