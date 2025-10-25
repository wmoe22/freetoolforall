export default function Footer() {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                            © 2025 FreeToolForAll. Made with ❤️ by @WillMoore
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 sm:space-x-6">
                        <a
                            href="/privacy"
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs sm:text-sm transition-colors"
                        >
                            Privacy
                        </a>
                        <a
                            href="/terms"
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs sm:text-sm transition-colors"
                        >
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}