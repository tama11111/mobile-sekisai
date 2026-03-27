export type TowStatus = 'tow' | 'arrival' | 'repair' | 'claim';

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
  customer_id: string;
  vehicle_id: string | null;
  tow_status: TowStatus;
  tow_origin_address: string | null;
  tow_destination_address: string | null;
  distance_km: number | null;
  fare_amount: number | null;
  photos: string[] | null;
  signature_url: string | null;
  notes: string | null;
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
