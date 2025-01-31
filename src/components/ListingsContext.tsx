import React, { createContext, useContext, ReactNode } from "react";

interface Listing {
  id: string;
  title: string;
  image: string;
}

const listings = [
  { id: "1", title: "Listing 1", image: "images/fake_listing.png" },
  { id: "2", title: "Listing 2", image: "images/fake_listing.png" },
  { id: "3", title: "Listing 3", image: "images/fake_listing.png" },
  { id: "4", title: "Listing 4", image: "images/fake_listing.png" },
  { id: "5", title: "Listing 5", image: "images/fake_listing.png" },
  { id: "6", title: "Listing 6", image: "images/fake_listing.png" },
  { id: "7", title: "Listing 7", image: "images/fake_listing.png" },
  { id: "8", title: "Listing 8", image: "images/fake_listing.png" },
  { id: "9", title: "Listing 9", image: "images/fake_listing.png" },
  { id: "10", title: "Listing 10", image: "images/fake_listing.png" },
  { id: "11", title: "Listing 11", image: "images/fake_listing.png" },
  { id: "12", title: "Listing 12", image: "images/fake_listing.png" },
  { id: "13", title: "Listing 13", image: "images/fake_listing.png" },
  { id: "14", title: "Listing 14", image: "images/fake_listing.png" },
];

const ListingsContext = createContext<Listing[]>([]);

export const ListingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ListingsContext.Provider value={listings}>
      {children}
    </ListingsContext.Provider>
  );
};

export const useListings = () => useContext(ListingsContext);
