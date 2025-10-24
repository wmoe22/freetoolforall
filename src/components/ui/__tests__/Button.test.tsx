import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Simple Button component for testing
interface ButtonProps {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary'
    className?: string
}

function Button({ children, onClick, disabled = false, variant = 'primary', className = '' }: ButtonProps) {
    const baseClasses = 'px-4 py-2 rounded font-medium transition-colors'
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100'
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
            {children}
        </button>
    )
}

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
        const handleClick = jest.fn()
        const user = userEvent.setup()

        render(<Button onClick={handleClick}>Click me</Button>)

        await user.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
        const handleClick = jest.fn()
        const user = userEvent.setup()

        render(<Button onClick={handleClick} disabled>Click me</Button>)

        await user.click(screen.getByRole('button'))
        expect(handleClick).not.toHaveBeenCalled()
    })

    it('applies correct variant classes', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-blue-600')

        rerender(<Button variant="secondary">Secondary</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-gray-200')
    })

    it('applies custom className', () => {
        render(<Button className="custom-class">Button</Button>)
        expect(screen.getByRole('button')).toHaveClass('custom-class')
    })

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('is focusable and accessible', () => {
        render(<Button>Button</Button>)

        const button = screen.getByRole('button')
        button.focus()

        expect(button).toHaveFocus()
    })
})