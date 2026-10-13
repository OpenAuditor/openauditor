create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  billing_status text not null default 'trial',
  created_at timestamptz not null default now()
);

create table public.memberships (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  primary key (project_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  body text,
  done boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body_md text not null,
  created_at timestamptz not null default now()
);

alter table public.memberships enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;

create policy "members see their memberships" on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "tasks are readable" on public.tasks
  for select to authenticated
  using (true);

create policy "members write tasks" on public.tasks
  for insert to authenticated
  with check (
    project_id in (select project_id from public.memberships where user_id = (select auth.uid()))
  );

create policy "members read comments" on public.comments
  for select to authenticated
  using (
    task_id in (
      select t.id from public.tasks t
      join public.memberships m on m.project_id = t.project_id
      where m.user_id = (select auth.uid())
    )
  );

create policy "members add comments" on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and task_id in (
      select t.id from public.tasks t
      join public.memberships m on m.project_id = t.project_id
      where m.user_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
