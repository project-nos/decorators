/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Access {
    get?(): unknown;
    set?(value: unknown): void;
}
export interface DecoratorContext {
    kind: 'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor';
    name: string | symbol;
    access: Access;
    private?: boolean;
    static?: boolean;
    addInitializer?(initializer: () => void): void;
}
