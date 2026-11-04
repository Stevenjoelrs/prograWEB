interface HeaderFooterProps extends React.ComponentProps<'div'> {
    author: string;
    topic: string;
    slideNumber: number;
    date: string;
    children?: React.ReactNode;
    className?: string;
}

/**
 * Marco de las diapositivas de desarrollo: barra superior con autor y tópico,
 * barra inferior con número de slide y fecha, y el contenido en el medio.
 * Ambas barras ocupan el ancho completo (`w-full`).
 */
export default function HeaderFooter(
    {
        author,
        topic,
        slideNumber,
        date,
        children,
        className = '',
        ...props
    }: HeaderFooterProps){
    return(
        <div
        {...props}
        className={`flex h-full min-h-0 w-full flex-col justify-between gap-4 ${className}`}>
            <header className="flex w-full shrink-0 items-baseline justify-between gap-4 px-8 pt-6">
                <span className="min-w-0 truncate font-medium">{author}</span>
                <span className="min-w-0 truncate">{topic}</span>
            </header>
            {children}
            <footer className="flex w-full shrink-0 items-baseline justify-between gap-4 px-8 pb-6 text-sm">
                <span>{slideNumber}</span>
                <span>{date}</span>
            </footer>
        </div>
    );
}
