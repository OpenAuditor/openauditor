'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function addTask(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const title = String(formData.get('title') ?? '').slice(0, 200);
  await supabase.from('tasks').insert({ project_id: projectId, title, created_by: user.id });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await supabaseAdmin.from('projects').delete().eq('id', projectId);
  redirect('/');
}
