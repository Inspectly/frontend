import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useCart } from "./cardContext";

interface AddToCartProps {
  itemId: string;
  getItemRef: () => HTMLElement | null; // Function to get ref dynamically
}

const AddToCart: React.FC<AddToCartProps> = ({ itemId, getItemRef }) => {
  const [clonedCard, setClonedCard] = useState<any>(null);
  const [cartPosition, setCartPosition] = useState({ top: 0, left: 0 });
  const { addToCart, cartItems } = useCart();

  // Update cart position
  const updateCartPosition = () => {
    const cartElement = document.getElementById("cart");
    if (cartElement) {
      const cartRect = cartElement.getBoundingClientRect();
      // Calculate the center of the cart button
      const cartCenterX = cartRect.left + window.scrollX + cartRect.width / 2;
      const cartCenterY = cartRect.top + window.scrollY + cartRect.height / 2;

      setCartPosition({
        top: cartCenterY,
        left: cartCenterX,
      });
    }
  };

  useEffect(() => {
    updateCartPosition();
    window.addEventListener("resize", updateCartPosition);
    return () => window.removeEventListener("resize", updateCartPosition);
  }, []);

  const handleAddToCart = () => {
    if (cartItems.includes(itemId)) return;

    const itemRef = getItemRef(); // Dynamically fetch the ref
    if (!itemRef) {
      console.warn("Ref is not yet assigned for", itemId);
      return;
    }

    addToCart(itemId);

    const cardRect = itemRef.getBoundingClientRect();
    const scrollX = window.scrollX; // Get horizontal scroll position
    const scrollY = window.scrollY; // Get vertical scroll position

    // Account for scrolling when calculating movement
    const cardLeft = cardRect.left + scrollX;
    const cardTop = cardRect.top + scrollY;

    // Calculate the center of the cloned card
    const cardCenterX = cardLeft + cardRect.width / 2;
    const cardCenterY = cardTop + cardRect.height / 2;

    // Get cart position dynamically
    const cartElement = document.getElementById("cart");
    if (!cartElement) return;
    const cartRect = cartElement.getBoundingClientRect();

    const cartX = cartRect.left + scrollX + cartRect.width / 2;
    const cartY = cartRect.top + scrollY + cartRect.height / 2;

    // Calculate translateX and translateY
    const translateX = cartX - cardCenterX;
    const translateY = cartY - cardCenterY;

    console.log("Cart Position: ", cartPosition);
    console.log("Card Position: ", {
      left: translateX,
      top: translateY,
    });
    console.log("Translate Values: ", { translateX, translateY });

    // Set cloned card data
    setClonedCard({
      width: cardRect.width,
      height: cardRect.height,
      left: cardLeft - window.scrollX,
      top: cardTop - window.scrollY,
      translateX,
      translateY,
    });

    // Remove cloned card after animation
    setTimeout(() => setClonedCard(null), 700);
  };
  return (
    <>
      {/* Floating Animation Clone (Use `position: fixed` to move freely) */}
      {clonedCard && (
        <motion.div
          initial={{
            width: clonedCard.width,
            height: clonedCard.height,
            left: clonedCard.left,
            top: clonedCard.top,
            position: "fixed", // Prevents it from being constrained to itemRef
            background: "white",
            borderRadius: "10px",
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
            opacity: 0.75,
          }}
          animate={{
            x: clonedCard.translateX, // Move left/right
            y: clonedCard.translateY, // Move up/down
            scale: 0.05,
            opacity: 0.5,
          }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      )}

      {/* Add Button */}
      <button
        onClick={handleAddToCart}
        className="w-8 h-8 bg-blue-100 text-primary-600 rounded-full inline-flex items-center justify-center"
      >
        <FontAwesomeIcon
          icon={faPlus}
          className={`text-blue-600 size-3.5 cursor-pointer ${
            cartItems.includes(itemId) ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </button>
    </>
  );
};

export default AddToCart;
