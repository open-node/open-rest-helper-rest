var delegate      = require('func-delegate')
  , U             = require('../lib/utils')
  , beforeAdd     = require('./before-add')
  , detailHelper  = require('./detail')
  , _             = require('lodash');

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;


  /**
   * 根据资源描述添加资源到集合上的方法
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * cols 可选, 允许修改的字段
   * hook 必选, 实例的存放位置
   * attachs 可选，要附加输出的数据格式为 key => value, value 是 req 上的路径字符串
   */
  var add = function(Model, cols, hook, attachs) {

    // 这里hook其实是必须的，因为这里把 add 分成两个部分，
    // 为了避免冲突导致，这里引入了随机字符串
    if (!hook) hook = Model.name + '_' + rest.utils.randStr(10);

    var before = beforeAdd(rest)(Model, cols, hook);
    var detail = detailHelper(rest)(hook, attachs, 201);

    return function(req, res, next) {
      before(req, res, function(error) {
        if (error) return next(error);
        detail(req, res, next);
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
            throw Error('Every item in cols must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error('Attr non-exists: ' + v);
          }
        });
        return true;
      }
    },
    message: "Allow writed attrs's name array"
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Added instance will hook on req.hooks[hook], so `hook` must be a string'
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

