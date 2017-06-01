const delegate = require('func-delegate');
const U = require('../lib/utils');
const _ = require('lodash');

// 获取单个资源详情的方法
// hook 必选，要输出的数据在 req.hooks 的什么位置
// attachs 可选，要附加输出的数据格式为 key => value, value 是 req 上的路径字符串
// statusCode 可选，输出使用的http状态码
// attrFilter 可选, 是否允许过滤属性, 默认允许
const detail = (hook, attachs, statusCode, attrFilter) => (
  (req, res, next) => {
    // 获取数据
    const model = req.hooks[hook];
    const params = req.params;
    let ret = model.toJSON ? model.toJSON() : model;

    // 附加额外的数据
    if (attachs) {
      _.each(attachs, (v, k) => {
        ret[k] = _.get(req, v);
      });
    }

    // 过滤属性值
    if ((attrFilter === true) && _.isString(params.attrs)) {
      const attrs = params.attrs.split(',');
      if (_.isArray(ret)) {
        ret = U.listAttrFilter(ret, attrs);
      } else {
        ret = U.itemAttrFilter(attrs)(ret);
      }
    }

    // 输出
    res.send(statusCode, ret);
    next();
  }
);

module.exports = () => {
  const schemas = [{
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Geted instance will hook on req.hooks[hook], so `hook` must be a string',
  }, {
    name: 'attachs',
    type: Object,
    allowNull: true,
    validate: {
      check(value) {
        _.each(value, (v) => {
          if (!_.isString(v)) {
            throw Error('The attachs structure is key = > value, value must be a string');
          }
        });
        return true;
      },
    },
    message: 'Attach other data dict. key => value, value is req\'s path',
  }, {
    name: 'statusCode',
    type: Number,
    allowNull: true,
    defaultValue: 200,
    message: 'HTTP statusCode, defaultValue is 200',
  }, {
    name: 'attrFilter',
    type: Boolean,
    allowNull: true,
    defaultValue: true,
    message: 'Whether to allow filtering properties, defaultValue is true',
  }];

  return delegate(detail, schemas);
};
