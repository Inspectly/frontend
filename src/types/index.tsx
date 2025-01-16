import React, { RefObject } from "react";

export interface SectionRefs {
  heroRef: RefObject<HTMLDivElement>;
  featuresRef: RefObject<HTMLDivElement>;
  howItWorksRef: RefObject<HTMLDivElement>;
  teamRef: RefObject<HTMLDivElement>;
  plansRef: RefObject<HTMLDivElement>;
  faqsRef: RefObject<HTMLDivElement>;
}

export interface HeaderProps {
  scrollToSection: (ref: RefObject<HTMLElement>) => void;
  refs: SectionRefs;
}
