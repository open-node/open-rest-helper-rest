var delegate      = require('func-delegate')
  , U             = require('../lib/utils')
  , statsModule   = require('../lib/stats')
  , _             = require('lodash');

module.exports = function(rest) {
  var Sequelize = rest.Sequelize;

  var stats = statsModule(rest);

  /**
   * 获取单个资源详情的方法
   * Model 必选，Sequlize 定义的Model，表明数据从哪里获取
   * opt 可选，是否要去req.hooks上去 options
   * hook 可选, 默认为空，如果指定了hook，则数据不直接输出而是先挂在 hook上
   * conf 可选，统计功能的配置，req 对象上值的路径例如 'hooks.user.conf'
   */
  var statistics = function(Model, opt, hook, _conf) {

    return function(req, res, next) {
      var conf = _conf ? _.get(req, _conf) : null;
      var where = opt ? _.get(req, opt).where : '';
      stats.statistics(Model, req.params, where, conf, function(error, ret) {
        if (error) return next(error);
        var data = ret[0]
          , total = ret[1];
        res.header("X-Content-Record-Total", total)
        if (hook) {
          req.hooks[hook] = data;
        } else {
          res.send(data);
        }
        next();
      });
    };

  };

  var schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined'
  }, {
    name: 'opt',
    type: String,
    allowNull: true,
    message: "FindAll option req's value path, so `opt` must be a string"
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Geted statistics data will hook on req.hooks[hook], so `hook` must be a string'
  }, {
    name: 'conf',
    type: String,
    allowNull: true,
    message: 'Status dynamic config, req\'s value path'
  }];

  return delegate(statistics, schemas);
};
