export const parameterize = (key: PropertyKey): string => {
    return String(typeof key === 'symbol' ? key.description : key)
        .replace(/([A-Z]($|[a-z]))/g, '-$1')
        .replace(/--/g, '-')
        .replace(/^-|-$/, '')
        .toLowerCase();
};

export const mustParameterize = (key: PropertyKey): string => {
    const transformed = parameterize(key);
    if (!transformed.includes('-')) {
        throw new DOMException(`${String(key)} is not a valid name`, 'SyntaxError');
    }
    return transformed;
};
