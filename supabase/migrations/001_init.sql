CREATE TABLE profiles (id uuid primary key, user_id uuid references auth.users, name text, phone text, fcm_token text);
CREATE TABLE emergency_contacts (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, name text, phone text, enable_push bool default true, enable_sms bool default true, enable_whatsapp bool default false);
CREATE TABLE sos_events (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, lat double precision, lng double precision, created_at timestamptz default now());
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own data" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own data" ON emergency_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own data" ON sos_events FOR ALL USING (auth.uid() = user_id);
