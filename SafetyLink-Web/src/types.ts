export interface User {
  id: number;
  org_id: number;
  name: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  panic_status?: string;
}

export interface PanicAlert {
  id: number;
  user_id: number;
  name?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export interface EventLog {
  id: number;
  org_id: number;
  type: string;
  user_name: string | null;
  description: string;
  created_at: string;
}
