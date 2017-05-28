var delegate      = require('func-delegate');

module.exports = function(rest) {

  /**
   * 修改某个资源描述的后置方法, 将变化保存到数据库
   * hook 必选, 实例的存放位置
   */
  var save = function(hook) {

    return function(req, res, next) {
      var model = req.hooks[hook]
        , changed = model.changed();
      // 如果没有变化，则不需要保存，也不需要记录日志
      if (!changed) {
        req._resourceNotChanged = true;
        res.header("X-Content-Resource-Status", 'Unchanged');
        if(req.res_no_send===true){
          req.res_no_send = model.get();
        } else {
          res.send(model);
        }
        return next();
      }
      model.save({fields: changed}).then(function(mod) {
        if(req.res_no_send===true){
          req.res_no_send = mod.get();
        } else {
          res.send(mod);
        }
        next();
      }).catch(function(error) {
        return next(rest.errors.sequelizeIfError(error));
      });
    };

  };

  var schemas = [{
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on req.hooks[hook], so `hook` must be a string'
  }];

  return delegate(save, schemas);
};
