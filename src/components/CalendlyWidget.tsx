import React from "react";
import { InlineWidget } from "react-calendly";

const CalendlyWidget: React.FC = () => {
  return (
    <div className="p-4 bg-white shadow-md rounded-md">
      <h2 className="text-lg font-semibold mb-4">Book an Appointment</h2>

      {/* Calendly Inline Widget */}
      <InlineWidget url="https://calendly.com/inspectlyai" />
    </div>
  );
};

export default CalendlyWidget;
