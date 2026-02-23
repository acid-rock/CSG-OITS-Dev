import './button.css';

type buttonProps = {
  variant: string;
  id?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
};
export default function Button({
  variant,
  id,
  children,
  onClick,
  style,
  disabled,
}: buttonProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      type='button'
      className={`button ${variant}`}
      style={style}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
