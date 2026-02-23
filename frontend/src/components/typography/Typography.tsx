import './typography.css';

type typographyType = {
  size?: string;
  color: 'text-dark' | 'text-ghost' | 'text-primary' | 'text-nonbold';
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function Typography({
  size,
  color,
  children,
  style,
}: typographyType) {
  return (
    <h1 className={`base ${size} ${color}`} style={style}>
      {children}
    </h1>
  );
}
