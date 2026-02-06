import { Star } from "lucide-react";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";

const Testimonials = () => {
  const { ref, isVisible } = useScrollAnimation();

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Homeowner, Toronto",
      content:
        "InspectlyAI made finding a reliable contractor so easy. Within 24 hours I had three quotes from vetted professionals.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Property Manager, Vancouver",
      content:
        "As a property manager, I need contractors I can trust. InspectlyAI's vetting process gives me confidence every time.",
      rating: 5,
    },
    {
      name: "Jennifer Adams",
      role: "Homeowner, Calgary",
      content:
        "The AI matching feature is incredible. It understood exactly what my kitchen renovation needed.",
      rating: 5,
    },
  ];

  return (
    <section
      id="testimonials"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 lg:py-28 bg-gray-50 section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Section header */}
        <div
          className="text-center mb-16"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-amber-600 mb-4 block">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-gray-900 mb-4">
            What Homeowners <span className="font-serif italic">Say</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Join satisfied homeowners who found their perfect contractor.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-lg"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease-out ${0.1 + index * 0.1}s`
              }}
            >
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-base text-gray-700 leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
