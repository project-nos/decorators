/**
 * Copyright (c) Andreas Penz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CustomElement } from '../src/element';
import { attributable, attribute } from '../src';
import { expect, fixture, html } from '@open-wc/testing';

describe('initialization', () => {
    @attributable
    class InitializeAttributeTest extends HTMLElement implements CustomElement {
        @attribute
        testNumber = 123;

        @attribute
        testBool = false;

        @attribute
        testString = 'foo';

        mountCallback(): void {}
    }

    window.customElements.define('initialize-attribute-test', InitializeAttributeTest);

    let instance: InitializeAttributeTest;
    it('does not error during creation', () => {
        document.createElement('initialize-attribute-test');
    });

    it('does not alter field values from their initial value', async () => {
        instance = await fixture(html`<initialize-attribute-test />`);
        instance.mountCallback();

        expect(instance).to.have.property('testNumber', 123);
        expect(instance).to.have.property('testBool', false);
        expect(instance).to.have.property('testString', 'foo');
    });

    it('reflects the initial value as an attribute, if not present', async () => {
        instance = await fixture(html`<initialize-attribute-test />`);
        instance.mountCallback();

        expect(instance).to.have.attribute('test-number', '123');
        expect(instance).to.not.have.attribute('test-bool');
        expect(instance).to.have.attribute('test-string', 'foo');
    });

    it('prioritises the value in the attribute over the property', async () => {
        instance = await fixture(html`<initialize-attribute-test test-number="456" test-bool test-string="bar" />`);
        instance.mountCallback();

        expect(instance).to.have.property('testNumber', 456);
        expect(instance).to.have.property('testBool', true);
        expect(instance).to.have.property('testString', 'bar');
    });

    it('changes the property when the attribute changes', async () => {
        instance = await fixture(html`<initialize-attribute-test />`);
        instance.mountCallback();

        instance.setAttribute('test-number', '456');
        expect(instance).to.have.property('testNumber', 456);

        instance.toggleAttribute('test-bool', true);
        expect(instance).to.have.property('testBool', true);

        instance.setAttribute('test-string', 'bar');
        expect(instance).to.have.property('testString', 'bar');
    });

    it('changes the attribute when the property changes', async () => {
        instance = await fixture(html`<initialize-attribute-test />`);
        instance.mountCallback();

        instance.testNumber = 789;
        expect(instance).to.have.attribute('test-number', '789');

        instance.testBool = true;
        expect(instance).to.have.attribute('test-bool');

        instance.testString = 'bar';
        expect(instance).to.have.attribute('test-string', 'bar');
    });
});

describe('naming', () => {
    @attributable
    class NamingAttributableTest extends HTMLElement implements CustomElement {
        @attribute
        fooBarBazBing = 'fooBarBazBing';

        @attribute
        URLBar = 'URLBar';

        @attribute
        ClipX = 'ClipX';

        mountCallback() {}
    }

    window.customElements.define('naming-attribute-test', NamingAttributableTest);

    let instance: NamingAttributableTest;
    it('converts property names to attribute names', async () => {
        instance = await fixture(html`<naming-attribute-test />`);
        instance.mountCallback();

        instance.fooBarBazBing = 'bar';
        expect(instance.getAttributeNames()).to.include('foo-bar-baz-bing');
    });

    it('will parameterize acronyms', async () => {
        instance = await fixture(html`<naming-attribute-test />`);
        instance.mountCallback();

        instance.URLBar = 'bar';
        expect(instance.getAttributeNames()).to.include('url-bar');
    });

    it('parameterizes cap suffixed names correctly', async () => {
        instance = await fixture(html`<naming-attribute-test />`);
        instance.mountCallback();

        instance.ClipX = 'bar';
        expect(instance.getAttributeNames()).to.include('clip-x');
    });
});

describe('type casting', () => {
    @attributable
    class BooleanAttributeTest extends HTMLElement implements CustomElement {
        @attribute
        testBool = false;

        mountCallback(): void {}
    }

    window.customElements.define('boolean-attribute-test', BooleanAttributeTest);

    let instance: BooleanAttributeTest;
    it('toggles boolean properties', async () => {
        instance = await fixture(html`<boolean-attribute-test />`);
        instance.mountCallback();

        instance.setAttribute('test-bool', 'foo');
        expect(instance).to.have.property('testBool', true);

        instance.setAttribute('test-bool', 'bar');
        expect(instance).to.have.property('testBool', true);

        instance.setAttribute('test-bool', 'false');
        expect(instance).to.have.property('testBool', true);

        instance.removeAttribute('test-bool');
        expect(instance).to.have.property('testBool', false);

        instance.testBool = true;
        expect(instance).to.have.property('testBool', true);

        instance.testBool = false;
        expect(instance).to.have.property('testBool', false);
    });
});
