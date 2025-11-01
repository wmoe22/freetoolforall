'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'

interface FeedbackDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        feedbackType: '',
        subject: '',
        message: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            feedbackType: value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const emailSubject = `Feedback: ${formData.subject || formData.feedbackType}`
        const body = `
Hi FreeToolForAll Team,

I have some feedback to share:

Name: ${formData.name}
Email: ${formData.email}
Feedback Type: ${formData.feedbackType}
Subject: ${formData.subject}

Message:
${formData.message}

Thank you for your time and for providing these great tools!

Best regards,
${formData.name}
    `.trim()

        const mailtoLink = `mailto:wmoecontact@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoLink, '_blank')

        // Reset form and close dialog
        setFormData({
            name: '',
            email: '',
            feedbackType: '',
            subject: '',
            message: ''
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md dark:bg-zinc-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Share Your Feedback
                    </DialogTitle>
                    <DialogDescription>
                        We'd love to hear from you! Share your thoughts, suggestions, or report any issues you've encountered.
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
                        <Label className='dark:text-zinc-400' htmlFor="feedbackType">Feedback Type *</Label>
                        <Select value={formData.feedbackType} onValueChange={handleSelectChange}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select feedback type" />
                            </SelectTrigger>
                            <SelectContent className='dark:text-zinc-300'>
                                <SelectItem value="bug-report" className='dark:text-zinc-300'>Bug Report</SelectItem>
                                <SelectItem value="feature-request">Feature Request</SelectItem>
                                <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                                <SelectItem value="compliment">Compliment</SelectItem>
                                <SelectItem value="general">General Feedback</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className='dark:text-zinc-400' htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder="Brief description of your feedback"
                            required
                            className="mt-1 dark:text-zinc-300"
                        />
                    </div>

                    <div>
                        <Label className='dark:text-zinc-400' htmlFor="message">Your Message *</Label>
                        <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Please share your detailed feedback, suggestions, or describe any issues you've encountered..."
                            required
                            className="mt-1 min-h-[100px] dark:text-zinc-300"
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
                            disabled={!formData.name || !formData.email || !formData.feedbackType || !formData.subject || !formData.message}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send Feedback
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}