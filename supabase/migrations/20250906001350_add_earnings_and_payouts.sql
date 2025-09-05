-- Payments and Withdrawal Requests schema for doctor earnings tracking

-- Payments table: records successful patient payments for appointments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('card','upi','cash')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS: patients and their doctors can view related payments
CREATE POLICY IF NOT EXISTS "Patients can insert their own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY IF NOT EXISTS "Users can view related payments" ON public.payments
  FOR SELECT USING (
    auth.uid() = patient_id OR
    auth.uid() IN (SELECT user_id FROM public.doctors d WHERE d.id = payments.doctor_id)
  );

-- Optional: block updates/deletes from client (service role can manage)
CREATE POLICY IF NOT EXISTS "No client updates to payments" ON public.payments
  FOR UPDATE USING (false);
CREATE POLICY IF NOT EXISTS "No client deletes to payments" ON public.payments
  FOR DELETE USING (false);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON public.payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- View to summarize earnings per doctor
CREATE OR REPLACE VIEW public.doctor_earnings_summary AS
  SELECT 
    d.id AS doctor_id,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount END), 0)::NUMERIC(12,2) AS total_earnings,
    COALESCE(SUM(CASE WHEN p.status = 'completed' AND date_trunc('month', p.created_at) = date_trunc('month', now()) THEN p.amount END), 0)::NUMERIC(12,2) AS month_earnings,
    COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount END), 0)::NUMERIC(12,2) AS pending_amount
  FROM public.doctors d
  LEFT JOIN public.payments p ON p.doctor_id = d.id
  GROUP BY d.id;

ALTER VIEW public.doctor_earnings_summary OWNER TO postgres;

-- Allow authenticated clients to select from the view (RLS still applies on base tables)
GRANT SELECT ON public.doctor_earnings_summary TO authenticated;

-- Withdrawal requests table (optional but useful to manage payouts)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('bank','upi','paypal')),
  account_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Doctors manage their own withdrawals (insert/select)" ON public.withdrawal_requests
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.doctors d WHERE d.id = withdrawal_requests.doctor_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.doctors d WHERE d.id = withdrawal_requests.doctor_id)
  );

CREATE INDEX IF NOT EXISTS idx_withdrawals_doctor_id ON public.withdrawal_requests(doctor_id);
