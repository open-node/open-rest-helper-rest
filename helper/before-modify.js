var delegate      = require('func-delegate')
  , U             = require('../lib/utils')
  , _             = require('lodash');

/**
 * 修改某个资源描述的前置方法, 不会sync到数据库
 * Model 必选, Sequlize 定义的Model，表明数据的原型
 * hook 必选, 实例的存放位置
 * cols 可选, 允许修改的字段
 */
var beforeModify = function(Model, hook, cols) {

  return function(req, res, next) {
    var model = req.hooks[hook]
      , attr = U.pickParams(req, cols, Model);
    cols = cols || Model.editableCols || Model.writableCols;
    delete attr.id
    _.each(attr, function(v, k) {
      if (model[k] === v) return;
      model[k] = v;
    });
    next();
  };

};

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;

  var schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined'
  }, {
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on req.hooks[hook], so `hook` must be a string'
  }, {
    name: 'cols',
    type: Array,
    allowNull: true,
    validate: {
      check: function(keys, schema, args) {
        var Model = args[0];
        _.each(keys, function(v) {
          if (!_.isString(v)) {
            throw Error('Every item in allowAttrs must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error('Attr non-exists: ' + v);
          }
        });
        return true;
      }
    },
    message: "Allow modify attrs's name array"
  }];

  return delegate(beforeModify, schemas);
};

