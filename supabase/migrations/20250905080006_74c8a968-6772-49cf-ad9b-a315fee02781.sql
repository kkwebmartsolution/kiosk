-- Add some test doctor profiles to match existing doctors
INSERT INTO public.profiles (user_id, full_name, phone, role) VALUES
('49ddbc29-9a20-4ccf-882e-2b15b4bd6b15', 'Dr. Sarah Johnson', '+1-555-0101', 'doctor'),
('5ca04d7d-2e03-47e5-b216-eef21895509e', 'Dr. Michael Chen', '+1-555-0102', 'doctor'),
('64fe0b1b-3860-4891-8663-e3354837a397', 'Dr. Emily Davis', '+1-555-0103', 'doctor')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;