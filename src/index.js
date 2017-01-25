/**
 * Utilities
 */
const isObj = require("is-obj");
const isArray = Array.isArray;
const isString = val => typeof val === "string";
const isInteger = val => Number(val) == val && Number(val) % 1 === 0; // eslint-disable-line eqeqeq
const isNumeric = val => !isArray(val) && (val - parseFloat(val, 10) + 1) >= 0;
const isData = data => isObj(data) || isArray(data);
const isArrayKey = key => isInteger(key) && parseInt(key, 10) >= 0;
const hasProp = (obj, key) => obj && obj.hasOwnProperty(key);
const objKeys = Object.keys;


const isEmpty = obj => {
  if (isArray(obj)) return obj.length === 0;
  if (isObj(obj)) return objKeys(obj).length === 0;
  if (isNumeric(obj)) return parseFloat(obj, 10) === 0;
  return !obj;
};


const regex = {
  dot: /^\./,
  prop: /[^[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
  escape: /\\(\\)?/g
};


const each = (obj, iterate) => {
  if (!obj) return;

  if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (iterate(obj[i], i) === false) break;
    }
  } else if (isObj(obj)) {
    const keys = objKeys(obj);
    for (let i = 0; i < keys.length; i++) {
      if (iterate(obj[keys[i]], keys[i]) === false) break;
    }
  }
};


const clone = obj => {
  if (!isData(obj)) return obj;

  const result = isArray(obj) ? [] : {};

  each(obj, (value, key) => {
    result[key] = clone(value);
  });

  return result;
};


const merge = (obj, source) => {
  each(source, (value, key) => {
    if (hasProp(obj, key) && isData(obj)) {
      merge(obj[key], value);
    } else {
      obj[key] = value;
    }
  });
  return obj;
};


const splitTokens = input => {
  const tokens = `${input}`.split(".");
  let results = [];
  let store = [];

  tokens.forEach(token => {
    if (/^.*\\$/.test(token)) {
      store.push(token.slice(0, token.length - 1));
    } else if (store.length > 0) {
      results = [...results, `${store.join(".")}.${token}`];
      store = [];
    } else {
      results.push(token);
    }
  });

  return results;
};


const matchToken = (key, token) => {
  if (token === "*") {
    return true;

  } else {
    return (token - parseFloat(token, 10) + 1) >= 0
      ? (key == token) // eslint-disable-line eqeqeq
      : key === token;
  }
};


const hasToken = path => (
  path.indexOf(".") > -1 || path.indexOf("[") > -1
);


const tokenize = str => {
  const results = [];

  splitTokens(str).forEach(s => {
    s.replace(regex.prop, (match, number, quote, string) => {
      results.push(quote ? string.replace(regex.escape, "$1") : (number || match));
    });
  });

  return results;
};


/**
 * Getter
 *
 * @param  {string}  data
 * @param  {string}  path
 * @param  {string}  [value]
 * @return {Object|Array}
 */
const _get = (data, path, value = null) => {
  if (!path || !isString(path)) {
    return value;
  }

  const key = "__get_item__";
  const tokens = tokenize(path);
  const length = tokens.length;
  let useWildcard = false;
  let index = 0;
  let context = { [key]: [data] };

  tokens.forEach(token => {
    const next = [];

    each(context[key], item => {
      each(item, (v, k) => {
        if (matchToken(k, token)) {
          if (token === "*") {
            useWildcard = true;
          }
          next.push(v);
        }
      });
    });

    if (next.length > 0) {
      context = { [key]: next };
      index++;
    }
  });

  if (index !== length) return value;

  const v = context[key];
  return useWildcard ? v : v.shift();
};


/**
 * Setter
 *
 * @param  {string}  data
 * @param  {string}  path
 * @param  {string}  value
 * @return {Object|Array}
 */
const _set = (data, path, value) => {
  if (!path || !isString(path)) return data;

  let _data = clone(data);

  if (!hasToken(path)) {
    _data[path] = value;
    return _data;
  }

  const tokens = tokenize(path);

  if (tokens.indexOf("*") < 0) {
    const res = _data;

    each(tokens, (token, i) => {
      if (!isObj(_data[token]) && !isArray(_data[token])) {
        if (i < tokens.length - 1 && isArrayKey(tokens[i + 1])) {
          _data[token] = [];
        } else {
          _data[token] = {};
        }
      }

      if (i === tokens.length - 1) {
        _data[token] = value;
      }

      _data = _data[token];
    });

    return res;

  } else {
    const token = tokens.shift();
    const nextPath = tokens.map(v => v.replace(".", "\\.")).join(".");

    each(_data, (v, k) => {
      if (matchToken(k, token)) {
        _data[k] = nextPath ? _set(v, nextPath, value) : merge(v, value);
      }
    });
  }

  return _data;
};


