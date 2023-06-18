import { CustomElement } from '../src/element';
import { target, targetable, targets } from '../src';
import { expect, fixture, html } from '@open-wc/testing';

describe('target', () => {
    @targetable
    class TargetTest extends HTMLElement implements CustomElement {
        @target
        declare foo: HTMLElement;

        bar = 'hello';

        @target
        declare baz: Element;

        @target
        declare bing: Element;

        mountCallback(): void {}
    }

    window.customElements.define('target-test', TargetTest);

    let instance: TargetTest;
    beforeEach(async () => {
        instance = await fixture(html`<target-test>
            <div id="el1" target-test-target="foo"></div>
            <div id="el2" target-test-target="baz"></div>
            <div id="el3" target-test-target="bar bing"></div>
        </target-test>`);

        instance.mountCallback();
    });

    it('returns the first element where closest tag is the component', async () => {
        expect(instance).to.have.property('foo').exist.with.attribute('id', 'el1');
    });

    it('does not assign to non-target decorated properties', async () => {
        expect(instance).to.have.property('bar', 'hello');
    });

    it('returns the first element that has the exact target name', async () => {
        expect(instance).to.have.property('baz').exist.with.attribute('id', 'el2');
    });

    it('returns target when there are multiple target values', async () => {
        expect(instance).to.have.property('bing').exist.with.attribute('id', 'el3');
    });
});

describe('targets', () => {
    @targetable
    class TargetsTest extends HTMLElement implements CustomElement {
        @targets
        declare foos: HTMLElement[];

        bars = 'hello';

        @targets
        declare bazs: Element[];

        mountCallback(): void {}
    }

    window.customElements.define('targets-test', TargetsTest);

    let instance: TargetsTest;
    beforeEach(async () => {
        instance = await fixture(html`<targets-test>
            <div id="el1" targets-test-targets="foos"></div>
            <div id="el2" targets-test-targets="foos bazs"></div>
        </targets-test>`);

        instance.mountCallback();
    });

    it('returns the all elements where closest tag is the component', async () => {
        expect(instance).to.have.property('foos').with.lengthOf(2);
        expect(instance).to.have.nested.property('foos[0]').with.attribute('id', 'el1');
        expect(instance).to.have.nested.property('foos[1]').with.attribute('id', 'el2');

        expect(instance).to.have.property('bazs').with.lengthOf(1);
        expect(instance).to.have.nested.property('bazs[0]').with.attribute('id', 'el2');
    });

    it('does not assign to non-target decorated properties', async () => {
        expect(instance).to.have.property('bars', 'hello');
    });
});
