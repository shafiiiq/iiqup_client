import Button from '@/shared/components/widgets/button/Button';
import './TabsControls.css';

const toCollapsedButtonProps = ({ text, componentIconLeft, componentIconRight, componentIconCenter, iconLeft, iconRight, iconCenter, ...rest }) => ({
    ...rest,
    componentIconCenter: componentIconCenter ?? componentIconLeft ?? componentIconRight,
    iconCenter: iconCenter ?? iconLeft ?? iconRight,
});

function TabsControls({ items = [], collapsed = false, rows = 1, columns = 1 }) {
    if (!items.length) return null;

    const gridColumns = collapsed ? 1 : columns;
    const gridRows = collapsed ? items.length : rows;
    const visibleItems = collapsed ? items.map(toCollapsedButtonProps) : items;

    return (
        <div
            className={`shared component widget tabs controls ${collapsed ? 'collapsed' : ''}`}
            style={{
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gridTemplateRows: `repeat(${gridRows}, auto)`,
            }}
        >
            {visibleItems.map((item, index) => (
                <Button key={item.key ?? index} title={items[index].text} {...item} />
            ))}
        </div>
    );
}

export default TabsControls;