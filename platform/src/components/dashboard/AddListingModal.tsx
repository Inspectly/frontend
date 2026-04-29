import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateListingMutation } from "@/features/api/listingsApi";
import { RootState } from "@/store/store";
import { Loader2 } from "lucide-react";

const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddListingModal = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [createListing, { isLoading }] = useCreateListingMutation();

  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    country: "Canada",
    postal_code: "",
  });

  const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

  const formatPostalCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length > 3) {
      return cleaned.slice(0, 3) + " " + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({ title: "Not logged in", variant: "destructive" });
      return;
    }

    if (!form.address || !form.city || !form.state || !form.postal_code) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    if (!postalCodeRegex.test(form.postal_code)) {
      toast({ title: "Invalid postal code format (e.g. A1A 1A1)", variant: "destructive" });
      return;
    }

    try {
      const result = await createListing({
        user_id: user.id,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        postal_code: form.postal_code,
      }).unwrap();

      toast({ title: "Property added successfully" });
      onOpenChange(false);
      setForm({ address: "", city: "", state: "", country: "Canada", postal_code: "" });
      navigate(`/dashboard/properties/${result.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create property";
      toast({ title: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Toronto"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="state">Province</Label>
              <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value="Canada" disabled />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                placeholder="A1A 1A1"
                value={form.postal_code}
                maxLength={7}
                onChange={(e) => setForm({ ...form, postal_code: formatPostalCode(e.target.value) })}
              />
            </div>
          </div>
          <Button type="submit" variant="gold" className="w-full gap-2" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Property
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddListingModal;
