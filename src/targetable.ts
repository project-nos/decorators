/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const findTarget = (element: HTMLElement, name: string): Element | undefined => {
    const tagName = element.tagName.toLowerCase();

    for (const candidate of element.querySelectorAll(`[${tagName}-target~="${name}"]`)) {
        if (candidate.closest(tagName) === element) {
            return candidate;
        }
    }
};

const findTargets = (element: HTMLElement, name: string): Element[] => {
    const tagName = element.tagName.toLowerCase();
    const targets = [];

    for (const candidate of element.querySelectorAll(`[${tagName}-targets~="${name}"]`)) {
        if (candidate.closest(tagName) === element) {
            targets.push(candidate);
        }
    }

    return targets;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const target = <T extends HTMLElement, V>(): any => {
    return (_: unknown, context: ClassAccessorDecoratorContext<T, V>): ClassAccessorDecoratorResult<T, V> => {
        const { kind, name } = context;

        if (kind !== 'accessor') {
            throw new TypeError('The @target decorator is for use on accessors only.');
        }

        return {
            get(this: T): V {
                return findTarget(this, name.toString()) as V;
            },
        };
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const targets = <T extends HTMLElement, V>(): any => {
    return (_: unknown, context: ClassAccessorDecoratorContext<T, V>): ClassAccessorDecoratorResult<T, V> => {
        const { kind, name } = context;

        if (kind !== 'accessor') {
            throw new TypeError('The @targets decorator is for use on accessors only.');
        }

        return {
            get(this: T): V {
                return findTargets(this, name.toString()) as V;
            },
        };
    };
};
