'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VoiceModel, VoiceModelsResponse } from '@/types/voice-models'
import { useQuery } from '@tanstack/react-query'
import {
    ChevronDown,
    ChevronUp,
    Filter,
    Globe,
    Pause,
    Play,
    RotateCcw,
    Settings,
    User,
    Volume2
} from 'lucide-react'
import { useState } from 'react'

interface VoiceModelSelectorProps {
    onModelSelect: (model: VoiceModel) => void
    selectedModel?: VoiceModel | null
}

interface FilterState {
    gender: string[]
    provider: string[]
    architecture: string[]
    languages: string[]
    tags: string[]
    useCases: string[]
    accent: string
    age: string
}

const VoiceModelSelector = ({ onModelSelect, selectedModel }: VoiceModelSelectorProps) => {
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)
    const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState<string>('name')
    const [searchTerm, setSearchTerm] = useState('')

    const [filters, setFilters] = useState<FilterState>({
        gender: [],
        provider: [],
        architecture: [],
        languages: [],
        tags: [],
        useCases: [],
        accent: '',
        age: ''
    })

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

    // Extract unique values for filter options
    const filterOptions = {
        genders: [...new Set(models.map(m => m.gender).filter(Boolean))] as string[],
        providers: [...new Set(models.map(m => m.provider).filter(Boolean))] as string[],
        architectures: [...new Set(models.map(m => m.architecture).filter(Boolean))] as string[],
        languages: [...new Set(models.flatMap(m => m.languages || []))] as string[],
        tags: [...new Set(models.flatMap(m => m.metadata?.tags || []))] as string[],
        useCases: [...new Set(models.flatMap(m => m.metadata?.use_cases || []))] as string[],
        accents: [...new Set(models.map(m => m.metadata?.accent).filter(Boolean))] as string[],
        ages: [...new Set(models.map(m => m.metadata?.age).filter(Boolean))] as string[]
    }

    // Filter and sort models
    const filteredModels = models
        .filter(model => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                const matchesSearch =
                    model.name?.toLowerCase().includes(searchLower) ||
                    model.metadata?.display_name?.toLowerCase().includes(searchLower) ||
                    model.description?.toLowerCase().includes(searchLower) ||
                    model.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))

                if (!matchesSearch) return false
            }

            // Gender filter
            if (filters.gender.length > 0 && !filters.gender.includes(model.gender || '')) return false

            // Provider filter
            if (filters.provider.length > 0 && !filters.provider.includes(model.provider || '')) return false

            // Architecture filter
            if (filters.architecture.length > 0 && !filters.architecture.includes(model.architecture || '')) return false

            // Language filter
            if (filters.languages.length > 0) {
                const hasLanguage = filters.languages.some(lang => model.languages?.includes(lang))
                if (!hasLanguage) return false
            }

            // Tags filter
            if (filters.tags.length > 0) {
                const hasTags = filters.tags.some(tag => model.metadata?.tags?.includes(tag))
                if (!hasTags) return false
            }

            // Use cases filter
            if (filters.useCases.length > 0) {
                const hasUseCase = filters.useCases.some(useCase => model.metadata?.use_cases?.includes(useCase))
                if (!hasUseCase) return false
            }

            // Accent filter
            if (filters.accent && model.metadata?.accent !== filters.accent) return false

            // Age filter
            if (filters.age && model.metadata?.age !== filters.age) return false

            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '')
                case 'gender':
                    return (a.gender || '').localeCompare(b.gender || '')
                case 'provider':
                    return (a.provider || '').localeCompare(b.provider || '')
                default:
                    return 0
            }
        })

    const playAudio = (sampleUrl: string, modelId: string) => {
        if (playingAudio && audioElements[playingAudio]) {
            audioElements[playingAudio].pause()
            audioElements[playingAudio].currentTime = 0
        }

        if (playingAudio === modelId) {
            setPlayingAudio(null)
            return
        }

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

    const handleFilterChange = (filterType: keyof FilterState, value: string | string[]) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }))
    }

    const clearFilters = () => {
        setFilters({
            gender: [],
            provider: [],
            architecture: [],
            languages: [],
            tags: [],
            useCases: [],
            accent: '',
            age: ''
        })
        setSearchTerm('')
    }

    const getGenderColor = (gender: string) => {
        switch (gender?.toLowerCase()) {
            case 'male': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300'
            case 'female': return 'bg-pink-100 text-pink-800 dark:bg-pink-950/30 dark:text-pink-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300'
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading Voice Models...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 text-zinc-200 dark:text-zinc-700 rounded"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Search and Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Voice Model Selection
                            </CardTitle>
                            <CardDescription>
                                Choose the perfect voice for your text-to-speech conversion
                            </CardDescription>
                        </div>
                        <Badge variant="secondary">
                            {filteredModels.length} of {models.length} models
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search by name, description, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:text-zinc-800 text-zinc-900 dark:text-white"
                        />
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="gender">Gender</SelectItem>
                                <SelectItem value="provider">Provider</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filter Toggle */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Advanced Filters
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" onClick={clearFilters} className="text-sm">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 text-zinc-50 dark:text-zinc-800/50 rounded-lg">
                            {/* Gender Filter - Radio Group */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Gender</Label>
                                <RadioGroup
                                    value={filters.gender[0] || 'all-genders'}
                                    onValueChange={(value) => handleFilterChange('gender', value === 'all-genders' ? [] : [value])}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all-genders" id="gender-all" />
                                        <Label htmlFor="gender-all">All</Label>
                                    </div>
                                    {filterOptions.genders.filter(Boolean).map(gender => (
                                        <div key={gender} className="flex items-center space-x-2">
                                            <RadioGroupItem value={gender} id={`gender-${gender}`} />
                                            <Label htmlFor={`gender-${gender}`} className="capitalize">{gender}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Provider Filter - Checkboxes */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Provider</Label>
                                <div className="space-y-2">
                                    {filterOptions.providers.map(provider => (
                                        <div key={provider} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`provider-${provider}`}
                                                checked={filters.provider.includes(provider)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        handleFilterChange('provider', [...filters.provider, provider])
                                                    } else {
                                                        handleFilterChange('provider', filters.provider.filter(p => p !== provider))
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`provider-${provider}`} className="capitalize">{provider}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Architecture Filter - Select */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Architecture</Label>
                                <Select
                                    value={filters.architecture[0] || 'all-architectures'}
                                    onValueChange={(value) => handleFilterChange('architecture', value === 'all-architectures' ? [] : [value])}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select architecture" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-architectures">All Architectures</SelectItem>
                                        {filterOptions.architectures.filter(Boolean).map(arch => (
                                            <SelectItem key={arch} value={arch}>{arch}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Languages Filter - Checkboxes */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Languages</Label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {filterOptions.languages.slice(0, 10).map(language => (
                                        <div key={language} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`lang-${language}`}
                                                checked={filters.languages.includes(language)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        handleFilterChange('languages', [...filters.languages, language])
                                                    } else {
                                                        handleFilterChange('languages', filters.languages.filter(l => l !== language))
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`lang-${language}`} className="text-sm">{language}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Accent Filter - Select */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Accent</Label>
                                <Select
                                    value={filters.accent || 'all-accents'}
                                    onValueChange={(value) => handleFilterChange('accent', value === 'all-accents' ? '' : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select accent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-accents">All Accents</SelectItem>
                                        {filterOptions.accents.filter(Boolean).map(accent => (
                                            <SelectItem key={accent} value={accent}>{accent}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Age Filter - Radio Group */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Age</Label>
                                <RadioGroup
                                    value={filters.age || 'all-ages'}
                                    onValueChange={(value) => handleFilterChange('age', value === 'all-ages' ? '' : value)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all-ages" id="age-all" />
                                        <Label htmlFor="age-all">All Ages</Label>
                                    </div>
                                    {filterOptions.ages.filter(Boolean).map(age => (
                                        <div key={age} className="flex items-center space-x-2">
                                            <RadioGroupItem value={age} id={`age-${age}`} />
                                            <Label htmlFor={`age-${age}`}>{age}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selected Model Display */}
            {selectedModel && (
                <Card className="border-2 border-blue-500 dark:border-blue-400">
                    <CardHeader>
                        <CardTitle className="text-blue-600 dark:text-blue-400">Selected Voice Model</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={selectedModel.metadata?.image} />
                                <AvatarFallback>
                                    {selectedModel.metadata?.display_name?.charAt(0) || selectedModel.name?.charAt(0) || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="font-semibold">{selectedModel.metadata?.display_name || selectedModel.name}</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedModel.description}</p>
                                <div className="flex gap-2 mt-2">
                                    {selectedModel.gender && (
                                        <Badge variant="secondary" className={getGenderColor(selectedModel.gender)}>
                                            {selectedModel.gender}
                                        </Badge>
                                    )}
                                    {selectedModel.provider && (
                                        <Badge variant="outline">{selectedModel.provider}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => (
                    <Card
                        key={model.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedModel?.id === model.id
                            ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-950/20'
                            : 'hover:shadow-md'
                            }`}
                        onClick={() => onModelSelect(model)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                                <Avatar className="w-12 h-12 shrink-0">
                                    <AvatarImage
                                        src={model.metadata?.image}
                                        alt={model.metadata?.display_name || model.name}
                                    />
                                    <AvatarFallback className="text-sm">
                                        {model.metadata?.display_name?.charAt(0) || model.name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm truncate">
                                        {model.metadata?.display_name || model.name || 'Unknown'}
                                    </h3>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                        {model.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {model.gender && (
                                            <Badge variant="secondary" className={`text-xs ${getGenderColor(model.gender)}`}>
                                                <User className="w-3 h-3 mr-1" />
                                                {model.gender}
                                            </Badge>
                                        )}
                                        {model.languages && model.languages.length > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                <Globe className="w-3 h-3 mr-1" />
                                                {model.languages[0]}
                                                {model.languages.length > 1 && ` +${model.languages.length - 1}`}
                                            </Badge>
                                        )}
                                    </div>

                                    {model.metadata?.tags && model.metadata.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {model.metadata.tags.slice(0, 2).map((tag, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs text-zinc-100 dark:text-zinc-800">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {model.metadata.tags.length > 2 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{model.metadata.tags.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {model.metadata?.sample && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            playAudio(model.metadata!.sample!, model.id)
                                        }}
                                        className="shrink-0 w-8 h-8 p-0"
                                    >
                                        {playingAudio === model.id ? (
                                            <Pause className="w-4 h-4" />
                                        ) : (
                                            <Play className="w-4 h-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredModels.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <Volume2 className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                            No Models Found
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Try adjusting your filters or search terms
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default VoiceModelSelector