# open-rest-helper-rest

open-rest 的 helper 插件，用来实现 CRUD 的标准操作

[![Build status](https://api.travis-ci.org/open-node/open-rest-helper-rest.svg?branch=master)](https://travis-ci.org/open-node/open-rest-helper-rest)
[![codecov](https://codecov.io/gh/open-node/open-rest-helper-rest/branch/master/graph/badge.svg)](https://codecov.io/gh/open-node/open-rest-helper-rest)

# Usage

```bash
npm instsall open-rest-helper-rest --save
```

## rest.omit
从 req.rest 上去掉一些参数
```js
var rest = require('open-rest-helper-rest');

// keys Array 要从req.rest 去掉的参数的名称
rest.omit(keys);

// return
// function(req, res, next) { ... };

//or 链式调用
rest
  .omit
  .keys(['name', 'password'])
  .exec();
```

## rest.required
判断某些必须的参数是否存在

```js
var rest = require('open-rest-helper-rest');

// keys Array 要判断的参数名称
// error 如果不想等报的错误，Error类型, 可选

rest.required(keys, error);

// return
// function(req, res, next) { ... };

//or 链式调用
rest
  .required
  .keys(['username', 'password'])
  .error(new restify.MissingParameterError('用户名和密码是必填项')
  .exec();
```

## rest.map
根据字典将 req.rest 的参数名称做个映射

```js
var rest = require('open-rest-helper-rest');

// dict Object {key(String) => value(String)}

rest.map({email: 'username', pwd: 'password'});

// return
// function(req, res, next) { ... };

//or 链式调用
rest
  .map({email: 'user', pwd: 'password'})
  .exec();
```

## rest.assign
给指定的 req.rest 某个key赋值，可以是静态的值，也可以是动态的值

```js
var rest = require('open-rest-helper-rest');

// keyPath 从 req.rest 上的路径，例如: 'id', 'user.name', 分别代表 req.rest.id, req.rest.user.name
// obj 要赋的值
//    1. {path: 'rest.id'} 代表值从 req.rest.id 获取
//    2. {fixed: 20} 代表固定的值

// 静态值
rest.assign('user.name', {fixed: 'Redstone Zhao'});

// 动态值
rest.assign('user.name', {path: 'hooks.user.name'});

// return
// function(req, res, next) { ... };

//or 链式调用
rest
  .assign
  .keyPath('user.name')
  .obj({path: 'user.role'})
  .exec();
```
