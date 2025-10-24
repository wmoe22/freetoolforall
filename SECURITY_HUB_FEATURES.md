# Security Hub Features

The Security Hub provides comprehensive malware and threat detection capabilities using the VirusTotal API.

## Features

### 1. File Scanner

- **Upload and scan files** for viruses and malware
- **File size limit**: 32MB (VirusTotal free API limit)
- **Supported formats**: All file types
- **Real-time scanning** with progress indicators
- **Detailed results** showing detection ratios and scan dates
- **Direct links** to full VirusTotal reports

### 2. URL Scanner

- **Scan URLs** for malicious content and threats
- **Domain reputation** checking
- **Phishing detection**
- **Malware hosting detection**
- **Historical analysis** when available
- **Real-time submission** for new URLs

## Security Status Indicators

### Status Types

- **Clean**: No threats detected
- **Malicious**: Confirmed threats found
- **Suspicious**: Potentially harmful content
- **Unknown**: Unable to determine status

### Visual Indicators

- ✅ Green: Clean/Safe
- ❌ Red: Malicious/Dangerous
- ⚠️ Yellow: Suspicious/Caution
- ❓ Gray: Unknown/Error

## API Integration

### VirusTotal API v3

- **Endpoint**: `https://www.virustotal.com/api/v3/`
- **Authentication**: API key required
- **Rate limits**: Free tier limitations apply
- **File upload**: Direct file submission
- **URL analysis**: Real-time and cached results

### Environment Configuration

```env
VIRUS_TOTAL_API_KEY=your_api_key_here
```

## Security Best Practices

### File Safety

- Always scan files from unknown sources
- Be cautious with executable files (.exe, .bat, .scr)
- Keep your antivirus software updated
- Avoid opening suspicious email attachments

### URL Safety

- Check URLs before clicking suspicious links
- Look for HTTPS encryption on sensitive sites
- Be wary of shortened URLs from unknown sources
- Verify website authenticity before entering credentials

## Technical Implementation

### API Routes

- `/api/security/scan-file` - File scanning endpoint
- `/api/security/scan-url` - URL scanning endpoint

### Response Format

```json
{
  "status": "clean|malicious|suspicious|unknown",
  "positives": 0,
  "total": 70,
  "scan_date": "2024-01-01T00:00:00Z",
  "permalink": "https://www.virustotal.com/gui/...",
  "details": {
    "stats": {...},
    "file_info": {...}
  }
}
```

### Error Handling

- File size validation
- URL format validation
- API rate limit handling
- Network error recovery
- User-friendly error messages

## Usage Guidelines

### File Scanning

1. Select a file using the file picker
2. Click "Scan File" to upload and analyze
3. Wait for results (typically 2-5 seconds)
4. Review the security status and details
5. Click the report link for full analysis

### URL Scanning

1. Enter the URL in the input field
2. Click "Scan URL" to analyze
3. Wait for results (typically 3-5 seconds)
4. Review the security status and reputation
5. Click the report link for detailed analysis

## Limitations

### Free API Constraints

- **File size**: Maximum 32MB per file
- **Rate limits**: 4 requests per minute
- **Daily quota**: 500 requests per day
- **Analysis time**: May take several seconds

### Supported Content

- **Files**: All file types supported
- **URLs**: HTTP and HTTPS URLs only
- **Archives**: Scanned as single files
- **Executables**: Full analysis available

## Privacy and Security

### Data Handling

- Files are uploaded to VirusTotal servers
- URLs are submitted for public analysis
- Results may be cached by VirusTotal
- No local storage of scan results

### Recommendations

- Avoid scanning sensitive/confidential files
- Be aware that scanned content becomes part of VirusTotal's database
- Use for public/suspicious content only
- Consider privacy implications before scanning

## Troubleshooting

### Common Issues

- **API key not configured**: Check environment variables
- **File too large**: Reduce file size or use premium API
- **Rate limit exceeded**: Wait before making more requests
- **Network errors**: Check internet connection
- **Invalid URL format**: Ensure proper URL structure

### Error Messages

- "VirusTotal API key not configured"
- "File too large. Maximum size is 32MB."
- "Invalid URL format"
- "Failed to scan file/URL"
- "Rate limit exceeded"
