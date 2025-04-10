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

export type User_Type = {
  id: number;
  user_type: string;
  created_at: string;
  updated_at: string;
};

export type Vendor_Type = {
  id: number;
  vendor_type: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: number;
  user_type: string;
  firebase_id: string;
  created_at: string;
  updated_at: string;
};

export type User_Login = {
  id: number;
  user_id: number;
  email_login: boolean;
  email: string;
  phone_login: boolean;
  phone: string;
  gmail_login: boolean;
  gmail: string;
  created_at: string;
  updated_at: string;
};

export type User_Session = {
  id: number;
  user_id: number;
  login_method: string;
  login_time: string;
  authentication_code: string;
  logout_time: string;
};

export type Client = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
};

export type Realtor = {
  id: number;
  realtor_user_id: number;
  realtor_firm_id: string;
  first_name: string;
  last_name: string;
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

export type Vendor = {
  id: number;
  vender_user_id: number;
  vender_type: Vendor_Type;
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
  user_id: number;
  listing_id: number;
  aws_link: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type IssueStatus =
  | "Status.OPEN"
  | "Status.IN_PROGRESS"
  | "Status.REVIEW"
  | "Status.COMPLETED";

export const statusMapping: Record<IssueStatus, string> = {
  "Status.OPEN": "open",
  "Status.IN_PROGRESS": "in_progress",
  "Status.REVIEW": "review",
  "Status.COMPLETED": "completed",
};

export const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In-progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

export type IssueType = {
  id: number;
  report_id: number;
  type: string;
  summary: string;
  description: string;
  severity: string;
  status: IssueStatus;
  vendor_id: number | null;
  image_url: string;
  cost: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type IssueBids = {
  id: number;
  issue_id: number;
  vendor_id: number;
  price: number;
  status: string;
  comment_vendor: string;
  comment_client: string;
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

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}
