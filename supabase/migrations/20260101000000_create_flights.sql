-- supabase/migrations/20260101000000_create_flights.sql
create table if not exists public.flights (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references auth.users (id) on delete cascade,
    flown_at date not null,
    flight_number text,
    from_airport text not null check (char_length(from_airport) = 3),
    to_airport text not null check (char_length(to_airport) = 3),
    cabin text not null check (cabin in ('economy', 'first')),
    fare_type text,
    pp integer not null check (pp >= 0),
    aircraft text,
    seat text,
    lounge text,
    rating_seat smallint check (rating_seat between 1 and 5),
    rating_aircraft smallint check (rating_aircraft between 1 and 5),
    rating_lounge smallint check (rating_lounge between 1 and 5),
    notes text,
    created_at timestamptz not null default now ()
);

create index if not exists flights_user_flown_at_idx on public.flights (user_id, flown_at desc);

-- RLS
alter table public.flights enable row level security;

create policy "flights: owner can select" on public.flights for
select
    using (auth.uid () = user_id);

create policy "flights: owner can insert" on public.flights for insert
with
    check (auth.uid () = user_id);

create policy "flights: owner can update" on public.flights for
update using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

create policy "flights: owner can delete" on public.flights for delete using (auth.uid () = user_id);
