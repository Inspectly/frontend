import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { useGetVendorReviewsByVendorUserIdQuery } from "../features/api/vendorReviewsApi";
import { Vendor_Review } from "../types";
import UserName from "./UserName";

interface VendorReviewsSectionProps {
    vendorUserId: number;
}

const VendorReviewsSection: React.FC<VendorReviewsSectionProps> = ({
    vendorUserId,
}) => {
    const [filteredStar, setFilteredStar] = useState<number | null>(null);

    const { data: reviews = [], isLoading, error } =
        useGetVendorReviewsByVendorUserIdQuery(vendorUserId, {
            skip: !vendorUserId,
        });

    const { averageRating, ratingCounts } = useMemo(() => {
        if (!reviews.length) return { averageRating: 0, ratingCounts: {} };

        const counts: Record<number, number> = {};
        let sum = 0;

        reviews.forEach((r) => {
            sum += r.rating;
            counts[r.rating] = (counts[r.rating] || 0) + 1;
        });

        return {
            averageRating: sum / reviews.length,
            ratingCounts: counts,
        };
    }, [reviews]);

    const filteredReviews = filteredStar
        ? reviews.filter((r) => r.rating === filteredStar)
        : reviews;

    const handleStarFilter = (star: number) => {
        setFilteredStar((prev) => (prev === star ? null : star));
    };

    const renderStars = (rating: number) => {
        return (
            <ul className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <li
                        key={i}
                        className={`text-lg ${i <= rating ? "text-yellow-500" : "text-gray-300"
                            }`}
                    >
                        <FontAwesomeIcon icon={i <= rating ? faStar : faStarOutline} />
                    </li>
                ))}
            </ul>
        );
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-2"></div>
                <p className="text-gray-500">Loading reviews...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
                <p>Failed to load reviews.</p>
            </div>
        );
    }

    return (
        <div className="mb-6">
            {/* Top review breakdown UI */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4 border rounded-lg bg-gray-50 mb-6">
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        Reviews
                    </h3>
                    {reviews.length > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-bold text-gray-800">
                                {averageRating.toFixed(1)}
                            </span>
                            {renderStars(Math.round(averageRating))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">
                            No reviews yet
                        </p>
                    )}
                    <p className="text-sm text-gray-600">
                        {reviews.length} reviews
                    </p>
                </div>

                <div className="w-full md:w-2/3 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingCounts[star] || 0;
                        const percent = reviews.length
                            ? (count / reviews.length) * 100
                            : 0;
                        const isActive = filteredStar === star;

                        return (
                            <div
                                key={star}
                                onClick={() => handleStarFilter(star)}
                                className={`flex items-center gap-2 px-2 group transform transition-all duration-150 ${isActive
                                    ? "bg-gray-200 scale-[1.02] rounded-md"
                                    : "hover:scale-[1.01]"
                                    }
                          ${count === 0
                                        ? "opacity-50 pointer-events-none"
                                        : "cursor-pointer"
                                    }`}
                            >
                                <span className="text-sm font-medium w-6 text-yellow-500">
                                    {star}★
                                </span>
                                <div className="w-full h-3 bg-gray-200 rounded">
                                    <div
                                        className="h-3 bg-yellow-500 rounded transition-all duration-300"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                    <div className="h-6">
                        <p
                            onClick={() => setFilteredStar(null)}
                            className="text-xs text-blue-500 hover:underline cursor-pointer"
                        >
                            {filteredStar ? "Clear Filter" : ""}
                        </p>
                    </div>
                </div>
            </div>

            {filteredReviews.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {filteredReviews.map((review: Vendor_Review) => (
                        <div
                            key={review.id}
                            className="border rounded-lg p-4 bg-gray-50"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">
                                    Reviewer: <UserName userId={review.user_id} />
                                </h4>
                                {renderStars(review.rating)}
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                {review.review}
                            </p>
                            <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No reviews found.</p>
            )}
        </div>
    );
};

export default VendorReviewsSection;
