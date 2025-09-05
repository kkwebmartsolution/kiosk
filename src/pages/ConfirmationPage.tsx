import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, CheckCircle } from "lucide-react";

interface BookingData {
  doctorName: string;
  doctorSpecialization: string;
  consultationFee: number;
  symptoms: string;
  bookingId: string;
  doctorId: string;
  appointmentId: string;
}

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("bookingData");
    if (storedData) {
      setBookingData(JSON.parse(storedData));
    } else {
      navigate("/booking");
    }
  }, [navigate]);

  const handleConfirm = () => {
    // Use existing bookingId from booking step and compute totals
    const bookingId = bookingData?.bookingId as string;
    const fee = Number(bookingData?.consultationFee || 0);
    const gst = Math.round(fee * 0.18);
    const total = fee + gst;
    const confirmationData = {
      bookingId,
      doctorId: bookingData?.doctorId,
      appointmentId: bookingData?.appointmentId,
      doctorName: bookingData?.doctorName || "Doctor",
      consultationFee: fee,
      gst,
      totalAmount: total,
    };
    localStorage.setItem("confirmationData", JSON.stringify(confirmationData));
    navigate("/payment");
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate("/booking")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2" />
          Back to Booking
        </Button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Confirm Your Appointment</h1>
          <p className="text-xl text-muted-foreground">Please review your booking details</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-2xl text-center">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Doctor Information */}
            <div className="bg-accent/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                <User className="text-primary" />
                Doctor Information
              </h3>
              <p className="text-2xl font-semibold text-primary">{bookingData.doctorName}</p>
              <p className="text-lg text-muted-foreground">{bookingData.doctorSpecialization}</p>
            </div>

            {/* Notes (Optional) */}
            {bookingData.symptoms && (
              <div className="bg-accent/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Notes</h3>
                <p className="text-lg text-muted-foreground bg-background p-4 rounded-lg">
                  {bookingData.symptoms}
                </p>
              </div>
            )}

            {/* Fee Information */}
            <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary/20">
              <h3 className="text-xl font-bold text-foreground mb-4">Fee Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Consultation Fee</span>
                  <span className="text-lg font-semibold">₹{bookingData.consultationFee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">GST (18%)</span>
                  <span className="text-lg font-semibold">₹{Math.round((bookingData.consultationFee || 0) * 0.18)}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total Amount</span>
                  <span className="text-xl font-bold text-primary">₹{(bookingData.consultationFee || 0) + Math.round((bookingData.consultationFee || 0) * 0.18)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-10 text-center space-y-4">
          <Button
            onClick={handleConfirm}
            size="kiosk"
            className="px-16"
          >
            Confirm Appointment
          </Button>
          <p className="text-sm text-muted-foreground">
            By confirming, you agree to our terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;