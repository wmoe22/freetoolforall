import { Briefcase, Eye, FileText, Lock, Volume2 } from 'lucide-react'

export default function FeaturesSection() {
    return (
        <section className="py-4 sm:py-6" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border border-primary bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Volume2 size={20} className="text-primary sm:hidden" />
                        <Volume2 size={24} className="text-primary hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Voice Hub</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        <span className="hidden sm:inline">Complete voice processing suite with TTS, STT, and audio tools</span>
                        <span className="sm:hidden">Voice processing suite</span>
                    </p>
                </div>

                <div className="text-center p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 border border-primary rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <FileText size={20} className="text-primary sm:hidden" />
                        <FileText size={24} className="text-primary hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Document Hub</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        <span className="hidden sm:inline">File converter (PDF ↔ Word ↔ Excel) and document processing tools</span>
                        <span className="sm:hidden">File converter & processing</span>
                    </p>
                </div>

                <div className="text-center p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 border border-primary rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Briefcase size={20} className="text-primary sm:hidden" />
                        <Briefcase size={24} className="text-primary hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Business Hub</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        <span className="hidden sm:inline">Professional tools for productivity and business operations</span>
                        <span className="sm:hidden">Business & productivity</span>
                    </p>
                </div>

                <div className="text-center p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 border border-primary rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Eye size={20} className="text-primary sm:hidden" />
                        <Eye size={24} className="text-primary hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Visual Hub</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        <span className="hidden sm:inline">Image and video processing with AI-powered analysis</span>
                        <span className="sm:hidden">Visual processing</span>
                    </p>
                </div>

                <div className="text-center p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 border border-primary rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Lock size={20} className="text-primary sm:hidden" />
                        <Lock size={24} className="text-primary hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Security Hub</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        <span className="hidden sm:inline">File and URL scanning with comprehensive security tools</span>
                        <span className="sm:hidden">Security & scanning tools</span>
                    </p>
                </div>
            </div>
        </section>
    )
}