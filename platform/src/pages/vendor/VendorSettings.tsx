import { useState } from "react";
import { Shield, Bell, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const VendorSettings = () => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-muted/50 h-9 mb-6">
          <TabsTrigger value="profile" className="text-sm px-4">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm px-4">Notifications</TabsTrigger>
          <TabsTrigger value="verification" className="text-sm px-4">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-border">
            <CardContent className="p-6 space-y-6">
              {/* Cover + Avatar */}
              <div className="relative">
                <div className="h-28 rounded-xl overflow-hidden bg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=200&fit=crop"
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 left-5">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face"
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover border-4 border-background"
                    />
                    <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm font-semibold text-foreground">Mike's Electrical</p>
                <p className="text-xs text-muted-foreground">Licensed Electrician · ESA Certified</p>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Business Name</Label>
                  <Input defaultValue="Mike's Electrical" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact Name</Label>
                  <Input defaultValue="Mike Thompson" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input defaultValue="mike@mikeselectrical.ca" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input defaultValue="(519) 555-0142" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Service Area</Label>
                  <Input defaultValue="London, ON — 50km radius" className="h-9 text-sm" />
                </div>
              </div>

              <Button variant="gold" size="sm">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              {[
                { label: "Email Notifications", desc: "Receive updates about jobs and payments via email", checked: emailNotif, onChange: setEmailNotif },
                { label: "SMS Notifications", desc: "Get text alerts for urgent job requests", checked: smsNotif, onChange: setSmsNotif },
                { label: "New Job Alerts", desc: "Get notified when new jobs matching your expertise are posted", checked: jobAlerts, onChange: setJobAlerts },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.onChange} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">ESA License Verified</p>
                  <p className="text-xs text-muted-foreground">License #7890123 · Expires Dec 2026</p>
                </div>
                <Badge className="bg-green-100 text-green-700 text-[10px]">Verified</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Liability Insurance</p>
                  <p className="text-xs text-muted-foreground">$2M coverage · Aviva Canada</p>
                </div>
                <Badge className="bg-green-100 text-green-700 text-[10px]">Verified</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">WSIB Coverage</p>
                  <p className="text-xs text-muted-foreground">Upload your WSIB clearance certificate</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">Upload</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorSettings;
