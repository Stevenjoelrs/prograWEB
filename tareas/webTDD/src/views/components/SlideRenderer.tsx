import type { Project } from '../../models/Project'
import type { ContentSlide, Slide } from '../../models/Slide'
import HeaderFooter from './HeaderFooter'
import LayoutImageOnly from './LayoutImageOnly'
import LayoutTextAndImage from './LayoutTextAndImage'
import LayoutTextOnly from './LayoutTextOnly'

interface SlideRendererProps extends React.ComponentProps<'div'> {
    slide: Slide;
    project: Project;
    /** Posición del slide dentro del proyecto (base 0). */
    slideIndex?: number;
    className?: string;
}

/**
 * Pinta cualquier diapositiva según su tipo:
 *
 * - `title`  → portada a pantalla completa (sin marco de header/footer).
 * - `content`→ el layout elegido envuelto en `HeaderFooter`, que muestra
 *              autor, tópico, número de slide y fecha del proyecto.
 */
export default function SlideRenderer(
    {
        slide,
        project,
        slideIndex = 0,
        className = '',
        ...props
    }: SlideRendererProps){
    if (slide.type === 'title'){
        return(
            <div
            {...props}
            className={`flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4 px-8 text-center ${className}`}>
                <h1 className="text-4xl font-semibold tracking-tight">{slide.title}</h1>
                {slide.subtitle?.trim() && (
                    <p className="text-lg text-neutral-600">{slide.subtitle}</p>
                )}
            </div>
        );
    }

    return(
        <HeaderFooter
        {...props}
        author={project.author}
        topic={project.topic}
        slideNumber={slideIndex + 1}
        date={project.date}
        className={`min-h-0 ${className}`}>
            {renderLayout(slide)}
        </HeaderFooter>
    );
}

function renderLayout(slide: ContentSlide){
    switch(slide.layout){
        case 'image-only':
            return <LayoutImageOnly slide={slide} className="overflow-y-auto px-8" />;
        case 'text-and-image':
            return <LayoutTextAndImage slide={slide} className="overflow-y-auto px-8" />;
        default:
            return <LayoutTextOnly slide={slide} className="overflow-y-auto px-8" />;
    }
}
