var delegate      = require('func-delegate')
  , U             = require('../lib/utils')
  , _             = require('lodash');

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;

  /**
   * 修改某个资源描述的后置方法, 将变化保存到数据库
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * hook 必选, 实例的存放位置
   */
  var save = function(Model, hook) {

    return function(req, res, next) {
      var model = req.hooks[hook]
        , changed = model.changed();
      // 如果没有变化，则不需要保存，也不需要记录日志
      if (!changed) {
        req._resourceNotChanged = true;
        res.header("X-Content-Resource-Status", 'Unchanged');
        res.send(model);
        return next();
      }
      model.save({fields: changed}).then(function(mod) {
        res.send(mod);
        next();
      }).catch(function(error) {
        return next(rest.errors.sequelizeIfError(error));
      });
    };

  };

  var schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined'
  }, {
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on req.hooks[hook], so `hook` must be a string'
  }];

  return delegate(save, schemas);
};
