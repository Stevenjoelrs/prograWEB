import type { ContentSlide } from '../../models/Slide'

interface LayoutImageOnlyProps extends React.ComponentProps<'div'> {
    slide: ContentSlide;
    className?: string;
}

/**
 * Diapositiva de desarrollo con imagen: título, imagen ajustada al
 * espacio disponible y placeholder cuando falta la URL.
 */
export default function LayoutImageOnly(
    {
        slide,
        className = '',
        ...props
    }: LayoutImageOnlyProps){
    const imageUrl = slide.imageUrl?.trim();
    const imageAlt = slide.imageAlt?.trim() || slide.title;

    return(
        <div
        {...props}
        className={`flex min-h-0 w-full flex-1 flex-col ${className}`}>
            <h2 className="text-2xl font-semibold tracking-tight">{slide.title}</h2>
            {imageUrl ? (
                <img
                src={imageUrl}
                alt={imageAlt}
                className="mt-4 min-h-0 w-full flex-1 object-contain" />
            ) : (
                <p className="mt-4 text-sm text-slate-400">Sin imagen</p>
            )}
        </div>
    );
}
