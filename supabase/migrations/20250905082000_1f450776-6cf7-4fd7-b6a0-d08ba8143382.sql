-- Create doctor profile for the existing user who signed up as doctor
-- First check if user 0d86facb-641b-4421-bc46-33f04763080c exists and create doctor profile
INSERT INTO public.doctors (
  user_id,
  specialization,
  department,
  experience_years,
  consultation_fee,
  rating,
  bio,
  is_online
)
SELECT 
  '0d86facb-641b-4421-bc46-33f04763080c',
  'General Practice'::medical_specialization,
  'General Medicine',
  1,
  100.00,
  4.5,
  'Medical practitioner providing comprehensive healthcare services.',
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors WHERE user_id = '0d86facb-641b-4421-bc46-33f04763080c'
);