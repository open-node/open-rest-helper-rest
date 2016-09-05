var delegate  = require('func-delegate')
  , U         = require('../lib/utils')
  , _         = require('lodash');

// 删除单个资源的方法
// hook 必选，要删除的实例在 req.hooks 的什么位置
var remove = function(hook) {

  return function(req, res, next) {
    var model = req.hooks[hook];
    (function() {
      // 资源如果有isDelete 字段则修改isDelete 为yes即可
      if (!model.isDelete) return model.destroy();
      model.isDelete = 'yes';
      return model.save();
    })().then(function(mod) {
      res.send(204);
      next();
    }).catch(next);
  };

};

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;

  var schemas = [{
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Remove instance hook on req.hooks[hook], so `hook` must be a string'
  }];

  return delegate(remove, schemas);
};

