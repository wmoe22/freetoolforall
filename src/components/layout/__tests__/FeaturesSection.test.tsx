import { render, screen } from '@testing-library/react'
import FeaturesSection from '../FeaturesSection'

describe('FeaturesSection', () => {
    it('renders all three feature cards', () => {
        render(<FeaturesSection />)

        // Check for feature headings
        expect(screen.getByText('Real-time Processing')).toBeInTheDocument()
        expect(screen.getByText('Natural Voices')).toBeInTheDocument()
        expect(screen.getByText('Privacy First')).toBeInTheDocument()
    })

    it('renders feature descriptions', () => {
        render(<FeaturesSection />)

        // Check for feature descriptions (using getAllByText for responsive text)
        expect(screen.getAllByText(/Instant voice recognition/)).toHaveLength(2)
        expect(screen.getAllByText(/High-quality speech synthesis/)).toHaveLength(2)
        expect(screen.getAllByText(/No registration/)).toHaveLength(2)
    })

    it('has proper accessibility attributes', () => {
        render(<FeaturesSection />)

        // Check for section with aria-labelledby
        const section = screen.getByRole('region')
        expect(section).toHaveAttribute('aria-labelledby', 'features-heading')

        // Check for screen reader heading
        expect(screen.getByText('Key Features')).toBeInTheDocument()
    })

    it('renders icons for each feature', () => {
        const { container } = render(<FeaturesSection />)

        // Check that SVG icons are present (lucide-react icons render as SVGs)
        const svgElements = container.querySelectorAll('svg')
        expect(svgElements).toHaveLength(6) // 3 features × 2 icons each (mobile + desktop)
    })

    it('has responsive design classes', () => {
        const { container } = render(<FeaturesSection />)

        // Check for responsive grid classes
        const gridContainer = container.querySelector('.grid')
        expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3')
    })
})