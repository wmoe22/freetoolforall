import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Read the terms of service for using Usefreetools. Understand your rights and responsibilities when using our digital utility tools.',
    openGraph: {
        title: 'Terms of Service | Usefreetools',
        description: 'Read the terms of service for using Usefreetools digital utility platform.',
    },
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
                        Terms of Service
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Acceptance of Terms
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                By using Usefreetools, you agree to these terms of service. If you do not agree to these terms,
                                please do not use our service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Service Description
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                Usefreetools provides a comprehensive suite of free digital utility tools across five main categories:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mb-4 space-y-2">
                                <li><strong>Voice Hub:</strong> Speech to text, text to speech, audio converter, subtitle generator, audio trimmer</li>
                                <li><strong>Document Hub:</strong> File converter, compress, split and merge documents</li>
                                <li><strong>Business Hub:</strong> Proposal generator, invoice generator, meeting notes generator</li>
                                <li><strong>Visual Hub:</strong> Image compress, resize, crop, convert, background removal</li>
                                <li><strong>Security Hub:</strong> File scanner and URL scanner for viruses and malware</li>
                            </ul>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                All services are provided "as is" without warranties of any kind.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Acceptable Use
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                You agree to use Usefreetools only for lawful purposes. You may not use the service to:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mb-4 space-y-2">
                                <li>Process files or content that violates any laws or regulations</li>
                                <li>Upload or scan malicious files, viruses, or malware intentionally</li>
                                <li>Generate harmful, offensive, or inappropriate content</li>
                                <li>Attempt to reverse engineer or compromise the service</li>
                                <li>Use the service to violate intellectual property rights</li>
                                <li>Overload our servers with excessive requests or automated tools</li>
                                <li>Use the service for commercial purposes without permission</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                File Processing and Data
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                When using our tools, you acknowledge that:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mb-4 space-y-2">
                                <li>You own or have the right to process the files you upload</li>
                                <li>Files are processed temporarily and deleted immediately after processing</li>
                                <li>We do not store or retain your files or personal data</li>
                                <li>You are responsible for backing up your original files</li>
                                <li>Processing accuracy may vary depending on file quality and format</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Limitation of Liability
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                Usefreetools is provided free of charge and without warranty. We are not liable for any damages,
                                data loss, or issues arising from the use of our service. You use our tools at your own risk.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Changes to Terms
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                We reserve the right to modify these terms at any time. Continued use of the service
                                constitutes acceptance of any changes.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                Contact Information
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                If you have questions about these terms, please contact us through our website.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}