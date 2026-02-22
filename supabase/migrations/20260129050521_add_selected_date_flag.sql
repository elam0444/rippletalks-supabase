-- Add selected date flag
alter table public.contact_available_dates
add column if not exists is_selected boolean not null default false;

-- Only one selected date per contact
create unique index if not exists
contact_available_dates_one_selected
on public.contact_available_dates (contact_id)
where is_selected = true;