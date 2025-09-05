-- Create enum types
CREATE TYPE public.specialization_type AS ENUM (
  'Cardiology',
  'Dermatology', 
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'General Medicine',
  'Psychiatry',
  'Gynecology'
);

CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed', 
  'completed',
  'cancelled'
);

CREATE TYPE public.consultation_status AS ENUM (
  'waiting',
  'active',
  'completed'
);

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specialization specialization_type NOT NULL,
  department TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor availability table
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status DEFAULT 'pending',
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  symptoms TEXT,
  consultation_fee DECIMAL(10,2) NOT NULL,
  booking_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status consultation_status DEFAULT 'waiting',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for doctors
CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update their own profile" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Doctors can insert their own profile" ON public.doctors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for doctor availability
CREATE POLICY "Anyone can view doctor availability" ON public.doctor_availability FOR SELECT USING (true);
CREATE POLICY "Doctors can manage their own availability" ON public.doctor_availability FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = doctor_id)
);

-- Create RLS policies for appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (
  auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = doctor_id)
);
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients and doctors can update appointments" ON public.appointments FOR UPDATE USING (
  auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = doctor_id)
);

-- Create RLS policies for consultations
CREATE POLICY "Users can view their own consultations" ON public.consultations FOR SELECT USING (
  auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = doctor_id)
);
CREATE POLICY "Doctors can manage consultations" ON public.consultations FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = doctor_id)
);

-- Create RLS policies for prescriptions
CREATE POLICY "Users can view their own prescriptions" ON public.prescriptions FOR SELECT USING (
  auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = doctor_id)
);
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.doctors WHERE id = doctor_id)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample doctors (optional - for testing)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
  (gen_random_uuid(), 'dr.smith@hospital.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Dr. Sarah Smith", "role": "doctor"}'),
  (gen_random_uuid(), 'dr.johnson@hospital.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Dr. Michael Johnson", "role": "doctor"}'),
  (gen_random_uuid(), 'dr.williams@hospital.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Dr. Emily Williams", "role": "doctor"}');

-- Insert corresponding doctor profiles
INSERT INTO public.doctors (user_id, specialization, department, experience_years, rating, consultation_fee, is_online, bio)
SELECT 
  u.id,
  'Cardiology'::specialization_type,
  'Cardiology Department',
  10,
  4.8,
  150.00,
  true,
  'Experienced cardiologist specializing in heart conditions and preventive care.'
FROM auth.users u WHERE u.email = 'dr.smith@hospital.com';

INSERT INTO public.doctors (user_id, specialization, department, experience_years, rating, consultation_fee, is_online, bio)
SELECT 
  u.id,
  'Neurology'::specialization_type,
  'Neurology Department', 
  15,
  4.9,
  200.00,
  true,
  'Neurologist with expertise in brain and nervous system disorders.'
FROM auth.users u WHERE u.email = 'dr.johnson@hospital.com';

INSERT INTO public.doctors (user_id, specialization, department, experience_years, rating, consultation_fee, is_online, bio)
SELECT 
  u.id,
  'Pediatrics'::specialization_type,
  'Pediatrics Department',
  8,
  4.7,
  120.00,
  false,
  'Pediatrician dedicated to providing comprehensive care for children.'
FROM auth.users u WHERE u.email = 'dr.williams@hospital.com';