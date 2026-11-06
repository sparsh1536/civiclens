-- Run in Supabase SQL Editor only after the intended administrator has signed up.
-- Replace the placeholder with that account's email address.
insert into public.user_roles (user_id, role)
select id, 'admin'::public.editorial_role
from auth.users
where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (user_id, role) do nothing;

-- Verify the assignment. Expected: one row with role = admin.
select u.email, r.role, r.granted_at
from public.user_roles r
join auth.users u on u.id = r.user_id
where lower(u.email) = lower('YOUR_ADMIN_EMAIL');
