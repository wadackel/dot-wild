dot-wild
========

[![Build Status](http://img.shields.io/travis/tsuyoshiwada/dot-wild.svg?style=flat-square)](https://travis-ci.org/tsuyoshiwada/dot-wild)
[![npm version](https://img.shields.io/npm/v/dot-wild.svg?style=flat-square)](http://badge.fury.io/js/dot-wild)

> Use powerful dot notation (dot path + wildcard) to manipulate properties of JSON.



## Table of Contents

- [Install](#install)
- [Usage](#usage)
    - [Basic](#basic)
    - [Advanced](#advanced)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)



## Install

```bash
$ npm install dot-wild
```



## Usage

### Basic

```javascript
import * as dot from 'dot-wild';


/**
 * Getter
 */

dot.get({ foo: { bar: 'baz' } }, 'foo.bar');
// => 'baz'

dot.get({ 'foo.bar': 'baz' }, 'foo\\.bar');
// => 'baz'

dot.get({ 'foo.bar': 'baz' }, 'notfound', 'default');
// => 'default'

const authorData = {
  authors: [
    { username: 'tsuyoshiwada', profile: { age: 24 } },
    { username: 'sampleuser', profile: { age: 30 } },
    { username: 'foobarbaz', profile: { age: 33 } }
  ]
};

dot.get(authorData, 'authors.*.username');
// => ['tsuyoshiwada', 'sampleuser', 'foobarbaz']

dot.get(authorData, 'authors.*.profile.age');
// => [24, 30, 33]


/**
 * Setter
 */
dot.set({ foo: { bar: 'baz' } }, 'foo.bar', 'newvalue');
// => { foo: { bar: 'newvalue' } }

dot.set([{ foo: {} }], '0.foo.bar.baz', 'value');
// => [{ foo: { bar: { baz: 'value' } } }]

const members = [
  { username: 'tsuyoshiwada', profile: { age: 24 } },
  { username: 'sampleuser', profile: { age: 30 } },
  { username: 'foobarbaz', profile: { age: 33 } }
];

dot.set(members, '*.id', 1);
// => [ { username: 'tsuyoshiwada', profile: { age: 24 }, id: 1 },
//      { username: 'sampleuser', profile: { age: 30 }, id: 1 },
//      { username: 'foobarbaz', profile: { age: 33 }, id: 1 } ]


/**
 * Deleter
 */
dot.remove({ foo: { bar: 'baz' } }, 'foo.bar');
// => { foo: {} }

dot.remove(members, '*.profile');
// => [ { username: 'tsuyoshiwada' },
//      { username: 'sampleuser' },
//      { username: 'foobarbaz' } ]


/**
 * Has
 */
dot.has({ foo: { bar: 'baz' } }, 'foo.bar');
dot.has(members, '*.profile.age');
// => true

dot.has({ foo: { bar: 'baz' } }, 'foo\\.bar');
dot.has(members, '*.notfound.key');
// => false
```


### Advanced

```javascript
import * as dot from 'dot-wild';

const postData = {
  text: 'ok',
  code: 200,
  data: {
    posts: [
      { id: 1, title: 'post 1' },
      { id: 2, title: 'post 2' }
    ],
    tags: [
      { id: 1, name: 'tag 1' },
      { id: 2, name: 'tag 2' }
    ]
  }
};


/**
 * Flatten values
 */
dot.flatten(postData);
// => {
//      text: 'ok',
//      code: 200,
//      'data.posts.0.id': 1,
//      'data.posts.0.title': 'post 1',
//      'data.posts.1.id': 2,
//      'data.posts.1.title': 'post 2',
//      'data.tags.0.id': 1,
//      'data.tags.0.name': 'tag 1',
//      'data.tags.1.id': 2,
//      'data.tags.1.name': 'tag 2'
//    }


/**
 * Expand values
 */
dot.expand({ 'foo.bar': 'baz' });
// => { foo: { bar: 'baz' } }


/**
 * Collection helpers (forEach, map)
 */
dot.forEach(postData, 'data.posts.*.id', (value, key, path, data) => {
  // value => 1, 2
  // key   => 'id', 'id
  // path  => 'data.posts.0.id', 'data.posts.1.id'
  // data  => postData...
});

dot.map(postData, 'data.tags.*.name', (value, key, path, data) => {
  return `${dot.get(data, path)} === ${value} (${key})`;
});
// => ['tag 1 === tag 1 (name)', 'tag 2 === tag 2 (name)']


/**
 * Match path (helper method)
 */
dot.matchPath('foo.bar', 'foo.bar');
dot.matchPath('foo.*.bar.*.baz', 'foo.5.bar.1.baz');
// => true


/**
 * Escape path string
 */
dot.escapePath('foo.bar');
// => 'foo\\.bar'

dot.escapePath('foo\\.bar.baz');
// => 'foo\\.bar\\.baz'
```


## API

See [API Documetation](https://tsuyoshiwada.github.io/dot-wild/).

All methods return a new object or array. (immutable)

* `get(data, path, [value]): Object | any[]`
* `set(data, path, value): Object | any[]`
* `remove(data, path): Object | any[]`
* `has(data, path): boolean`
* `flatten(data): Object`
* `expand(data): Object | any[]`
* `forEach(data, path, iteratee): void`
* `map(data, path, iteratee): any[]`
* `matchPath(pathA, pathB): boolean`
* `escapePath(path): string`


#### data

**type: `Object | any[]`**

Original object or array. Destructive operation is not performed.


#### path

**type: `string`**

Path of the property in JSON object. Use the `.` to select properties.  
Separator in path syntax can be escaped by using the `\\.`.

And, you can match arrays by using `*` (wildcard).


#### value

**type: `any`**

Value to set at path or optional default value to return from get.




## Contribute

1. Fork it!
1. Create your feature branch: git checkout -b my-new-feature
1. Commit your changes: git commit -am 'Add some feature'
1. Push to the branch: git push origin my-new-feature
1. Submit a pull request :D

Bugs, feature requests and comments are more than welcome in the [issues](https://github.com/tsuyoshiwada/dot-wild/issues).



## License

[MIT © tsuyoshiwada](./LICENSE)
