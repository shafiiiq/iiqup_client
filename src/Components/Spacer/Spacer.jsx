export default function Spacer({ vertical = 0, horizontal = 0 }) {
    const formatValue = (value) => {
        if (!value || value === 0) return 0
        if (typeof value === 'number') return `${value}px`
        return value
    }

    return (
        <div
            className='spacer no-print'
            style={{
                height: formatValue(vertical),
                width: formatValue(horizontal),
                flexShrink: 0
            }}
        />
    )
}