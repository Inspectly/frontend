import React, { RefObject } from "react";

export interface SectionRefs {
  heroRef: RefObject<HTMLDivElement>;
  featuresRef: RefObject<HTMLDivElement>;
  howItWorksRef: RefObject<HTMLDivElement>;
  teamRef: RefObject<HTMLDivElement>;
  plansRef: RefObject<HTMLDivElement>;
  faqsRef: RefObject<HTMLDivElement>;
  [key: string]: React.RefObject<HTMLElement>;
}

export interface HeaderProps {
  scrollToSection: (ref: RefObject<HTMLElement>) => void;
  refs: SectionRefs;
}

export interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  resume: File | null;
  availability: string;
  salary: string;
  startAvailability: string;
  workPreference: string;
  willingToWorkRemotely: string;
  sendToRealtor: string;
  realtorEmail: string;
  promoCode: string;
}

export type Vendor = {
  id: number;
  vender_user_id: number;
  vender_type: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  rating: string;
  review: string;
  created_at: string;
  updated_at: string;
};

export interface Listing {
  id: number;
  user_id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export type ReportType = {
  id: number;
  listing_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type IssueStatus =
  | "Status.OPEN"
  | "Status.IN_PROGRESS"
  | "Status.REVIEW"
  | "Status.COMPLETED";

export type IssueType = {
  id: number;
  report_id: number;
  type: string;
  summary: string;
  description: string;
  severity: string;
  status: IssueStatus;
  vendor_id: number;
  cost: string;
  active: string;
  created_at: string;
  updated_at: string;
};

export interface Comment {
  id: number;
  issue_id: number;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  issue_id: number;
  name: string;
  type: string;
  url: string;
  user_id: string;
  created_at: string;
}

export interface Bid {
  id: string;
  vendor: string;
  amount: string;
  dateAdded: string;
}

// event type
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}
