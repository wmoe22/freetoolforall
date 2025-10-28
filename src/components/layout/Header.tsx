'use client'

import FeedbackDialog from '@/components/FeedbackDialog'
import ToolRequestDialog from '@/components/ToolRequestDialog'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { ModeToggle } from '../ModeToggle'

const ICON_SIZE = 15

export default function Header() {
    const [showToolRequestDialog, setShowToolRequestDialog] = useState(false)
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

    return (
        <>
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <Image className='object-cover rounded-xl' src={"/logo.png"} alt='Logo' width={40} height={40} />
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                                    Usefreetools
                                </h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">Essential Tool Hub</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <Button
                                onClick={() => setShowToolRequestDialog(true)}
                                variant="outline"
                                size="sm"
                                className="hidden sm:flex items-center gap-2 text-xs sm:text-sm"
                            >
                                <Plus size={14} />
                                Request Tool
                            </Button>

                            <Button
                                onClick={() => setShowFeedbackDialog(true)}
                                variant="outline"
                                size="sm"
                                className="hidden sm:flex items-center gap-2 text-xs sm:text-sm"
                            >
                                <MessageSquare size={14} />
                                Feedback
                            </Button>

                            <Button
                                onClick={() => setShowToolRequestDialog(true)}
                                variant="outline"
                                size="sm"
                                className="sm:hidden p-2"
                                aria-label="Request Tool"
                            >
                                <Plus size={16} />
                            </Button>

                            <Button
                                onClick={() => setShowFeedbackDialog(true)}
                                variant="outline"
                                size="sm"
                                className="sm:hidden p-2"
                                aria-label="Feedback"
                            >
                                <MessageSquare size={16} />
                            </Button>

                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <ToolRequestDialog
                open={showToolRequestDialog}
                onOpenChange={setShowToolRequestDialog}
            />

            <FeedbackDialog
                open={showFeedbackDialog}
                onOpenChange={setShowFeedbackDialog}
            />
        </>
    )
}