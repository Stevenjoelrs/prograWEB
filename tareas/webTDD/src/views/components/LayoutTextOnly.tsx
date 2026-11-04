import type { ContentSlide } from '../../models/Slide'

interface LayoutTextOnlyProps extends React.ComponentProps<'div'> {
    slide: ContentSlide;
    className?: string;
}

/**
 * Diapositiva de desarrollo con texto: título, cuerpo y placeholder
 * cuando el cuerpo no tiene contenido.
 */
export default function LayoutTextOnly(
    {
        slide,
        className = '',
        ...props
    }: LayoutTextOnlyProps){
    const body = slide.body?.trim();

    return(
        <div
        {...props}
        className={`flex min-h-0 w-full flex-1 flex-col ${className}`}>
            <h2 className="text-2xl font-semibold tracking-tight">{slide.title}</h2>
            {body ? (
                <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-700">
                    {slide.body}
                </p>
            ) : (
                <p className="mt-4 text-sm text-slate-400">Sin contenido</p>
            )}
        </div>
    );
}
