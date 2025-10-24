export default function FAQSection() {
    const faqs = [
        {
            question: "Is SpeechFlow completely free to use?",
            answer: "Yes, SpeechFlow is completely free to use. There are no hidden fees, subscriptions, or login requirements. You can start converting speech to text and text to speech immediately."
        },
        {
            question: "What audio formats are supported for speech-to-text conversion?",
            answer: "SpeechFlow supports all major audio formats including MP3, WAV, M4A, FLAC, and video formats like MP4 and WebM. Simply upload your file and we'll handle the conversion."
        },
        {
            question: "How accurate is the speech recognition?",
            answer: "Our speech recognition is powered by advanced AI technology and provides high accuracy for clear audio. Accuracy may vary based on audio quality, background noise, and speaker clarity."
        },
        {
            question: "Can I use different voices for text-to-speech?",
            answer: "Yes, SpeechFlow offers multiple voice models with different accents and speaking styles. You can select from various high-quality voices to suit your needs."
        },
        {
            question: "Is my audio data stored or shared?",
            answer: "No, your privacy is our priority. Audio files are processed temporarily and are not stored on our servers. Your data remains private and secure."
        },
        {
            question: "Do I need to create an account?",
            answer: "No account creation is required. SpeechFlow works instantly in your browser without any registration or login process."
        },
        {
            question: "What languages are supported?",
            answer: "SpeechFlow supports multiple languages for both speech recognition and text-to-speech conversion. The exact languages available depend on the voice models and recognition engines used."
        },
        {
            question: "Can I download the generated audio files?",
            answer: "Yes, you can download the generated audio files from text-to-speech conversion directly to your device in high-quality audio format."
        }
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
            }
        }))
    };

    return (
        <section className="py-8 sm:py-12 lg:py-16 bg-white dark:bg-slate-900" aria-labelledby="faq-heading">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
                        Everything you need to know about SpeechFlow
                    </p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-slate-200 dark:border-slate-700 pb-6 sm:pb-8">
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">
                                {faq.question}
                            </h3>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}