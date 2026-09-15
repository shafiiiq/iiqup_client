import { IconRegistry } from "./icons.registy";

export const renderComponentIcon = (componentIcon, size, color) => {
    if (!componentIcon) return null;

    const IconComponent =
        typeof componentIcon === 'string'
            ? IconRegistry[componentIcon]
            : componentIcon;

    if (!IconComponent) {
        console.warn(`Icon "${componentIcon}" not found in IconRegistry`);
        return null;
    }

    return <IconComponent size={size} color={color} />
};