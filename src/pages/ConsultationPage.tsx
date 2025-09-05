import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Video, Phone, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConsultationData {
  bookingId: string;
  doctorName: string;
  date: string;
  patientName: string;
}

const ConsultationPage = () => {
  const navigate = useNavigate();
  const [consultationData, setConsultationData] = useState<ConsultationData | null>(null);
  const [consultationStarted, setConsultationStarted] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem("consultationData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setConsultationData(data);
    } else {
      navigate("/payment");
    }
  }, [navigate]);

  const handleStartConsultation = async () => {
    setConsultationStarted(true);
    // Signal doctor via Supabase Realtime about the incoming call
    try {
      const roomId = (consultationData as any)?.roomId || `room_${Date.now()}`;
      const doctorChannel = supabase.channel(`calls:doctor_${(consultationData as any)?.doctorId}`);
      await doctorChannel.subscribe();
      await doctorChannel.send({ type: 'broadcast', event: 'incoming_call', payload: {
        roomId,
        appointmentId: (consultationData as any)?.appointmentId,
        bookingId: (consultationData as any)?.bookingId,
      }});
    } catch (e) {
      console.warn('Failed to publish incoming call event', e);
    }

    // Patient will render Zego WebUIKit via iframe below
  };

  const handleEndConsultation = async () => {
    try {
      const appointmentId = (consultationData as any)?.appointmentId;
      if (appointmentId) {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', appointmentId);
      }

      const prescriptionData = {
        bookingId: (consultationData as any)?.bookingId,
        prescriptionId: 'RX' + Date.now().toString().slice(-6),
        doctorName: (consultationData as any)?.doctorName,
        date: new Date().toISOString(),
        patientName: 'Kiosk Patient',
        totalAmount: (consultationData as any)?.totalAmount,
        paymentMethod: (consultationData as any)?.paymentMethod || 'upi',
        paymentStatus: (consultationData as any)?.paymentStatus || 'completed',
      };
      localStorage.setItem('prescriptionData', JSON.stringify(prescriptionData));
      navigate('/prescription');
    } catch (e) {
      console.error('Failed to end consultation:', e);
      navigate('/prescription');
    }
  };

  if (!consultationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          size="lg"
          onClick={() => navigate("/payment")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Back to Payment
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {consultationStarted ? "Consultation Active" : "Start Consultation"}
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect with {consultationData.doctorName}
          </p>
        </div>

        {!consultationStarted ? (
          <div className="space-y-8">

            {/* Appointment Summary */}
            <Card className="border-2">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl">Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Doctor</p>
                      <p className="text-lg font-semibold">{consultationData.doctorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Patient</p>
                      <p className="text-lg font-semibold">{consultationData.patientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-lg font-semibold">{formatDate(consultationData.date)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultation Option */}
            <div className="grid grid-cols-1 gap-8">
              <Card className="border-2 hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Video className="w-10 h-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Video Call</CardTitle>
                  <p className="text-muted-foreground">Face-to-face consultation with your doctor</p>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={handleStartConsultation}
                    size="kiosk"
                    className="w-full"
                  >
                    <Video className="mr-2" />
                    Start Video Call
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Active Consultation Interface with Zego via iframe */
          <Card className="border-2">
            <CardHeader className="bg-success/5 border-b">
              <CardTitle className="text-2xl text-center flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                Consultation in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={`/WEB_UIKITS.html?roomID=${encodeURIComponent((consultationData as any)?.roomId || '')}`}
                title="ZegoUIKit"
                className="w-full h-[75vh] rounded-xl border-0"
                allow="camera; microphone"
              />
              <div className="p-6 flex justify-center">
                <Button onClick={handleEndConsultation} size="kiosk" className="bg-destructive hover:bg-destructive/90">
                  End Consultation & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConsultationPage;