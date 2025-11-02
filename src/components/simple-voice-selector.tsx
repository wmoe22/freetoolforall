'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VoiceModel, VoiceModelsResponse } from '@/types/voice-models'
import { useQuery } from '@tanstack/react-query'
import { Volume2 } from 'lucide-react'

interface SimpleVoiceSelectorProps {
    onModelSelect: (model: VoiceModel | null) => void
    selectedModel?: VoiceModel | null
}

const SimpleVoiceSelector = ({ onModelSelect, selectedModel }: SimpleVoiceSelectorProps) => {
    const { data, isLoading } = useQuery<VoiceModelsResponse>({
        queryKey: ['voice-models'],
        queryFn: async () => {
            const response = await fetch('/api/voice-models')
            if (!response.ok) {
                throw new Error('Failed to fetch voice models')
            }
            return response.json()
        },
    })

    const models = data?.voiceModels || []

    const handleValueChange = (value: string) => {
        if (value === 'default') {
            onModelSelect(null)
        } else {
            const model = models.find(m => m.id === value)
            if (model) {
                onModelSelect(model)
            }
        }
    }

    const getDisplayName = (model: VoiceModel) => {
        const name = model.metadata?.display_name || model.name || 'Unknown'
        const gender = model.gender ? ` (${model.gender})` : ''
        return `${name}${gender}`
    }

    if (isLoading) {
        return (
            <Select disabled>
                <SelectTrigger className="border-zinc-700 bg-zinc-800">
                    <SelectValue placeholder="Loading voices..." />
                </SelectTrigger>
            </Select>
        )
    }

    console.log(data, "data")

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Voice Model
            </label>
            <Select
                value={selectedModel?.id || 'default'}
                onValueChange={handleValueChange}
            >
                <SelectTrigger className="border-zinc-700 bg-zinc-800">
                    <SelectValue placeholder="Choose a voice model" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="default" className="text-zinc-300 hover:bg-zinc-700">
                        Default System Voice
                    </SelectItem>
                    {models.map((model) => (
                        <SelectItem
                            key={model.id}
                            value={model.id}
                            className="text-zinc-300 hover:bg-zinc-700"
                        >
                            {getDisplayName(model)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {selectedModel && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {selectedModel.description}
                </p>
            )}
        </div>
    )
}

export default SimpleVoiceSelector