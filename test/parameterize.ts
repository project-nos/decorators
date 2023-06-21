/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect } from '@open-wc/testing';
import { parameterize } from '../src/parameterize';

describe('parameterize', () => {
    const cases: Array<[PropertyKey, string]> = [
        ['json', 'json'],
        ['fooBar', 'foo-bar'],
        ['FooBar', 'foo-bar'],
        ['autofocusWhenReady', 'autofocus-when-ready'],
        ['URLBar', 'url-bar'],
        ['ClipX', 'clip-x'],
        [Symbol('helloWorld'), 'hello-world'],
    ];

    cases.map(([input, output]) =>
        it(`transforms ${String(input)} to ${output}`, () => expect(parameterize(input)).to.equal(output)),
    );
});
