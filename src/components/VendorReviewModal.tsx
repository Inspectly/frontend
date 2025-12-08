import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";

interface VendorReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, review: string) => void;
    vendorName: string;
}

const VendorReviewModal: React.FC<VendorReviewModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    vendorName,
}) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [hoverRating, setHoverRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(rating, review);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-center">
                    Rate & Review {vendorName}
                </h2>

                <div className="flex justify-center mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className="text-3xl focus:outline-none"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <FontAwesomeIcon
                                icon={
                                    star <= (hoverRating || rating) ? faStar : faStarRegular
                                }
                                className={`transition-colors duration-200 ${star <= (hoverRating || rating)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 mb-4"
                    rows={4}
                    placeholder="Write your review here..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0}
                        className={`px-4 py-2 text-white rounded-lg ${rating === 0
                            ? "bg-blue-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        Submit Review
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorReviewModal;
