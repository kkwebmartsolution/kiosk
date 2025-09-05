import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    const normalized = phoneNumber.replace(/\D+/g, "");
    if (normalized.length < 10) return;
    setLoading(true);
    try {
      // 1) Try to find existing patient by phone
      const { data: existing, error: findError } = await (supabase as any)
        .from('patients')
        .select('id')
        .eq('phone', normalized)
        .limit(1);
      if (findError) throw findError;

      let patientId: string | null = null;
      if (existing && existing.length > 0) {
        patientId = existing[0].id as string;
      } else {
        // 2) Create a new patient with just the phone number
        const { data: inserted, error: insertError } = await (supabase as any)
          .from('patients')
          .insert({ phone: normalized })
          .select('id')
          .single();
        if (insertError) throw insertError;
        patientId = inserted?.id as string;
      }

      if (!patientId) throw new Error('Unable to resolve patient ID');

      // Store session locally for kiosk
      localStorage.setItem('patientId', patientId);
      localStorage.setItem('patientPhone', normalized);
      navigate('/doctors');
    } catch (err: any) {
      console.error('Patient login error', err);
      toast({
        title: 'Login failed',
        description: err?.message || 'Unable to log in with this phone number.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          size="lg"
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">Welcome</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">
              Please enter your phone number to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-lg font-semibold text-foreground">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter your 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-16 text-xl border-2 rounded-xl"
                maxLength={10}
              />
            </div>
            
            <Button
              onClick={handleLogin}
              disabled={phoneNumber.replace(/\D+/g, "").length < 10 || loading}
              size="kiosk"
              className="w-full"
            >
              {loading ? "Signing you in..." : "Continue"}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              No password required - just your phone number
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;