# Business Hub Features

The Business Hub provides professional business document generation tools powered by AI.

## Features

### 1. Proposal Generator

- **AI-Powered**: Uses Gemini AI to generate professional business proposals
- **Customizable**: Input client details, project description, budget, and timeline
- **Professional Output**: Generates structured PDF proposals with:
  - Executive Summary
  - Project Overview
  - Scope of Work
  - Deliverables
  - Timeline and Milestones
  - Investment and Payment Terms
  - Why Choose Us section
  - Next Steps

### 2. Invoice Generator

- **Multiple Formats**: Generate invoices in PDF or Excel (CSV) format
- **Professional Layout**: Clean, professional invoice design
- **Customizable Items**: Add multiple line items with quantity, rate, and automatic amount calculation
- **Complete Details**: Include company info, client info, due dates, and notes
- **Automatic Calculations**: Real-time total calculation

### 3. Meeting Notes Generator

- **Dual Input Methods**:
  - Audio transcription using Deepgram STT + Gemini AI processing
  - Direct text input with Gemini AI processing
- **Structured Output**: AI generates organized meeting notes with:
  - Executive Summary
  - Key Discussion Points
  - Decisions Made
  - Action Items with owners
  - Next Steps
  - Additional Notes
- **Professional PDF**: Clean, formatted PDF output

## API Endpoints

### `/api/business/generate-proposal`

- **Method**: POST
- **Input**: Client details, project information
- **Output**: PDF proposal document
- **Rate Limit**: 5 requests per minute

### `/api/business/generate-invoice`

- **Method**: POST
- **Input**: Invoice details, line items, format preference
- **Output**: PDF or CSV invoice document
- **Rate Limit**: 10 requests per minute

### `/api/business/generate-meeting-notes`

- **Method**: POST
- **Input**: Meeting transcript, title, attendees
- **Output**: Structured PDF meeting notes
- **Rate Limit**: 5 requests per minute

## Environment Variables Required

```env
GEMINI_API_KEY=your_gemini_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key  # For audio transcription
```

## Dependencies

- `@google/generative-ai` - Gemini AI integration
- `@deepgram/sdk` - Audio transcription (already available)
- `jspdf` - PDF generation (already available)
- `sonner` - Toast notifications (already available)

## Usage

1. Navigate to the Business Hub tab in the main application
2. Choose from three tools: Proposals, Invoices, or Meeting Notes
3. Fill in the required information
4. Click generate to create and download your professional document

## Features in Detail

### Proposal Generator

- Intelligent content generation based on project requirements
- Professional formatting and structure
- Customizable company and client information
- Budget and timeline integration

### Invoice Generator

- Support for multiple line items
- Automatic tax and total calculations
- Professional invoice layout
- Export to PDF or Excel formats
- Company branding support

### Meeting Notes Generator

- Audio-to-text transcription using Deepgram
- AI-powered content structuring using Gemini
- Extraction of action items and decisions
- Professional meeting documentation
- Support for both audio files and text input

## Rate Limiting

All endpoints include rate limiting to prevent abuse:

- Proposal Generator: 5 requests per minute per IP
- Invoice Generator: 10 requests per minute per IP
- Meeting Notes Generator: 5 requests per minute per IP

## Error Handling

- Comprehensive error handling with user-friendly messages
- Sentry integration for error tracking
- Fallback mechanisms for service failures
- Input validation and sanitization
