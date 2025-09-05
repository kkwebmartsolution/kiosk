import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, QrCode, CheckCircle, Calendar, Video } from "lucide-react";

interface PrescriptionData {
  bookingId: string;
  prescriptionId: string;
  doctorName: string;
  date: string;
  patientName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}

const PrescriptionPage = () => {
  const navigate = useNavigate();
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("prescriptionData");
    if (storedData) {
      setPrescriptionData(JSON.parse(storedData));
    } else {
      navigate("/payment");
    }
  }, [navigate]);

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert("Prescription downloaded successfully!");
  };

  const handlePrint = () => {
    // In a real app, this would open the print dialog
    window.print();
  };

  const handleNewAppointment = () => {
    // Clear all stored data and go to home
    localStorage.clear();
    navigate("/");
  };

  if (!prescriptionData) {
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
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Appointment Confirmed!</h1>
          <p className="text-xl text-muted-foreground">Your booking has been successfully completed</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prescription Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 shadow-xl">
              <CardHeader className="bg-success/5 border-b">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <CheckCircle className="text-success" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">Booking ID</h3>
                    <p className="text-2xl font-bold font-mono text-primary">{prescriptionData.bookingId}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">Prescription ID</h3>
                    <p className="text-2xl font-bold font-mono text-primary">{prescriptionData.prescriptionId}</p>
                  </div>
                </div>

                <div className="bg-accent/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Doctor Information</h3>
                  <p className="text-2xl font-semibold text-primary">{prescriptionData.doctorName}</p>
                  <p className="text-lg text-muted-foreground">Cardiology Specialist</p>
                </div>

                <div className="bg-accent/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Appointment Date</h3>
                  <div className="flex items-center gap-3">
                    <Calendar className="text-primary w-5 h-5" />
                    <div>
                      <p className="text-lg font-semibold">{formatDate(prescriptionData.date)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Patient Information</h3>
                  <p className="text-xl font-semibold text-primary">{prescriptionData.patientName}</p>
                </div>

                <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary/20">
                  <h3 className="text-xl font-bold text-foreground mb-4">Payment Information</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">Total Amount Paid</span>
                    <span className="text-2xl font-bold text-success">₹{prescriptionData.totalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg">Payment Method</span>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {prescriptionData.paymentMethod.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions & QR Code */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Download className="mr-2" />
                  Download Receipt
                </Button>
                
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Printer className="mr-2" />
                  Print Receipt
                </Button>
                
                <Button
                  onClick={() => navigate("/consultation")}
                  size="lg"
                  className="w-full bg-success hover:bg-success/90"
                >
                  <Video className="mr-2" />
                  Consult Now
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <QrCode className="text-primary" />
                  Verification QR
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white p-6 rounded-xl border-2 border-border text-center">
                  <div className="w-32 h-32 bg-primary/10 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-16 h-16 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code for appointment verification
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-accent/20">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold text-foreground mb-3">Important Note</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please arrive 15 minutes before your appointment time. Bring a valid ID for verification.
                </p>
                <Button
                  onClick={handleNewAppointment}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  Book Another Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPage;