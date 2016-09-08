var _       = require('lodash')
  , mysql   = require('mysql');

var NUMBER_TYPES = ['INTEGER', 'FLOAT'];

//返回列表查询的条件
var findAllOpts = function(Model, params, isAll) {
  var where = {}
    , searchOrs = []
    , includes = modelInclude(params, Model.includes);
  _.each(Model.filterAttrs || _.keys(Model.rawAttributes), function(name) {
    findOptFilter(params, name, where);
  });
  if (Model.rawAttributes.isDelete && !params.showDelete) {
    where.isDelete = 'no';
  }

  // 将搜索条件添加到主条件上
  searchOrs.push(searchOpt(Model, params._searchs, params.q));

  // 处理关联资源的过滤条件
  // 以及关联资源允许返回的字段
  if (includes) {
    _.each(includes, function(x) {
      var includeWhere = {};
      var filterAttrs = x.model.filterAttrs || _.keys(x.model.rawAttributes);
      _.each(filterAttrs, function(name) {
        findOptFilter(params[x.as], name, includeWhere, name);
      });
      if (x.model.rawAttributes.isDelete && !params.showDelete) {
        includeWhere.$or = [{isDelete: 'no'}];
        if (x.required === false) includeWhere.$or.push({id: null});
      }

      // 将搜索条件添加到 include 的 where 条件上
      searchOrs.push(searchOpt(x.model, params._searchs, params.q, x.as));

      if (_.size(includeWhere)) x.where = includeWhere;

      // 以及关联资源允许返回的字段
      if (x.model.allowIncludeCols) x.attributes = x.model.allowIncludeCols;
    });
  }

  // 将 searchOrs 赋到 where 上
  searchOrs = _.filter(_.compact(searchOrs), function(x) { return x.length; });
  if (searchOrs.length) where.$or = [[mergeSearchOrs(searchOrs), ['']]];

  var ret = {
    include: includes,
    order: sort(params, Model.sort)
  };

  if (_.size(where)) ret.where = where;

  // 处理需要返回的字段
  (function() {
    if (!params.attrs) return;
    if (!_.isString(params.attrs)) return;
    var attrs = [];
    _.each(params.attrs.split(','), function(x) {
      if (!Model.rawAttributes[x]) return;
      attrs.push(x);
    });
    if (!attrs.length) return;
    ret.attributes = attrs;
  })();

  if (!isAll) _.extend(ret, pageParams(Model.pagination, params))

  return ret;
};

// 处理关联包含
// 返回
// [Model1, Model2]
// 或者 undefined
var modelInclude = function(params, includes) {
  if (!includes) return;
  if (!_.isString(params.includes)) return;
  var ret = _.filter(params.includes.split(','), function(x) {
    return includes[x];
  });
  if (ret.length === 0) return;
  return _.map(ret, function(x) { return _.clone(includes[x]); });
};

// 处理分页参数
// 返回 {
//   limit: xxx,
//   offset: xxx
// }
var pageParams = function(pagination, params) {
  if (pagination == null) {
    pagination = {
      maxResults: 10,
      maxStartIndex: 10000,
      maxResultsLimit: 1000
    };
  }
  var startIndex = Math.max((+params.startIndex || 0), 0);
  var maxResults = Math.max((+params.maxResults || +pagination.maxResults), 0);
  return {
    offset: Math.min(startIndex, pagination.maxStartIndex),
    limit: Math.min(maxResults, pagination.maxResultsLimit)
  };
};

// 处理排序参数
var sort = function(params, conf) {
  if (!conf) return;
  if (!(params.sort || conf.default)) return;
  var order = conf.default;
  var direction = conf.defaultDirection || 'ASC';

  if (!params.sort) return [[order, direction]];

  if (params.sort[0] === '-') {
    direction = 'DESC';
    order = params.sort.substring(1);
  } else {
    direction = 'ASC';
    order = params.sort;
  }

  // 如果请求的排序方式不允许，则返回null
  if (!conf.allow || !_.includes(conf.allow, order)) return;

  return [[order, direction]];
};

