import { test } from './mod.ts'

test("ensure test works", (assert) => {
    assert.ok(true);
    assert.throws(() => {
        assert.ok(false);
    })
})