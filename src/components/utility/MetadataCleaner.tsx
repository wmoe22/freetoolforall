"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Download, Shield, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface CleanedImage {
    name: string;
    originalSize: number;
    cleanedSize: number;
    url: string;
    hadMetadata: boolean;
}

export default function MetadataCleaner() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [cleanedImages, setCleanedImages] = useState<CleanedImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            toast.error("No valid images selected", {
                description: "Please select image files (JPG, PNG, WebP, etc.)"
            });
            return;
        }

        if (imageFiles.length !== files.length) {
            toast.warning("Some files were skipped", {
                description: "Only image files are supported"
            });
        }

        setSelectedFiles(imageFiles);
        toast.success(`${imageFiles.length} image(s) selected`, {
            description: "Ready to clean metadata"
        });
    };

    const cleanMetadata = async (file: File): Promise<CleanedImage> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Set canvas dimensions to match image
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                // Draw image to canvas (this strips all metadata)
                ctx?.drawImage(img, 0, 0);

                // Convert back to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const hadMetadata = file.size > blob.size * 1.1; // Rough heuristic

                        resolve({
                            name: file.name,
                            originalSize: file.size,
                            cleanedSize: blob.size,
                            url,
                            hadMetadata
                        });
                    }
                }, file.type, 0.95); // High quality
            };

            img.src = URL.createObjectURL(file);
        });
    };

    const handleCleanAll = async () => {
        if (selectedFiles.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setCleanedImages([]);

        const loadingToast = toast.loading("Cleaning metadata...", {
            description: "Removing EXIF data and GPS information"
        });

        try {
            const cleaned: CleanedImage[] = [];

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const cleanedImage = await cleanMetadata(file);
                cleaned.push(cleanedImage);

                setProgress(((i + 1) / selectedFiles.length) * 100);
                setCleanedImages([...cleaned]);
            }

            const metadataFound = cleaned.some(img => img.hadMetadata);

            toast.success("Metadata cleaning completed!", {
                id: loadingToast,
                description: metadataFound
                    ? "EXIF data and GPS information removed"
                    : "No metadata found in the images"
            });
        } catch (error) {
            console.error("Error cleaning metadata:", error);
            toast.error("Failed to clean metadata", {
                id: loadingToast,
                description: "Please try again"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadImage = (image: CleanedImage) => {
        const a = document.createElement('a');
        a.href = image.url;
        a.download = `cleaned_${image.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success("Image downloaded!", {
            description: `${image.name} has been saved`
        });
    };

    const downloadAll = () => {
        cleanedImages.forEach((image, index) => {
            setTimeout(() => {
                downloadImage(image);
            }, index * 100); // Stagger downloads
        });
    };

    const clearAll = () => {
        setSelectedFiles([]);
        setCleanedImages([]);
        setProgress(0);

        // Clean up object URLs
        cleanedImages.forEach(image => {
            URL.revokeObjectURL(image.url);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        toast.success("All files cleared", {
            description: "Ready for new images"
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Metadata Cleaner
                    </CardTitle>
                    <CardDescription>
                        Remove EXIF data, GPS location, and other metadata from images for privacy
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="images">Select Images</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    id="images"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-20 border-dashed border-zinc-600 bg-zinc-900"
                                >
                                    <div className="text-center">
                                        <Upload className="h-6 w-6 mx-auto mb-2" />
                                        <div className="text-sm">
                                            {selectedFiles.length > 0
                                                ? `${selectedFiles.length} image(s) selected`
                                                : "Click to select images"
                                            }
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCleanAll}
                                disabled={isProcessing}
                                className="flex-1"
                            >
                                {isProcessing ? (
                                    <>
                                        <Shield className="h-4 w-4 mr-2 animate-pulse" />
                                        Cleaning...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Clean Metadata
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={clearAll}
                                disabled={isProcessing}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Processing images...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="w-full" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {cleanedImages.length > 0 && (
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Cleaned Images</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadAll}
                                disabled={isProcessing}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download All
                            </Button>
                        </div>
                        <CardDescription>
                            Images with metadata removed - safe to share
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {cleanedImages.map((image, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg bg-zinc-900 border border-zinc-700"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium truncate">
                                                    {image.name}
                                                </p>
                                                {image.hadMetadata ? (
                                                    <div className="flex items-center gap-1 text-xs text-orange-400">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Had metadata
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-xs text-green-400">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Clean
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-zinc-400 space-y-1">
                                                <div>Original: {formatFileSize(image.originalSize)}</div>
                                                <div>Cleaned: {formatFileSize(image.cleanedSize)}</div>
                                                {image.originalSize > image.cleanedSize && (
                                                    <div className="text-green-400">
                                                        Reduced by {formatFileSize(image.originalSize - image.cleanedSize)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => downloadImage(image)}
                                            className="min-w-[80px]"
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-zinc-800 border-zinc-700">
                <CardContent className="pt-6">
                    <div className="text-sm text-zinc-400 space-y-2">
                        <h4 className="font-medium text-zinc-200">What metadata is removed:</h4>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>GPS location data</li>
                            <li>Camera make and model</li>
                            <li>Date and time taken</li>
                            <li>Camera settings (ISO, aperture, etc.)</li>
                            <li>Software used to edit the image</li>
                            <li>Copyright information</li>
                        </ul>
                        <p className="text-xs text-zinc-500 mt-3">
                            Note: This process creates new images without metadata. Image quality is preserved at 95%.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}