import './Text.css';

const VARIANT_TAGS = {
  heading: 'h1',
  title: 'h2',
  subtitle: 'h3',
  body: 'p',
  caption: 'span',
  label: 'span',
};

const COLOR_TOKENS = {
  default: 'var(--text-color)',
  disabled: 'var(--text-disabled)',
  error: 'var(--color-error)',
  success: 'var(--color-success)',
  primary: 'var(--color-primary)',
};

const WEIGHT_TOKENS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

function Text({
  variant = 'body',
  as,
  color,
  weight,
  align,
  truncate = false,
  className = '',
  style = {},
  children,
  ...rest
}) {
  const Tag = as || VARIANT_TAGS[variant] || 'span';
  const variantClass = VARIANT_TAGS[variant] ? variant : 'body';

  return (
    <Tag
      className={`shared widget text ${variantClass}${truncate ? ' truncate' : ''}${className ? ` ${className}` : ''}`}
      style={{
        color: color ? (COLOR_TOKENS[color] || color) : undefined,
        fontWeight: weight ? (WEIGHT_TOKENS[weight] || weight) : undefined,
        textAlign: align,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Text;