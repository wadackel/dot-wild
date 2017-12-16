import * as assert from 'power-assert';
import * as dot from '../src/';


const sampleData = {
  tags: [
    { id: 1, tag: 'tag1' },
    { id: 2, tag: 'tag2' },
  ],
  nested: {
    deep: [
      {
        members: [
          { username: 'tsuyoshiwada', profile: { age: 24 } },
          { username: 'nestuser', profile: { age: 30 } },
          { username: 'foobarbaz', profile: { age: 33 } },
        ],
      },
      {
        members: [
          { username: 'testuser', profile: { age: 19 } },
          { username: 'sample', profile: { age: 33 } },
          { username: 'hogefuga', profile: { age: 40 } },
        ],
      },
    ],
  },
};


describe('dot-wild', () => {
  it('tokenize()', () => {
    assert.deepStrictEqual(dot.tokenize(''), []);
    assert.deepStrictEqual(dot.tokenize('foo'), ['foo']);
    assert.deepStrictEqual(dot.tokenize('foo.bar'), ['foo', 'bar']);
    assert.deepStrictEqual(dot.tokenize('foo.bar.baz'), ['foo', 'bar', 'baz']);
    assert.deepStrictEqual(dot.tokenize('foo\\.bar.baz'), ['foo.bar', 'baz']);
    assert.deepStrictEqual(dot.tokenize('foo\\.bar\\.baz'), ['foo.bar.baz']);
    assert.deepStrictEqual(dot.tokenize('foo.*.*.bar'), ['foo', '*', '*', 'bar']);
    assert.deepStrictEqual(dot.tokenize('foo*.*.bar'), ['foo*', '*', 'bar']);
    assert.deepStrictEqual(dot.tokenize('foo**bar'), ['foo**bar']);
    assert.deepStrictEqual(dot.tokenize('hoge.1.fuga'), ['hoge', '1', 'fuga']);
    assert.deepStrictEqual(dot.tokenize('hoge[1].fuga'), ['hoge', '1', 'fuga']);
    assert.deepStrictEqual(dot.tokenize('hoge[1].*.fuga'), ['hoge', '1', '*', 'fuga']);
  });


  it('get()', () => {
    const t1 = { foo: { bar: 'baz' } };
    assert(dot.get(t1, '') == null);
    assert(dot.get(t1, 'bar') == null);
    assert(dot.get(t1, 'fuga') == null);
    assert.deepStrictEqual(dot.get(t1, 'foo'), { bar: 'baz' });
    assert.deepStrictEqual(dot.get(t1, '[\'foo\']'), { bar: 'baz' });
    assert(dot.get(t1, 'foo.bar') === 'baz');
    assert(dot.get(t1, '[\'foo\'][\'bar\']') === 'baz');
    assert(dot.get(t1, 'test', 'default') === 'default');
    assert(dot.get(t1, '[\'test\']', 'default') === 'default');
    assert(dot.get(t1, 'foo.bar', 'default') === 'baz');
    assert(dot.get(t1, '[\'foo\'].bar', 'default') === 'baz');
    assert(dot.get(t1, '[\'foo\'][\'bar\']', 'default') === 'baz');

    assert(dot.get({ 'foo.bar.baz': 'hoge' }, 'foo\\.bar\\.baz') === 'hoge');

    const t2 = { 'foo.bar': { baz: { fuga: 'fuge' } } };
    assert.deepStrictEqual(dot.get(t2, 'foo\\.bar'), { baz: { fuga: 'fuge' } });
    assert.deepStrictEqual(dot.get(t2, 'foo\\.bar.baz'), { fuga: 'fuge' });
    assert(dot.get(t2, 'foo\\.bar.baz.fuga') === 'fuge');
    assert(dot.get(t2, 'foo\\.bar.baz.fuga.fuge') == null);

    const t3 = [null, [{ nested: { deep: { fuga: 'fuge' } } }], false];
    assert(dot.get(t3, '[0]', 'def') == null);
    assert(dot.get(t3, '0', 'def') == null);
    assert(dot.get(t3, '[2]') === false);
    assert(dot.get(t3, '2') === false);
    assert.deepStrictEqual(dot.get(t3, '[1][0]'), { nested: { deep: { fuga: 'fuge' } } });
    assert.deepStrictEqual(dot.get(t3, '1.0'), { nested: { deep: { fuga: 'fuge' } } });
    assert.deepStrictEqual(dot.get(t3, '[1][0].nested'), { deep: { fuga: 'fuge' } });
    assert.deepStrictEqual(dot.get(t3, '[1][0][\'nested\']'), { deep: { fuga: 'fuge' } });
    assert.deepStrictEqual(dot.get(t3, '[1][0].nested.deep'), { fuga: 'fuge' });
    assert.deepStrictEqual(dot.get(t3, '[1][0].nested[\'deep\']'), { fuga: 'fuge' });
    assert.deepStrictEqual(dot.get(t3, '[1][0].nested.deep.fuga'), 'fuge');
    assert.deepStrictEqual(dot.get(t3, '[1][0].nested[\'deep\'][\'fuga\']'), 'fuge');

    const t4 = [
      { k: 'v1' },
      { k: 'v2' },
      { k: 'v3' },
    ];

    assert.deepStrictEqual(dot.get(t4, '*.k'), ['v1', 'v2', 'v3']);
    assert(dot.get(t4, '*.k.foo') == null);

    // Real world
    assert.deepStrictEqual(dot.get(sampleData, 'tags.*'), [
      { id: 1, tag: 'tag1' },
      { id: 2, tag: 'tag2' },
    ]);

    assert.deepStrictEqual(dot.get(sampleData, 'tags.*.id'), [1, 2]);
    assert(dot.get(sampleData, 'tags.*.id.test') == null);

    assert.deepStrictEqual(dot.get(sampleData, 'nested.deep.*.members.*.profile.age'), [
      24, 30, 33,
      19, 33, 40,
    ]);

    assert.deepStrictEqual(dot.get(sampleData, 'nested.deep.1.members.*.username'), [
      'testuser',
      'sample',
      'hogefuga',
    ]);
  });


  it('get() with options', () => {
    const value = {
      obj: {
        kfoo: 'foo',
        kbar: 'bar',
        kbaz: 'baz',
      },
      arr: [
        'foo',
        'bar',
        'baz',
      ],
    };

    const obj = {
      kfoo: 'foo',
      kbar: 'bar',
      kbaz: 'baz',
    };

    const arr = [
      'foo',
      'bar',
      'baz',
    ];

    // obj
    assert.deepStrictEqual(dot.get(value, 'obj.*'), [
      'foo',
      'bar',
      'baz',
    ]);

    assert.deepStrictEqual(dot.get(value, 'obj.*', null, { iterateObject: false }), null);
    assert.deepStrictEqual(dot.get(value, 'obj.*', 'default', { iterateObject: false }), 'default');

    assert.deepStrictEqual(dot.get(obj, '*'), [
      'foo',
      'bar',
      'baz',
    ]);

    assert.deepStrictEqual(dot.get(obj, '*', null, { iterateObject: false }), null);
    assert.deepStrictEqual(dot.get(obj, '*', 'default', { iterateObject: false }), 'default');

    // arr
    assert.deepStrictEqual(dot.get(value, 'arr.*'), [
      'foo',
      'bar',
      'baz',
    ]);

    assert.deepStrictEqual(dot.get(value, 'arr.*', null, { iterateArray: false }), null);
    assert.deepStrictEqual(dot.get(value, 'arr.*', 'default', { iterateArray: false }), 'default');

    assert.deepStrictEqual(dot.get(arr, '*'), [
      'foo',
      'bar',
      'baz',
    ]);

    assert.deepStrictEqual(dot.get(arr, '*', null, { iterateArray: false }), null);
    assert.deepStrictEqual(dot.get(arr, '*', 'default', { iterateArray: false }), 'default');
  });


  it('get() with undefined and null value', () => {
    const obj = {
      a: {
        b: undefined,
        c: null,
      },
      d: [
        'e',
        undefined,
        null,
      ],
    };

    assert(dot.get(obj, 'a.b') === undefined);
    assert(dot.get(obj, 'a.c') === null);
    assert(dot.get(obj, 'a.c.z') === undefined);
    assert(dot.get(obj, 'd[0]') === 'e');
    assert(dot.get(obj, 'd[1]') === undefined);
    assert(dot.get(obj, 'd[2]') === null);
    assert(dot.get(obj, 'd[3]') === undefined);

    assert(dot.get(obj, 'a.b', undefined) === undefined);
    assert(dot.get(obj, 'a.c', undefined) === null);
    assert(dot.get(obj, 'a.c.z', undefined) === undefined);
    assert(dot.get(obj, 'd[0]', undefined) === 'e');
    assert(dot.get(obj, 'd[1]', undefined) === undefined);
    assert(dot.get(obj, 'd[2]', undefined) === null);
    assert(dot.get(obj, 'd[3]', undefined) === undefined);

    assert(dot.get(obj, 'a.b', 'default') === 'default');
    assert(dot.get(obj, 'a.c', 'default') === null);
    assert(dot.get(obj, 'a.c.z', 'default') === 'default');
    assert(dot.get(obj, 'd[0]', 'default') === 'e');
    assert(dot.get(obj, 'd[1]', 'default') === 'default');
    assert(dot.get(obj, 'd[2]', 'default') === null);
    assert(dot.get(obj, 'd[3]', 'default') === 'default');
  });


  it('set()', () => {
    const t1 = { foo: { bar: 'baz' } };
    const assertT1 = () => {
      assert.deepStrictEqual(t1, { foo: { bar: 'baz' } });
    };

    assert.deepStrictEqual(dot.set(t1, 'hoge', 'fuga'), {
      foo: { bar: 'baz' },
      hoge: 'fuga',
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, 'foo.bar', 'override'), {
      foo: { bar: 'override' },
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, 'foo\\.bar', 'newvalue'), {
      foo: { bar: 'baz' },
      'foo.bar': 'newvalue',
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, 'newpath[\'key\'].path', 'value!!'), {
      foo: { bar: 'baz' },
      newpath: { key: { path: 'value!!' } },
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, 'test.arr.0', 'array'), {
      foo: { bar: 'baz' },
      test: {
        arr: ['array'],
      },
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, 'arr.val.0.0.test', 'nestvalue'), {
      foo: { bar: 'baz' },
      arr: {
        val: [
          [
            {
              test: 'nestvalue',
            },
          ],
        ],
      },
    });
    assertT1();

    const t2 = [
      { id: 1, profile: { name: 'hoge' } },
      { id: 2, profile: { name: 'fuga' } },
    ];
    const assertT2 = () => {
      assert.deepStrictEqual(t2, [
        { id: 1, profile: { name: 'hoge' } },
        { id: 2, profile: { name: 'fuga' } },
      ]);
    };

    assert.deepStrictEqual(dot.set(t2, '*.id', 10), [
      { id: 10, profile: { name: 'hoge' } },
      { id: 10, profile: { name: 'fuga' } },
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, '*.hoge\\.key', 10), [
      { id: 1, 'hoge.key': 10, profile: { name: 'hoge' } },
      { id: 2, 'hoge.key': 10, profile: { name: 'fuga' } },
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, '*.profile.name', 'replaced'), [
      { id: 1, profile: { name: 'replaced' } },
      { id: 2, profile: { name: 'replaced' } },
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, '1.profile.email', 'sample@gmail.com'), [
      { id: 1, profile: { name: 'hoge' } },
      { id: 2, profile: { name: 'fuga', email: 'sample@gmail.com' } },
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, '*.profile.email', 'sample@gmail.com'), [
      { id: 1, profile: { name: 'hoge', email: 'sample@gmail.com' } },
      { id: 2, profile: { name: 'fuga', email: 'sample@gmail.com' } },
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, '2', {
      id: 3, profile: { name: 'foo' },
    }), [
      { id: 1, profile: { name: 'hoge' } },
      { id: 2, profile: { name: 'fuga' } },
      { id: 3, profile: { name: 'foo' } },
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, '2.profile', {
      name: 'test', age: 50,
    }), [
      { id: 1, profile: { name: 'hoge' } },
      { id: 2, profile: { name: 'fuga' } },
      { profile: { name: 'test', age: 50 } },
    ]);
    assertT2();

    const date1 = new Date();
    const date2 = new Date();
    const values = {
      foo: date1,
      bar: {
        baz: date2,
      },
    };
    const assertDate = () => {
      assert.deepStrictEqual(values, {
        foo: date1,
        bar: {
          baz: date2,
        },
      });
    };

    assert.deepStrictEqual(dot.set(values, 'hoge', date1), {
      foo: date1,
      bar: {
        baz: date2,
      },
      hoge: date1,
    });
    assertDate();

    assert.deepStrictEqual(dot.set(values, 'hoge', date1), {
      foo: date1,
      bar: {
        baz: date2,
      },
      hoge: date1,
    });
    assertDate();
  });


  it('remove()', () => {
    const t1 = { foo: { bar: 'baz' } };
    const assertT1 = () => {
      assert.deepStrictEqual(t1, { foo: { bar: 'baz' } });
    };

    assert.deepStrictEqual(dot.remove(t1, 'notfound'), { foo: { bar: 'baz' } });
    assertT1();

    assert.deepStrictEqual(dot.remove(t1, 'foo'), {});
    assertT1();

    assert.deepStrictEqual(dot.remove(t1, 'foo.bar'), { foo: {} });
    assertT1();

    assert.deepStrictEqual(dot.remove({ 'foo.bar': 'baz' }, 'foo\\.bar'), {});

    let result: any = null;

    const t2 = [
      { nest: [{ deep: { name: 'foo' } }] },
      { nest: [{ deep: { name: 'bar' } }] },
      { nest: [{ deep: { name: 'baz' } }] },
    ];
    const assertT2 = () => {
      assert.deepStrictEqual(t2, [
        { nest: [{ deep: { name: 'foo' } }] },
        { nest: [{ deep: { name: 'bar' } }] },
        { nest: [{ deep: { name: 'baz' } }] },
      ]);
    };

    result = dot.remove(t2, '*');
    assert.deepStrictEqual(result, []);
    assert(result.length === 0);
    assertT2();

    result = dot.remove(t2, '0');
    assert.deepStrictEqual(result, [
      { nest: [{ deep: { name: 'bar' } }] },
      { nest: [{ deep: { name: 'baz' } }] },
    ]);
    assert(result.length === 2);
    assertT2();

    result = dot.remove(t2, '0.nest');
    assert.deepStrictEqual(result, [
      {},
      { nest: [{ deep: { name: 'bar' } }] },
      { nest: [{ deep: { name: 'baz' } }] },
    ]);
    assert(result.length === 3);
    assertT2();

    result = dot.remove(t2, '2.nest.0.deep.name');
    assert.deepStrictEqual(result, [
      { nest: [{ deep: { name: 'foo' } }] },
      { nest: [{ deep: { name: 'bar' } }] },
      { nest: [{ deep: {} }] },
    ]);
    assert(result.length === 3);
    assertT2();

    result = dot.remove(t2, '*');
    assert.deepStrictEqual(result, []);
    assert(result.length === 0);
    assertT2();

    result = dot.remove(t2, '*.nest.*.deep');
    assert.deepStrictEqual(result, [
      { nest: [{}] },
      { nest: [{}] },
      { nest: [{}] },
    ]);
    assertT2();

    result = dot.remove(t2, '*.nest.*.deep.name');
    assert.deepStrictEqual(result, [
      { nest: [{ deep: {} }] },
      { nest: [{ deep: {} }] },
      { nest: [{ deep: {} }] },
    ]);
    assert(result.length === 3);
    assertT2();

    result = dot.remove(t2, '*.nest.*.deep.name.hoge');
    assert.deepStrictEqual(result, [
      { nest: [{ deep: { name: 'foo' } }] },
      { nest: [{ deep: { name: 'bar' } }] },
      { nest: [{ deep: { name: 'baz' } }] },
    ]);
    assert(result.length === 3);
    assertT2();

    let values: any = [
      1,
      2,
      3,
      4,
      5,
    ];

    result = dot.remove(values, '*');
    assert.deepStrictEqual(result, []);
    assert(result.length === 0);

    values = [
      { nest: [1, 2, 3] },
      { nest: [1, 2, 3] },
      { nest: [1, 2, 3] },
    ];

    result = dot.remove(values, '0.nest.0');
    assert.deepStrictEqual(result, [
      { nest: [2, 3] },
      { nest: [1, 2, 3] },
      { nest: [1, 2, 3] },
    ]);
    assert(result[0].nest.length === 2);

    values = [
      [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
      ],
      [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
      ],
    ];

    result = dot.remove(values, '*.0');
    assert.deepStrictEqual(result, [
      [
        [1, 2, 3],
        [1, 2, 3],
      ],
      [
        [1, 2, 3],
        [1, 2, 3],
      ],
    ]);
    assert(result[0].length === 2);
    assert(result[1].length === 2);

    result = dot.remove(values, '*.*.2');
    assert.deepStrictEqual(result, [
      [
        [1, 2],
        [1, 2],
        [1, 2],
      ],
      [
        [1, 2],
        [1, 2],
        [1, 2],
      ],
    ]);
    assert(result[0][0].length === 2);
    assert(result[0][1].length === 2);
    assert(result[0][2].length === 2);
    assert(result[1][0].length === 2);
    assert(result[1][1].length === 2);
    assert(result[1][2].length === 2);

    result = dot.remove(values, '*.*.3');
    assert.deepStrictEqual(result, [
      [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
      ],
      [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3],
      ],
    ]);
  });


  it('has()', () => {
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo') === true);
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo.bar') === true);
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo["bar"]') === true);
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo\\.bar') === false);
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo.bar.baz') === false);
    assert(dot.has({ foo: { bar: 'baz' } }, 'notfound') === false);
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo.bee') === false);
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo.bar.hoge') === false);
    assert(dot.has({ foo: { bar: 'baz' } }, 'foo.bar.hoge') === false);

    assert(dot.has(sampleData, 'tags.*.id') === true);
    assert(dot.has(sampleData, 'tags.*.hoge') === false);
    assert(dot.has(sampleData, 'nested.deep.*') === true);
    assert(dot.has(sampleData, 'nested.deep.*.members.*.username') === true);
    assert(dot.has(sampleData, 'nested.deep.*.members.*.username.hoge') === false);
    assert(dot.has(sampleData, 'nested.deep.*.foo.bar') === false);
  });


  it('flatten()', () => {
    assert.deepStrictEqual(dot.flatten(null), {});
    assert.deepStrictEqual(dot.flatten(undefined), {});
    assert.deepStrictEqual(dot.flatten({}), {});
    assert.deepStrictEqual(dot.flatten([]), {});

    assert.deepStrictEqual(dot.flatten({ foo: { bar: 'baz' } }), {
      'foo.bar': 'baz',
    });

    assert.deepStrictEqual(dot.flatten([
      { key: 'value1' },
      { key: 'value2' },
      { key: 'value3' },
    ]), {
      '0.key': 'value1',
      '1.key': 'value2',
      '2.key': 'value3',
    });

    assert.deepStrictEqual(dot.flatten(sampleData), {
      'tags.0.id': 1,
      'tags.0.tag': 'tag1',
      'tags.1.id': 2,
      'tags.1.tag': 'tag2',
      'nested.deep.0.members.0.username': 'tsuyoshiwada',
      'nested.deep.0.members.0.profile.age': 24,
      'nested.deep.0.members.1.username': 'nestuser',
      'nested.deep.0.members.1.profile.age': 30,
      'nested.deep.0.members.2.username': 'foobarbaz',
      'nested.deep.0.members.2.profile.age': 33,
      'nested.deep.1.members.0.username': 'testuser',
      'nested.deep.1.members.0.profile.age': 19,
      'nested.deep.1.members.1.username': 'sample',
      'nested.deep.1.members.1.profile.age': 33,
      'nested.deep.1.members.2.username': 'hogefuga',
      'nested.deep.1.members.2.profile.age': 40,
    });
  });


  it('expand()', () => {
    assert.deepStrictEqual(dot.expand(null), {});

    assert.deepStrictEqual(dot.expand({
      'foo.bar': 'baz',
    }), {
      foo: {
        bar: 'baz',
      },
    });

    assert.deepStrictEqual(dot.expand({
      '0.id': { user: 1 },
      '1.id': { user: 2 },
      '2.id': { user: 3 },
    }), [
      { id: { user: 1 } },
      { id: { user: 2 } },
      { id: { user: 3 } },
    ]);

    assert.deepStrictEqual(dot.expand(dot.flatten(sampleData)), sampleData);
  });


  it('forEach()', () => {
    let results: any[] = [];

    // Not found
    dot.forEach(sampleData, 'hoge.fuga', () => {
      throw new Error('error');
    });

    // Normal path
    dot.forEach(sampleData, 'nested', (value: any, key: any, context: any, path: string, data: any) => {
      assert(context[key] === value);
      assert(dot.get(data, path) === value);
      results.push([value, key, path]);
    });

    assert(results.length === 1);
    assert.deepStrictEqual(results[0][0], sampleData.nested);
    assert(results[0][1] === 'nested');
    assert(results[0][2] === 'nested');

    // Use wildcard
    results = [];

    dot.forEach(sampleData, 'tags.*.*', (value: any, key: any, context: any, path: string, data: any) => {
      assert(context[key] === value);
      assert.deepStrictEqual(dot.get(data, path), value);
      results.push([value, key, path]);
    });

    assert(results.length === 4);

    assert(results[0][0] === 1);
    assert(results[0][1] === 'id');
    assert(results[0][2] === 'tags.0.id');

    assert(results[1][0] === 'tag1');
    assert(results[1][1] === 'tag');
    assert(results[1][2] === 'tags.0.tag');

    assert(results[2][0] === 2);
    assert(results[2][1] === 'id');
    assert(results[2][2] === 'tags.1.id');

    assert(results[3][0] === 'tag2');
    assert(results[3][1] === 'tag');
    assert(results[3][2] === 'tags.1.tag');
  });


  it('forEach() with options', () => {
    const sampleData = {
      obj: {
        kfoo: 'foo',
        kbar: 'bar',
        kbaz: 'baz',
      },
      arr: [
        'foo',
        'bar',
        'baz',
      ],
    };

    let results: any[] = [];

    dot.forEach(sampleData, 'obj.*', (value: any, key: any, _: any, path: string) => {
      results.push([value, key, path]);
    });

    assert.deepStrictEqual(results, [
      ['foo', 'kfoo', 'obj.kfoo'],
      ['bar', 'kbar', 'obj.kbar'],
      ['baz', 'kbaz', 'obj.kbaz'],
    ]);

    results = [];

    dot.forEach(sampleData, 'obj.*', (value: any, key: any, _: any, path: string) => {
      results.push([value, key, path]);
    }, { iterateObject: false });

    assert.deepStrictEqual(results, []);

    dot.forEach(sampleData, 'arr.*', (value: any, key: any, _: any, path: string) => {
      results.push([value, key, path]);
    });

    assert.deepStrictEqual(results, [
      ['foo', 0, 'arr.0'],
      ['bar', 1, 'arr.1'],
      ['baz', 2, 'arr.2'],
    ]);

    results = [];

    dot.forEach(sampleData, 'arr.*', (value: any, key: any, _: any, path: string) => {
      results.push([value, key, path]);
    }, { iterateArray: false });

    assert.deepStrictEqual(results, []);
  });


  it('map()', () => {
    let results: any[] = [];

    // Not found
    results = dot.map(sampleData, 'foo.bar', () => {
      throw new Error('error');
    });

    // Normal path
    results = dot.map(sampleData, 'tags', (value: any, key: any, context: any, path: string, data: any) => {
      assert(context[key] === value);
      assert.deepStrictEqual(dot.get(data, path), value);
      return [value, key, path];
    });

    assert(results.length === 1);
    assert.deepStrictEqual(results[0][0], sampleData.tags);
    assert(results[0][1] === 'tags');
    assert(results[0][2] === 'tags');

    // Use wildcard
    results = dot.map(sampleData, 'nested.deep.*.members.*.profile.age', (value: any, key: any, context: any, path: string, data: any) => {
      assert(context[key] === value);
      assert.deepStrictEqual(dot.get(data, path), value);
      return [value, key, path];
    });

    assert(results.length === 6);

    assert(results[0][0] === 24);
    assert(results[0][1] === 'age');
    assert(results[0][2] === 'nested.deep.0.members.0.profile.age');

    assert(results[1][0] === 30);
    assert(results[1][1] === 'age');
    assert(results[1][2] === 'nested.deep.0.members.1.profile.age');

    assert(results[2][0] === 33);
    assert(results[2][1] === 'age');
    assert(results[2][2] === 'nested.deep.0.members.2.profile.age');

    assert(results[3][0] === 19);
    assert(results[3][1] === 'age');
    assert(results[3][2] === 'nested.deep.1.members.0.profile.age');

    assert(results[4][0] === 33);
    assert(results[4][1] === 'age');
    assert(results[4][2] === 'nested.deep.1.members.1.profile.age');

    assert(results[5][0] === 40);
    assert(results[5][1] === 'age');
    assert(results[5][2] === 'nested.deep.1.members.2.profile.age');
  });


  it('map() with options', () => {
    const sampleData = {
      obj: {
        kfoo: 'foo',
        kbar: 'bar',
        kbaz: 'baz',
      },
      arr: [
        'foo',
        'bar',
        'baz',
      ],
    };

    let results: any[] = [];

    results = dot.map(sampleData, 'obj.*', (value: any, key: any, _: any, path: string) => [value, key, path]);

    assert.deepStrictEqual(results, [
      ['foo', 'kfoo', 'obj.kfoo'],
      ['bar', 'kbar', 'obj.kbar'],
      ['baz', 'kbaz', 'obj.kbaz'],
    ]);

    results = dot.map(sampleData, 'obj.*', (value: any, key: any, _: any, path: string) => [value, key, path], { iterateObject: false });

    assert.deepStrictEqual(results, []);

    results = dot.map(sampleData, 'arr.*', (value: any, key: any, _: any, path: string) => [value, key, path]);

    assert.deepStrictEqual(results, [
      ['foo', 0, 'arr.0'],
      ['bar', 1, 'arr.1'],
      ['baz', 2, 'arr.2'],
    ]);

    results = dot.map(sampleData, 'arr.*', (value: any, key: any, _: any, path: string) => [value, key, path], { iterateArray: false });

    assert.deepStrictEqual(results, []);
  });


  it('matchPath()', () => {
    assert(dot.matchPath('', '') === true);
    assert(dot.matchPath('hoge', 'hoge') === true);
    assert(dot.matchPath('foo.bar', 'foo.bar') === true);
    assert(dot.matchPath('foo\\.bar', 'foo\\.bar') === true);
    assert(dot.matchPath('foo.*.nested', 'foo.*.nested') === true);
    assert(dot.matchPath('foo.*.nested', 'foo.7.nested') === true);
    assert(dot.matchPath('foo.7.nested', 'foo.*.nested') === true);
    assert(dot.matchPath('foo.7.nested.0.deep', 'foo.*.nested.*.deep') === true);
    assert(dot.matchPath('foo\\.bar.*.baz', 'foo\\.bar.2.baz') === true);

    assert(dot.matchPath('fuga', 'fugahoge') === false);
    assert(dot.matchPath('foo.2', 'foo.1') === false);
    assert(dot.matchPath('foo.*.bar', 'foo.bar') === false);
    assert(dot.matchPath('foo.*.bar', 'foo.*.bar.baz') === false);
    assert(dot.matchPath('foo.*.bar', 'foo\\.1.bar') === false);
  });


  it('escapePath()', () => {
    assert(dot.escapePath('') === '');
    assert(dot.escapePath('path') === 'path');
    assert(dot.escapePath('foo.bar') === 'foo\\.bar');
    assert(dot.escapePath('this.is.my.path') === 'this\\.is\\.my\\.path');
    assert(dot.escapePath('foo\\.bar') === 'foo\\.bar');
    assert(dot.escapePath('foo\\.bar.baz') === 'foo\\.bar\\.baz');
    assert(dot.escapePath('foo\\.bar\\.baz') === 'foo\\.bar\\.baz');
    assert(dot.escapePath('foo\\.*.*.bar\\.baz') === 'foo\\.*\\.*\\.bar\\.baz');
  });


  it('buildPath()', () => {
    assert(dot.buildPath([]) === '');
    assert(dot.buildPath(['foo']) === 'foo');
    assert(dot.buildPath(['foo', 'bar', 'baz']) === 'foo.bar.baz');
    assert(dot.buildPath(['foo.bar', 'baz']) === 'foo\\.bar.baz');
    assert(dot.buildPath(['foo.bar.baz']) === 'foo\\.bar\\.baz');
    assert(dot.buildPath([1, 2, 3]) === '1.2.3');
    assert(dot.buildPath(['[1]', '[20]', '[300]']) === '1.20.300');
    assert(dot.buildPath(['foo', '[\'bar\']', '["baz"]']) === 'foo.bar.baz');
    assert(dot.buildPath(['foo', 1, 2, '[1]', '*', '["bar"]', 'baz.*']) === 'foo.1.2.1.*.bar.baz\\.*');
  });


  it('containWildcardToken()', () => {
    assert(dot.containWildcardToken('foo.*.bar'));
    assert(dot.containWildcardToken('*.foo'));
    assert(dot.containWildcardToken('0.1.foo.bar.*'));
    assert(dot.containWildcardToken('foo') === false);
    assert(dot.containWildcardToken('foo*bar') === false);
    assert(dot.containWildcardToken('foo.*bar') === false);
    assert(dot.containWildcardToken('dot\\.path\\.*') === false);
  });
});
