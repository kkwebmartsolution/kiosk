import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users, Heart, Stethoscope, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">teleheal</h1>
                <p className="text-lg opacity-90">Your Health, Our Priority</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm opacity-75">Welcome, {user.user_metadata?.full_name || user.email}</span>
                <Button variant="secondary" size="sm" onClick={() => navigate('/prescriptions')} className="gap-2">
                  View Prescription
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-foreground mb-6">Welcome to Our Medical Center</h2>
          <p className="text-2xl text-muted-foreground mb-8">
            Book your appointment easily and quickly
          </p>
          <div className="flex items-center justify-center gap-4 text-lg text-muted-foreground">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Expert Doctors
            </div>
            <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Quality Care
            </div>
            <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
            <div>Easy Booking</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {!user ? (
            <>
              <Card className="border-2 hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => navigate("/login")}>
                <CardContent className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <UserPlus className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground mb-3">New Patient</h3>
                    <p className="text-xl text-muted-foreground mb-6">
                      First time visiting? Register and book your appointment
                    </p>
                    <Button size="kiosk" className="w-full">
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => navigate("/login")}>
                <CardContent className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Users className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground mb-3">Existing Patient</h3>
                    <p className="text-xl text-muted-foreground mb-6">
                      Already have an account? Continue with your account
                    </p>
                    <Button size="kiosk" className="w-full">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-2 hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => navigate("/doctors")}>
                <CardContent className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Stethoscope className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground mb-3">Book Appointment</h3>
                    <p className="text-xl text-muted-foreground mb-6">
                      Browse available doctors and book your appointment
                    </p>
                    <Button size="kiosk" className="w-full">
                      View Doctors
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => navigate("/search")}>
                <CardContent className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Users className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-foreground mb-3">Search Doctors</h3>
                    <p className="text-xl text-muted-foreground mb-6">
                      Search for doctors by specialization or name
                    </p>
                    <Button size="kiosk" className="w-full">
                      Search Doctors
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">Why Choose Us?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">⚡</div>
              </div>
              <h4 className="text-xl font-semibold mb-2">Quick Booking</h4>
              <p className="text-muted-foreground">Book appointments in just a few simple steps</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">👨‍⚕️</div>
              </div>
              <h4 className="text-xl font-semibold mb-2">Expert Doctors</h4>
              <p className="text-muted-foreground">Qualified specialists ready to help you</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">🔒</div>
              </div>
              <h4 className="text-xl font-semibold mb-2">Secure Payment</h4>
              <p className="text-muted-foreground">Safe and secure payment processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
