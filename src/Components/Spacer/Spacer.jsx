import React from 'react'

export default function Spacer({ vertical = 0, horizontal = 0 }) {
    // Helper function to format the value
    const formatValue = (value) => {
        if (!value || value === 0) return 0
        // If it's a number, add 'px'
        if (typeof value === 'number') return `${value}px`
        // If it's already a string (like '30rem', '50%'), return as-is
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