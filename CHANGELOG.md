## v3.0.2

> 2026-10-23

### Security

* Fix prototype pollution in `set()` and `remove()`. A path containing `__proto__`, `constructor` or `prototype` (e.g. `__proto__.polluted`) could modify or delete properties of `Object.prototype`.
    - `set()` and `remove()` now throw a `TypeError` when any token of the path is `__proto__`, `constructor` or `prototype`. This also applies to single-key paths such as `'constructor'`.
* Fix prototype injection in `expand()`. A key such as `'a.__proto__.polluted'` replaced the prototype of an object in the result.
    - `expand()` now throws a `TypeError` when any token of a key is `__proto__`, `constructor` or `prototype`.
* Fix prototype injection in `set()` with a trailing wildcard. A value with an own `__proto__` key (e.g. from `JSON.parse`) replaced the prototype of the matched elements.
    - Keys named `__proto__`, `constructor` or `prototype` at the top level of the value are no longer merged into the matched elements.
* Fix prototype injection when `set()` and `remove()` copy the data. An own `__proto__` key anywhere in the data (e.g. from `JSON.parse`) became the prototype of the copied object.
    - Keys named `__proto__`, `constructor` or `prototype` in plain objects of the data are now dropped from the result.
* Fix prototype injection in `flatten()`. A top-level own `__proto__` key whose value is not a plain object (e.g. `{"__proto__":{"constructor":0}}` from `JSON.parse`) became the prototype of the result.
    - Keys named `__proto__`, `constructor` or `prototype` in the data are now dropped from the result.

### Others

* Build `lib/` on `prepublishOnly` instead of `prepublish`, which recent npm versions no longer run on `npm publish`.


## v3.0.1

> 2017-12-16

* Change to [clone-deep](https://www.npmjs.com/package/clone-deep) from [clone](https://www.npmjs.com/package/clone). [#12](https://github.com/tsuyoshiwada/dot-wild/issues/12)


## v3.0.0

> 2017-12-16

### Breaking changes

* Change default value to `undefined`. Related [#10](https://github.com/tsuyoshiwada/dot-wild/issues/10) and [#11](https://github.com/tsuyoshiwada/dot-wild/issues/11).
    - Thanks for [@VladShcherbin](https://github.com/VladShcherbin).


## v2.2.4

> 2017-08-23

* Add getter options [#8](https://github.com/tsuyoshiwada/dot-wild/issues/8). Thanks for [@VladShcherbin](https://github.com/VladShcherbin).


## v2.2.4

> 2017-07-02

* Switch to `clone` from `clone-deep`


## v2.2.3

> 2017-07-02

* Fix bug that missing date instance when clone


## v2.2.2

> 2017-06-09

* Bug fix in `v2.2.1`...


## v2.2.1

> 2017-06-09

* Fix a bug that remove() method left empty element of array


## v2.2.0

> 2017-05-23

* Add helper methods
    - `buildPath()`


## v2.1.0

> 2017-05-18

* Add helper methods
    - `tokenize()`
    - `containWildcardToken()`


## v2.0.0

> 2017-04-25

### Breaking changes

* Rechange collection helper callback arguments [#2](https://github.com/tsuyoshiwada/dot-wild/issues/2)  
  => `(value: any, key: DotKey, context: any, path: string, data: any | any[])`


## v1.1.1

> 2017-04-14

### Minor changes

* Change collection helper callback arguments [#2](https://github.com/tsuyoshiwada/dot-wild/issues/2)


## v1.1.0

> 2017-04-10

### New features

* `forEach()`
* `map()`
* API Documentation by [typedoc](https://github.com/TypeStrong/typedoc).


### Bugfix

* Clean unnecessary export


## v1.0.0

> 2017-04-04

### New features

* Support TypeScript. (switch)

### Breaking changes

* Change to `remove` from `delete` method.

### Others

* jsdoc comment.


## v0.2.0

> 2017-01-24

### New features

* Add `escapePath` method.

### Bugfix

* Fix bug when multiple escape characters.

### Others

* jsdoc comment.


## v0.1.0

> 2017-01-24

### New features

* Add `matchPath` method.


## v0.0.1

> 2017-01-23

* :tada: First release.

