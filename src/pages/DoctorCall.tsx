import { useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const DoctorCall = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const roomID = useMemo(() => params.get("room") || "", [params]);
  const iframeSrc = useMemo(() => {
    if (!roomID) return "/WEB_UIKITS.html";
    return `/WEB_UIKITS.html?roomID=${encodeURIComponent(roomID)}`;
  }, [roomID]);

  // Attempt to enter fullscreen on mount and when iframe loads
  useEffect(() => {
    const enterFullscreen = async () => {
      const el: any = containerRef.current || document.documentElement;
      if (!el) return;
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen;
      try { req && (await req.call(el)); } catch {}
    };
    enterFullscreen();
    const onLoad = () => enterFullscreen();
    const iframe = iframeRef.current;
    iframe?.addEventListener('load', onLoad);
    return () => {
      iframe?.removeEventListener('load', onLoad);
    };
  }, []);

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
    <div ref={containerRef} className="fixed inset-0 bg-black">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="ZegoUIKit"
        className="w-full h-full border-0"
        allow="camera; microphone; fullscreen"
        allowFullScreen
      />
    </div>
  );
};

export default DoctorCall;
