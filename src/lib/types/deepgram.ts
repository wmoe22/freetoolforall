/* Newly Created by Kiro - Deepgram API Types */

export interface DeepgramModelMetadata {
    accent?: string;
    age?: string;
    color?: string;
    image?: string;
    sample?: string;
    tags?: string[];
    use_cases?: string[];
}

export interface DeepgramSTTModel {
    name: string;
    canonical_name: string;
    architecture: string;
    languages: string[];
    version: string;
    uuid: string;
    batch: boolean;
    streaming: boolean;
    formatted_output: boolean;
}

export interface DeepgramTTSModel {
    name: string;
    canonical_name: string;
    architecture: string;
    languages: string[];
    version: string;
    uuid: string;
    metadata?: DeepgramModelMetadata;
}

export interface DeepgramModelsResponse {
    stt: DeepgramSTTModel[];
    tts: DeepgramTTSModel[];
    languages?: Record<string, string>; // Language code to display name mapping
}

export interface VoiceModel {
    id: string;
    name: string;
    description: string;
    gender: string;
    languages: string[];
    provider: string;
    architecture: string;
    version: string;
    metadata?: DeepgramModelMetadata;
}

export interface VoiceModelsApiResponse {
    success: boolean;
    voiceModels: VoiceModel[];
    total?: number;
    source?: string;
    fallback?: boolean;
    error?: string;
}


export interface Agent {
    id: string;
    name: string;
    industry?: string;
    useCase?: string;
    status: "active" | "inactive" | "draft";
    voiceModel: string;
    language: string;
    greeting?: string;
    systemPrompt?: string; // <!-- Updated Code - Added system prompt field -->
    fallbackMessage?: string;
    maxCallDuration?: number; // in seconds
    maxConcurrentCalls?: number;
    recordCalls?: boolean;
    phoneNumberId?: string;
    phoneNumber?: PhoneNumber;
    userId: string;
    teamId?: string;
    createdAt: string;
    updatedAt: string;

    // Related data
    knowledgeItems?: KnowledgeItem[];
    tools?: AgentTool[];
    limits?: AgentLimit[];
    voiceTests?: VoiceTest[];

    // Computed fields (not in DB)
    callsToday?: number;
    totalCalls?: number;
}

export interface MCPServer {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    description?: string;
}

export interface KnowledgeItem {
    id: string;
    agentId: string;
    title: string;
    content?: string;
    type: "text" | "file" | "link";
    category: "rule" | "faq" | "procedure" | "policy" | "general";
    priority: "high" | "medium" | "low";
    url?: string; // for link type
    fileName?: string; // for file type
    fileSize?: number; // in bytes
    fileUrl?: string; // storage URL for files
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

export interface EvaluationCriteria {
    id: string;
    name: string;
    description: string;
    weight: number;
    type: "accuracy" | "politeness" | "efficiency" | "compliance" | "custom";
}

export interface DataCollectionSpec {
    id: string;
    name: string;
    field: string;
    type: "text" | "number" | "email" | "phone" | "date" | "boolean";
    required: boolean;
    description?: string;
}

export interface AgentTool {
    id: string;
    agentId: string;
    toolName: string;
    enabled: boolean;
    config?: any;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AgentLimit {
    id: string;
    agentId: string;
    limitType: string; // e.g., "response_time", "conversation_length", "daily_calls"
    value: string; // flexible string to store different value types
    unit?: string; // e.g., "seconds", "minutes", "calls", "characters"
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PhoneNumber {
    id: string;
    number: string;
    displayName?: string;
    provider: string; // e.g., "twilio", "deepgram"
    country: string;
    capabilities: string[]; // e.g., ["voice", "sms"]
    isActive: boolean;
    userId: string;
    twilioSid?: string;
    webhookUrl?: string;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

export interface VoiceTest {
    id: string;
    agentId: string;
    testName: string;
    testScript?: string;
    voiceModel?: string; // can override agent's voice model
    language?: string; // can override agent's language
    status: "pending" | "running" | "completed" | "failed";
    duration?: number; // test duration in seconds
    audioUrl?: string; // URL to generated audio
    results?: any; // test results and metrics
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}
