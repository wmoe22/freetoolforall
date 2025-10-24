import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Learn how SpeechFlow protects your privacy and handles your data. We prioritize user privacy and data security.',
    openGraph: {
        title: 'Privacy Policy | SpeechFlow',
        description: 'Learn how SpeechFlow protects your privacy and handles your data.',
    },
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
                        Privacy Policy
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Data Collection
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                SpeechFlow is designed with privacy in mind. We do not store your audio files or transcribed text on our servers.
                                All processing happens temporarily and your data is immediately discarded after conversion.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                How We Use Your Information
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                We only process your audio and text data to provide the speech conversion services.
                                No personal information is collected or stored beyond what's necessary for the service to function.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Data Security
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                All data transmission is encrypted using industry-standard protocols.
                                Your audio files are processed securely and are not accessible to unauthorized parties.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Third-Party Services
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                We may use third-party AI services for speech processing. These services are bound by strict privacy agreements
                                and do not retain your data beyond the processing period.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Contact Us
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                If you have any questions about this Privacy Policy, please contact us through our website.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}