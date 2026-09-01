-- Reset the live database to a clean production-style state.
-- Run this in Supabase SQL Editor after you are sure you want to remove
-- existing officers, farmers, farms, analysis history, queues, schedules,
-- surveys, and notifications.

begin;

truncate table
  farmer_submissions,
  farmer_notifications,
  priority_visits,
  booked_slots,
  scheduled_visits,
  surveys,
  validation_queue,
  farms,
  officers,
  farmer_registrations
restart identity cascade;

delete from users;

insert into users (id, password_hash, role, display_name, is_active)
values (
  'PCA-ADMIN-001',
  '$2b$12$dVJzsvx/Ular7h8mleU2su6XDlGayY1O9GRw0Rlh1fzKTgYEzxwma',
  'admin',
  'PCA Administrator',
  true
);

commit;
