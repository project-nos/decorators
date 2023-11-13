/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect } from '@open-wc/testing';
import { registrable } from '../src/registrable.js';

describe('registrable', () => {
    it('registers the class as a custom element, normalising the class name', () => {
        @registrable()
        class MyFirstClass extends HTMLElement {}
        expect(window.customElements.get('my-first-class')).to.equal(MyFirstClass);
    });

    it('does not register controllers that already exist', () => {
        {
            @registrable()
            class MySecondClass extends HTMLElement {}
            expect(window.customElements.get('my-second-class')).to.equal(MySecondClass);
        }
        {
            @registrable()
            class MySecondClass extends HTMLElement {}
            expect(window.customElements.get('my-second-class')).to.not.equal(MySecondClass);
        }
    });

    it('kebab cases the class name', () => {
        @registrable()
        class ThisIsAnExampleClassName extends HTMLElement {}
        expect(window.customElements.get('this-is-an-example-class-name')).to.equal(ThisIsAnExampleClassName);
    });
});
