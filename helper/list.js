var delegate  = require('func-delegate')
  , U         = require('../lib/utils')
  , _         = require('lodash');

/**
 * 获取资源列表的通用方法
 * _options 是否要去req.hooks上去options
 * allowAttrs 那些字段是被允许的
 * hook 默认为空，如果指定了hook，则数据不直接输出而是先挂在 hook上
 */
var list = function(Model, opt, allowAttrs, hook) {
  // 统计符合条件的条目数
  var getTotal = function(opt, ignoreTotal, callback) {
    if (ignoreTotal) return callback();
    U.callback(Model.count(opt), callback)
  };

  return function(req, res, next) {
    var options = opt ? req.hooks[opt] : U.findAllOpts(Model, req.params);
    var countOpt = {};
    if (options.where) countOpt.where = options.where;
    if (options.include) countOpt.include = options.include;
    // 是否忽略总条目数，这样就可以不需要count了。在某些时候可以
    // 提高查询速度
    var ignoreTotal = req.params._ignoreTotal === 'yes';
    var ls = [];
    getTotal(countOpt, ignoreTotal, function(error, count) {
      if (error) return next(error);
      if (ignoreTotal || count) {
        Model.findAll(options).then(function(result) {
          ls = U.listAttrFilter(result, allowAttrs);
          if (!ignoreTotal) res.header("X-Content-Record-Total", count);
          if (!hook && req.params.attrs) {
            ls = U.listAttrFilter(ls, req.params.attrs.split(','));
          }
          if (hook) {
            req.hooks[hook] = ls;
          } else {
            res.send(ls);
          }
          next();
        }).catch(next)
      } else {
        res.header("X-Content-Record-Total", 0);
        if (hook) {
          req.hooks[hook] = ls;
        } else {
          res.send(ls);
        }
        next();
      }
    });
  };
};

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;

  var listSchemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined'
  }, {
    name: 'opt',
    type: String,
    allowNull: true,
    message: "FindAll option hooks's name, so `opt` must be a string"
  }, {
    name: 'allowAttrs',
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
    message: "Allow return attrs's name array"
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Geted list will hook on req.hooks[hook], so `hook` must be a string'
  }];

  return delegate(list, listSchemas);
};
