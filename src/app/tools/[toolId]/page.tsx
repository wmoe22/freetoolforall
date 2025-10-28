"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Import individual tool components (previously called "Tab" components)
import AudioConverterTab from "@/components/speech/AudioConverterTab";
import AudioTrimmerTab from "@/components/speech/AudioTrimmerTab";
import SpeechToTextTab from "@/components/speech/SpeechToTextTab";
import SubtitleGeneratorTab from "@/components/speech/SubtitleGeneratorTab";
import TextToSpeechTab from "@/components/speech/TextToSpeechTab";

// Import document tool components
import FileConverterTab from "@/components/document/FileConverterTab";
import PDFCompressorTab from "@/components/document/PDFCompressorTab";
import PDFMergerTab from "@/components/document/PDFMergerTab";
import PDFSplitterTab from "@/components/document/PDFSplitterTab";

// Import services and stores
import InvoiceGenerator from "@/components/business/InvoiceGenerator";
import MeetingNotesGenerator from "@/components/business/MeetingNotesGenerator";
import ProposalGenerator from "@/components/business/ProposalGenerator";
import { ModeToggle } from "@/components/ModeToggle";
import FileScanner from "@/components/security/FileScanner";
import UrlScanner from "@/components/security/UrlScanner";
import BackgroundRemover from "@/components/visual/BackgroundRemover";
import FormatConverter from "@/components/visual/FormatConverter";
import ImageCompressor from "@/components/visual/ImageCompressor";
import ImageCropper from "@/components/visual/ImageCropper";
import ImageResizer from "@/components/visual/ImageResizer";
import { SpeechService } from "@/lib/speech-service";
import { useStore } from "@/store/useStore";
import { VoiceModel } from "@/types/voice-models";

// Tool definitions
const ALL_TOOLS = [
    // Voice Hub Tools
    { id: 'speech-to-text', name: 'Speech to Text', category: 'voice', description: 'Convert audio files to text', tabValue: 'speech-to-text' },
    { id: 'text-to-speech', name: 'Text to Speech', category: 'voice', description: 'Convert text to audio', tabValue: 'text-to-speech' },
    { id: 'audio-converter', name: 'Audio Converter', category: 'voice', description: 'Convert between audio formats', tabValue: 'audio-converter' },
    { id: 'subtitle-generator', name: 'Subtitle Generator', category: 'voice', description: 'Generate subtitles from audio', tabValue: 'subtitle-generator' },
    { id: 'audio-trimmer', name: 'Audio Trimmer', category: 'voice', description: 'Trim and edit audio files', tabValue: 'audio-trimmer' },

    // Document Hub Tools
    { id: 'file-converter', name: 'File Converter', category: 'document', description: 'Convert between document formats', tabValue: 'converter' },
    { id: 'pdf-compressor', name: 'PDF Compressor', category: 'document', description: 'Compress PDF files', tabValue: 'compress' },
    { id: 'pdf-splitter', name: 'PDF Splitter', category: 'document', description: 'Split PDF into multiple files', tabValue: 'split' },
    { id: 'pdf-merger', name: 'PDF Merger', category: 'document', description: 'Merge multiple PDFs', tabValue: 'merge' },

    // Business Hub Tools
    { id: 'proposal-generator', name: 'Proposal Generator', category: 'business', description: 'Generate business proposals', tabValue: 'proposal' },
    { id: 'invoice-generator', name: 'Invoice Generator', category: 'business', description: 'Create professional invoices', tabValue: 'invoice' },
    { id: 'meeting-notes', name: 'Meeting Notes', category: 'business', description: 'Generate meeting notes from audio', tabValue: 'meeting' },

    // Visual Hub Tools
    { id: 'image-compressor', name: 'Image Compressor', category: 'visual', description: 'Compress images while maintaining quality', tabValue: 'compress' },
    { id: 'image-resizer', name: 'Image Resizer', category: 'visual', description: 'Resize images to specific dimensions', tabValue: 'resize' },
    { id: 'image-cropper', name: 'Image Cropper', category: 'visual', description: 'Crop images to specific areas', tabValue: 'crop' },
    { id: 'image-converter', name: 'Image Converter', category: 'visual', description: 'Convert between image formats', tabValue: 'convert' },
    { id: 'background-remover', name: 'Background Remover', category: 'visual', description: 'Remove backgrounds from images', tabValue: 'background' },

    // Security Hub Tools
    { id: 'file-scanner', name: 'File Scanner', category: 'security', description: 'Scan files for viruses and malware', tabValue: 'file-scanner' },
    { id: 'url-scanner', name: 'URL Scanner', category: 'security', description: 'Check URLs for malicious content', tabValue: 'url-scanner' },
];

