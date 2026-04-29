import { Star, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";

const Testimonials = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Homeowner, Toronto",
      content: "InspectlyAI made finding a reliable contractor so easy. Within 24 hours I had three quotes from vetted professionals.",
      rating: 5,
      avatar: testimonial1,
      project: "Kitchen Renovation",
      projectImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop",
    },
    {
      name: "Michael Chen",
      role: "Property Manager, Vancouver",
      content: "As a property manager, I need contractors I can trust. InspectlyAI's vetting process gives me confidence every time.",
      rating: 5,
      avatar: testimonial2,
      project: "Multi-Unit Plumbing",
      projectImage: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=200&fit=crop",
    },
    {
      name: "Jennifer Adams",
      role: "Homeowner, Calgary",
      content: "The AI matching feature is incredible. It understood exactly what my kitchen renovation needed and matched me perfectly.",
      rating: 5,
      avatar: testimonial3,
      project: "Bathroom Remodel",
      projectImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=200&fit=crop",
    },
  ];

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 lg:py-20 bg-muted/30 section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div 
          className="text-center mb-12"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
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
              className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-500 hover:-translate-y-1"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease-out ${0.1 + index * 0.1}s`
              }}
            >
              {/* Project image */}
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={testimonial.projectImage} 
                  alt={testimonial.project}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute bottom-2 left-4">
                  <span className="text-xs font-medium text-muted-foreground">{testimonial.project}</span>
                </div>
              </div>

              <div className="p-5">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative mb-4">
                  <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
                  <p className="text-sm text-foreground/80 leading-relaxed pl-4">
                    {testimonial.content}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
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
