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

export interface IssueType {
  id: string;
  type: string;
  listingId: string;
  summary: string;
  image: string;
  description: string;
  severity: string;
  progress: string;
  dateCreated: string;
  vendor: string;
  workedBy: string;
  realtor: string;
  cost: string;
  attachments: Attachment[];
  comments: Comment[];
}

export interface Comment {
  author: string;
  text: string;
  date: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  addedBy: string;
  dateAdded: string;
}
