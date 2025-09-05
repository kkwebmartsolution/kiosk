import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  specialization: string;
  department: string;
  experience_years: number;
  rating: number;
  consultation_fee: number;
  is_online: boolean;
  bio: string;
  profiles?: { full_name: string } | null;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const specializations = ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics", "General Medicine", "Psychiatry", "Gynecology"];

  useEffect(() => {
    // Allow kiosk patients without Supabase auth
    fetchDoctors();
  }, []);

  useEffect(() => {
    let filtered = doctors;
    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (specializationFilter) filtered = filtered.filter(doctor => doctor.specialization === specializationFilter);
    if (availabilityFilter === "online") filtered = filtered.filter(doctor => doctor.is_online);
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, specializationFilter, availabilityFilter]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase.from('doctors').select(`*, profiles!doctors_user_id_fkey (full_name)`).order('rating', { ascending: false });
      if (!error) setDoctors((data as any) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctorId: string) => {
    const selectedDoctorData = doctors.find(doc => doc.id === doctorId);
    if (selectedDoctorData) {
      localStorage.setItem("selectedDoctorId", doctorId);
      localStorage.setItem("selectedDoctorData", JSON.stringify(selectedDoctorData));
      navigate("/booking");
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="lg" onClick={() => navigate("/doctors")}
          >
            <ArrowLeft className="mr-2" />Back to Doctors
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/prescriptions')}>View Prescription</Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Search Doctors</h1>
          <p className="text-xl text-muted-foreground">Find the right doctor for your needs</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search doctors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12" />
              </div>
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Specialization" /></SelectTrigger>
                <SelectContent>{specializations.map((spec) => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Availability" /></SelectTrigger>
                <SelectContent><SelectItem value="online">Online Now</SelectItem></SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {setSearchTerm(""); setSpecializationFilter(""); setAvailabilityFilter("");}} className="h-12"><Filter className="h-4 w-4 mr-2" />Clear</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="text-5xl">👨‍⚕️</div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold">{doctor.profiles?.full_name || 'Dr. Anonymous'}</h3>
                      <p className="text-primary font-semibold">{doctor.specialization}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={doctor.is_online ? "default" : "secondary"}>{doctor.is_online ? "Online" : "Offline"}</Badge>
                      <Badge variant="outline">⭐ {doctor.rating}</Badge>
                      <Badge variant="outline">${doctor.consultation_fee}</Badge>
                    </div>
                    <Button onClick={() => handleBookAppointment(doctor.id)} size="sm" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />Book Appointment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;