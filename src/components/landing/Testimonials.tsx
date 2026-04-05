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
      projectType: "Kitchen Renovation",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
    },
    {
      name: "Michael Chen",
      role: "Property Manager, Vancouver",
      content:
        "As a property manager, I need contractors I can trust. InspectlyAI's vetting process gives me confidence every time.",
      rating: 5,
      projectType: "Multi-Unit Plumbing",
      image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=200&fit=crop",
    },
    {
      name: "Jennifer Adams",
      role: "Homeowner, Calgary",
      content:
        "The AI matching feature is incredible. It understood exactly what my kitchen renovation needed and matched me perfectly.",
      rating: 5,
      projectType: "Bathroom Remodel",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=200&fit=crop",
    },
  ];

  return (
    <section
      id="testimonials"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 lg:py-20 relative bg-white section-animate ${isVisible ? "visible" : ""}`}
    >
      {/* Top fade from Why Choose Inspectly */}
      {/* Top fade from Why Choose Inspectly */}
      <div className="absolute top-0 left-0 right-0 h-40 -z-10 bg-[radial-gradient(ellipse_at_top,_#fefcf7_0%,_#ffffff_80%)]" />
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div
          className="text-center mb-12"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease-out",
          }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
            What Homeowners Say
          </h2>
          <p className="text-base text-muted-foreground">
            Join satisfied homeowners who found their perfect contractor.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card shadow-2xl rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-500 hover:-translate-y-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(30px)",
                transition: `all 0.6s ease-out ${0.1 + index * 0.1}s`,
              }}
            >
              {/* Project image header */}
              <div className="relative h-36 overflow-hidden">
                <img
                  src={testimonial.image}
                  alt={testimonial.projectType}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-medium text-white bg-black/50 backdrop-blur-sm rounded px-2 py-0.5">
                    {testimonial.projectType}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-base text-foreground/80 leading-relaxed mb-5 italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-base font-semibold text-primary">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
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
