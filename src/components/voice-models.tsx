'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VoiceModel, VoiceModelsResponse } from '@/types/voice-models'
import { useQuery } from '@tanstack/react-query'
import { Globe, Mic, Pause, Play, Sparkles, User } from 'lucide-react'
import { useState } from 'react'

const VoiceModels = () => {
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)
    const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})

    const { data, isLoading, error } = useQuery<VoiceModelsResponse>({
        queryKey: ['voice-models'],
        queryFn: async () => {
            const response = await fetch('/api/voice-models')
            if (!response.ok) {
                throw new Error('Failed to fetch voice models')
            }
            return response.json()
        },
    })

    const playAudio = (sampleUrl: string, modelId: string) => {
        // Stop any currently playing audio
        if (playingAudio && audioElements[playingAudio]) {
            audioElements[playingAudio].pause()
            audioElements[playingAudio].currentTime = 0
        }

        if (playingAudio === modelId) {
            setPlayingAudio(null)
            return
        }

        // Create or get audio element
        let audio = audioElements[modelId]
        if (!audio) {
            audio = new Audio(sampleUrl)
            setAudioElements(prev => ({ ...prev, [modelId]: audio }))

            audio.onended = () => setPlayingAudio(null)
            audio.onerror = () => setPlayingAudio(null)
        }

        audio.play()
        setPlayingAudio(modelId)
    }

    const getGenderColor = (gender: string) => {
        switch (gender.toLowerCase()) {
            case 'male': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300'
            case 'female': return 'bg-pink-100 text-pink-800 dark:bg-pink-950/30 dark:text-pink-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300'
        }
    }

    const getProviderColor = (provider: string) => {
        switch (provider.toLowerCase()) {
            case 'deepgram': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
            case 'elevenlabs': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300'
            default: return 'text-zinc-100 text-zinc-800 dark:text-zinc-950/30 dark:text-zinc-300'
        }
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center space-x-4">
                                <Skeleton className="w-16 h-16 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-12">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error Loading Models</CardTitle>
                        <CardDescription>
                            Failed to load voice models. Please try again later.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const models = data?.voiceModels || []

    return (
        <div className="space-y-6 p-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                    Voice Models Gallery
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Discover and preview our collection of AI voice models
                </p>
                <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>{models.length} models available</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {models.map((model: VoiceModel) => (
                    <Card
                        key={model.id}
                        className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white dark:text-zinc-900 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20"
                        style={{ borderTop: `4px solid ${model.metadata?.color || '#6b7280'}` }}
                    >
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="w-16 h-16 border-2" style={{ borderColor: model.metadata?.color || '#6b7280' }}>
                                        <AvatarImage
                                            src={model.metadata?.image}
                                            alt={model.metadata?.display_name || model.name}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="text-lg font-semibold">
                                            {model.metadata?.display_name?.charAt(0) || model.name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-xl text-zinc-900 dark:text-white">
                                            {model.metadata?.display_name || model.name || 'Unknown Voice'}
                                        </CardTitle>
                                        <CardDescription className="text-zinc-600 dark:text-zinc-400">
                                            {model.name}
                                        </CardDescription>
                                        <div className="flex items-center gap-2 mt-2">
                                            {model.gender && (
                                                <Badge variant="secondary" className={getGenderColor(model.gender)}>
                                                    <User className="w-3 h-3 mr-1" />
                                                    {model.gender}
                                                </Badge>
                                            )}
                                            {model.metadata?.age && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {model.metadata.age}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {model.metadata?.sample && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => playAudio(model.metadata!.sample!, model.id)}
                                        className="shrink-0"
                                    >
                                        {playingAudio === model.id ? (
                                            <Pause className="w-4 h-4" />
                                        ) : (
                                            <Play className="w-4 h-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                {model.description}
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2 flex items-center">
                                        <Globe className="w-4 h-4 mr-2" />
                                        Languages & Accent
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {model.languages?.map((lang, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {lang}
                                            </Badge>
                                        )) || <span className="text-xs text-zinc-500">No languages specified</span>}
                                    </div>
                                    {model.metadata?.accent && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                            Accent: {model.metadata.accent}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                                        Voice Characteristics
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {model.metadata?.tags?.map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="text-xs text-zinc-100 text-zinc-700 dark:text-zinc-800 dark:text-zinc-300"
                                            >
                                                {tag}
                                            </Badge>
                                        )) || <span className="text-xs text-zinc-500">No characteristics specified</span>}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                                        Best Use Cases
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {model.metadata?.use_cases?.map((useCase, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                                            >
                                                {useCase}
                                            </Badge>
                                        )) || <span className="text-xs text-zinc-500">No use cases specified</span>}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                        <div className="flex items-center space-x-4">
                                            {model.provider && (
                                                <Badge variant="outline" className={getProviderColor(model.provider)}>
                                                    <Mic className="w-3 h-3 mr-1" />
                                                    {model.provider}
                                                </Badge>
                                            )}
                                            {model.version && <span>v{model.version}</span>}
                                        </div>
                                        {model.architecture && (
                                            <span className="font-mono text-xs">{model.architecture}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {models.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 text-zinc-100 dark:text-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mic className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                        No Voice Models Found
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        No voice models are currently available.
                    </p>
                </div>
            )}
        </div>
    )
}

export default VoiceModels