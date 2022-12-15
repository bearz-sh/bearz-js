import { test } from "./dev_deps.ts"
import { SystemError } from './mod.ts'

test("system error properties", (assert) => {
    const error = new SystemError("test error");
    assert.equal(error.name, "SystemError")
    assert.equal(error.message, "test error")
    assert.hasValue(error.stack);
    assert.hasValue(error.stackTrace);
    assert.true(error.stackTrace.length > 3);

    const error2 = new SystemError("test error 2", error);
    assert.equal(error2.name, "SystemError")
    assert.equal(error2.message, "test error 2")
    assert.hasValue(error2.innerError);
    assert.equal(error2.innerError, error);
});