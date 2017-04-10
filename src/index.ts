type DotKey = string | number;
type Token = string;
type Tokens = Token[];

/**
 * Utilities
 */
const isObj = require('is-obj');
const isArray = (val: any): val is any[] => Array.isArray(val);
const isString = (val: any): val is string => typeof val === 'string';
const isInteger = (val: any): boolean => Number(val) == val && Number(val) % 1 === 0; // tslint:disable-line triple-equals
const isNumeric = (val: any): boolean => !isArray(val) && (val - parseFloat(val) + 1) >= 0;
const isData = (data: any): boolean => isObj(data) || isArray(data);
const isArrayKey = (key: DotKey): boolean => isInteger(key) && parseInt(<string>key) >= 0;
const hasProp = (obj: any, key: DotKey) => obj && obj.hasOwnProperty(key);
const objKeys = Object.keys;


const isEmpty = (obj: any): boolean => {
  if (isArray(obj)) return obj.length === 0;
  if (isObj(obj)) return objKeys(obj).length === 0;
  if (isNumeric(obj)) return parseFloat(obj) === 0;
  return !obj;
};


const regex = {
  dot: /^\./,
  prop: /[^[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
  escape: /\\(\\)?/g,
};


const each = (obj: any | null, iteratee: (v: any, i: DotKey, a: any) => boolean | void): void => {
  if (!obj) return;

  if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (iteratee(obj[i], i, obj) === false) break;
    }
  } else if (isObj(obj)) {
    const keys = objKeys(obj);
    for (let i = 0; i < keys.length; i++) {
      if (iteratee(obj[keys[i]], keys[i], obj) === false) break;
    }
  }
};


const clone = <T>(obj: T): T => {
  if (!isData(obj)) return obj;

  const result: any = isArray(obj) ? [] : {};

  each(obj, (value, key) => {
    result[key] = clone(value);
  });

  return result;
};


const merge = <T>(obj: T, source: T): T => {
  each(source, (value, key) => {
    if (hasProp(obj, key) && isData(obj)) {
      merge(obj[key], value);
    } else {
      obj[key] = value;
    }
  });
  return obj;
};


const splitTokens = (input: string): Tokens => {
  const tokens = `${input}`.split('.');
  let results: Tokens = [];
  let store: Tokens = [];

  tokens.forEach(token => {
    if (/^.*\\$/.test(token)) {
      store.push(token.slice(0, token.length - 1));
    } else if (store.length > 0) {
      results = [...results, `${store.join('.')}.${token}`];
      store = [];
    } else {
      results.push(token);
    }
  });

  return results;
};


const matchToken = (key: DotKey, token: DotKey): boolean => {
  if (token === '*') return true;

  return isInteger(token) ? key == token : key === token; // tslint:disable-line triple-equals
};


const hasToken = (path: string): boolean => (
  path.indexOf('.') > -1 || path.indexOf('[') > -1
);


const tokenize = (str: string): Tokens => {
  const results: Tokens = [];

  splitTokens(str).forEach(token => {
    token.replace(regex.prop, (m: any, n: number, q: string, s: string): any => {
      results.push(q ? s.replace(regex.escape, '$1') : (n || m));
    });
  });

  return results;
};


/**
 * Getter
 */
