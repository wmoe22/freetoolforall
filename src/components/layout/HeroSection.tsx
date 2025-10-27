export default function HeroSection() {
  return (
    <section
      className="text-center mb-8 sm:mb-12 px-4 sm:px-0"
      aria-labelledby="hero-heading"
    >
      <div
        className="inline-flex items-center space-x-2 bg-primary/20 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
        role="banner"
      >
        <span
          className="w-2 h-2 bg-primary rounded-full animate-pulse"
          aria-hidden="true"
        ></span>
        <span className="whitespace-nowrap">
          No login required • Start instantly
        </span>
      </div>
      <h1
        id="hero-heading"
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2"
      >
        Essential Tools
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        <span className="text-primary">For Everyone</span>
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed px-4">
        Complete toolkit with voice processing, document conversion, visual
        tools, and security features.
        <span className="hidden sm:inline">
          {" "}
          Everything you need in one powerful, free platform.
        </span>
      </p>
    </section>
  );
}
