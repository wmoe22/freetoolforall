'use client'

import { Switch } from '@/components/ui/switch'
import { useStore } from '@/store/useStore'
import { AudioWaveform, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

const ICON_SIZE = 15

export default function Header() {
    const { isDarkMode, toggleDarkMode } = useStore()
    const [showUsageDashboard, setShowUsageDashboard] = useState(false)

    return (
        <>
            <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 border border-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                                <AudioWaveform size={18} className="text-white sm:hidden" />
                                <AudioWaveform size={20} className="text-white hidden sm:block" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                                    SpeechFlow
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Voice AI Platform</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                                <Sun size={ICON_SIZE} className="text-slate-600 dark:text-slate-400" />
                                <Switch
                                    checked={isDarkMode}
                                    onCheckedChange={toggleDarkMode}
                                    className="scale-75 sm:scale-100"
                                />
                                <Moon size={ICON_SIZE} className="text-slate-600 dark:text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

        </>
    )
}