import React, { useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";

interface DropdownProps {
  children: React.ReactNode;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  children,
  buttonRef,
  onClose,
}) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Function to update dropdown position dynamically
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  // Use `useLayoutEffect` for better synchronization with rendering
  useLayoutEffect(() => {
    updatePosition(); // Set initial position

    const handleEvents = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener("scroll", handleEvents, true);
    window.addEventListener("resize", handleEvents);

    return () => {
      window.removeEventListener("scroll", handleEvents, true);
      window.removeEventListener("resize", handleEvents);
    };
  }, [buttonRef]);

  // Close dropdown if clicking outside
  useLayoutEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-content") // Allow clicking inside
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, buttonRef]);

  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
      className="bg-white shadow-lg rounded-lg border border-gray-300 p-2"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

export default Dropdown;
