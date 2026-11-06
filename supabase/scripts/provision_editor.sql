-- Run only from the Supabase SQL Editor as a trusted project administrator.
-- Replace both placeholders. The target user must already have a CivicLens Auth account.
-- The granting account must already hold the admin role.
insert into public.user_roles (user_id, role, granted_by)
select target.id, 'editor'::public.editorial_role, admin.id
from auth.users target
join auth.users admin on lower(admin.email) = lower('ADMIN_EMAIL')
where lower(target.email) = lower('EDITOR_EMAIL')
  and exists (
    select 1 from public.user_roles r
    where r.user_id = admin.id and r.role = 'admin'
  )
on conflict (user_id, role) do nothing;
