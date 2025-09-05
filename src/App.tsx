import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import DoctorsPage from "./pages/DoctorsPage";
import SearchPage from "./pages/SearchPage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import PaymentPage from "./pages/PaymentPage";
import PrescriptionPage from "./pages/PrescriptionPage";
import ConsultationPage from "./pages/ConsultationPage";
import DoctorPortal from "./pages/DoctorPortal";
import DoctorLogin from "./pages/DoctorLogin";
import LoginPage from "./pages/LoginPage";
import DoctorCall from "./pages/DoctorCall";
import DoctorPrescription from "./pages/DoctorPrescription";
import PatientPrescriptions from "./pages/PatientPrescriptions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctor-portal" element={<DoctorPortal />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/call" element={<DoctorCall />} />
            <Route path="/doctor/prescription" element={<DoctorPrescription />} />
            <Route path="/prescriptions" element={<PatientPrescriptions />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/prescription" element={<PrescriptionPage />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