/**
 * Deleter
 *
 * @param  {string}  data
 * @param  {string}  path
 * @return {Object|Array}
 */
const _delete = (data, path) => {
  if (!path || !isString(path)) return data;

  let _data = clone(data);

  if (!hasToken(path) && path !== "*") {
    if (isArrayKey(path) && isArray(_data)) {
      _data.splice(parseInt(path, 10), 1);
    } else {
      delete _data[path];
    }
    return _data;
  }

  const tokens = tokenize(path);

  if (tokens.indexOf("*") < 0) {
    const res = _data;

    each(tokens, (token, i) => {
      if (i === tokens.length - 1) {
        delete _data[token];
        return false;
      }

      _data = _data[token];

      if (!isObj(_data) && !isArray(_data)) {
        return false;
      }
    });

    return res;

  } else {
    const token = tokens.shift();
    const nextPath = tokens.join(".");

    each(_data, (v, k) => {
      if (!matchToken(k, token)) return;

      if (isObj(v) || isArray(v)) {
        if (nextPath) {
          _data[k] = _delete(v, nextPath);

        } else {
          if (isArray(_data[k])) {
            _data[k].splice(parseInt(k, 10), 1);
            return;
          }

          delete _data[k];
        }

      } else if (!nextPath) {
        delete _data[k];
      }
    });
  }

  return _data;
};


/**
 * Check value
 *
 * @param  {string}  data
 * @param  {string}  path
 * @return {Object|Array}
 */
const _has = (data, path) => {
  if (!path || !isString(path)) return false;

  const key = "__has__item";
  const tokens = tokenize(path);
  let context = { [key]: [data] };
  let result = true;

  tokens.forEach(token => {
    const next = [];

    each(context[key], item => {
      each(item, (v, k) => {
        if (matchToken(k, token)) {
          next.push(v);
        }
      });
    });

    if (next.length === 0) {
      result = false;
      return false;
    } else {
      context = { [key]: next };
    }
  });

  return result;
};


const _internalFlatten = (data, currentPath = null) => {
  let results = {};

  if (isEmpty(data)) return results;

  if (isArray(data) && data.length === 0) {
    const path = currentPath == null ? 0 : currentPath;
    results[path] = data;
    return results;
  }

  each(data, (val, key) => {
    const k = `${key}`.split(".").join("\\.");
    const p = currentPath == null ? k : `${currentPath}.${k}`;

    if (isArray(val) || isObj(val)) {
      const children = _internalFlatten(val, p);
      if (objKeys(children).length > 0) {
        results = merge(results, children);
      }
    } else {
      results[p] = val;
    }
  });

  return results;
};


/**
 * Flatten values
 *
 * @param  {string}  data
 * @return {Object}
 */
const _flatten = data => _internalFlatten(data);


/**
 * Expand vaules
 *
 * @param  {string}  data
 * @return {Object|Array}
 */
const _expand = data => {
  let results = {};

  each(data, (value, flat) => {
    const keys = tokenize(flat).reverse();
    const key = keys.shift();
    let child = isArrayKey(key) ? [] : {};
    child[key] = value;
    each(keys, k => {
      if (isArrayKey(k)) {
        const newChild = [];
        newChild[k] = child;
        child = newChild;
      } else {
        child = { [k]: child };
      }
    });
    if (isArrayKey(keys[keys.length - 1]) && isEmpty(results)) {
      results = [];
    }
    results = merge(results, child);
  });

  return results;
};


/**
 * Match key
 *
 * @param  {string}  pathA
 * @param  {string}  pathB
 * @return {Object|Array}
 */
const _matchPath = (pathA, pathB) => {
  if (!isString(pathA) || !isString(pathB)) return false;
  if (pathA === pathB) return true;

  const a = tokenize(pathA);
  const b = tokenize(pathB);

  return a.length !== b.length ? false : a.every((t, i) =>
    matchToken(t, b[i]) || matchToken(b[i], t)
  );
};


/**
 * Exports
 */
module.exports = {
  get: _get,
  set: _set,
  delete: _delete,
  has: _has,
  flatten: _flatten,
  expand: _expand,
  matchPath: _matchPath
};
