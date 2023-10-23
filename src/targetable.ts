/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const findTarget = <T extends HTMLElement, V extends Element | undefined>(element: T, name: string): V => {
    const tagName = element.tagName.toLowerCase();

    for (const candidate of element.querySelectorAll(`[${tagName}-target~="${name}"]`)) {
        if (candidate.closest(tagName) === element) {
            return candidate as V;
        }
    }

    return undefined as V;
};

const findTargets = <T extends HTMLElement, V extends Element[]>(element: T, name: string): V => {
    const tagName = element.tagName.toLowerCase();
    const targets = [];

    for (const candidate of element.querySelectorAll(`[${tagName}-targets~="${name}"]`)) {
        if (candidate.closest(tagName) === element) {
            targets.push(candidate);
        }
    }

    return targets as V;
};

type TargetDecorator<T, V> = {
    (
        target: ClassAccessorDecoratorTarget<T, V>,
        context: ClassAccessorDecoratorContext<T, V>,
    ): ClassAccessorDecoratorResult<T, V>;
};

export const target = <T extends HTMLElement, V extends Element | undefined>(): TargetDecorator<T, V> => {
    return (_, context) => {
        const { kind, name } = context;

        if (kind !== 'accessor') {
            throw new TypeError('The @target decorator is for use on accessors only.');
        }

        return {
            get(this: T) {
                return findTarget<T, V>(this, name.toString());
            },
        };
    };
};

type TargetsDecorator<T, V> = {
    (
        target: ClassAccessorDecoratorTarget<T, V>,
        context: ClassAccessorDecoratorContext<T, V>,
    ): ClassAccessorDecoratorResult<T, V>;
};

export const targets = <T extends HTMLElement, V extends Element[]>(): TargetsDecorator<T, V> => {
    return (_, context) => {
        const { kind, name } = context;

        if (kind !== 'accessor') {
            throw new TypeError('The @targets decorator is for use on accessors only.');
        }

        return {
            get(this: T) {
                return findTargets<T, V>(this, name.toString());
            },
        };
    };
};
