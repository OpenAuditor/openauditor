import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminStats } from '@/components/admin-stats';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  return (
    <main>
      <h1>Admin</h1>
      <AdminStats />
    </main>
  );
}
