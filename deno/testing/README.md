# 🐻 Bearz Testing 🧪

The Bearz testing module provides a simple test API similar to node-tap and ava and is
designed to run for npm modules that are created from the Deno To Node tool.

The module wraps deno's testing module and can be executed in node/npm
modules by using DNT to include the test polyfill.

```javascript
import { test } from 'https://deno.land/x/bearz_testing@TESTING_VERSION/testing/mod.ts';

test("test: equals", (assert) => {
   assert.equal("hello", "hello");
});
```

## assert.ok

Asserts that a statement is true.

```javascript
import { test } from 'https://deno.land/x/bearz_testing@TESTING_VERSION/testing/mod.ts';

test("test: equals", (assert) => {
   assert.ok(10 != 20);
});
```
