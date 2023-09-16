/* Create accounts and feed table */

create table
  public.accounts (
    id uuid not null,
    created_at timestamp with time zone null,
    username text null,
    avatar text null,
    followers jsonb null,
    constraint accounts_pkey primary key (id),
    constraint accounts_username_key unique (username),
    constraint accounts_id_fkey foreign key (id) references users (id) on delete cascade,
    constraint username_length check ((char_length(username) >= 3))
  ) tablespace pg_default;

create table
  public.feed (
    id uuid not null default gen_random_uuid (),
    content text null,
    user_id uuid null,
    reactions jsonb null,
    created_at timestamp with time zone null default now(),
    constraint feed_pkey primary key (id),
    constraint feed_user_id_fkey foreign key (user_id) references accounts (id) on delete cascade
  ) tablespace pg_default;

/* Setup function and trigger */

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.accounts (id, username, avatar, created_at)
  values (new.id, new.raw_user_meta_data->>'username', encode(SHA256(new.email::bytea),'hex'), new.created_at);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();