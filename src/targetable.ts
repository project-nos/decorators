/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from './component.js';

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

type TargetDecorator<C extends Component, V extends Element | undefined> = {
    (
        target: ClassAccessorDecoratorTarget<C, V>,
        context: ClassAccessorDecoratorContext<C, V>,
    ): ClassAccessorDecoratorResult<C, V>;
};

export const target = <C extends Component, V extends Element | undefined>(): TargetDecorator<C, V> => {
    return (_, context) => {
        return {
            get(this: C): V {
                return findTarget(this, context.name.toString());
            },
        };
    };
};

type TargetsDecorator<C extends Component, V extends Element[]> = {
    (target: ClassAccessorDecoratorTarget<C, V>, context: ClassAccessorDecoratorContext<C, V>): void;
};

export const targets = <C extends Component, V extends Element[]>(): TargetsDecorator<C, V> => {
    return (_, context) => {
        return {
            get(this: C): V {
                return findTargets(this, context.name.toString()) as V;
            },
        };
    };
};
