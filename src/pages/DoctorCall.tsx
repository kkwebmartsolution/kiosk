import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const DoctorCall = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const roomID = useMemo(() => params.get("room") || "", [params]);
  const iframeSrc = useMemo(() => {
    if (!roomID) return "/WEB_UIKITS.html";
    return `/WEB_UIKITS.html?roomID=${encodeURIComponent(roomID)}`;
  }, [roomID]);

  if (!roomID) {
    // Guard: no room provided
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="lg" onClick={() => navigate("/doctor-portal")} className="mb-4">
            <ArrowLeft className="mr-2" /> Back to Portal
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Missing room</CardTitle>
            </CardHeader>
            <CardContent>
              No room ID was provided. Return to the portal and accept a call again.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" size="lg" onClick={() => navigate("/doctor-portal")} className="mb-4">
          <ArrowLeft className="mr-2" /> Back to Portal
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Live Consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe src={iframeSrc} title="ZegoUIKit" className="w-full h-[80vh] rounded-xl border-0" allow="camera; microphone"></iframe>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorCall;
