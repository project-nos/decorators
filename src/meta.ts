const symbol = Symbol.for('nos-meta');

export const attributeKey = 'attribute';
export const targetKey = 'target';
export const targetsKey = 'targets';

export const meta = (proto: Record<PropertyKey, unknown>, key: string): Map<string, unknown> => {
    if (!Object.prototype.hasOwnProperty.call(proto, symbol)) {
        const parent = proto[symbol] as Map<string, Map<string, unknown>> | undefined;
        const map = (proto[symbol] = new Map<string, Map<string, unknown>>());
        if (parent) {
            for (const [key, value] of parent) {
                map.set(key, value);
            }
        }
    }

    const map = proto[symbol] as Map<string, Map<string, unknown>>;
    if (!map.has(key)) {
        map.set(key, new Map<string, unknown>());
    }

    return map.get(key)!;
};
