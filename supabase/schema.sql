-- Timely AI Wedding Planner: Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- WEDDINGS TABLE
create table weddings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  session_token text unique,
  wedding_date date not null,
  guest_count integer default 0,
  budget_range text,
  cultural_context text,
  events_selected jsonb,
  created_at timestamp with time zone default now()
);

-- TASKS TABLE
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references weddings(id) on delete cascade not null,
  name text not null,
  category text, -- Venue, Catering, Clothing, Invitations, Ceremonies, Logistics
  event_type text default 'All', -- Mehendi, Sangeet, Wedding, etc.
  deadline_date date not null,
  status text check (status in ('Todo', 'In-Progress', 'Done')) default 'Todo',
  priority integer check (priority between 1 and 5) default 3,
  notes text,
  assignee text,
  created_at timestamp with time zone default now()
);

-- TASK DEPENDENCIES TABLE
create table task_dependencies (
  task_id uuid references tasks(id) on delete cascade,
  depends_on_id uuid references tasks(id) on delete cascade,
  primary key (task_id, depends_on_id)
);

-- INDEXING
create index idx_tasks_wedding_deadline on tasks(wedding_id, deadline_date);
create index idx_tasks_status on tasks(status);
create index idx_tasks_event on tasks(event_type);

-- RLS (ROW LEVEL SECURITY)
alter table weddings enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;

-- POLICIES
-- Phase 1: Allow access based on session_token or user_id
create policy "Allow access to weddings for session or owner"
on weddings for all
using (
  (user_id = auth.uid()) or 
  (session_token = current_setting('app.current_session_token', true))
);

create policy "Allow access to tasks for wedding owner"
on tasks for all
using (
  wedding_id in (select id from weddings)
);

create policy "Allow access to dependencies for wedding owner"
on task_dependencies for all
using (
  task_id in (select id from tasks)
);
