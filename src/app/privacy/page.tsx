import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Privacy policy for Usefreetools - free online digital utilities including file converter, image tools, voice tools, and business generators. Learn how we protect your data and ensure privacy across all our free tools and services.',
    openGraph: {
        title: 'Privacy Policy | Usefreetools',
        description: 'Privacy policy for Usefreetools - free online digital utilities including file converter, image tools, voice tools, and business generators.',
    },
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen text-zinc-50 dark:text-zinc-950 py-16">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
                <div className="bg-white dark:text-zinc-900 rounded-lg shadow-sm p-8">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">
                        Privacy Policy
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-8">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                                Data Collection
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                                Usefreetools is designed with privacy in mind. We do not store your files, documents, images, or any processed data on our servers.
                                All processing happens temporarily in your browser or on our secure servers, and your data is immediately discarded after processing.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                                Our Services
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                                Usefreetools provides a comprehensive suite of digital utilities across five main categories:
                            </p>
                            <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-300 mb-4 space-y-2">
                                <li><strong>Voice Hub:</strong> Speech to text, text to speech, audio converter, subtitle generator, audio trimmer</li>
                                <li><strong>Document Hub:</strong> File converter, compress, split and merge documents</li>
                                <li><strong>Business Hub:</strong> Proposal generator, invoice generator, meeting notes generator</li>
                                <li><strong>Visual Hub:</strong> Image compress, resize, crop, convert, background removal</li>
                                <li><strong>Security Hub:</strong> File scanner and URL scanner for viruses and malware</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                                How We Use Your Information
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                                We only process your files and data to provide the requested digital utility services.
                                No personal information is collected or stored beyond what's necessary for the service to function.
                                Your uploaded files are processed and immediately deleted from our systems.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                                Data Security
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                                All data transmission is encrypted using industry-standard HTTPS protocols.
                                Your files are processed securely and are not accessible to unauthorized parties.
                                We implement strict security measures to protect your data during processing.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                                Third-Party Services
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                                We may use third-party AI and processing services for certain tools like speech recognition, text generation, and file conversion.
                                These services are bound by strict privacy agreements and do not retain your data beyond the processing period.
                                All third-party services comply with industry-standard privacy and security practices.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                                Contact Us
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300">
                                If you have any questions about this Privacy Policy, please contact us through our website.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}