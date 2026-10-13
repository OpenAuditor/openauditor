'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';

export function AdminStats() {
  const [counts, setCounts] = useState<{ projects: number; tasks: number } | null>(null);

  useEffect(() => {
    async function load() {
      const [{ count: projects }, { count: tasks }] = await Promise.all([
        supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }),
      ]);
      setCounts({ projects: projects ?? 0, tasks: tasks ?? 0 });
    }
    load();
  }, []);

  if (!counts) return <p>Loading...</p>;
  return <p>{counts.projects} projects, {counts.tasks} tasks</p>;
}
