export type TowStatus =
  | 'tow'
  | 'arrival'
  | 'repair'
  | 'claim'
  | 'paid';

export type AccidentStatus =
  | 'reception'
  | 'arrival'
  | 'adjuster'
  | 'repairing'
  | 'agreement'
  | 'paid';

export type CaseStatus =
  | 'inquiry'
  | 'estimate'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type CaseType = 'tow' | 'accident';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  phone_digits: string | null;
  notes: string | null;
  postal_code: string | null;
  address_line1: string | null;
  address_line2: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  created_at: string;
}

/** insurance_cases テーブル（実DB スキーマ準拠） */
export interface InsuranceCase {
  id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  status: CaseStatus;
  title: string;
  note: string | null;
  notes: string | null;
  assigned_to: string | null;
  tow_status: TowStatus;
  tow_origin_address: string | null;
  tow_destination_address: string | null;
  distance_km: number | null;
  fare_amount: number | null;
  photos: string[] | null;
  signature_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  // joined
  customer?: Customer;
  vehicle?: Vehicle;
  insurance_details?: InsuranceDetail[];
}

/** insurance_details テーブル（実DB スキーマ準拠） */
export interface InsuranceDetail {
  id: string;
  case_id: string;
  case_type: CaseType;
  // 保険会社共通
  insurance_company: string | null;
  insurance_contact: string | null;
  insurance_phone: string | null;
  insurance_fax: string | null;
  notes: string | null;
  payment_received: boolean | null;
  rental_car_needed: boolean | null;
  rental_car_model: string | null;
  rental_car_daily_rate: number | null;
  rental_claimed: boolean | null;
  // 故障レッカー専用
  tow_status: TowStatus | null;
  tow_origin_address: string | null;
  tow_waypoint_address: string | null;
  tow_destination_address: string | null;
  breakdown_cause: string | null;
  tow_claimed: boolean | null;
  tow_route_cache: unknown | null;
  // 事故修理専用
  accident_status: AccidentStatus | null;
  accident_tow_needed: boolean | null;
  accident_tow_pickup_address: string | null;
  accident_tow_origin_address: string | null;
  accident_tow_waypoint_address: string | null;
  accident_tow_route_cache: unknown | null;
  accident_adjustment_wait: boolean | null;
  use_vehicle_insurance: boolean | null;
  claim_ratio: number | null;
  use_opponent_insurance: boolean | null;
  opponent_insurance_company: string | null;
  opponent_insurance_contact: string | null;
  opponent_insurance_phone: string | null;
  opponent_insurance_fax: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  event_type: string;
  message: string | null;
  created_by: string | null;
  created_at: string;
}

export interface NewCaseFormData {
  customer_id: string;
  vehicle_id: string | null;
  tow_origin_address: string;
  tow_destination_address: string;
  notes: string;
  // insurance details
  case_type: CaseType;
  insurance_company: string;
  insurance_contact: string;
  insurance_phone: string;
  insurance_fax: string;
}
