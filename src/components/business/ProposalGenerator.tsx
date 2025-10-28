'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ProposalGenerator() {
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

    return (
        <Card className="w-full bg-zinc-800 border-zinc-700 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Proposal Generator</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Generate professional business proposals using AI
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Client Name *
                            </label>
                            <input
                                type="text"
                                value={proposalData.clientName}
                                onChange={(e) => handleProposalInputChange('clientName', e.target.value)}
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                                placeholder="Enter client name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={proposalData.companyName}
                                onChange={(e) => handleProposalInputChange('companyName', e.target.value)}
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                                placeholder="Your company name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Project Title *
                        </label>
                        <input
                            type="text"
                            value={proposalData.projectTitle}
                            onChange={(e) => handleProposalInputChange('projectTitle', e.target.value)}
                            className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                            placeholder="Enter project title"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Project Description *
                        </label>
                        <textarea
                            value={proposalData.projectDescription}
                            onChange={(e) => handleProposalInputChange('projectDescription', e.target.value)}
                            rows={4}
                            className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                            placeholder="Describe the project requirements and scope"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Budget Range
                            </label>
                            <input
                                type="text"
                                value={proposalData.budget}
                                onChange={(e) => handleProposalInputChange('budget', e.target.value)}
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
                                placeholder="e.g., $5,000 - $10,000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Timeline
                            </label>
                            <input
                                type="text"
                                value={proposalData.timeline}
                                onChange={(e) => handleProposalInputChange('timeline', e.target.value)}
                                className="w-full p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-900 dark:text-white"
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
            </CardContent>
        </Card>
    )
}