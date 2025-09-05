-- Update the handle_new_user function to create doctor profiles when role is doctor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always create a profile first
  INSERT INTO public.profiles (user_id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient')
  );
  
  -- If the user role is doctor, also create a doctor profile
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient') = 'doctor' THEN
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
    VALUES (
      NEW.id,
      'General Practice'::medical_specialization,  -- Default specialization
      'General Medicine',
      0,  -- Default experience
      100.00,  -- Default consultation fee
      0.0,  -- Default rating
      'Medical practitioner providing comprehensive healthcare services.',
      false  -- Default offline
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a trigger to automatically call this function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();