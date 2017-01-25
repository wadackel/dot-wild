const assert = require("assert");
const dot = require("../src/");


const sampleData = {
  tags: [
    { id: 1, tag: "tag1" },
    { id: 2, tag: "tag2" }
  ],
  nested: {
    deep: [
      {
        members: [
          { username: "tsuyoshiwada", profile: { age: 24 } },
          { username: "nestuser", profile: { age: 30 } },
          { username: "foobarbaz", profile: { age: 33 } }
        ]
      },
      {
        members: [
          { username: "testuser", profile: { age: 19 } },
          { username: "sample", profile: { age: 33 } },
          { username: "hogefuga", profile: { age: 40 } }
        ]
      }
    ]
  }
};


describe("dot-wild", () => {
  it("get()", () => {
    assert(dot.get() == null);
    assert(dot.get(null) == null);
    assert(dot.get(undefined) == null);
    assert(dot.get([]) == null);
    assert(dot.get({}) == null);
    assert(dot.get(0) == null);
    assert(dot.get("") == null);

    const t1 = { foo: { bar: "baz" } };
    assert(dot.get(t1, null) == null);
    assert(dot.get(t1, undefined) == null);
    assert(dot.get(t1, "") == null);
    assert(dot.get(t1, "bar") == null);
    assert(dot.get(t1, "fuga") == null);
    assert.deepStrictEqual(dot.get(t1, "foo"), { bar: "baz" });
    assert.deepStrictEqual(dot.get(t1, "['foo']"), { bar: "baz" });
    assert(dot.get(t1, "foo.bar") === "baz");
    assert(dot.get(t1, "['foo']['bar']") === "baz");
    assert(dot.get(t1, "test", "default") === "default");
    assert(dot.get(t1, "['test']", "default") === "default");
    assert(dot.get(t1, "foo.bar", "default") === "baz");
    assert(dot.get(t1, "['foo'].bar", "default") === "baz");
    assert(dot.get(t1, "['foo']['bar']", "default") === "baz");

    assert(dot.get({ "foo.bar.baz": "hoge" }, "foo\\.bar\\.baz") === "hoge");

    const t2 = { "foo.bar": { baz: { fuga: "fuge" } } };
    assert.deepStrictEqual(dot.get(t2, "foo\\.bar"), { baz: { fuga: "fuge" } });
    assert.deepStrictEqual(dot.get(t2, "foo\\.bar.baz"), { fuga: "fuge" });
    assert(dot.get(t2, "foo\\.bar.baz.fuga") === "fuge");
    assert(dot.get(t2, "foo\\.bar.baz.fuga.fuge") == null);

    const t3 = [null, [{ nested: { deep: { fuga: "fuge" } } }], false];
    assert(dot.get(t3, "[0]", "def") == null);
    assert(dot.get(t3, "0", "def") == null);
    assert(dot.get(t3, "[2]") === false);
    assert(dot.get(t3, "2") === false);
    assert.deepStrictEqual(dot.get(t3, "[1][0]"), { nested: { deep: { fuga: "fuge" } } });
    assert.deepStrictEqual(dot.get(t3, "1.0"), { nested: { deep: { fuga: "fuge" } } });
    assert.deepStrictEqual(dot.get(t3, "[1][0].nested"), { deep: { fuga: "fuge" } });
    assert.deepStrictEqual(dot.get(t3, "[1][0]['nested']"), { deep: { fuga: "fuge" } });
    assert.deepStrictEqual(dot.get(t3, "[1][0].nested.deep"), { fuga: "fuge" });
    assert.deepStrictEqual(dot.get(t3, "[1][0].nested['deep']"), { fuga: "fuge" });
    assert.deepStrictEqual(dot.get(t3, "[1][0].nested.deep.fuga"), "fuge");
    assert.deepStrictEqual(dot.get(t3, "[1][0].nested['deep']['fuga']"), "fuge");

    const t4 = [
      { k: "v1" },
      { k: "v2" },
      { k: "v3" }
    ];

    assert.deepStrictEqual(dot.get(t4, "*.k"), ["v1", "v2", "v3"]);
    assert(dot.get(t4, "*.k.foo") == null);

    // Real world
    assert.deepStrictEqual(dot.get(sampleData, "tags.*"), [
      { id: 1, tag: "tag1" },
      { id: 2, tag: "tag2" }
    ]);

    assert.deepStrictEqual(dot.get(sampleData, "tags.*.id"), [1, 2]);
    assert(dot.get(sampleData, "tags.*.id.test") == null);

    assert.deepStrictEqual(dot.get(sampleData, "nested.deep.*.members.*.profile.age"), [
      24, 30, 33,
      19, 33, 40
    ]);

    assert.deepStrictEqual(dot.get(sampleData, "nested.deep.1.members.*.username"), [
      "testuser",
      "sample",
      "hogefuga"
    ]);
  });


  it("set()", () => {
    const t1 = { foo: { bar: "baz" } };
    const assertT1 = () => {
      assert.deepStrictEqual(t1, { foo: { bar: "baz" } });
    };

    assert.deepStrictEqual(dot.set(t1, null, null), t1);

    assert.deepStrictEqual(dot.set(t1, "hoge", "fuga"), {
      foo: { bar: "baz" },
      hoge: "fuga"
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, "foo.bar", "override"), {
      foo: { bar: "override" }
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, "foo\\.bar", "newvalue"), {
      foo: { bar: "baz" },
      "foo.bar": "newvalue"
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, "newpath['key'].path", "value!!"), {
      foo: { bar: "baz" },
      newpath: { key: { path: "value!!" } }
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, "test.arr.0", "array"), {
      foo: { bar: "baz" },
      test: {
        arr: ["array"]
      }
    });
    assertT1();

    assert.deepStrictEqual(dot.set(t1, "arr.val.0.0.test", "nestvalue"), {
      foo: { bar: "baz" },
      arr: {
        val: [
          [
            {
              test: "nestvalue"
            }
          ]
        ]
      }
    });
    assertT1();

    const t2 = [
      { id: 1, profile: { name: "hoge" } },
      { id: 2, profile: { name: "fuga" } }
    ];
    const assertT2 = () => {
      assert.deepStrictEqual(t2, [
        { id: 1, profile: { name: "hoge" } },
        { id: 2, profile: { name: "fuga" } }
      ]);
    };

    assert.deepStrictEqual(dot.set(t2, "*.id", 10), [
      { id: 10, profile: { name: "hoge" } },
      { id: 10, profile: { name: "fuga" } }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, "*.hoge\\.key", 10), [
      { id: 1, "hoge.key": 10, profile: { name: "hoge" } },
      { id: 2, "hoge.key": 10, profile: { name: "fuga" } }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, "*.profile.name", "replaced"), [
      { id: 1, profile: { name: "replaced" } },
      { id: 2, profile: { name: "replaced" } }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, "1.profile.email", "sample@gmail.com"), [
      { id: 1, profile: { name: "hoge" } },
      { id: 2, profile: { name: "fuga", email: "sample@gmail.com" } }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, "*.profile.email", "sample@gmail.com"), [
      { id: 1, profile: { name: "hoge", email: "sample@gmail.com" } },
      { id: 2, profile: { name: "fuga", email: "sample@gmail.com" } }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, "2", {
      id: 3, profile: { name: "foo" }
    }), [
      { id: 1, profile: { name: "hoge" } },
      { id: 2, profile: { name: "fuga" } },
      { id: 3, profile: { name: "foo" } }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.set(t2, "2.profile", {
      name: "test", age: 50
    }), [
      { id: 1, profile: { name: "hoge" } },
      { id: 2, profile: { name: "fuga" } },
      { profile: { name: "test", age: 50 } }
    ]);
    assertT2();
  });


  it("delete()", () => {
    const t1 = { foo: { bar: "baz" } };
    const assertT1 = () => {
      assert.deepStrictEqual(t1, { foo: { bar: "baz" } });
    };

    assert.deepStrictEqual(dot.delete(t1, "notfound"), { foo: { bar: "baz" } });
    assertT1();

    assert.deepStrictEqual(dot.delete(t1, "foo"), {});
    assertT1();

    assert.deepStrictEqual(dot.delete(t1, "foo.bar"), { foo: {} });
    assertT1();

    assert.deepStrictEqual(dot.delete({ "foo.bar": "baz" }, "foo\\.bar"), {});

    const t2 = [
      { nest: [{ deep: { name: "foo" } }] },
      { nest: [{ deep: { name: "bar" } }] },
      { nest: [{ deep: { name: "baz" } }] }
    ];
    const assertT2 = () => {
      assert.deepStrictEqual(t2, [
        { nest: [{ deep: { name: "foo" } }] },
        { nest: [{ deep: { name: "bar" } }] },
        { nest: [{ deep: { name: "baz" } }] }
      ]);
    };

    assert.deepStrictEqual(dot.delete(t2, "0"), [
      { nest: [{ deep: { name: "bar" } }] },
      { nest: [{ deep: { name: "baz" } }] }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.delete(t2, "0.nest"), [
      {},
      { nest: [{ deep: { name: "bar" } }] },
      { nest: [{ deep: { name: "baz" } }] }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.delete(t2, "2.nest.0.deep.name"), [
      { nest: [{ deep: { name: "foo" } }] },
      { nest: [{ deep: { name: "bar" } }] },
      { nest: [{ deep: {} }] }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.delete(t2, "*"), []);
    assertT2();

    assert.deepStrictEqual(dot.delete(t2, "*.nest.*.deep"), [
      { nest: [{}] },
      { nest: [{}] },
      { nest: [{}] }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.delete(t2, "*.nest.*.deep.name"), [
      { nest: [{ deep: {} }] },
      { nest: [{ deep: {} }] },
      { nest: [{ deep: {} }] }
    ]);
    assertT2();

    assert.deepStrictEqual(dot.delete(t2, "*.nest.*.deep.name.hoge"), [
      { nest: [{ deep: { name: "foo" } }] },
      { nest: [{ deep: { name: "bar" } }] },
      { nest: [{ deep: { name: "baz" } }] }
    ]);
    assertT2();
  });


  it("has()", () => {
    assert(dot.has(null, null) === false);
    assert(dot.has(null, "hoge") === false);

    assert(dot.has({ foo: { bar: "baz" } }, "foo") === true);
    assert(dot.has({ foo: { bar: "baz" } }, "foo.bar") === true);
    assert(dot.has({ foo: { bar: "baz" } }, "foo['bar']") === true);
    assert(dot.has({ foo: { bar: "baz" } }, "foo\\.bar") === false);
    assert(dot.has({ foo: { bar: "baz" } }, "foo.bar.baz") === false);
    assert(dot.has({ foo: { bar: "baz" } }, "notfound") === false);
    assert(dot.has({ foo: { bar: "baz" } }, "foo.bee") === false);
    assert(dot.has({ foo: { bar: "baz" } }, "foo.bar.hoge") === false);
    assert(dot.has({ foo: { bar: "baz" } }, "foo.bar.hoge") === false);

    assert(dot.has(sampleData, "tags.*.id") === true);
    assert(dot.has(sampleData, "tags.*.hoge") === false);
    assert(dot.has(sampleData, "nested.deep.*") === true);
    assert(dot.has(sampleData, "nested.deep.*.members.*.username") === true);
    assert(dot.has(sampleData, "nested.deep.*.members.*.username.hoge") === false);
    assert(dot.has(sampleData, "nested.deep.*.foo.bar") === false);
  });


  it("flatten()", () => {
    assert.deepStrictEqual(dot.flatten(null), {});
    assert.deepStrictEqual(dot.flatten(undefined), {});
    assert.deepStrictEqual(dot.flatten({}), {});
    assert.deepStrictEqual(dot.flatten([]), {});

    assert.deepStrictEqual(dot.flatten({ foo: { bar: "baz" } }), {
      "foo.bar": "baz"
    });

    assert.deepStrictEqual(dot.flatten([
      { key: "value1" },
      { key: "value2" },
      { key: "value3" }
    ]), {
      "0.key": "value1",
      "1.key": "value2",
      "2.key": "value3"
    });

    assert.deepStrictEqual(dot.flatten(sampleData), {
      "tags.0.id": 1,
      "tags.0.tag": "tag1",
      "tags.1.id": 2,
      "tags.1.tag": "tag2",
      "nested.deep.0.members.0.username": "tsuyoshiwada",
      "nested.deep.0.members.0.profile.age": 24,
      "nested.deep.0.members.1.username": "nestuser",
      "nested.deep.0.members.1.profile.age": 30,
      "nested.deep.0.members.2.username": "foobarbaz",
      "nested.deep.0.members.2.profile.age": 33,
      "nested.deep.1.members.0.username": "testuser",
      "nested.deep.1.members.0.profile.age": 19,
      "nested.deep.1.members.1.username": "sample",
      "nested.deep.1.members.1.profile.age": 33,
      "nested.deep.1.members.2.username": "hogefuga",
      "nested.deep.1.members.2.profile.age": 40
    });
  });


  it("expand()", () => {
    assert.deepStrictEqual(dot.expand(null), {});

    assert.deepStrictEqual(dot.expand({
      "foo.bar": "baz"
    }), {
      foo: {
        bar: "baz"
      }
    });

    assert.deepStrictEqual(dot.expand({
      "0.id": { user: 1 },
      "1.id": { user: 2 },
      "2.id": { user: 3 }
    }), [
      { id: { user: 1 } },
      { id: { user: 2 } },
      { id: { user: 3 } }
    ]);

    assert.deepStrictEqual(dot.expand(dot.flatten(sampleData)), sampleData);
  });


  it("matchPath()", () => {
    assert(dot.matchPath("", "") === true);
    assert(dot.matchPath("hoge", "hoge") === true);
    assert(dot.matchPath("foo.bar", "foo.bar") === true);
    assert(dot.matchPath("foo\\.bar", "foo\\.bar") === true);
    assert(dot.matchPath("foo.*.nested", "foo.*.nested") === true);
    assert(dot.matchPath("foo.*.nested", "foo.7.nested") === true);
    assert(dot.matchPath("foo.7.nested", "foo.*.nested") === true);
    assert(dot.matchPath("foo.7.nested.0.deep", "foo.*.nested.*.deep") === true);
    assert(dot.matchPath("foo\\.bar.*.baz", "foo\\.bar.2.baz") === true);

    assert(dot.matchPath(false, false) === false);
    assert(dot.matchPath(true, true) === false);
    assert(dot.matchPath(null, null) === false);
    assert(dot.matchPath("fuga", "fugahoge") === false);
    assert(dot.matchPath("foo.2", "foo.1") === false);
    assert(dot.matchPath("foo.*.bar", "foo.bar") === false);
    assert(dot.matchPath("foo.*.bar", "foo.*.bar.baz") === false);
    assert(dot.matchPath("foo.*.bar", "foo\\.1.bar") === false);
  });
});
