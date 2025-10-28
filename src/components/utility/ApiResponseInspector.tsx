'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle, Copy, Download, Eye, Loader2, Search, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ApiResponse {
    url: string
    method: string
    status: number
    statusText: string
    headers: Record<string, string>
    data: any
    responseTime: number
    size: number
    timestamp: string
    error?: string
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export default function ApiResponseInspector() {
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState<ApiResponse | null>(null)
    const [url, setUrl] = useState('')
    const [method, setMethod] = useState('GET')
    const [requestBody, setRequestBody] = useState('')
    const [requestHeaders, setRequestHeaders] = useState('')
    const [activeTab, setActiveTab] = useState('response')

    const inspectApi = async () => {
        if (!url.trim()) {
            toast.error('Please enter a URL')
            return
        }

        setLoading(true)
        setResponse(null)

        try {
            const startTime = Date.now()

            // Parse custom headers
            let headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            if (requestHeaders.trim()) {
                try {
                    const customHeaders = JSON.parse(requestHeaders)
                    headers = { ...headers, ...customHeaders }
                } catch {
                    // Try parsing as key:value pairs
                    const lines = requestHeaders.split('\n')
                    lines.forEach(line => {
                        const [key, ...valueParts] = line.split(':')
                        if (key && valueParts.length > 0) {
                            headers[key.trim()] = valueParts.join(':').trim()
                        }
                    })
                }
            }

            const requestOptions: RequestInit = {
                method,
                headers
            }

            if (method !== 'GET' && method !== 'HEAD' && requestBody.trim()) {
                requestOptions.body = requestBody
            }

            const apiResponse = await fetch('/api/utility/inspect-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url.trim(),
                    method,
                    headers,
                    body: requestBody.trim() || undefined
                }),
            })

            const responseTime = Date.now() - startTime

            if (!apiResponse.ok) {
                throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`)
            }

            const result = await apiResponse.json()

            setResponse({
                ...result,
                responseTime
            })

            setActiveTab('response')
            toast.success('API response received!')

        } catch (error) {
            console.error('API inspection error:', error)
            setResponse({
                url: url.trim(),
                method,
                status: 0,
                statusText: 'Error',
                headers: {},
                data: null,
                responseTime: 0,
                size: 0,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Failed to inspect API'
            })
            toast.error('Failed to inspect API')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400'
        if (status >= 300 && status < 400) return 'text-blue-600 dark:text-blue-400'
        if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-400'
        if (status >= 500) return 'text-red-600 dark:text-red-400'
        return 'text-gray-600 dark:text-gray-400'
    }

    const getStatusIcon = (status: number) => {
        if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4 text-green-500" />
        if (status >= 300 && status < 400) return <Eye className="h-4 w-4 text-blue-500" />
        if (status >= 400) return <XCircle className="h-4 w-4 text-red-500" />
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied to clipboard!`)
    }

    const downloadResponse = () => {
        if (!response) return

        const content = JSON.stringify(response, null, 2)
        const blob = new Blob([content], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `api-response-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Response downloaded!')
    }

    const formatJson = (obj: any) => {
        try {
            return JSON.stringify(obj, null, 2)
        } catch {
            return String(obj)
        }
    }

    const renderResponse = () => {
        if (!response) return null

        return (
            <div className="mt-4 space-y-4">
                {/* Status Overview */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(response.status)}
                            Response Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-zinc-400">Status</p>
                                <p className={`text-lg font-semibold ${getStatusColor(response.status)}`}>
                                    {response.status} {response.statusText}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Response Time</p>
                                <p className="text-lg font-semibold">{response.responseTime}ms</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Size</p>
                                <p className="text-lg font-semibold">
                                    {response.size > 1024
                                        ? `${(response.size / 1024).toFixed(1)}KB`
                                        : `${response.size}B`
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-400">Method</p>
                                <Badge variant="outline" className="text-sm">
                                    {response.method}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(response.url, 'URL')}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy URL
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadResponse}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Response */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-700">
                        <TabsTrigger value="response" className="data-[state=active]:bg-zinc-700">
                            Response Body
                        </TabsTrigger>
                        <TabsTrigger value="headers" className="data-[state=active]:bg-zinc-700">
                            Headers ({Object.keys(response.headers).length})
                        </TabsTrigger>
                        <TabsTrigger value="raw" className="data-[state=active]:bg-zinc-700">
                            Raw Data
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="response" className="space-y-4">
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Response Body</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(formatJson(response.data), 'Response body')}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-zinc-900 p-4 rounded border border-zinc-600 overflow-auto max-h-96 text-sm">
                                    <code>{formatJson(response.data)}</code>
                                </pre>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="headers" className="space-y-4">
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Response Headers</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(formatJson(response.headers), 'Headers')}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(response.headers).map(([key, value]) => (
                                        <div key={key} className="flex items-start gap-4 p-2 bg-zinc-900 rounded border border-zinc-600">
                                            <div className="font-medium text-blue-400 min-w-0 flex-1">
                                                {key}:
                                            </div>
                                            <div className="text-zinc-300 min-w-0 flex-2 break-all">
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="raw" className="space-y-4">
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Raw Response Data</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(formatJson(response), 'Raw data')}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-zinc-900 p-4 rounded border border-zinc-600 overflow-auto max-h-96 text-sm">
                                    <code>{formatJson(response)}</code>
                                </pre>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {response.error && (
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <CardContent className="pt-6">
                            <p className="text-red-600 dark:text-red-400">
                                <span className="font-medium">Error:</span> {response.error}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        )
    }

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                    <Search className="h-5 w-5" />
                    API Response Inspector
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                    Inspect and format API responses with detailed analysis
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Request Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <Label htmlFor="url-input" className="text-zinc-700 dark:text-zinc-300">API URL</Label>
                        <Input
                            id="url-input"
                            type="url"
                            placeholder="https://api.example.com/endpoint"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="mt-1 border-zinc-700 bg-zinc-800"
                        />
                    </div>
                    <div>
                        <Label htmlFor="method-select" className="text-zinc-700 dark:text-zinc-300">Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="mt-1 border-zinc-700 bg-zinc-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {HTTP_METHODS.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Optional Request Body */}
                {method !== 'GET' && method !== 'HEAD' && (
                    <div>
                        <Label htmlFor="request-body" className="text-zinc-700 dark:text-zinc-300">
                            Request Body (JSON)
                        </Label>
                        <Textarea
                            id="request-body"
                            placeholder='{"key": "value"}'
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            className="mt-1 border-zinc-700 bg-zinc-800 min-h-[100px]"
                        />
                    </div>
                )}

                {/* Optional Headers */}
                <div>
                    <Label htmlFor="request-headers" className="text-zinc-700 dark:text-zinc-300">
                        Custom Headers (JSON or key:value format)
                    </Label>
                    <Textarea
                        id="request-headers"
                        placeholder='{"Authorization": "Bearer token"} or Authorization: Bearer token'
                        value={requestHeaders}
                        onChange={(e) => setRequestHeaders(e.target.value)}
                        className="mt-1 border-zinc-700 bg-zinc-800 min-h-[80px]"
                    />
                </div>

                <Button
                    onClick={inspectApi}
                    disabled={!url.trim() || loading}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inspecting API...
                        </>
                    ) : (
                        <>
                            <Search className="mr-2 h-4 w-4" />
                            Inspect API Response
                        </>
                    )}
                </Button>

                {renderResponse()}

                {/* API Testing Tips */}
                <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900/20 rounded-lg border border-zinc-700">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-zinc-900 dark:text-white">
                        <Eye className="h-4 w-4" />
                        API Testing Tips
                    </h4>
                    <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                        <li>• Use proper authentication headers for protected endpoints</li>
                        <li>• Check response status codes and headers for debugging</li>
                        <li>• Validate JSON structure and data types in responses</li>
                        <li>• Monitor response times for performance analysis</li>
                        <li>• Test different HTTP methods (GET, POST, PUT, DELETE)</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}