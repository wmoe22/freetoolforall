"use client"

import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import * as React from "react"

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false)
            }
        }

        if (open) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [open, onOpenChange])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            {children}
        </div>
    )
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
    return (
        <div
            className={cn(
                "relative z-50 w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
    return (
        <div
            className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
            {...props}
        >
            {children}
        </div>
    )
}

function DialogTitle({ className, children, ...props }: DialogTitleProps) {
    return (
        <h2
            className={cn("text-lg font-semibold leading-none tracking-tight text-slate-900 dark:text-white", className)}
            {...props}
        >
            {children}
        </h2>
    )
}

function DialogDescription({ className, children, ...props }: DialogDescriptionProps) {
    return (
        <p
            className={cn("text-sm text-slate-600 dark:text-slate-400", className)}
            {...props}
        >
            {children}
        </p>
    )
}

function DialogClose({ className, onClose, ...props }: { className?: string; onClose: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={cn(
                "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-slate-950 dark:focus:ring-slate-300",
                className
            )}
            onClick={onClose}
            {...props}
        >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </button>
    )
}

export {
    Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader,
    DialogTitle
}
