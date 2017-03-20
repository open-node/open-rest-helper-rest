var delegate      = require('func-delegate')
  , U             = require('../lib/utils')
  , _             = require('lodash');

/**
 * 修改某个资源描述的前置方法, 不会sync到数据库
 * Model 必选, Sequlize 定义的Model，表明数据的原型
 * hook 必选, 实例的存放位置
 * cols 可选, 允许修改的字段
 */
module.exports = function(rest) {
  var Sequelize = rest.Sequelize;
  var beforeModify = function(Model, hook, cols) {

    return function(req, res, next) {
      var model = req.hooks[hook]
        , attr;
      cols = cols || Model.editableCols || Model.writableCols;
      try {
        attr = U.pickParams(req, cols, Model);
      } catch (e) {
        return next(e);
      }

      var _save = function() {
        delete attr.id
        _.each(attr, function(v, k) {
          if (model[k] === v) return;
          model[k] = v;
        });
        next();
      }

      if (!!Model.unique){
        // 如果设置了唯一属性
        // editableCols可能设置的没有id
        var where = { 
          id: { $ne : attr.id?attr.id : model.id } 
        };
        _.each(Model.unique, function(x) {
          where[x] = attr[x];
        });
        if(Model.rawAttributes.isDelete){
          where['isDelete'] = 'no';
        }

        // 根据条件查找资源
        Model.findOne({where: where}).then(function(model) {
          if (model) {
            // 资源已经存在，重复了
            return next(rest.errors.ifError(Error('Resource exists.'), Model.unique[0]))
          }
          // 保存资源
          return _save(model);
        }).catch(next);
      }else{
        return _save();
      }
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
  }, {
    name: 'cols',
    type: Array,
    allowNull: true,
    validate: {
      check: function(keys, schema, args) {
        var Model = args[0];
        _.each(keys, function(v) {
          if (!_.isString(v)) {
            throw Error('Every item in cols must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error('Attr non-exists: ' + v);
          }
        });
        return true;
      }
    },
    message: "Allow modify attrs's name array"
  }];

  return delegate(beforeModify, schemas);
};

