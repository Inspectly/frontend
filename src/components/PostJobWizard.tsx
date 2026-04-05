import React, { useRef, useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useNavigate } from "react-router-dom";
import {
  Zap, Droplets, Home, Wind, Wrench, Settings,
  Paintbrush, Flame, TreeDeciduous, Shield, Sofa, Hammer, Building2, Thermometer, Bug,
  Layers, PaintBucket, HelpCircle,
  MapPin, ChevronRight, ChevronLeft, X, Plus, ImagePlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { useCreateIssueMutation } from "../features/api/issuesApi";
import { useCreateReportMutation, useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { useCreateListingMutation, useGetListingByIdQuery } from "../features/api/listingsApi";
import { useGetVendorTypesQuery } from "../features/api/vendorTypesApi";
import type { IssueStatus, IssueType, Listing, ReportType } from "../types";
import { normalizeAndCapitalize } from "../utils/typeNormalizer";
import { toast } from "react-hot-toast";

const COUNTRY_STATES: Record<string, { code: string; name: string }[]> = {
  Canada: [
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NS", name: "Nova Scotia" },
    { code: "NT", name: "Northwest Territories" },
    { code: "NU", name: "Nunavut" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
    { code: "YT", name: "Yukon" },
  ],
};
const CA_POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  electrical: Zap,
  electrician: Zap,
  plumbing: Droplets,
  plumber: Droplets,
  structural: Building2,
  foundation: Building2,
  hvac: Wind,
  roofing: Home,
  painting: Paintbrush,
  painter: Paintbrush,
  heating: Flame,
  cooling: Thermometer,
  landscaping: TreeDeciduous,
  security: Shield,
  interior: Sofa,
  exterior: Hammer,
  appliance: Wrench,
  cleaning: Wrench,
  cleaner: Wrench,
  pest_control: Bug,
  general_maintenance: Settings,
  general: Settings,
  insulation: Thermometer,
  drywall: Layers,
  plaster: PaintBucket,
  carpentry: Hammer,
  other: HelpCircle,
};
const TYPE_COLOR_MAP: Record<string, string> = {
  electrical: "bg-amber-100 text-amber-600",
  electrician: "bg-amber-100 text-amber-600",
  plumbing: "bg-blue-100 text-blue-600",
  plumber: "bg-blue-100 text-blue-600",
  structural: "bg-red-100 text-red-500",
  foundation: "bg-red-100 text-red-500",
  hvac: "bg-green-100 text-green-600",
  roofing: "bg-orange-100 text-orange-600",
  painting: "bg-pink-100 text-pink-600",
  painter: "bg-pink-100 text-pink-600",
  heating: "bg-red-100 text-red-500",
  cooling: "bg-cyan-100 text-cyan-600",
  landscaping: "bg-emerald-100 text-emerald-600",
  security: "bg-indigo-100 text-indigo-600",
  interior: "bg-violet-100 text-violet-600",
  exterior: "bg-stone-100 text-stone-600",
  appliance: "bg-slate-100 text-slate-600",
  cleaning: "bg-teal-100 text-teal-600",
  cleaner: "bg-teal-100 text-teal-600",
  pest_control: "bg-lime-100 text-lime-700",
  general_maintenance: "bg-gray-100 text-gray-600",
  general: "bg-gray-100 text-gray-600",
  insulation: "bg-yellow-100 text-yellow-700",
  drywall: "bg-stone-100 text-stone-600",
  plaster: "bg-amber-100 text-amber-700",
  carpentry: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-500",
};

type Props = {
  open: boolean;
  onClose: () => void;
  listings: Listing[];
  reports?: ReportType[];
  currentListing?: Listing;
};

const PostJobWizard: React.FC<Props> = ({ open, onClose, listings, reports: propReports, currentListing }) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: fetchedVendorTypes } = useGetVendorTypesQuery();
  const { data: userReports } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });
  const reports = propReports ?? (Array.isArray(userReports) ? userReports : []);
  const [createIssue, { isLoading: isCreatingIssue }] = useCreateIssueMutation();
  const [createReport] = useCreateReportMutation();
  const [createListing, { isLoading: isCreatingListing }] = useCreateListingMutation();

  const [step, setStep] = useState(1);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [createdIssue, setCreatedIssue] = useState<IssueType | null>(null);

  // Fetch full listing details (including image_url) when a listing is selected
  const { data: fullListing } = useGetListingByIdQuery(selectedListing?.id ?? 0, { skip: !selectedListing?.id });
  const listingImage = fullListing?.image_url || selectedListing?.image_url || "";

  const [newProp, setNewProp] = useState({ address: "", city: "", state: "", country: "Canada", postal_code: "" });
  const [newPropImage, setNewPropImage] = useState<string>("");
  const newPropFileRef = useRef<HTMLInputElement | null>(null);

  const [issueType, setIssueType] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [active, setActive] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const safeListings = useMemo(() => (Array.isArray(listings) ? listings : []), [listings]);

  const vendorTypes = useMemo(() => {
    if (!fetchedVendorTypes) return [];
    return fetchedVendorTypes.map((vt) => ({
      value: vt.vendor_type,
      label: normalizeAndCapitalize(vt.vendor_type),
      icon: TYPE_ICON_MAP[vt.vendor_type.toLowerCase()] || Settings,
      color: TYPE_COLOR_MAP[vt.vendor_type.toLowerCase()] || "bg-gray-100 text-gray-600",
    }));
  }, [fetchedVendorTypes]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedListing(currentListing ?? (safeListings.length === 1 ? safeListings[0] : null));
    setShowAddProperty(safeListings.length === 0 && !currentListing);
    setNewProp({ address: "", city: "", state: "", country: "Canada", postal_code: "" });
    setNewPropImage("");
    setIssueType("");
    setSummary("");
    setDescription("");
    setSeverity("");
    setActive(true);
    setImageFiles([]);
    setImagePreviews([]);
    setCreatedIssue(null);
  }, [open, currentListing, safeListings]);

  if (!open) return null;

  const availableStates = COUNTRY_STATES[newProp.country] || [];

  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/gi, "");
    if (v.length > 3) v = `${v.slice(0, 3)} ${v.slice(3, 6)}`;
    setNewProp((p) => ({ ...p, postal_code: v }));
  };

  const handleCreateProperty = async () => {
    if (!newProp.address || !newProp.city || !newProp.state || !newProp.postal_code) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newProp.country === "Canada" && !CA_POSTAL_REGEX.test(newProp.postal_code)) {
      toast.error("Please enter a valid Canadian postal code (e.g., A1A 1A1).");
      return;
    }
    if (!user?.id) {
      toast.error("You must be logged in to create a property.");
      return;
    }
    try {
      const created = await createListing({
        ...newProp,
        user_id: user.id,
        ...(newPropImage ? { image_url: newPropImage } : {}),
      }).unwrap();

      const newListingId = created?.id ?? (created as any)?.listing_id ?? null;
      if (newListingId) {
        const listing: Listing = {
          id: newListingId,
          user_id: user.id,
          address: newProp.address,
          city: newProp.city,
          state: newProp.state,
          country: newProp.country,
          postal_code: newProp.postal_code,
          image_url: (created as any)?.image_url ?? newPropImage ?? "",
          created_at: (created as any)?.created_at ?? new Date().toISOString(),
          updated_at: (created as any)?.updated_at ?? new Date().toISOString(),
        };
        setSelectedListing(listing);
        setShowAddProperty(false);
        setNewProp({ address: "", city: "", state: "", country: "Canada", postal_code: "" });
        setNewPropImage("");
        toast.success("Property created!");
      } else {
        console.error("Could not resolve new listing id from response:", created);
        toast.error("Property was created but couldn't be selected. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to create listing:", err);
      const msg = err?.data?.detail?.[0]?.msg || err?.data?.detail || "Failed to create property.";
      toast.error(typeof msg === "string" ? msg : "Failed to create property.");
    }
  };

  const getOrCreateReportId = async (listingId: number): Promise<number> => {
    const jobsReport = reports.find((r: ReportType) => {
      if (Number(r.listing_id) !== listingId) return false;
      const name = (r.name || "").toLowerCase();
      return name === "my posted jobs" || name === "jobs";
    });
    if (jobsReport) return jobsReport.id;
    const created = await createReport({
      user_id: user?.id,
      listing_id: listingId,
      name: "My Posted Jobs",
    }).unwrap();
    return created.id;
  };

  const handleSubmit = async () => {
    if (!selectedListing || !issueType || !summary || !severity) return;

    try {
      const reportId = await getOrCreateReportId(selectedListing.id);
      const severityMap: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

      const base64Images = await Promise.all(
        imageFiles.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      const submittedData: Record<string, any> = {
        report_id: reportId,
        listing_id: selectedListing.id,
        type: issueType,
        summary,
        description,
        severity: severityMap[severity.toLowerCase()] || "None",
        status: "open" as IssueStatus,
        active,
      };

      if (base64Images.length === 1) {
        submittedData.image_url = base64Images[0];
      } else if (base64Images.length > 1) {
        submittedData.image_urls = base64Images;
      }

      const apiResponse = await createIssue(submittedData).unwrap();
      const rawStatus = (apiResponse.status || "open") as string;
      const normalizedStatus = rawStatus.startsWith("Status.") ? rawStatus : `Status.${rawStatus.toUpperCase()}`;
      const fullIssue: IssueType = {
        ...submittedData,
        ...apiResponse,
        status: normalizedStatus as IssueStatus,
        image_urls: apiResponse.image_urls || ((apiResponse as any).image_url ? [(apiResponse as any).image_url] : base64Images),
      } as IssueType;

      setCreatedIssue(fullIssue);
      setStep(3);
    } catch (err: any) {
      console.error("Failed to create issue:", err);
      toast.error(err?.data?.detail?.[0]?.msg || "Failed to create issue.");
    }
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setImageFiles((p) => [...p, ...newFiles]);
    setImagePreviews((p) => [...p, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles((p) => p.filter((_, i) => i !== idx));
    setImagePreviews((p) => p.filter((_, i) => i !== idx));
  };

  const canContinue = !!selectedListing;
  const canSubmit = !!issueType && !!summary && !!severity && !isCreatingIssue;

  const selectedAddress = selectedListing
    ? `${selectedListing.address}, ${selectedListing.city}, ${selectedListing.state}`
    : "";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar + close */}
        <div className="px-6 pt-5 pb-0 flex items-center gap-3">
          <div className="flex-1 flex gap-2">
            <div className={`h-1.5 rounded-full flex-1 ${step >= 1 ? "bg-primary" : "bg-gray-200"}`} />
            <div className={`h-1.5 rounded-full flex-1 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`} />
            <div className={`h-1.5 rounded-full flex-1 ${step >= 3 ? "bg-primary" : "bg-gray-200"}`} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Where's the property?</h2>
              <p className="text-sm text-gray-500 mb-6">Enter the address so we can match you with local pros.</p>

              {/* Address display — only highlighted when a property is selected */}
              {selectedListing ? (
                <div className="relative mb-4">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={selectedAddress}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-primary/40 bg-primary/5 text-sm text-gray-900 focus:outline-none cursor-default"
                  />
                </div>
              ) : !showAddProperty ? (
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary/40 hover:bg-primary/5 transition-all mb-4 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Add a property</p>
                    <p className="text-xs text-gray-500">Enter your address to get started</p>
                  </div>
                </button>
              ) : null}

              {!showAddProperty && safeListings.length > 0 && !selectedListing && (
                <>
                  {/* Property dropdown — show when properties exist but none selected */}
                  <div className="mb-3">
                    <select
                      value=""
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const listing = safeListings.find((l) => l.id === id);
                        if (listing) setSelectedListing(listing);
                      }}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                    >
                      <option value="" disabled>Choose a property...</option>
                      {safeListings.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.address}, {l.city}, {l.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add new property link */}
                  <button
                    onClick={() => setShowAddProperty(true)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-4"
                  >
                    <Plus className="w-4 h-4" /> Add new property
                  </button>
                </>
              )}

              {/* Change / add property links when a property is already selected */}
              {!showAddProperty && selectedListing && safeListings.length > 1 && (
                <div className="mb-4">
                  <div className="mb-2">
                    <select
                      value={selectedListing.id}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const listing = safeListings.find((l) => l.id === id);
                        if (listing) setSelectedListing(listing);
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                    >
                      {safeListings.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.address}, {l.city}, {l.state}
                        </option>
                      ))}
                      {!safeListings.find((l) => l.id === selectedListing.id) && (
                        <option value={selectedListing.id}>
                          {selectedListing.address}, {selectedListing.city}, {selectedListing.state}
                        </option>
                      )}
                    </select>
                  </div>
                  <button
                    onClick={() => setShowAddProperty(true)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="w-4 h-4" /> Add new property
                  </button>
                </div>
              )}
              {!showAddProperty && selectedListing && safeListings.length <= 1 && (
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-4"
                >
                  <Plus className="w-4 h-4" /> Add new property
                </button>
              )}

              {/* Inline add property form */}
              {showAddProperty && (
                <div className="border border-primary/30 rounded-xl p-4 mb-4 bg-primary/5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Add new property</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Address"
                      value={newProp.address}
                      onChange={(e) => setNewProp((p) => ({ ...p, address: e.target.value }))}
                      className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newProp.city}
                        onChange={(e) => setNewProp((p) => ({ ...p, city: e.target.value }))}
                        className="h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                      <select
                        value={newProp.country}
                        onChange={(e) => setNewProp((p) => ({ ...p, country: e.target.value, state: "" }))}
                        className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                      >
                        {Object.keys(COUNTRY_STATES).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newProp.state}
                        onChange={(e) => setNewProp((p) => ({ ...p, state: e.target.value }))}
                        className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                      >
                        <option value="" disabled>Select state/province</option>
                        {availableStates.map((s) => (
                          <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={newProp.country === "Canada" ? "A1A 1A1" : "Postal Code"}
                        value={newProp.postal_code}
                        onChange={handlePostalChange}
                        className="h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    {/* Property photo */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Property Photo (optional)</label>
                      {newPropImage ? (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-gray-200">
                          <img src={newPropImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setNewPropImage(""); if (newPropFileRef.current) newPropFileRef.current.value = ""; }}
                            className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => newPropFileRef.current?.click()}
                          className="w-full h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm"
                        >
                          <ImagePlus className="w-4 h-4" /> Upload photo
                        </button>
                      )}
                      <input
                        ref={newPropFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => setNewPropImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="gold"
                        className="flex-1"
                        onClick={handleCreateProperty}
                        disabled={isCreatingListing}
                      >
                        {isCreatingListing ? "Creating..." : "Create Property"}
                      </Button>
                      {safeListings.length > 0 && (
                        <Button variant="outline" onClick={() => setShowAddProperty(false)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Property image — shows selected property's image or a placeholder */}
              <div className="rounded-xl overflow-hidden mt-2">
                <img
                  src={listingImage || "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=500&h=250&fit=crop"}
                  alt={selectedListing ? selectedListing.address : "Property"}
                  className="w-full h-40 object-cover rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=500&h=250&fit=crop"; }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Describe the issue</h2>
              <p className="text-sm text-gray-500 mb-6">Tell us what needs fixing so vendors can give accurate quotes.</p>

              {/* Type of work */}
              <p className="text-sm font-semibold text-gray-900 mb-3">What type of work?</p>
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {vendorTypes.map((vt) => {
                  const Icon = vt.icon;
                  const isSelected = issueType === vt.value;
                  return (
                    <button
                      key={vt.value}
                      type="button"
                      onClick={() => setIssueType(vt.value)}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vt.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{vt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick summary */}
              <p className="text-sm font-semibold text-gray-900 mb-2">Quick summary</p>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Kitchen faucet is leaking"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />

              {/* More details */}
              <p className="text-sm font-semibold text-gray-900 mb-2">More details (optional)</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When did it start? How bad is it? Any relevant details..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />

              {/* Severity */}
              <p className="text-sm font-semibold text-gray-900 mb-3">How urgent is this?</p>
              <div className="space-y-2.5 mb-5">
                {[
                  { value: "low", label: "Low", desc: "Not urgent — can wait a few weeks", dot: "bg-emerald-500" },
                  { value: "medium", label: "Medium", desc: "Should be addressed soon", dot: "bg-amber-500" },
                  { value: "high", label: "High", desc: "Needs immediate attention", dot: "bg-red-500" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                      severity === s.value
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Marketplace toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 mb-5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">List on marketplace</p>
                  <p className="text-xs text-gray-500">Let verified vendors send you quotes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                    active ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                      active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Photos */}
              <p className="text-sm font-semibold text-primary mb-3">Photos (optional)</p>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">Add</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageAdd}
                />
                {imagePreviews.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && createdIssue && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Issue submitted!</h2>
              <p className="text-sm text-gray-600 mb-1">
                Your {normalizeAndCapitalize(createdIssue.type || "")} issue at{" "}
                <span className="font-semibold">{selectedListing?.address}, {selectedListing?.city}, {selectedListing?.state}</span>{" "}
                has been posted.
              </p>
              {active && (
                <p className="text-sm text-primary font-medium mb-5">
                  Verified vendors in your area will start sending quotes shortly.
                </p>
              )}
              <div className="rounded-xl overflow-hidden w-full mb-2">
                <img
                  src={listingImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=250&fit=crop"}
                  alt={selectedListing?.address || "Property"}
                  className="w-full h-40 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=250&fit=crop"; }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {step === 1 ? (
            <>
              <div />
              <Button variant="gold" disabled={!canContinue} onClick={() => setStep(2)}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button variant="gold" disabled={!canSubmit} onClick={handleSubmit}>
                {isCreatingIssue ? "Submitting..." : "Submit Issue"} <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 mr-2"
                onClick={() => {
                  setCreatedIssue(null);
                  setStep(1);
                  setIssueType("");
                  setSummary("");
                  setDescription("");
                  setSeverity("");
                  setActive(true);
                  setImageFiles([]);
                  setImagePreviews([]);
                }}
              >
                Post Another
              </Button>
              <Button
                variant="gold"
                className="flex-1 ml-2"
                onClick={() => {
                  if (createdIssue) {
                    navigate(`/listings/${createdIssue.listing_id}/reports/${createdIssue.report_id}`, { state: { openIssue: createdIssue } });
                  }
                  onClose();
                }}
              >
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostJobWizard;
