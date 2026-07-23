create table if not exists ice_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  verified boolean default false
);

create table if not exists user_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  service text not null, -- 'turn' or 'twilio'
  account_sid text,
  auth_token text, 
  from_number text,
  api_token text,
  moya_enabled boolean default false
);

ALTER TABLE ice_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own data only" ON ice_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data only" ON user_credentials FOR ALL USING (auth.uid() = user_id);
