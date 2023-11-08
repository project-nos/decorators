/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from './component.js';

const findTarget = <C extends Component, V extends Element | undefined>(component: C, name: string): V => {
    const componentTagName = component.tagName;

    for (const candidate of component.querySelectorAll(`[${componentTagName}-target~="${name}"]`)) {
        if (candidate.closest(componentTagName) === component) {
            return candidate as V;
        }
    }

    return undefined as V;
};

const findTargets = <C extends Component, V extends Element[]>(component: C, name: string): V => {
    const componentTagName = component.tagName;
    const targets = [];

    for (const candidate of component.querySelectorAll(`[${componentTagName}-targets~="${name}"]`)) {
        if (candidate.closest(componentTagName) === component) {
            targets.push(candidate);
        }
    }

    return targets as V;
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
