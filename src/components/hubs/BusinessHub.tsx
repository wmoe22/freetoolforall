'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, Mic, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function BusinessHub() {
    // Proposal Generator State
    const [proposalData, setProposalData] = useState({
        clientName: '',
        projectTitle: '',
        projectDescription: '',
        budget: '',
        timeline: '',
        companyName: '',
        contactPerson: ''
    })
    const [isGeneratingProposal, setIsGeneratingProposal] = useState(false)

    // Invoice Generator State
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: '',
        clientName: '',
        clientAddress: '',
        items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        dueDate: '',
        companyName: '',
        companyAddress: '',
        notes: ''
    })
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
    const [invoiceFormat, setInvoiceFormat] = useState<'pdf' | 'excel'>('pdf')

    // Meeting Notes State
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [meetingText, setMeetingText] = useState('')
    const [meetingTitle, setMeetingTitle] = useState('')
    const [attendees, setAttendees] = useState('')
    const [isProcessingNotes, setIsProcessingNotes] = useState(false)
    const [inputMethod, setInputMethod] = useState<'audio' | 'text'>('audio')

    const handleProposalInputChange = (field: string, value: string) => {
        setProposalData(prev => ({ ...prev, [field]: value }))
    }

    const handleGenerateProposal = async () => {
        if (!proposalData.clientName || !proposalData.projectTitle || !proposalData.projectDescription) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsGeneratingProposal(true)
        try {
            const response = await fetch('/api/business/generate-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proposalData)
            })

            if (!response.ok) throw new Error('Failed to generate proposal')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `proposal_${proposalData.clientName.replace(/\s+/g, '_')}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Proposal generated successfully!')
        } catch (error) {
            console.error('Proposal generation failed:', error)
            toast.error('Failed to generate proposal. Please try again.')
        } finally {
            setIsGeneratingProposal(false)
        }
    }

    const handleInvoiceItemChange = (index: number, field: string, value: any) => {
        const newItems = [...invoiceData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate
        }

        setInvoiceData(prev => ({ ...prev, items: newItems }))
    }

    const addInvoiceItem = () => {
        setInvoiceData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
        }))
    }

    const removeInvoiceItem = (index: number) => {
        if (invoiceData.items.length > 1) {
            setInvoiceData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }))
        }
    }

    const handleGenerateInvoice = async () => {
        if (!invoiceData.clientName || !invoiceData.companyName || invoiceData.items.some(item => !item.description)) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsGeneratingInvoice(true)
        try {
            const response = await fetch('/api/business/generate-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...invoiceData, format: invoiceFormat })
            })

            if (!response.ok) throw new Error('Failed to generate invoice')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `invoice_${invoiceData.invoiceNumber || 'new'}.${invoiceFormat}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Invoice generated successfully!')
        } catch (error) {
            console.error('Invoice generation failed:', error)
            toast.error('Failed to generate invoice. Please try again.')
        } finally {
            setIsGeneratingInvoice(false)
        }
    }

    const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setAudioFile(file)
        }
    }

    const handleGenerateMeetingNotes = async () => {
        if (inputMethod === 'audio' && !audioFile) {
            toast.error('Please select an audio file')
            return
        }
        if (inputMethod === 'text' && !meetingText.trim()) {
            toast.error('Please enter meeting text')
            return
        }

        setIsProcessingNotes(true)
        try {
            let transcript = meetingText

            // If using audio, first transcribe it
            if (inputMethod === 'audio' && audioFile) {
                const formData = new FormData()
                formData.append('audio', audioFile)

                const transcribeResponse = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData
                })

                if (!transcribeResponse.ok) throw new Error('Failed to transcribe audio')

                const transcribeResult = await transcribeResponse.json()
                transcript = transcribeResult.transcript
            }

            // Generate structured meeting notes
            const response = await fetch('/api/business/generate-meeting-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript,
                    meetingTitle,
                    attendees
                })
            })

            if (!response.ok) throw new Error('Failed to generate meeting notes')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `meeting_notes_${meetingTitle.replace(/\s+/g, '_') || 'untitled'}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Meeting notes generated successfully!')
        } catch (error) {
            console.error('Meeting notes generation failed:', error)
            toast.error('Failed to generate meeting notes. Please try again.')
        } finally {
            setIsProcessingNotes(false)
        }
    }

    const totalAmount = invoiceData.items.reduce((sum, item) => sum + item.amount, 0)

    return (
        <div className="space-y-6">
            <Card className="w-full bg-card border-border rounded-xl sm:rounded-2xl">
                <CardContent>
                    <Tabs defaultValue="proposal" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="proposal" className="flex items-center gap-2">
                                <FileText size={16} />
                                <span className="hidden sm:inline">Proposals</span>
                            </TabsTrigger>
                            <TabsTrigger value="invoice" className="flex items-center gap-2">
                                <FileText size={16} />
                                <span className="hidden sm:inline">Invoices</span>
                            </TabsTrigger>
                            <TabsTrigger value="meeting" className="flex items-center gap-2">
                                <Mic size={16} />
                                <span className="hidden sm:inline">Meeting Notes</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Proposal Generator Tab */}
                        <TabsContent value="proposal" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Proposal Generator</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Generate professional business proposals using AI
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Client Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={proposalData.clientName}
                                            onChange={(e) => handleProposalInputChange('clientName', e.target.value)}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Enter client name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            value={proposalData.companyName}
                                            onChange={(e) => handleProposalInputChange('companyName', e.target.value)}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Your company name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Project Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={proposalData.projectTitle}
                                        onChange={(e) => handleProposalInputChange('projectTitle', e.target.value)}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Enter project title"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Project Description *
                                    </label>
                                    <textarea
                                        value={proposalData.projectDescription}
                                        onChange={(e) => handleProposalInputChange('projectDescription', e.target.value)}
                                        rows={4}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Describe the project requirements and scope"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Budget Range
                                        </label>
                                        <input
                                            type="text"
                                            value={proposalData.budget}
                                            onChange={(e) => handleProposalInputChange('budget', e.target.value)}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="e.g., $5,000 - $10,000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Timeline
                                        </label>
                                        <input
                                            type="text"
                                            value={proposalData.timeline}
                                            onChange={(e) => handleProposalInputChange('timeline', e.target.value)}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="e.g., 4-6 weeks"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerateProposal}
                                    disabled={isGeneratingProposal}
                                    className="w-full"
                                >
                                    {isGeneratingProposal ? (
                                        <>
                                            <RefreshCw size={16} className="mr-2 animate-spin" />
                                            Generating Proposal...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} className="mr-2" />
                                            Generate Proposal
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Invoice Generator Tab */}
                        <TabsContent value="invoice" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Invoice Generator</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Create professional invoices in PDF or Excel format
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            value={invoiceData.invoiceNumber}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="INV-001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={invoiceData.dueDate}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={invoiceData.companyName}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, companyName: e.target.value }))}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Your company name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Client Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={invoiceData.clientName}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, clientName: e.target.value }))}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Client name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Company Address
                                    </label>
                                    <textarea
                                        value={invoiceData.companyAddress}
                                        onChange={(e) => setInvoiceData(prev => ({ ...prev, companyAddress: e.target.value }))}
                                        rows={2}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Your company address"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Client Address
                                    </label>
                                    <textarea
                                        value={invoiceData.clientAddress}
                                        onChange={(e) => setInvoiceData(prev => ({ ...prev, clientAddress: e.target.value }))}
                                        rows={2}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Client address"
                                    />
                                </div>

                                {/* Invoice Items */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Invoice Items *
                                        </label>
                                        <Button
                                            type="button"
                                            onClick={addInvoiceItem}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Add Item
                                        </Button>
                                    </div>

                                    {invoiceData.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-5">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleInvoiceItemChange(index, 'description', e.target.value)}
                                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Item description"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleInvoiceItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Qty"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleInvoiceItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Rate"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    value={`$${item.amount.toFixed(2)}`}
                                                    readOnly
                                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                {invoiceData.items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => removeInvoiceItem(index)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        ×
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-end">
                                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                                            Total: ${totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Notes
                                    </label>
                                    <textarea
                                        value={invoiceData.notes}
                                        onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Additional notes or payment terms"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                                            Export Format
                                        </h4>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
                                                <input
                                                    type="radio"
                                                    name="format"
                                                    checked={invoiceFormat === 'pdf'}
                                                    onChange={() => setInvoiceFormat('pdf')}
                                                />
                                                PDF (Recommended)
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
                                                <input
                                                    type="radio"
                                                    name="format"
                                                    checked={invoiceFormat === 'excel'}
                                                    onChange={() => setInvoiceFormat('excel')}
                                                />
                                                Excel (XLSX)
                                            </label>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerateInvoice}
                                        disabled={isGeneratingInvoice}
                                        className="w-full"
                                    >
                                        {isGeneratingInvoice ? (
                                            <>
                                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                                Generating Invoice...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} className="mr-2" />
                                                Generate Invoice ({invoiceFormat.toUpperCase()})
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Meeting Notes Tab */}
                        <TabsContent value="meeting" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Meeting Notes Generator</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Convert audio recordings or text into structured meeting notes using AI
                                    </p>
                                </div>

                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                                        Input Method
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
                                            <input
                                                type="radio"
                                                name="inputMethod"
                                                checked={inputMethod === 'audio'}
                                                onChange={() => setInputMethod('audio')}
                                            />
                                            Audio Recording (Deepgram STT + Gemini AI)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
                                            <input
                                                type="radio"
                                                name="inputMethod"
                                                checked={inputMethod === 'text'}
                                                onChange={() => setInputMethod('text')}
                                            />
                                            Text Input (Gemini AI)
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Meeting Title
                                        </label>
                                        <input
                                            type="text"
                                            value={meetingTitle}
                                            onChange={(e) => setMeetingTitle(e.target.value)}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="e.g., Weekly Team Standup"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Attendees
                                        </label>
                                        <input
                                            type="text"
                                            value={attendees}
                                            onChange={(e) => setAttendees(e.target.value)}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="John, Sarah, Mike"
                                        />
                                    </div>
                                </div>

                                {inputMethod === 'audio' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Audio Recording
                                        </label>
                                        <input
                                            type="file"
                                            onChange={handleAudioFileSelect}
                                            accept="audio/*"
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900 dark:file:text-purple-300"
                                        />
                                        {audioFile && (
                                            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <Mic size={16} className="text-purple-600" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                                    {audioFile.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Meeting Transcript/Notes
                                        </label>
                                        <textarea
                                            value={meetingText}
                                            onChange={(e) => setMeetingText(e.target.value)}
                                            rows={6}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Paste your meeting transcript or raw notes here..."
                                        />
                                    </div>
                                )}

                                <Button
                                    onClick={handleGenerateMeetingNotes}
                                    disabled={isProcessingNotes}
                                    className="w-full"
                                >
                                    {isProcessingNotes ? (
                                        <>
                                            <RefreshCw size={16} className="mr-2 animate-spin" />
                                            Processing Meeting Notes...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} className="mr-2" />
                                            Generate Meeting Notes
                                        </>
                                    )}
                                </Button>

                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                                        What you'll get:
                                    </h4>
                                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                                        <li>• Executive summary</li>
                                        <li>• Key discussion points</li>
                                        <li>• Action items with owners</li>
                                        <li>• Decisions made</li>
                                        <li>• Next steps and follow-ups</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}