const CATEGORIES = {
    voice: { name: 'Voice Hub', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    document: { name: 'Document Hub', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    business: { name: 'Business Hub', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    visual: { name: 'Visual Hub', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    security: { name: 'Security Hub', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

export default function ToolPage() {
    const params = useParams();
    const router = useRouter();
    const [tool, setTool] = useState<typeof ALL_TOOLS[0] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Use the same store and services as VoiceHub
    const { transcript, isPlaying, setTranscript, setPlaying } = useStore();
    const [speechService] = useState(() => new SpeechService());

    // State for various tools
    const [textInput, setTextInput] = useState('');
    const [selectedVoiceModel, setSelectedVoiceModel] = useState<VoiceModel | null>(null);
    const [showVoiceSelector, setShowVoiceSelector] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [speechCompleted, setSpeechCompleted] = useState(false);

    useEffect(() => {
        const toolId = params.toolId as string;
        const foundTool = ALL_TOOLS.find(t => t.id === toolId);

        if (foundTool) {
            setTool(foundTool);
            document.title = `${foundTool.name} | Usefreetools`;
        }

        setIsLoading(false);
    }, [params.toolId]);

    // Reset speech completion when text input changes
    useEffect(() => {
        setSpeechCompleted(false);
    }, [textInput]);

    // Speech to Text handlers (same as VoiceHub)
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('audio/') || file.type === 'video/mp4' || file.type === 'video/webm') {
                setSelectedFile(file);
                toast.success('File selected!', {
                    description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB) is ready for transcription.`
                });
            } else {
                toast.error('Invalid file type', {
                    description: 'Please select an audio file (mp3, wav, m4a, etc.) or video file (mp4, webm).'
                });
            }
        }
    };

    const handleFileTranscription = async () => {
        if (!selectedFile) return;

        setIsTranscribing(true);
        const loadingToast = toast.loading('Transcribing audio file...', {
            description: 'Please wait while we process your audio file.'
        });

        try {
            const transcriptResult = await speechService.transcribeFile(selectedFile);
            setTranscript(transcriptResult);

            toast.success('Transcription completed!', {
                id: loadingToast,
                description: 'Your audio has been successfully transcribed.'
            });
        } catch (error) {
            console.error('Failed to transcribe file:', error);
            toast.error('Transcription failed', {
                id: loadingToast,
                description: 'Please check your internet connection and try again.'
            });
        } finally {
            setIsTranscribing(false);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setTranscript('');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!', {
            description: 'Text has been copied to your clipboard.'
        });
    };

    // Text to Speech handlers (same as VoiceHub)
    const handleTextToSpeech = async () => {
        if (!textInput.trim()) return;

        try {
            setPlaying(true);
            setSpeechCompleted(false);
            toast.success('Playing speech...', {
                description: selectedVoiceModel
                    ? `Using ${selectedVoiceModel.metadata?.display_name || selectedVoiceModel.name}`
                    : 'Using default voice'
            });

            if (selectedVoiceModel) {
                await speechService.textToSpeechWithModel(textInput, selectedVoiceModel);
            } else {
                await speechService.textToSpeech(textInput);
            }

            setSpeechCompleted(true);
        } catch (error) {
            console.error('Failed to play speech:', error);
            toast.error('Speech playback failed', {
                description: 'Please try again or check your audio settings.'
            });
        } finally {
            setPlaying(false);
        }
    };

    const handleStopSpeech = () => {
        speechSynthesis.cancel();
        setPlaying(false);
        setSpeechCompleted(false);
        toast.info('Speech stopped', {
            description: 'Audio playback has been stopped.'
        });
    };

    const handleDownloadAudio = async () => {
        if (!textInput.trim()) return;

        const loadingToast = toast.loading('Generating audio file...', {
            description: 'Please wait while we create your audio file.'
        });

        try {
            const audioBlob = await speechService.generateAudioBlob(textInput, selectedVoiceModel);
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;

            const isAudio = audioBlob.type.startsWith('audio/');
            const extension = isAudio ? 'wav' : 'txt';
            const filename = `speech-${Date.now()}.${extension}`;

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(isAudio ? 'Audio downloaded!' : 'Text file downloaded!', {
                id: loadingToast,
                description: isAudio
                    ? 'Your audio file has been saved to your downloads folder.'
                    : 'Audio generation failed, but text content has been saved.'
            });
        } catch (error) {
            console.error('Failed to download audio:', error);
            toast.error('Download failed', {
                id: loadingToast,
                description: 'Please try again or check your internet connection.' // FIX: Corrected typo
            });
        }
    };

    // FIX: Corrected the function declaration syntax
    const renderToolComponent = () => {
        if (!tool) return null;

        // FIX: Cleaned up the switch statement and removed extra trailing braces/parentheses.
        switch (tool.id) {
            case 'speech-to-text':
                return (
                    <SpeechToTextTab
                        selectedFile={selectedFile}
                        isTranscribing={isTranscribing}
                        transcript={transcript}
                        handleFileSelect={handleFileSelect}
                        handleFileTranscription={handleFileTranscription}
                        clearFile={clearFile}
                        copyToClipboard={copyToClipboard}
                        setTranscript={setTranscript}
                        setTextInput={setTextInput}
                    />
                );

            case 'text-to-speech':
                return (
                    <TextToSpeechTab
                        textInput={textInput}
                        setTextInput={setTextInput}
                        selectedVoiceModel={selectedVoiceModel}
                        setSelectedVoiceModel={setSelectedVoiceModel}
                        showVoiceSelector={showVoiceSelector}
                        setShowVoiceSelector={setShowVoiceSelector}
                        isPlaying={isPlaying}
                        speechCompleted={speechCompleted}
                        handleTextToSpeech={handleTextToSpeech}
                        handleStopSpeech={handleStopSpeech}
                        handleDownloadAudio={handleDownloadAudio}
                    />
                );

            case 'audio-converter':
                return <AudioConverterTab />;

            case 'subtitle-generator':
                // FIX: Completed the return statement
                return <SubtitleGeneratorTab />;

            case 'audio-trimmer':
                return <AudioTrimmerTab />;

            case 'file-converter':
                return <FileConverterTab />;

            case 'pdf-compressor':
                return <PDFCompressorTab />;

            case 'pdf-splitter':
                return <PDFSplitterTab />;

            case 'pdf-merger':
                return <PDFMergerTab />;

            case "invoice-generator":
                return <InvoiceGenerator />
            case "proposal-generator":
                return <ProposalGenerator />
            case "meeting-notes":
                return <MeetingNotesGenerator />
            case "background-remover":
                return <BackgroundRemover />
            case "image-converter":
                return <FormatConverter />
            case "image-cropper":
                return <ImageCropper />
            case "image-resizer":
                return <ImageResizer />
            case "image-compressor":
                return <ImageCompressor />
            case "file-scanner":
                return <FileScanner />
            case "url-scanner":
                return <UrlScanner />
            default:
                return (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                This tool is not yet available as a standalone page.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/">
                                    <Home size={16} className="mr-2" />
                                    Back to All Tools
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                );
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading tool...</p>
                </div>
            </div>
        );
    }

    // Not Found State
    if (!tool) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="max-w-md mx-auto">
                    <CardContent className="text-center py-12">
                        <h1 className="text-2xl font-bold text-foreground mb-2">Tool Not Found</h1>
                        <p className="text-muted-foreground mb-6">
                            The tool you're looking for doesn't exist or has been moved.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={() => router.back()} variant="outline">
                                <ArrowLeft size={16} className="mr-2" />
                                Go Back
                            </Button>
                            <Button asChild>
                                <Link href="/">
                                    <Home size={16} className="mr-2" />
                                    Home
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const category = CATEGORIES[tool.category as keyof typeof CATEGORIES];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card shadow-sm"> {/* Added shadow-sm for depth */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                        <ModeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* Narrowed max-width for focus */}
                {renderToolComponent()}
            </main>

            {/* Footer */}
            <footer className="border-t bg-card mt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-sm text-muted-foreground">
                        <p>© 2024 Usefreetools. All rights reserved.</p>
                        <div className="flex justify-center gap-4 mt-2">
                            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}