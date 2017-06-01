const delegate = require('func-delegate');
const U = require('../lib/utils');
const _ = require('lodash');

/**
 * 修改某个资源描述的前置方法, 不会sync到数据库
 * Model 必选, Sequlize 定义的Model，表明数据的原型
 * hook 必选, 实例的存放位置
 * cols 可选, 允许修改的字段
 */
const beforeModify = (Model, hook, cols) => (
  (req, res, next) => {
    const model = req.hooks[hook];
    const _cols = cols || Model.editableCols || Model.writableCols;
    const attr = U.pickParams(req, _cols, Model);
    delete attr.id;
    _.each(attr, (v, k) => {
      if (model[k] === v) return;
      model[k] = v;
    });
    return next();
  }
);

module.exports = (rest) => {
  const Sequelize = rest.Sequelize;

  const schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined',
  }, {
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on req.hooks[hook], so `hook` must be a string',
  }, {
    name: 'cols',
    type: Array,
    allowNull: true,
    validate: {
      check(keys, schema, args) {
        const Model = args[0];
        _.each(keys, (v) => {
          if (!_.isString(v)) {
            throw Error('Every item in cols must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error(`Attr non-exists: ${v}`);
          }
        });
        return true;
      },
    },
    message: 'Allow modify attrs\'s name array',
  }];

  return delegate(beforeModify, schemas);
};

