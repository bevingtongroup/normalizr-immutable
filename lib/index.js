// Based on Normalizr 2.0.1
'use strict';
// import { arrayOf, valuesOf, unionOf } from 'normalizr';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Schema = exports.normalize = exports.unionOf = exports.valuesOf = exports.arrayOf = exports.NormalizedRecord = undefined;

var _immutable = require('immutable');

var _RecordEntitySchema = require('./RecordEntitySchema');

var _RecordEntitySchema2 = _interopRequireDefault(_RecordEntitySchema);

var _IterableSchema = require('./IterableSchema');

var _IterableSchema2 = _interopRequireDefault(_IterableSchema);

var _UnionSchema = require('./UnionSchema');

var _UnionSchema2 = _interopRequireDefault(_UnionSchema);

var _isEqual = require('lodash/isEqual');

var _isEqual2 = _interopRequireDefault(_isEqual);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var NormalizedRecord = new _immutable.Record({ entities: null, result: null }, 'NormalizedRecord');
var PolymorphicMapper = new _immutable.Record({ id: null, schema: null });

function defaultAssignEntity(normalized, key, entity) {
  normalized[key] = entity;
}

function visitObject(obj, schema, bag, options) {
  var _options$assignEntity = options.assignEntity;
  var assignEntity = _options$assignEntity === undefined ? defaultAssignEntity : _options$assignEntity;

  var normalized = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var entity = visit(obj[key], schema[key], bag, options);
      assignEntity.call(null, normalized, key, entity, obj);
    }
  }
  return new _immutable.Map(normalized);
}

function visitRecord(obj, schema, bag, options) {
  var _options$assignEntity2 = options.assignEntity,
      assignEntity = _options$assignEntity2 === undefined ? defaultAssignEntity : _options$assignEntity2;


  var normalized = {};

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var entity = visit(obj[key], schema[key], bag, options);

      assignEntity.call(null, normalized, key, entity, obj);
    }
  }

  var Record = schema.getRecord();
  return new Record(normalized);
}

function defaultMapper(iterableSchema, itemSchema, bag, options) {
  return function (obj) {
    return visit(obj, itemSchema, bag, options);
  };
}

function polymorphicMapper(iterableSchema, itemSchema, bag, options) {
  return function (obj) {
    var schemaKey = iterableSchema.getSchemaKey(obj);
    var result = visit(obj, itemSchema[schemaKey], bag, options);
    return new PolymorphicMapper({ id: result, schema: schemaKey });
  };
}

function visitIterable(obj, iterableSchema, bag, options) {
  var itemSchema = iterableSchema.getItemSchema();
  var curriedItemMapper = defaultMapper(iterableSchema, itemSchema, bag, options);

  if (Array.isArray(obj)) {
    return new _immutable.List(obj.map(curriedItemMapper));
  } else {
    var mp = Object.keys(obj).reduce(function (objMap, key) {
      objMap[key] = curriedItemMapper(obj[key]);
      return objMap;
    }, {});
    return new _immutable.Map(mp);
  }
}

function visitUnion(obj, unionSchema, bag, options) {
  var itemSchema = unionSchema.getItemSchema();
  return polymorphicMapper(unionSchema, itemSchema, bag, options)(obj);
}

function defaultMergeIntoEntity(entityA, entityB, entityKey) {
  if (entityA === null) return entityB;

  if (!entityA.equals(entityB)) {

    console.info('When checking two ' + entityKey + ', found unequal data. Merging the data. You should consider making sure these objects are equal.', entityA, entityB);

    return entityA.merge(entityB);
  }

  return entityA;
}

