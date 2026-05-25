import React, { useRef, useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useNavigate } from "react-router-dom";
import {
  Zap, Droplets, Home, Wind, Wrench, Settings,
  Paintbrush, Flame, TreeDeciduous, Shield, Sofa, Hammer, Building2, Thermometer, Bug,
  Layers, PaintBucket, HelpCircle,
  MapPin, ChevronRight, ChevronLeft, X, Plus, ImagePlus, Check, Search,
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

const SEVERITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    desc: "Not urgent — can wait a few weeks",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
  },
  {
    value: "medium",
    label: "Medium",
    desc: "Should be addressed soon",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
  },
  {
    value: "high",
    label: "High",
    desc: "Needs immediate attention",
    dot: "bg-red-500",
    ring: "ring-red-500/30",
  },
];

const SUMMARY_MAX = 80;
const SUMMARY_MIN = 5;
const TOTAL_STEPS = 5;

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  open: boolean;
  onClose: () => void;
  listings: Listing[];
  reports?: ReportType[];
  currentListing?: Listing;
  currentReportId?: number;
  /** Optional vendor_type slug to pre-select (e.g. from Quick Action Hub deep links). */
  initialType?: string;
};

const PostJobWizard: React.FC<Props> = ({ open, onClose, listings, reports: propReports, currentListing, currentReportId, initialType }) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: fetchedVendorTypes } = useGetVendorTypesQuery();
  const { data: userReports } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });
  const reports = propReports ?? (Array.isArray(userReports) ? userReports : []);
  const [createIssue, { isLoading: isCreatingIssue }] = useCreateIssueMutation();
  const [createReport] = useCreateReportMutation();
  const [createListing, { isLoading: isCreatingListing }] = useCreateListingMutation();

  const [step, setStep] = useState<Step>(1);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [propertyQuery, setPropertyQuery] = useState("");
  const [createdIssue, setCreatedIssue] = useState<IssueType | null>(null);

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

  const sortedListings = useMemo(() => {
    return [...safeListings].sort((a, b) => {
      const aT = new Date(a.updated_at || a.created_at || 0).getTime();
      const bT = new Date(b.updated_at || b.created_at || 0).getTime();
      return bT - aT;
    });
  }, [safeListings]);

  const filteredListings = useMemo(() => {
    const q = propertyQuery.trim().toLowerCase();
    if (!q) return sortedListings;
    return sortedListings.filter((l) => {
      const haystack = [l.address, l.city, l.state, l.postal_code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sortedListings, propertyQuery]);

  const showPropertySearch = safeListings.length > 5;

  const vendorTypes = useMemo(() => {
    if (!fetchedVendorTypes) return [];
    return fetchedVendorTypes.map((vt) => ({
      value: vt.vendor_type,
      label: normalizeAndCapitalize(vt.vendor_type),
      icon: TYPE_ICON_MAP[vt.vendor_type.toLowerCase()] || Settings,
      color: TYPE_COLOR_MAP[vt.vendor_type.toLowerCase()] || "bg-gray-100 text-gray-600",
    }));
  }, [fetchedVendorTypes]);

  const resetIssueFields = () => {
    setIssueType("");
    setSummary("");
    setDescription("");
    setSeverity("");
    setActive(true);
    setImageFiles([]);
    setImagePreviews([]);
  };

  useEffect(() => {
    if (!open) return;
    setSelectedListing(currentListing ?? (safeListings.length === 1 ? safeListings[0] : null));
    setShowAddProperty(safeListings.length === 0 && !currentListing);
    setPropertyQuery("");
    setNewProp({ address: "", city: "", state: "", country: "Canada", postal_code: "" });
    setNewPropImage("");
    resetIssueFields();
    setCreatedIssue(null);
    // Skip property selection step when launched from within a property
    setStep(currentListing ? 2 : 1);
    if (initialType) setIssueType(initialType);
  }, [open, currentListing, safeListings, initialType]);

  if (!open) return null;

  const availableStates = COUNTRY_STATES[newProp.country] || [];

  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/gi, "");
    if (v.length > 3) v = `${v.slice(0, 3)} ${v.slice(3, 6)}`;
    setNewProp((p) => ({ ...p, postal_code: v }));
  };

  const handleCreateProperty = async (): Promise<Listing | null> => {
    if (!newProp.address || !newProp.city || !newProp.state || !newProp.postal_code) {
      toast.error("Please fill in all fields.");
      return null;
    }
    if (newProp.country === "Canada" && !CA_POSTAL_REGEX.test(newProp.postal_code)) {
      toast.error("Please enter a valid Canadian postal code (e.g., A1A 1A1).");
      return null;
    }
    if (!user?.id) {
      toast.error("You must be logged in to create a property.");
      return null;
    }
    try {
      const created = await createListing({
        ...newProp,
        user_id: user.id,
        ...(newPropImage ? { image_url: newPropImage } : {}),
      }).unwrap();

      const newListingId = created?.id ?? (created as any)?.listing_id ?? null;
      if (!newListingId) {
        console.error("Could not resolve new listing id from response:", created);
        toast.error("Property was created but couldn't be selected. Please try again.");
        return null;
      }
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
      return listing;
    } catch (err: any) {
      console.error("Failed to create listing:", err);
      const msg = err?.data?.detail?.[0]?.msg || err?.data?.detail || "Failed to create property.";
      toast.error(typeof msg === "string" ? msg : "Failed to create property.");
      return null;
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
      const reportId = currentReportId ?? await getOrCreateReportId(selectedListing.id);
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
        image_urls: base64Images,
      };

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
      setStep(6);
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

  const trimmedSummary = summary.trim();
  const summaryValid = trimmedSummary.length >= SUMMARY_MIN;

  const canAdvanceStep1 = showAddProperty
    ? false
    : !!selectedListing;
  const canAdvanceStep2 = !!issueType;
  const canAdvanceStep3 = !!severity;
  const canAdvanceStep4 = summaryValid;

  const handleContinue = async () => {
    if (step === 1) {
      if (showAddProperty) {
        const created = await handleCreateProperty();
        if (created) setStep(2);
        return;
      }
      if (canAdvanceStep1) setStep(2);
      return;
    }
    if (step === 2 && canAdvanceStep2) setStep(3);
    else if (step === 3 && canAdvanceStep3) setStep(4);
    else if (step === 4 && canAdvanceStep4) setStep(5);
  };

  const handleBack = () => {
    if (step === 1 && showAddProperty && safeListings.length > 0) {
      setShowAddProperty(false);
      return;
    }
    // When launched from a property, step 2 is the first step — back should close
    if (step === 2 && currentListing) {
      onClose();
      return;
    }
    if (step > 1) setStep((step - 1) as Step);
  };

  const continueLabel =
    step === 1 && showAddProperty
      ? isCreatingListing
        ? "Creating..."
        : "Create & Continue"
      : "Continue";

  const continueDisabled =
    (step === 1 && showAddProperty && isCreatingListing) ||
    (step === 1 && !showAddProperty && !canAdvanceStep1) ||
    (step === 2 && !canAdvanceStep2) ||
    (step === 3 && !canAdvanceStep3) ||
    (step === 4 && !canAdvanceStep4);

  const backDisabled =
    step === 6 ||
    (step === 1 && (!showAddProperty || safeListings.length === 0)) ||
    (step === 2 && !!currentListing);

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
          <div className="flex-1 flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const idx = i + 1;
              const isActive = step >= idx && step <= TOTAL_STEPS;
              const isDone = step > idx || step === 6;
              return (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full flex-1 transition-colors ${
                    isDone || isActive ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step !== 6 && (
          <div className="px-6 pt-3 pb-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Step {step} of {TOTAL_STEPS}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {/* STEP 1: PROPERTY */}
          {step === 1 && (
            <div>
              {showAddProperty ? (
                <>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">
                    {safeListings.length === 0 ? "Let's add your property" : "Add a new property"}
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    {safeListings.length === 0
                      ? "We'll use this address to match you with local pros."
                      : "Add another address you own or manage."}
                  </p>

                  {safeListings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProperty(false);
                        setNewProp({ address: "", city: "", state: "", country: "Canada", postal_code: "" });
                        setNewPropImage("");
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 mb-4"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to your properties
                    </button>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Street address</label>
                      <input
                        type="text"
                        placeholder="123 Main St"
                        value={newProp.address}
                        onChange={(e) => setNewProp((p) => ({ ...p, address: e.target.value }))}
                        className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">City</label>
                        <input
                          type="text"
                          placeholder="Toronto"
                          value={newProp.city}
                          onChange={(e) => setNewProp((p) => ({ ...p, city: e.target.value }))}
                          className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Country</label>
                        <select
                          value={newProp.country}
                          onChange={(e) => setNewProp((p) => ({ ...p, country: e.target.value, state: "" }))}
                          className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                        >
                          {Object.keys(COUNTRY_STATES).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">State / Province</label>
                        <select
                          value={newProp.state}
                          onChange={(e) => setNewProp((p) => ({ ...p, state: e.target.value }))}
                          className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                        >
                          <option value="" disabled>Select…</option>
                          {availableStates.map((s) => (
                            <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Postal code</label>
                        <input
                          type="text"
                          placeholder={newProp.country === "Canada" ? "A1A 1A1" : "Postal code"}
                          value={newProp.postal_code}
                          onChange={handlePostalChange}
                          className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Property photo (optional)</label>
                      {newPropImage ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                          <img src={newPropImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setNewPropImage(""); if (newPropFileRef.current) newPropFileRef.current.value = ""; }}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow-md"
                            aria-label="Remove photo"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => newPropFileRef.current?.click()}
                          className="w-full h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm font-medium"
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
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Which property is this for?</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {safeListings.length === 1
                      ? "Confirm your property or add a new one."
                      : showPropertySearch
                      ? `Search across your ${safeListings.length} properties or add a new one.`
                      : "Pick a property or add a new one."}
                  </p>

                  {showPropertySearch && (
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={propertyQuery}
                        onChange={(e) => setPropertyQuery(e.target.value)}
                        placeholder="Search by address, city, or postal code"
                        className="w-full h-10 pl-9 pr-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        autoFocus
                      />
                      {propertyQuery && (
                        <button
                          type="button"
                          onClick={() => setPropertyQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                          aria-label="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {filteredListings.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        No properties match <span className="font-semibold">"{propertyQuery}"</span>.
                      </p>
                      <p className="text-xs text-gray-400 mb-3">Add it as a new property to continue.</p>
                      <button
                        type="button"
                        onClick={() => {
                          const q = propertyQuery.trim();
                          if (q) setNewProp((p) => ({ ...p, address: q }));
                          setShowAddProperty(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        <Plus className="w-4 h-4" /> Add as new property
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`space-y-2.5 mb-3 ${
                        safeListings.length > 4 ? "max-h-72 overflow-y-auto -mr-2 pr-2" : ""
                      }`}
                    >
                      {filteredListings.map((listing) => {
                        const isSelected = selectedListing?.id === listing.id;
                        return (
                          <button
                            key={listing.id}
                            type="button"
                            onClick={() => {
                              setSelectedListing(listing);
                              setTimeout(() => setStep(2), 300);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            aria-pressed={isSelected}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {listing.image_url ? (
                                <img
                                  src={listing.image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{listing.address}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {[listing.city, listing.state, listing.postal_code].filter(Boolean).join(", ")}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddProperty(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Add a new property
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 2: TYPE OF WORK */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">What kind of work is needed?</h2>
              <p className="text-sm text-gray-500 mb-5">
                Pick the closest match — vendors filter by category.
              </p>

              {selectedListing && (
                <div className="flex items-center gap-2 mb-5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate">{selectedAddress}</span>
                </div>
              )}

              {vendorTypes.length === 0 ? (
                <div className="text-sm text-gray-500 italic">Loading categories…</div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {vendorTypes.map((vt) => {
                    const Icon = vt.icon;
                    const isSelected = issueType === vt.value;
                    return (
                      <button
                        key={vt.value}
                        type="button"
                        onClick={() => {
                          setIssueType(vt.value);
                          setTimeout(() => setStep(3), 300);
                        }}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vt.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{vt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: URGENCY */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">How urgent is this?</h2>
              <p className="text-sm text-gray-500 mb-5">
                Vendors prioritize their day around urgency — be honest.
              </p>

              <div className="space-y-2.5">
                {SEVERITY_OPTIONS.map((s) => {
                  const isSelected = severity === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        setSeverity(s.value);
                        setTimeout(() => setStep(4), 300);
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-gray-900 bg-gray-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot} ${isSelected ? `ring-4 ${s.ring}` : ""}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: QUICK SUMMARY */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Give it a quick title</h2>
              <p className="text-sm text-gray-500 mb-5">
                One short line — this is what vendors see first when they scan the marketplace.
              </p>

              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value.slice(0, SUMMARY_MAX))}
                placeholder="e.g. Kitchen faucet is leaking under the sink"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
                maxLength={SUMMARY_MAX}
              />
              <div className="flex items-center justify-between mt-2 px-1">
                <p className={`text-xs ${trimmedSummary.length > 0 && !summaryValid ? "text-red-500" : "text-gray-400"}`}>
                  {trimmedSummary.length === 0
                    ? "Tip: describe the symptom and the room or area."
                    : !summaryValid
                    ? `A few more characters (${SUMMARY_MIN}+).`
                    : "Looks good."}
                </p>
                <p className="text-xs text-gray-400 tabular-nums">{summary.length}/{SUMMARY_MAX}</p>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Good examples</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Kitchen faucet leaking — needs replacement</li>
                  <li>Furnace not heating, started yesterday</li>
                  <li>Bathroom drywall water damage near tub</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 5: DETAILS + PHOTOS + SHARING */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Add details and photos</h2>
              <p className="text-sm text-gray-500 mb-5">
                Optional, but more context = more accurate quotes.
              </p>

              <label className="text-xs font-semibold text-gray-700 mb-2 block">More details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When did it start? How bad is it? Anything you've already tried?"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />

              <label className="text-xs font-semibold text-gray-700 mb-2 block">Photos</label>
              <div className="flex items-center gap-3 flex-wrap mb-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5 font-medium">Add</span>
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
                    <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow-md"
                      aria-label="Remove photo"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200">
                <div className="pr-3">
                  <p className="text-sm font-semibold text-gray-900">Share on marketplace</p>
                  <p className="text-xs text-gray-500">
                    {active
                      ? "Verified vendors near you can see this and send quotes."
                      : "Only you can see this — no vendors will be notified."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    active ? "bg-primary" : "bg-gray-300"
                  }`}
                  aria-pressed={active}
                  aria-label="Share on marketplace"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                      active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Review summary */}
              <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                <p className="font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-2">Review</p>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Property</span>
                  <span className="text-gray-900 font-medium text-right truncate">{selectedAddress}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-900 font-medium">{normalizeAndCapitalize(issueType)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Urgency</span>
                  <span className="text-gray-900 font-medium capitalize">{severity}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Title</span>
                  <span className="text-gray-900 font-medium text-right truncate">{trimmedSummary}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: SUCCESS */}
          {step === 6 && createdIssue && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Job posted!</h2>
              <p className="text-sm text-gray-600 mb-1">
                Your {normalizeAndCapitalize(createdIssue.type || "")} job at{" "}
                <span className="font-semibold">{selectedAddress}</span>{" "}
                is live.
              </p>
              {active ? (
                <p className="text-sm text-primary font-medium mb-5">
                  Verified vendors in your area will start sending quotes shortly.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mb-5">
                  Saved privately. Toggle "Share on marketplace" on the job later to invite quotes.
                </p>
              )}
              {listingImage && (
                <div className="rounded-xl overflow-hidden w-full mb-2">
                  <img
                    src={listingImage}
                    alt={selectedListing?.address || "Property"}
                    className="w-full h-40 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {step === 6 ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreatedIssue(null);
                  resetIssueFields();
                  setStep(1);
                }}
              >
                Post another
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={() => {
                  onClose();
                  if (active) navigate("/offers?filter=pending");
                }}
              >
                {active ? "View quotes" : "Done"}
              </Button>
            </>
          ) : step === 5 ? (
            <>
              <Button variant="outline" onClick={handleBack} disabled={backDisabled}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button variant="gold" disabled={!canAdvanceStep4 || isCreatingIssue} onClick={handleSubmit}>
                {isCreatingIssue ? "Posting..." : "Post job"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack} disabled={backDisabled}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button variant="gold" disabled={continueDisabled} onClick={handleContinue}>
                {continueLabel} <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostJobWizard;
