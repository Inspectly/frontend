import { ScrollText, Calendar, Shield, FileText, AlertTriangle, Users, Scale } from "lucide-react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: "By accessing or using Inspectly's services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our platform. We reserve the right to modify these terms at any time, and continued use of the platform constitutes acceptance of any changes.",
  },
  {
    icon: Users,
    title: "2. User Accounts",
    content: "You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information when creating an account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate our terms.",
  },
  {
    icon: Shield,
    title: "3. Privacy & Data Protection",
    content: "We collect and process personal data in accordance with our Privacy Policy. Your property data, inspection reports, and communication with vendors are encrypted and stored securely. We do not sell your personal information to third parties. You may request deletion of your data at any time.",
  },
  {
    icon: Scale,
    title: "4. Vendor Relationships",
    content: "Inspectly acts as a marketplace connecting homeowners with service vendors. We verify vendor credentials but do not guarantee the quality of work performed. Any agreements made between homeowners and vendors are independent contracts. Inspectly is not liable for disputes between parties.",
  },
  {
    icon: AlertTriangle,
    title: "5. Limitation of Liability",
    content: "Inspectly provides the platform 'as is' without warranties of any kind. We are not responsible for the accuracy of inspection reports uploaded by users. Our liability is limited to the amount you have paid for our services in the preceding 12 months. We are not liable for indirect, incidental, or consequential damages.",
  },
  {
    icon: ScrollText,
    title: "6. Intellectual Property",
    content: "All content, trademarks, and data on the Inspectly platform are the property of Inspectly Inc. Users retain ownership of their uploaded content but grant Inspectly a license to use it for platform operation. You may not reproduce or distribute any part of the platform without written permission.",
  },
];

const Terms = () => {
  const location = useLocation();
  const isStandalone = location.pathname === "/terms";

  const content = (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-up">
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ScrollText className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Terms & Conditions
        </h1>
        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-2">
          <Calendar className="h-3.5 w-3.5" />
          Last updated: March 1, 2026
        </div>
      </div>

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Please read these terms carefully before using Inspectly. By using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-sm mb-2">{section.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8">
        If you have questions about these terms, please{" "}
        <a href="/contact" className="text-primary hover:underline">contact us</a>.
      </p>
    </div>
  );

  if (isStandalone) {
    return (
      <>
        <Navbar />
        {content}
        <Footer />
      </>
    );
  }

  return content;
};

export default Terms;
