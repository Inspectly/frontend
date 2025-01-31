import React, { createContext, useContext, useState, ReactNode } from "react";
import { IssueType } from "../types";

interface IssuesContextProps {
  issues: IssueType[];
  updateIssue: (id: string, updates: Partial<IssueType>) => void;
}

// Create the context
export const IssuesContext = createContext<IssuesContextProps | undefined>(
  undefined
);

// Create a provider component
interface IssuesProviderProps {
  children: ReactNode;
}

export const IssuesProvider: React.FC<IssuesProviderProps> = ({ children }) => {
  const [issues, setIssues] = useState<IssueType[]>([
    {
      id: "1.1",
      listingId: "1",
      type: "Plumbing",
      summary: "Pipe leakage in kitchen",
      severity: "High",
      progress: "To-do",
      dateCreated: "2023-12-25",
      vendor: "Plumbing Pros",
      workedBy: "John Doe",
      realtor: "Jane Smith",
      cost: "",
      description:
        "A major pipe leakage is causing water overflow in the kitchen.",
      attachments: [],
      comments: [],
      image: "/images/city-placeholder.png",
    },
    {
      id: "1.2",
      listingId: "1",
      type: "Plumbing",
      summary: "Broken showerhead",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-01",
      vendor: "Plumbing Pros",
      workedBy: "John Doe",
      realtor: "Jane Smith",
      cost: "",
      description:
        "The showerhead in the master bathroom is broken and leaking.",
      attachments: [
        {
          name: "placeholder.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
        {
          name: "placeholder2.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
        {
          name: "placeholder3.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
        {
          name: "placeholder4.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
        {
          name: "placeholder5.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
        {
          name: "placeholder6.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
        {
          name: "placeholder7.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
      ],
      comments: [
        {
          author: "Jane Smith",
          date: "2024-01-02",
          text: "Please prioritize fixing this.",
        },
      ],
      image: "/images/city-placeholder.png",
    },
    {
      id: "1.3",
      listingId: "1",
      type: "Plumbing",
      summary: "Water heater malfunction",
      severity: "Low",
      progress: "Done",
      dateCreated: "2024-01-03",
      vendor: "Plumbing Pros",
      workedBy: "John Doe",
      realtor: "Jane Smith",
      cost: "$200",
      description:
        "The water heater is not functioning correctly and needs replacement parts.",
      attachments: [],
      comments: [],
      image: "/images/city-placeholder.png",
    },
    {
      id: "2.1",
      listingId: "1",
      type: "Electrical",
      summary: "Electrical short circuit in basement",
      severity: "High",
      progress: "Done",
      dateCreated: "2024-01-05",
      vendor: "Electrical Experts",
      workedBy: "Emily Brown",
      realtor: "Jane Smith",
      cost: "$250",
      description:
        "A short circuit in the basement caused a partial power outage.",
      attachments: [
        {
          name: "placeholder.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
        {
          name: "placeholder.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
      ],
      comments: [
        {
          author: "Emily Brown",
          date: "2024-01-05",
          text: "Issue resolved and circuit repaired.",
        },
      ],
      image: "/images/city-placeholder.png",
    },
    {
      id: "2.2",
      listingId: "1",
      type: "Electrical",
      summary: "Faulty wiring in living room",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-06",
      vendor: "Electrical Experts",
      workedBy: "Emily Brown",
      realtor: "Jane Smith",
      cost: "",
      description:
        "The wiring in the living room is faulty and poses a hazard.",
      attachments: [],
      comments: [],
      image: "/images/city-placeholder.png",
    },
    {
      id: "3.1",
      listingId: "1",
      type: "Structural",
      summary: "Cracked foundation wall",
      severity: "High",
      progress: "To-do",
      dateCreated: "2024-01-08",
      vendor: "Structural Solutions",
      workedBy: "Michael Green",
      realtor: "Jane Smith",
      cost: "",
      description:
        "A large crack has appeared in the foundation wall in the basement.",
      attachments: [
        {
          name: "placeholder.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
      ],
      comments: [
        {
          author: "Michael Green",
          date: "2024-01-09",
          text: "Investigating the severity of the crack.",
        },
      ],
      image: "/images/city-placeholder.png",
    },
    {
      id: "3.2",
      listingId: "1",
      type: "Structural",
      summary: "Roof leaking near attic",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-09",
      vendor: "Structural Solutions",
      workedBy: "Michael Green",
      realtor: "Jane Smith",
      cost: "",
      description:
        "A water leak near the attic is causing moisture buildup and damage.",
      attachments: [],
      comments: [],
      image: "/images/city-placeholder.png",
    },
    {
      id: "4.1",
      listingId: "1",
      type: "HVAC",
      summary: "Heating system failure",
      severity: "High",
      progress: "Done",
      dateCreated: "2024-01-11",
      vendor: "HVAC Experts",
      workedBy: "Sarah White",
      realtor: "Jane Smith",
      cost: "$300",
      description: "The central heating system has failed and needs repair.",
      attachments: [
        {
          name: "placeholder.jpg",
          url: "/images/placeholder.jpg",
          type: "image",
          addedBy: "Database",
          dateAdded: "2024-01-12",
        },
      ],
      comments: [
        {
          author: "Sarah White",
          date: "2024-01-12",
          text: "Issue resolved and system tested.",
        },
      ],
      image: "/images/city-placeholder.png",
    },
  ]);

  const updateIssue = (id: string, updates: Partial<IssueType>) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === id ? { ...issue, ...updates } : issue
      )
    );
  };

  return (
    <IssuesContext.Provider value={{ issues, updateIssue }}>
      {children}
    </IssuesContext.Provider>
  );
};

export const useIssues = () => {
  const context = useContext(IssuesContext);
  if (!context) {
    throw new Error("useIssues must be used within an IssuesProvider");
  }
  return context;
};
