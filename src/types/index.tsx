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
