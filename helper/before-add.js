const delegate = require('func-delegate');
const U = require('../lib/utils');
const _ = require('lodash');

module.exports = (rest) => {
  const Sequelize = rest.Sequelize;

  /**
   * 修改某个资源描述的前置方法, 不会sync到数据库
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * cols 可选, 允许设置的字段
   * hook 必选, 生成实例的存放位置
   */
  const beforeAdd = (Model, cols, hook) => (
    (req, res, next) => {
      const attr = U.pickParams(req, cols || Model.writableCols, Model);

      // 存储数据
      const _save = (model) => {
        model.save().then((mod) => {
          req.hooks[hook] = mod;
          next();
        }).catch((error) => next(rest.errors.sequelizeIfError(error)));
      };

      // 约定的 creatorId, 等于 req.user.id
      if (Model.rawAttributes.creatorId) attr.creatorId = req.user.id;
      // 约定的 clientIp, 等于rest.utils.clientIp(req)
      if (Model.rawAttributes.clientIp) attr.clientIp = rest.utils.clientIp(req);

      // 如果没有设置唯一属性，或者没有开启回收站
      if ((!Model.unique) || (!Model.rawAttributes.isDelete)) {
        return _save(Model.build(attr));
      }

      // 如果设置了唯一属性，且开启了回收站功能
      // 则判断是否需要执行恢复操作
      const where = {};
      _.each(Model.unique, (x) => {
        where[x] = attr[x];
      });

      // 根据条件查找资源
      return Model.findOne({ where }).then((model) => {
        // 资源存在
        if (model) {
          // 且资源曾经被删除
          if (model.isDelete === 'yes') {
            _.extend(model, attr);
            // 恢复为正常状态
            model.isDelete = 'no';
          } else {
            // 资源已经存在，重复了
            return next(rest.errors.ifError(Error('Resource exists.'), Model.unique[0]));
          }
        }
        // 保存资源 已有资源或者构建一个全新的资源
        return _save(model || Model.build(attr));
      }).catch(next);
    }
  );

  const schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined',
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
    message: 'Allow writed attrs\'s name array',
  }, {
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Added instance will hook on req.hooks[hook], so `hook` must be a string',
  }];

  return delegate(beforeAdd, schemas);
};
