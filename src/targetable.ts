/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const findTarget = (root: HTMLElement, name: string): Element | undefined => {
    const rootTagName = root.tagName.toLowerCase();

    for (const candidate of root.querySelectorAll(`[${rootTagName}-target~="${name}"]`)) {
        if (candidate.closest(rootTagName) === root) {
            return candidate;
        }
    }
};

const findTargets = (root: HTMLElement, name: string): Element[] => {
    const rootTagName = root.tagName.toLowerCase();
    const targets = [];

    for (const candidate of root.querySelectorAll(`[${rootTagName}-targets~="${name}"]`)) {
        if (candidate.closest(rootTagName) === root) {
            targets.push(candidate);
        }
    }

    return targets;
};

const targetMap = new WeakMap<object, string[]>();

const initializeTarget = (root: HTMLElement, metadata: object) => {
    for (const name of targetMap.get(metadata) || []) {
        Object.defineProperty(root, name, {
            configurable: true,
            enumerable: true,
            get(): Element | undefined {
                return findTarget(root, name);
            },
        });
    }
};

const targetsMap = new WeakMap<object, string[]>();

const initializeTargets = (root: HTMLElement, metadata: object) => {
    for (const name of targetsMap.get(metadata) || []) {
        Object.defineProperty(root, name, {
            configurable: true,
            enumerable: true,
            get(): Element[] {
                return findTargets(root, name);
            },
        });
    }
};

type TargetableDecoratorContext = ClassDecoratorContext<CustomElementConstructor> & { metadata: object };

type TargetableDecorator = {
    (clazz: CustomElementConstructor, context: TargetableDecoratorContext): void;
};

export function targetable(): TargetableDecorator {
    return (clazz, context) => {
        return class extends clazz {
            constructor(...params: any[]) {
                super(params);
                initializeTarget(this, context.metadata);
                initializeTargets(this, context.metadata);
            }
        };
    };
}

type TargetDecoratorContext<C, V> = ClassAccessorDecoratorContext<C, V> & { metadata: object };

type TargetDecorator = {
    <C extends HTMLElement, V extends Element | undefined>(
        target: ClassAccessorDecoratorTarget<C, V>,
        context: TargetDecoratorContext<C, V>,
    ): void;
};

export const target = (): TargetDecorator => {
    return (_, context) => {
        let target = targetMap.get(context.metadata);
        if (target === undefined) {
            targetMap.set(context.metadata, (target = []));
        }

        target.push(context.name.toString());
    };
};

type TargetsDecoratorContext<C, V> = ClassAccessorDecoratorContext<C, V> & { metadata: object };

type TargetsDecorator = {
    <C extends HTMLElement, V extends Element[]>(
        target: ClassAccessorDecoratorTarget<C, V>,
        context: TargetsDecoratorContext<C, V>,
    ): void;
};

export const targets = (): TargetsDecorator => {
    return (_, context) => {
        let targets = targetsMap.get(context.metadata);
        if (targets === undefined) {
            targetsMap.set(context.metadata, (targets = []));
        }

        targets.push(context.name.toString());
    };
};
