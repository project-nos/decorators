![NOS decorators](.github/banner.svg)

# NOS decorators

[![github workflow tests](https://img.shields.io/github/actions/workflow/status/project-nos/decorators/tests.yml?branch=master&label=tests&style=flat-square)](https://github.com/project-nos/decorators/actions/workflows/tests.yml)
[![mit license](https://img.shields.io/github/license/project-nos/decorators?style=flat-square)](https://github.com/project-nos/decorators/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/@project-nos/decorators?style=flat-square)](https://www.npmjs.com/package/@project-nos/decorators)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@project-nos/decorators?style=flat-square)](https://bundlephobia.com/package/@project-nos/decorators)

### A library to help you build Web Components fast and easy.

You no longer have to write all the boilerplate code needed to bring your components to life. Under the hood this library uses decorators to automatically bind attributes, actions and targets to your Web Components.

There is no better way to get a feel for what NOS decorators is and what it can do, than by seeing it for yourself:

Imagine you create a hello-world component which generates following html:

```html
<hello-world some-number="123" some-boolean some-string="baz" some-array="[4,5,6]" some-object="{"foo":"bar"}">
  <button hello-world-action="click#foo" hello-world-target="bar">…</button>
  <div hello-world-targets="bazs">...</div>
  <div hello-world-targets="bazs">...</div>
</hello-world>
```

You no longer need to query for elements on your own, listen for events or create `getters` for attributes. Everything you have to do is to add the corresponding decorators to your class and properties.


```typescript
import { actionable, attributable, attribute, targetable, target, targets } from '@project-nos/decorators';

@actionable()
@attributable()
@targetable()
class HelloWorld extends HTMLElement {
    @attribute({ type: Number })
    accessor someNumber: number

    @attribute({ type: Boolean })
    accessor someBoolean: boolean;

    @attribute({ type: String })
    accessor someString: string;

    @attribute({ type: Array })
    accessor someArray: [];

    @attribute({ type: Object })
    accessor someObject: object;

    @target()
    accessor bar: HTMLButtonElement;

    @targets()
    accessor bazs: HTMLDivElement[];
    
    foo(event: Event) {
        //...
    }
}
```

***

## Documentation

For full documentation, visit our [Wiki](https://github.com/project-nos/decorators/wiki).

## License

Copyright (c) [Andreas Penz](https://github.com/andreaspenz). Licensed unter the [MIT License](https://github.com/project-nos/decorators/blob/master/LICENSE).

