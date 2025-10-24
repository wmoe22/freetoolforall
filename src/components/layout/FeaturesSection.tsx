import { Eye, FileText, Lock, Volume2 } from 'lucide-react'

export default function FeaturesSection() {
    return (
        <section className="py-4 sm:py-6" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-white dark:bg-slate-900 dark:border rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-950/30 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Volume2 size={20} className="text-blue-600 sm:hidden" />
                        <Volume2 size={24} className="text-blue-600 hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">Voice Hub</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="hidden sm:inline">Complete voice processing suite with TTS, STT, and audio tools</span>
                        <span className="sm:hidden">Voice processing suite</span>
                    </p>
                </div>

                <div className="text-center p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-950/30 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <FileText size={20} className="text-green-600 sm:hidden" />
                        <FileText size={24} className="text-green-600 hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">Document Hub</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="hidden sm:inline">File converter (PDF ↔ Word ↔ Excel) and document processing tools</span>
                        <span className="sm:hidden">File converter & processing</span>
                    </p>
                </div>

                <div className="text-center p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-950/30 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Eye size={20} className="text-purple-600 sm:hidden" />
                        <Eye size={24} className="text-purple-600 hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">Visual Hub</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="hidden sm:inline">Image and video processing with AI-powered analysis</span>
                        <span className="sm:hidden">Visual processing</span>
                    </p>
                </div>

                <div className="text-center p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Lock size={20} className="text-slate-600 dark:text-slate-400 sm:hidden" />
                        <Lock size={24} className="text-slate-600 dark:text-slate-400 hidden sm:block" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm sm:text-base">Privacy First</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="hidden sm:inline">No registration required, secure client-side processing</span>
                        <span className="sm:hidden">Privacy-focused processing</span>
                    </p>
                </div>
            </div>
        </section>
    )
}