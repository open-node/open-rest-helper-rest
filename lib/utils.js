const _ = require('lodash');
const mysql = require('mysql');

const NUMBER_TYPES = ['INTEGER', 'FLOAT'];

// 处理关联包含
// 返回
// [Model1, Model2]
// 或者 undefined
const modelInclude = (params, includes) => {
  if (!includes) return undefined;
  if (!_.isString(params.includes)) return undefined;
  const ret = _.filter(params.includes.split(','), (x) => includes[x]);
  if (ret.length === 0) return undefined;
  // 这里之所以要用 _.clone 是为了防止修改了原始了配置信息，从而导致不同请求之间的干扰
  return _.map(ret, (x) => _.clone(includes[x]));
};

// 处理分页参数
// 返回 {
//   limit: xxx,
//   offset: xxx
// }
const defaultPageParams = {
  maxResults: 10,
  maxStartIndex: 10000,
  maxResultsLimit: 1000,
};

const pageParams = (pagination, params) => {
  const _pagination = pagination || defaultPageParams;
  const startIndex = Math.max((+params.startIndex || 0), 0);
  const maxResults = Math.max((+params.maxResults || +_pagination.maxResults), 0);
  return {
    offset: Math.min(startIndex, _pagination.maxStartIndex),
    limit: Math.min(maxResults, _pagination.maxResultsLimit),
  };
};

// 处理排序参数
const sort = (params, conf) => {
  const value = params.sort;
  if (!conf) return undefined;
  if (!(value || conf.default)) return undefined;

  if (!value) return [[conf.default, conf.defaultDirection || 'ASC']];
  const isDesc = value[0] === '-';

  const direction = isDesc ? 'DESC' : 'ASC';
  const order = isDesc ? value.substring(1) : value;

  // 如果请求的排序方式不允许，则返回null
  if (!conf.allow || !_.includes(conf.allow, order)) return undefined;

  return [[order, direction]];
};

// findOptFilter 的处理
const findOptFilter = (params, name, where, col = name) => {
  let value;
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
  if (_.isString(params[`${name}s`])) {
    if (!where[col]) where[col] = {};
    where[col].$in = params[`${name}s`].trim().split(',');
  }

  // 处理where not in
  if (_.isString(params[`${name}s!`])) {
    if (!where[col]) where[col] = {};
    where[col].$not = params[`${name}s!`].trim().split(',');
  }

  // 处理不等于的判断
  if (_.isString(params[`${name}!`])) {
    value = params[`${name}!`].trim();
    // 特殊处理null值
    if (value === '.null.') value = null;
    if (!where[col]) where[col] = {};
    where[col].$ne = value;
  }

  // 处理like
  if (_.isString(params[`${name}_like`])) {
    value = params[`${name}_like`].trim().replace(/\*/g, '%');
    if (!where[col]) where[col] = {};
    where[col].$like = value;
  }

  // 处理notLike
  if (_.isString(params[`${name}_notLike`])) {
    value = params[`${name}_notLike`].trim().replace(/\*/g, '%');
    if (!where[col]) where[col] = {};
    where[col].$notLike = value;
  }
  // 处理大于，小于, 大于等于，小于等于的判断
  _.each(['gt', 'gte', 'lt', 'lte'], (x) => {
    const c = `${name}_${x}`;
    if (!_.isString(params[c]) && !_.isNumber(params[c])) return;
    value = _.isString(params[c]) ? params[c].trim() : params[c];
    if (!where[col]) where[col] = {};
    where[col][`$${x}`] = value;
  });
};

