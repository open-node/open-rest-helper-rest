const delegate = require('func-delegate');

const deleteFields = ['isDelete', 'deletorId', 'deletedAt'];

// 删除单个资源的方法
// hook 必选，要删除的实例在 req.hooks 的什么位置
const remove = (hook) => (
  (req, res, next) => {
    const model = req.hooks[hook];
    (() => {
      // 资源如果有isDelete 字段则修改isDelete 为yes即可
      if (!model.isDelete) return model.destroy();
      model.isDelete = 'yes';
      model.deletorId = req.user.id;
      model.deletedAt = new Date();
      return model.save({ fields: deleteFields, validate: false });
    })().then(() => {
      res.send(204);
      next();
    }).catch(next);
  }
);

module.exports = () => {
  const schemas = [{
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Remove instance hook on req.hooks[hook], so `hook` must be a string',
  }];

  return delegate(remove, schemas);
};
