import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <Link href="/login">Sign in</Link>;

  const { data: projects } = await supabase
    .from('memberships')
    .select('project_id, projects(name)')
    .eq('user_id', user.id);

  return (
    <main>
      <h1>Your projects</h1>
      <ul>
        {projects?.map((p) => (
          <li key={p.project_id}>
            <Link href={`/projects/${p.project_id}`}>Open</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
