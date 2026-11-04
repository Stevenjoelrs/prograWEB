import { render, screen, within } from '@testing-library/react'
import HeaderFooter from '../views/components/HeaderFooter'

const defaultProps = {
  author: 'Ada Lovelace',
  topic: 'Compiladores',
  slideNumber: 3,
  date: '12/10/2026',
}

describe('HeaderFooter', () => {
  it('muestra autor y tópico en la barra superior', () => {
    render(<HeaderFooter {...defaultProps} />)

    const banner = screen.getByRole('banner')
    expect(within(banner).getByText('Ada Lovelace')).toBeInTheDocument()
    expect(within(banner).getByText('Compiladores')).toBeInTheDocument()
  })

  it('muestra número de slide y fecha en la barra inferior', () => {
    render(<HeaderFooter {...defaultProps} />)

    const contentinfo = screen.getByRole('contentinfo')
    expect(within(contentinfo).getByText('3')).toBeInTheDocument()
    expect(within(contentinfo).getByText('12/10/2026')).toBeInTheDocument()
  })

  it('renderiza el número de slide y la fecha tal cual se reciben', () => {
    render(<HeaderFooter {...defaultProps} slideNumber={12} date="01/02/2026" />)

    expect(screen.getByRole('contentinfo')).toHaveTextContent('12')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('01/02/2026')
  })

  it('renderiza el contenido entre el header y el footer', () => {
    const { container } = render(
      <HeaderFooter {...defaultProps}>
        <p data-testid="layout">Contenido de la diapositiva</p>
      </HeaderFooter>,
    )

    const root = container.firstElementChild
    expect(root).not.toBeNull()
    expect(root?.children).toHaveLength(3)
    expect(root?.children[0]).toBe(screen.getByRole('banner'))
    expect(root?.children[1]).toBe(screen.getByTestId('layout'))
    expect(root?.children[2]).toBe(screen.getByRole('contentinfo'))
  })

  it('ocupa el ancho completo del contenedor', () => {
    const { container } = render(<HeaderFooter {...defaultProps} />)

    expect(container.firstElementChild?.className).toContain('w-full')
  })

  it('dispone las barras de extremo a extremo con el contenido en columna', () => {
    const { container } = render(<HeaderFooter {...defaultProps} />)

    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('flex-col')
    expect(screen.getByRole('banner').className).toContain('w-full')
    expect(screen.getByRole('contentinfo').className).toContain('w-full')
  })

  it('concatena una className personalizada sin perder las clases base', () => {
    const { container } = render(
      <HeaderFooter {...defaultProps} className="text-sm" />,
    )

    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('text-sm')
    expect(className).toContain('w-full')
    expect(className).toContain('flex-col')
  })

  it('propaga las propiedades nativas del contenedor', () => {
    render(<HeaderFooter {...defaultProps} data-testid="slide-frame" />)

    expect(screen.getByTestId('slide-frame')).toBeInTheDocument()
  })

  it('renderiza solo las barras cuando no se envía contenido', () => {
    const { container } = render(<HeaderFooter {...defaultProps} />)

    expect(container.firstElementChild?.children).toHaveLength(2)
  })
})
