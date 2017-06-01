const delegate = require('func-delegate');
const statsModule = require('../lib/stats');
const _ = require('lodash');

module.exports = (rest) => {
  const Sequelize = rest.Sequelize;

  const stats = statsModule(rest);

  /**
   * 获取单个资源详情的方法
   * Model 必选，Sequlize 定义的Model，表明数据从哪里获取
   * where 可选，额外的条件, req 对象上的路径，例如 'hooks.option.where',
   * hook 可选, 默认为空，如果指定了hook，则数据不直接输出而是先挂在 hook上
   * conf 可选，统计功能的配置，req 对象上值的路径例如 'hooks.user.conf'
   */
  const statistics = (Model, _where, hook, _conf) => (
    (req, res, next) => {
      const conf = _conf ? _.get(req, _conf) : null;
      const where = _where ? _.get(req, _where) : '';
      stats.statistics(Model, req.params, where, conf, (error, ret) => {
        if (error) return next(error);
        const [data, total] = ret;
        res.header('X-Content-Record-Total', total);
        if (hook) {
          req.hooks[hook] = data;
        } else {
          res.send(data);
        }
        return next();
      });
    }
  );

  const schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined',
  }, {
    name: 'where',
    type: String,
    allowNull: true,
    message: 'FindAll option condition, req\'s value path, so `where` must be a string',
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Geted statistics data will hook on req.hooks[hook], so `hook` must be a string',
  }, {
    name: 'conf',
    type: String,
    allowNull: true,
    message: 'Status dynamic config, req\'s value path',
  }];

  return delegate(statistics, schemas);
};
