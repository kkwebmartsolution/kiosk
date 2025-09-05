import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  id: string;
  created_at: string;
  instructions: string | null;
  medications: any[] | null;
  consultation_id: string;
}

const PatientPrescriptions = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) {
        navigate('/login');
        return;
      }

      // 1) Get consultations for this patient
      const { data: consults, error: cErr } = await (supabase as any)
        .from('consultations')
        .select('id')
        .eq('patient_id', patientId);
      if (cErr) throw cErr;
      const consultIds = (consults || []).map((c: any) => c.id);

      if (consultIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // 2) Fetch prescriptions for those consultations
      const { data, error } = await (supabase as any)
        .from('prescriptions')
        .select('id, created_at, instructions, medications, consultation_id')
        .in('consultation_id', consultIds)
        .order('created_at', { ascending: false });

      if (!error && data) setRows(data as any);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Prescriptions</h1>
          <Button variant="outline" onClick={() => navigate('/doctors')}>Back</Button>
        </div>

        {rows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No prescriptions found yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Prescription #{row.id.slice(-6)}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{new Date(row.created_at).toLocaleString()}</Badge>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {row.instructions && (
                    <div>
                      <div className="text-sm text-muted-foreground">Instructions</div>
                      <div className="font-medium whitespace-pre-wrap">{row.instructions}</div>
                    </div>
                  )}
                  {row.medications && (
                    <div>
                      <div className="text-sm text-muted-foreground">Medications</div>
                      <ul className="list-disc pl-6">
                        {(row.medications as any[]).map((m: any, i: number) => (
                          <li key={i} className="font-medium">{String(m)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptions;
