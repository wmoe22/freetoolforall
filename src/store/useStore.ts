import { create } from 'zustand'

interface AppState {
    isDarkMode: boolean
    isRecording: boolean
    transcript: string
    isPlaying: boolean
    toggleDarkMode: () => void
    setRecording: (recording: boolean) => void
    setTranscript: (transcript: string) => void
    setPlaying: (playing: boolean) => void
}

export const useStore = create<AppState>((set) => ({
    isDarkMode: false,
    isRecording: false,
    transcript: '',
    isPlaying: false,
    toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    setRecording: (recording) => set({ isRecording: recording }),
    setTranscript: (transcript) => set({ transcript }),
    setPlaying: (playing) => set({ isPlaying: playing }),
}))