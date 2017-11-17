'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _normalizr = require('normalizr');

var _immutable = require('immutable');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RecordEntitySchema = function (_Schema) {
  _inherits(RecordEntitySchema, _Schema);

  function RecordEntitySchema(key, record) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, RecordEntitySchema);

    var _this = _possibleConstructorReturn(this, (RecordEntitySchema.__proto__ || Object.getPrototypeOf(RecordEntitySchema)).call(this, key, options));

    if (!key || typeof key !== 'string') {
      throw new Error('A string non-empty key is required');
    }

    if (!record || typeof record !== 'function') throw new Error('A record is required');

    _this._key = key;
    _this._record = record;

    var idAttribute = options.idAttribute || 'id';
    _this._getId = typeof idAttribute === 'function' ? idAttribute : function (x) {
      return x[idAttribute];
    };
    _this._idAttribute = idAttribute;
    _this._reducerKey = options.reducerKey;
    return _this;
  }

  _createClass(RecordEntitySchema, [{
    key: 'getRecord',
    value: function getRecord() {
      return this._record;
    }
  }, {
    key: 'getReducerKey',
    value: function getReducerKey() {
      return this._reducerKey;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'EntitySchema, key: ' + this._key + ', idAttribute: ' + this._idAttribute + ', reducerKey: ' + this._reducerKey;
    }
  }]);

  return RecordEntitySchema;
}(_normalizr.Schema);

exports.default = RecordEntitySchema;