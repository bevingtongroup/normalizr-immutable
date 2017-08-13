// Based on Normalizr 2.0.1
'use strict';
// import { arrayOf, valuesOf, unionOf } from 'normalizr';
import { Record, Map, List, Iterable } from 'immutable';

import RecordEntitySchema from './RecordEntitySchema';
import IterableSchema from './IterableSchema';
import UnionSchema from './UnionSchema';
import lodashIsEqual from 'lodash/isEqual';
import lodashIsObject from 'lodash/isObject';

const NormalizedRecord = new Record({entities:null, result: null}, 'NormalizedRecord');
const PolymorphicMapper = new Record({id:null, schema: null});

function defaultAssignEntity(normalized, key, entity) {
  normalized[key] = entity;
}

function visitObject(obj, schema, bag, options) {
  const _options$assignEntity = options.assignEntity;
  const assignEntity = _options$assignEntity === undefined ? defaultAssignEntity : _options$assignEntity;

  let normalized = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const entity = visit(obj[key], schema[key], bag, options);
      assignEntity.call(null, normalized, key, entity, obj);
    }
  }
  return new Map(normalized);
}

function visitRecord(obj, schema, bag, options){
  const { assignEntity = defaultAssignEntity } = options;

  let normalized = {};

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const entity = visit(obj[key], schema[key], bag, options);

      assignEntity.call(null, normalized, key, entity, obj);
    }
  }

  const Record = schema.getRecord();
  return new Record(normalized);
}

function defaultMapper(iterableSchema, itemSchema, bag, options) {
  return function (obj) {
    return visit(obj, itemSchema, bag, options);
  };
}

function polymorphicMapper(iterableSchema, itemSchema, bag, options) {
  return function (obj) {
    const schemaKey = iterableSchema.getSchemaKey(obj);
    const result = visit(obj, itemSchema[schemaKey], bag, options);
    return new PolymorphicMapper({ id: result, schema: schemaKey });
  };
}

function visitIterable(obj, iterableSchema, bag, options) {
  const itemSchema = iterableSchema.getItemSchema();
  const curriedItemMapper = defaultMapper(iterableSchema, itemSchema, bag, options);

  if (Array.isArray(obj)) {
    return new List(obj.map(curriedItemMapper));
  } else {
    const mp = Object.keys(obj).reduce(function (objMap, key) {
      objMap[key] = curriedItemMapper(obj[key]);
      return objMap;
    }, {});
    return new Map(mp);
  }
}

function visitUnion(obj, unionSchema, bag, options) {
  const itemSchema = unionSchema.getItemSchema();
  return polymorphicMapper(unionSchema, itemSchema, bag, options)(obj);
}

function defaultMergeIntoEntity(entityA, entityB, entityKey) {
  if(entityA === null)
    return entityB;

    if(!entityA.equals(entityB)){

      console.info(
        `When checking two ${entityKey}, found unequal data. Merging the data. You should consider making sure these objects are equal.`,
        entityA, entityB
      );

      return entityA.merge(entityB);
    }

  return entityA;
}

function visitEntity(entity, entitySchema, bag, options) {
  // if(!(entitySchema instanceof RecordEntitySchema))
  //   throw new Error('Immutable Normalizr expects a Record object as part of the Schema')

  const _options$mergeIntoEntity = options.mergeIntoEntity;
  const mergeIntoEntity = _options$mergeIntoEntity === undefined ? defaultMergeIntoEntity : _options$mergeIntoEntity;

  const entityKey = entitySchema.getKey();
  const id = entitySchema.getId(entity);

  if (!bag.hasOwnProperty(entityKey)) {
    bag[entityKey] = {};
  }

  if (!bag[entityKey].hasOwnProperty(id)) {
    bag[entityKey][id] = null;
  }

  let stored = bag[entityKey][id];
  let normalized = visitRecord(entity, entitySchema, bag, options);
  bag[entityKey][id] = mergeIntoEntity(stored, normalized, entityKey);

  return id;
}

function visit(obj, schema, bag, options = {}) {
  if (!lodashIsObject(schema)) {
    return obj;
  }

  if (!lodashIsObject(obj) && schema._mappedBy) {
    obj = {
      [schema.getIdAttribute()]: obj,
    };
  } else if (!lodashIsObject(obj)) {
    return obj;
  }

  if (schema instanceof RecordEntitySchema) {
    return visitEntity(obj, schema, bag, options);
  } else if (schema instanceof IterableSchema) {
    return visitIterable(obj, schema, bag, options);
  } else if (schema instanceof UnionSchema) {
    return visitUnion(obj, schema, bag, options);
  } else {
    //we want the root object to be processed as a record, all others, not managed by a record should become a Map
    return visitObject(obj, schema, bag, options);
  }
}

function arrayOf(schema, options) {
  return new IterableSchema(schema, options);
}

function valuesOf(schema, options) {
  return new IterableSchema(schema, options);
}

function unionOf(schema, options) {
  return new UnionSchema(schema, options);
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
function normalize(obj, schema, options = {
  getState: undefined,
  useMapsForEntityObjects: false,
}) {

  if (!lodashIsObject(obj) && !Array.isArray(obj)) {
    throw new Error('Normalize accepts an object or an array as its input.');
  }

  if (!lodashIsObject(schema) || Array.isArray(schema)) {
    throw new Error('Normalize accepts an object for schema.');
  }

  let bag = {};
  let entityStructure = {};
  let keyStructure = {};
  let results = [];

  //This will either return a sequence, or an id
  let result = visit(obj, schema, bag, options);

  results = result;

  let entities = null;

  for(let schemaKey in bag){
    keyStructure[schemaKey] = null;

    if(options.useMapsForEntityObjects){
      entityStructure[schemaKey] = new Map(bag[schemaKey]);
    }else{
      const ValueStructure = new Record(bag[schemaKey]);
      entityStructure[schemaKey] = new ValueStructure({});
    }

  }

  const EntityStructure = new Record(keyStructure);
  entities = new EntityStructure(entityStructure);

  return new NormalizedRecord({
    entities: entities,
    result: results
  });
}

export {
  NormalizedRecord,
  arrayOf,
  valuesOf,
  unionOf,
  normalize,
  RecordEntitySchema as Schema
};
