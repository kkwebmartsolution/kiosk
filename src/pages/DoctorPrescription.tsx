import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const DoctorPrescription = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState("");
  const [advice, setAdvice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = params.get("appointment");
    if (!id) {
      navigate('/doctor-portal');
      return;
    }
    setAppointmentId(id);
  }, [params]);

  const handleSave = async () => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      // Find doctor_id for this user
      const { data: doctor, error: docErr } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      if (docErr || !doctor) throw docErr || new Error('Doctor not found');

      // Look up appointment to get patient_id
      const { data: appt, error: apptErr } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('id', appointmentId)
        .single();
      if (apptErr || !appt) throw apptErr || new Error('Appointment not found');

      // Ensure a consultation exists for this appointment (needs patient_id per schema)
      let consultationId: string | null = null;
      const { data: existingConsult, error: consultErr } = await supabase
        .from('consultations')
        .select('id')
        .eq('appointment_id', appointmentId)
        .eq('doctor_id', doctor.id)
        .limit(1)
        .maybeSingle();
      if (consultErr) throw consultErr;
      if (existingConsult?.id) {
        consultationId = existingConsult.id;
      } else {
        const { data: newConsult, error: newConsultErr } = await supabase
          .from('consultations')
          .insert({ appointment_id: appointmentId, doctor_id: doctor.id, patient_id: appt.patient_id })
          .select('id')
          .single();
        if (newConsultErr) throw newConsultErr;
        consultationId = newConsult.id;
      }

      // Insert prescription linked to consultation (instructions + medications JSON)
      const instructions = [diagnosis, advice].filter(Boolean).join('\n');
      const medsList = medications
        .split('\n')
        .map(m => m.trim())
        .filter(Boolean);
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          consultation_id: consultationId as string,
          doctor_id: doctor.id,
          patient_id: appt.patient_id,
          instructions,
          medications: medsList as any,
        })
        .select()
        .single();

      if (error) throw error;

      // Optionally mark appointment as completed if not already
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);

      // Redirect back to portal
      navigate('/doctor-portal');
    } catch (e) {
      console.error('Failed to save prescription', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Prescription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Diagnosis</Label>
              <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" />
            </div>
            <div>
              <Label>Medications</Label>
              <Textarea value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="e.g. Tab ABC 500mg - 1-0-1 x 5 days" />
            </div>
            <div>
              <Label>Advice</Label>
              <Textarea value={advice} onChange={(e) => setAdvice(e.target.value)} placeholder="General advice / follow up" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/doctor-portal')} variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Prescription'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorPrescription;
