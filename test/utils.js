const assert = require('assert');
const _ = require('lodash');
const rest = require('open-rest');
const om = require('open-rest-with-mysql');
const utils = require('../lib/utils');

om(rest);
const Sequelize = rest.Sequelize;
const sequelize = new Sequelize();

describe('utils', () => {
  describe('#callback', () => {
    it('normal', (done) => {
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });
      utils.callback(promise, (error) => {
        assert.equal(null, error);
        done();
      });
    });
  });

  describe('#searchOpt', () => {
    const Model = {
      name: 'user',
      searchCols: {
        name: {
          op: 'LIKE',
          match: ['%{1}%'],
        },
        email: {
          op: 'LIKE',
          match: ['%{1}%'],
        },
        id: {
          op: '=',
          match: ['{1}'],
        },
      },
    };

    it('normal', (done) => {
      const except = [
        ["((`user`.`name` LIKE '%a%'))"],
        ["((`user`.`email` LIKE '%a%'))"],
        ["((`user`.`id` = 'a'))"],
      ];
      const real = utils.searchOpt(Model, '', 'a');
      assert.deepEqual(except, real);
      done();
    });

    it('mutil keyword', (done) => {
      const except = [
        [
          '((`user`.`name` LIKE \'%a%\'))',
          '((`user`.`name` LIKE \'%b%\'))',
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))',
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))',
        ],
      ];
      const real = utils.searchOpt(Model, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it('mutil match, single keyword', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['{1}', '%,{1}', '{1},%', '%,{1},%'],
          },
          email: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
          id: {
            op: '=',
            match: ['{1}'],
          },
        },
      };
      const except = [
        [
          [
            '((`user`.`name` LIKE \'a\')',
            '(`user`.`name` LIKE \'%,a\')',
            '(`user`.`name` LIKE \'a,%\')',
            '(`user`.`name` LIKE \'%,a,%\'))',
          ].join(' OR '),
          [
            '((`user`.`name` LIKE \'b\')',
            '(`user`.`name` LIKE \'%,b\')',
            '(`user`.`name` LIKE \'b,%\')',
            '(`user`.`name` LIKE \'%,b,%\'))',
          ].join(' OR '),
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))',
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))',
        ],
      ];

      const real = utils.searchOpt(Model1, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it('container single quote', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const except = [
        ["((`user`.`name` LIKE '%a\\'%'))"],
      ];
      const real = utils.searchOpt(Model1, '', "a'");
      assert.deepEqual(except, real);
      done();
    });

    it('qstr isnt string', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const real = utils.searchOpt(Model1, '', []);
      assert.equal(undefined, real);
      done();
    });

    it('qstr isnt space string', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const real = utils.searchOpt(Model1, '', '\t');
      assert.equal(undefined, real);
      done();
    });

    it('Model.searchCols unset', (done) => {
      const Model1 = {
        name: 'user',
      };
      const real = utils.searchOpt(Model1, '', 'a');
      assert.equal(undefined, real);
      done();
    });

    it('as set', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const real = utils.searchOpt(Model1, '', 'a', 'user');
      assert.deepEqual([], real);
      done();
    });

    it('as set searchStr set', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const real = utils.searchOpt(Model1, 'name,user.name', 'a', 'user');
      assert.deepEqual([["((`user`.`name` LIKE '%a%'))"]], real);
      done();
    });

    it('as set searchStr set no match', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const real = utils.searchOpt(Model1, 'email,address', 'a', 'user');
      assert.deepEqual([], real);
      done();
    });
  });

  describe('#mergeSearchOrs', () => {
    it('single searchOpt result', (done) => {
      const Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const except = "((((`user`.`name` LIKE '%a%'))))";
      const real = utils.mergeSearchOrs([utils.searchOpt(Model, '', 'a')]);
      assert.deepEqual(except, real);
      done();
    });

    it('single searchOpt, mutil keyword result', (done) => {
      const Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const except = "((((`user`.`name` LIKE '%a%'))) AND (((`user`.`name` LIKE '%b%'))))";
      const real = utils.mergeSearchOrs([utils.searchOpt(Model, '', 'a b')]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, single keyword result', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const except = "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%'))))";
      const real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', 'a'),
        utils.searchOpt(Model2, '', 'a'),
      ]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, mutil keyword result', (done) => {
      const Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%'],
          },
        },
      };
      const except = [
        "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%')))",
        "(((`user`.`name` LIKE '%b%')) OR ((`book`.`name` LIKE '%b%'))))",
      ].join(' AND ');
      const real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', 'a b'),
        utils.searchOpt(Model2, '', 'a b'),
      ]);
      assert.deepEqual(except, real);
      done();
    });
  });

  describe('#findOptFilter', () => {
    it('The 4th argument col unset', (done) => {
      const params = {
        name: 'hello',
        names: 'zhangsan,lisi,wangwu',
        'name!': 'zhaoliu',
        'names!': 'wangqi,houba',
        address_like: '北京*',
        address_notLike: '*昌平*',
        age_gte: 20,
        age_lte: '30',
      };
      const where = {};
      utils.findOptFilter(params, 'name', where);

      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu',
        },
      }, where);

      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu',
        },
        age: {
          $gte: 20,
          $lte: '30',
        },
      }, where);

      utils.findOptFilter(params, 'address', where);
      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu',
        },
        age: {
          $gte: 20,
          $lte: '30',
        },
        address: {
          $like: '北京%',
          $notLike: '%昌平%',
        },
      }, where);

      done();
    });

    it('col set', (done) => {
      const params = {
        name: '.null.',
        'email!': '.null.',
        age: 20,
        genders: 'male,female',
        'addresss!': '北七家,天通苑',
      };
      const where = {};
      utils.findOptFilter(params, 'name', where, 'personName');
      assert.deepEqual({
        personName: {
          $eq: null,
        },
      }, where);

      utils.findOptFilter(params, 'email', where, 'personEmail');
      assert.deepEqual({
        personName: {
          $eq: null,
        },
        personEmail: {
          $ne: null,
        },
      }, where);

      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        personName: {
          $eq: null,
        },
        personEmail: {
          $ne: null,
        },
        age: {
          $eq: 20,
        },
      }, where);

      utils.findOptFilter(params, 'gender', where);
      assert.deepEqual({
        personName: {
          $eq: null,
        },
        personEmail: {
          $ne: null,
        },
        age: {
          $eq: 20,
        },
        gender: {
          $in: ['male', 'female'],
        },
      }, where);

      utils.findOptFilter(params, 'address', where);
      assert.deepEqual({
        personName: {
          $eq: null,
        },
        personEmail: {
          $ne: null,
        },
        age: {
          $eq: 20,
        },
        gender: {
          $in: ['male', 'female'],
        },
        address: {
          $not: ['北七家', '天通苑'],
        },
      }, where);

      params.parent_like = '*@xiongfei.me';
      utils.findOptFilter(params, 'parent', where);
      assert.deepEqual({
        personName: {
          $eq: null,
        },
        personEmail: {
          $ne: null,
        },
        age: {
          $eq: 20,
        },
        gender: {
          $in: ['male', 'female'],
        },
        address: {
          $not: ['北七家', '天通苑'],
        },
        parent: {
          $like: '%@xiongfei.me',
        },
      }, where);

      params['parent!'] = 'haha@xiongfei.me';
      utils.findOptFilter(params, 'parent', where);
      assert.deepEqual({
        personName: {
          $eq: null,
        },
        personEmail: {
          $ne: null,
        },
        age: {
          $eq: 20,
        },
        gender: {
          $in: ['male', 'female'],
        },
        address: {
          $not: ['北七家', '天通苑'],
        },
        parent: {
          $like: '%@xiongfei.me',
          $ne: 'haha@xiongfei.me',
        },
      }, where);

      params.friend_notLike = '%@qq.com';
      utils.findOptFilter(params, 'friend', where);
      assert.deepEqual({
        personName: {
          $eq: null,
        },
        personEmail: {
          $ne: null,
        },
        age: {
          $eq: 20,
        },
        gender: {
          $in: ['male', 'female'],
        },
        address: {
          $not: ['北七家', '天通苑'],
        },
        parent: {
          $like: '%@xiongfei.me',
          $ne: 'haha@xiongfei.me',
        },
        friend: {
          $notLike: '%@qq.com',
        },
      }, where);

      done();
    });

    it('params unset', (done) => {
      assert.equal(undefined, utils.findOptFilter());

      done();
    });

    it('params no object', (done) => {
      assert.equal(undefined, utils.findOptFilter('hello world'));

      done();
    });

    it('$eq where[col] already exists', (done) => {
      const params = {
        name: 'zhaoxiongfei',
        age: 30,
      };
      const where = {
        name: {
          $ne: 'StonePHP',
        },
        age: {
          $gte: 20,
        },
      };
      utils.findOptFilter(params, 'name', where);
      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        name: {
          $ne: 'StonePHP',
          $eq: 'zhaoxiongfei',
        },
        age: {
          $gte: 20,
          $eq: 30,
        },
      }, where);

      done();
    });
  });

  describe('#sort', () => {
    it('conf unset', (done) => {
      const params = { sort: 'name' };
      assert.equal(undefined, utils.sort(params));
      assert.equal(undefined, utils.sort(params, ''));
      assert.equal(undefined, utils.sort(params, 0));

      done();
    });

    it('params.sort unset', (done) => {
      const params = {};
      const conf = {
        default: 'date',
        defaultDirection: 'DESC',
      };
      assert.deepEqual([['date', 'DESC']], utils.sort(params, conf));

      done();
    });
    it('params.sort unset and conf.default', (done) => {
      const params = {};
      const conf = {};
      assert.equal(undefined, utils.sort(params, conf));

      done();
    });

    it('params.sort set -id conf.allow unset', (done) => {
      const params = {
        sort: '-id',
      };
      const conf = {};
      assert.equal(undefined, utils.sort(params, conf));

      done();
    });

    it('params.sort set -id conf.allow set', (done) => {
      const params = {
        sort: '-id',
      };
      const conf = {
        allow: ['id'],
      };
      assert.deepEqual([['id', 'DESC']], utils.sort(params, conf));

      done();
    });

    it('params.sort set id, conf.allow set', (done) => {
      const params = {
        sort: 'id',
      };
      const conf = {
        allow: ['id'],
      };
      assert.deepEqual([['id', 'ASC']], utils.sort(params, conf));

      done();
    });
  });

  describe('#modelInclude', () => {
    it('include unset', (done) => {
      const params = {};
      assert.equal(undefined, utils.modelInclude(params));
      assert.equal(undefined, utils.modelInclude(params, undefined));
      assert.equal(undefined, utils.modelInclude(params, null));
      assert.equal(undefined, utils.modelInclude(params, ''));
      assert.equal(undefined, utils.modelInclude(params, 0));

      done();
    });

    it('params.includes unset or no string', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      assert.equal(undefined, utils.modelInclude({}, { user: { model: Model } }));
      assert.equal(undefined, utils.modelInclude({ includes: [] }, { user: { model: Model } }));
      assert.equal(undefined, utils.modelInclude({ includes: {} }, { user: { model: Model } }));
      assert.equal(undefined, utils.modelInclude({ includes: 20 }, { user: { model: Model } }));

      done();
    });

    it('params.includes set one', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      const includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };
      assert.deepEqual([includes.user], utils.modelInclude({ includes: 'user' }, includes));
      done();
    });

    it('params.includes set two', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      const includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true,
        },
        company: {
          model: Model,
          as: 'company',
          required: false,
        },
      };
      assert.deepEqual([includes.user, includes.company],
                       utils.modelInclude({ includes: 'user,company' }, includes));
      done();
    });

    it('params.includes no match', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      const includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true,
        },
        company: {
          model: Model,
          as: 'company',
          required: false,
        },
      };
      assert.equal(undefined, utils.modelInclude({ includes: 'author' }, includes));
      done();
    });
  });

  describe('#pageParams', () => {
    it('pagination unset, params unset', (done) => {
      assert.deepEqual({
        offset: 0,
        limit: 10,
      }, utils.pageParams(null, {}));

      done();
    });

    it('pagination unset, params set', (done) => {
      assert.deepEqual({
        offset: 100,
        limit: 20,
      }, utils.pageParams(null, { startIndex: 100, maxResults: 20 }));

      done();
    });

    it('pagination unset, params beyond limit', (done) => {
      assert.deepEqual({
        offset: 10000,
        limit: 1000,
      }, utils.pageParams(null, { startIndex: 100000000, maxResults: 2000000 }));

      done();
    });

    it('pagination set, params beyond limit', (done) => {
      const pagination = {
        maxResults: 100,
        maxStartIndex: 100000,
        maxResultsLimit: 10000,
      };
      assert.deepEqual({
        offset: 100000,
        limit: 10000,
      }, utils.pageParams(pagination, { startIndex: 100000000, maxResults: 2000000 }));

      done();
    });
  });

  describe('#itemAttrFilter', () => {
    it('noraml', (done) => {
      const fn = utils.itemAttrFilter(['name', 'age', 'gender']);
      const obj = {
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区',
      };

      assert.deepEqual({
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
      }, fn(obj));

      done();
    });
  });

  describe('#listAttrFilter', () => {
    it('normal', (done) => {
      const ls = [{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区',
      }];
      assert.deepEqual([{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
      }], utils.listAttrFilter(ls, ['name', 'age', 'gender']));

      done();
    });

    it('allowAttrs unset', (done) => {
      const ls = [{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区',
      }];
      assert.deepEqual([{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区',
      }], utils.listAttrFilter(ls));

      done();
    });
  });

  describe('#findOpts', () => {
    it('normal', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });
      let params = {
        showDelete: 'yes',
      };

      let opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: undefined,
        offset: 0,
        limit: 10,
      }, opts);

      params = {
        name: 'hi',
      };

      opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: undefined,
        where: {
          name: {
            $eq: 'hi',
          },
          isDelete: 'no',
        },
        offset: 0,
        limit: 10,
      }, opts);

      done();
    });

    it('includes', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt'],
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };

      const params = {
        includes: 'user',
        showDelete: 'yes',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      const opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: [Model.includes.user],
        order: [['id', 'DESC']],
        offset: 100,
        limit: 10,
      }, opts);

      done();
    });

    it('includes params.showDelete false', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt'],
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };

      const params = {
        includes: 'user',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      const opts = utils.findAllOpts(Model, params);
      const include = _.clone(Model.includes.user);
      include.where = {
        $or: [{
          isDelete: 'no',
        }],
      };
      assert.deepEqual({
        include: [include],
        order: [['id', 'DESC']],
        offset: 100,
        where: {
          isDelete: 'no',
        },
        limit: 10,
      }, opts);

      done();
    });

    it('includes include required false, allowIncludeCols', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt'],
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: false,
        },
      };

      Model.allowIncludeCols = ['id', 'name'];

      const params = {
        includes: 'user',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      const opts = utils.findAllOpts(Model, params);
      const include = _.clone(Model.includes.user);
      include.where = {
        $or: [{
          isDelete: 'no',
        }, {
          id: null,
        }],
      };
      include.attributes = ['id', 'name'];
      assert.deepEqual({
        include: [include],
        order: [['id', 'DESC']],
        offset: 100,
        where: {
          isDelete: 'no',
        },
        limit: 10,
      }, opts);

      done();
    });

    it('includes include required false, allowIncludeCols, search', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt'],
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: false,
        },
      };

      Model.searchCols = {
        name: {
          op: 'LIKE',
          match: ['%{1}%'],
        },
        email: {
          op: 'LIKE',
          match: ['%{1}%'],
        },
        id: {
          op: '=',
          match: ['{1}'],
        },
      };

      Model.allowIncludeCols = ['id', 'name'];

      const params = {
        q: 'a',
        attrs: 'id,name',
        includes: 'user',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      const opts = utils.findAllOpts(Model, params);
      const include = _.clone(Model.includes.user);
      include.where = {
        $or: [{
          isDelete: 'no',
        }, {
          id: null,
        }],
      };
      include.attributes = ['id', 'name'];
      assert.deepEqual({
        include: [include],
        order: [['id', 'DESC']],
        offset: 100,
        limit: 10,
        where: {
          isDelete: 'no',
          $or: [[
            [
              "((((`book`.`name` LIKE '%a%'))",
              "((`book`.`email` LIKE '%a%'))",
              "((`book`.`id` = 'a'))))",
            ].join(' OR '),
            [''],
          ]],
        },
        attributes: ['id', 'name'],
      }, opts);

      done();
    });

    it('attrs type isnt string', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt'],
      };
      let params = {
        attrs: [],
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      let opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: [['id', 'DESC']],
        offset: 100,
        limit: 10,
        where: {
          isDelete: 'no',
        },
      }, opts);

      params = {
        attrs: 'friends,age',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: [['id', 'DESC']],
        offset: 100,
        limit: 10,
        where: {
          isDelete: 'no',
        },
      }, opts);

      done();
    });

    it('isAll true', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt'],
      };
      const params = {
        attrs: [],
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      const opts = utils.findAllOpts(Model, params, true);
      assert.deepEqual({
        include: undefined,
        order: [['id', 'DESC']],
        where: {
          isDelete: 'no',
        },
      }, opts);

      done();
    });
  });

  describe('#pickParams', () => {
    it('onlyAdminCols, current isnt admin', (done) => {
      const req = {
        params: {
          name: 'Redstone Zhao',
          role: 'admin',
        },
        isAdmin: false,
      };

      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        role: {
          type: Sequelize.ENUM,
          values: ['member', 'admin'],
        },
      });

      Model.onlyAdminCols = ['role'];

      assert.deepEqual({
        name: 'Redstone Zhao',
      }, utils.pickParams(req, ['name', 'role'], Model));

      done();
    });

    it('onlyAdminCols, current isnt admin', (done) => {
      const req = {
        params: {
          name: 'Redstone Zhao',
          role: 'admin',
          status: 'enabled',
        },
        isAdmin: false,
      };

      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        role: {
          type: Sequelize.ENUM,
          values: ['member', 'admin'],
        },
      });

      Model.onlyAdminCols = ['role'];

      assert.deepEqual({
        name: 'Redstone Zhao',
      }, utils.pickParams(req, ['name', 'role', 'status', 'email'], Model));

      done();
    });

    it('column is number type, value isnt null', (done) => {
      const req = {
        params: {
          name: 'Redstone Zhao',
          role: 'admin',
          status: 'enabled',
          price: '999999',
        },
        isAdmin: false,
      };

      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        price: Sequelize.INTEGER.UNSIGNED,
        name: Sequelize.STRING,
        role: {
          type: Sequelize.ENUM,
          values: ['member', 'admin'],
        },
      });

      Model.onlyAdminCols = ['role'];

      assert.deepEqual({
        price: 999999,
      }, utils.pickParams(req, ['price'], Model));

      done();
    });

    it('column is number type, value is null, allowNull false', (done) => {
      const req = {
        params: {
          name: 'Redstone Zhao',
          role: 'admin',
          status: 'enabled',
          price: null,
        },
        isAdmin: true,
      };

      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        price: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 888888,
        },
        name: Sequelize.STRING,
        role: {
          type: Sequelize.ENUM,
          values: ['member', 'admin'],
        },
      });

      Model.onlyAdminCols = ['role'];

      assert.deepEqual({
        name: 'Redstone Zhao',
        role: 'admin',
        price: 888888,
      }, utils.pickParams(req, ['price', 'name', 'role'], Model));

      done();
    });

    it('column is number type, value is null, allowNull: true', (done) => {
      const req = {
        params: {
          name: 'Redstone Zhao',
          role: 'admin',
          status: 'enabled',
          price: null,
        },
        isAdmin: true,
      };

      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        price: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          defaultValue: 888888,
        },
        name: Sequelize.STRING,
        role: {
          type: Sequelize.ENUM,
          values: ['member', 'admin'],
        },
      });

      Model.onlyAdminCols = ['role'];

      assert.deepEqual({
        name: 'Redstone Zhao',
        role: 'admin',
        price: null,
      }, utils.pickParams(req, ['price', 'name', 'role'], Model));

      done();
    });

    it('column is number type, value is 0, allowNull: true', (done) => {
      const req = {
        params: {
          name: 'Redstone Zhao',
          role: 'admin',
          status: 'enabled',
          price: 0,
        },
        isAdmin: true,
      };

      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        price: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          defaultValue: 888888,
        },
        name: Sequelize.STRING,
        role: {
          type: Sequelize.ENUM,
          values: ['member', 'admin'],
        },
      });

      Model.onlyAdminCols = ['role'];

      assert.deepEqual({
        name: 'Redstone Zhao',
        role: 'admin',
        price: 0,
      }, utils.pickParams(req, ['price', 'name', 'role'], Model));

      done();
    });
  });
});
