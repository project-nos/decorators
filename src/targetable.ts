/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const findTarget = (component: HTMLElement, name: string): Element | undefined => {
    const baseTag = component.tagName.toLowerCase();
    for (const candidate of component.querySelectorAll(`[${baseTag}-target~="${name}"]`)) {
        if (candidate.closest(baseTag) === component) {
            return candidate;
        }
    }
};

const targetMap = new WeakMap<object, string[]>();

const initializeTarget = (component: HTMLElement, metadata: object) => {
    for (const name of targetMap.get(metadata) || []) {
        Object.defineProperty(component, name, {
            configurable: true,
            enumerable: true,
            get(): Element | undefined {
                return findTarget(component, name);
            },
        });
    }
};

const findTargets = (component: HTMLElement, name: string): Element[] => {
    const baseTag = component.tagName.toLowerCase();
    const targets = [];

    for (const candidate of component.querySelectorAll(`[${baseTag}-targets~="${name}"]`)) {
        if (candidate.closest(baseTag) === component) {
            targets.push(candidate);
        }
    }

    return targets;
};

const targetsMap = new WeakMap<object, string[]>();

const initializeTargets = (component: HTMLElement, metadata: object) => {
    for (const name of targetsMap.get(metadata) || []) {
        Object.defineProperty(component, name, {
            configurable: true,
            enumerable: true,
            get(): Element[] {
                return findTargets(component, name);
            },
        });
    }
};

type TargetableDecoratorContext = ClassDecoratorContext<CustomElementConstructor> & { metadata: object };

type TargetableDecorator = {
    (target: CustomElementConstructor, context: TargetableDecoratorContext): void;
};

export function targetable(): TargetableDecorator {
    return (target, context) => {
        return class extends target {
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
