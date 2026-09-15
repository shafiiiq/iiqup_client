import './Skeleton.css';

function Skeleton({
    width = '100%',
    height = '16px',
    radius = '4px',
    circle = false,
    className = '',
    style = {},
    children,
}) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius: circle ? '50%' : radius,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

export default Skeleton;