CREATE TABLE profiles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users not null unique, name text, phone text, fcm_token text, created_at timestamptz default now());
CREATE TABLE emergency_contacts (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users not null, name text not null, phone text not null, enable_push boolean default true, enable_sms boolean default true, enable_whatsapp boolean default false, created_at timestamptz default now());
CREATE TABLE sos_events (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users not null, lat double precision, lng double precision, created_at timestamptz default now());
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own data only" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data only" ON emergency_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own data only" ON sos_events FOR ALL USING (auth.uid() = user_id);
