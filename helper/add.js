var delegate      = require('func-delegate')
  , U             = require('../lib/utils')
  , beforeAdd     = require('./before-add')
  , _             = require('lodash');

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;

  var before = beforeAdd(rest);

  /**
   * 根据资源描述添加资源到集合上的方法
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * cols 可选, 允许修改的字段
   * hook 必选, 实例的存放位置
   * attachs 可选，要附加输出的数据格式为 key => value, value 是 req 上的路径字符串
   */
  var add = function(Model, cols, hook, attachs) {

    return function(req, res, next) {
      before(Model, cols, hook)(req, res, function(error) {
        if (error) return next(error);
        rest.detail(hook, attachs, 201)(req, res, next);
      });
    };

  };

  var schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined'
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
  }, {
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on req.hooks[hook], so `hook` must be a string'
  }, {
    name: 'attachs',
    type: Object,
    allowNull: true,
    validate: {
      check: function(value) {
        _.each(value, function(v) {
          if (!_.isString(v)) {
            throw Error('The attachs structure is key = > value, value must be a string');
          }
        });
        return true;
      }
    },
    message: 'Attach other data dict. key => value, value is req\'s path'
  }];

  return delegate(add, schemas);
};