export const get = (data: any, path: DotKey, value: any | null = null): any => {
  if (!path || !isString(path)) {
    return value;
  }

  const key = '__get_item__';
  const tokens = tokenize(path);
  const length = tokens.length;
  let useWildcard = false;
  let index = 0;
  let context = { [key]: [data] };

  tokens.forEach(token => {
    const next: any[] = [];

    each(context[key], item => {
      each(item, (v, k) => {
        if (matchToken(k, token)) {
          if (token === '*') {
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
 */
export const set = (data: any, path: DotKey, value: any): any => {
  if (!path || !isString(path)) return data;

  let _data = clone(data);

  if (!hasToken(path)) {
    _data[path] = value;
    return _data;
  }

  const tokens = tokenize(path);

  if (tokens.indexOf('*') < 0) {
    const res = _data;

    each(tokens, (token, i) => {
      if (!isObj(_data[token]) && !isArray(_data[token])) {
        if (<number>i < tokens.length - 1 && isArrayKey(tokens[<number>i + 1])) {
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
    const nextPath = tokens.map(v => v.replace('.', '\\.')).join('.');

    if (token === undefined) return _data;

    each(_data, (v, k) => {
      if (matchToken(k, token)) {
        _data[k] = nextPath ? set(v, nextPath, value) : merge(v, value);
      }
    });
  }

  return _data;
};


/**
 * Deleter
 */
export const remove = (data: any, path: DotKey): any => {
  if (!path || !isString(path)) return data;

  let _data = clone(data);

  if (!hasToken(path) && path !== '*') {
    if (isArrayKey(path) && isArray(_data)) {
      _data.splice(parseInt(path, 10), 1);
    } else {
      delete _data[path];
    }
    return _data;
  }

  const tokens = tokenize(path);

  if (tokens.indexOf('*') < 0) {
    const res = _data;

    each(tokens, (token, i): boolean => {
      if (i === tokens.length - 1) {
        delete _data[token];
        return false;
      }

      _data = _data[token];

      if (!isObj(_data) && !isArray(_data)) {
        return false;
      }

      return true;
    });

    return res;

  } else {
    const token = tokens.shift();
    const nextPath = tokens.join('.');

    if (token === undefined) return _data;

    each(_data, (v, k) => {
      if (!matchToken(k, token)) return;

      if (isObj(v) || isArray(v)) {
        if (nextPath) {
          _data[k] = remove(v, nextPath);

        } else {
          if (isArray(_data[k])) {
            _data[k].splice(parseInt(<string>k), 1);
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
 */
export const has = (data: any, path: DotKey): boolean => {
  if (!path || !isString(path)) return false;

  const key = '__has__item';
  const tokens = tokenize(path);
  let context = { [key]: [data] };
  let result = true;

  each(tokens, token => {
    const next: any[] = [];

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

    return true;
  });

  return result;
};


/**
 * Flatten values
 */
const internalFlatten = (data: any, currentPath: DotKey | null = null): any => {
  let results = {};

  if (isEmpty(data)) return results;

  if (isArray(data) && data.length === 0) {
    const path = currentPath == null ? 0 : currentPath;
    results[path] = data;
    return results;
  }

  each(data, (val, key) => {
    const k = `${key}`.split('.').join('\\.');
    const p = currentPath == null ? k : `${currentPath}.${k}`;

    if (isArray(val) || isObj(val)) {
      const children = internalFlatten(val, p);
      if (objKeys(children).length > 0) {
        results = merge(results, children);
      }
    } else {
      results[p] = val;
    }
  });

  return results;
};


export const flatten = (data: any): any => internalFlatten(data);


/**
 * Expand vaules
 */
export const expand = (data: any): any => {
  let results = {};

  each(data, (value, flat) => {
    const keys = tokenize(<string>flat).reverse();
    const key = <string>keys.shift();
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
 * Executes a provided function once for each element.
 */
const toIterable = (value: any) => !isObj(value) && !isArray(value) ? [value] : value;

export const forEach = (data: any, path: DotKey, iteratee: (value: any, key: DotKey, array: any | any[]) => void): void => {
  const result = get(data, path);
  if (result === null) return;

  const obj = toIterable(result);

  each(obj, iteratee);
};


/**
 * Create a new element
 * with the results of calling a provided function on every element.
 */
export const map = (data: any, path: DotKey, iteratee: (value: any, key: DotKey, array: any | any[]) => any): any[] => {
  const result = get(data, path);
  if (result === null) return [];

  const obj = toIterable(result);
  const values: any[] = [];

  each(obj, (value, key, array) => {
    values[key] = iteratee(value, key, array);
  });

  return values;
};


/**
 * Match key
 */
export const matchPath = (pathA: string, pathB: string): boolean => {
  if (!isString(pathA) || !isString(pathB)) return false;
  if (pathA === pathB) return true;

  const a = tokenize(pathA);
  const b = tokenize(pathB);

  return a.length !== b.length ? false : a.every((t, i) =>
    matchToken(t, b[i]) || matchToken(b[i], t),
  );
};


/**
 * Escape path string
 */
export const escapePath = (path: string): string => (
  !isString(path) ? '' : tokenize(path).map(p =>
    p.split('.').join('\\.'),
  ).join('\\.')
);
