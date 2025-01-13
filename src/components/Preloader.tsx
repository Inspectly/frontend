import React from "react";

const Preloader: React.FC = () => {
  const letters = [
    { char: "I", color: "text-gray-600" },
    { char: "N", color: "text-gray-600" },
    { char: "S", color: "text-gray-600" },
    { char: "P", color: "text-gray-600" },
    { char: "E", color: "text-gray-600" },
    { char: "C", color: "text-gray-600" },
    { char: "T", color: "text-gray-600" },
    { char: "L", color: "text-gray-600" },
    { char: "Y", color: "text-gray-600" },
  ];

  return (
    <div className="preloader absolute inset-0 flex justify-center items-center">
      <div className="waviy font-bold text-[50px] flex space-x-2">
        {letters.map((letter, index) => (
          <span
            key={index}
            className={`${letter.color} inline-block relative animate-bounceInSequence`}
            style={{ animationDelay: `${(index - 1) * 0.1}s` }} // Add delay per letter
          >
            {letter.char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Preloader;