// searchOpt 的处理，处理参数参数里的q, 实现简易搜索功能
/**
#
[ # 这下面有三个子数组，代表该model有三个字段参与搜索
  [ # 这个数组长度为2，代表此次有2个搜索关键词
    # 这个字符串用 OR 切开有三部分，代表该字段定义的search.match 有三部分
    '((`user`.`name` LIKE \'a\')
      OR (`user`.`name` LIKE \'%,a\')
      OR (`user`.`name` LIKE \'a,%\')
      OR (`user`.`name` LIKE \'%,a,%\'))'
    '((`user`.`name` LIKE \'b\')
      OR (`user`.`name` LIKE \'%,b\')
      OR (`user`.`name` LIKE \'b,%\')
      OR (`user`.`name` LIKE \'%,b,%\'))'
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
const searchOpt = (Model, searchStr, qstr, as) => {
  if (!qstr) return undefined;
  if (!_.isString(qstr)) return undefined;
  const q = qstr.trim() ? _.split(qstr.trim(), ' ', 5) : null;
  if (!q) return undefined;
  const searchs = searchStr ? _.split(searchStr, ',') : null;
  const $ors = [];
  if (!Model.searchCols) return undefined;
  _.each(Model.searchCols, (conf, col) => {
    // 如果设置了搜索的字段，并且当前字读不在设置的搜索字段内，则直接返回
    // 相当于跳过这个设置
    const _col = as ? `${as}.${col}` : col;
    // 如果是include里的search，必须指定searchs
    // 这么做是为了避免用户不知情的一些筛选过滤
    if ((!searchs) && as) return;
    if (searchs && searchs.length && !_.includes(searchs, _col)) return;
    $ors.push(_.map(q, (x) => {
      const arr = _.map(conf.match, (match) => {
        const v = match.replace('{1}', x);
        return [
          `(\`${as || Model.name}\`.\`${col}\``,
          conf.op,
          `${mysql.escape(v)})`,
        ].join(' ');
      });
      return `(${arr.join(' OR ')})`;
    }));
  });
  return $ors;
};

// 合并多个词语的搜索条件
// 将单个或多个 searchOpt 返回的数组正确的合并成 where 子句, 字符串类型的
// 这个函数的目的是为了正确的使每个关键词之间的关系是 AND 的关系
// 单个关键词在不同的搜索字段之间是 OR 的关系
const mergeSearchOrs = (orss) => {
  const ands = [];
  _.each(orss, (_orss) => {
    _.each(_orss, (ors) => {
      _.each(ors, (_or, index) => {
        if (!ands[index]) ands[index] = [];
        ands[index].push(_or);
      });
    });
  });
  const andsStr = _.map(ands, (x) => `(${x.join(' OR ')})`);
  return `(${andsStr.join(' AND ')})`;
};


// 返回列表查询的条件
const findAllOpts = (Model, params, isAll) => {
  const where = {};
  const searchOrs = [];
  const includes = modelInclude(params, Model.includes);
  _.each(Model.filterAttrs || _.keys(Model.rawAttributes), (name) => {
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
    _.each(includes, (x) => {
      const includeWhere = {};
      const filterAttrs = x.model.filterAttrs || _.keys(x.model.rawAttributes);
      _.each(filterAttrs, (name) => {
        findOptFilter(params[x.as], name, includeWhere, name);
      });
      if (x.model.rawAttributes.isDelete && !params.showDelete) {
        includeWhere.$or = [{ isDelete: 'no' }];
        if (x.required === false) includeWhere.$or.push({ id: null });
      }

      // 将搜索条件添加到 include 的 where 条件上
      searchOrs.push(searchOpt(x.model, params._searchs, params.q, x.as));

      if (_.size(includeWhere)) x.where = includeWhere;

      // 以及关联资源允许返回的字段
      if (x.model.allowIncludeCols) x.attributes = x.model.allowIncludeCols;
    });
  }

  // 将 searchOrs 赋到 where 上
  const _searchOrs = _.filter(_.compact(searchOrs), (x) => x.length);
  if (_searchOrs.length) where.$or = [[mergeSearchOrs(_searchOrs), ['']]];

  const ret = {
    include: includes,
    order: sort(params, Model.sort),
  };

  if (_.size(where)) ret.where = where;

  // 处理需要返回的字段
  (() => {
    if (!params.attrs) return;
    if (!_.isString(params.attrs)) return;
    const attrs = [];
    _.each(params.attrs.split(','), (x) => {
      if (!Model.rawAttributes[x]) return;
      attrs.push(x);
    });
    if (!attrs.length) return;
    ret.attributes = attrs;
  })();

  if (!isAll) _.extend(ret, pageParams(Model.pagination, params));

  return ret;
};

/**
 * 忽略list中的某些属性
 * 因为有些属性对于某些接口需要隐藏
 * 比如 medias/:media/campaigns 中项目的 mediaIds 就不能显示出来
 * 否则媒体就能知道该项目还投放了那些媒体
 */
const itemAttrFilter = (allowAttrs) => ((x) => {
  const ret = {};
  for (const attr of allowAttrs) {
    ret[attr] = x[attr];
  }
  return ret;
});

const listAttrFilter = (ls, allowAttrs) => {
  if (!allowAttrs) return ls;
  return _.map(ls, itemAttrFilter(allowAttrs));
};

/**
 * 把 callback 的写法，作用到 promise 上
 * promise.then(->callback(null)).catch(callback)
 * 目的是为了让callback的写法可以快速对接到 promise 上
 */
const callback = (promise, cb) => (
  promise.then((result) => {
    cb.call(null, null, result);
  }).catch(callback)
);

const pickParams = (req, cols, Model) => {
  const attr = {};
  const params = req.params;
  const rawAttributes = Model.rawAttributes;
  const isAdmin = req.isAdmin;
  const onlyAdminCols = Model.onlyAdminCols;

  _.each(cols, (x) => {
    if (!_.has(params, x)) return;
    if (!_.has(rawAttributes, x)) return;
    const C = rawAttributes[x];

    // 当设置了只有管理员才可以修改的字段，并且当前用户不是管理员
    // 则去掉那些只有管理员才能修改的字段
    if (onlyAdminCols && isAdmin !== true && _.includes(onlyAdminCols, x)) return;

    let value = params[x];

    // 如果是数字类型的则数字化
    if (_.includes(NUMBER_TYPES, C.type.key)) {
      if (value != null) value = +value;
    }

    // 如果字段允许为空，且默认值为 null 则在等于空字符串的时候赋值为 null
    if ((value === '' || value === null || value === undefined) && _.has(C, 'defaultValue')) {
      value = (C.allowNull === true) ? null : C.defaultValue;
    }

    attr[x] = value;
  });

  return attr;
};

module.exports = {
  sort,
  callback,
  searchOpt,
  pickParams,
  pageParams,
  findAllOpts,
  modelInclude,
  findOptFilter,
  mergeSearchOrs,
  itemAttrFilter,
  listAttrFilter,
};
