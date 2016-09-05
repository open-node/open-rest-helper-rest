var assert      = require('assert')
  , _           = require('lodash')
  , rest        = require('open-rest')
  , Sequelize   = rest.Sequelize
  , utils       = require('../lib/utils')
  , sequelize   = new Sequelize();

describe('utils', function() {

  describe('#callback', function() {
    it("normal", function(done) {
      var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve();
        }, 100);
      });
      utils.callback(promise, function(error) {
        assert.equal(null, error);
        done();
      });
    });
  });

  describe('#searchOpt', function() {
    var Model = {
      name: 'user',
      searchCols: {
        name: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        email: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        id: {
          op: '=',
          match: ['{1}']
        }
      }
    };

    it("normal", function(done) {
      var except = [
        ["((`user`.`name` LIKE '%a%'))"],
        ["((`user`.`email` LIKE '%a%'))"],
        ["((`user`.`id` = 'a'))"]
      ];
      var real = utils.searchOpt(Model, '', 'a');
      assert.deepEqual(except, real);
      done();
    });

    it("mutil keyword", function(done) {
      var except = [
        [
          '((`user`.`name` LIKE \'%a%\'))',
          '((`user`.`name` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))'
        ]
      ];
      var real = utils.searchOpt(Model, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it("mutil match, single keyword", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['{1}', '%,{1}', '{1},%', '%,{1},%']
          },
          email: {
            op: 'LIKE',
            match: ['%{1}%']
          },
          id: {
            op: '=',
            match: ['{1}']
          }
        }
      };
      var except = [
        [
          '((`user`.`name` LIKE \'a\') OR (`user`.`name` LIKE \'%,a\') OR (`user`.`name` LIKE \'a,%\') OR (`user`.`name` LIKE \'%,a,%\'))',
          '((`user`.`name` LIKE \'b\') OR (`user`.`name` LIKE \'%,b\') OR (`user`.`name` LIKE \'b,%\') OR (`user`.`name` LIKE \'%,b,%\'))'
        ],
        [
          '((`user`.`email` LIKE \'%a%\'))',
          '((`user`.`email` LIKE \'%b%\'))'
        ],
        [
          '((`user`.`id` = \'a\'))',
          '((`user`.`id` = \'b\'))'
        ]
      ];

      var real = utils.searchOpt(Model, '', 'a b');
      assert.deepEqual(except, real);
      done();
    });

    it("container single quote", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = [
        ["((`user`.`name` LIKE '%a\\\'%'))"]
      ];
      var real = utils.searchOpt(Model, '', "a'");
      assert.deepEqual(except, real);
      done();
    });

    it("qstr isnt string", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var real = utils.searchOpt(Model, '', []);
      assert.equal(undefined, real);
      done();
    });

    it("qstr isnt space string", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var real = utils.searchOpt(Model, '', '\t');
      assert.equal(undefined, real);
      done();
    });

    it("Model.searchCols unset", function(done) {
      var Model = {
        name: 'user',
      };
      var real = utils.searchOpt(Model, '', 'a');
      assert.equal(undefined, real);
      done();
    });

    it("as set", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var real = utils.searchOpt(Model, '', 'a', 'user');
      assert.deepEqual([], real);
      done();
    });

    it("as set searchStr set", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var real = utils.searchOpt(Model, 'name,user.name', 'a', 'user');
      assert.deepEqual([["((`user`.`name` LIKE '%a%'))"]], real);
      done();
    });

    it("as set searchStr set no match", function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var real = utils.searchOpt(Model, 'email,address', 'a', 'user');
      assert.deepEqual([], real);
      done();
    });
  });

  describe('#mergeSearchOrs', function() {
    it('single searchOpt result', function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%'))))";
      var real = utils.mergeSearchOrs([utils.searchOpt(Model, '', "a")]);
      assert.deepEqual(except, real);
      done();
    });

    it('single searchOpt, mutil keyword result', function(done) {
      var Model = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%'))) AND (((`user`.`name` LIKE '%b%'))))";
      var real = utils.mergeSearchOrs([utils.searchOpt(Model, '', "a b")]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, single keyword result', function(done) {
      var Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%'))))";
      var real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', "a"),
        utils.searchOpt(Model2, '', "a")
      ]);
      assert.deepEqual(except, real);
      done();
    });

    it('mutil searchOpt, mutil keyword result', function(done) {
      var Model1 = {
        name: 'user',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var Model2 = {
        name: 'book',
        searchCols: {
          name: {
            op: 'LIKE',
            match: ['%{1}%']
          }
        }
      };
      var except = "((((`user`.`name` LIKE '%a%')) OR ((`book`.`name` LIKE '%a%'))) AND (((`user`.`name` LIKE '%b%')) OR ((`book`.`name` LIKE '%b%'))))";
      var real = utils.mergeSearchOrs([
        utils.searchOpt(Model1, '', "a b"),
        utils.searchOpt(Model2, '', "a b")
      ]);
      assert.deepEqual(except, real);
      done();
    });
  });

  describe('#findOptFilter', function() {
    it("The 4th argument col unset", function(done) {
      var params, where = {};
      params = {
        name: 'hello',
        names: 'zhangsan,lisi,wangwu',
        'name!': 'zhaoliu',
        'names!': 'wangqi,houba',
        address_like: '北京*',
        address_notLike: '*昌平*',
        age_gte: 20,
        age_lte: '30'
      };
      utils.findOptFilter(params, 'name', where);

      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu'
        }
      }, where);

      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu'
        },
        age: {
          $gte: 20,
          $lte: '30'
        }
      }, where);

      utils.findOptFilter(params, 'address', where);
      assert.deepEqual({
        name: {
          $eq: 'hello',
          $in: ['zhangsan', 'lisi', 'wangwu'],
          $not: ['wangqi', 'houba'],
          $ne: 'zhaoliu'
        },
        age: {
          $gte: 20,
          $lte: '30'
        },
        address: {
          $like: '北京%',
          $notLike: '%昌平%'
        }
      }, where);

      done();
    });

    it("col set", function(done) {
      var params = {
        name: '.null.',
        'email!': '.null.',
        age: 20,
        genders: 'male,female',
        'addresss!': '北七家,天通苑'
      };
      var where = {};
      utils.findOptFilter(params, 'name', where, 'personName');
      assert.deepEqual({
        personName: {
          $eq: null
        }
      }, where);

      utils.findOptFilter(params, 'email', where, 'personEmail');
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        }
      }, where);

      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        }
      }, where);

      utils.findOptFilter(params, 'gender', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        }
      }, where);

      utils.findOptFilter(params, 'address', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        }
      }, where);

      params.parent_like = '*@xiongfei.me';
      utils.findOptFilter(params, 'parent', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        },
        parent: {
          $like: '%@xiongfei.me'
        }
      }, where);

      params['parent!'] = 'haha@xiongfei.me';
      utils.findOptFilter(params, 'parent', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        },
        parent: {
          $like: '%@xiongfei.me',
          $ne: 'haha@xiongfei.me'
        }
      }, where);

      params.friend_notLike = '%@qq.com';
      utils.findOptFilter(params, 'friend', where);
      assert.deepEqual({
        personName: {
          $eq: null
        },
        personEmail: {
          $ne: null
        },
        age: {
          $eq: 20
        },
        gender: {
          $in: ['male', 'female']
        },
        address: {
          $not: ['北七家', '天通苑']
        },
        parent: {
          $like: '%@xiongfei.me',
          $ne: 'haha@xiongfei.me'
        },
        friend: {
          $notLike: '%@qq.com'
        }
      }, where);

      done();
    });

    it("params unset", function(done) {
      assert.equal(undefined, utils.findOptFilter());

      done();
    });

    it("params no object", function(done) {
      assert.equal(undefined, utils.findOptFilter('hello world'));

      done();
    });

    it("$eq where[col] already exists", function(done) {
      var params = {
        name: 'zhaoxiongfei',
        age: 30
      };
      var where = {
        name: {
          $ne: 'StonePHP'
        },
        age: {
          $gte: 20
        }
      };
      utils.findOptFilter(params, 'name', where);
      utils.findOptFilter(params, 'age', where);
      assert.deepEqual({
        name: {
          $ne: 'StonePHP',
          $eq: 'zhaoxiongfei'
        },
        age: {
          $gte: 20,
          $eq: 30
        }
      }, where);

      done();
    });

  });

  describe('#sort', function() {
    it("conf unset", function(done) {
      var params = {sort: 'name'};
      assert.equal(undefined, utils.sort(params));
      assert.equal(undefined, utils.sort(params, ''));
      assert.equal(undefined, utils.sort(params, 0));

      done();
    });

    it("params.sort unset", function(done) {
      var params = {};
      var conf = {
        default: 'date',
        defaultDirection: 'DESC'
      };
      assert.deepEqual([['date', 'DESC']], utils.sort(params, conf));

      done();
    });
    it("params.sort unset and conf.default", function(done) {
      var params = {};
      var conf = {};
      assert.equal(undefined, utils.sort(params, conf));

      done();
    });

    it("params.sort set -id conf.allow unset", function(done) {
      var params = {
        sort: '-id'
      };
      var conf = {};
      assert.equal(undefined, utils.sort(params, conf));

      done();
    });

    it("params.sort set -id conf.allow set", function(done) {
      var params = {
        sort: '-id'
      };
      var conf = {
        allow: ['id']
      };
      assert.deepEqual([['id', 'DESC']], utils.sort(params, conf));

      done();
    });

    it("params.sort set id, conf.allow set", function(done) {
      var params = {
        sort: 'id'
      };
      var conf = {
        allow: ['id']
      };
      assert.deepEqual([['id', 'ASC']], utils.sort(params, conf));

      done();
    });
  });

  describe('#modelInclude', function() {
    it("include unset", function(done) {
      var params = {};
      assert.equal(undefined, utils.modelInclude(params));
      assert.equal(undefined, utils.modelInclude(params, undefined));
      assert.equal(undefined, utils.modelInclude(params, null));
      assert.equal(undefined, utils.modelInclude(params, ''));
      assert.equal(undefined, utils.modelInclude(params, 0));

      done();
    });

    it("params.includes unset or no string", function(done) {
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      assert.equal(undefined, utils.modelInclude({}, {user: {model: Model}}));
      assert.equal(undefined, utils.modelInclude({includes: []}, {user: {model: Model}}));
      assert.equal(undefined, utils.modelInclude({includes: {}}, {user: {model: Model}}));
      assert.equal(undefined, utils.modelInclude({includes: 20}, {user: {model: Model}}));

      done();
    });

    it("params.includes set one", function(done) {
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      var includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true
        }
      };
      assert.deepEqual([includes.user], utils.modelInclude({includes: 'user'}, includes));
      done();
    });

    it("params.includes set two", function(done) {
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      var includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true
        },
        company: {
          model: Model,
          as: 'company',
          required: false
        }
      };
      assert.deepEqual([includes.user, includes.company], utils.modelInclude({includes: 'user,company'}, includes));
      done();
    });

    it("params.includes no match", function(done) {
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100)
      });
      var includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true
        },
        company: {
          model: Model,
          as: 'company',
          required: false
        }
      };
      assert.equal(undefined, utils.modelInclude({includes: 'author'}, includes));
      done();
    });
  });

  describe('#pageParams', function() {
    it("pagination unset, params unset", function(done) {
      assert.deepEqual({
        offset: 0,
        limit: 10
      }, utils.pageParams(null, {}));

      done();
    });

    it("pagination unset, params set", function(done) {
      assert.deepEqual({
        offset: 100,
        limit: 20
      }, utils.pageParams(null, {startIndex: 100, maxResults: 20}));

      done();
    });

    it("pagination unset, params beyond limit", function(done) {
      assert.deepEqual({
        offset: 10000,
        limit: 1000
      }, utils.pageParams(null, {startIndex: 100000000, maxResults: 2000000}));

      done();
    });

    it("pagination set, params beyond limit", function(done) {
      var pagination = {
        maxResults: 100,
        maxStartIndex: 100000,
        maxResultsLimit: 10000,
      };
      assert.deepEqual({
        offset: 100000,
        limit: 10000
      }, utils.pageParams(pagination, {startIndex: 100000000, maxResults: 2000000}));

      done();
    });
  });

  describe('#itemAttrFilter', function() {
    it("noraml", function(done) {
      var fn = utils.itemAttrFilter(['name', 'age', 'gender']);
      var obj = {
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区'
      };

      assert.deepEqual({
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male'
      }, fn(obj));

      done();
    });
  });

  describe('#listAttrFilter', function() {
    it('normal', function(done) {
      var ls = [{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区'
      }];
      assert.deepEqual([{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male'
      }], utils.listAttrFilter(ls, ['name', 'age', 'gender']));

      done();
    });

    it('allowAttrs unset', function(done) {
      var ls = [{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区'
      }];
      assert.deepEqual([{
        name: 'Redstone Zhao',
        age: 36,
        gender: 'male',
        email: '13740080@qq.com',
        address: '北京市昌平区'
      }], utils.listAttrFilter(ls));

      done();
    });
  });

  describe('#findOpts', function() {
    it("normal", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      var params = {
        showDelete: 'yes'
      };

      var opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: undefined,
        offset: 0,
        limit: 10
      }, opts);

      params = {
        name: 'hi'
      };

      opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: undefined,
        where: {
          name: {
            $eq: 'hi'
          },
          isDelete: 'no'
        },
        offset: 0,
        limit: 10
      }, opts);

      done();
    });

    it("includes", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt']
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true
        }
      };

      var params = {
        includes: 'user',
        showDelete: 'yes',
        startIndex: 100,
        maxResults: 10,
        sort: '-id'
      };

      var opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: [Model.includes.user],
        order: [['id', 'DESC']],
        offset: 100,
        limit: 10
      }, opts);

      done();
    });

    it("includes params.showDelete false", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt']
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: true
        }
      };

      var params = {
        includes: 'user',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      var opts = utils.findAllOpts(Model, params);
      var include = _.clone(Model.includes.user);
      include.where = {
        $or: [{
          isDelete: 'no'
        }]
      };
      assert.deepEqual({
        include: [include],
        order: [['id', 'DESC']],
        offset: 100,
        where: {
          isDelete: 'no'
        },
        limit: 10
      }, opts);

      done();
    });

    it("includes include required false, allowIncludeCols", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt']
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: false
        }
      };

      Model.allowIncludeCols = ['id', 'name'];

      var params = {
        includes: 'user',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      var opts = utils.findAllOpts(Model, params);
      var include = _.clone(Model.includes.user);
      include.where = {
        $or: [{
          isDelete: 'no'
        }, {
          id: null
        }]
      };
      include.attributes = ['id', 'name'];
      assert.deepEqual({
        include: [include],
        order: [['id', 'DESC']],
        offset: 100,
        where: {
          isDelete: 'no'
        },
        limit: 10
      }, opts);

      done();
    });

    it("includes include required false, allowIncludeCols, search", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        email: Sequelize.STRING,
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt']
      };
      Model.includes = {
        user: {
          model: Model,
          as: 'creator',
          required: false
        }
      };

      Model.searchCols = {
        name: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        email: {
          op: 'LIKE',
          match: ['%{1}%']
        },
        id: {
          op: '=',
          match: ['{1}']
        }
      };

      Model.allowIncludeCols = ['id', 'name'];

      var params = {
        q: 'a',
        attrs: 'id,name',
        includes: 'user',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      var opts = utils.findAllOpts(Model, params);
      var include = _.clone(Model.includes.user);
      include.where = {
        $or: [{
          isDelete: 'no'
        }, {
          id: null
        }]
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
            "((((`book`.`name` LIKE '%a%')) OR ((`book`.`email` LIKE '%a%')) OR ((`book`.`id` = 'a'))))",
            ['']
          ]]
        },
        attributes: ['id', 'name']
      }, opts);

      done();
    });

    it("attrs type isnt string", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        email: Sequelize.STRING,
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt']
      };
      var params = {
        attrs: [],
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      var opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: [['id', 'DESC']],
        offset: 100,
        limit: 10,
        where: {
          isDelete: 'no'
        }
      }, opts);

      params = {
        attrs: 'friends,age',
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      var opts = utils.findAllOpts(Model, params);
      assert.deepEqual({
        include: undefined,
        order: [['id', 'DESC']],
        offset: 100,
        limit: 10,
        where: {
          isDelete: 'no'
        }
      }, opts);

      done();
    });

    it("isAll true", function(done) {
      var sequelize = new Sequelize();
      var Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING(100),
        email: Sequelize.STRING,
        isDelete: Sequelize.ENUM('yes', 'no')
      });
      Model.sort = {
        default: 'id',
        allow: ['id', 'orderNum', 'name', 'mediaId', '', 'updatedAt']
      };
      var params = {
        attrs: [],
        startIndex: 100,
        maxResults: 10,
        sort: '-id',
      };

      var opts = utils.findAllOpts(Model, params, true);
      assert.deepEqual({
        include: undefined,
        order: [['id', 'DESC']],
        where: {
          isDelete: 'no'
        }
      }, opts);

      done();
    });
  });

});
