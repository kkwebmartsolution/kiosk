import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BookingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    // Ensure kiosk patient session exists
    const localPatientId = localStorage.getItem('patientId');
    if (!localPatientId) {
      navigate('/login');
      return;
    }
    setPatientId(localPatientId);

    // Load selected doctor data
    const savedDoctorData = localStorage.getItem("selectedDoctorData");
    if (savedDoctorData) {
      setDoctorData(JSON.parse(savedDoctorData));
    } else {
      toast({
        title: "Error",
        description: "No doctor selected",
        variant: "destructive",
      });
      navigate("/doctors");
    }
  }, []);

  const handleBooking = async () => {
    if (!doctorData) {
      toast({ title: "Error", description: "No doctor selected", variant: "destructive" });
      return;
    }
    if (!patientId) {
      toast({ title: "Not logged in", description: "Please login with your mobile number.", variant: "destructive" });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Prepare booking data for confirmation (no DB insert yet)
      const bookingId = `BK${Date.now()}`;
      const bookingData = {
        bookingId,
        doctorId: doctorData.id as string,
        doctorName: doctorData.profiles?.full_name || 'Dr. Anonymous',
        doctorSpecialization: doctorData.specialization,
        consultationFee: doctorData.consultation_fee,
        symptoms: symptoms || "",
      };
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      navigate("/confirmation");
    } catch (error) {
      console.error('Error preparing booking:', error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // No scheduling required in kiosk flow

  if (!doctorData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          size="lg"
          onClick={() => navigate("/doctors")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Back to Doctors
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Connect with Doctor</h1>
          <p className="text-xl text-muted-foreground">
            {doctorData.profiles?.full_name || 'Dr. Anonymous'} • {doctorData.specialization}
          </p>
          <p className="text-lg text-muted-foreground">
            Consultation Fee: ${doctorData.consultation_fee}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reason for Visit (Optional) */}
          <Card className="border-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Calendar className="text-primary" />
                Reason for Visit (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Symptoms / Notes</Label>
                <textarea
                  placeholder="Describe your symptoms or reason for visit..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full h-32 p-4 text-lg border-2 rounded-xl resize-none bg-background"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <Button
            onClick={handleBooking}
            disabled={loading}
            size="kiosk"
            className="px-16"
          >
            {loading ? "Preparing..." : "Book Now"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;