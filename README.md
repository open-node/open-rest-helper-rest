# open-rest-helper-rest

open-rest 的 helper 插件，用来实现 CRUD 的标准操作

[![Build status](https://api.travis-ci.org/open-node/open-rest-helper-rest.svg?branch=master)](https://travis-ci.org/open-node/open-rest-helper-rest)
[![codecov](https://codecov.io/gh/open-node/open-rest-helper-rest/branch/master/graph/badge.svg)](https://codecov.io/gh/open-node/open-rest-helper-rest)

# Usage

```bash
npm instsall open-rest-helper-rest --save
```

```js
var rest = require('open-rest');
var restHelper = require('open-rest-helper-rest')(rest);

// restHelper Equivalent to rest.helper.rest
```

## restHelper.list
标准的列表方法
```js
// Model 必选 Sequelize 定义的 Model, 表明要从哪个表获取数据
// opt 可选 特殊的 Model.findAll(options) options 的 hook 名称
// allowAttrs 可选，数组类型，指定允许返回的列，不指定则返回全部
// hook 可选，直接输出或者暂时寄存在 hooks 上

restHelper.list(Model, opt, allowAttrs, hook);

// return
// function(req, res, next) { ... };

//or 链式调用
restHelper
  .Model(User)
  .exec();
```
