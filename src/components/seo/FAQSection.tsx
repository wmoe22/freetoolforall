import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

export default function FAQSection() {
    const faqs = [
        {
            question: "How do I convert speech to text?",
            answer: "Simply upload your audio file or record directly in your browser. Our AI will automatically transcribe your speech into text within seconds. No account required."
        },
        {
            question: "What file formats can I upload?",
            answer: "We support all common audio formats including MP3, WAV, M4A, FLAC, and video files like MP4. Maximum file size is 100MB."
        },
        {
            question: "Is my data private and secure?",
            answer: "Yes, your privacy is our top priority. Files are processed temporarily and automatically deleted after conversion. We never store or share your audio data."
        },
        {
            question: "How accurate is the transcription?",
            answer: "Our AI provides high accuracy for clear audio with minimal background noise. For best results, use good quality recordings with clear speech."
        },
        {
            question: "Can I edit the transcribed text?",
            answer: "Yes, you can edit the transcribed text directly in the interface before copying or downloading it."
        },
        {
            question: "Is there a limit on file length?",
            answer: "You can upload files up to 2 hours long. For longer files, consider splitting them into smaller segments for better processing."
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
        <section className="py-8 sm:py-12 lg:py-16 bg-white dark:bg-zinc-900" aria-labelledby="faq-heading">
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
                        Get answers to common questions about our speech-to-text service
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}