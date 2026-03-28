import { createClient } from '@supabase/supabase-js';
import type { InsuranceCase, Customer, Vehicle, InsuranceDetail, CaseEvent } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ── Cases ──────────────────────────────────────────────────────────────────

export async function fetchCases(): Promise<InsuranceCase[]> {
  const { data, error } = await supabase
    .from('insurance_cases')
    .select(`
      *,
      customer:customers(*),
      vehicle:vehicles(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as InsuranceCase[]) ?? [];
}

export async function fetchTodayCases(): Promise<InsuranceCase[]> {
  // Compute today's midnight in JST (UTC+9) to avoid timezone-dependent filtering
  const now = new Date();
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffsetMs);
  jstNow.setUTCHours(0, 0, 0, 0);
  const todayJSTinUTC = new Date(jstNow.getTime() - jstOffsetMs);
  const { data, error } = await supabase
    .from('insurance_cases')
    .select(`*, customer:customers(*), vehicle:vehicles(*)`)
    .gte('created_at', todayJSTinUTC.toISOString())
    .in('tow_status', ['tow', 'arrival', 'repair'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as InsuranceCase[]) ?? [];
}

export async function fetchCaseById(id: string): Promise<InsuranceCase | null> {
  const { data, error } = await supabase
    .from('insurance_cases')
    .select(`
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      insurance_details(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as InsuranceCase;
}

export async function updateTowStatus(
  caseId: string,
  status: InsuranceCase['tow_status']
): Promise<void> {
  const { error } = await supabase
    .from('insurance_cases')
    .update({ tow_status: status, updated_at: new Date().toISOString() })
    .eq('id', caseId);
  if (error) throw error;
}

export async function insertCase(
  data: Omit<InsuranceCase, 'id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle' | 'insurance_details'>
): Promise<InsuranceCase> {
  const { data: result, error } = await supabase
    .from('insurance_cases')
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return result as InsuranceCase;
}

export async function insertInsuranceDetail(
  data: Omit<InsuranceDetail, 'id' | 'created_at'>
): Promise<InsuranceDetail> {
  const { data: result, error } = await supabase
    .from('insurance_details')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as InsuranceDetail;
}

export async function updateCasePhotos(caseId: string, photos: string[]): Promise<void> {
  const { error } = await supabase
    .from('insurance_cases')
    .update({ photos, updated_at: new Date().toISOString() })
    .eq('id', caseId);
  if (error) throw error;
}

export async function updateCaseSignature(caseId: string, signatureUrl: string): Promise<void> {
  const { error } = await supabase
    .from('insurance_cases')
    .update({ signature_url: signatureUrl, updated_at: new Date().toISOString() })
    .eq('id', caseId);
  if (error) throw error;
}

export async function updateCaseTripData(
  caseId: string,
  distanceKm: number,
): Promise<void> {
  const { error } = await supabase
    .from('insurance_cases')
    .update({
      distance_km: distanceKm,
      tow_status: 'repair',
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId);
  if (error) throw error;
}

export async function updateCaseFare(
  caseId: string,
  distanceKm: number,
  fareAmount: number
): Promise<void> {
  const { error } = await supabase
    .from('insurance_cases')
    .update({ distance_km: distanceKm, fare_amount: fareAmount, updated_at: new Date().toISOString() })
    .eq('id', caseId);
  if (error) throw error;
}

// ── Events ────────────────────────────────────────────────────────────────

export async function fetchCaseEvents(caseId: string): Promise<CaseEvent[]> {
  const { data, error } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as CaseEvent[]) ?? [];
}

export async function insertCaseEvent(
  data: Omit<CaseEvent, 'id' | 'created_at'>
): Promise<CaseEvent> {
  const { data: result, error } = await supabase
    .from('case_events')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as CaseEvent;
}

// ── Customers ─────────────────────────────────────────────────────────────

export async function searchCustomers(query: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data as Customer[]) ?? [];
}

export async function fetchAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data as Customer[]) ?? [];
}

export async function insertCustomer(
  data: Pick<Customer, 'name'> & Partial<Pick<Customer, 'phone' | 'email' | 'address'>>
): Promise<Customer> {
  const { data: result, error } = await supabase
    .from('customers')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Customer;
}

// ── Vehicles ──────────────────────────────────────────────────────────────

export async function fetchVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', customerId);
  if (error) throw error;
  return (data as Vehicle[]) ?? [];
}

export async function insertVehicle(
  data: Pick<Vehicle, 'customer_id' | 'plate'> & Partial<Pick<Vehicle, 'make' | 'model' | 'year' | 'vin'>>
): Promise<Vehicle> {
  const { data: result, error } = await supabase
    .from('vehicles')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Vehicle;
}

// ── Storage ───────────────────────────────────────────────────────────────

export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ── Voice AI: execute_sql tool ────────────────────────────────────────────

const ALLOWED_PATTERN = /^\s*SELECT\b/i;
const FORBIDDEN_PATTERN = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i;

export async function executeSqlSafe(query: string): Promise<unknown> {
  if (!ALLOWED_PATTERN.test(query)) {
    throw new Error('SELECTクエリのみ実行可能です');
  }
  if (FORBIDDEN_PATTERN.test(query)) {
    throw new Error('データ変更系クエリは禁止されています');
  }

  // Use Supabase RPC if available, otherwise reject
  const { data, error } = await (supabase as ReturnType<typeof createClient>)
    .rpc('execute_sql', { query });
  if (error) throw error;
  return data;
}
