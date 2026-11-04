type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

interface ButtonProps extends React.ComponentProps<'button'>{
    label: string;
    onClick: () => void;
    variant?: Variant
    size?: Size

}

export default function Button( 
    {
        label, 
        onClick,
        variant = "primary",
        size = "lg",
        className = '',
        ...props
    }:ButtonProps){
    return(
        <button 
        {...props}
        className={`rounded font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        onClick={onClick}>
            {label}
        </button>
    );
}