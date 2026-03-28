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
  email: string | null;
  address: string | null;
  created_at: string;
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

export interface InsuranceCase {
  id: string;
  title: string | null;
  status: CaseStatus;
  customer_id: string;
  vehicle_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  // 故障レッカー用（後方互換）
  tow_status: TowStatus;
  tow_origin_address: string | null;
  tow_destination_address: string | null;
  distance_km: number | null;
  fare_amount: number | null;
  photos: string[] | null;
  signature_url: string | null;
  created_at: string;
  updated_at: string;
  // joined
  customer?: Customer;
  vehicle?: Vehicle;
  insurance_details?: InsuranceDetail[];
}

export interface InsuranceDetail {
  id: string;
  case_id: string;
  case_type: CaseType;
  insurance_company: string | null;
  insurance_contact: string | null;
  insurance_phone: string | null;
  insurance_fax: string | null;
  rental_car_needed: boolean | null;
  rental_car_model: string | null;
  rental_car_daily_rate: number | null;
  rental_claimed: boolean | null;
  payment_received: boolean | null;
  notes: string | null;
  // 故障レッカー専用
  tow_status: TowStatus | null;
  tow_destination_address: string | null;
  tow_origin_address: string | null;
  tow_waypoint_address: string | null;
  breakdown_cause: string | null;
  tow_claimed: boolean | null;
  // 事故修理専用
  accident_status: AccidentStatus | null;
  accident_adjustment_wait: boolean | null;
  accident_tow_needed: boolean | null;
  accident_tow_pickup_address: string | null;
  use_vehicle_insurance: boolean | null;
  claim_ratio: number | null;
  use_opponent_insurance: boolean | null;
  opponent_insurance_company: string | null;
  opponent_insurance_contact: string | null;
  opponent_insurance_phone: string | null;
  opponent_insurance_fax: string | null;
  // 後方互換フィールド
  insurer_name: string | null;
  policy_number: string | null;
  claim_number: string | null;
  adjuster_name: string | null;
  adjuster_phone: string | null;
  coverage_type: string | null;
  created_at: string;
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
  insurer_name: string;
  policy_number: string;
  claim_number: string;
  adjuster_name: string;
  adjuster_phone: string;
  coverage_type: string;
}
