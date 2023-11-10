/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';

const findTarget = <C extends Component, V extends Element | undefined>(component: C, name: string): V => {
    const componentTagName = component.tagName.toLowerCase();

    return Array.from(component.querySelectorAll(`[${componentTagName}-target~="${name}"]`)).find(
        (candidate) => candidate.closest(componentTagName) === component,
    ) as V;
};

const findTargets = <C extends Component, V extends Element[]>(component: C, name: string): V => {
    const componentTagName = component.tagName.toLowerCase();

    return Array.from(component.querySelectorAll(`[${componentTagName}-targets~="${name}"]`)).filter(
        (candidate) => candidate.closest(componentTagName) === component,
    ) as V;
};

const targetDefinitionsMap = new WeakMap<Component, Set<string>>();

type TargetDecorator<C extends Component, V extends Element | undefined> = (
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>,
) => void;

export const target = <C extends Component, V extends Element | undefined>(): TargetDecorator<C, V> => {
    return (_, context) => {
        const { name, addInitializer } = context;

        addInitializer(function (this) {
            let targetDefinitions = targetDefinitionsMap.get(this);
            if (targetDefinitions === undefined) {
                targetDefinitionsMap.set(this, (targetDefinitions = new Set()));
            }

            targetDefinitions.add(name.toString());
        });
    };
};

const targetsDefinitionsMap = new WeakMap<Component, Set<string>>();

type TargetsDecorator<C extends Component, V extends Element[]> = (
    target: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>,
) => void;

export const targets = <C extends Component, V extends Element[]>(): TargetsDecorator<C, V> => {
    return (_, context) => {
        const { name, addInitializer } = context;

        addInitializer(function (this: C) {
            let targetsDefinition = targetsDefinitionsMap.get(this);
            if (targetsDefinition === undefined) {
                targetsDefinitionsMap.set(this, (targetsDefinition = new Set()));
            }

            targetsDefinition.add(name.toString());
        });
    };
};

export const initializeTargetable = (component: Component) => {
    for (const name of targetDefinitionsMap.get(component) || []) {
        Object.defineProperty(component, name, {
            get(): Element | undefined {
                return findTarget(component, name);
            },
        });
    }

    for (const name of targetsDefinitionsMap.get(component) || []) {
        Object.defineProperty(component, name, {
            get(): Element[] {
                return findTargets(component, name);
            },
        });
    }
};

type TargetableDecorator = {
    (target: ComponentConstructor, context: ClassDecoratorContext): any;
};

export const targetable = (): TargetableDecorator => {
    return (target) => {
        return class extends target {
            constructor(...args: any[]) {
                super(args);
                initializeTargetable(this);
            }
        };
    };
};
