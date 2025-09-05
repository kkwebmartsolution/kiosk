import { useState, useEffect, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Users, Calendar, LogOut, Activity, Home, Wallet, User, DollarSign, CreditCard, Banknote } from "lucide-react";

interface DoctorProfile {
  id: string;
  specialization: string;
  department: string;
  experience_years: number;
  rating: number;
  consultation_fee: number;
  is_online: boolean;
  bio: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  patient_name: string;
  patient_age: number;
  symptoms: string;
  status: string;
}

interface PaymentHistoryItem {
  id: string;
  patient_name: string | null;
  amount: number;
  method: 'card' | 'upi' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

interface EarningsSummary {
  total_earnings: number;
  month_earnings: number;
  pending_amount: number;
}

const DoctorPortal = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingRoomId, setIncomingRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'earnings' | 'profile'>('appointments');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<string>("bank");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [accountRef, setAccountRef] = useState<string>("");
  const [earnings, setEarnings] = useState<EarningsSummary>({ total_earnings: 0, month_earnings: 0, pending_amount: 0 });
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/doctor/login");
      return;
    }
    fetchDoctorData();
  }, [user]);

  useEffect(() => {
    if (!doctorProfile) return;
    const channel = supabase
      .channel(`calls:doctor_${doctorProfile.id}`)
      .on('broadcast', { event: 'incoming_call' }, (payload: any) => {
        const roomId = payload?.payload?.roomId;
        if (roomId) {
          setIncomingRoomId(roomId);
          toast({ title: 'Incoming Call', description: 'A patient wants to start a consultation.' });
        }
      })
      .subscribe((status) => {
        // optional: handle status
      });
    return () => { supabase.removeChannel(channel); };
  }, [doctorProfile]);

  const fetchDoctorData = async () => {
    try {
      // Fetch doctor profile
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (doctorError) {
        toast({
          title: "Access Denied",
          description: "You are not registered as a doctor",
          variant: "destructive",
        });
        navigate("/doctor/login");
        return;
      }

      setDoctorProfile(doctorData);

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorData.id)
        .order('appointment_date', { ascending: true });

      if (!appointmentsError) {
        setAppointments(appointmentsData || []);
      }
      // Fetch earnings + payments in parallel
      fetchEarningsAndPayments(doctorData.id);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsAndPayments = async (doctorId: string) => {
    try {
      setLoadingEarnings(true);
      setLoadingPayments(true);
      // Earnings summary from view
      const earningsRes = await (supabase as any)
        .from('doctor_earnings_summary')
        .select('*')
        .eq('doctor_id', doctorId)
        .single();
      if (!earningsRes.error && earningsRes.data) {
        setEarnings({
          total_earnings: Number(earningsRes.data.total_earnings || 0),
          month_earnings: Number(earningsRes.data.month_earnings || 0),
          pending_amount: Number(earningsRes.data.pending_amount || 0),
        });
      }

      // Fallback: also fetch running total from doctors.total_earnings maintained by triggers
      const docTotalRes = await (supabase as any)
        .from('doctors')
        .select('total_earnings')
        .eq('id', doctorId)
        .single();
      if (!docTotalRes.error && docTotalRes.data && docTotalRes.data.total_earnings != null) {
        setEarnings((prev) => ({
          ...prev,
          total_earnings: Number(docTotalRes.data.total_earnings || 0),
        }));
      }

      // Payment history for this doctor
      const payRes = await (supabase as any)
        .from('payments')
        .select('id, patient_name, amount, method, status, created_at')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!payRes.error && payRes.data) setPayments(payRes.data);
    } catch (e) {
      console.error('Earnings fetch error', e);
    } finally {
      setLoadingEarnings(false);
      setLoadingPayments(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!doctorProfile) return;

    const newStatus = !doctorProfile.is_online;
    
    const { error } = await supabase
      .from('doctors')
      .update({ is_online: newStatus })
      .eq('id', doctorProfile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update online status",
        variant: "destructive",
      });
    } else {
      setDoctorProfile({ ...doctorProfile, is_online: newStatus });
      toast({
        title: "Status Updated",
        description: `You are now ${newStatus ? 'online' : 'offline'}`,
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading doctor portal...</p>
        </div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Doctor profile not found</p>
            <Button onClick={() => navigate("/doctor/login")}>
              Go to Doctor Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full"><Stethoscope className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <h1 className="text-xl font-bold leading-tight">Dr. {user?.user_metadata?.full_name}</h1>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 pt-4">
        {incomingRoomId && (
          <div className="mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Video Call</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button onClick={() => navigate(`/doctor/call?room=${encodeURIComponent(incomingRoomId)}`)} className="gap-2">
                  Accept & Join
                </Button>
                <Button variant="secondary" onClick={() => setIncomingRoomId(null)}>Dismiss</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Desktop: 3-column overview; Mobile: tabbed views */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {/* Profile */}
          <ProfileCard 
            doctorProfile={doctorProfile} 
            toggleOnlineStatus={toggleOnlineStatus} 
          />
          {/* Appointments */}
          <AppointmentsCard appointments={appointments} onAddPrescription={(id)=>navigate(`/doctor/prescription?appointment=${id}`)} />
          {/* Earnings */}
          <EarningsCard 
            earnings={earnings}
            payments={payments}
            loading={loadingEarnings || loadingPayments}
            onWithdrawOpen={() => setWithdrawOpen(true)} 
          />
        </div>

        {/* Mobile: Tab content */}
        <div className="lg:hidden space-y-4">
          {activeTab === 'appointments' && (
            <AppointmentsCard appointments={appointments} onAddPrescription={(id)=>navigate(`/doctor/prescription?appointment=${id}`)} />
          )}
          {activeTab === 'earnings' && (
            <EarningsCard 
              earnings={earnings}
              payments={payments}
              loading={loadingEarnings || loadingPayments}
              onWithdrawOpen={() => setWithdrawOpen(true)} 
            />
          )}
          {activeTab === 'profile' && (
            <ProfileCard doctorProfile={doctorProfile} toggleOnlineStatus={toggleOnlineStatus} />
          )}
        </div>
      </div>

      {/* Bottom Tab Bar (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-2 py-1 grid grid-cols-3 gap-1">
          <TabButton icon={<Home className="h-5 w-5" />} label="Appointments" active={activeTab==='appointments'} onClick={()=>setActiveTab('appointments')} />
          <TabButton icon={<Wallet className="h-5 w-5" />} label="Earnings" active={activeTab==='earnings'} onClick={()=>setActiveTab('earnings')} />
          <TabButton icon={<User className="h-5 w-5" />} label="Profile" active={activeTab==='profile'} onClick={()=>setActiveTab('profile')} />
        </div>
      </nav>

      {/* Withdraw Dialog - UI only */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="amount" placeholder="0.00" value={withdrawAmount} onChange={(e)=>setWithdrawAmount(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref">{withdrawMethod === 'bank' ? 'Account Number / IBAN' : withdrawMethod === 'upi' ? 'UPI ID' : 'PayPal Email'}</Label>
              <div className="relative">
                {withdrawMethod === 'bank' && <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                {withdrawMethod === 'upi' && <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                {withdrawMethod === 'paypal' && <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                <Input id="ref" placeholder="Enter details" value={accountRef} onChange={(e)=>setAccountRef(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setWithdrawOpen(false)}>Cancel</Button>
            <Button onClick={async ()=>{
              const amt = parseFloat(withdrawAmount || '0');
              if (!amt || amt <= 0) {
                toast({ title: 'Invalid amount', description: 'Enter a valid withdrawal amount', variant: 'destructive' });
                return;
              }
              if (!accountRef) {
                toast({ title: 'Missing details', description: 'Please provide account/UPI/PayPal reference', variant: 'destructive' });
                return;
              }
              try {
                const res = await (supabase as any)
                  .from('withdrawal_requests')
                  .insert({
                    doctor_id: doctorProfile.id,
                    amount: amt,
                    method: withdrawMethod,
                    account_ref: accountRef,
                    status: 'pending',
                  });
                if (res.error) throw res.error;
                toast({ title: 'Withdrawal Requested', description: 'We will process your request shortly.' });
                setWithdrawOpen(false);
                setWithdrawAmount('');
                setAccountRef('');
              } catch (e) {
                console.error(e);
                toast({ title: 'Request failed', description: 'Could not submit withdrawal request.', variant: 'destructive' });
              }
            }}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPortal;

// ---- Local UI subcomponents (UI-only) ----

type ProfileCardProps = {
  doctorProfile: DoctorProfile;
  toggleOnlineStatus: () => void;
};

const ProfileCard = ({ doctorProfile, toggleOnlineStatus }: ProfileCardProps) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Your Profile
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="font-semibold">{doctorProfile.specialization}</p>
        <p className="text-sm text-muted-foreground">{doctorProfile.department}</p>
      </div>
      <div className="flex justify-between"><span>Experience:</span><span>{doctorProfile.experience_years} years</span></div>
      <div className="flex justify-between"><span>Rating:</span><span>⭐ {doctorProfile.rating}/5</span></div>
      <div className="flex justify-between"><span>Fee:</span><span>${doctorProfile.consultation_fee}</span></div>
      <div className="pt-2">
        <Button 
          onClick={toggleOnlineStatus}
          className={`w-full gap-2 ${doctorProfile.is_online ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          <Activity className="h-4 w-4" />
          {doctorProfile.is_online ? 'Go Offline' : 'Go Online'}
        </Button>
        <Badge variant={doctorProfile.is_online ? 'default' : 'secondary'} className="w-full justify-center mt-2">
          Status: {doctorProfile.is_online ? 'Online' : 'Offline'}
        </Badge>
      </div>
    </CardContent>
  </Card>
);

type AppointmentsCardProps = {
  appointments: Appointment[];
  onAddPrescription: (id: string) => void;
};

const AppointmentsCard = ({ appointments, onAddPrescription }: AppointmentsCardProps) => (
  <Card className="col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Today's Appointments ({appointments.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      {appointments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No appointments scheduled for today</p>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="p-4 border rounded-lg bg-white">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-semibold">{appointment.patient_name}</h3>
                  <p className="text-sm text-muted-foreground">Age: {appointment.patient_age} | {appointment.appointment_time}</p>
                  {appointment.symptoms && (
                    <p className="text-sm mt-2"><span className="font-medium">Symptoms:</span> {appointment.symptoms}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={appointment.status === 'confirmed' ? 'default' : appointment.status === 'pending' ? 'secondary' : appointment.status === 'completed' ? 'outline' : 'destructive'}>
                    {appointment.status}
                  </Badge>
                  <Button size="sm" onClick={() => onAddPrescription(appointment.id)}>Add Prescription</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

type EarningsCardProps = {
  earnings: EarningsSummary;
  payments: PaymentHistoryItem[];
  loading?: boolean;
  onWithdrawOpen: () => void;
};

const currency = (v: number) => `₹${Number(v || 0).toFixed(2)}`;

const EarningsCard = ({ earnings, payments, loading, onWithdrawOpen }: EarningsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Wallet className="h-5 w-5" />
        Earnings Overview
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-green-50">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{currency(earnings.total_earnings)}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50">
          <p className="text-xs text-muted-foreground">This Month</p>
          <p className="text-lg font-semibold">{currency(earnings.month_earnings)}</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-semibold">{currency(earnings.pending_amount)}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Recent payments</p>
        <Button onClick={onWithdrawOpen} size="sm">Request Withdrawal</Button>
      </div>
      <div className="space-y-2 max-h-80 overflow-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="p-3 border rounded-md flex items-center justify-between">
              <div>
                <p className="font-medium">{p.patient_name || 'Patient'}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()} • {p.method.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{currency(p.amount)}</p>
                <Badge variant={p.status === 'completed' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'} className="mt-1">
                  {p.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
);

type TabButtonProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const TabButton = ({ icon, label, active, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 rounded-md ${active ? 'text-primary' : 'text-muted-foreground'}`}
  >
    <div className={`p-2 rounded-full ${active ? 'bg-primary/10' : 'bg-muted'}`}>{icon}</div>
    <span className="text-[11px] mt-1">{label}</span>
  </button>
);