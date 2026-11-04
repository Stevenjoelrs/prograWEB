import type { ContentSlide } from '../../models/Slide'

interface LayoutTextAndImageProps extends React.ComponentProps<'div'> {
    slide: ContentSlide;
    className?: string;
}

/**
 * Diapositiva de desarrollo mixta: texto e imagen en paralelo. Cada
 * zona muestra su propio placeholder si falta su contenido.
 */
export default function LayoutTextAndImage(
    {
        slide,
        className = '',
        ...props
    }: LayoutTextAndImageProps){
    const body = slide.body?.trim();
    const imageUrl = slide.imageUrl?.trim();
    const imageAlt = slide.imageAlt?.trim() || slide.title;

    return(
        <div
        {...props}
        className={`flex min-h-0 w-full flex-1 flex-col ${className}`}>
            <h2 className="text-2xl font-semibold tracking-tight">{slide.title}</h2>
            <div className="mt-4 flex min-h-0 w-full flex-1 flex-col gap-6 md:flex-row">
                <div className="flex min-h-0 flex-1 flex-col">
                    {body ? (
                        <p className="whitespace-pre-line leading-relaxed text-slate-700">
                            {slide.body}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400">Sin contenido</p>
                    )}
                </div>
                <div className="flex min-h-0 flex-1 items-center justify-center">
                    {imageUrl ? (
                        <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="max-h-full w-full object-contain" />
                    ) : (
                        <p className="text-sm text-slate-400">Sin imagen</p>
                    )}
                </div>
            </div>
        </div>
    );
}
