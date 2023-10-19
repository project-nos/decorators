/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const targetMap = new WeakMap<DecoratorMetadataObject, Set<string>>();

export const targetRegistry = (metadata: DecoratorMetadataObject) => {
    let registry = targetMap.get(metadata!);

    return {
        push: (name: string) => {
            if (registry === undefined) {
                targetMap.set(metadata, (registry = new Set()));
            }

            registry.add(name);
        },
        all: (): string[] => {
            return Array.from(registry ?? []);
        },
    };
};

const targetsMap = new WeakMap<DecoratorMetadataObject, Set<string>>();

export const targetsRegistry = (metadata: DecoratorMetadataObject) => {
    let registry = targetsMap.get(metadata!);

    return {
        push: (name: string) => {
            if (registry === undefined) {
                targetsMap.set(metadata, (registry = new Set()));
            }

            registry.add(name);
        },
        all: (): string[] => {
            return Array.from(registry ?? []);
        },
    };
};

const attributeMap = new WeakMap<DecoratorMetadataObject, Map<string, unknown>>();

export const attributeRegistry = (metadata: DecoratorMetadataObject) => {
    let registry = attributeMap.get(metadata);

    return {
        push: (name: string, value: unknown) => {
            if (registry === undefined) {
                attributeMap.set(metadata, (registry = new Map()));
            }

            registry.set(name, value);
        },
        all: (): [string, unknown][] => {
            return Array.from(registry ?? []);
        },
    };
};
