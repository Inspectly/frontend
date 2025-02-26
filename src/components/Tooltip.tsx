import React from "react";
import ReactDOM from "react-dom";

const Tooltip: React.FC<{
  quote: string;
  position: { top: number; left: number };
  onClose: () => void; // Callback to close the tooltip
}> = ({ quote, position, onClose }) => {
  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        transform: "translate(-50%, 0)", // Center horizontally
      }}
      className="z-50 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg"
    >
      {/* Tooltip Carrot */}
      <div
        style={{
          position: "absolute",
          bottom: "-5px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid #1f2937", // Matches tooltip background color
        }}
      ></div>

      {/* Tooltip Content */}
      <div className="relative ml-4">
        <button
          onClick={onClose}
          className="absolute -top-2 right-0 text-lg text-gray-400 hover:text-gray-100 focus:outline-none"
        >
          &times; {/* Close icon */}
        </button>
        <p>{quote}</p>
      </div>
    </div>,
    document.body // Render the tooltip in the body
  );
};

export default Tooltip;
