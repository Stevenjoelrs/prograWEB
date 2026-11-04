type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-red-600 text-white',
  secondary: 'border border-neutral-700 bg-black text-white',
  danger: 'border border-red-500 bg-black text-red-400',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

interface ButtonProps extends React.ComponentProps<'button'>{
    label: string;
    variant?: Variant
    size?: Size

}

export default function Button( 
    {
        label, 
        onClick,
        variant = "primary",
        size = "lg",
        type = 'button',
        className = '',
        ...props
    }:ButtonProps){
    return(
        <button 
        {...props}
        type={type}
        className={`min-h-11 rounded-none font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 disabled:opacity-40 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        onClick={onClick}>
            {label}
        </button>
    );
}
