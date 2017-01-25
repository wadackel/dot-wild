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
const dot = require("dot-wild");


/**
 * Getter
 */

dot.get({ foo: { bar: "baz" } }, "foo.bar");
// => "baz"

dot.get({ "foo.bar": "baz" }, "foo\\.bar");
// => "baz"

dot.get({ "foo.bar": "baz" }, "notfound", "default");
// => "default"

const authorData = {
  authors: [
    { username: "tsuyoshiwada", profile: { age: 24 } },
    { username: "sampleuser", profile: { age: 30 } },
    { username: "foobarbaz", profile: { age: 33 } }
  ]
};

dot.get(authorData, "authors.*.username");
// => ["tsuyoshiwada", "sampleuser", "foobarbaz"]

dot.get(authorData, "authors.*.profile.age");
// => [24, 30, 33]


/**
 * Setter
 */
dot.set({ foo: { bar: "baz" } }, "foo.bar", "newvalue");
// => { foo: { bar: "newvalue" } }

dot.set([{ foo: {} }], "0.foo.bar.baz", "value");
// => [{ foo: { bar: { baz: "value" } } }]

const members = [
  { username: "tsuyoshiwada", profile: { age: 24 } },
  { username: "sampleuser", profile: { age: 30 } },
  { username: "foobarbaz", profile: { age: 33 } }
];

dot.set(members, "*.id", 1);
// => [ { username: 'tsuyoshiwada', profile: { age: 24 }, id: 1 },
//      { username: 'sampleuser', profile: { age: 30 }, id: 1 },
//      { username: 'foobarbaz', profile: { age: 33 }, id: 1 } ]


/**
 * Deleter
 */
dot.delete({ foo: { bar: "baz" } }, "foo.bar");
// => { foo: {} }

dot.delete(members, "*.profile");
// => [ { username: 'tsuyoshiwada' },
//      { username: 'sampleuser' },
//      { username: 'foobarbaz' } ]


/**
 * Has
 */
dot.has({ foo: { bar: "baz" } }, "foo.bar");
dot.has(members, "*.profile.age");
// => true

dot.has({ foo: { bar: "baz" } }, "foo\\.bar");
dot.has(members, "*.notfound.key");
// => false
```


### Advanced

```javascript
const dot = require("dot-wild");

const postData = {
  text: "ok",
  code: 200,
  data: {
    posts: [
      { id: 1, title: "post 1" },
      { id: 2, title: "post 2" }
    ],
    tags: [
      { id: 1, name: "tag 1" },
      { id: 2, name: "tag 2" }
    ]
  }
};


/**
 * Flatten values
 */
dot.flatten(data);
// => {
//      text: "ok",
//      code: 200,
//      "data.posts.0.id": 1,
//      "data.posts.0.title": "post 1",
//      "data.posts.1.id": 2,
//      "data.posts.1.title": "post 2",
//      "data.tags.0.id": 1,
//      "data.tags.0.name": "tag 1",
//      "data.tags.1.id": 2,
//      "data.tags.1.name": "tag 2"
//    }


/**
 * Expand values
 */
dot.expand({ "foo.bar": "baz" });
// => { foo: { bar: "baz" } }


/**
 * Match path (helper method)
 */
dot.matchPath("foo.bar", "foo.bar");
dot.matchPath("foo.*.bar.*.baz", "foo.5.bar.1.baz");
// => true


/**
 * Escape path string
 */
dot.escapePath("foo.bar");
// => "foo\\.bar"

dot.escapePath("foo\\.bar.baz");
// => "foo\\.bar\\.baz"
```


## API

All methods return a new object or array. (immutable)

* `get(data, path, [value]): Object | Array`
* `set(data, path, value): Object | Array`
* `delete(data, path): Object | Array`
* `has(data, path): boolean`
* `flatten(data): Object`
* `expand(data): Object | Array`
* `matchPath(pathA, pathB): boolean`
* `escapePath(path): string`


#### data

**type: `Object | Array`**

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
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -am 'Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D



## License

[MIT © tsuyoshiwada](./LICENSE)
