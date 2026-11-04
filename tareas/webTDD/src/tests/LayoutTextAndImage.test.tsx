import { render, screen } from '@testing-library/react'
import LayoutTextAndImage from '../views/components/LayoutTextAndImage'
import { buildContentSlide } from './factories/projectFactory'

const imageUrl = 'https://example.com/arquitectura.png'

describe('LayoutTextAndImage', () => {
  it('renderiza el título del slide como encabezado de nivel 2', () => {
    const slide = buildContentSlide({ title: 'Persistencia local' })

    render(<LayoutTextAndImage slide={slide} />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Persistencia local' }),
    ).toBeInTheDocument()
  })

  it('muestra el texto y la imagen al mismo tiempo', () => {
    const slide = buildContentSlide({
      body: 'IndexedDB guarda los proyectos.',
      imageUrl,
      imageAlt: 'Esquema de la base de datos',
    })

    render(<LayoutTextAndImage slide={slide} />)

    expect(screen.getByText('IndexedDB guarda los proyectos.')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Esquema de la base de datos' }),
    ).toHaveAttribute('src', imageUrl)
  })

  it('coloca el texto antes de la imagen en el orden de lectura', () => {
    const { container } = render(
      <LayoutTextAndImage
        slide={buildContentSlide({ body: 'Cuerpo', imageUrl, imageAlt: 'Imagen' })}
      />,
    )

    const root = container.firstElementChild
    const text = screen.getByText('Cuerpo')
    const image = screen.getByRole('img')

    expect(root?.children).toHaveLength(2)
    expect(text.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('muestra el placeholder de texto sin ocultar la imagen', () => {
    render(
      <LayoutTextAndImage
        slide={buildContentSlide({ body: undefined, imageUrl, imageAlt: 'Imagen' })}
      />,
    )

    expect(screen.getByText('Sin contenido')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Imagen' })).toBeInTheDocument()
  })

  it('muestra el placeholder de imagen sin ocultar el texto', () => {
    render(
      <LayoutTextAndImage
        slide={buildContentSlide({ body: 'Solo texto', imageUrl: undefined })}
      />,
    )

    expect(screen.getByText('Sin imagen')).toBeInTheDocument()
    expect(screen.getByText('Solo texto')).toBeInTheDocument()
  })

  it('muestra ambos placeholders cuando faltan los dos campos', () => {
    render(
      <LayoutTextAndImage
        slide={buildContentSlide({ body: undefined, imageUrl: undefined })}
      />,
    )

    expect(screen.getByText('Sin contenido')).toBeInTheDocument()
    expect(screen.getByText('Sin imagen')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('ocupa el espacio disponible dentro del marco', () => {
    const { container } = render(<LayoutTextAndImage slide={buildContentSlide()} />)

    const className = container.firstElementChild?.className ?? ''
    expect(className).toContain('w-full')
    expect(className).toContain('flex-1')
  })
})
