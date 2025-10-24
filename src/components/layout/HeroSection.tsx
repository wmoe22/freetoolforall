export default function HeroSection() {
    return (
        <section className="text-center mb-8 sm:mb-12 px-4 sm:px-0" aria-labelledby="hero-heading"  >
            <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6" role="banner">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true"></span>
                <span className="whitespace-nowrap">No login required • Start instantly</span>
            </div>
            <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight px-2">
                Transform Your Voice
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span className="text-blue-600">Instantly</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
                Professional speech-to-text and text-to-speech conversion powered by advanced AI.
                <span className="hidden sm:inline"> Perfect for content creators, professionals, and accessibility needs.</span>
            </p>
        </section>
    )
}