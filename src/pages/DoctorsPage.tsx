import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Calendar, User, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  department: string;
  experience_years: number;
  rating: number;
  consultation_fee: number;
  is_online: boolean;
  bio: string;
  profiles?: {
    full_name: string;
  } | null;
}

const DoctorsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Allow kiosk patients (no supabase auth) to view doctors
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('is_online', true)
        .order('rating', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch doctors",
          variant: "destructive",
        });
      } else {
        setDoctors((data as any) || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            size="lg"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/search")}
            >
              <Search className="mr-2" />
              Search Doctors
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/prescriptions')}
            >
              View Prescription
            </Button>
            {user && (
              <Button 
                variant="destructive" 
                size="lg"
                onClick={handleLogout}
              >
                <User className="mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-4">Available Doctors</h1>
          <p className="text-xl text-muted-foreground">Select a doctor to book your appointment</p>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">No doctors are currently online</p>
            <Button onClick={() => navigate("/search")} className="gap-2">
              <Search className="h-4 w-4" />
              Search All Doctors
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doctors.map((doctor) => (
              <Card 
                key={doctor.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-xl border-2 ${
                  selectedDoctor === doctor.id ? 'border-primary shadow-lg' : 'border-border'
                }`}
                onClick={() => setSelectedDoctor(doctor.id)}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="text-6xl">👨‍⚕️</div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">
                          {doctor.profiles?.full_name || 'Dr. Anonymous'}
                        </h3>
                        <p className="text-lg text-primary font-semibold">{doctor.specialization}</p>
                        <p className="text-base text-muted-foreground">{doctor.department}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="default" className="text-sm px-3 py-1">
                          Online Now
                        </Badge>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          {doctor.experience_years} years exp
                        </Badge>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          ⭐ {doctor.rating.toFixed(1)}
                        </Badge>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          ${doctor.consultation_fee}
                        </Badge>
                      </div>
                      
                      {doctor.bio && (
                        <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                      )}
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookAppointment(doctor.id);
                        }}
                        size="lg"
                        className="w-full"
                      >
                        <Calendar className="mr-2" />
                        Book Appointment
                      </Button>
                    </div>
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

export default DoctorsPage;