// findOptFilter 的处理
var findOptFilter = function(params, name, where, col) {
  var value;
  if (col == null) col = name;
  if (!params) return;
  if (!_.isObject(params)) return;
  // 处理 where 的等于
  if (_.isString(params[name])) {
    value = params[name].trim();
    // 特殊处理null值
    if (value === '.null.') value = null;
    if (!where[col]) where[col] = {};
    where[col].$eq = value;
  }
  if (_.isNumber(params[name])) {
    if (!where[col]) where[col] = {};
    where[col].$eq = params[name];
  }

  // 处理where in
  if (_.isString(params[name + 's'])) {
    if (!where[col]) where[col] = {};
    where[col].$in = params[name + 's'].trim().split(',');
  }

  // 处理where not in
  if (_.isString(params[name + 's!'])) {
    if (!where[col]) where[col] = {};
    where[col].$not = params[name + 's!'].trim().split(',');
  }

  // 处理不等于的判断
  if (_.isString(params[name + '!'])) {
    value = params[name + '!'].trim();
    // 特殊处理null值
    if (value === '.null.') value = null;
    if (!where[col]) where[col] = {};
    where[col].$ne = value;
  }

  // 处理like
  if (_.isString(params[name + '_like'])) {
    value = params[name + '_like'].trim().replace(/\*/g, '%');
    if (!where[col]) where[col] = {};
    where[col].$like = value;
  }

  // 处理notLike
  if (_.isString(params[name + '_notLike'])) {
    value = params[name + '_notLike'].trim().replace(/\*/g, '%');
    if (!where[col]) where[col] = {};
    where[col].$notLike = value;
  }
  // 处理大于，小于, 大于等于，小于等于的判断
  _.each(['gt', 'gte', 'lt', 'lte'], function(x) {
    var c = name + '_' + x;
    if (!_.isString(params[c]) && !_.isNumber(params[c])) return;
    value = _.isString(params[c]) ? params[c].trim() : params[c];
    if (!where[col]) where[col] = {};
    where[col]['$' + x] = value;
  });
};

// searchOpt 的处理，处理参数参数里的q, 实现简易搜索功能
/**
#
[ # 这下面有三个子数组，代表该model有三个字段参与搜索
  [ # 这个数组长度为2，代表此次有2个搜索关键词
    # 这个字符串用 OR 切开有三部分，代表该字段定义的search.match 有三部分
    '((`user`.`name` LIKE \'a\') OR (`user`.`name` LIKE \'%,a\') OR (`user`.`name` LIKE \'a,%\') OR (`user`.`name` LIKE \'%,a,%\'))'
    '((`user`.`name` LIKE \'b\') OR (`user`.`name` LIKE \'%,b\') OR (`user`.`name` LIKE \'b,%\') OR (`user`.`name` LIKE \'%,b,%\'))'
  ]
  [
    '((`user`.`email` LIKE \'%a%\'))'
    '((`user`.`email` LIKE \'%b%\'))'
  ]
  [
    '((`user`.`id` = \'a\'))'
    '((`user`.`id` = \'b\'))'
  ]
]
*/
var searchOpt = function(Model, searchStr, qstr, as) {
  if (!qstr) return;
  if (!_.isString(qstr)) return;
  var q = qstr.trim() ? _.split(qstr.trim(), ' ', 5) : null;
  var searchs = searchStr ? _.split(searchStr, ','): null;
  var $ors = [];
  if (!q) return;
  if (!Model.searchCols) return;
  _.each(Model.searchCols, function(conf, col) {
    // 如果设置了搜索的字段，并且当前字读不在设置的搜索字段内，则直接返回
    // 相当于跳过这个设置
    var _col = as ? as + '.' + col : col;
    // 如果是include里的search，必须指定searchs
    // 这么做是为了避免用户不知情的一些筛选过滤
    if ((!searchs) && as) return;
    if (searchs && searchs.length && !_.includes(searchs, _col)) return;
    $ors.push(_.map(q, function(x) {
      return '(' + _.map(conf.match, function(match) {
        var v = match.replace('{1}', x);
        return [
          '(`' + (as || Model.name) + '`.`' + col + '`',
          conf.op,
          mysql.escape(v) + ')'
        ].join(' ');
      }).join(' OR ') + ')';
    }));
  });
  return $ors;
};

