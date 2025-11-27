begin;

create or replace function public.admin_override_verify(
  _submission_id uuid,
  _verified boolean,
  _notes text,
  _tolerance integer default null,
  _extracted_km numeric(7,3) default null,
  _extracted_calories integer default null
) returns public.submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  target_record public.submissions%rowtype;
  target_league uuid;
  caller_role text;
begin
  if caller is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select s.*, s.league_id into target_record
  from public.submissions s
  where s.id = _submission_id;

  if not found then
    raise exception 'Submission % not found', _submission_id using errcode = 'P0002';
  end if;

  target_league := target_record.league_id;

  select m.role into caller_role
  from public.memberships m
  where m.league_id = target_league and m.user_id = caller;

  if caller_role is null or caller_role not in ('owner', 'admin') then
    raise exception 'Only owners or admins may override verification for this league' using errcode = '42501';
  end if;

  update public.submissions
  set
    verified = _verified,
    tolerance_used = coalesce(_tolerance, tolerance_used),
    extracted_km = coalesce(_extracted_km, extracted_km),
    extracted_calories = coalesce(_extracted_calories, extracted_calories),
    verification_notes = coalesce(_notes, verification_notes)
  where id = _submission_id
  returning * into target_record;

  insert into public.audit_log (actor_id, action, target_id, details)
  values (
    caller,
    'verification.override',
    _submission_id,
    jsonb_build_object(
      'verified', _verified,
      'tolerance_used', _tolerance,
      'extracted_km', _extracted_km,
      'extracted_calories', _extracted_calories,
      'notes', _notes
    )
  );

  return target_record;
end;
$$;

commit;