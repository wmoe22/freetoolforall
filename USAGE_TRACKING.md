# Usage Tracking Guide

This document explains how to track usage for all tools in the admin dashboard.

## Overview

The usage tracking system now supports tracking all tools in the application, not just speech-to-text and text-to-speech. All tool usage is automatically aggregated and displayed in the admin dashboard.

## How to Track Tool Usage

### Import the tracking function

```typescript
import { trackToolUsage } from "@/lib/track-tool-usage";
```

### Track usage for any tool

```typescript
// Example 1: Track speech-to-text usage
trackToolUsage("speech-to-text", {
  fileSize: 1024000, // in bytes
  duration: 60, // in seconds
  success: true,
});

// Example 2: Track image compression
trackToolUsage("image-compress", {
  fileSize: 2048000,
  success: true,
});

// Example 3: Track PDF merge
trackToolUsage("pdf-merge", {
  fileSize: 5120000,
  success: true,
});

// Example 4: Track text-to-speech with character count
trackToolUsage("text-to-speech", {
  textLength: 500,
  model: "aura-asteria-en",
  format: "mp3",
  success: true,
});

// Example 5: Track failed operation
trackToolUsage("file-converter", {
  fileSize: 1024000,
  success: false,
  error: "Unsupported format",
});
```

## Supported Tools

All tools are automatically tracked. Here's the complete list:

### Voice Tools

- `speech-to-text` - Convert audio to text
- `text-to-speech` - Convert text to audio
- `audio-converter` - Convert audio formats
- `subtitle-generator` - Generate subtitles
- `audio-trimmer` - Trim audio files

### Document Tools

- `file-converter` - Convert document formats
- `pdf-compress` - Compress PDF files
- `pdf-split` - Split PDF files
- `pdf-merge` - Merge PDF files

### Business Tools

- `proposal-generator` - Generate proposals
- `invoice-generator` - Generate invoices
- `meeting-notes` - Generate meeting notes

### Visual Tools

- `image-compress` - Compress images
- `image-resize` - Resize images
- `image-crop` - Crop images
- `image-convert` - Convert image formats
- `background-remove` - Remove image backgrounds

### Security Tools

- `file-scanner` - Scan files for viruses
- `url-scanner` - Scan URLs for threats

### Utility Tools

- `url-shortener` - Shorten URLs
- `token-counter` - Count LLM tokens

## Admin Dashboard

The admin dashboard (`/admin`) displays:

1. **Today's Usage Summary** - Main cards showing speech-to-text, text-to-speech, and totals
2. **All Tools Usage** - Detailed breakdown of every tool used today (admin only)
3. **7-Day Trend** - Weekly usage patterns
4. **All-Time Statistics** - Historical data

### Features

- **Real-time tracking** - Usage is tracked immediately
- **Cost estimation** - Automatic cost calculation for API-based tools
- **Tool breakdown** - See which tools are most popular
- **Export data** - Download usage data as JSON
- **Privacy-focused** - All data stored locally in browser

## Implementation Example

Here's how to add tracking to a new tool component:

```typescript
'use client';

import { trackToolUsage } from '@/lib/track-tool-usage';
import { useState } from 'react';

export default function MyToolComponent() {
  const [file, setFile] = useState<File | null>(null);

  const handleProcess = async () => {
    try {
      // Your tool logic here
      const result = await processFile(file);

      // Track successful usage
      trackToolUsage('my-tool-name', {
        fileSize: file?.size || 0,
        success: true
      });

      // Show result to user
    } catch (error) {
      // Track failed usage
      trackToolUsage('my-tool-name', {
        fileSize: file?.size || 0,
        success: false,
        error: error.message
      });
    }
  };

  return (
    // Your component JSX
  );
}
```

## Data Storage

- All usage data is stored in browser localStorage
- Data is automatically cleaned up after 30 days
- No server-side storage or tracking
- Users can clear data anytime from the dashboard

## Cost Tracking

Only API-based tools have cost estimates:

- **Speech-to-Text**: ~$0.0043 per minute
- **Text-to-Speech**: ~$0.02 per 1000 characters
- **All other tools**: Free (client-side processing)

## Privacy

- No personal data is collected
- No external analytics
- All processing happens locally
- Data never leaves the user's browser