// 合并多个词语的搜索条件
// 将单个或多个 searchOpt 返回的数组正确的合并成 where 子句, 字符串类型的
// 这个函数的目的是为了正确的使每个关键词之间的关系是 AND 的关系
// 单个关键词在不同的搜索字段之间是 OR 的关系
var mergeSearchOrs = function(orss) {
  var ands = [];
  _.each(orss, function(_orss) {
    _.each(_orss, function(ors) {
      _.each(ors, function(_or, index) {
        if (!ands[index]) ands[index] = [];
        ands[index].push(_or);
      });
    });
  });
  return '(' + _.map(ands, function(x) { return '(' + x.join(' OR ') + ')'; }).join(' AND ') + ')';
};

/**
 * 忽略list中的某些属性
 * 因为有些属性对于某些接口需要隐藏
 * 比如 medias/:media/campaigns 中项目的 mediaIds 就不能显示出来
 * 否则媒体就能知道该项目还投放了那些媒体
 */
var itemAttrFilter = function(allowAttrs) {
  return function(x) {
    var attr, i, len, ret;
    ret = {};
    for (i = 0, len = allowAttrs.length; i < len; i++) {
      attr = allowAttrs[i];
      ret[attr] = x[attr];
    }
    return ret;
  };
};

var listAttrFilter = function(ls, allowAttrs) {
  if (!allowAttrs) return ls;
  return _.map(ls, itemAttrFilter(allowAttrs));
};

/**
 * 把 callback 的写法，作用到 promise 上
 * promise.then(->callback(null)).catch(callback)
 * 目的是为了让callback的写法可以快速对接到 promise 上
 */
var callback = function(promise, callback) {
  return promise.then(function(result) {
    callback.call(null, null, result);
  }).catch(callback);
};

var pickParams = function(req, cols, Model) {
  var attr = {};

  // 当设置了只有管理员才可以修改的字段，并且当前用户不是管理员
  // 则去掉那些只有管理员才能修改的字段
  if (Model.onlyAdminCols && (req.isAdmin !== true)) {
    cols = _.filter(cols, function(x) {
      return !_.includes(Model.onlyAdminCols, x);
    });
  }

  _.each(cols, function(x) {
    var value, C;
    if (!req.params.hasOwnProperty(x)) return;
    if (!(C = Model.rawAttributes[x])) return;

    value = req.params[x];

    // 如果是数字类型的则数字化
    if (_.includes(NUMBER_TYPES, C.type.key)) {
      if (value != null) value = +value;
    }

    // 如果字段允许为空，且默认值为 null 则在等于空字符串的时候赋值为 null
    if ((value === '' || value === null || value === undefined) && C.hasOwnProperty('defaultValue')) {
      value = (C.allowNull === true) ? null : C.defaultValue;
    }

    attr[x] = value;
  });

  return attr;
};

module.exports = {
  pickParams: pickParams,
  sort: sort,
  pageParams: pageParams,
  modelInclude: modelInclude,
  findAllOpts: findAllOpts,
  searchOpt: searchOpt,
  mergeSearchOrs: mergeSearchOrs,
  itemAttrFilter: itemAttrFilter,
  listAttrFilter: listAttrFilter,
  findOptFilter: findOptFilter,
  callback: callback
};
