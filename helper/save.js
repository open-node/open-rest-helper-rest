const delegate = require('func-delegate');

module.exports = (rest) => {
  /**
   * 修改某个资源描述的后置方法, 将变化保存到数据库
   * hook 必选, 实例的存放位置
   */
  const save = (hook) => (
    (req, res, next) => {
      const model = req.hooks[hook];
      const changed = model.changed();
      // 如果没有变化，则不需要保存，也不需要记录日志
      if (!changed) {
        req._resourceNotChanged = true;
        res.header('X-Content-Resource-Status', 'Unchanged');
        res.send(model);
        return next();
      }
      return model.save({ fields: changed }).then((mod) => {
        res.send(mod);
        next();
      }).catch((error) => {
        next(rest.errors.sequelizeIfError(error));
      });
    }
  );

  const schemas = [{
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on req.hooks[hook], so `hook` must be a string',
  }];

  return delegate(save, schemas);
};
