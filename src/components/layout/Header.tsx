'use client'

import FeedbackDialog from '@/components/FeedbackDialog'
import ToolRequestDialog from '@/components/ToolRequestDialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useStore } from '@/store/useStore'
import { AudioWaveform, MessageSquare, Moon, Plus, Sun } from 'lucide-react'
import { useState } from 'react'

const ICON_SIZE = 15

export default function Header() {
    const { isDarkMode, toggleDarkMode } = useStore()
    const [showToolRequestDialog, setShowToolRequestDialog] = useState(false)
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

    return (
        <>
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary border border-primary/80 rounded-lg sm:rounded-xl flex items-center justify-center">
                                <AudioWaveform size={18} className="text-primary-foreground sm:hidden" />
                                <AudioWaveform size={20} className="text-primary-foreground hidden sm:block" />
                            </div>
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

                            <div className="flex items-center space-x-1 sm:space-x-2 bg-muted rounded-full border border-border p-2">
                                <Sun size={ICON_SIZE} className="text-muted-foreground" />
                                <Switch
                                    checked={isDarkMode}
                                    onCheckedChange={toggleDarkMode}
                                    className="scale-75 sm:scale-100"
                                />
                                <Moon size={ICON_SIZE} className="text-muted-foreground" />
                            </div>
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