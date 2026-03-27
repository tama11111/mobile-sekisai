-- ============================================================
-- たま積載 - 初期スキーマ
-- ============================================================

-- customers
CREATE TABLE IF NOT EXISTS customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  email       text,
  address     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plate       text NOT NULL,
  make        text,
  model       text,
  year        int,
  vin         text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- insurance_cases
CREATE TABLE IF NOT EXISTS insurance_cases (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id             uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id              uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  tow_status              text NOT NULL DEFAULT 'tow'
                            CHECK (tow_status IN ('tow','arrival','repair','claim')),
  tow_origin_address      text,
  tow_destination_address text,
  distance_km             numeric(8,2),
  fare_amount             int,
  photos                  jsonb DEFAULT '[]'::jsonb,
  signature_url           text,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- insurance_details
CREATE TABLE IF NOT EXISTS insurance_details (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id        uuid NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  insurer_name   text,
  policy_number  text,
  claim_number   text,
  adjuster_name  text,
  adjuster_phone text,
  coverage_type  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- case_events
CREATE TABLE IF NOT EXISTS case_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  event_type  text NOT NULL DEFAULT 'memo',
  message     text,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_insurance_cases_customer   ON insurance_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_status     ON insurance_cases(tow_status);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_created    ON insurance_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer          ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_case_events_case           ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_insurance_details_case     ON insurance_details(case_id);

-- ── Realtime ─────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE insurance_cases;

-- ── RPC: execute_sql (Voice AI用 SELECT専用) ─────────────────

CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- SELECT のみ許可
  IF query !~* '^\s*SELECT\b' THEN
    RAISE EXCEPTION 'SELECTクエリのみ実行可能です';
  END IF;

  IF query ~* '\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXEC|EXECUTE)\b' THEN
    RAISE EXCEPTION 'データ変更系クエリは禁止されています';
  END IF;

  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t'
  INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute to anon role
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;

-- ── Storage Buckets ──────────────────────────────────────────

-- Run these in Supabase Dashboard > Storage or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('case-photos', 'case-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

-- ── Row Level Security (optional, all open for anon) ─────────

ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events     ENABLE ROW LEVEL SECURITY;

-- Full access for anon (認証なし運用)
CREATE POLICY "anon_all_customers"         ON customers         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_vehicles"          ON vehicles          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_insurance_cases"   ON insurance_cases   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_insurance_details" ON insurance_details FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_case_events"       ON case_events       FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Sample Data ───────────────────────────────────────────────

INSERT INTO customers (id, name, phone, address) VALUES
  ('11111111-1111-1111-1111-111111111111', '山田 太郎', '090-1234-5678', '神奈川県小田原市栄町1-1-1'),
  ('22222222-2222-2222-2222-222222222222', '西湘 ダイヤ株式会社', '0465-22-1234', '神奈川県小田原市城山3-2-1'),
  ('33333333-3333-3333-3333-333333333333', '鈴木 花子', '080-9876-5432', '神奈川県平塚市紅谷町1-1')
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (customer_id, plate, make, model, year) VALUES
  ('11111111-1111-1111-1111-111111111111', '品川 330 あ 1234', 'トヨタ', 'プリウス', 2022),
  ('22222222-2222-2222-2222-222222222222', '湘南 100 か 5678', '日産', 'キャラバン', 2020),
  ('33333333-3333-3333-3333-333333333333', '横浜 500 さ 9999', 'ホンダ', 'フィット', 2019)
ON CONFLICT DO NOTHING;
