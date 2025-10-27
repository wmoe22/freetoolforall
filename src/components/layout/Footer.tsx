export default function Footer() {
    return (
        <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            © 2025 Usefreetools. Made with ❤️ by @WillMoore
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 sm:space-x-6">
                        <a
                            href="/privacy"
                            className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors"
                        >
                            Privacy
                        </a>
                        <a
                            href="/terms"
                            className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors"
                        >
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}