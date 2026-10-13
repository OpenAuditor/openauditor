import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CommentList } from '@/components/comment-list';
import { TaskSummary } from '@/components/task-summary';
import { addTask, deleteProject } from './actions';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tasks } = await supabase.from('tasks').select('id, title, done').eq('project_id', id);
  if (!tasks) notFound();

  const { data: comments } = await supabase
    .from('comments')
    .select('id, body_md, created_at, tasks!inner(project_id)')
    .eq('tasks.project_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main>
      <h1>Project</h1>
      <form action={addTask.bind(null, id)}>
        <input name="title" required maxLength={200} />
        <button>Add task</button>
      </form>
      <ul>{tasks.map((t) => <li key={t.id}>{t.done ? '✓ ' : ''}{t.title}</li>)}</ul>
      <TaskSummary projectId={id} />
      <CommentList comments={comments ?? []} />
      <form action={deleteProject.bind(null, id)}>
        <button>Delete project</button>
      </form>
    </main>
  );
}