function visitEntity(entity, entitySchema, bag, options) {
  // if(!(entitySchema instanceof RecordEntitySchema))
  //   throw new Error('Immutable Normalizr expects a Record object as part of the Schema')

  var _options$mergeIntoEntity = options.mergeIntoEntity;
  var mergeIntoEntity = _options$mergeIntoEntity === undefined ? defaultMergeIntoEntity : _options$mergeIntoEntity;

  var entityKey = entitySchema.getKey();
  var id = entitySchema.getId(entity);

  if (!bag.hasOwnProperty(entityKey)) {
    bag[entityKey] = {};
  }

  if (!bag[entityKey].hasOwnProperty(id)) {
    bag[entityKey][id] = null;
  }

  var stored = bag[entityKey][id];
  var normalized = visitRecord(entity, entitySchema, bag, options);
  bag[entityKey][id] = mergeIntoEntity(stored, normalized, entityKey);

  return id;
}

function visit(obj, schema, bag) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  if (!(0, _isObject2.default)(schema)) {
    return obj;
  }

  if (!(0, _isObject2.default)(obj) && schema._mappedBy) {
    obj = _defineProperty({}, schema.getIdAttribute(), obj);
  } else if (!(0, _isObject2.default)(obj)) {
    return obj;
  }

  if (schema instanceof _RecordEntitySchema2.default) {
    return visitEntity(obj, schema, bag, options);
  } else if (schema instanceof _IterableSchema2.default) {
    return visitIterable(obj, schema, bag, options);
  } else if (schema instanceof _UnionSchema2.default) {
    return visitUnion(obj, schema, bag, options);
  } else {
    //we want the root object to be processed as a record, all others, not managed by a record should become a Map
    return visitObject(obj, schema, bag, options);
  }
}

function arrayOf(schema, options) {
  return new _IterableSchema2.default(schema, options);
}

function valuesOf(schema, options) {
  return new _IterableSchema2.default(schema, options);
}

function unionOf(schema, options) {
  return new _UnionSchema2.default(schema, options);
}

/**
 * object: a javascript object
 * schema: a RecordEntitySchema
 * options: an object with the following optional keys
 *  useMapsForEntityObjects: boolean. If true, will use a Map in stead of a Record to store id-RecordObject pairs. This means that you have to access a specific entity object like so:
 *  `
 * useMapsForEntityObjects:false, this.props.articleReducer.entities.articles[5].label
 *    {
 *      entities:{//Record key
 *        articles:{//Record key
 *          5:{//Record
 *              label: 'article label'
 *          }
 *        }
 *      }
 *    }
 * useMapsForEntityObjects:true, this.props.articleReducer.entities.articles.get(5).label
 *  `
 *    {
 *      entities:{//Record key
 *        articles:{//Record key
 *          5:{//Map key
 *              label: 'article label'
 *          }
 *        }
 *      }
 *    }
 *  `
 * If you use proxies, the impact on your code will be minimal.
 * The disadvantage of using Records in stead of Maps for the entity objects is that when you try to merge new content into the Record, you will fail.
 */
function normalize(obj, schema) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    getState: undefined,
    useMapsForEntityObjects: false
  };


  if (!(0, _isObject2.default)(obj) && !Array.isArray(obj)) {
    throw new Error('Normalize accepts an object or an array as its input.');
  }

  if (!(0, _isObject2.default)(schema) || Array.isArray(schema)) {
    throw new Error('Normalize accepts an object for schema.');
  }

  var bag = {};
  var entityStructure = {};
  var keyStructure = {};
  var results = [];

  //This will either return a sequence, or an id
  var result = visit(obj, schema, bag, options);

  results = result;

  var entities = null;

  for (var schemaKey in bag) {
    keyStructure[schemaKey] = null;

    if (options.useMapsForEntityObjects) {
      entityStructure[schemaKey] = new _immutable.Map(bag[schemaKey]);
    } else {
      var ValueStructure = new _immutable.Record(bag[schemaKey]);
      entityStructure[schemaKey] = new ValueStructure({});
    }
  }

  var EntityStructure = new _immutable.Record(keyStructure);
  entities = new EntityStructure(entityStructure);

  return new NormalizedRecord({
    entities: entities,
    result: results
  });
}

exports.NormalizedRecord = NormalizedRecord;
exports.arrayOf = arrayOf;
exports.valuesOf = valuesOf;
exports.unionOf = unionOf;
exports.normalize = normalize;
exports.Schema = _RecordEntitySchema2.default;