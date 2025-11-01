'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Send } from 'lucide-react'
import { useState } from 'react'

interface ToolRequestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ToolRequestDialog({ open, onOpenChange }: ToolRequestDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        toolName: '',
        description: '',
        useCase: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const subject = `Tool Request: ${formData.toolName || 'New Tool'}`
        const body = `
Hi,

I would like to request a new tool for FreeToolForAll:

Name: ${formData.name}
Email: ${formData.email}

Tool Name: ${formData.toolName}

Description:
${formData.description}

Use Case:
${formData.useCase}

Thank you for considering this request!

Best regards,
${formData.name}
    `.trim()

        const mailtoLink = `mailto:wmoecontact@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoLink, '_blank')

        // Reset form and close dialog
        setFormData({
            name: '',
            email: '',
            toolName: '',
            description: '',
            useCase: ''
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md dark:bg-zinc-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Request a New Tool
                    </DialogTitle>
                    <DialogDescription>
                        Tell us about the tool you'd like to see added to FreeToolForAll. We'll review your request and get back to you!
                    </DialogDescription>
                </DialogHeader>

                <DialogClose onClose={() => onOpenChange(false)} />

                <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className='dark:text-zinc-400' htmlFor="name">Your Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="John Doe"
                                required
                                className="mt-1 dark:text-zinc-300"
                            />
                        </div>
                        <div>
                            <Label className='dark:text-zinc-400' htmlFor="email">Your Email *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="john@example.com"
                                required
                                className="mt-1 dark:text-zinc-300"
                            />
                        </div>
                    </div>

                    <div>
                        <Label className='dark:text-zinc-400' htmlFor="toolName">Tool Name *</Label>
                        <Input
                            id="toolName"
                            name="toolName"
                            value={formData.toolName}
                            onChange={handleInputChange}
                            placeholder="e.g., QR Code Generator, Password Manager"
                            required
                            className="mt-1 dark:text-zinc-300"
                        />
                    </div>

                    <div>
                        <Label className='dark:text-zinc-400' htmlFor="description">Tool Description *</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Describe what this tool should do and its main features..."
                            required
                            className="mt-1 min-h-[80px] dark:text-zinc-300"
                        />
                    </div>

                    <div>
                        <Label className='dark:text-zinc-400' htmlFor="useCase">Use Case</Label>
                        <Textarea
                            id="useCase"
                            name="useCase"
                            value={formData.useCase}
                            onChange={handleInputChange}
                            placeholder="How would you use this tool? What problem does it solve?"
                            className="mt-1 min-h-[60px] dark:text-zinc-300"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={!formData.name || !formData.email || !formData.toolName || !formData.description}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send Request
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}