import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SpeechFlow - Voice Converter',
        short_name: 'SpeechFlow',
        description: 'Free speech-to-text and text-to-speech converter',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
        categories: ['productivity', 'utilities'],
        lang: 'en',
        orientation: 'portrait-primary',
    }
}