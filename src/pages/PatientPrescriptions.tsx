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
  const [printId, setPrintId] = useState<string | null>(null);

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
      {/* Thermal print styles for 80mm printers and per-card printing */}
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 6mm; }
          body * { visibility: hidden; }
          .print-target, .print-target * { visibility: visible; }
          .print-target {
            position: absolute; left: 0; right: 0; top: 0; margin: 0 auto; width: 72mm;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; color: #000;
          }
          .print-title { font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 8px; }
          .print-subtitle { font-size: 12px; text-align: center; margin-bottom: 8px; }
          .print-section-title { font-size: 12px; font-weight: 700; margin: 8px 0 4px; border-bottom: 1px dashed #000; padding-bottom: 2px; }
          .print-row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
          .print-meds { width: 100%; border-top: 1px dashed #000; margin-top: 6px; padding-top: 6px; }
          .print-med { font-size: 12px; margin-bottom: 6px; }
          .print-med .name { font-weight: 700; }
          .print-med .details { margin-left: 6px; display: block; font-size: 11px; }
          .print-footer { text-align: center; font-size: 11px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; }
        }
      `}</style>
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
              <Card key={row.id} className={printId === row.id ? 'print-target' : ''}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Prescription #{row.id.slice(-6)}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{new Date(row.created_at).toLocaleString()}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPrintId(row.id);
                        setTimeout(() => {
                          window.print();
                        }, 100);
                        const after = () => {
                          setPrintId(null);
                          window.removeEventListener('afterprint', after);
                        };
                        window.addEventListener('afterprint', after);
                      }}
                    >
                      Print
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {row.instructions && (
                    <div>
                      <div className="text-sm text-muted-foreground">Instructions</div>
                      <div className="font-medium whitespace-pre-wrap">{row.instructions}</div>
                    </div>
                  )}
                  {Array.isArray(row.medications) && (row.medications as any[]).length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground">Medicines</div>
                      <div className="mt-2 space-y-3">
                        {(row.medications as any[]).map((m: any, i: number) => {
                          const isObj = m && typeof m === 'object';
                          let name = isObj ? (m.name || m.medicine || `Medicine ${i + 1}`) : String(m ?? '');
                          let form = isObj && (m.form || m.type) ? String(m.form || m.type) : '';
                          let dosage = isObj && (m.dosage || m.dose) ? String(m.dosage || m.dose) : '';
                          let frequency = isObj && (m.frequency || m.freq) ? String(m.frequency || m.freq) : '';
                          let duration = isObj && m.duration ? String(m.duration) : '';
                          let notes = isObj && m.notes ? String(m.notes) : '';

                          // Parse pipe- or comma-separated string values like "Name | form | dosage | frequency | duration | notes"
                          if (!isObj && typeof m === 'string') {
                            const parts = m.split(/\s*\|\s*|\s*,\s*/).map((p) => p.trim()).filter(Boolean);
                            if (parts.length >= 1) name = parts[0] || name;
                            if (parts.length >= 2) form = parts[1] || form;
                            if (parts.length >= 3) dosage = parts[2] || dosage;
                            if (parts.length >= 4) frequency = parts[3] || frequency;
                            if (parts.length >= 5) duration = parts[4] || duration;
                            if (parts.length >= 6) notes = parts.slice(5).join(' ') || notes;
                          }
                          return (
                            <div key={i} className="border rounded-md p-3 bg-accent/30">
                              <div className="font-semibold text-foreground">{i + 1}. {name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {form && (<span>Form: {form}</span>)}
                                {(form && (dosage || frequency || duration)) && <span> • </span>}
                                {dosage && (<span>Dosage: {dosage}</span>)}
                                {(dosage && (frequency || duration)) && <span> • </span>}
                                {frequency && (<span>Frequency: {frequency}</span>)}
                                {(frequency && duration) && <span> • </span>}
                                {duration && (<span>Duration: {duration}</span>)}
                              </div>
                              {notes && (
                                <div className="text-sm text-muted-foreground">Notes: {notes}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Print-only compact layout inside each card */}
                  <div className="hidden print:block">
                    <div className="print-title">Prescription #{row.id.slice(-6)}</div>
                    <div className="print-row"><span>Date</span><span>{new Date(row.created_at).toLocaleString()}</span></div>
                    {Array.isArray(row.medications) && (row.medications as any[]).length > 0 && (
                      <>
                        <div className="print-section-title">Medicines</div>
                        <div className="print-meds">
                          {(row.medications as any[]).map((m: any, i: number) => {
                            const isObj = m && typeof m === 'object';
                            let name = isObj ? (m.name || m.medicine || `Medicine ${i + 1}`) : String(m ?? '');
                            let form = isObj && (m.form || m.type) ? String(m.form || m.type) : '';
                            let dosage = isObj && (m.dosage || m.dose) ? String(m.dosage || m.dose) : '';
                            let frequency = isObj && (m.frequency || m.freq) ? String(m.frequency || m.freq) : '';
                            let duration = isObj && m.duration ? String(m.duration) : '';
                            let notes = isObj && m.notes ? String(m.notes) : '';

                            if (!isObj && typeof m === 'string') {
                              const parts = m.split(/\s*\|\s*|\s*,\s*/).map((p) => p.trim()).filter(Boolean);
                              if (parts.length >= 1) name = parts[0] || name;
                              if (parts.length >= 2) form = parts[1] || form;
                              if (parts.length >= 3) dosage = parts[2] || dosage;
                              if (parts.length >= 4) frequency = parts[3] || frequency;
                              if (parts.length >= 5) duration = parts[4] || duration;
                              if (parts.length >= 6) notes = parts.slice(5).join(' ') || notes;
                            }
                            return (
                              <div key={i} className="print-med">
                                <span className="name">• {name}</span>
                                {(form || dosage || frequency || duration) && (
                                  <span className="details">
                                    {form && `Form: ${form}`}
                                    {form && (dosage || frequency || duration) ? ' | ' : ''}
                                    {dosage && `Dosage: ${dosage}`}
                                    {dosage && (frequency || duration) ? ' | ' : ''}
                                    {frequency && `Frequency: ${frequency}`}
                                    {frequency && duration ? ' | ' : ''}
                                    {duration && `Duration: ${duration}`}
                                  </span>
                                )}
                                {notes && (
                                  <span className="details">Notes: {notes}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {row.instructions && (
                      <>
                        <div className="print-section-title">Instructions</div>
                        <div style={{ fontSize: 12 }}>{row.instructions}</div>
                      </>
                    )}
                    <div className="print-footer">Get well soon • Powered by Care Flow</div>
                  </div>
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
