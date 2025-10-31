import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

export default function FAQSection() {
    const faqs = [
        {
            question: "How do I use this platform?",
            answer: "Simply select the tool you need from our collection, upload your files or input your data, and let our AI-powered tools process it instantly. No account registration required - just visit and use any tool immediately."
        },
        {
            question: "What types of tools are available?",
            answer: "We offer a comprehensive suite of AI-powered tools including text processing, audio conversion, image editing, and productivity utilities. All tools are designed to be fast, accurate, and easy to use."
        },
        {
            question: "Is my data private and secure?",
            answer: "Absolutely. Your privacy is our top priority. All files are processed securely and automatically deleted after use. We never store, share, or access your content. All processing happens with great security."
        },
        {
            question: "Do I need to create an account?",
            answer: "No account required! Our platform works completely anonymously. Simply visit the site, choose your tool, and start using it instantly. This ensures maximum privacy and convenience for all users."
        },
        {
            question: "Are these tools free to use?",
            answer: "Yes! All our basic tools are completely free with no hidden costs. We provide these as a public service to help users accomplish their tasks quickly and efficiently without any barriers."
        },
        {
            question: "What file formats do you support?",
            answer: "We support all major file formats including documents, images, audio, and video files. Each tool specifies its supported formats, with most accepting common formats like PDF, JPG, MP3, MP4, and many others."
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
        <section className="py-8 sm:py-12 lg:py-16 bg-zinc-800 border border-zinc-700" aria-labelledby="faq-heading">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-base sm:text-lg text-zinc-300">
                        Get answers to common questions about our free AI-powered tools
                    </p>
                </div>

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-b border-zinc-700 last:border-b-0">
                                <AccordionTrigger className="text-left text-lg sm:text-xl font-semibold text-white hover:text-zinc-200">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-sm sm:text-base text-zinc-300 leading-relaxed pt-2">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}