export interface VoiceModelMetadata {
    accent?: string
    age?: string
    color?: string
    display_name?: string
    image?: string
    sample?: string
    tags?: string[]
    use_cases?: string[]
}

export interface VoiceModel {
    id: string
    name?: string
    gender?: string
    architecture?: string
    description?: string
    provider?: string
    version?: string
    languages?: string[]
    metadata?: VoiceModelMetadata
}

export interface VoiceModelsResponse {
    voiceModels: VoiceModel[]
}