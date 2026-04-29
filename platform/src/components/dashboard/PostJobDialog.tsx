import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X, MapPin, ChevronRight, ChevronLeft, Check, Zap, Droplets, Wrench, Thermometer, Home as HomeIcon, PenTool } from "lucide-react";

import { useCreateIssueMutation, useUploadImageMutation } from "@/features/api/issuesApi";
import { Loader2 } from "lucide-react";

interface PostJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress?: string;
  listingId?: number;
}

const issueTypes = [
  { label: "Electrical", icon: Zap, color: "bg-amber-100 text-amber-700" },
  { label: "Plumbing", icon: Droplets, color: "bg-blue-100 text-blue-700" },
  { label: "Structural", icon: HomeIcon, color: "bg-red-100 text-red-700" },
  { label: "HVAC", icon: Thermometer, color: "bg-teal-100 text-teal-700" },
  { label: "Roofing", icon: Wrench, color: "bg-orange-100 text-orange-700" },
  { label: "General Maintenance", icon: PenTool, color: "bg-violet-100 text-violet-700" },
];

const severities = [
  { label: "Low", description: "Not urgent — can wait a few weeks", dot: "bg-green-500" },
  { label: "Medium", description: "Should be addressed soon", dot: "bg-amber-500" },
  { label: "High", description: "Needs immediate attention", dot: "bg-red-500" },
];

const PostJobDialog = ({ open, onOpenChange, propertyAddress, listingId }: PostJobDialogProps) => {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(propertyAddress || "");
  const [type, setType] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [active, setActive] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [createIssue] = useCreateIssueMutation();
  const [uploadImage] = useUploadImageMutation();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setImageFiles((prev) => [...prev, file]);
      setImagePreviews((prev) => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setStep(1);
    setType("");
    setSummary("");
    setDescription("");
    setSeverity("");
    setActive(true);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setSubmitting(false);
    if (!propertyAddress) setAddress("");
  };

  const handleSubmit = async () => {
    if (!listingId) return;
    setSubmitting(true);
    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const uploadResults = await Promise.all(
          imageFiles.map((file) => uploadImage(file).unwrap())
        );
        imageUrls = uploadResults.map((r) => r.url);
      }

      await createIssue({
        listing_id: listingId,
        type: type.toLowerCase(),
        status: "open",
        active,
        summary,
        description: description || undefined,
        severity,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      }).unwrap();

      setStep(3);
    } catch (err) {
      console.error("Failed to create issue:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      resetForm();
      onOpenChange(false);
    }
  };

  const canProceedStep1 = address.trim().length > 0;
  const canProceedStep2 = type && summary.trim() && severity;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Progress bar */}
        <div className="flex gap-1.5 px-6 pt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  s <= step ? "bg-primary w-full" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step 1: Address */}
        {step === 1 && (
          <div className="px-6 pb-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-display">Where's the property?</DialogTitle>
              <DialogDescription>Enter the address so we can match you with local pros.</DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. 123 Main Street, Toronto, ON"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>

              {/* Quick suggestions */}
              {propertyAddress && (
                <button
                  onClick={() => setAddress(propertyAddress)}
                  className="flex items-center gap-2.5 w-full p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <HomeIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Use current property</p>
                    <p className="text-xs text-muted-foreground">{propertyAddress}</p>
                  </div>
                </button>
              )}

              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=200&fit=crop"
                alt="Suburban homes"
                className="w-full h-32 object-cover rounded-xl mt-4"
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="gold" disabled={!canProceedStep1} onClick={() => setStep(2)} className="gap-1.5">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Issue Details */}
        {step === 2 && (
          <div className="px-6 pb-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-display">Describe the issue</DialogTitle>
              <DialogDescription>Tell us what needs fixing so vendors can give accurate quotes.</DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-5">
              {/* Issue type grid */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">What type of work?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {issueTypes.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setType(t.label)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                        type === t.label
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg ${t.color} flex items-center justify-center`}>
                        <t.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-medium text-foreground leading-tight text-center">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Quick summary</Label>
                <Input placeholder="e.g. Kitchen faucet is leaking" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  More details <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea placeholder="When did it start? How bad is it? Any relevant details..." className="min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">How urgent is this?</Label>
                <div className="space-y-2">
                  {severities.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setSeverity(s.label)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        severity === s.label
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/20"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${s.dot} shrink-0`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Marketplace toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-sm font-semibold text-foreground">List on marketplace</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Let verified vendors send you quotes</p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Photos <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="flex flex-wrap gap-2.5">
                  {imagePreviews.map((url, i) => (
                    <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-foreground/70 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="h-16 w-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground mt-0.5">Add</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="gold" disabled={!canProceedStep2 || submitting} onClick={handleSubmit} className="gap-1.5">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Issue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="px-6 pb-6">
            <div className="flex flex-col items-center text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">Issue submitted!</h2>
              <p className="text-sm text-muted-foreground max-w-xs mb-2">
                Your {type.toLowerCase()} issue at <span className="font-medium text-foreground">{address}</span> has been posted.
              </p>
              {active && (
                <p className="text-xs text-primary font-medium">
                  Verified vendors in your area will start sending quotes shortly.
                </p>
              )}

              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=200&fit=crop"
                alt="Professional at work"
                className="w-full h-36 object-cover rounded-xl mt-6 mb-6"
              />

              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => { resetForm(); }}>
                  Post Another
                </Button>
                <Button variant="gold" className="flex-1" onClick={() => handleClose(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostJobDialog;
