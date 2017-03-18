'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _keyCode = require('../../../next-util/lib/key-code.js');

var _keyCode2 = _interopRequireDefault(_keyCode);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lastKey = void 0,
    getCode = function getCode(keycode) {
	var code;
	for (var key in _keyCode2.default) {
		if (_keyCode2.default[key] == keycode) {
			code = key;
			break;
		}
	}
	return code;
};

var KeyBinder = {
	getKeyBinderElement: function getKeyBinderElement(node) {
		return _react2.default.cloneElement(node, {
			onKeyDown: this._onKeyBinderKeyDown.bind(this),
			ref: 'keybinderNode'
		});
	},
	_onKeyBinderKeyDown: function _onKeyBinderKeyDown(e) {
		var code,
		    match,
		    keys = this.keyBinders,
		    currentCode;
		if (currentCode = getCode(e.keyCode)) {
			code = currentCode.toLowerCase();
		} else {
			code = String.fromCharCode(e.keyCode).toLowerCase();
		}
		// if (findDOMNode(this.refs.keybinderNode) !== e.target && (/textarea|select/i.test(e.target.nodeName) ||
		// 	e.target.type === "text" || e.target.getAttribute('contenteditable') == 'true' )) {
		// 	return;
		// }
		if (e.ctrlKey) {
			match = keys['ctrl+' + code];
		} else if (e.shiftKey) {
			match = keys['shift+' + code];
		} else if (e.altKey) {
			match = keys['alt+' + code];
		} else {
			match = keys[code];
		}
		if (!match) {
			if (lastKey) {
				match = keys[lastKey + ' ' + code];
			}
		}
		if (typeof match == 'string') {
			match = self[match].bind(self);
		} else if (typeof match == 'function') {
			match = match.bind(self);
		}
		if (typeof match == 'function') {
			match(e);
		}
		lastKey = code;
	}
};

exports.default = KeyBinder;
module.exports = exports['default'];