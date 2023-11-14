/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, ComponentConstructor } from './component.js';
import { defineProperties } from './util.js';

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

const targetDefinitionsMap = new WeakMap<object, Set<string>>();

type TargetDecoratorContext<C, V> = ClassAccessorDecoratorContext<C, V> & { metadata: object };

type TargetDecorator<C extends Component, V extends Element | undefined> = (
    target: ClassAccessorDecoratorTarget<C, V>,
    context: TargetDecoratorContext<C, V>,
) => void;

export const initializeTarget = <C extends Component, V extends Element | undefined>(
    context: TargetDecoratorContext<C, V>,
) => {
    const { name, addInitializer, metadata } = context;

    addInitializer(() => {
        let targetDefinitions = targetDefinitionsMap.get(metadata);
        if (targetDefinitions === undefined) {
            targetDefinitionsMap.set(metadata, (targetDefinitions = new Set()));
        }

        targetDefinitions.add(name.toString());
    });
};

export const target = <C extends Component, V extends Element | undefined>(): TargetDecorator<C, V> => {
    return (_, context) => {
        initializeTarget(context);
    };
};

const targetsDefinitionsMap = new WeakMap<object, Set<string>>();

type TargetsDecoratorContext<C, V> = ClassAccessorDecoratorContext<C, V> & { metadata: object };

type TargetsDecorator<C extends Component, V extends Element[]> = (
    target: ClassAccessorDecoratorTarget<C, V>,
    context: TargetsDecoratorContext<C, V>,
) => void;

export const initializeTargets = <C extends Component, V extends Element[]>(context: TargetsDecoratorContext<C, V>) => {
    const { name, addInitializer, metadata } = context;

    addInitializer(() => {
        let targetsDefinition = targetsDefinitionsMap.get(metadata);
        if (targetsDefinition === undefined) {
            targetsDefinitionsMap.set(metadata, (targetsDefinition = new Set()));
        }

        targetsDefinition.add(name.toString());
    });
};

export const targets = <C extends Component, V extends Element[]>(): TargetsDecorator<C, V> => {
    return (_, context) => {
        initializeTargets(context);
    };
};

export const initializeTargetable = (component: Component, metadata: object) => {
    for (const name of targetDefinitionsMap.get(metadata) || []) {
        defineProperties(component, name, {
            get: (): Element | undefined => findTarget(component, name),
        });
    }

    for (const name of targetsDefinitionsMap.get(metadata) || []) {
        defineProperties(component, name, {
            get: (): Element[] => findTargets(component, name),
        });
    }
};

type TargetableDecoratorContext<C extends ComponentConstructor> = ClassDecoratorContext<C> & { metadata: object };

type TargetableDecorator<C extends ComponentConstructor> = {
    (target: ComponentConstructor, context: TargetableDecoratorContext<C>): any;
};

export const targetable = <C extends ComponentConstructor>(): TargetableDecorator<C> => {
    return (target, context) => {
        const { metadata } = context;

        return class extends target {
            constructor(...args: any[]) {
                super(args);
                initializeTargetable(this, metadata);
            }
        };
    };
};
