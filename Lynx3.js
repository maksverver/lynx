// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 53096;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } },{ func: function() { __GLOBAL__I_a131() } });
var ___fsmu8;
var ___dso_handle;
var ___dso_handle=___dso_handle=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,112,37,0,0,16,1,0,0,156,0,0,0,70,0,0,0,158,0,0,0,10,0,0,0,10,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,128,37,0,0,94,0,0,0,4,1,0,0,70,0,0,0,158,0,0,0,10,0,0,0,26,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZNSt13runtime_errorC1EPKc;
var __ZNSt13runtime_errorD1Ev;
var __ZNSt12length_errorD1Ev;
var __ZNSt3__16localeC1Ev;
var __ZNSt3__16localeC1ERKS0_;
var __ZNSt3__16localeD1Ev;
var __ZNSt8bad_castC1Ev;
var __ZNSt8bad_castD1Ev;
/* memory initializer */ allocate([95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,79,99,116,0,0,0,0,0,83,101,112,0,0,0,0,0,67,0,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,65,117,103,0,0,0,0,0,74,117,108,0,0,0,0,0,74,117,110,0,0,0,0,0,65,112,114,0,0,0,0,0,77,97,114,0,0,0,0,0,70,101,98,0,0,0,0,0,74,97,110,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,79,99,116,111,98,101,114,0,118,101,99,116,111,114,0,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,65,117,103,117,115,116,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,37,46,48,76,102,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,32,110,111,100,101,115,46,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,69,120,112,97,110,100,101,100,32,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,80,77,0,0,0,0,0,0,65,77,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,112,0,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,58,32,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,32,115,101,99,111,110,100,115,32,114,101,109,97,105,110,105,110,103,46,0,0,0,0,0,102,97,108,115,101,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,110,97,110,0,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,84,104,117,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,77,111,110,0,0,0,0,0,83,117,110,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,77,111,110,100,97,121,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,117,110,100,97,121,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,32,115,101,99,111,110,100,115,44,32,0,0,0,0,0,0,85,115,101,100,32,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,0,0,52,64,0,0,0,0,136,31,0,0,34,0,0,0,130,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,31,0,0,208,0,0,0,166,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,31,0,0,74,0,0,0,22,1,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,31,0,0,112,0,0,0,8,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,31,0,0,102,0,0,0,20,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,31,0,0,172,0,0,0,90,0,0,0,52,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,12,1,0,0,192,0,0,0,52,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,32,0,0,164,0,0,0,194,0,0,0,52,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,32,0,0,14,1,0,0,146,0,0,0,52,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,32,0,0,10,1,0,0,100,0,0,0,52,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,33,0,0,162,0,0,0,120,0,0,0,52,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,33,0,0,42,0,0,0,122,0,0,0,52,0,0,0,118,0,0,0,4,0,0,0,10,0,0,0,6,0,0,0,22,0,0,0,54,0,0,0,2,0,0,0,248,255,255,255,32,33,0,0,20,0,0,0,10,0,0,0,32,0,0,0,14,0,0,0,2,0,0,0,30,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,33,0,0,2,1,0,0,240,0,0,0,52,0,0,0,18,0,0,0,18,0,0,0,58,0,0,0,28,0,0,0,20,0,0,0,2,0,0,0,4,0,0,0,248,255,255,255,72,33,0,0,62,0,0,0,100,0,0,0,112,0,0,0,120,0,0,0,88,0,0,0,42,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,33,0,0,82,0,0,0,200,0,0,0,52,0,0,0,44,0,0,0,38,0,0,0,8,0,0,0,44,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,33,0,0,68,0,0,0,72,0,0,0,52,0,0,0,40,0,0,0,76,0,0,0,12,0,0,0,56,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,33,0,0,6,1,0,0,2,0,0,0,52,0,0,0,26,0,0,0,30,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,33,0,0,50,0,0,0,226,0,0,0,52,0,0,0,40,0,0,0,14,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,33,0,0,228,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,33,0,0,32,0,0,0,144,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,33,0,0,6,0,0,0,176,0,0,0,52,0,0,0,8,0,0,0,6,0,0,0,14,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,2,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,34,0,0,108,0,0,0,18,0,0,0,52,0,0,0,20,0,0,0,24,0,0,0,32,0,0,0,22,0,0,0,24,0,0,0,8,0,0,0,6,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,34,0,0,44,0,0,0,26,0,0,0,52,0,0,0,46,0,0,0,44,0,0,0,36,0,0,0,38,0,0,0,30,0,0,0,42,0,0,0,34,0,0,0,52,0,0,0,50,0,0,0,48,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,34,0,0,56,0,0,0,4,0,0,0,52,0,0,0,76,0,0,0,68,0,0,0,62,0,0,0,64,0,0,0,56,0,0,0,66,0,0,0,60,0,0,0,74,0,0,0,72,0,0,0,70,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,34,0,0,78,0,0,0,98,0,0,0,52,0,0,0,6,0,0,0,10,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,34,0,0,30,0,0,0,178,0,0,0,52,0,0,0,16,0,0,0,14,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,34,0,0,66,0,0,0,190,0,0,0,52,0,0,0,2,0,0,0,10,0,0,0,14,0,0,0,116,0,0,0,94,0,0,0,24,0,0,0,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,34,0,0,244,0,0,0,138,0,0,0,52,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,48,0,0,0,8,0,0,0,20,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,34,0,0,198,0,0,0,22,0,0,0,52,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,92,0,0,0,58,0,0,0,10,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,34,0,0,220,0,0,0,110,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,35,0,0,182,0,0,0,38,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,35,0,0,64,0,0,0,160,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,35,0,0,196,0,0,0,84,0,0,0,52,0,0,0,22,0,0,0,2,0,0,0,4,0,0,0,10,0,0,0,16,0,0,0,30,0,0,0,22,0,0,0,8,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,35,0,0,20,1,0,0,40,0,0,0,52,0,0,0,2,0,0,0,6,0,0,0,18,0,0,0,38,0,0,0,10,0,0,0,6,0,0,0,28,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,35,0,0,202,0,0,0,236,0,0,0,70,0,0,0,2,0,0,0,16,0,0,0,34,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,35,0,0,248,0,0,0,92,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,35,0,0,88,0,0,0,168,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,35,0,0,136,0,0,0,252,0,0,0,20,0,0,0,24,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,36,0,0,0,26,0,0,0,24,0,0,0,8,0,0,0,2,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,35,0,0,10,0,0,0,132,0,0,0,60,0,0,0,42,0,0,0,28,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,20,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,18,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,224,35,0,0,48,0,0,0,224,0,0,0,252,255,255,255,252,255,255,255,224,35,0,0,152,0,0,0,134,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,248,35,0,0,230,0,0,0,254,0,0,0,252,255,255,255,252,255,255,255,248,35,0,0,118,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,16,36,0,0,96,0,0,0,24,1,0,0,248,255,255,255,248,255,255,255,16,36,0,0,184,0,0,0,250,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,40,36,0,0,116,0,0,0,222,0,0,0,248,255,255,255,248,255,255,255,40,36,0,0,142,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,36,0,0,216,0,0,0,186,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,36,0,0,218,0,0,0,188,0,0,0,16,0,0,0,24,0,0,0,16,0,0,0,12,0,0,0,54,0,0,0,96,0,0,0,36,0,0,0,26,0,0,0,24,0,0,0,8,0,0,0,32,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,36,0,0,106,0,0,0,180,0,0,0,38,0,0,0,42,0,0,0,28,0,0,0,8,0,0,0,82,0,0,0,78,0,0,0,20,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,44,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,36,0,0,238,0,0,0,150,0,0,0,52,0,0,0,60,0,0,0,114,0,0,0,30,0,0,0,78,0,0,0,4,0,0,0,34,0,0,0,50,0,0,0,24,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,36,0,0,114,0,0,0,60,0,0,0,52,0,0,0,106,0,0,0,4,0,0,0,66,0,0,0,74,0,0,0,76,0,0,0,26,0,0,0,110,0,0,0,52,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,36,0,0,242,0,0,0,128,0,0,0,52,0,0,0,16,0,0,0,56,0,0,0,6,0,0,0,46,0,0,0,80,0,0,0,54,0,0,0,86,0,0,0,58,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,37,0,0,80,0,0,0,174,0,0,0,52,0,0,0,98,0,0,0,102,0,0,0,32,0,0,0,72,0,0,0,28,0,0,0,22,0,0,0,72,0,0,0,70,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,37,0,0,124,0,0,0,16,0,0,0,40,0,0,0,24,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,36,0,0,0,64,0,0,0,74,0,0,0,12,0,0,0,2,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,37,0,0,212,0,0,0,232,0,0,0,62,0,0,0,42,0,0,0,28,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,20,0,0,0,90,0,0,0,22,0,0,0,4,0,0,0,18,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,37,0,0,28,0,0,0,210,0,0,0,70,0,0,0,158,0,0,0,10,0,0,0,2,0,0,0,6,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,0,0,0,0,208,19,0,0,0,0,0,0,224,19,0,0,0,0,0,0,240,19,0,0,128,31,0,0,0,0,0,0,0,0,0,0,0,20,0,0,128,31,0,0,0,0,0,0,0,0,0,0,16,20,0,0,128,31,0,0,0,0,0,0,0,0,0,0,40,20,0,0,200,31,0,0,0,0,0,0,0,0,0,0,64,20,0,0,128,31,0,0,0,0,0,0,0,0,0,0,80,20,0,0,168,19,0,0,104,20,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,136,36,0,0,0,0,0,0,168,19,0,0,176,20,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,144,36,0,0,0,0,0,0,168,19,0,0,248,20,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,152,36,0,0,0,0,0,0,168,19,0,0,64,21,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,160,36,0,0,0,0,0,0,0,0,0,0,136,21,0,0,208,33,0,0,0,0,0,0,0,0,0,0,184,21,0,0,208,33,0,0,0,0,0,0,168,19,0,0,232,21,0,0,0,0,0,0,1,0,0,0,200,35,0,0,0,0,0,0,168,19,0,0,0,22,0,0,0,0,0,0,1,0,0,0,200,35,0,0,0,0,0,0,168,19,0,0,24,22,0,0,0,0,0,0,1,0,0,0,208,35,0,0,0,0,0,0,168,19,0,0,48,22,0,0,0,0,0,0,1,0,0,0,208,35,0,0,0,0,0,0,168,19,0,0,72,22,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,56,37,0,0,0,8,0,0,168,19,0,0,144,22,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,56,37,0,0,0,8,0,0,168,19,0,0,216,22,0,0,0,0,0,0,3,0,0,0,8,35,0,0,2,0,0,0,216,31,0,0,2,0,0,0,104,35,0,0,0,8,0,0,168,19,0,0,32,23,0,0,0,0,0,0,3,0,0,0,8,35,0,0,2,0,0,0,216,31,0,0,2,0,0,0,112,35,0,0,0,8,0,0,0,0,0,0,104,23,0,0,8,35,0,0,0,0,0,0,0,0,0,0,128,23,0,0,8,35,0,0,0,0,0,0,168,19,0,0,152,23,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,216,35,0,0,2,0,0,0,168,19,0,0,176,23,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,216,35,0,0,2,0,0,0,0,0,0,0,200,23,0,0,0,0,0,0,224,23,0,0,64,36,0,0,0,0,0,0,168,19,0,0,0,24,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,128,32,0,0,0,0,0,0,168,19,0,0,72,24,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,152,32,0,0,0,0,0,0,168,19,0,0,144,24,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,176,32,0,0,0,0,0,0,168,19,0,0,216,24,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,200,32,0,0,0,0,0,0,0,0,0,0,32,25,0,0,8,35,0,0,0,0,0,0,0,0,0,0,56,25,0,0,8,35,0,0,0,0,0,0,168,19,0,0,80,25,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,80,36,0,0,2,0,0,0,168,19,0,0,120,25,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,80,36,0,0,2,0,0,0,168,19,0,0,160,25,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,80,36,0,0,2,0,0,0,168,19,0,0,200,25,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,80,36,0,0,2,0,0,0,0,0,0,0,240,25,0,0,192,35,0,0,0,0,0,0,0,0,0,0,8,26,0,0,8,35,0,0,0,0,0,0,168,19,0,0,32,26,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,48,37,0,0,2,0,0,0,168,19,0,0,56,26,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,48,37,0,0,2,0,0,0,0,0,0,0,80,26,0,0,0,0,0,0,120,26,0,0,0,0,0,0,160,26,0,0,88,36,0,0,0,0,0,0,0,0,0,0,192,26,0,0,232,34,0,0,0,0,0,0,0,0,0,0,232,26,0,0,232,34,0,0,0,0,0,0,0,0,0,0,16,27,0,0,0,0,0,0,72,27,0,0,0,0,0,0,128,27,0,0,0,0,0,0,160,27,0,0,0,0,0,0,192,27,0,0,0,0,0,0,224,27,0,0,0,0,0,0,0,28,0,0,168,19,0,0,24,28,0,0,0,0,0,0,1,0,0,0,96,32,0,0,3,244,255,255,168,19,0,0,72,28,0,0,0,0,0,0,1,0,0,0,112,32,0,0,3,244,255,255,168,19,0,0,120,28,0,0,0,0,0,0,1,0,0,0,96,32,0,0,3,244,255,255,168,19,0,0,168,28,0,0,0,0,0,0,1,0,0,0,112,32,0,0,3,244,255,255,0,0,0,0,216,28,0,0,168,31,0,0,0,0,0,0,0,0,0,0,240,28,0,0,0,0,0,0,8,29,0,0,184,35,0,0,0,0,0,0,0,0,0,0,32,29,0,0,168,35,0,0,0,0,0,0,0,0,0,0,64,29,0,0,176,35,0,0,0,0,0,0,0,0,0,0,96,29,0,0,0,0,0,0,128,29,0,0,0,0,0,0,160,29,0,0,0,0,0,0,192,29,0,0,168,19,0,0,224,29,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,40,37,0,0,2,0,0,0,168,19,0,0,0,30,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,40,37,0,0,2,0,0,0,168,19,0,0,32,30,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,40,37,0,0,2,0,0,0,168,19,0,0,64,30,0,0,0,0,0,0,2,0,0,0,8,35,0,0,2,0,0,0,40,37,0,0,2,0,0,0,0,0,0,0,96,30,0,0,0,0,0,0,120,30,0,0,0,0,0,0,144,30,0,0,0,0,0,0,168,30,0,0,168,35,0,0,0,0,0,0,0,0,0,0,192,30,0,0,176,35,0,0,0,0,0,0,0,0,0,0,216,30,0,0,128,37,0,0,0,0,0,0,0,0,0,0,0,31,0,0,128,37,0,0,0,0,0,0,0,0,0,0,40,31,0,0,144,37,0,0,0,0,0,0,0,0,0,0,80,31,0,0,120,31,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,8,0,0,0,12,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,4,0,0,0,7,0,0,0,0,0,0,0,17,0,0,0,16,0,0,0,19,0,0,0,24,0,0,0,25,0,0,0,28,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,67,0,0,0,7,0,0,0,21,0,0,0,0,0,0,0,11,0,0,0].concat([7,0,0,0,31,0,0,0,0,0,0,0,15,0,0,0,7,0,0,0,42,0,0,0,0,0,0,0,28,0,0,0,7,0,0,0,44,0,0,0,0,0,0,0,34,0,0,0,7,0,0,0,67,0,0,0,0,0,0,0,53,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,29,0,0,0,11,0,0,0,6,0,0,0,0,0,0,0,31,0,0,0,11,0,0,0,7,0,0,0,0,0,0,0,13,0,0,0,11,0,0,0,8,0,0,0,0,0,0,0,56,0,0,0,11,0,0,0,12,0,0,0,0,0,0,0,41,0,0,0,11,0,0,0,13,0,0,0,0,0,0,0,29,0,0,0,11,0,0,0,14,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,15,0,0,0,0,0,0,0,32,0,0,0,11,0,0,0,18,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,19,0,0,0,0,0,0,0,7,0,0,0,11,0,0,0,20,0,0,0,0,0,0,0,7,0,0,0,11,0,0,0,21,0,0,0,0,0,0,0,29,0,0,0,11,0,0,0,22,0,0,0,0,0,0,0,13,0,0,0,11,0,0,0,23,0,0,0,0,0,0,0,7,0,0,0,11,0,0,0,24,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,27,0,0,0,0,0,0,0,28,0,0,0,11,0,0,0,28,0,0,0,0,0,0,0,20,0,0,0,11,0,0,0,29,0,0,0,0,0,0,0,7,0,0,0,11,0,0,0,29,0,0,0,3,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,6,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,7,0,0,0,22,0,0,0,11,0,0,0,29,0,0,0,8,0,0,0,33,0,0,0,11,0,0,0,29,0,0,0,12,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,13,0,0,0,56,0,0,0,11,0,0,0,29,0,0,0,14,0,0,0,42,0,0,0,11,0,0,0,29,0,0,0,15,0,0,0,67,0,0,0,11,0,0,0,29,0,0,0,18,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,19,0,0,0,21,0,0,0,11,0,0,0,29,0,0,0,20,0,0,0,42,0,0,0,11,0,0,0,29,0,0,0,21,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,22,0,0,0,21,0,0,0,11,0,0,0,29,0,0,0,23,0,0,0,55,0,0,0,11,0,0,0,29,0,0,0,24,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,27,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,28,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,30,0,0,0,20,0,0,0,11,0,0,0,29,0,0,0,31,0,0,0,21,0,0,0,11,0,0,0,29,0,0,0,32,0,0,0,55,0,0,0,11,0,0,0,29,0,0,0,33,0,0,0,14,0,0,0,11,0,0,0,29,0,0,0,34,0,0,0,7,0,0,0,11,0,0,0,29,0,0,0,35,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,38,0,0,0,55,0,0,0,11,0,0,0,29,0,0,0,39,0,0,0,52,0,0,0,11,0,0,0,29,0,0,0,40,0,0,0,28,0,0,0,11,0,0,0,29,0,0,0,41,0,0,0,40,0,0,0,11,0,0,0,29,0,0,0,42,0,0,0,53,0,0,0,11,0,0,0,29,0,0,0,43,0,0,0,53,0,0,0,11,0,0,0,29,0,0,0,44,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,45,0,0,0,42,0,0,0,11,0,0,0,29,0,0,0,46,0,0,0,56,0,0,0,11,0,0,0,29,0,0,0,47,0,0,0,55,0,0,0,11,0,0,0,29,0,0,0,48,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,51,0,0,0,66,0,0,0,11,0,0,0,29,0,0,0,52,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,53,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,54,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,55,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,56,0,0,0,53,0,0,0,11,0,0,0,29,0,0,0,57,0,0,0,45,0,0,0,11,0,0,0,29,0,0,0,58,0,0,0,21,0,0,0,11,0,0,0,29,0,0,0,59,0,0,0,55,0,0,0,11,0,0,0,29,0,0,0,60,0,0,0,69,0,0,0,11,0,0,0,29,0,0,0,63,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,64,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,65,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,66,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,67,0,0,0,44,0,0,0,11,0,0,0,29,0,0,0,68,0,0,0,40,0,0,0,11,0,0,0,29,0,0,0,69,0,0,0,21,0,0,0,11,0,0,0,29,0,0,0,70,0,0,0,33,0,0,0,11,0,0,0,29,0,0,0,71,0,0,0,79,0,0,0,11,0,0,0,29,0,0,0,74,0,0,0,38,0,0,0,11,0,0,0,29,0,0,0,75,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,76,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,77,0,0,0,53,0,0,0,11,0,0,0,29,0,0,0,78,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,79,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,80,0,0,0,54,0,0,0,11,0,0,0,29,0,0,0,81,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,84,0,0,0,53,0,0,0,11,0,0,0,29,0,0,0,85,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,86,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,87,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,88,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,89,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,90,0,0,0,21,0,0,0,11,0,0,0,29,0,0,0,93,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,94,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,95,0,0,0,12,0,0,0,11,0,0,0,29,0,0,0,96,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,97,0,0,0,39,0,0,0,11,0,0,0,29,0,0,0,98,0,0,0,39,0,0,0,11,0,0,0,30,0,0,0,0,0,0,0,29,0,0,0,11,0,0,0,31,0,0,0,0,0,0,0,7,0,0,0,11,0,0,0,32,0,0,0,0,0,0,0,41,0,0,0,11,0,0,0,33,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,34,0,0,0,0,0,0,0,32,0,0,0,11,0,0,0,35,0,0,0,0,0,0,0,44,0,0,0,11,0,0,0,38,0,0,0,0,0,0,0,55,0,0,0,11,0,0,0,39,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,40,0,0,0,0,0,0,0,56,0,0,0,11,0,0,0,41,0,0,0,0,0,0,0,20,0,0,0,11,0,0,0,42,0,0,0,0,0,0,0,28,0,0,0,11,0,0,0,43,0,0,0,0,0,0,0,32,0,0,0,11,0,0,0,44,0,0,0,0,0,0,0,66,0,0,0,11,0,0,0,45,0,0,0,0,0,0,0,54,0,0,0,11,0,0,0,46,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,47,0,0,0,0,0,0,0,54,0,0,0,11,0,0,0,48,0,0,0,0,0,0,0,44,0,0,0,11,0,0,0,51,0,0,0,0,0,0,0,55,0,0,0,11,0,0,0,52,0,0,0,0,0,0,0,56,0,0,0,11,0,0,0,53,0,0,0,0,0,0,0,40,0,0,0,11,0,0,0,54,0,0,0,0,0,0,0,28,0,0,0,11,0,0,0,55,0,0,0,0,0,0,0,76,0,0,0,11,0,0,0,56,0,0,0,0,0,0,0,53,0,0,0,11,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,58,0,0,0,0,0,0,0,55,0,0,0,11,0,0,0,59,0,0,0,0,0,0,0,54,0,0,0,11,0,0,0,60,0,0,0,0,0,0,0,44,0,0,0,11,0,0,0,63,0,0,0,0,0,0,0,38,0,0,0,11,0,0,0,64,0,0,0,0,0,0,0,38,0,0,0,11,0,0,0,65,0,0,0,0,0,0,0,21,0,0,0,11,0,0,0,66,0,0,0,0,0,0,0,28,0,0,0,11,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,11,0,0,0,68,0,0,0,0,0,0,0,66,0,0,0,11,0,0,0,69,0,0,0,0,0,0,0,55,0,0,0,11,0,0,0,70,0,0,0,0,0,0,0,55,0,0,0,11,0,0,0,71,0,0,0,0,0,0,0,55,0,0,0,11,0,0,0,74,0,0,0,0,0,0,0,54,0,0,0,11,0,0,0,75,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,76,0,0,0,0,0,0,0,44,0,0,0,11,0,0,0,77,0,0,0,0,0,0,0,76,0,0,0,11,0,0,0,78,0,0,0,0,0,0,0,28,0,0,0,11,0,0,0,79,0,0,0,0,0,0,0,31,0,0,0,11,0,0,0,80,0,0,0,0,0,0,0,78,0,0,0,11,0,0,0,81,0,0,0,0,0,0,0,44,0,0,0,11,0,0,0,84,0,0,0,0,0,0,0,44,0,0,0,11,0,0,0,85,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,86,0,0,0,0,0,0,0,76,0,0,0,11,0,0,0,87,0,0,0,0,0,0,0,55,0,0,0,11,0,0,0,88,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,89,0,0,0,0,0,0,0,68,0,0,0,11,0,0,0,90,0,0,0,0,0,0,0,56,0,0,0,11,0,0,0,93,0,0,0,0,0,0,0,44,0,0,0,11,0,0,0,94,0,0,0,0,0,0,0,56,0,0,0,11,0,0,0,95,0,0,0,0,0,0,0,31,0,0,0,11,0,0,0,96,0,0,0,0,0,0,0,86,0,0,0,11,0,0,0,97,0,0,0,0,0,0,0,42,0,0,0,11,0,0,0,98,0,0,0,0,0,0,0,78,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,12,0,0,0,22,0,0,0,0,0,0,0,13,0,0,0,12,0,0,0,29,0,0,0,0,0,0,0,33,0,0,0,12,0,0,0,31,0,0,0,0,0,0,0,29,0,0,0,12,0,0,0,32,0,0,0,0,0,0,0,41,0,0,0,12,0,0,0,40,0,0,0,0,0,0,0,56,0,0,0,12,0,0,0,42,0,0,0,0,0,0,0,32,0,0,0,12,0,0,0,44,0,0,0,0,0,0,0,42,0,0,0,12,0,0,0,54,0,0,0,0,0,0,0,40,0,0,0,12,0,0,0,55,0,0,0,0,0,0,0,42,0,0,0,12,0,0,0,56,0,0,0,0,0,0,0,46,0,0,0,12,0,0,0,57,0,0,0,0,0,0,0,31,0,0,0,12,0,0,0,67,0,0,0,0,0,0,0,46,0,0,0,12,0,0,0,76,0,0,0,0,0,0,0,32,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,67,0,0,0,13,0,0,0,54,0,0,0,0,0,0,0,40,0,0,0,13,0,0,0,55,0,0,0,0,0,0,0,56,0,0,0,13,0,0,0,56,0,0,0,0,0,0,0,55,0,0,0,13,0,0,0,57,0,0,0,0,0,0,0,46,0,0,0,13,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,13,0,0,0,76,0,0,0,0,0,0,0,31,0,0,0,13,0,0,0,79,0,0,0,0,0,0,0,31,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,14,0,0,0,20,0,0,0,0,0,0,0,13,0,0,0,14,0,0,0,30,0,0,0,0,0,0,0,45,0,0,0,14,0,0,0,31,0,0,0,0,0,0,0,33,0,0,0,14,0,0,0,33,0,0,0,0,0,0,0,29,0,0,0,14,0,0,0,42,0,0,0,0,0,0,0,44,0,0,0,14,0,0,0,44,0,0,0,0,0,0,0,30,0,0,0,14,0,0,0,46,0,0,0,0,0,0,0,55,0,0,0,14,0,0,0,54,0,0,0,0,0,0,0,31,0,0,0,14,0,0,0,55,0,0,0,0,0,0,0,40,0,0,0,14,0,0,0,56,0,0,0,0,0,0,0,44,0,0,0,14,0,0,0,57,0,0,0,0,0,0,0,46,0,0,0,14,0,0,0,67,0,0,0,0,0,0,0,40,0,0,0,14,0,0,0,79,0,0,0,0,0,0,0,30,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,33,0,0,0,15,0,0,0,6,0,0,0,0,0,0,0,55,0,0,0,15,0,0,0,7,0,0,0,0,0,0,0,13,0,0,0,15,0,0,0,8,0,0,0,0,0,0,0,31,0,0,0,15,0,0,0,11,0,0,0,0,0,0,0,30,0,0,0,15,0,0,0,12,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,13,0,0,0,0,0,0,0,33,0,0,0,15,0,0,0,14,0,0,0,0,0,0,0,45,0,0,0,15,0,0,0,18,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,19,0,0,0,0,0,0,0,7,0,0,0,15,0,0,0,20,0,0,0,0,0,0,0,13,0,0,0,15,0,0,0,21,0,0,0,0,0,0,0,33,0,0,0,15,0,0,0,22,0,0,0,0,0,0,0,7,0,0,0,15,0,0,0,23,0,0,0,0,0,0,0,7,0,0,0,15,0,0,0,24,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,27,0,0,0,0,0,0,0,42,0,0,0,15,0,0,0,28,0,0,0,0,0,0,0,30,0,0,0,15,0,0,0,29,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,30,0,0,0,0,0,0,0,45,0,0,0,15,0,0,0,31,0,0,0,0,0,0,0,7,0,0,0,15,0,0,0,32,0,0,0,0,0,0,0,33,0,0,0,15,0,0,0,33,0,0,0,0,0,0,0,7,0,0,0,15,0,0,0,33,0,0,0,3,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,6,0,0,0,29,0,0,0,15,0,0,0,33,0,0,0,7,0,0,0,20,0,0,0,15,0,0,0,33,0,0,0,8,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,11,0,0,0,67,0,0,0,15,0,0,0,33,0,0,0,12,0,0,0,44,0,0,0,15,0,0,0,33,0,0,0,13,0,0,0,55,0,0,0,15,0,0,0,33,0,0,0,14,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,18,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,19,0,0,0,56,0,0,0,15,0,0,0,33,0,0,0,20,0,0,0,21,0,0,0,15,0,0,0,33,0,0,0,21,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,22,0,0,0,44,0,0,0,15,0,0,0,33,0,0,0,23,0,0,0,21,0,0,0,15,0,0,0,33,0,0,0,24,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,27,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,28,0,0,0,7,0,0,0,15,0,0,0,33,0,0,0,29,0,0,0,12,0,0,0,15,0,0,0,33,0,0,0,30,0,0,0,56,0,0,0,15,0,0,0,33,0,0,0,31,0,0,0,21,0,0,0,15,0,0,0,33,0,0,0,32,0,0,0,22,0,0,0,15,0,0,0,33,0,0,0,34,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,35,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,38,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,39,0,0,0,56,0,0,0,15,0,0,0,33,0,0,0,40,0,0,0,55,0,0,0,15,0,0,0,33,0,0,0,41,0,0,0,44,0,0,0,15,0,0,0,33,0,0,0,42,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,43,0,0,0,58,0,0,0,15,0,0,0,33,0,0,0,44,0,0,0,58,0,0,0,15,0,0,0,33,0,0,0,45,0,0,0,46,0,0,0,15,0,0,0,33,0,0,0,46,0,0,0,34,0,0,0,15,0,0,0,33,0,0,0,47,0,0,0,59,0,0,0,15,0,0,0,33,0,0,0,48,0,0,0,56,0,0,0,15,0,0,0,33,0,0,0,51,0,0,0,65,0,0,0,15,0,0,0,33,0,0,0,52,0,0,0,56,0,0,0,15,0,0,0,33,0,0,0,53,0,0,0,21,0,0,0,15,0,0,0,33,0,0,0,54,0,0,0,41,0,0,0,15,0,0,0,33,0,0,0,55,0,0,0,58,0,0,0,15,0,0,0,33,0,0,0,56,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,57,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,58,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,59,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,60,0,0,0,68,0,0,0,15,0,0,0,33,0,0,0,63,0,0,0,76,0,0,0,15,0,0,0,33,0,0,0,64,0,0,0,29,0,0,0,15,0,0,0,33,0,0,0,65,0,0,0,21,0,0,0,15,0,0,0,33,0,0,0,66,0,0,0,46,0,0,0,15,0,0,0,33,0,0,0,67,0,0,0,42,0,0,0,15,0,0,0,33,0,0,0,68,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,69,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,70,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,71,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,74,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,75,0,0,0,57,0,0,0,15,0,0,0,33,0,0,0,76,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,77,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,78,0,0,0,58,0,0,0,15,0,0,0,33,0,0,0,79,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,80,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,81,0,0,0,48,0,0,0,15,0,0,0,33,0,0,0,84,0,0,0,21,0,0,0,15,0,0,0,33,0,0,0,85,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,86,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,87,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,88,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,89,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,90,0,0,0,58,0,0,0,15,0,0,0,33,0,0,0,93,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,94,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,95,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,96,0,0,0,14,0,0,0,15,0,0,0,33,0,0,0,97,0,0,0,47,0,0,0,15,0,0,0,33,0,0,0,98,0,0,0,47,0,0,0,15,0,0,0,34,0,0,0,0,0,0,0,22,0,0,0,15,0,0,0,35,0,0,0,0,0,0,0,34,0,0,0,15,0,0,0,38,0,0,0,0,0,0,0,42,0,0,0,15,0,0,0,39,0,0,0,0,0,0,0,57,0,0,0,15,0,0,0,40,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,41,0,0,0,0,0,0,0,57,0,0,0,15,0,0,0,42,0,0,0,0,0,0,0,68,0,0,0,15,0,0,0,43,0,0,0,0,0,0,0,30,0,0,0,15,0,0,0,44,0,0,0,0,0,0,0,34,0,0,0,15,0,0,0,45,0,0,0,0,0,0,0,22,0,0,0,15,0,0,0,46,0,0,0,0,0,0,0,55,0,0,0,15,0,0,0,47,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,48,0,0,0,0,0,0,0,59,0,0,0,15,0,0,0,51,0,0,0,0,0,0,0,42,0,0,0,15,0,0,0,52,0,0,0,0,0,0,0,57,0,0,0,15,0,0,0,53,0,0,0,0,0,0,0,56,0,0,0,15,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,55,0,0,0,0,0,0,0,58,0,0,0,15,0,0,0,56,0,0,0,0,0,0,0,79,0,0,0,15,0,0,0,57,0,0,0,0,0,0,0,34,0,0,0,15,0,0,0,58,0,0,0,0,0,0,0,46,0,0,0,15,0,0,0,59,0,0,0,0,0,0,0,55,0,0,0,15,0,0,0,60,0,0,0,0,0,0,0,56,0,0,0,15,0,0,0,63,0,0,0,0,0,0,0,56,0,0,0,15,0,0,0,64,0,0,0,0,0,0,0,56,0,0,0,15,0,0,0,65,0,0,0,0,0,0,0,56,0,0,0,15,0,0,0,66,0,0,0,0,0,0,0,68,0,0,0,15,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,15,0,0,0,68,0,0,0,0,0,0,0,34,0,0,0,15,0,0,0,69,0,0,0,0,0,0,0,21,0,0,0,15,0,0,0,70,0,0,0,0,0,0,0,48,0,0,0,15,0,0,0,71,0,0,0,0,0,0,0,48,0,0,0,15,0,0,0,74,0,0,0,0,0,0,0,42,0,0,0,15,0,0,0,75,0,0,0,0,0,0,0,77,0,0,0,15,0,0,0,76,0,0,0,0,0,0,0,31,0,0,0,15,0,0,0,77,0,0,0,0,0,0,0,34,0,0,0,15,0,0,0,78,0,0,0,0,0,0,0,79,0,0,0,15,0,0,0,79,0,0,0,0,0,0,0,42,0,0,0,15,0,0,0,80,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,81,0,0,0,0,0,0,0,57,0,0,0,15,0,0,0,84,0,0,0,0,0,0,0,55,0,0,0,15,0,0,0,85,0,0,0,0,0,0,0,66,0,0,0,15,0,0,0,86,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,87,0,0,0,0,0,0,0,56,0,0,0,15,0,0,0,88,0,0,0,0,0,0,0,79,0,0,0,15,0,0,0,89,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,90,0,0,0,0,0,0,0,42,0,0,0,15,0,0,0,93,0,0,0,0,0,0,0,77,0,0,0,15,0,0,0,94,0,0,0,0,0,0,0,44,0,0,0,15,0,0,0,95,0,0,0,0,0,0,0,88,0,0,0,15,0,0,0,96,0,0,0,0,0,0,0,31,0,0,0,15,0,0,0,97,0,0,0,0,0,0,0,55,0,0,0,15,0,0,0,98,0,0,0,0,0,0,0,42,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,18,0,0,0,3,0,0,0,0,0,0,0,14,0,0,0,18,0,0,0,6,0,0,0,0,0,0,0,12,0,0,0,18,0,0,0,7,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,8,0,0,0,0,0,0,0,44,0,0,0,18,0,0,0,11,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,12,0,0,0,0,0,0,0,29,0,0,0,18,0,0,0,13,0,0,0,0,0,0,0,56,0,0,0,18,0,0,0,14,0,0,0,0,0,0,0,56,0,0,0,18,0,0,0,15,0,0,0,0,0,0,0,3,0,0,0,18,0,0,0,19,0,0,0,0,0,0,0,39,0,0,0,18,0,0,0,20,0,0,0,0,0,0,0,39,0,0,0,18,0,0,0,20,0,0,0,3,0,0,0,44,0,0,0,18,0,0,0,20,0,0,0,6,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,7,0,0,0,14,0,0,0,18,0,0,0,20,0,0,0,8,0,0,0,45,0,0,0,18,0,0,0,20,0,0,0,11,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,12,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,13,0,0,0,12,0,0,0,18,0,0,0,20,0,0,0,14,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,15,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,19,0,0,0,12,0,0,0,18,0,0,0,20,0,0,0,21,0,0,0,13,0,0,0,18,0,0,0,20,0,0,0,22,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,23,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,24,0,0,0,3,0,0,0,18,0,0,0,20,0,0,0,27,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,28,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,29,0,0,0,31,0,0,0,18,0,0,0,20,0,0,0,30,0,0,0,29,0,0,0,18,0,0,0,20,0,0,0,31,0,0,0,22,0,0,0,18,0,0,0,20,0,0,0,32,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,33,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,34,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,35,0,0,0,22,0,0,0,18,0,0,0,20,0,0,0,38,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,39,0,0,0,53,0,0,0,18,0,0,0,20,0,0,0,40,0,0,0,56,0,0,0,18,0,0,0,20,0,0,0,41,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,42,0,0,0,41,0,0,0,18,0,0,0,20,0,0,0,43,0,0,0,22,0,0,0,18,0,0,0,20,0,0,0,44,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,45,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,46,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,47,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,48,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,51,0,0,0,65,0,0,0,18,0,0,0,20,0,0,0,52,0,0,0,31,0,0,0,18,0,0,0,20,0,0,0,53,0,0,0,41,0,0,0,18,0,0,0,20,0,0,0,54,0,0,0,44,0,0,0,18,0,0,0,20,0,0,0,55,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,56,0,0,0,22,0,0,0,18,0,0,0,20,0,0,0,57,0,0,0,55,0,0,0,18,0,0,0,20,0,0,0,58,0,0,0,22,0,0,0,18,0,0,0,20,0,0,0,59,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,60,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,63,0,0,0,57,0,0,0,18,0,0,0,20,0,0,0,64,0,0,0,44,0,0,0,18,0,0,0,20,0,0,0,65,0,0,0,44,0,0,0,18,0,0,0,20,0,0,0,66,0,0,0,31,0,0,0,18,0,0,0,20,0,0,0,67,0,0,0,66,0,0,0,18,0,0,0,20,0,0,0,68,0,0,0,13,0,0,0,18,0,0,0,20,0,0,0,69,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,70,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,71,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,74,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,75,0,0,0,39,0,0,0,18,0,0,0,20,0,0,0,76,0,0,0,56,0,0,0,18,0,0,0,20,0,0,0,77,0,0,0,41,0,0,0,18,0,0,0,20,0,0,0,78,0,0,0,41,0,0,0,18,0,0,0,20,0,0,0,79,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,80,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,81,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,84,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,85,0,0,0,44,0,0,0,18,0,0,0,20,0,0,0,86,0,0,0,44,0,0,0,18,0,0,0,20,0,0,0,87,0,0,0,65,0,0,0,18,0,0,0,20,0,0,0,88,0,0,0,32,0,0,0,18,0,0,0,20,0,0,0,89,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,90,0,0,0,7,0,0,0,18,0,0,0,20,0,0,0,93,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,94,0,0,0,78,0,0,0,18,0,0,0,20,0,0,0,95,0,0,0,79,0,0,0,18,0,0,0,20,0,0,0,96,0,0,0,28,0,0,0,18,0,0,0,20,0,0,0,97,0,0,0,41,0,0,0,18,0,0,0,20,0,0,0,98,0,0,0,7,0,0,0,18,0,0,0,21,0,0,0,0,0,0,0,12,0,0,0,18,0,0,0,22,0,0,0,0,0,0,0,13,0,0,0,18,0,0,0,23,0,0,0,0,0,0,0,3,0,0,0,18,0,0,0,24,0,0,0,0,0,0,0,32,0,0,0,18,0,0,0,27,0,0,0,0,0,0,0,42,0,0,0,18,0,0,0,28,0,0,0,0,0,0,0,21,0,0,0,18,0,0,0,29,0,0,0,0,0,0,0,39,0,0,0,18,0,0,0,30,0,0,0,0,0,0,0,20,0,0,0,18,0,0,0,31,0,0,0,0,0,0,0,12,0,0,0,18,0,0,0,32,0,0,0,0,0,0,0,12,0,0,0,18,0,0,0,33,0,0,0,0,0,0,0,41,0,0,0,18,0,0,0,34,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,35,0,0,0,0,0,0,0,55,0,0,0,18,0,0,0,39,0,0,0,0,0,0,0,40,0,0,0,18,0,0,0,40,0,0,0,0,0,0,0,21,0,0,0,18,0,0,0,41,0,0,0,0,0,0,0,20,0,0,0,18,0,0,0,42,0,0,0,0,0,0,0,39,0,0,0,18,0,0,0,43,0,0,0,0,0,0,0,54,0,0,0,18,0,0,0,44,0,0,0,0,0,0,0,46,0,0,0,18,0,0,0,45,0,0,0,0,0,0,0,12,0,0,0,18,0,0,0,46,0,0,0,0,0,0,0,55,0,0,0,18,0,0,0,47,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,48,0,0,0,0,0,0,0,55,0,0,0,18,0,0,0,51,0,0,0,0,0,0,0,56,0,0,0,18,0,0,0,52,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,53,0,0,0,0,0,0,0,40,0,0,0,18,0,0,0,54,0,0,0,0,0,0,0,21,0,0,0,18,0,0,0,55,0,0,0,0,0,0,0,45,0,0,0,18,0,0,0,56,0,0,0,0,0,0,0,22,0,0,0,18,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,18,0,0,0,58,0,0,0,0,0,0,0,46,0,0,0,18,0,0,0,59,0,0,0,0,0,0,0,46,0,0,0,18,0,0,0,60,0,0,0,0,0,0,0,56,0,0,0,18,0,0,0,63,0,0,0,0,0,0,0,54,0,0,0,18,0,0,0,64,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,65,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,66,0,0,0,0,0,0,0,32,0,0,0,18,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,68,0,0,0,0,0,0,0,45,0,0,0,18,0,0,0,69,0,0,0,0,0,0,0,12,0,0,0,18,0,0,0,70,0,0,0,0,0,0,0,44,0,0,0,18,0,0,0,71,0,0,0,0,0,0,0,42,0,0,0,18,0,0,0,74,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,75,0,0,0,0,0,0,0,54,0,0,0,18,0,0,0,76,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,77,0,0,0,0,0,0,0,44,0,0,0,18,0,0,0,78,0,0,0,0,0,0,0,44,0,0,0,18,0,0,0,79,0,0,0,0,0,0,0,42,0,0,0,18,0,0,0,80,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,81,0,0,0,0,0,0,0,59,0,0,0,18,0,0,0,84,0,0,0,0,0,0,0,55,0,0,0,18,0,0,0,85,0,0,0,0,0,0,0,32,0,0,0,18,0,0,0,86,0,0,0,0,0,0,0,32,0,0,0,18,0,0,0,87,0,0,0,0,0,0,0,44,0,0,0,18,0,0,0,88,0,0,0,0,0,0,0,69,0,0,0,18,0,0,0,89,0,0,0,0,0,0,0,68,0,0,0,18,0,0,0,90,0,0,0,0,0,0,0,31,0,0,0,18,0,0,0,93,0,0,0,0,0,0,0,32,0,0,0,18,0,0,0,94,0,0,0,0,0,0,0,55,0,0,0,18,0,0,0,95,0,0,0,0,0,0,0,44,0,0,0,18,0,0,0,96,0,0,0,0,0,0,0,55,0,0,0,18,0,0,0,97,0,0,0,0,0,0,0,56,0,0,0,18,0,0,0,98,0,0,0,0,0,0,0,69,0,0,0,19,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,19,0,0,0,13,0,0,0,0,0,0,0,21,0,0,0,19,0,0,0,14,0,0,0,0,0,0,0,22,0,0,0,19,0,0,0,21,0,0,0,0,0,0,0,29,0,0,0,19,0,0,0,22,0,0,0,0,0,0,0,40,0,0,0,19,0,0,0,23,0,0,0,0,0,0,0,42,0,0,0,19,0,0,0,31,0,0,0,0,0,0,0,40,0,0,0,19,0,0,0,33,0,0,0,0,0,0,0,56,0,0,0,19,0,0,0,40,0,0,0,0,0,0,0,41,0,0,0,19,0,0,0,41,0,0,0,0,0,0,0,20,0,0,0,19,0,0,0,42,0,0,0,0,0,0,0,13,0,0,0,19,0,0,0,44,0,0,0,0,0,0,0,54,0,0,0,19,0,0,0,45,0,0,0,0,0,0,0,13,0,0,0,19,0,0,0,46,0,0,0,0,0,0,0,42,0,0,0,19,0,0,0,52,0,0,0,0,0,0,0,53,0,0,0,19,0,0,0,53,0,0,0,0,0,0,0,13,0,0,0,19,0,0,0,55,0,0,0,0,0,0,0,32,0,0,0,19,0,0,0,56,0,0,0,0,0,0,0,13,0,0,0,19,0,0,0,64,0,0,0,0,0,0,0,31,0,0,0,19,0,0,0,65,0,0,0,0,0,0,0,56,0,0,0,19,0,0,0,66,0,0,0,0,0,0,0,40,0,0,0,19,0,0,0,76,0,0,0,0,0,0,0,31,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,20,0,0,0,55,0,0,0,0,0,0,0,44,0,0,0,20,0,0,0,66,0,0,0,0,0,0,0,31,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,21,0,0,0,41,0,0,0,0,0,0,0,44,0,0,0,21,0,0,0,45,0,0,0,0,0,0,0,42,0,0,0,21,0,0,0,53,0,0,0,0,0,0,0,55,0,0,0,21,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,21,0,0,0,55,0,0,0,0,0,0,0,42,0,0,0,21,0,0,0,56,0,0,0,0,0,0,0,44,0,0,0,21,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,21,0,0,0,58,0,0,0,0,0,0,0,56,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,22,0,0,0,56,0,0,0,0,0,0,0,42,0,0,0,22,0,0,0,68,0,0,0,0,0,0,0,31,0,0,0,23,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,23,0,0,0,12,0,0,0,0,0,0,0,20,0,0,0,23,0,0,0,13,0,0,0,0,0,0,0,21,0,0,0,23,0,0,0,19,0,0,0,0,0,0,0,44,0,0,0,23,0,0,0,20,0,0,0,0,0,0,0,46,0,0,0,23,0,0,0,21,0,0,0,0,0,0,0,33,0,0,0,23,0,0,0,29,0,0,0,0,0,0,0,55,0,0,0,23,0,0,0,31,0,0,0,0,0,0,0,46,0,0,0,23,0,0,0,40,0,0,0,0,0,0,0,55,0,0,0,23,0,0,0,41,0,0,0,0,0,0,0,13,0,0,0,23,0,0,0,42,0,0,0,0,0,0,0,57,0,0,0,23,0,0,0,44,0,0,0,0,0,0,0,46,0,0,0,23,0,0,0,45,0,0,0,0,0,0,0,22,0,0,0,23,0,0,0,46,0,0,0,0,0,0,0,45,0,0,0,23,0,0,0,55,0,0,0,0,0,0,0,13,0,0,0,23,0,0,0,56,0,0,0,0,0,0,0,30,0,0,0,23,0,0,0,58,0,0,0,0,0,0,0,13,0,0,0,23,0,0,0,59,0,0,0,0,0,0,0,58,0,0,0,23,0,0,0,68,0,0,0,0,0,0,0,46,0,0,0,23,0,0,0,69,0,0,0,0,0,0,0,55,0,0,0,23,0,0,0,70,0,0,0,0,0,0,0,31,0,0,0,23,0,0,0,79,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,24,0,0,0,3,0,0,0,0,0,0,0,12,0,0,0,24,0,0,0,6,0,0,0,0,0,0,0,42,0,0,0,24,0,0,0,7,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,8,0,0,0,0,0,0,0,14,0,0,0,24,0,0,0,11,0,0,0,0,0,0,0,3,0,0,0,24,0,0,0,12,0,0,0,0,0,0,0,55,0,0,0,24,0,0,0,13,0,0,0,0,0,0,0,55,0,0,0,24,0,0,0,14,0,0,0,0,0,0,0,33,0,0,0,24,0,0,0,15,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,18,0,0,0,0,0,0,0,30,0,0,0,24,0,0,0,19,0,0,0,0,0,0,0,3,0,0,0,24,0,0,0,20,0,0,0,0,0,0,0,13,0,0,0,24,0,0,0,21,0,0,0,0,0,0,0,14,0,0,0,24,0,0,0,22,0,0,0,0,0,0,0,47,0,0,0,24,0,0,0,22,0,0,0,3,0,0,0,42,0,0,0,24,0,0,0,22,0,0,0,6,0,0,0,41,0,0,0,24,0,0,0,22,0,0,0,7,0,0,0,12,0,0,0,24,0,0,0,22,0,0,0,8,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,11,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,12,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,13,0,0,0,14,0,0,0,24,0,0,0,22,0,0,0,14,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,15,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,18,0,0,0,3,0,0,0,24,0,0,0,22,0,0,0,19,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,20,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,21,0,0,0,13,0,0,0,24,0,0,0,22,0,0,0,23,0,0,0,14,0,0,0,24,0,0,0,22,0,0,0,27,0,0,0,20,0,0,0,24,0,0,0,22,0,0,0,28,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,29,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,30,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,31,0,0,0,20,0,0,0,24,0,0,0,22,0,0,0,32,0,0,0,33,0,0,0,24,0,0,0,22,0,0,0,33,0,0,0,31,0,0,0,24,0,0,0,22,0,0,0,34,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,35,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,38,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,39,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,40,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,41,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,42,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,43,0,0,0,20,0,0,0,24,0,0,0,22,0,0,0,44,0,0,0,45,0,0,0,24,0,0,0,22,0,0,0,45,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,46,0,0,0,55,0,0,0,24,0,0,0,22,0,0,0,47,0,0,0,58,0,0,0,24,0,0,0,22,0,0,0,48,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,51,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,52,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,53,0,0,0,20,0,0,0,24,0,0,0,22,0,0,0,54,0,0,0,56,0,0,0,24,0,0,0,22,0,0,0,55,0,0,0,20,0,0,0,24,0,0,0,22,0,0,0,56,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,57,0,0,0,42,0,0,0,24,0,0,0,22,0,0,0,58,0,0,0,45,0,0,0,24,0,0,0,22,0,0,0,59,0,0,0,31,0,0,0,24,0,0,0,22,0,0,0,60,0,0,0,69,0,0,0,24,0,0,0,22,0,0,0,63,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,64,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,65,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,66,0,0,0,13,0,0,0,24,0,0,0,22,0,0,0,67,0,0,0,68,0,0,0,24,0,0,0,22,0,0,0,68,0,0,0,31,0,0,0,24,0,0,0,22,0,0,0,69,0,0,0,42,0,0,0,24,0,0,0,22,0,0,0,70,0,0,0,42,0,0,0,24,0,0,0,22,0,0,0,71,0,0,0,54,0,0,0,24,0,0,0,22,0,0,0,74,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,75,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,76,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,77,0,0,0,45,0,0,0,24,0,0,0,22,0,0,0,78,0,0,0,45,0,0,0,24,0,0,0,22,0,0,0,79,0,0,0,55,0,0,0,24,0,0,0,22,0,0,0,80,0,0,0,47,0,0,0,24,0,0,0,22,0,0,0,81,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,84,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,85,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,86,0,0,0,30,0,0,0,24,0,0,0,22,0,0,0,87,0,0,0,69,0,0,0,24,0,0,0,22,0,0,0,88,0,0,0,42,0,0,0,24,0,0,0,22,0,0,0,89,0,0,0,42,0,0,0,24,0,0,0,22,0,0,0,90,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,93,0,0,0,7,0,0,0,24,0,0,0,22,0,0,0,94,0,0,0,41,0,0,0,24,0,0,0,22,0,0,0,95,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,96,0,0,0,76,0,0,0,24,0,0,0,22,0,0,0,97,0,0,0,77,0,0,0,24,0,0,0,22,0,0,0,98,0,0,0,34,0,0,0])
.concat([24,0,0,0,23,0,0,0,0,0,0,0,47,0,0,0,24,0,0,0,27,0,0,0,0,0,0,0,56,0,0,0,24,0,0,0,28,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,29,0,0,0,0,0,0,0,45,0,0,0,24,0,0,0,30,0,0,0,0,0,0,0,14,0,0,0,24,0,0,0,31,0,0,0,0,0,0,0,14,0,0,0,24,0,0,0,32,0,0,0,0,0,0,0,22,0,0,0,24,0,0,0,33,0,0,0,0,0,0,0,47,0,0,0,24,0,0,0,34,0,0,0,0,0,0,0,21,0,0,0,24,0,0,0,35,0,0,0,0,0,0,0,44,0,0,0,24,0,0,0,38,0,0,0,0,0,0,0,56,0,0,0,24,0,0,0,39,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,40,0,0,0,0,0,0,0,56,0,0,0,24,0,0,0,41,0,0,0,0,0,0,0,14,0,0,0,24,0,0,0,42,0,0,0,0,0,0,0,40,0,0,0,24,0,0,0,43,0,0,0,0,0,0,0,57,0,0,0,24,0,0,0,44,0,0,0,0,0,0,0,47,0,0,0,24,0,0,0,45,0,0,0,0,0,0,0,22,0,0,0,24,0,0,0,46,0,0,0,0,0,0,0,21,0,0,0,24,0,0,0,47,0,0,0,0,0,0,0,46,0,0,0,24,0,0,0,51,0,0,0,0,0,0,0,55,0,0,0,24,0,0,0,52,0,0,0,0,0,0,0,40,0,0,0,24,0,0,0,53,0,0,0,0,0,0,0,40,0,0,0,24,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,24,0,0,0,55,0,0,0,0,0,0,0,20,0,0,0,24,0,0,0,56,0,0,0,0,0,0,0,41,0,0,0,24,0,0,0,57,0,0,0,0,0,0,0,21,0,0,0,24,0,0,0,58,0,0,0,0,0,0,0,46,0,0,0,24,0,0,0,59,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,60,0,0,0,0,0,0,0,55,0,0,0,24,0,0,0,63,0,0,0,0,0,0,0,44,0,0,0,24,0,0,0,64,0,0,0,0,0,0,0,42,0,0,0,24,0,0,0,65,0,0,0,0,0,0,0,14,0,0,0,24,0,0,0,66,0,0,0,0,0,0,0,41,0,0,0,24,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,68,0,0,0,0,0,0,0,30,0,0,0,24,0,0,0,69,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,70,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,71,0,0,0,0,0,0,0,57,0,0,0,24,0,0,0,74,0,0,0,0,0,0,0,52,0,0,0,24,0,0,0,75,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,76,0,0,0,0,0,0,0,44,0,0,0,24,0,0,0,77,0,0,0,0,0,0,0,42,0,0,0,24,0,0,0,78,0,0,0,0,0,0,0,42,0,0,0,24,0,0,0,79,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,80,0,0,0,0,0,0,0,57,0,0,0,24,0,0,0,81,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,84,0,0,0,0,0,0,0,31,0,0,0,24,0,0,0,85,0,0,0,0,0,0,0,66,0,0,0,24,0,0,0,86,0,0,0,0,0,0,0,65,0,0,0,24,0,0,0,87,0,0,0,0,0,0,0,42,0,0,0,24,0,0,0,88,0,0,0,0,0,0,0,30,0,0,0,24,0,0,0,89,0,0,0,0,0,0,0,30,0,0,0,24,0,0,0,90,0,0,0,0,0,0,0,56,0,0,0,24,0,0,0,93,0,0,0,0,0,0,0,65,0,0,0,24,0,0,0,94,0,0,0,0,0,0,0,55,0,0,0,24,0,0,0,95,0,0,0,0,0,0,0,56,0,0,0,24,0,0,0,96,0,0,0,0,0,0,0,42,0,0,0,24,0,0,0,97,0,0,0,0,0,0,0,56,0,0,0,24,0,0,0,98,0,0,0,0,0,0,0,30,0,0,0,25,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,27,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,28,0,0,0,13,0,0,0,0,0,0,0,56,0,0,0,28,0,0,0,20,0,0,0,0,0,0,0,65,0,0,0,28,0,0,0,31,0,0,0,0,0,0,0,54,0,0,0,28,0,0,0,32,0,0,0,0,0,0,0,13,0,0,0,28,0,0,0,42,0,0,0,0,0,0,0,20,0,0,0,28,0,0,0,44,0,0,0,0,0,0,0,31,0,0,0,28,0,0,0,46,0,0,0,0,0,0,0,54,0,0,0,28,0,0,0,53,0,0,0,0,0,0,0,40,0,0,0,28,0,0,0,54,0,0,0,0,0,0,0,21,0,0,0,28,0,0,0,55,0,0,0,0,0,0,0,21,0,0,0,28,0,0,0,56,0,0,0,0,0,0,0,76,0,0,0,28,0,0,0,57,0,0,0,0,0,0,0,76,0,0,0,28,0,0,0,67,0,0,0,0,0,0,0,42,0,0,0,29,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,29,0,0,0,44,0,0,0,0,0,0,0,55,0,0,0,29,0,0,0,45,0,0,0,0,0,0,0,42,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,30,0,0,0,56,0,0,0,0,0,0,0,44,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,31,0,0,0,12,0,0,0,0,0,0,0,40,0,0,0,31,0,0,0,14,0,0,0,0,0,0,0,46,0,0,0,31,0,0,0,21,0,0,0,0,0,0,0,32,0,0,0,31,0,0,0,30,0,0,0,0,0,0,0,55,0,0,0,31,0,0,0,32,0,0,0,0,0,0,0,56,0,0,0,31,0,0,0,40,0,0,0,0,0,0,0,55,0,0,0,31,0,0,0,42,0,0,0,0,0,0,0,56,0,0,0,31,0,0,0,44,0,0,0,0,0,0,0,55,0,0,0,31,0,0,0,46,0,0,0,0,0,0,0,56,0,0,0,31,0,0,0,54,0,0,0,0,0,0,0,41,0,0,0,31,0,0,0,57,0,0,0,0,0,0,0,45,0,0,0,31,0,0,0,65,0,0,0,0,0,0,0,56,0,0,0,31,0,0,0,66,0,0,0,0,0,0,0,56,0,0,0,31,0,0,0,68,0,0,0,0,0,0,0,55,0,0,0,31,0,0,0,69,0,0,0,0,0,0,0,55,0,0,0,31,0,0,0,76,0,0,0,0,0,0,0,41,0,0,0,31,0,0,0,79,0,0,0,0,0,0,0,45,0,0,0,31,0,0,0,87,0,0,0,0,0,0,0,69,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,32,0,0,0,55,0,0,0,0,0,0,0,56,0,0,0,33,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,33,0,0,0,41,0,0,0,0,0,0,0,44,0,0,0,33,0,0,0,42,0,0,0,0,0,0,0,56,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,34,0,0,0,13,0,0,0,0,0,0,0,55,0,0,0,34,0,0,0,22,0,0,0,0,0,0,0,69,0,0,0,34,0,0,0,30,0,0,0,0,0,0,0,13,0,0,0,34,0,0,0,31,0,0,0,0,0,0,0,57,0,0,0,34,0,0,0,40,0,0,0,0,0,0,0,55,0,0,0,34,0,0,0,42,0,0,0,0,0,0,0,31,0,0,0,34,0,0,0,44,0,0,0,0,0,0,0,22,0,0,0,34,0,0,0,54,0,0,0,0,0,0,0,79,0,0,0,34,0,0,0,55,0,0,0,0,0,0,0,79,0,0,0,34,0,0,0,56,0,0,0,0,0,0,0,21,0,0,0,34,0,0,0,57,0,0,0,0,0,0,0,21,0,0,0,34,0,0,0,58,0,0,0,0,0,0,0,46,0,0,0,34,0,0,0,67,0,0,0,0,0,0,0,44,0,0,0,35,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,37,0,0,0,0,0,0,0,0,0,0,0,57,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,39,0,0,0,0,0,0,0,0,0,0,0,57,0,0,0,39,0,0,0,31,0,0,0,0,0,0,0,12,0,0,0,39,0,0,0,41,0,0,0,0,0,0,0,18,0,0,0,39,0,0,0,42,0,0,0,0,0,0,0,18,0,0,0,39,0,0,0,55,0,0,0,0,0,0,0,75,0,0,0,39,0,0,0,57,0,0,0,0,0,0,0,22,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,57,0,0,0,40,0,0,0,32,0,0,0,0,0,0,0,13,0,0,0,40,0,0,0,44,0,0,0,0,0,0,0,56,0,0,0,40,0,0,0,46,0,0,0,0,0,0,0,42,0,0,0,40,0,0,0,56,0,0,0,0,0,0,0,44,0,0,0,40,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,40,0,0,0,67,0,0,0,0,0,0,0,76,0,0,0,40,0,0,0,79,0,0,0,0,0,0,0,42,0,0,0,41,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,41,0,0,0,21,0,0,0,0,0,0,0,55,0,0,0,41,0,0,0,22,0,0,0,0,0,0,0,44,0,0,0,41,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,41,0,0,0,44,0,0,0,0,0,0,0,31,0,0,0,41,0,0,0,56,0,0,0,0,0,0,0,55,0,0,0,41,0,0,0,66,0,0,0,0,0,0,0,31,0,0,0,41,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,41,0,0,0,77,0,0,0,0,0,0,0,56,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,41,0,0,0,42,0,0,0,13,0,0,0,0,0,0,0,44,0,0,0,42,0,0,0,28,0,0,0,0,0,0,0,13,0,0,0,42,0,0,0,30,0,0,0,0,0,0,0,44,0,0,0,42,0,0,0,31,0,0,0,0,0,0,0,56,0,0,0,42,0,0,0,32,0,0,0,0,0,0,0,21,0,0,0,42,0,0,0,33,0,0,0,0,0,0,0,56,0,0,0,42,0,0,0,41,0,0,0,0,0,0,0,30,0,0,0,42,0,0,0,45,0,0,0,0,0,0,0,56,0,0,0,42,0,0,0,46,0,0,0,0,0,0,0,21,0,0,0,42,0,0,0,52,0,0,0,0,0,0,0,76,0,0,0,42,0,0,0,54,0,0,0,0,0,0,0,56,0,0,0,42,0,0,0,55,0,0,0,0,0,0,0,44,0,0,0,42,0,0,0,67,0,0,0,0,0,0,0,66,0,0,0,42,0,0,0,68,0,0,0,0,0,0,0,44,0,0,0,42,0,0,0,70,0,0,0,0,0,0,0,33,0,0,0,42,0,0,0,76,0,0,0,0,0,0,0,56,0,0,0,42,0,0,0,78,0,0,0,0,0,0,0,44,0,0,0,42,0,0,0,79,0,0,0,0,0,0,0,66,0,0,0,43,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,43,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,43,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,43,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,43,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,43,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,45,0,0,0,44,0,0,0,13,0,0,0,0,0,0,0,42,0,0,0,44,0,0,0,29,0,0,0,0,0,0,0,55,0,0,0,44,0,0,0,30,0,0,0,0,0,0,0,21,0,0,0,44,0,0,0,31,0,0,0,0,0,0,0,55,0,0,0,44,0,0,0,32,0,0,0,0,0,0,0,42,0,0,0,44,0,0,0,34,0,0,0,0,0,0,0,13,0,0,0,44,0,0,0,40,0,0,0,0,0,0,0,21,0,0,0,44,0,0,0,41,0,0,0,0,0,0,0,55,0,0,0,44,0,0,0,45,0,0,0,0,0,0,0,32,0,0,0,44,0,0,0,56,0,0,0,0,0,0,0,42,0,0,0,44,0,0,0,57,0,0,0,0,0,0,0,55,0,0,0,44,0,0,0,59,0,0,0,0,0,0,0,79,0,0,0,44,0,0,0,64,0,0,0,0,0,0,0,29,0,0,0,44,0,0,0,66,0,0,0,0,0,0,0,42,0,0,0,44,0,0,0,67,0,0,0,0,0,0,0,68,0,0,0,44,0,0,0,76,0,0,0,0,0,0,0,68,0,0,0,44,0,0,0,77,0,0,0,0,0,0,0,42,0,0,0,44,0,0,0,79,0,0,0,0,0,0,0,55,0,0,0,45,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,45,0,0,0,20,0,0,0,0,0,0,0,42,0,0,0,45,0,0,0,21,0,0,0,0,0,0,0,56,0,0,0,45,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,45,0,0,0,42,0,0,0,0,0,0,0,31,0,0,0,45,0,0,0,55,0,0,0,0,0,0,0,56,0,0,0,45,0,0,0,67,0,0,0,0,0,0,0,31,0,0,0,45,0,0,0,68,0,0,0,0,0,0,0,31,0,0,0,45,0,0,0,78,0,0,0,0,0,0,0,55,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,46,0,0,0,30,0,0,0,0,0,0,0,13,0,0,0,46,0,0,0,40,0,0,0,0,0,0,0,44,0,0,0,46,0,0,0,42,0,0,0,0,0,0,0,55,0,0,0,46,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,46,0,0,0,55,0,0,0,0,0,0,0,42,0,0,0,46,0,0,0,67,0,0,0,0,0,0,0,79,0,0,0,46,0,0,0,76,0,0,0,0,0,0,0,44,0,0,0,47,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,47,0,0,0,31,0,0,0,0,0,0,0,14,0,0,0,47,0,0,0,44,0,0,0,0,0,0,0,24,0,0,0,47,0,0,0,45,0,0,0,0,0,0,0,24,0,0,0,47,0,0,0,54,0,0,0,0,0,0,0,20,0,0,0,47,0,0,0,56,0,0,0,0,0,0,0,80,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,49,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,51,0,0,0,0,0,0,0,0,0,0,0,53,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,52,0,0,0,29,0,0,0,0,0,0,0,40,0,0,0,52,0,0,0,30,0,0,0,0,0,0,0,66,0,0,0,52,0,0,0,31,0,0,0,0,0,0,0,55,0,0,0,52,0,0,0,32,0,0,0,0,0,0,0,42,0,0,0,52,0,0,0,42,0,0,0,0,0,0,0,65,0,0,0,52,0,0,0,44,0,0,0,0,0,0,0,13,0,0,0,52,0,0,0,55,0,0,0,0,0,0,0,30,0,0,0,52,0,0,0,56,0,0,0,0,0,0,0,55,0,0,0,52,0,0,0,57,0,0,0,0,0,0,0,13,0,0,0,52,0,0,0,65,0,0,0,0,0,0,0,20,0,0,0,52,0,0,0,67,0,0,0,0,0,0,0,76,0,0,0,52,0,0,0,76,0,0,0,0,0,0,0,44,0,0,0,52,0,0,0,79,0,0,0,0,0,0,0,30,0,0,0,53,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,53,0,0,0,56,0,0,0,0,0,0,0,31,0,0,0,53,0,0,0,68,0,0,0,0,0,0,0,42,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,54,0,0,0,44,0,0,0,0,0,0,0,31,0,0,0,55,0,0,0,0,0,0,0,0,0,0,0,66,0,0,0,55,0,0,0,13,0,0,0,0,0,0,0,41,0,0,0,55,0,0,0,20,0,0,0,0,0,0,0,44,0,0,0,55,0,0,0,21,0,0,0,0,0,0,0,44,0,0,0,55,0,0,0,23,0,0,0,0,0,0,0,20,0,0,0,55,0,0,0,30,0,0,0,0,0,0,0,41,0,0,0,55,0,0,0,40,0,0,0,0,0,0,0,31,0,0,0,55,0,0,0,42,0,0,0,0,0,0,0,44,0,0,0,55,0,0,0,45,0,0,0,0,0,0,0,31,0,0,0,55,0,0,0,46,0,0,0,0,0,0,0,68,0,0,0,55,0,0,0,54,0,0,0,0,0,0,0,31,0,0,0,55,0,0,0,56,0,0,0,0,0,0,0,31,0,0,0,55,0,0,0,57,0,0,0,0,0,0,0,68,0,0,0,55,0,0,0,58,0,0,0,0,0,0,0,31,0,0,0,55,0,0,0,66,0,0,0,0,0,0,0,54,0,0,0,55,0,0,0,67,0,0,0,0,0,0,0,44,0,0,0,55,0,0,0,75,0,0,0,0,0,0,0,40,0,0,0,55,0,0,0,79,0,0,0,0,0,0,0,44,0,0,0,55,0,0,0,86,0,0,0,0,0,0,0,79,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,56,0,0,0,13,0,0,0,0,0,0,0,45,0,0,0,56,0,0,0,19,0,0,0,0,0,0,0,22,0,0,0,56,0,0,0,21,0,0,0,0,0,0,0,42,0,0,0,56,0,0,0,22,0,0,0,0,0,0,0,42,0,0,0,56,0,0,0,32,0,0,0,0,0,0,0,45,0,0,0,56,0,0,0,40,0,0,0,0,0,0,0,66,0,0,0,56,0,0,0,41,0,0,0,0,0,0,0,31,0,0,0,56,0,0,0,44,0,0,0,0,0,0,0,42,0,0,0,56,0,0,0,46,0,0,0,0,0,0,0,31,0,0,0,56,0,0,0,53,0,0,0,0,0,0,0,31,0,0,0,56,0,0,0,54,0,0,0,0,0,0,0,66,0,0,0,56,0,0,0,55,0,0,0,0,0,0,0,31,0,0,0,56,0,0,0,57,0,0,0,0,0,0,0,31,0,0,0,56,0,0,0,67,0,0,0,0,0,0,0,42,0,0,0,56,0,0,0,68,0,0,0,0,0,0,0,57,0,0,0,56,0,0,0,76,0,0,0,0,0,0,0,42,0,0,0,56,0,0,0,80,0,0,0,0,0,0,0,46,0,0,0,56,0,0,0,88,0,0,0,0,0,0,0,76,0,0,0,57,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,57,0,0,0,42,0,0,0,0,0,0,0,31,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,58,0,0,0,55,0,0,0,0,0,0,0,31,0,0,0,58,0,0,0,66,0,0,0,0,0,0,0,44,0,0,0,59,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,59,0,0,0,30,0,0,0,0,0,0,0,44,0,0,0,59,0,0,0,31,0,0,0,0,0,0,0,56,0,0,0,59,0,0,0,32,0,0,0,0,0,0,0,68,0,0,0,59,0,0,0,33,0,0,0,0,0,0,0,46,0,0,0,59,0,0,0,42,0,0,0,0,0,0,0,13,0,0,0,59,0,0,0,44,0,0,0,0,0,0,0,69,0,0,0,59,0,0,0,54,0,0,0,0,0,0,0,13,0,0,0,59,0,0,0,55,0,0,0,0,0,0,0,56,0,0,0,59,0,0,0,56,0,0,0,0,0,0,0,32,0,0,0,59,0,0,0,67,0,0,0,0,0,0,0,79,0,0,0,59,0,0,0,69,0,0,0,0,0,0,0,22,0,0,0,59,0,0,0,76,0,0,0,0,0,0,0,32,0,0,0,59,0,0,0,79,0,0,0,0,0,0,0,42,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,58,0,0,0,61,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,63,0,0,0,3,0,0,0,0,0,0,0,31,0,0,0,63,0,0,0,6,0,0,0,0,0,0,0,31,0,0,0,63,0,0,0,7,0,0,0,0,0,0,0,67,0,0,0,63,0,0,0,8,0,0,0,0,0,0,0,31,0,0,0,63,0,0,0,11,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,12,0,0,0,0,0,0,0,30,0,0,0,63,0,0,0,13,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,14,0,0,0,0,0,0,0,67,0,0,0,63,0,0,0,15,0,0,0,0,0,0,0,56,0,0,0,63,0,0,0,18,0,0,0,0,0,0,0,30,0,0,0,63,0,0,0,19,0,0,0,0,0,0,0,39,0,0,0,63,0,0,0,20,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,21,0,0,0,0,0,0,0,67,0,0,0,63,0,0,0,22,0,0,0,0,0,0,0,56,0,0,0,63,0,0,0,23,0,0,0,0,0,0,0,56,0,0,0,63,0,0,0,24,0,0,0,0,0,0,0,31,0,0,0,63,0,0,0,27,0,0,0,0,0,0,0,44,0,0,0,63,0,0,0,28,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,29,0,0,0,0,0,0,0,40,0,0,0,63,0,0,0,30,0,0,0,0,0,0,0,66,0,0,0,63,0,0,0,31,0,0,0,0,0,0,0,68,0,0,0,63,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,33,0,0,0,0,0,0,0,56,0,0,0,63,0,0,0,34,0,0,0,0,0,0,0,58,0,0,0,63,0,0,0,35,0,0,0,0,0,0,0,44,0,0,0,63,0,0,0,39,0,0,0,0,0,0,0,40,0,0,0,63,0,0,0,40,0,0,0,0,0,0,0,65,0,0,0,63,0,0,0,41,0,0,0,0,0,0,0,65,0,0,0,63,0,0,0,42,0,0,0,0,0,0,0,39,0,0,0,63,0,0,0,43,0,0,0,0,0,0,0,30,0,0,0,63,0,0,0,44,0,0,0,0,0,0,0,77,0,0,0,63,0,0,0,45,0,0,0,0,0,0,0,68,0,0,0,63,0,0,0,46,0,0,0,0,0,0,0,42,0,0,0,63,0,0,0,47,0,0,0,0,0,0,0,45,0,0,0,63,0,0,0,48,0,0,0,0,0,0,0,58,0,0,0,63,0,0,0,51,0,0,0,0,0,0,0,42,0,0,0,63,0,0,0,52,0,0,0,0,0,0,0,66,0,0,0,63,0,0,0,53,0,0,0,0,0,0,0,39,0,0,0,63,0,0,0,54,0,0,0,0,0,0,0,65,0,0,0,63,0,0,0,55,0,0,0,0,0,0,0,75,0,0,0,63,0,0,0,56,0,0,0,0,0,0,0,79,0,0,0,63,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,63,0,0,0,58,0,0,0,0,0,0,0,75,0,0,0,63,0,0,0,59,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,60,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,64,0,0,0,0,0,0,0,39,0,0,0,63,0,0,0,65,0,0,0,0,0,0,0,21,0,0,0,63,0,0,0,65,0,0,0,3,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,6,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,7,0,0,0,56,0,0,0,63,0,0,0,65,0,0,0,8,0,0,0,33,0,0,0,63,0,0,0,65,0,0,0,11,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,12,0,0,0,39,0,0,0,63,0,0,0,65,0,0,0,13,0,0,0,44,0,0,0,63,0,0,0,65,0,0,0,14,0,0,0,56,0,0,0,63,0,0,0,65,0,0,0,15,0,0,0,46,0,0,0,63,0,0,0,65,0,0,0,18,0,0,0,57,0,0,0,63,0,0,0,65,0,0,0,19,0,0,0,56,0,0,0,63,0,0,0,65,0,0,0,20,0,0,0,28,0,0,0,63,0,0,0,65,0,0,0,21,0,0,0,55,0,0,0,63,0,0,0,65,0,0,0,22,0,0,0,41,0,0,0,63,0,0,0,65,0,0,0,23,0,0,0,20,0,0,0,63,0,0,0,65,0,0,0,24,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,27,0,0,0,20,0,0,0,63,0,0,0,65,0,0,0,28,0,0,0,55,0,0,0,63,0,0,0,65,0,0,0,29,0,0,0,41,0,0,0,63,0,0,0,65,0,0,0,30,0,0,0,56,0,0,0,63,0,0,0,65,0,0,0,31,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,32,0,0,0,21,0,0,0,63,0,0,0,65,0,0,0,33,0,0,0,41,0,0,0,63,0,0,0,65,0,0,0,34,0,0,0,67,0,0,0,63,0,0,0,65,0,0,0,35,0,0,0,41,0,0,0,63,0,0,0,65,0,0,0,38,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,39,0,0,0,29,0,0,0,63,0,0,0,65,0,0,0,40,0,0,0,44,0,0,0,63,0,0,0,65,0,0,0,41,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,42,0,0,0,41,0,0,0,63,0,0,0,65,0,0,0,43,0,0,0,77,0,0,0,63,0,0,0,65,0,0,0,44,0,0,0,77,0,0,0,63,0,0,0,65,0,0,0,45,0,0,0,76,0,0,0,63,0,0,0,65,0,0,0,46,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,47,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,48,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,51,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,52,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,53,0,0,0,55,0,0,0,63,0,0,0,65,0,0,0,54,0,0,0,53,0,0,0,63,0,0,0,65,0,0,0,55,0,0,0,77,0,0,0,63,0,0,0,65,0,0,0,56,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,57,0,0,0,31,0,0,0,63,0,0,0,65,0,0,0,58,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,59,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,60,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,64,0,0,0,41,0,0,0,63,0,0,0,65,0,0,0,66,0,0,0,76,0,0,0,63,0,0,0,65,0,0,0,67,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,68,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,69,0,0,0,77,0,0,0,63,0,0,0,65,0,0,0,70,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,71,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,74,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,75,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,76,0,0,0,75,0,0,0,63,0,0,0,65,0,0,0,77,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,78,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,79,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,80,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,81,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,84,0,0,0,52,0,0,0,63,0,0,0,65,0,0,0,85,0,0,0,86,0,0,0,63,0,0,0,65,0,0,0,86,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,87,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,88,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,89,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,90,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,93,0,0,0,56,0,0,0,63,0,0,0,65,0,0,0,94,0,0,0,68,0,0,0,63,0,0,0,65,0,0,0,95,0,0,0,85,0,0,0,63,0,0,0,65,0,0,0,96,0,0,0,93,0,0,0,63,0,0,0,65,0,0,0,97,0,0,0,77,0,0,0,63,0,0,0,65,0,0,0,98,0,0,0,85,0,0,0,63,0,0,0,66,0,0,0,0,0,0,0,53,0,0,0,63,0,0,0,67,0,0,0,0,0,0,0,75,0,0,0,63,0,0,0,68,0,0,0,0,0,0,0,75,0,0,0,63,0,0,0,69,0,0,0,0,0,0,0,79,0,0,0,63,0,0,0,70,0,0,0,0,0,0,0,56,0,0,0,63,0,0,0,71,0,0,0,0,0,0,0,80,0,0,0,63,0,0,0,74,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,75,0,0,0,0,0,0,0,53,0,0,0,63,0,0,0,76,0,0,0,0,0,0,0,44,0,0,0,63,0,0,0,77,0,0,0,0,0,0,0,76,0,0,0,63,0,0,0,78,0,0,0,0,0,0,0,21,0,0,0,63,0,0,0,79,0,0,0,0,0,0,0,31,0,0,0,63,0,0,0,80,0,0,0,0,0,0,0,79,0,0,0,63,0,0,0,81,0,0,0,0,0,0,0,42,0,0,0,63,0,0,0,84,0,0,0,0,0,0,0,75,0,0,0,63,0,0,0,85,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,86,0,0,0,0,0,0,0,44,0,0,0,63,0,0,0,87,0,0,0,0,0,0,0,93,0,0,0,63,0,0,0,88,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,89,0,0,0,0,0,0,0,55,0,0,0,63,0,0,0,90,0,0,0,0,0,0,0,44,0,0,0,63,0,0,0,93,0,0,0,0,0,0,0,56,0,0,0,63,0,0,0,94,0,0,0,0,0,0,0,56,0,0,0,63,0,0,0,95,0,0,0,0,0,0,0,93,0,0,0,63,0,0,0,96,0,0,0,0,0,0,0,67,0,0,0,63,0,0,0,97,0,0,0,0,0,0,0,31,0,0,0,63,0,0,0,98,0,0,0,0,0,0,0,31,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,29,0,0,0,64,0,0,0,13,0,0,0,0,0,0,0,55,0,0,0,64,0,0,0,19,0,0,0,0,0,0,0,55,0,0,0,64,0,0,0,20,0,0,0,0,0,0,0,44,0,0,0,64,0,0,0,21,0,0,0,0,0,0,0,40,0,0,0,64,0,0,0,28,0,0,0,0,0,0,0,29,0,0,0,64,0,0,0,29,0,0,0,0,0,0,0,76,0,0,0,64,0,0,0,31,0,0,0,0,0,0,0,67,0,0,0,64,0,0,0,40,0,0,0,0,0,0,0,41,0,0,0,64,0,0,0,41,0,0,0,0,0,0,0,65,0,0,0,64,0,0,0,42,0,0,0,0,0,0,0,76,0,0,0,64,0,0,0,44,0,0,0,0,0,0,0,31,0,0,0,64,0,0,0,55,0,0,0,0,0,0,0,40,0,0,0,64,0,0,0,56,0,0,0,0,0,0,0,30,0,0,0,64,0,0,0,66,0,0,0,0,0,0,0,53,0,0,0,64,0,0,0,68,0,0,0,0,0,0,0,76,0,0,0,64,0,0,0,76,0,0,0,0,0,0,0,66,0,0,0,64,0,0,0,77,0,0,0,0,0,0,0,40,0,0,0,64,0,0,0,78,0,0,0,0,0,0,0,44,0,0,0,64,0,0,0,79,0,0,0,0,0,0,0,42,0,0,0,64,0,0,0,86,0,0,0,0,0,0,0,77,0,0,0,64,0,0,0,87,0,0,0,0,0,0,0,42,0,0,0,65,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,65,0,0,0,21,0,0,0,0,0,0,0,55,0,0,0,65,0,0,0,31,0,0,0,0,0,0,0,56,0,0,0,66,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,66,0,0,0,29,0,0,0,0,0,0,0,31,0,0,0,66,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,66,0,0,0,31,0,0,0,0,0,0,0,42,0,0,0,66,0,0,0,41,0,0,0,0,0,0,0,56,0,0,0,66,0,0,0,44,0,0,0,0,0,0,0,56,0,0,0,66,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,66,0,0,0,68,0,0,0,0,0,0,0,42,0,0,0,66,0,0,0,69,0,0,0,0,0,0,0,44,0,0,0,67,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,67,0,0,0,31,0,0,0,0,0,0,0,42,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,68,0,0,0,31,0,0,0,0,0,0,0,44,0,0,0,68,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,68,0,0,0,33,0,0,0,0,0,0,0,31,0,0,0,68,0,0,0,42,0,0,0,0,0,0,0,55,0,0,0,68,0,0,0,45,0,0,0,0,0,0,0,55,0,0,0,68,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,68,0,0,0,65,0,0,0,0,0,0,0,42,0,0,0,68,0,0,0,66,0,0,0,0,0,0,0,44,0,0,0,69,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,69,0,0,0,21,0,0,0,0,0,0,0,56,0,0,0,69,0,0,0,31,0,0,0,0,0,0,0,55,0,0,0,70,0,0,0,0,0,0,0,0,0,0,0,33,0,0,0,70,0,0,0,13,0,0,0,0,0,0,0,56,0,0,0,70,0,0,0,21,0,0,0,0,0,0,0,46,0,0,0,70,0,0,0,22,0,0,0,0,0,0,0,42,0,0,0,70,0,0,0,23,0,0,0,0,0,0,0,56,0,0,0,70,0,0,0,31,0,0,0,0,0,0,0,67,0,0,0,70,0,0,0,33,0,0,0,0,0,0,0,79,0,0,0,70,0,0,0,34,0,0,0,0,0,0,0,33,0,0,0,70,0,0,0,42,0,0,0,0,0,0,0,31,0,0,0,70,0,0,0,44,0,0,0,0,0,0,0,79,0,0,0,70,0,0,0,45,0,0,0,0,0,0,0,69,0,0,0,70,0,0,0,46,0,0,0,0,0,0,0,45,0,0,0,70,0,0,0,55,0,0,0,0,0,0,0,32,0,0,0,70,0,0,0,56,0,0,0,0,0,0,0,46,0,0,0,70,0,0,0,66,0,0,0,0,0,0,0,79,0,0,0,70,0,0,0,68,0,0,0,0,0,0,0,58,0,0,0,70,0,0,0,76,0,0,0,0,0,0,0,44,0,0,0,70,0,0,0,77,0,0,0,0,0,0,0,42,0,0,0,70,0,0,0,78,0,0,0,0,0,0,0,46,0,0,0,70,0,0,0,79,0,0,0,0,0,0,0,68,0,0,0,70,0,0,0,87,0,0,0,0,0,0,0,44,0,0,0,70,0,0,0,88,0,0,0,0,0,0,0,78,0,0,0,71,0,0,0,0,0,0,0,0,0,0,0,69,0,0,0,71,0,0,0,3,0,0,0,0,0,0,0,31,0,0,0,71,0,0,0,6,0,0,0,0,0,0,0,31,0,0,0,71,0,0,0,7,0,0,0,0,0,0,0,67,0,0,0,71,0,0,0,8,0,0,0,0,0,0,0,31,0,0,0,71,0,0,0,11,0,0,0,0,0,0,0,55,0,0,0,71,0,0,0,12,0,0,0,0,0,0,0,67,0,0,0,71,0,0,0,13,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,14,0,0,0,0,0,0,0,32,0,0,0,71,0,0,0,15,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,18,0,0,0,0,0,0,0,31,0,0,0,71,0,0,0,19,0,0,0,0,0,0,0,55,0,0,0,71,0,0,0,20,0,0,0,0,0,0,0,55,0,0,0,71,0,0,0,21,0,0,0,0,0,0,0,67,0,0,0,71,0,0,0,22,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,23,0,0,0,0,0,0,0,47,0,0,0,71,0,0,0,24,0,0,0,0,0,0,0,32,0,0,0,71,0,0,0,27,0,0,0,0,0,0,0,42,0,0,0,71,0,0,0,28,0,0,0,0,0,0,0,53,0,0,0,71,0,0,0,29,0,0,0,0,0,0,0,55,0,0,0,71,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,31,0,0,0,0,0,0,0,66,0,0,0,71,0,0,0,32,0,0,0,0,0,0,0,68,0,0,0,71,0,0,0,33,0,0,0,0,0,0,0,46,0,0,0,71,0,0,0,34,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,35,0,0,0,0,0,0,0,42,0,0,0,71,0,0,0,38,0,0,0,0,0,0,0,53,0,0,0,71,0,0,0,39,0,0,0,0,0,0,0,41,0,0,0,71,0,0,0,40,0,0,0,0,0,0,0,44,0,0,0,71,0,0,0,41,0,0,0,0,0,0,0,66,0,0,0,71,0,0,0,42,0,0,0,0,0,0,0,78,0,0,0,71,0,0,0,43,0,0,0,0,0,0,0,32,0,0,0,71,0,0,0,44,0,0,0,0,0,0,0,47,0,0,0,71,0,0,0,45,0,0,0,0,0,0,0,69,0,0,0,71,0,0,0,46,0,0,0,0,0,0,0,68,0,0,0,71,0,0,0,47,0,0,0,0,0,0,0,46,0,0,0,71,0,0,0,51,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,52,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,53,0,0,0,0,0,0,0,80,0,0,0,71,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,71,0,0,0,55,0,0,0,0,0,0,0,76,0,0,0,71,0,0,0,56,0,0,0,0,0,0,0,80,0,0,0,71,0,0,0,57,0,0,0,0,0,0,0,69,0,0,0,71,0,0,0,58,0,0,0,0,0,0,0,47,0,0,0,71,0,0,0,59,0,0,0,0,0,0,0,68,0,0,0,71,0,0,0,60,0,0,0,0,0,0,0,44,0,0,0,71,0,0,0,63,0,0,0,0,0,0,0,75,0,0,0,71,0,0,0,64,0,0,0,0,0,0,0,55,0,0,0,71,0,0,0,65,0,0,0,0,0,0,0,76,0,0,0,71,0,0,0,66,0,0,0,0,0,0,0,80,0,0,0,71,0,0,0,67,0,0,0,0,0,0,0,80,0,0,0,71,0,0,0,68,0,0,0,0,0,0,0,58,0,0,0,71,0,0,0,69,0,0,0,0,0,0,0,21,0,0,0,71,0,0,0,69,0,0,0,3,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,6,0,0,0,29,0,0,0,71,0,0,0,69,0,0,0,7,0,0,0,55,0,0,0,71,0,0,0,69,0,0,0,8,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,11,0,0,0,40,0,0,0,71,0,0,0,69,0,0,0,12,0,0,0,55,0,0,0,71,0,0,0,69,0,0,0,13,0,0,0,42,0,0,0,71,0,0,0,69,0,0,0,14,0,0,0,47,0,0,0,71,0,0,0,69,0,0,0,15,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,18,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,19,0,0,0,22,0,0,0,71,0,0,0,69,0,0,0,20,0,0,0,45,0,0,0,71,0,0,0,69,0,0,0,21,0,0,0,56,0,0,0,71,0,0,0,69,0,0,0,22,0,0,0,34,0,0,0,71,0,0,0,69,0,0,0,23,0,0,0,55,0,0,0,71,0,0,0,69,0,0,0,24,0,0,0,54,0,0,0,71,0,0,0,69,0,0,0,27,0,0,0,45,0,0,0,71,0,0,0,69,0,0,0,28,0,0,0,67,0,0,0,71,0,0,0,69,0,0,0,29,0,0,0,45,0,0,0,71,0,0,0,69,0,0,0,30,0,0,0,21,0,0,0,71,0,0,0,69,0,0,0,31,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,32,0,0,0,55,0,0,0,71,0,0,0,69,0,0,0,33,0,0,0,45,0,0,0,71,0,0,0,69,0,0,0,34,0,0,0,56,0,0,0,71,0,0,0,69,0,0,0,35,0,0,0,22,0,0,0,71,0,0,0,69,0,0,0,38,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,39,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,40,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,41,0,0,0,79,0,0,0,71,0,0,0,69,0,0,0,42,0,0,0,78,0,0,0,71,0,0,0,69,0,0,0,43,0,0,0,78,0,0,0,71,0,0,0,69,0,0,0,44,0,0,0,45,0,0,0,71,0,0,0,69,0,0,0,45,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,46,0,0,0,42,0,0,0,71,0,0,0,69,0,0,0,47,0,0,0,33,0,0,0,71,0,0,0,69,0,0,0,48,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,51,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,52,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,53,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,54,0,0,0,31,0,0,0,71,0,0,0,69,0,0,0,55,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,56,0,0,0,78,0,0,0,71,0,0,0,69,0,0,0,57,0,0,0,58,0,0,0,71,0,0,0,69,0,0,0,58,0,0,0,56,0,0,0,71,0,0,0,69,0,0,0,59,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,60,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,63,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,64,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,65,0,0,0,78,0,0,0,71,0,0,0,69,0,0,0,66,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,67,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,68,0,0,0,79,0,0,0,71,0,0,0,69,0,0,0,70,0,0,0,45,0,0,0,71,0,0,0,69,0,0,0,74,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,75,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,76,0,0,0,87,0,0,0,71,0,0,0,69,0,0,0,77,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,78,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,79,0,0,0,80,0,0,0,71,0,0,0,69,0,0,0,80,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,81,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,84,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,85,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,86,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,87,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,88,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,89,0,0,0,88,0,0,0,71,0,0,0,69,0,0,0,90,0,0,0,59,0,0,0,71,0,0,0,69,0,0,0,93,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,94,0,0,0,78,0,0,0,71,0,0,0,69,0,0,0,95,0,0,0,98,0,0,0])
.concat([71,0,0,0,69,0,0,0,96,0,0,0,89,0,0,0,71,0,0,0,69,0,0,0,97,0,0,0,66,0,0,0,71,0,0,0,69,0,0,0,98,0,0,0,55,0,0,0,71,0,0,0,70,0,0,0,0,0,0,0,47,0,0,0,71,0,0,0,74,0,0,0,0,0,0,0,44,0,0,0,71,0,0,0,75,0,0,0,0,0,0,0,76,0,0,0,71,0,0,0,76,0,0,0,0,0,0,0,31,0,0,0,71,0,0,0,77,0,0,0,0,0,0,0,21,0,0,0,71,0,0,0,78,0,0,0,0,0,0,0,79,0,0,0,71,0,0,0,79,0,0,0,0,0,0,0,42,0,0,0,71,0,0,0,80,0,0,0,0,0,0,0,58,0,0,0,71,0,0,0,81,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,84,0,0,0,0,0,0,0,42,0,0,0,71,0,0,0,85,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,86,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,87,0,0,0,0,0,0,0,98,0,0,0,71,0,0,0,88,0,0,0,0,0,0,0,42,0,0,0,71,0,0,0,89,0,0,0,0,0,0,0,56,0,0,0,71,0,0,0,90,0,0,0,0,0,0,0,80,0,0,0,71,0,0,0,93,0,0,0,0,0,0,0,31,0,0,0,71,0,0,0,94,0,0,0,0,0,0,0,31,0,0,0,71,0,0,0,95,0,0,0,0,0,0,0,67,0,0,0,71,0,0,0,96,0,0,0,0,0,0,0,98,0,0,0,71,0,0,0,97,0,0,0,0,0,0,0,55,0,0,0,71,0,0,0,98,0,0,0,0,0,0,0,55,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,73,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,74,0,0,0,0,0,0,0,0,0,0,0,53,0,0,0,74,0,0,0,3,0,0,0,0,0,0,0,56,0,0,0,74,0,0,0,6,0,0,0,0,0,0,0,56,0,0,0,74,0,0,0,7,0,0,0,0,0,0,0,30,0,0,0,74,0,0,0,8,0,0,0,0,0,0,0,44,0,0,0,74,0,0,0,11,0,0,0,0,0,0,0,30,0,0,0,74,0,0,0,12,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,13,0,0,0,0,0,0,0,56,0,0,0,74,0,0,0,14,0,0,0,0,0,0,0,13,0,0,0,74,0,0,0,15,0,0,0,0,0,0,0,55,0,0,0,74,0,0,0,18,0,0,0,0,0,0,0,38,0,0,0,74,0,0,0,19,0,0,0,0,0,0,0,38,0,0,0,74,0,0,0,20,0,0,0,0,0,0,0,68,0,0,0,74,0,0,0,21,0,0,0,0,0,0,0,52,0,0,0,74,0,0,0,22,0,0,0,0,0,0,0,13,0,0,0,74,0,0,0,23,0,0,0,0,0,0,0,31,0,0,0,74,0,0,0,24,0,0,0,0,0,0,0,14,0,0,0,74,0,0,0,27,0,0,0,0,0,0,0,31,0,0,0,74,0,0,0,28,0,0,0,0,0,0,0,44,0,0,0,74,0,0,0,29,0,0,0,0,0,0,0,40,0,0,0,74,0,0,0,30,0,0,0,0,0,0,0,52,0,0,0,74,0,0,0,31,0,0,0,0,0,0,0,13,0,0,0,74,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,74,0,0,0,33,0,0,0,0,0,0,0,52,0,0,0,74,0,0,0,34,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,35,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,38,0,0,0,0,0,0,0,28,0,0,0,74,0,0,0,39,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,40,0,0,0,0,0,0,0,44,0,0,0,74,0,0,0,41,0,0,0,0,0,0,0,52,0,0,0,74,0,0,0,42,0,0,0,0,0,0,0,52,0,0,0,74,0,0,0,43,0,0,0,0,0,0,0,67,0,0,0,74,0,0,0,44,0,0,0,0,0,0,0,29,0,0,0,74,0,0,0,45,0,0,0,0,0,0,0,21,0,0,0,74,0,0,0,46,0,0,0,0,0,0,0,55,0,0,0,74,0,0,0,47,0,0,0,0,0,0,0,45,0,0,0,74,0,0,0,48,0,0,0,0,0,0,0,33,0,0,0,74,0,0,0,51,0,0,0,0,0,0,0,52,0,0,0,74,0,0,0,52,0,0,0,0,0,0,0,65,0,0,0,74,0,0,0,53,0,0,0,0,0,0,0,68,0,0,0,74,0,0,0,53,0,0,0,3,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,6,0,0,0,29,0,0,0,74,0,0,0,53,0,0,0,7,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,8,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,11,0,0,0,38,0,0,0,74,0,0,0,53,0,0,0,12,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,13,0,0,0,19,0,0,0,74,0,0,0,53,0,0,0,14,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,15,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,18,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,19,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,20,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,21,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,22,0,0,0,29,0,0,0,74,0,0,0,53,0,0,0,23,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,24,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,27,0,0,0,21,0,0,0,74,0,0,0,53,0,0,0,28,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,29,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,30,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,31,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,32,0,0,0,56,0,0,0,74,0,0,0,53,0,0,0,33,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,34,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,35,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,38,0,0,0,31,0,0,0,74,0,0,0,53,0,0,0,39,0,0,0,28,0,0,0,74,0,0,0,53,0,0,0,40,0,0,0,52,0,0,0,74,0,0,0,53,0,0,0,41,0,0,0,40,0,0,0,74,0,0,0,53,0,0,0,42,0,0,0,29,0,0,0,74,0,0,0,53,0,0,0,43,0,0,0,29,0,0,0,74,0,0,0,53,0,0,0,44,0,0,0,29,0,0,0,74,0,0,0,53,0,0,0,45,0,0,0,40,0,0,0,74,0,0,0,53,0,0,0,46,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,47,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,48,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,51,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,52,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,54,0,0,0,65,0,0,0,74,0,0,0,53,0,0,0,55,0,0,0,66,0,0,0,74,0,0,0,53,0,0,0,56,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,57,0,0,0,68,0,0,0,74,0,0,0,53,0,0,0,58,0,0,0,66,0,0,0,74,0,0,0,53,0,0,0,59,0,0,0,30,0,0,0,74,0,0,0,53,0,0,0,60,0,0,0,21,0,0,0,74,0,0,0,53,0,0,0,63,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,64,0,0,0,52,0,0,0,74,0,0,0,53,0,0,0,65,0,0,0,42,0,0,0,74,0,0,0,53,0,0,0,66,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,67,0,0,0,31,0,0,0,74,0,0,0,53,0,0,0,68,0,0,0,42,0,0,0,74,0,0,0,53,0,0,0,69,0,0,0,66,0,0,0,74,0,0,0,53,0,0,0,70,0,0,0,78,0,0,0,74,0,0,0,53,0,0,0,71,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,75,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,76,0,0,0,44,0,0,0,74,0,0,0,53,0,0,0,77,0,0,0,66,0,0,0,74,0,0,0,53,0,0,0,78,0,0,0,31,0,0,0,74,0,0,0,53,0,0,0,79,0,0,0,44,0,0,0,74,0,0,0,53,0,0,0,80,0,0,0,31,0,0,0,74,0,0,0,53,0,0,0,81,0,0,0,46,0,0,0,74,0,0,0,53,0,0,0,84,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,85,0,0,0,77,0,0,0,74,0,0,0,53,0,0,0,86,0,0,0,42,0,0,0,74,0,0,0,53,0,0,0,87,0,0,0,31,0,0,0,74,0,0,0,53,0,0,0,88,0,0,0,85,0,0,0,74,0,0,0,53,0,0,0,89,0,0,0,31,0,0,0,74,0,0,0,53,0,0,0,90,0,0,0,58,0,0,0,74,0,0,0,53,0,0,0,93,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,94,0,0,0,78,0,0,0,74,0,0,0,53,0,0,0,95,0,0,0,32,0,0,0,74,0,0,0,53,0,0,0,96,0,0,0,75,0,0,0,74,0,0,0,53,0,0,0,97,0,0,0,39,0,0,0,74,0,0,0,53,0,0,0,98,0,0,0,75,0,0,0,74,0,0,0,54,0,0,0,0,0,0,0,53,0,0,0,74,0,0,0,55,0,0,0,0,0,0,0,85,0,0,0,74,0,0,0,56,0,0,0,0,0,0,0,21,0,0,0,74,0,0,0,57,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,58,0,0,0,0,0,0,0,31,0,0,0,74,0,0,0,59,0,0,0,0,0,0,0,33,0,0,0,74,0,0,0,60,0,0,0,0,0,0,0,44,0,0,0,74,0,0,0,63,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,64,0,0,0,0,0,0,0,85,0,0,0,74,0,0,0,65,0,0,0,0,0,0,0,85,0,0,0,74,0,0,0,66,0,0,0,0,0,0,0,53,0,0,0,74,0,0,0,67,0,0,0,0,0,0,0,41,0,0,0,74,0,0,0,68,0,0,0,0,0,0,0,30,0,0,0,74,0,0,0,69,0,0,0,0,0,0,0,31,0,0,0,74,0,0,0,70,0,0,0,0,0,0,0,31,0,0,0,74,0,0,0,71,0,0,0,0,0,0,0,56,0,0,0,74,0,0,0,75,0,0,0,0,0,0,0,41,0,0,0,74,0,0,0,76,0,0,0,0,0,0,0,41,0,0,0,74,0,0,0,77,0,0,0,0,0,0,0,76,0,0,0,74,0,0,0,78,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,79,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,80,0,0,0,0,0,0,0,30,0,0,0,74,0,0,0,81,0,0,0,0,0,0,0,31,0,0,0,74,0,0,0,84,0,0,0,0,0,0,0,55,0,0,0,74,0,0,0,85,0,0,0,0,0,0,0,76,0,0,0,74,0,0,0,86,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,87,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,88,0,0,0,0,0,0,0,67,0,0,0,74,0,0,0,89,0,0,0,0,0,0,0,30,0,0,0,74,0,0,0,90,0,0,0,0,0,0,0,56,0,0,0,74,0,0,0,94,0,0,0,0,0,0,0,44,0,0,0,74,0,0,0,95,0,0,0,0,0,0,0,67,0,0,0,74,0,0,0,96,0,0,0,0,0,0,0,42,0,0,0,74,0,0,0,97,0,0,0,0,0,0,0,56,0,0,0,74,0,0,0,98,0,0,0,0,0,0,0,30,0,0,0,75,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,75,0,0,0,13,0,0,0,0,0,0,0,44,0,0,0,75,0,0,0,30,0,0,0,0,0,0,0,40,0,0,0,75,0,0,0,31,0,0,0,0,0,0,0,42,0,0,0,75,0,0,0,32,0,0,0,0,0,0,0,79,0,0,0,75,0,0,0,40,0,0,0,0,0,0,0,44,0,0,0,75,0,0,0,42,0,0,0,0,0,0,0,67,0,0,0,75,0,0,0,44,0,0,0,0,0,0,0,79,0,0,0,75,0,0,0,53,0,0,0,0,0,0,0,78,0,0,0,75,0,0,0,55,0,0,0,0,0,0,0,53,0,0,0,75,0,0,0,56,0,0,0,0,0,0,0,42,0,0,0,75,0,0,0,57,0,0,0,0,0,0,0,55,0,0,0,75,0,0,0,67,0,0,0,0,0,0,0,41,0,0,0,75,0,0,0,77,0,0,0,0,0,0,0,76,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,76,0,0,0,13,0,0,0,0,0,0,0,55,0,0,0,76,0,0,0,30,0,0,0,0,0,0,0,40,0,0,0,76,0,0,0,31,0,0,0,0,0,0,0,44,0,0,0,76,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,76,0,0,0,44,0,0,0,0,0,0,0,31,0,0,0,76,0,0,0,46,0,0,0,0,0,0,0,55,0,0,0,76,0,0,0,57,0,0,0,0,0,0,0,79,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,77,0,0,0,44,0,0,0,0,0,0,0,42,0,0,0,77,0,0,0,45,0,0,0,0,0,0,0,55,0,0,0,78,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,78,0,0,0,41,0,0,0,0,0,0,0,56,0,0,0,78,0,0,0,42,0,0,0,0,0,0,0,44,0,0,0,79,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,79,0,0,0,13,0,0,0,0,0,0,0,56,0,0,0,79,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,79,0,0,0,31,0,0,0,0,0,0,0,42,0,0,0,79,0,0,0,32,0,0,0,0,0,0,0,46,0,0,0,79,0,0,0,40,0,0,0,0,0,0,0,56,0,0,0,79,0,0,0,42,0,0,0,0,0,0,0,31,0,0,0,79,0,0,0,54,0,0,0,0,0,0,0,76,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,80,0,0,0,13,0,0,0,0,0,0,0,42,0,0,0,80,0,0,0,30,0,0,0,0,0,0,0,76,0,0,0,80,0,0,0,31,0,0,0,0,0,0,0,44,0,0,0,80,0,0,0,32,0,0,0,0,0,0,0,46,0,0,0,80,0,0,0,42,0,0,0,0,0,0,0,76,0,0,0,80,0,0,0,44,0,0,0,0,0,0,0,67,0,0,0,80,0,0,0,46,0,0,0,0,0,0,0,42,0,0,0,80,0,0,0,54,0,0,0,0,0,0,0,56,0,0,0,80,0,0,0,55,0,0,0,0,0,0,0,44,0,0,0,80,0,0,0,56,0,0,0,0,0,0,0,58,0,0,0,80,0,0,0,58,0,0,0,0,0,0,0,77,0,0,0,80,0,0,0,67,0,0,0,0,0,0,0,45,0,0,0,80,0,0,0,78,0,0,0,0,0,0,0,79,0,0,0,81,0,0,0,0,0,0,0,0,0,0,0,58,0,0,0,81,0,0,0,3,0,0,0,0,0,0,0,55,0,0,0,81,0,0,0,6,0,0,0,0,0,0,0,42,0,0,0,81,0,0,0,7,0,0,0,0,0,0,0,32,0,0,0,81,0,0,0,8,0,0,0,0,0,0,0,55,0,0,0,81,0,0,0,11,0,0,0,0,0,0,0,56,0,0,0,81,0,0,0,12,0,0,0,0,0,0,0,13,0,0,0,81,0,0,0,13,0,0,0,0,0,0,0,55,0,0,0,81,0,0,0,14,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,15,0,0,0,0,0,0,0,32,0,0,0,81,0,0,0,18,0,0,0,0,0,0,0,12,0,0,0,81,0,0,0,19,0,0,0,0,0,0,0,31,0,0,0,81,0,0,0,20,0,0,0,0,0,0,0,13,0,0,0,81,0,0,0,21,0,0,0,0,0,0,0,59,0,0,0,81,0,0,0,22,0,0,0,0,0,0,0,68,0,0,0,81,0,0,0,23,0,0,0,0,0,0,0,48,0,0,0,81,0,0,0,24,0,0,0,0,0,0,0,48,0,0,0,81,0,0,0,27,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,28,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,29,0,0,0,0,0,0,0,59,0,0,0,81,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,81,0,0,0,31,0,0,0,0,0,0,0,13,0,0,0,81,0,0,0,32,0,0,0,0,0,0,0,59,0,0,0,81,0,0,0,33,0,0,0,0,0,0,0,46,0,0,0,81,0,0,0,34,0,0,0,0,0,0,0,42,0,0,0,81,0,0,0,35,0,0,0,0,0,0,0,31,0,0,0,81,0,0,0,38,0,0,0,0,0,0,0,29,0,0,0,81,0,0,0,39,0,0,0,0,0,0,0,41,0,0,0,81,0,0,0,40,0,0,0,0,0,0,0,56,0,0,0,81,0,0,0,41,0,0,0,0,0,0,0,21,0,0,0,81,0,0,0,42,0,0,0,0,0,0,0,33,0,0,0,81,0,0,0,43,0,0,0,0,0,0,0,67,0,0,0,81,0,0,0,44,0,0,0,0,0,0,0,59,0,0,0,81,0,0,0,45,0,0,0,0,0,0,0,59,0,0,0,81,0,0,0,46,0,0,0,0,0,0,0,42,0,0,0,81,0,0,0,47,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,48,0,0,0,0,0,0,0,31,0,0,0,81,0,0,0,51,0,0,0,0,0,0,0,42,0,0,0,81,0,0,0,52,0,0,0,0,0,0,0,29,0,0,0,81,0,0,0,53,0,0,0,0,0,0,0,31,0,0,0,81,0,0,0,54,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,55,0,0,0,0,0,0,0,21,0,0,0,81,0,0,0,56,0,0,0,0,0,0,0,89,0,0,0,81,0,0,0,57,0,0,0,0,0,0,0,58,0,0,0,81,0,0,0,58,0,0,0,0,0,0,0,66,0,0,0,81,0,0,0,58,0,0,0,3,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,6,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,7,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,8,0,0,0,33,0,0,0,81,0,0,0,58,0,0,0,11,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,12,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,13,0,0,0,23,0,0,0,81,0,0,0,58,0,0,0,14,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,15,0,0,0,48,0,0,0,81,0,0,0,58,0,0,0,18,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,19,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,20,0,0,0,33,0,0,0,81,0,0,0,58,0,0,0,21,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,22,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,23,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,24,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,27,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,28,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,29,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,30,0,0,0,55,0,0,0,81,0,0,0,58,0,0,0,31,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,32,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,33,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,34,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,35,0,0,0,21,0,0,0,81,0,0,0,58,0,0,0,38,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,39,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,40,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,41,0,0,0,46,0,0,0,81,0,0,0,58,0,0,0,42,0,0,0,33,0,0,0,81,0,0,0,58,0,0,0,43,0,0,0,33,0,0,0,81,0,0,0,58,0,0,0,44,0,0,0,33,0,0,0,81,0,0,0,58,0,0,0,45,0,0,0,46,0,0,0,81,0,0,0,58,0,0,0,46,0,0,0,59,0,0,0,81,0,0,0,58,0,0,0,47,0,0,0,34,0,0,0,81,0,0,0,58,0,0,0,48,0,0,0,31,0,0,0,81,0,0,0,58,0,0,0,51,0,0,0,21,0,0,0,81,0,0,0,58,0,0,0,52,0,0,0,32,0,0,0,81,0,0,0,58,0,0,0,53,0,0,0,68,0,0,0,81,0,0,0,58,0,0,0,54,0,0,0,66,0,0,0,81,0,0,0,58,0,0,0,55,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,56,0,0,0,68,0,0,0,81,0,0,0,58,0,0,0,57,0,0,0,69,0,0,0,81,0,0,0,58,0,0,0,59,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,60,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,63,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,64,0,0,0,77,0,0,0,81,0,0,0,58,0,0,0,65,0,0,0,68,0,0,0,81,0,0,0,58,0,0,0,66,0,0,0,44,0,0,0,81,0,0,0,58,0,0,0,67,0,0,0,31,0,0,0,81,0,0,0,58,0,0,0,68,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,69,0,0,0,44,0,0,0,81,0,0,0,58,0,0,0,70,0,0,0,59,0,0,0,81,0,0,0,58,0,0,0,71,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,74,0,0,0,40,0,0,0,81,0,0,0,58,0,0,0,75,0,0,0,31,0,0,0,81,0,0,0,58,0,0,0,76,0,0,0,42,0,0,0,81,0,0,0,58,0,0,0,77,0,0,0,31,0,0,0,81,0,0,0,58,0,0,0,78,0,0,0,68,0,0,0,81,0,0,0,58,0,0,0,79,0,0,0,42,0,0,0,81,0,0,0,58,0,0,0,80,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,84,0,0,0,53,0,0,0,81,0,0,0,58,0,0,0,85,0,0,0,31,0,0,0,81,0,0,0,58,0,0,0,86,0,0,0,89,0,0,0,81,0,0,0,58,0,0,0,87,0,0,0,31,0,0,0,81,0,0,0,58,0,0,0,88,0,0,0,44,0,0,0,81,0,0,0,58,0,0,0,89,0,0,0,78,0,0,0,81,0,0,0,58,0,0,0,90,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,93,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,94,0,0,0,47,0,0,0,81,0,0,0,58,0,0,0,95,0,0,0,80,0,0,0,81,0,0,0,58,0,0,0,96,0,0,0,30,0,0,0,81,0,0,0,58,0,0,0,97,0,0,0,77,0,0,0,81,0,0,0,58,0,0,0,98,0,0,0,47,0,0,0,81,0,0,0,59,0,0,0,0,0,0,0,69,0,0,0,81,0,0,0,60,0,0,0,0,0,0,0,59,0,0,0,81,0,0,0,63,0,0,0,0,0,0,0,55,0,0,0,81,0,0,0,64,0,0,0,0,0,0,0,31,0,0,0,81,0,0,0,65,0,0,0,0,0,0,0,31,0,0,0,81,0,0,0,66,0,0,0,0,0,0,0,32,0,0,0,81,0,0,0,67,0,0,0,0,0,0,0,45,0,0,0,81,0,0,0,68,0,0,0,0,0,0,0,58,0,0,0,81,0,0,0,69,0,0,0,0,0,0,0,89,0,0,0,81,0,0,0,70,0,0,0,0,0,0,0,89,0,0,0,81,0,0,0,71,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,74,0,0,0,0,0,0,0,31,0,0,0,81,0,0,0,75,0,0,0,0,0,0,0,32,0,0,0,81,0,0,0,76,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,77,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,78,0,0,0,0,0,0,0,79,0,0,0,81,0,0,0,79,0,0,0,0,0,0,0,45,0,0,0,81,0,0,0,80,0,0,0,0,0,0,0,45,0,0,0,81,0,0,0,84,0,0,0,0,0,0,0,55,0,0,0,81,0,0,0,85,0,0,0,0,0,0,0,32,0,0,0,81,0,0,0,86,0,0,0,0,0,0,0,67,0,0,0,81,0,0,0,87,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,88,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,89,0,0,0,0,0,0,0,79,0,0,0,81,0,0,0,90,0,0,0,0,0,0,0,56,0,0,0,81,0,0,0,93,0,0,0,0,0,0,0,32,0,0,0,81,0,0,0,94,0,0,0,0,0,0,0,55,0,0,0,81,0,0,0,95,0,0,0,0,0,0,0,44,0,0,0,81,0,0,0,96,0,0,0,0,0,0,0,67,0,0,0,81,0,0,0,97,0,0,0,0,0,0,0,42,0,0,0,82,0,0,0,0,0,0,0,0,0,0,0,57,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,53,0,0,0,85,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,85,0,0,0,32,0,0,0,0,0,0,0,29,0,0,0,85,0,0,0,42,0,0,0,0,0,0,0,52,0,0,0,85,0,0,0,55,0,0,0,0,0,0,0,74,0,0,0,85,0,0,0,56,0,0,0,0,0,0,0,88,0,0,0,85,0,0,0,66,0,0,0,0,0,0,0,74,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,86,0,0,0,30,0,0,0,0,0,0,0,55,0,0,0,86,0,0,0,31,0,0,0,0,0,0,0,40,0,0,0,86,0,0,0,32,0,0,0,0,0,0,0,40,0,0,0,86,0,0,0,42,0,0,0,0,0,0,0,56,0,0,0,86,0,0,0,44,0,0,0,0,0,0,0,56,0,0,0,86,0,0,0,46,0,0,0,0,0,0,0,31,0,0,0,86,0,0,0,54,0,0,0,0,0,0,0,68,0,0,0,86,0,0,0,55,0,0,0,0,0,0,0,78,0,0,0,86,0,0,0,56,0,0,0,0,0,0,0,54,0,0,0,86,0,0,0,57,0,0,0,0,0,0,0,79,0,0,0,86,0,0,0,65,0,0,0,0,0,0,0,76,0,0,0,86,0,0,0,78,0,0,0,0,0,0,0,53,0,0,0,86,0,0,0,79,0,0,0,0,0,0,0,31,0,0,0,87,0,0,0,0,0,0,0,0,0,0,0,69,0,0,0,87,0,0,0,31,0,0,0,0,0,0,0,42,0,0,0,87,0,0,0,40,0,0,0,0,0,0,0,56,0,0,0,87,0,0,0,41,0,0,0,0,0,0,0,76,0,0,0,87,0,0,0,42,0,0,0,0,0,0,0,57,0,0,0,87,0,0,0,44,0,0,0,0,0,0,0,54,0,0,0,87,0,0,0,45,0,0,0,0,0,0,0,79,0,0,0,87,0,0,0,46,0,0,0,0,0,0,0,55,0,0,0,87,0,0,0,53,0,0,0,0,0,0,0,31,0,0,0,87,0,0,0,55,0,0,0,0,0,0,0,79,0,0,0,87,0,0,0,56,0,0,0,0,0,0,0,76,0,0,0,87,0,0,0,58,0,0,0,0,0,0,0,31,0,0,0,87,0,0,0,64,0,0,0,0,0,0,0,56,0,0,0,87,0,0,0,65,0,0,0,0,0,0,0,79,0,0,0,87,0,0,0,66,0,0,0,0,0,0,0,78,0,0,0,87,0,0,0,68,0,0,0,0,0,0,0,77,0,0,0,87,0,0,0,69,0,0,0,0,0,0,0,76,0,0,0,87,0,0,0,70,0,0,0,0,0,0,0,55,0,0,0,87,0,0,0,75,0,0,0,0,0,0,0,65,0,0,0,87,0,0,0,76,0,0,0,0,0,0,0,66,0,0,0,87,0,0,0,79,0,0,0,0,0,0,0,68,0,0,0,87,0,0,0,80,0,0,0,0,0,0,0,69,0,0,0,88,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,88,0,0,0,30,0,0,0,0,0,0,0,46,0,0,0,88,0,0,0,31,0,0,0,0,0,0,0,46,0,0,0,88,0,0,0,32,0,0,0,0,0,0,0,56,0,0,0,88,0,0,0,40,0,0,0,0,0,0,0,31,0,0,0,88,0,0,0,42,0,0,0,0,0,0,0,55,0,0,0,88,0,0,0,44,0,0,0,0,0,0,0,55,0,0,0,88,0,0,0,54,0,0,0,0,0,0,0,76,0,0,0,88,0,0,0,55,0,0,0,0,0,0,0,57,0,0,0,88,0,0,0,56,0,0,0,0,0,0,0,77,0,0,0,88,0,0,0,57,0,0,0,0,0,0,0,66,0,0,0,88,0,0,0,69,0,0,0,0,0,0,0,79,0,0,0,88,0,0,0,76,0,0,0,0,0,0,0,31,0,0,0,88,0,0,0,77,0,0,0,0,0,0,0,58,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,89,0,0,0,30,0,0,0,0,0,0,0,33,0,0,0,89,0,0,0,44,0,0,0,0,0,0,0,59,0,0,0,89,0,0,0,55,0,0,0,0,0,0,0,86,0,0,0,89,0,0,0,56,0,0,0,0,0,0,0,81,0,0,0,89,0,0,0,68,0,0,0,0,0,0,0,81,0,0,0,90,0,0,0,0,0,0,0,0,0,0,0,58,0,0,0,91,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,92,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,93,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,94,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,95,0,0,0,0,0,0,0,0,0,0,0,78,0,0,0,95,0,0,0,3,0,0,0,0,0,0,0,22,0,0,0,95,0,0,0,6,0,0,0,0,0,0,0,31,0,0,0,95,0,0,0,7,0,0,0,0,0,0,0,21,0,0,0,95,0,0,0,8,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,11,0,0,0,0,0,0,0,42,0,0,0,95,0,0,0,12,0,0,0,0,0,0,0,22,0,0,0,95,0,0,0,13,0,0,0,0,0,0,0,55,0,0,0,95,0,0,0,14,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,15,0,0,0,0,0,0,0,34,0,0,0,95,0,0,0,18,0,0,0,0,0,0,0,44,0,0,0,95,0,0,0,19,0,0,0,0,0,0,0,44,0,0,0,95,0,0,0,20,0,0,0,0,0,0,0,44,0,0,0,95,0,0,0,21,0,0,0,0,0,0,0,45,0,0,0,95,0,0,0,22,0,0,0,0,0,0,0,88,0,0,0,95,0,0,0,23,0,0,0,0,0,0,0,44,0,0,0,95,0,0,0,24,0,0,0,0,0,0,0,55,0,0,0,95,0,0,0,27,0,0,0,0,0,0,0,42,0,0,0,95,0,0,0,28,0,0,0,0,0,0,0,57,0,0,0,95,0,0,0,29,0,0,0,0,0,0,0,44,0,0,0,95,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,31,0,0,0,0,0,0,0,69,0,0,0,95,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,95,0,0,0,33,0,0,0,0,0,0,0,46,0,0,0,95,0,0,0,34,0,0,0,0,0,0,0,46,0,0,0,95,0,0,0,35,0,0,0,0,0,0,0,31,0,0,0,95,0,0,0,38,0,0,0,0,0,0,0,42,0,0,0,95,0,0,0,39,0,0,0,0,0,0,0,57,0,0,0,95,0,0,0,40,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,41,0,0,0,0,0,0,0,57,0,0,0,95,0,0,0,42,0,0,0,0,0,0,0,45,0,0,0,95,0,0,0,43,0,0,0,0,0,0,0,54,0,0,0,95,0,0,0,44,0,0,0,0,0,0,0,46,0,0,0,95,0,0,0,45,0,0,0,0,0,0,0,88,0,0,0,95,0,0,0,46,0,0,0,0,0,0,0,42,0,0,0,95,0,0,0,47,0,0,0,0,0,0,0,57,0,0,0,95,0,0,0,48,0,0,0,0,0,0,0,42,0,0,0,95,0,0,0,51,0,0,0,0,0,0,0,42,0,0,0,95,0,0,0,52,0,0,0,0,0,0,0,54,0,0,0,95,0,0,0,53,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,54,0,0,0,0,0,0,0,68,0,0,0,95,0,0,0,55,0,0,0,0,0,0,0,85,0,0,0,95,0,0,0,56,0,0,0,0,0,0,0,88,0,0,0,95,0,0,0,57,0,0,0,0,0,0,0,88,0,0,0,95,0,0,0,58,0,0,0,0,0,0,0,41,0,0,0,95,0,0,0,59,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,60,0,0,0,0,0,0,0,42,0,0,0,95,0,0,0,63,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,64,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,65,0,0,0,0,0,0,0,76,0,0,0,95,0,0,0,66,0,0,0,0,0,0,0,78,0,0,0,95,0,0,0,67,0,0,0,0,0,0,0,78,0,0,0,95,0,0,0,68,0,0,0,0,0,0,0,77,0,0,0,95,0,0,0,69,0,0,0,0,0,0,0,79,0,0,0,95,0,0,0,70,0,0,0,0,0,0,0,98,0,0,0,95,0,0,0,71,0,0,0,0,0,0,0,57,0,0,0,95,0,0,0,74,0,0,0,0,0,0,0,54,0,0,0,95,0,0,0,75,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,76,0,0,0,0,0,0,0,68,0,0,0,95,0,0,0,77,0,0,0,0,0,0,0,85,0,0,0,95,0,0,0,78,0,0,0,0,0,0,0,41,0,0,0,95,0,0,0,78,0,0,0,3,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,6,0,0,0,45,0,0,0,95,0,0,0,78,0,0,0,7,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,8,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,11,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,12,0,0,0,57,0,0,0,95,0,0,0,78,0,0,0,13,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,14,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,15,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,18,0,0,0,13,0,0,0,95,0,0,0,78,0,0,0,19,0,0,0,53,0,0,0,95,0,0,0,78,0,0,0,20,0,0,0,66,0,0,0,95,0,0,0,78,0,0,0,21,0,0,0,79,0,0,0,95,0,0,0,78,0,0,0,22,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,23,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,24,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,27,0,0,0,20,0,0,0,95,0,0,0,78,0,0,0,28,0,0,0,44,0,0,0,95,0,0,0,78,0,0,0,29,0,0,0,66,0,0,0,95,0,0,0,78,0,0,0,30,0,0,0,41,0,0,0,95,0,0,0,78,0,0,0,31,0,0,0,69,0,0,0,95,0,0,0,78,0,0,0,32,0,0,0,42,0,0,0,95,0,0,0,78,0,0,0,33,0,0,0,69,0,0,0,95,0,0,0,78,0,0,0,34,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,35,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,38,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,39,0,0,0,44,0,0,0,95,0,0,0,78,0,0,0,40,0,0,0,31,0,0,0,95,0,0,0,78,0,0,0,41,0,0,0,56,0,0,0,95,0,0,0,78,0,0,0,42,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,43,0,0,0,69,0,0,0,95,0,0,0,78,0,0,0,44,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,45,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,46,0,0,0,70,0,0,0,95,0,0,0,78,0,0,0,47,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,48,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,51,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,52,0,0,0,85,0,0,0,95,0,0,0,78,0,0,0,53,0,0,0,44,0,0,0,95,0,0,0,78,0,0,0,54,0,0,0,44,0,0,0,95,0,0,0,78,0,0,0,55,0,0,0,66,0,0,0,95,0,0,0,78,0,0,0,56,0,0,0,69,0,0,0,95,0,0,0,78,0,0,0,57,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,58,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,59,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,60,0,0,0,69,0,0,0,95,0,0,0,78,0,0,0,63,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,64,0,0,0,44,0,0,0,95,0,0,0,78,0,0,0,65,0,0,0,66,0,0,0,95,0,0,0,78,0,0,0,66,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,67,0,0,0,77,0,0,0,95,0,0,0,78,0,0,0,68,0,0,0,79,0,0,0,95,0,0,0,78,0,0,0,69,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,70,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,71,0,0,0,98,0,0,0,95,0,0,0,78,0,0,0,74,0,0,0,32,0,0,0,95,0,0,0,78,0,0,0,75,0,0,0,56,0,0,0,95,0,0,0,78,0,0,0,76,0,0,0,31,0,0,0,95,0,0,0,78,0,0,0,77,0,0,0,56,0,0,0,95,0,0,0,78,0,0,0,79,0,0,0,88,0,0,0,95,0,0,0,78,0,0,0,80,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,81,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,84,0,0,0,53,0,0,0,95,0,0,0,78,0,0,0,85,0,0,0,65,0,0,0,95,0,0,0,78,0,0,0,86,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,87,0,0,0,66,0,0,0,95,0,0,0,78,0,0,0,88,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,89,0,0,0,80,0,0,0,95,0,0,0,78,0,0,0,90,0,0,0,45,0,0,0,95,0,0,0,78,0,0,0,93,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,94,0,0,0,89,0,0,0,95,0,0,0,78,0,0,0,96,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,97,0,0,0,86,0,0,0,95,0,0,0,78,0,0,0,98,0,0,0,44,0,0,0,95,0,0,0,79,0,0,0,0,0,0,0,31,0,0,0,95,0,0,0,80,0,0,0,0,0,0,0,31,0,0,0,95,0,0,0,81,0,0,0,0,0,0,0,98,0,0,0,95,0,0,0,84,0,0,0,0,0,0,0,31,0,0,0,95,0,0,0,85,0,0,0,0,0,0,0,76,0,0,0,95,0,0,0,86,0,0,0,0,0,0,0,68,0,0,0,95,0,0,0,87,0,0,0,0,0,0,0,85,0,0,0,95,0,0,0,88,0,0,0,0,0,0,0,77,0,0,0,95,0,0,0,89,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,90,0,0,0,0,0,0,0,44,0,0,0,95,0,0,0,94,0,0,0,0,0,0,0,55,0,0,0,95,0,0,0,96,0,0,0,0,0,0,0,56,0,0,0,95,0,0,0,97,0,0,0,0,0,0,0,88,0,0,0,95,0,0,0,98,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,96,0,0,0,3,0,0,0,0,0,0,0,20,0,0,0,96,0,0,0,6,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,7,0,0,0,0,0,0,0,21,0,0,0,96,0,0,0,8,0,0,0,0,0,0,0,31,0,0,0,96,0,0,0,11,0,0,0,0,0,0,0,28,0,0,0,96,0,0,0,12,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,13,0,0,0,0,0,0,0,56,0,0,0,96,0,0,0,14,0,0,0,0,0,0,0,20,0,0,0,96,0,0,0,15,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,18,0,0,0,0,0,0,0,56,0,0,0,96,0,0,0,19,0,0,0,0,0,0,0,42,0,0,0,96,0,0,0,20,0,0,0,0,0,0,0,86,0,0,0,96,0,0,0,21,0,0,0,0,0,0,0,41,0,0,0,96,0,0,0,22,0,0,0,0,0,0,0,42,0,0,0,96,0,0,0,23,0,0,0,0,0,0,0,42,0,0,0,96,0,0,0,24,0,0,0,0,0,0,0,42,0,0,0,96,0,0,0,27,0,0,0,0,0,0,0,31,0,0,0,96,0,0,0,28,0,0,0,0,0,0,0,40,0,0,0,96,0,0,0,29,0,0,0,0,0,0,0,40,0,0,0,96,0,0,0,30,0,0,0,0,0,0,0,56,0,0,0,96,0,0,0,31,0,0,0,0,0,0,0,65,0,0,0,96,0,0,0,32,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,33,0,0,0,0,0,0,0,42,0,0,0,96,0,0,0,34,0,0,0,0,0,0,0,54,0,0,0,96,0,0,0,35,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,38,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,39,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,40,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,41,0,0,0,0,0,0,0,86,0,0,0,96,0,0,0,42,0,0,0,0,0,0,0,40,0,0,0,96,0,0,0,43,0,0,0,0,0,0,0,57,0,0,0,96,0,0,0,44,0,0,0,0,0,0,0,41,0,0,0,96,0,0,0,45,0,0,0,0,0,0,0,54,0,0,0,96,0,0,0,46,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,47,0,0,0,0,0,0,0,54,0,0,0,96,0,0,0,48,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,51,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,52,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,53,0,0,0,0,0,0,0,45,0,0,0,96,0,0,0,54,0,0,0,0,0,0,0,86,0,0,0,96,0,0,0,55,0,0,0,0,0,0,0,86,0,0,0,96,0,0,0,56,0,0,0,0,0,0,0,89,0,0,0,96,0,0,0,57,0,0,0,0,0,0,0,66,0,0,0,96,0,0,0,58,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,59,0,0,0,0,0,0,0,57,0,0,0])
.concat([96,0,0,0,60,0,0,0,0,0,0,0,44,0,0,0,96,0,0,0,63,0,0,0,0,0,0,0,54,0,0,0,96,0,0,0,64,0,0,0,0,0,0,0,93,0,0,0,96,0,0,0,65,0,0,0,0,0,0,0,76,0,0,0,96,0,0,0,66,0,0,0,0,0,0,0,78,0,0,0,96,0,0,0,67,0,0,0,0,0,0,0,77,0,0,0,96,0,0,0,68,0,0,0,0,0,0,0,77,0,0,0,96,0,0,0,69,0,0,0,0,0,0,0,79,0,0,0,96,0,0,0,70,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,71,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,74,0,0,0,0,0,0,0,93,0,0,0,96,0,0,0,75,0,0,0,0,0,0,0,31,0,0,0,96,0,0,0,76,0,0,0,0,0,0,0,31,0,0,0,96,0,0,0,77,0,0,0,0,0,0,0,45,0,0,0,96,0,0,0,77,0,0,0,3,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,6,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,7,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,8,0,0,0,41,0,0,0,96,0,0,0,77,0,0,0,11,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,12,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,13,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,14,0,0,0,54,0,0,0,96,0,0,0,77,0,0,0,15,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,18,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,19,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,20,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,21,0,0,0,76,0,0,0,96,0,0,0,77,0,0,0,22,0,0,0,68,0,0,0,96,0,0,0,77,0,0,0,23,0,0,0,58,0,0,0,96,0,0,0,77,0,0,0,24,0,0,0,13,0,0,0,96,0,0,0,77,0,0,0,27,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,28,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,29,0,0,0,65,0,0,0,96,0,0,0,77,0,0,0,30,0,0,0,44,0,0,0,96,0,0,0,77,0,0,0,31,0,0,0,65,0,0,0,96,0,0,0,77,0,0,0,32,0,0,0,45,0,0,0,96,0,0,0,77,0,0,0,33,0,0,0,68,0,0,0,96,0,0,0,77,0,0,0,34,0,0,0,42,0,0,0,96,0,0,0,77,0,0,0,35,0,0,0,22,0,0,0,96,0,0,0,77,0,0,0,38,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,39,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,40,0,0,0,64,0,0,0,96,0,0,0,77,0,0,0,41,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,42,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,43,0,0,0,65,0,0,0,96,0,0,0,77,0,0,0,44,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,45,0,0,0,55,0,0,0,96,0,0,0,77,0,0,0,46,0,0,0,31,0,0,0,96,0,0,0,77,0,0,0,47,0,0,0,42,0,0,0,96,0,0,0,77,0,0,0,48,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,51,0,0,0,65,0,0,0,96,0,0,0,77,0,0,0,52,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,53,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,54,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,55,0,0,0,65,0,0,0,96,0,0,0,77,0,0,0,56,0,0,0,68,0,0,0,96,0,0,0,77,0,0,0,57,0,0,0,42,0,0,0,96,0,0,0,77,0,0,0,58,0,0,0,42,0,0,0,96,0,0,0,77,0,0,0,59,0,0,0,89,0,0,0,96,0,0,0,77,0,0,0,60,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,63,0,0,0,93,0,0,0,96,0,0,0,77,0,0,0,64,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,65,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,66,0,0,0,76,0,0,0,96,0,0,0,77,0,0,0,67,0,0,0,78,0,0,0,96,0,0,0,77,0,0,0,68,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,69,0,0,0,68,0,0,0,96,0,0,0,77,0,0,0,70,0,0,0,42,0,0,0,96,0,0,0,77,0,0,0,71,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,74,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,75,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,76,0,0,0,86,0,0,0,96,0,0,0,77,0,0,0,78,0,0,0,55,0,0,0,96,0,0,0,77,0,0,0,79,0,0,0,31,0,0,0,96,0,0,0,77,0,0,0,80,0,0,0,55,0,0,0,96,0,0,0,77,0,0,0,81,0,0,0,30,0,0,0,96,0,0,0,77,0,0,0,84,0,0,0,41,0,0,0,96,0,0,0,77,0,0,0,85,0,0,0,75,0,0,0,96,0,0,0,77,0,0,0,86,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,87,0,0,0,68,0,0,0,96,0,0,0,77,0,0,0,88,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,89,0,0,0,69,0,0,0,96,0,0,0,77,0,0,0,90,0,0,0,58,0,0,0,96,0,0,0,77,0,0,0,93,0,0,0,42,0,0,0,96,0,0,0,77,0,0,0,94,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,95,0,0,0,88,0,0,0,96,0,0,0,77,0,0,0,97,0,0,0,85,0,0,0,96,0,0,0,77,0,0,0,98,0,0,0,85,0,0,0,96,0,0,0,78,0,0,0,0,0,0,0,89,0,0,0,96,0,0,0,79,0,0,0,0,0,0,0,66,0,0,0,96,0,0,0,80,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,81,0,0,0,0,0,0,0,57,0,0,0,96,0,0,0,84,0,0,0,0,0,0,0,42,0,0,0,96,0,0,0,85,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,86,0,0,0,0,0,0,0,78,0,0,0,96,0,0,0,87,0,0,0,0,0,0,0,89,0,0,0,96,0,0,0,88,0,0,0,0,0,0,0,66,0,0,0,96,0,0,0,89,0,0,0,0,0,0,0,79,0,0,0,96,0,0,0,90,0,0,0,0,0,0,0,31,0,0,0,96,0,0,0,93,0,0,0,0,0,0,0,42,0,0,0,96,0,0,0,94,0,0,0,0,0,0,0,86,0,0,0,96,0,0,0,95,0,0,0,0,0,0,0,55,0,0,0,96,0,0,0,97,0,0,0,0,0,0,0,56,0,0,0,97,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,98,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,99,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,102,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,103,0,0,0,0,0,0,0,0,0,0,0,67,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,105,0,0,0,0,0,0,0,0,0,0,0,42,0,0,0,106,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,1,0,0,0,0,0,0,0,16,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,12,0,0,0,0,0,0,0,1,0,0,0,4,0,0,0,9,0,0,0,16,0,0,0,25,0,0,0,36,0,0,0,49,0,0,0,2,0,0,0,5,0,0,0,10,0,0,0,17,0,0,0,26,0,0,0,37,0,0,0,61,0,0,0,72,0,0,0,82,0,0,0,91,0,0,0,99,0,0,0,106,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,5,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,6,0,0,0,3,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,8,0,0,0,3,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,11,0,0,0,6,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,7,0,0,0,12,0,0,0,11,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,6,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,9,0,0,0,15,0,0,0,14,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,15,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,11,0,0,0,18,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,19,0,0,0,18,0,0,0,10,0,0,0,5,0,0,0,6,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,19,0,0,0,20,0,0,0,13,0,0,0,7,0,0,0,6,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,20,0,0,0,12,0,0,0,7,0,0,0,14,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,23,0,0,0,22,0,0,0,13,0,0,0,7,0,0,0,8,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,24,0,0,0,23,0,0,0,14,0,0,0,8,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,15,0,0,0,24,0,0,0,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,27,0,0,0,18,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,27,0,0,0,28,0,0,0,19,0,0,0,11,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,11,0,0,0,12,0,0,0,20,0,0,0,29,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,19,0,0,0,29,0,0,0,30,0,0,0,21,0,0,0,13,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,22,0,0,0,13,0,0,0,20,0,0,0,30,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,33,0,0,0,23,0,0,0,14,0,0,0,13,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,33,0,0,0,22,0,0,0,14,0,0,0,15,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,35,0,0,0,25,0,0,0,16,0,0,0,15,0,0,0,23,0,0,0,0,0,0,0,0,0,0,0,36,0,0,0,35,0,0,0,24,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,38,0,0,0,27,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,18,0,0,0,28,0,0,0,39,0,0,0,38,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,19,0,0,0,18,0,0,0,27,0,0,0,39,0,0,0,40,0,0,0,29,0,0,0,0,0,0,0,0,0,0,0,19,0,0,0,20,0,0,0,30,0,0,0,41,0,0,0,40,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,20,0,0,0,29,0,0,0,41,0,0,0,42,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,21,0,0,0,30,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,33,0,0,0,22,0,0,0,21,0,0,0,31,0,0,0,44,0,0,0,45,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,23,0,0,0,22,0,0,0,32,0,0,0,45,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,35,0,0,0,24,0,0,0,23,0,0,0,33,0,0,0,46,0,0,0,47,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,24,0,0,0,25,0,0,0,36,0,0,0,48,0,0,0,47,0,0,0,0,0,0,0,0,0,0,0,25,0,0,0,35,0,0,0,48,0,0,0,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,38,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,51,0,0,0,50,0,0,0,37,0,0,0,26,0,0,0,27,0,0,0,39,0,0,0,0,0,0,0,0,0,0,0,51,0,0,0,38,0,0,0,27,0,0,0,28,0,0,0,40,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,39,0,0,0,52,0,0,0,53,0,0,0,41,0,0,0,29,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,53,0,0,0,40,0,0,0,29,0,0,0,30,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,54,0,0,0,41,0,0,0,30,0,0,0,31,0,0,0,43,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,42,0,0,0,31,0,0,0,44,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,31,0,0,0,43,0,0,0,56,0,0,0,57,0,0,0,45,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,33,0,0,0,46,0,0,0,58,0,0,0,57,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,33,0,0,0,45,0,0,0,58,0,0,0,59,0,0,0,47,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,35,0,0,0,48,0,0,0,60,0,0,0,59,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,35,0,0,0,36,0,0,0,49,0,0,0,61,0,0,0,60,0,0,0,47,0,0,0,0,0,0,0,0,0,0,0,61,0,0,0,48,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,62,0,0,0,51,0,0,0,38,0,0,0,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,0,0,0,38,0,0,0,39,0,0,0,52,0,0,0,63,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,51,0,0,0,39,0,0,0,40,0,0,0,53,0,0,0,64,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,65,0,0,0,54,0,0,0,41,0,0,0,40,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,66,0,0,0,65,0,0,0,53,0,0,0,41,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,66,0,0,0,67,0,0,0,56,0,0,0,43,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,67,0,0,0,55,0,0,0,43,0,0,0,44,0,0,0,57,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,69,0,0,0,58,0,0,0,45,0,0,0,44,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,69,0,0,0,70,0,0,0,59,0,0,0,46,0,0,0,45,0,0,0,57,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,71,0,0,0,60,0,0,0,47,0,0,0,46,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,71,0,0,0,59,0,0,0,47,0,0,0,48,0,0,0,61,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0,72,0,0,0,60,0,0,0,48,0,0,0,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,0,0,0,63,0,0,0,51,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,51,0,0,0,52,0,0,0,64,0,0,0,74,0,0,0,73,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,53,0,0,0,52,0,0,0,63,0,0,0,74,0,0,0,75,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,53,0,0,0,54,0,0,0,66,0,0,0,76,0,0,0,75,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,54,0,0,0,65,0,0,0,76,0,0,0,77,0,0,0,67,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,78,0,0,0,77,0,0,0,66,0,0,0,55,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,69,0,0,0,57,0,0,0,56,0,0,0,67,0,0,0,78,0,0,0,79,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,57,0,0,0,58,0,0,0,70,0,0,0,80,0,0,0,79,0,0,0,0,0,0,0,0,0,0,0,69,0,0,0,80,0,0,0,81,0,0,0,71,0,0,0,59,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,81,0,0,0,82,0,0,0,72,0,0,0,60,0,0,0,59,0,0,0,0,0,0,0,0,0,0,0,61,0,0,0,60,0,0,0,71,0,0,0,82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,62,0,0,0,63,0,0,0,74,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,83,0,0,0,73,0,0,0,63,0,0,0,64,0,0,0,75,0,0,0,0,0,0,0,0,0,0,0,85,0,0,0,84,0,0,0,74,0,0,0,64,0,0,0,65,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0,85,0,0,0,86,0,0,0,77,0,0,0,66,0,0,0,65,0,0,0,75,0,0,0,0,0,0,0,0,0,0,0,87,0,0,0,86,0,0,0,76,0,0,0,66,0,0,0,67,0,0,0,78,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,67,0,0,0,77,0,0,0,87,0,0,0,88,0,0,0,79,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,69,0,0,0,80,0,0,0,89,0,0,0,88,0,0,0,78,0,0,0,0,0,0,0,0,0,0,0,69,0,0,0,70,0,0,0,81,0,0,0,90,0,0,0,89,0,0,0,79,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,71,0,0,0,82,0,0,0,91,0,0,0,90,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,91,0,0,0,81,0,0,0,71,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,0,0,0,74,0,0,0,84,0,0,0,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,85,0,0,0,93,0,0,0,92,0,0,0,83,0,0,0,74,0,0,0,75,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,93,0,0,0,94,0,0,0,86,0,0,0,76,0,0,0,75,0,0,0,0,0,0,0,0,0,0,0,85,0,0,0,76,0,0,0,77,0,0,0,87,0,0,0,95,0,0,0,94,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,77,0,0,0,78,0,0,0,88,0,0,0,96,0,0,0,95,0,0,0,0,0,0,0,0,0,0,0,87,0,0,0,96,0,0,0,97,0,0,0,89,0,0,0,79,0,0,0,78,0,0,0,0,0,0,0,0,0,0,0,98,0,0,0,97,0,0,0,88,0,0,0,79,0,0,0,80,0,0,0,90,0,0,0,0,0,0,0,0,0,0,0,98,0,0,0,99,0,0,0,91,0,0,0,81,0,0,0,80,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,82,0,0,0,81,0,0,0,90,0,0,0,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,84,0,0,0,93,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,85,0,0,0,84,0,0,0,92,0,0,0,100,0,0,0,101,0,0,0,94,0,0,0,0,0,0,0,0,0,0,0,85,0,0,0,86,0,0,0,95,0,0,0,102,0,0,0,101,0,0,0,93,0,0,0,0,0,0,0,0,0,0,0,102,0,0,0,103,0,0,0,96,0,0,0,87,0,0,0,86,0,0,0,94,0,0,0,0,0,0,0,0,0,0,0,103,0,0,0,95,0,0,0,87,0,0,0,88,0,0,0,97,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,98,0,0,0,89,0,0,0,88,0,0,0,96,0,0,0,104,0,0,0,105,0,0,0,0,0,0,0,0,0,0,0,99,0,0,0,106,0,0,0,105,0,0,0,97,0,0,0,89,0,0,0,90,0,0,0,0,0,0,0,0,0,0,0,91,0,0,0,90,0,0,0,98,0,0,0,106,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,0,0,0,93,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,0,0,0,93,0,0,0,94,0,0,0,102,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,101,0,0,0,94,0,0,0,95,0,0,0,103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,0,0,0,96,0,0,0,95,0,0,0,102,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,0,0,0,97,0,0,0,96,0,0,0,103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,0,0,0,97,0,0,0,98,0,0,0,106,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,0,0,0,98,0,0,0,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___gxx_personality_v0() {
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function ___cxa_guard_abort() {}
  function ___cxa_guard_release() {}
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  Module["_strlen"] = _strlen;
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _llvm_memset_p0i8_i64=_memset;
  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000000/1000));
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___errno_location() {
      return ___errno_state;
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _abort() {
      Module['abort']();
    }
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision === -1) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  var _fabs=Math_abs;
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;
  function _fmod(x, y) {
      return x % y;
    }var _fmodl=_fmod;
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var q=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var r=env._stderr|0;var s=env.___fsmu8|0;var t=env._stdout|0;var u=env.___dso_handle|0;var v=+env.NaN;var w=+env.Infinity;var x=0;var y=0;var z=0;var A=0;var B=0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0.0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=global.Math.floor;var V=global.Math.abs;var W=global.Math.sqrt;var X=global.Math.pow;var Y=global.Math.cos;var Z=global.Math.sin;var _=global.Math.tan;var $=global.Math.acos;var aa=global.Math.asin;var ba=global.Math.atan;var ca=global.Math.atan2;var da=global.Math.exp;var ea=global.Math.log;var fa=global.Math.ceil;var ga=global.Math.imul;var ha=env.abort;var ia=env.assert;var ja=env.asmPrintInt;var ka=env.asmPrintFloat;var la=env.min;var ma=env.invoke_iiiii;var na=env.invoke_viiii;var oa=env.invoke_viiiii;var pa=env.invoke_vi;var qa=env.invoke_vii;var ra=env.invoke_iiii;var sa=env.invoke_viiiiiid;var ta=env.invoke_ii;var ua=env.invoke_viiiiiii;var va=env.invoke_viiiiid;var wa=env.invoke_v;var xa=env.invoke_iiiiiiiii;var ya=env.invoke_viiiiiiiii;var za=env.invoke_viiiiiiii;var Aa=env.invoke_viiiiii;var Ba=env.invoke_iii;var Ca=env.invoke_iiiiii;var Da=env.invoke_viii;var Ea=env._llvm_lifetime_end;var Fa=env.__scanString;var Ga=env._pthread_mutex_lock;var Ha=env.___cxa_end_catch;var Ia=env._strtoull;var Ja=env._fflush;var Ka=env.__isLeapYear;var La=env._fwrite;var Ma=env._send;var Na=env._isspace;var Oa=env._read;var Pa=env.___cxa_guard_abort;var Qa=env._newlocale;var Ra=env.___gxx_personality_v0;var Sa=env._pthread_cond_wait;var Ta=env.___cxa_rethrow;var Ua=env._fmod;var Va=env.___resumeException;var Wa=env._llvm_va_end;var Xa=env._vsscanf;var Ya=env._snprintf;var Za=env._fgetc;var _a=env.__getFloat;var $a=env._atexit;var ab=env.___cxa_free_exception;var bb=env._clock;var cb=env.___setErrNo;var db=env._isxdigit;var eb=env._exit;var fb=env._sprintf;var gb=env.___ctype_b_loc;var hb=env._freelocale;var ib=env._catgets;var jb=env._asprintf;var kb=env.___cxa_is_number_type;var lb=env.___cxa_does_inherit;var mb=env.___cxa_guard_acquire;var nb=env.___cxa_begin_catch;var ob=env._recv;var pb=env.__parseInt64;var qb=env.__ZSt18uncaught_exceptionv;var rb=env.___cxa_call_unexpected;var sb=env._copysign;var tb=env.__exit;var ub=env._strftime;var vb=env.___cxa_throw;var wb=env._llvm_eh_exception;var xb=env._pread;var yb=env.__arraySum;var zb=env.___cxa_find_matching_catch;var Ab=env.__formatString;var Bb=env._pthread_cond_broadcast;var Cb=env.__ZSt9terminatev;var Db=env._isascii;var Eb=env._pthread_mutex_unlock;var Fb=env._sbrk;var Gb=env.___errno_location;var Hb=env._strerror;var Ib=env._catclose;var Jb=env._llvm_lifetime_start;var Kb=env.___cxa_guard_release;var Lb=env._ungetc;var Mb=env._uselocale;var Nb=env._vsnprintf;var Ob=env._sscanf;var Pb=env._sysconf;var Qb=env._fread;var Rb=env._abort;var Sb=env._isdigit;var Tb=env._strtoll;var Ub=env.__addDays;var Vb=env._fabs;var Wb=env.__reallyNegative;var Xb=env._write;var Yb=env.___cxa_allocate_exception;var Zb=env._vasprintf;var _b=env._catopen;var $b=env.___ctype_toupper_loc;var ac=env.___ctype_tolower_loc;var bc=env._pwrite;var cc=env._strerror_r;var dc=env._time;var ec=0.0;
// EMSCRIPTEN_START_FUNCS
function lg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[13100]|0)!=-1){c[n>>2]=52400;c[n+4>>2]=14;c[n+8>>2]=0;Cd(52400,n,104)}n=(c[13101]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}r=k;s=c[p>>2]|0;if((c[13004]|0)!=-1){c[m>>2]=52016;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52016,m,104)}m=(c[13005]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}t=s;jc[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){fc[c[(c[k>>2]|0)+48>>2]&15](r,b,f,g)|0;c[j>>2]=g+(f-b<<2)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=uc[c[(c[k>>2]|0)+44>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+4;c[p>>2]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=uc[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+4;c[y>>2]=q;q=uc[c[(c[p>>2]|0)+44>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+4;c[n>>2]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=mc[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=uc[c[(c[p>>2]|0)+44>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b<<2)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-4|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=c[J>>2]|0;c[J>>2]=c[K>>2];c[K>>2]=C;J=J+4|0;K=K-4|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;Hd(o);i=l;return}else{L=g+(e-b<<2)|0;c[h>>2]=L;Hd(o);i=l;return}}function mg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+232|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+200|0;o=d+208|0;p=d+216|0;q=d+224|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=l|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);t=tl(u,22,c[12708]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=22;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=l+2|0}else if((j|0)==32){w=r}else{x=22}}while(0);if((x|0)==22){w=u}x=m|0;$d(p,f);lg(u,w,r,x,n,o,p);hd(c[p>>2]|0)|0;c[q>>2]=c[e>>2];vl(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function ng(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[2336]|0;a[q+1|0]=a[2337]|0;a[q+2|0]=a[2338]|0;a[q+3|0]=a[2339]|0;a[q+4|0]=a[2340]|0;a[q+5|0]=a[2341]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=k|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);v=tl(u,12,c[12708]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=22;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=k+2|0}else{x=22}}while(0);if((x|0)==22){w=u}x=l|0;$d(o,f);lg(u,w,q,x,m,n,o);hd(c[o>>2]|0)|0;c[p>>2]=c[e>>2];vl(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function og(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+240|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+208|0;o=d+216|0;p=d+224|0;q=d+232|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=l|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);t=tl(u,23,c[12708]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==32){w=r}else if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=22;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=l+2|0}else{x=22}}while(0);if((x|0)==22){w=u}x=m|0;$d(p,f);lg(u,w,r,x,n,o,p);hd(c[p>>2]|0)|0;c[q>>2]=c[e>>2];vl(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function pg(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=c[12708]|0;if(y){w=tl(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=tl(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[52968]|0)==0;if(y){do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=ul(m,c[12708]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);w=ul(m,c[12708]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}Qm();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=Gm(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}Qm();H=B;I=B;J=c[m>>2]|0}}while(0);$d(q,f);qg(J,F,A,H,o,p,q);hd(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];vl(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){Hm(I)}if((D|0)==0){i=d;return}Hm(D);i=d;return}function qg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[13100]|0)!=-1){c[n>>2]=52400;c[n+4>>2]=14;c[n+8>>2]=0;Cd(52400,n,104)}n=(c[13101]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}r=k;s=c[p>>2]|0;if((c[13004]|0)!=-1){c[m>>2]=52016;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52016,m,104)}m=(c[13005]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}t=s;jc[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=uc[c[(c[k>>2]|0)+44>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=m;v=b+1|0}else{v=b}m=f;L23:do{if((m-v|0)>1){if((a[v]|0)!=48){w=21;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=21;break}p=k;n=uc[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+4;c[q>>2]=n;n=v+2|0;q=uc[c[(c[p>>2]|0)+44>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=q;if(n>>>0<f>>>0){x=n}else{y=n;z=n;break}while(1){q=a[x]|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);u=x+1|0;if((db(q<<24>>24|0,c[12708]|0)|0)==0){y=x;z=n;break L23}if(u>>>0<f>>>0){x=u}else{y=u;z=n;break}}}else{w=21}}while(0);L38:do{if((w|0)==21){if(v>>>0<f>>>0){A=v}else{y=v;z=v;break}while(1){x=a[A]|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);q=A+1|0;if((Sb(x<<24>>24|0,c[12708]|0)|0)==0){y=A;z=v;break L38}if(q>>>0<f>>>0){A=q}else{y=q;z=v;break}}}}while(0);v=o;A=o;w=d[A]|0;if((w&1|0)==0){B=w>>>1}else{B=c[o+4>>2]|0}do{if((B|0)==0){fc[c[(c[k>>2]|0)+48>>2]&15](r,z,y,c[j>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+(y-z<<2)}else{do{if((z|0)!=(y|0)){w=y-1|0;if(z>>>0<w>>>0){C=z;D=w}else{break}do{w=a[C]|0;a[C]=a[D]|0;a[D]=w;C=C+1|0;D=D-1|0;}while(C>>>0<D>>>0)}}while(0);x=mc[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(z>>>0<y>>>0){w=v+1|0;q=o+4|0;n=o+8|0;u=k;p=0;E=0;F=z;while(1){G=(a[A]&1)==0;do{if((a[(G?w:c[n>>2]|0)+E|0]|0)>0){if((p|0)!=(a[(G?w:c[n>>2]|0)+E|0]|0)){H=E;I=p;break}J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=x;J=d[A]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[q>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=p}}while(0);G=uc[c[(c[u>>2]|0)+44>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=G;G=F+1|0;if(G>>>0<y>>>0){p=I+1|0;E=H;F=G}else{break}}}F=g+(z-b<<2)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}p=E-4|0;if(F>>>0<p>>>0){K=F;L=p}else{break}do{p=c[K>>2]|0;c[K>>2]=c[L>>2];c[L>>2]=p;K=K+4|0;L=L-4|0;}while(K>>>0<L>>>0)}}while(0);L78:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=uc[c[(c[L>>2]|0)+44>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+4;c[z>>2]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L78}}L=mc[c[(c[s>>2]|0)+12>>2]&127](t)|0;H=c[j>>2]|0;c[j>>2]=H+4;c[H>>2]=L;M=K+1|0}else{M=y}}while(0);fc[c[(c[k>>2]|0)+48>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M<<2)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;Hd(o);i=l;return}N=g+(e-b<<2)|0;c[h>>2]=N;Hd(o);i=l;return}function rg(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=c[12708]|0;if(y){w=tl(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=tl(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[52968]|0)==0;if(y){do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=ul(m,c[12708]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);w=ul(m,c[12708]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}Qm();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else if((B|0)==32){F=A}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=Gm(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}Qm();H=B;I=B;J=c[m>>2]|0}}while(0);$d(q,f);qg(J,F,A,H,o,p,q);hd(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];vl(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){Hm(I)}if((D|0)==0){i=d;return}Hm(D);i=d;return}function sg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;i=i+216|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+200|0;n=d+208|0;o=d+16|0;a[o]=a[2344]|0;a[o+1|0]=a[2345]|0;a[o+2|0]=a[2346]|0;a[o+3|0]=a[2347]|0;a[o+4|0]=a[2348]|0;a[o+5|0]=a[2349]|0;p=k|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);q=tl(p,20,c[12708]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==16){r=a[p]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){s=k+1|0;break}if(!((q|0)>1&r<<24>>24==48)){t=12;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){t=12;break}s=k+2|0}else if((h|0)==32){s=o}else{t=12}}while(0);if((t|0)==12){s=p}$d(m,f);t=m|0;m=c[t>>2]|0;if((c[13100]|0)!=-1){c[j>>2]=52400;c[j+4>>2]=14;c[j+8>>2]=0;Cd(52400,j,104)}j=(c[13101]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){r=c[h+(j<<2)>>2]|0;if((r|0)==0){break}hd(c[t>>2]|0)|0;u=l|0;fc[c[(c[r>>2]|0)+48>>2]&15](r,p,o,u)|0;r=l+(q<<2)|0;if((s|0)==(o|0)){v=r;w=e|0;x=c[w>>2]|0;y=n|0;c[y>>2]=x;vl(b,n,u,v,r,f,g);i=d;return}v=l+(s-k<<2)|0;w=e|0;x=c[w>>2]|0;y=n|0;c[y>>2]=x;vl(b,n,u,v,r,f,g);i=d;return}}while(0);d=Yb(4)|0;jm(d);vb(d|0,8088,140)}function tg(d,e,f,g,h,j,k,l,m){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0;n=i;i=i+48|0;o=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[o>>2];o=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[o>>2];o=n|0;p=n+16|0;q=n+24|0;r=n+32|0;s=n+40|0;$d(p,h);t=p|0;p=c[t>>2]|0;if((c[13102]|0)!=-1){c[o>>2]=52408;c[o+4>>2]=14;c[o+8>>2]=0;Cd(52408,o,104)}o=(c[13103]|0)-1|0;u=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-u>>2>>>0>o>>>0){v=c[u+(o<<2)>>2]|0;if((v|0)==0){break}w=v;hd(c[t>>2]|0)|0;c[j>>2]=0;x=f|0;L7:do{if((l|0)==(m|0)){y=67}else{z=g|0;A=v;B=v+8|0;C=v;D=e;E=r|0;F=s|0;G=q|0;H=l;I=0;L9:while(1){J=I;while(1){if((J|0)!=0){y=67;break L7}K=c[x>>2]|0;do{if((K|0)==0){L=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){L=K;break}if((mc[c[(c[K>>2]|0)+36>>2]&127](K)|0)!=-1){L=K;break}c[x>>2]=0;L=0}}while(0);K=(L|0)==0;M=c[z>>2]|0;L19:do{if((M|0)==0){y=20}else{do{if((c[M+12>>2]|0)==(c[M+16>>2]|0)){if((mc[c[(c[M>>2]|0)+36>>2]&127](M)|0)!=-1){break}c[z>>2]=0;y=20;break L19}}while(0);if(K){N=M}else{y=21;break L9}}}while(0);if((y|0)==20){y=0;if(K){y=21;break L9}else{N=0}}if((kc[c[(c[A>>2]|0)+36>>2]&63](w,a[H]|0,0)|0)<<24>>24==37){y=24;break}M=a[H]|0;if(M<<24>>24>-1){O=c[B>>2]|0;if((b[O+(M<<24>>24<<1)>>1]&8192)!=0){P=H;y=35;break}}Q=L+12|0;M=c[Q>>2]|0;R=L+16|0;if((M|0)==(c[R>>2]|0)){S=(mc[c[(c[L>>2]|0)+36>>2]&127](L)|0)&255}else{S=a[M]|0}M=uc[c[(c[C>>2]|0)+12>>2]&31](w,S)|0;if(M<<24>>24==(uc[c[(c[C>>2]|0)+12>>2]&31](w,a[H]|0)|0)<<24>>24){y=62;break}c[j>>2]=4;J=4}L37:do{if((y|0)==24){y=0;J=H+1|0;if((J|0)==(m|0)){y=25;break L9}M=kc[c[(c[A>>2]|0)+36>>2]&63](w,a[J]|0,0)|0;if((M<<24>>24|0)==69|(M<<24>>24|0)==48){T=H+2|0;if((T|0)==(m|0)){y=28;break L9}U=M;V=kc[c[(c[A>>2]|0)+36>>2]&63](w,a[T]|0,0)|0;W=T}else{U=0;V=M;W=J}J=c[(c[D>>2]|0)+36>>2]|0;c[E>>2]=L;c[F>>2]=N;rc[J&7](q,e,r,s,h,j,k,V,U);c[x>>2]=c[G>>2];X=W+1|0}else if((y|0)==35){while(1){y=0;J=P+1|0;if((J|0)==(m|0)){Y=m;break}M=a[J]|0;if(M<<24>>24<=-1){Y=J;break}if((b[O+(M<<24>>24<<1)>>1]&8192)==0){Y=J;break}else{P=J;y=35}}K=L;J=N;while(1){do{if((K|0)==0){Z=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){Z=K;break}if((mc[c[(c[K>>2]|0)+36>>2]&127](K)|0)!=-1){Z=K;break}c[x>>2]=0;Z=0}}while(0);M=(Z|0)==0;do{if((J|0)==0){y=48}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(M){_=J;break}else{X=Y;break L37}}if((mc[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[z>>2]=0;y=48;break}else{if(M^(J|0)==0){_=J;break}else{X=Y;break L37}}}}while(0);if((y|0)==48){y=0;if(M){X=Y;break L37}else{_=0}}T=Z+12|0;$=c[T>>2]|0;aa=Z+16|0;if(($|0)==(c[aa>>2]|0)){ba=(mc[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)&255}else{ba=a[$]|0}if(ba<<24>>24<=-1){X=Y;break L37}if((b[(c[B>>2]|0)+(ba<<24>>24<<1)>>1]&8192)==0){X=Y;break L37}$=c[T>>2]|0;if(($|0)==(c[aa>>2]|0)){mc[c[(c[Z>>2]|0)+40>>2]&127](Z)|0;K=Z;J=_;continue}else{c[T>>2]=$+1;K=Z;J=_;continue}}}else if((y|0)==62){y=0;J=c[Q>>2]|0;if((J|0)==(c[R>>2]|0)){mc[c[(c[L>>2]|0)+40>>2]&127](L)|0}else{c[Q>>2]=J+1}X=H+1|0}}while(0);if((X|0)==(m|0)){y=67;break L7}H=X;I=c[j>>2]|0}if((y|0)==28){c[j>>2]=4;ca=L;break}else if((y|0)==25){c[j>>2]=4;ca=L;break}else if((y|0)==21){c[j>>2]=4;ca=L;break}}}while(0);if((y|0)==67){ca=c[x>>2]|0}w=f|0;do{if((ca|0)!=0){if((c[ca+12>>2]|0)!=(c[ca+16>>2]|0)){break}if((mc[c[(c[ca>>2]|0)+36>>2]&127](ca)|0)!=-1){break}c[w>>2]=0}}while(0);x=c[w>>2]|0;v=(x|0)==0;I=g|0;H=c[I>>2]|0;L95:do{if((H|0)==0){y=77}else{do{if((c[H+12>>2]|0)==(c[H+16>>2]|0)){if((mc[c[(c[H>>2]|0)+36>>2]&127](H)|0)!=-1){break}c[I>>2]=0;y=77;break L95}}while(0);if(!v){break}da=d|0;c[da>>2]=x;i=n;return}}while(0);do{if((y|0)==77){if(v){break}da=d|0;c[da>>2]=x;i=n;return}}while(0);c[j>>2]=c[j>>2]|2;da=d|0;c[da>>2]=x;i=n;return}}while(0);n=Yb(4)|0;jm(n);vb(n|0,8088,140)}function ug(a){a=a|0;fd(a|0);Lm(a);return}function vg(a){a=a|0;fd(a|0);return}function wg(a){a=a|0;return 2}function xg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];tg(a,b,k,l,f,g,h,2328,2336);i=j;return}function yg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=mc[c[(c[n>>2]|0)+20>>2]&127](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=o;e=a[o]|0;if((e&1)==0){p=f+1|0;q=f+1|0}else{f=c[o+8>>2]|0;p=f;q=f}f=e&255;if((f&1|0)==0){r=f>>>1}else{r=c[o+4>>2]|0}tg(b,d,l,m,g,h,j,q,p+r|0);i=k;return}function zg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;$d(m,f);f=m|0;m=c[f>>2]|0;if((c[13102]|0)!=-1){c[l>>2]=52408;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52408,l,104)}l=(c[13103]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}hd(c[f>>2]|0)|0;p=c[e>>2]|0;q=b+8|0;r=mc[c[c[q>>2]>>2]&127](q)|0;c[k>>2]=p;p=(_k(d,k,r,r+168|0,o,g,0)|0)-r|0;if((p|0)>=168){s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}c[h+24>>2]=((p|0)/12|0|0)%7|0;s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}}while(0);j=Yb(4)|0;jm(j);vb(j|0,8088,140)}function Ag(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;$d(m,f);f=m|0;m=c[f>>2]|0;if((c[13102]|0)!=-1){c[l>>2]=52408;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52408,l,104)}l=(c[13103]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}hd(c[f>>2]|0)|0;p=c[e>>2]|0;q=b+8|0;r=mc[c[(c[q>>2]|0)+4>>2]&127](q)|0;c[k>>2]=p;p=(_k(d,k,r,r+288|0,o,g,0)|0)-r|0;if((p|0)>=288){s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}c[h+16>>2]=((p|0)/12|0|0)%12|0;s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}}while(0);j=Yb(4)|0;jm(j);vb(j|0,8088,140)}function Bg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;$d(l,f);f=l|0;l=c[f>>2]|0;if((c[13102]|0)!=-1){c[k>>2]=52408;c[k+4>>2]=14;c[k+8>>2]=0;Cd(52408,k,104)}k=(c[13103]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}hd(c[f>>2]|0)|0;c[j>>2]=c[e>>2];o=wl(d,j,g,n,4)|0;if((c[g>>2]&4|0)!=0){p=4;q=0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=b;return}if((o|0)<69){u=o+2e3|0}else{u=(o-69|0)>>>0<31>>>0?o+1900|0:o}c[h+20>>2]=u-1900;p=4;q=0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=b;return}}while(0);b=Yb(4)|0;jm(b);vb(b|0,8088,140)}function Cg(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0;m=i;i=i+328|0;n=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[n>>2];n=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[n>>2];n=m|0;o=m+8|0;p=m+16|0;q=m+24|0;r=m+32|0;s=m+40|0;t=m+48|0;u=m+56|0;v=m+64|0;w=m+72|0;x=m+80|0;y=m+88|0;z=m+96|0;A=m+104|0;B=m+120|0;C=m+128|0;D=m+136|0;E=m+144|0;F=m+152|0;G=m+160|0;H=m+168|0;I=m+176|0;J=m+184|0;K=m+192|0;L=m+200|0;M=m+208|0;N=m+216|0;O=m+224|0;P=m+232|0;Q=m+240|0;R=m+248|0;S=m+256|0;T=m+264|0;U=m+272|0;V=m+280|0;W=m+288|0;X=m+296|0;Y=m+304|0;Z=m+312|0;_=m+320|0;c[j>>2]=0;$d(B,h);$=B|0;B=c[$>>2]|0;if((c[13102]|0)!=-1){c[A>>2]=52408;c[A+4>>2]=14;c[A+8>>2]=0;Cd(52408,A,104)}A=(c[13103]|0)-1|0;aa=c[B+8>>2]|0;do{if((c[B+12>>2]|0)-aa>>2>>>0>A>>>0){ba=c[aa+(A<<2)>>2]|0;if((ba|0)==0){break}ca=ba;hd(c[$>>2]|0)|0;L7:do{switch(l<<24>>24|0){case 77:{c[s>>2]=c[g>>2];ba=wl(f,s,j,ca,2)|0;da=c[j>>2]|0;if((da&4|0)==0&(ba|0)<60){c[k+4>>2]=ba;break L7}else{c[j>>2]=da|4;break L7}break};case 120:{da=c[(c[e>>2]|0)+20>>2]|0;c[V>>2]=c[f>>2];c[W>>2]=c[g>>2];nc[da&127](b,e,V,W,h,j,k);i=m;return};case 88:{da=e+8|0;ba=mc[c[(c[da>>2]|0)+24>>2]&127](da)|0;da=f|0;c[Y>>2]=c[da>>2];c[Z>>2]=c[g>>2];ea=ba;fa=a[ba]|0;if((fa&1)==0){ga=ea+1|0;ha=ea+1|0}else{ea=c[ba+8>>2]|0;ga=ea;ha=ea}ea=fa&255;if((ea&1|0)==0){ia=ea>>>1}else{ia=c[ba+4>>2]|0}tg(X,e,Y,Z,h,j,k,ha,ga+ia|0);c[da>>2]=c[X>>2];break};case 97:case 65:{da=c[g>>2]|0;ba=e+8|0;ea=mc[c[c[ba>>2]>>2]&127](ba)|0;c[z>>2]=da;da=(_k(f,z,ea,ea+168|0,ca,j,0)|0)-ea|0;if((da|0)>=168){break L7}c[k+24>>2]=((da|0)/12|0|0)%7|0;break};case 114:{da=f|0;c[N>>2]=c[da>>2];c[O>>2]=c[g>>2];tg(M,e,N,O,h,j,k,2296,2307);c[da>>2]=c[M>>2];break};case 110:case 116:{c[L>>2]=c[g>>2];Dg(e,f,L,j,ca);break};case 112:{da=k+8|0;ea=c[g>>2]|0;ba=e+8|0;fa=mc[c[(c[ba>>2]|0)+8>>2]&127](ba)|0;ba=d[fa]|0;if((ba&1|0)==0){ja=ba>>>1}else{ja=c[fa+4>>2]|0}ba=d[fa+12|0]|0;if((ba&1|0)==0){ka=ba>>>1}else{ka=c[fa+16>>2]|0}if((ja|0)==(-ka|0)){c[j>>2]=c[j>>2]|4;break L7}c[r>>2]=ea;ea=_k(f,r,fa,fa+24|0,ca,j,0)|0;ba=ea-fa|0;do{if((ea|0)==(fa|0)){if((c[da>>2]|0)!=12){break}c[da>>2]=0;break L7}}while(0);if((ba|0)!=12){break L7}fa=c[da>>2]|0;if((fa|0)>=12){break L7}c[da>>2]=fa+12;break};case 72:{c[w>>2]=c[g>>2];fa=wl(f,w,j,ca,2)|0;ea=c[j>>2]|0;if((ea&4|0)==0&(fa|0)<24){c[k+8>>2]=fa;break L7}else{c[j>>2]=ea|4;break L7}break};case 121:{c[o>>2]=c[g>>2];ea=wl(f,o,j,ca,4)|0;if((c[j>>2]&4|0)!=0){break L7}if((ea|0)<69){la=ea+2e3|0}else{la=(ea-69|0)>>>0<31>>>0?ea+1900|0:ea}c[k+20>>2]=la-1900;break};case 89:{c[n>>2]=c[g>>2];ea=wl(f,n,j,ca,4)|0;if((c[j>>2]&4|0)!=0){break L7}c[k+20>>2]=ea-1900;break};case 106:{c[u>>2]=c[g>>2];ea=wl(f,u,j,ca,3)|0;fa=c[j>>2]|0;if((fa&4|0)==0&(ea|0)<366){c[k+28>>2]=ea;break L7}else{c[j>>2]=fa|4;break L7}break};case 84:{fa=f|0;c[T>>2]=c[fa>>2];c[U>>2]=c[g>>2];tg(S,e,T,U,h,j,k,2280,2288);c[fa>>2]=c[S>>2];break};case 119:{c[p>>2]=c[g>>2];fa=wl(f,p,j,ca,1)|0;ea=c[j>>2]|0;if((ea&4|0)==0&(fa|0)<7){c[k+24>>2]=fa;break L7}else{c[j>>2]=ea|4;break L7}break};case 82:{ea=f|0;c[Q>>2]=c[ea>>2];c[R>>2]=c[g>>2];tg(P,e,Q,R,h,j,k,2288,2293);c[ea>>2]=c[P>>2];break};case 83:{c[q>>2]=c[g>>2];ea=wl(f,q,j,ca,2)|0;fa=c[j>>2]|0;if((fa&4|0)==0&(ea|0)<61){c[k>>2]=ea;break L7}else{c[j>>2]=fa|4;break L7}break};case 37:{c[_>>2]=c[g>>2];Eg(e,f,_,j,ca);break};case 100:case 101:{c[x>>2]=c[g>>2];fa=wl(f,x,j,ca,2)|0;ea=c[j>>2]|0;if((ea&4|0)==0&(fa|0)>0&(fa|0)<32){c[k+12>>2]=fa;break L7}else{c[j>>2]=ea|4;break L7}break};case 109:{c[t>>2]=c[g>>2];ea=wl(f,t,j,ca,2)|0;fa=c[j>>2]|0;if((fa&4|0)==0&(ea|0)<13){c[k+16>>2]=ea-1;break L7}else{c[j>>2]=fa|4;break L7}break};case 70:{fa=f|0;c[J>>2]=c[fa>>2];c[K>>2]=c[g>>2];tg(I,e,J,K,h,j,k,2312,2320);c[fa>>2]=c[I>>2];break};case 99:{fa=e+8|0;ea=mc[c[(c[fa>>2]|0)+12>>2]&127](fa)|0;fa=f|0;c[D>>2]=c[fa>>2];c[E>>2]=c[g>>2];ma=ea;na=a[ea]|0;if((na&1)==0){oa=ma+1|0;pa=ma+1|0}else{ma=c[ea+8>>2]|0;oa=ma;pa=ma}ma=na&255;if((ma&1|0)==0){qa=ma>>>1}else{qa=c[ea+4>>2]|0}tg(C,e,D,E,h,j,k,pa,oa+qa|0);c[fa>>2]=c[C>>2];break};case 68:{fa=f|0;c[G>>2]=c[fa>>2];c[H>>2]=c[g>>2];tg(F,e,G,H,h,j,k,2320,2328);c[fa>>2]=c[F>>2];break};case 73:{c[v>>2]=c[g>>2];fa=wl(f,v,j,ca,2)|0;ea=c[j>>2]|0;if((ea&4|0)==0&(fa|0)>0&(fa|0)<13){c[k+8>>2]=fa;break L7}else{c[j>>2]=ea|4;break L7}break};case 98:case 66:case 104:{ea=c[g>>2]|0;fa=e+8|0;ma=mc[c[(c[fa>>2]|0)+4>>2]&127](fa)|0;c[y>>2]=ea;ea=(_k(f,y,ma,ma+288|0,ca,j,0)|0)-ma|0;if((ea|0)>=288){break L7}c[k+16>>2]=((ea|0)/12|0|0)%12|0;break};default:{c[j>>2]=c[j>>2]|4}}}while(0);c[b>>2]=c[f>>2];i=m;return}}while(0);m=Yb(4)|0;jm(m);vb(m|0,8088,140)}function Dg(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;j=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[j>>2];j=e|0;e=f|0;f=h+8|0;L1:while(1){h=c[j>>2]|0;do{if((h|0)==0){k=0}else{if((c[h+12>>2]|0)!=(c[h+16>>2]|0)){k=h;break}if((mc[c[(c[h>>2]|0)+36>>2]&127](h)|0)==-1){c[j>>2]=0;k=0;break}else{k=c[j>>2]|0;break}}}while(0);h=(k|0)==0;l=c[e>>2]|0;L10:do{if((l|0)==0){m=12}else{do{if((c[l+12>>2]|0)==(c[l+16>>2]|0)){if((mc[c[(c[l>>2]|0)+36>>2]&127](l)|0)!=-1){break}c[e>>2]=0;m=12;break L10}}while(0);if(h){n=l;o=0}else{p=l;q=0;break L1}}}while(0);if((m|0)==12){m=0;if(h){p=0;q=1;break}else{n=0;o=1}}l=c[j>>2]|0;r=c[l+12>>2]|0;if((r|0)==(c[l+16>>2]|0)){s=(mc[c[(c[l>>2]|0)+36>>2]&127](l)|0)&255}else{s=a[r]|0}if(s<<24>>24<=-1){p=n;q=o;break}if((b[(c[f>>2]|0)+(s<<24>>24<<1)>>1]&8192)==0){p=n;q=o;break}r=c[j>>2]|0;l=r+12|0;t=c[l>>2]|0;if((t|0)==(c[r+16>>2]|0)){mc[c[(c[r>>2]|0)+40>>2]&127](r)|0;continue}else{c[l>>2]=t+1;continue}}o=c[j>>2]|0;do{if((o|0)==0){u=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){u=o;break}if((mc[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[j>>2]=0;u=0;break}else{u=c[j>>2]|0;break}}}while(0);j=(u|0)==0;do{if(q){m=31}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){if(!(j^(p|0)==0)){break}i=d;return}if((mc[c[(c[p>>2]|0)+36>>2]&127](p)|0)==-1){c[e>>2]=0;m=31;break}if(!j){break}i=d;return}}while(0);do{if((m|0)==31){if(j){break}i=d;return}}while(0);c[g>>2]=c[g>>2]|2;i=d;return}function Eg(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;h=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[h>>2];h=d|0;d=c[h>>2]|0;do{if((d|0)==0){j=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){j=d;break}if((mc[c[(c[d>>2]|0)+36>>2]&127](d)|0)==-1){c[h>>2]=0;j=0;break}else{j=c[h>>2]|0;break}}}while(0);d=(j|0)==0;j=e|0;e=c[j>>2]|0;L8:do{if((e|0)==0){k=11}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((mc[c[(c[e>>2]|0)+36>>2]&127](e)|0)!=-1){break}c[j>>2]=0;k=11;break L8}}while(0);if(d){l=e;m=0}else{k=12}}}while(0);if((k|0)==11){if(d){k=12}else{l=0;m=1}}if((k|0)==12){c[f>>2]=c[f>>2]|6;i=b;return}d=c[h>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){n=(mc[c[(c[d>>2]|0)+36>>2]&127](d)|0)&255}else{n=a[e]|0}if((kc[c[(c[g>>2]|0)+36>>2]&63](g,n,0)|0)<<24>>24!=37){c[f>>2]=c[f>>2]|4;i=b;return}n=c[h>>2]|0;g=n+12|0;e=c[g>>2]|0;if((e|0)==(c[n+16>>2]|0)){mc[c[(c[n>>2]|0)+40>>2]&127](n)|0}else{c[g>>2]=e+1}e=c[h>>2]|0;do{if((e|0)==0){o=0}else{if((c[e+12>>2]|0)!=(c[e+16>>2]|0)){o=e;break}if((mc[c[(c[e>>2]|0)+36>>2]&127](e)|0)==-1){c[h>>2]=0;o=0;break}else{o=c[h>>2]|0;break}}}while(0);h=(o|0)==0;do{if(m){k=31}else{if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){if(!(h^(l|0)==0)){break}i=b;return}if((mc[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1){c[j>>2]=0;k=31;break}if(!h){break}i=b;return}}while(0);do{if((k|0)==31){if(h){break}i=b;return}}while(0);c[f>>2]=c[f>>2]|2;i=b;return}function Fg(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0;l=i;i=i+48|0;m=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[m>>2];m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=l|0;n=l+16|0;o=l+24|0;p=l+32|0;q=l+40|0;$d(n,f);r=n|0;n=c[r>>2]|0;if((c[13100]|0)!=-1){c[m>>2]=52400;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52400,m,104)}m=(c[13101]|0)-1|0;s=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-s>>2>>>0>m>>>0){t=c[s+(m<<2)>>2]|0;if((t|0)==0){break}u=t;hd(c[r>>2]|0)|0;c[g>>2]=0;v=d|0;L7:do{if((j|0)==(k|0)){w=71}else{x=e|0;y=t;z=t;A=t;B=b;C=p|0;D=q|0;E=o|0;F=j;G=0;L9:while(1){H=G;while(1){if((H|0)!=0){w=71;break L7}I=c[v>>2]|0;do{if((I|0)==0){J=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){L=mc[c[(c[I>>2]|0)+36>>2]&127](I)|0}else{L=c[K>>2]|0}if((L|0)!=-1){J=I;break}c[v>>2]=0;J=0}}while(0);I=(J|0)==0;K=c[x>>2]|0;do{if((K|0)==0){w=23}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=mc[c[(c[K>>2]|0)+36>>2]&127](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[x>>2]=0;w=23;break}else{if(I^(K|0)==0){O=K;break}else{w=25;break L9}}}}while(0);if((w|0)==23){w=0;if(I){w=25;break L9}else{O=0}}if((kc[c[(c[y>>2]|0)+52>>2]&63](u,c[F>>2]|0,0)|0)<<24>>24==37){w=28;break}if(kc[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[F>>2]|0)|0){P=F;w=38;break}Q=J+12|0;K=c[Q>>2]|0;R=J+16|0;if((K|0)==(c[R>>2]|0)){S=mc[c[(c[J>>2]|0)+36>>2]&127](J)|0}else{S=c[K>>2]|0}K=uc[c[(c[A>>2]|0)+28>>2]&31](u,S)|0;if((K|0)==(uc[c[(c[A>>2]|0)+28>>2]&31](u,c[F>>2]|0)|0)){w=66;break}c[g>>2]=4;H=4}L41:do{if((w|0)==66){w=0;H=c[Q>>2]|0;if((H|0)==(c[R>>2]|0)){mc[c[(c[J>>2]|0)+40>>2]&127](J)|0}else{c[Q>>2]=H+4}T=F+4|0}else if((w|0)==38){while(1){w=0;H=P+4|0;if((H|0)==(k|0)){U=k;break}if(kc[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[H>>2]|0)|0){P=H;w=38}else{U=H;break}}I=J;H=O;while(1){do{if((I|0)==0){V=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){W=mc[c[(c[I>>2]|0)+36>>2]&127](I)|0}else{W=c[K>>2]|0}if((W|0)!=-1){V=I;break}c[v>>2]=0;V=0}}while(0);K=(V|0)==0;do{if((H|0)==0){w=53}else{M=c[H+12>>2]|0;if((M|0)==(c[H+16>>2]|0)){X=mc[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{X=c[M>>2]|0}if((X|0)==-1){c[x>>2]=0;w=53;break}else{if(K^(H|0)==0){Y=H;break}else{T=U;break L41}}}}while(0);if((w|0)==53){w=0;if(K){T=U;break L41}else{Y=0}}M=V+12|0;Z=c[M>>2]|0;_=V+16|0;if((Z|0)==(c[_>>2]|0)){$=mc[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{$=c[Z>>2]|0}if(!(kc[c[(c[z>>2]|0)+12>>2]&63](u,8192,$)|0)){T=U;break L41}Z=c[M>>2]|0;if((Z|0)==(c[_>>2]|0)){mc[c[(c[V>>2]|0)+40>>2]&127](V)|0;I=V;H=Y;continue}else{c[M>>2]=Z+4;I=V;H=Y;continue}}}else if((w|0)==28){w=0;H=F+4|0;if((H|0)==(k|0)){w=29;break L9}I=kc[c[(c[y>>2]|0)+52>>2]&63](u,c[H>>2]|0,0)|0;if((I<<24>>24|0)==69|(I<<24>>24|0)==48){Z=F+8|0;if((Z|0)==(k|0)){w=32;break L9}aa=I;ba=kc[c[(c[y>>2]|0)+52>>2]&63](u,c[Z>>2]|0,0)|0;ca=Z}else{aa=0;ba=I;ca=H}H=c[(c[B>>2]|0)+36>>2]|0;c[C>>2]=J;c[D>>2]=O;rc[H&7](o,b,p,q,f,g,h,ba,aa);c[v>>2]=c[E>>2];T=ca+4|0}}while(0);if((T|0)==(k|0)){w=71;break L7}F=T;G=c[g>>2]|0}if((w|0)==29){c[g>>2]=4;da=J;break}else if((w|0)==32){c[g>>2]=4;da=J;break}else if((w|0)==25){c[g>>2]=4;da=J;break}}}while(0);if((w|0)==71){da=c[v>>2]|0}u=d|0;do{if((da|0)!=0){t=c[da+12>>2]|0;if((t|0)==(c[da+16>>2]|0)){ea=mc[c[(c[da>>2]|0)+36>>2]&127](da)|0}else{ea=c[t>>2]|0}if((ea|0)!=-1){break}c[u>>2]=0}}while(0);v=c[u>>2]|0;t=(v|0)==0;G=e|0;F=c[G>>2]|0;do{if((F|0)==0){w=84}else{E=c[F+12>>2]|0;if((E|0)==(c[F+16>>2]|0)){fa=mc[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{fa=c[E>>2]|0}if((fa|0)==-1){c[G>>2]=0;w=84;break}if(!(t^(F|0)==0)){break}ga=a|0;c[ga>>2]=v;i=l;return}}while(0);do{if((w|0)==84){if(t){break}ga=a|0;c[ga>>2]=v;i=l;return}}while(0);c[g>>2]=c[g>>2]|2;ga=a|0;c[ga>>2]=v;i=l;return}}while(0);l=Yb(4)|0;jm(l);vb(l|0,8088,140)}function Gg(a){a=a|0;fd(a|0);Lm(a);return}function Hg(a){a=a|0;fd(a|0);return}function Ig(a){a=a|0;return 2}function Jg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];Fg(a,b,k,l,f,g,h,2248,2280);i=j;return}function Kg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=mc[c[(c[n>>2]|0)+20>>2]&127](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=a[o]|0;if((f&1)==0){p=o+4|0;q=o+4|0}else{e=c[o+8>>2]|0;p=e;q=e}e=f&255;if((e&1|0)==0){r=e>>>1}else{r=c[o+4>>2]|0}Fg(b,d,l,m,g,h,j,q,p+(r<<2)|0);i=k;return}function Lg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;$d(m,f);f=m|0;m=c[f>>2]|0;if((c[13100]|0)!=-1){c[l>>2]=52400;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52400,l,104)}l=(c[13101]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}hd(c[f>>2]|0)|0;p=c[e>>2]|0;q=b+8|0;r=mc[c[c[q>>2]>>2]&127](q)|0;c[k>>2]=p;p=(jl(d,k,r,r+168|0,o,g,0)|0)-r|0;if((p|0)>=168){s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}c[h+24>>2]=((p|0)/12|0|0)%7|0;s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}}while(0);j=Yb(4)|0;jm(j);vb(j|0,8088,140)}function Mg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;$d(m,f);f=m|0;m=c[f>>2]|0;if((c[13100]|0)!=-1){c[l>>2]=52400;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52400,l,104)}l=(c[13101]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}hd(c[f>>2]|0)|0;p=c[e>>2]|0;q=b+8|0;r=mc[c[(c[q>>2]|0)+4>>2]&127](q)|0;c[k>>2]=p;p=(jl(d,k,r,r+288|0,o,g,0)|0)-r|0;if((p|0)>=288){s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}c[h+16>>2]=((p|0)/12|0|0)%12|0;s=4;t=0;u=d|0;v=c[u>>2]|0;w=a|0;c[w>>2]=v;i=j;return}}while(0);j=Yb(4)|0;jm(j);vb(j|0,8088,140)}function Ng(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;$d(l,f);f=l|0;l=c[f>>2]|0;if((c[13100]|0)!=-1){c[k>>2]=52400;c[k+4>>2]=14;c[k+8>>2]=0;Cd(52400,k,104)}k=(c[13101]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}hd(c[f>>2]|0)|0;c[j>>2]=c[e>>2];o=xl(d,j,g,n,4)|0;if((c[g>>2]&4|0)!=0){p=4;q=0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=b;return}if((o|0)<69){u=o+2e3|0}else{u=(o-69|0)>>>0<31>>>0?o+1900|0:o}c[h+20>>2]=u-1900;p=4;q=0;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=b;return}}while(0);b=Yb(4)|0;jm(b);vb(b|0,8088,140)}function Og(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0;m=i;i=i+328|0;n=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[n>>2];n=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[n>>2];n=m|0;o=m+8|0;p=m+16|0;q=m+24|0;r=m+32|0;s=m+40|0;t=m+48|0;u=m+56|0;v=m+64|0;w=m+72|0;x=m+80|0;y=m+88|0;z=m+96|0;A=m+104|0;B=m+120|0;C=m+128|0;D=m+136|0;E=m+144|0;F=m+152|0;G=m+160|0;H=m+168|0;I=m+176|0;J=m+184|0;K=m+192|0;L=m+200|0;M=m+208|0;N=m+216|0;O=m+224|0;P=m+232|0;Q=m+240|0;R=m+248|0;S=m+256|0;T=m+264|0;U=m+272|0;V=m+280|0;W=m+288|0;X=m+296|0;Y=m+304|0;Z=m+312|0;_=m+320|0;c[j>>2]=0;$d(B,h);$=B|0;B=c[$>>2]|0;if((c[13100]|0)!=-1){c[A>>2]=52400;c[A+4>>2]=14;c[A+8>>2]=0;Cd(52400,A,104)}A=(c[13101]|0)-1|0;aa=c[B+8>>2]|0;do{if((c[B+12>>2]|0)-aa>>2>>>0>A>>>0){ba=c[aa+(A<<2)>>2]|0;if((ba|0)==0){break}ca=ba;hd(c[$>>2]|0)|0;L7:do{switch(l<<24>>24|0){case 77:{c[s>>2]=c[g>>2];ba=xl(f,s,j,ca,2)|0;da=c[j>>2]|0;if((da&4|0)==0&(ba|0)<60){c[k+4>>2]=ba;break L7}else{c[j>>2]=da|4;break L7}break};case 114:{da=f|0;c[N>>2]=c[da>>2];c[O>>2]=c[g>>2];Fg(M,e,N,O,h,j,k,2136,2180);c[da>>2]=c[M>>2];break};case 82:{da=f|0;c[Q>>2]=c[da>>2];c[R>>2]=c[g>>2];Fg(P,e,Q,R,h,j,k,2112,2132);c[da>>2]=c[P>>2];break};case 83:{c[q>>2]=c[g>>2];da=xl(f,q,j,ca,2)|0;ba=c[j>>2]|0;if((ba&4|0)==0&(da|0)<61){c[k>>2]=da;break L7}else{c[j>>2]=ba|4;break L7}break};case 99:{ba=e+8|0;da=mc[c[(c[ba>>2]|0)+12>>2]&127](ba)|0;ba=f|0;c[D>>2]=c[ba>>2];c[E>>2]=c[g>>2];ea=a[da]|0;if((ea&1)==0){fa=da+4|0;ga=da+4|0}else{ha=c[da+8>>2]|0;fa=ha;ga=ha}ha=ea&255;if((ha&1|0)==0){ia=ha>>>1}else{ia=c[da+4>>2]|0}Fg(C,e,D,E,h,j,k,ga,fa+(ia<<2)|0);c[ba>>2]=c[C>>2];break};case 112:{ba=k+8|0;da=c[g>>2]|0;ha=e+8|0;ea=mc[c[(c[ha>>2]|0)+8>>2]&127](ha)|0;ha=d[ea]|0;if((ha&1|0)==0){ja=ha>>>1}else{ja=c[ea+4>>2]|0}ha=d[ea+12|0]|0;if((ha&1|0)==0){ka=ha>>>1}else{ka=c[ea+16>>2]|0}if((ja|0)==(-ka|0)){c[j>>2]=c[j>>2]|4;break L7}c[r>>2]=da;da=jl(f,r,ea,ea+24|0,ca,j,0)|0;ha=da-ea|0;do{if((da|0)==(ea|0)){if((c[ba>>2]|0)!=12){break}c[ba>>2]=0;break L7}}while(0);if((ha|0)!=12){break L7}ea=c[ba>>2]|0;if((ea|0)>=12){break L7}c[ba>>2]=ea+12;break};case 110:case 116:{c[L>>2]=c[g>>2];Pg(e,f,L,j,ca);break};case 97:case 65:{ea=c[g>>2]|0;da=e+8|0;la=mc[c[c[da>>2]>>2]&127](da)|0;c[z>>2]=ea;ea=(jl(f,z,la,la+168|0,ca,j,0)|0)-la|0;if((ea|0)>=168){break L7}c[k+24>>2]=((ea|0)/12|0|0)%7|0;break};case 121:{c[o>>2]=c[g>>2];ea=xl(f,o,j,ca,4)|0;if((c[j>>2]&4|0)!=0){break L7}if((ea|0)<69){ma=ea+2e3|0}else{ma=(ea-69|0)>>>0<31>>>0?ea+1900|0:ea}c[k+20>>2]=ma-1900;break};case 109:{c[t>>2]=c[g>>2];ea=xl(f,t,j,ca,2)|0;la=c[j>>2]|0;if((la&4|0)==0&(ea|0)<13){c[k+16>>2]=ea-1;break L7}else{c[j>>2]=la|4;break L7}break};case 84:{la=f|0;c[T>>2]=c[la>>2];c[U>>2]=c[g>>2];Fg(S,e,T,U,h,j,k,2080,2112);c[la>>2]=c[S>>2];break};case 119:{c[p>>2]=c[g>>2];la=xl(f,p,j,ca,1)|0;ea=c[j>>2]|0;if((ea&4|0)==0&(la|0)<7){c[k+24>>2]=la;break L7}else{c[j>>2]=ea|4;break L7}break};case 100:case 101:{c[x>>2]=c[g>>2];ea=xl(f,x,j,ca,2)|0;la=c[j>>2]|0;if((la&4|0)==0&(ea|0)>0&(ea|0)<32){c[k+12>>2]=ea;break L7}else{c[j>>2]=la|4;break L7}break};case 88:{la=e+8|0;ea=mc[c[(c[la>>2]|0)+24>>2]&127](la)|0;la=f|0;c[Y>>2]=c[la>>2];c[Z>>2]=c[g>>2];da=a[ea]|0;if((da&1)==0){na=ea+4|0;oa=ea+4|0}else{pa=c[ea+8>>2]|0;na=pa;oa=pa}pa=da&255;if((pa&1|0)==0){qa=pa>>>1}else{qa=c[ea+4>>2]|0}Fg(X,e,Y,Z,h,j,k,oa,na+(qa<<2)|0);c[la>>2]=c[X>>2];break};case 120:{la=c[(c[e>>2]|0)+20>>2]|0;c[V>>2]=c[f>>2];c[W>>2]=c[g>>2];nc[la&127](b,e,V,W,h,j,k);i=m;return};case 72:{c[w>>2]=c[g>>2];la=xl(f,w,j,ca,2)|0;ea=c[j>>2]|0;if((ea&4|0)==0&(la|0)<24){c[k+8>>2]=la;break L7}else{c[j>>2]=ea|4;break L7}break};case 37:{c[_>>2]=c[g>>2];Qg(e,f,_,j,ca);break};case 89:{c[n>>2]=c[g>>2];ea=xl(f,n,j,ca,4)|0;if((c[j>>2]&4|0)!=0){break L7}c[k+20>>2]=ea-1900;break};case 73:{c[v>>2]=c[g>>2];ea=xl(f,v,j,ca,2)|0;la=c[j>>2]|0;if((la&4|0)==0&(ea|0)>0&(ea|0)<13){c[k+8>>2]=ea;break L7}else{c[j>>2]=la|4;break L7}break};case 68:{la=f|0;c[G>>2]=c[la>>2];c[H>>2]=c[g>>2];Fg(F,e,G,H,h,j,k,2216,2248);c[la>>2]=c[F>>2];break};case 106:{c[u>>2]=c[g>>2];la=xl(f,u,j,ca,3)|0;ea=c[j>>2]|0;if((ea&4|0)==0&(la|0)<366){c[k+28>>2]=la;break L7}else{c[j>>2]=ea|4;break L7}break};case 70:{ea=f|0;c[J>>2]=c[ea>>2];c[K>>2]=c[g>>2];Fg(I,e,J,K,h,j,k,2184,2216);c[ea>>2]=c[I>>2];break};case 98:case 66:case 104:{ea=c[g>>2]|0;la=e+8|0;pa=mc[c[(c[la>>2]|0)+4>>2]&127](la)|0;c[y>>2]=ea;ea=(jl(f,y,pa,pa+288|0,ca,j,0)|0)-pa|0;if((ea|0)>=288){break L7}c[k+16>>2]=((ea|0)/12|0|0)%12|0;break};default:{c[j>>2]=c[j>>2]|4}}}while(0);c[b>>2]=c[f>>2];i=m;return}}while(0);m=Yb(4)|0;jm(m);vb(m|0,8088,140)}function Pg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=d|0;d=f;L1:while(1){h=c[g>>2]|0;do{if((h|0)==0){j=1}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){l=mc[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[g>>2]=0;j=1;break}else{j=(c[g>>2]|0)==0;break}}}while(0);h=c[b>>2]|0;do{if((h|0)==0){m=15}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){n=mc[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{n=c[k>>2]|0}if((n|0)==-1){c[b>>2]=0;m=15;break}else{k=(h|0)==0;if(j^k){o=h;p=k;break}else{q=h;r=k;break L1}}}}while(0);if((m|0)==15){m=0;if(j){q=0;r=1;break}else{o=0;p=1}}h=c[g>>2]|0;k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){s=mc[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{s=c[k>>2]|0}if(!(kc[c[(c[d>>2]|0)+12>>2]&63](f,8192,s)|0)){q=o;r=p;break}k=c[g>>2]|0;h=k+12|0;t=c[h>>2]|0;if((t|0)==(c[k+16>>2]|0)){mc[c[(c[k>>2]|0)+40>>2]&127](k)|0;continue}else{c[h>>2]=t+4;continue}}p=c[g>>2]|0;do{if((p|0)==0){u=1}else{o=c[p+12>>2]|0;if((o|0)==(c[p+16>>2]|0)){v=mc[c[(c[p>>2]|0)+36>>2]&127](p)|0}else{v=c[o>>2]|0}if((v|0)==-1){c[g>>2]=0;u=1;break}else{u=(c[g>>2]|0)==0;break}}}while(0);do{if(r){m=37}else{g=c[q+12>>2]|0;if((g|0)==(c[q+16>>2]|0)){w=mc[c[(c[q>>2]|0)+36>>2]&127](q)|0}else{w=c[g>>2]|0}if((w|0)==-1){c[b>>2]=0;m=37;break}if(!(u^(q|0)==0)){break}i=a;return}}while(0);do{if((m|0)==37){if(u){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function Qg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=c[g>>2]|0;do{if((b|0)==0){h=1}else{j=c[b+12>>2]|0;if((j|0)==(c[b+16>>2]|0)){k=mc[c[(c[b>>2]|0)+36>>2]&127](b)|0}else{k=c[j>>2]|0}if((k|0)==-1){c[g>>2]=0;h=1;break}else{h=(c[g>>2]|0)==0;break}}}while(0);k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=14}else{b=c[d+12>>2]|0;if((b|0)==(c[d+16>>2]|0)){m=mc[c[(c[d>>2]|0)+36>>2]&127](d)|0}else{m=c[b>>2]|0}if((m|0)==-1){c[k>>2]=0;l=14;break}else{b=(d|0)==0;if(h^b){n=d;o=b;break}else{l=16;break}}}}while(0);if((l|0)==14){if(h){l=16}else{n=0;o=1}}if((l|0)==16){c[e>>2]=c[e>>2]|6;i=a;return}h=c[g>>2]|0;d=c[h+12>>2]|0;if((d|0)==(c[h+16>>2]|0)){p=mc[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{p=c[d>>2]|0}if((kc[c[(c[f>>2]|0)+52>>2]&63](f,p,0)|0)<<24>>24!=37){c[e>>2]=c[e>>2]|4;i=a;return}p=c[g>>2]|0;f=p+12|0;d=c[f>>2]|0;if((d|0)==(c[p+16>>2]|0)){mc[c[(c[p>>2]|0)+40>>2]&127](p)|0}else{c[f>>2]=d+4}d=c[g>>2]|0;do{if((d|0)==0){q=1}else{f=c[d+12>>2]|0;if((f|0)==(c[d+16>>2]|0)){r=mc[c[(c[d>>2]|0)+36>>2]&127](d)|0}else{r=c[f>>2]|0}if((r|0)==-1){c[g>>2]=0;q=1;break}else{q=(c[g>>2]|0)==0;break}}}while(0);do{if(o){l=38}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){s=mc[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{s=c[g>>2]|0}if((s|0)==-1){c[k>>2]=0;l=38;break}if(!(q^(n|0)==0)){break}i=a;return}}while(0);do{if((l|0)==38){if(q){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function Rg(a){a=a|0;Tg(a+8|0);fd(a|0);Lm(a);return}function Sg(a){a=a|0;Tg(a+8|0);fd(a|0);return}function Tg(b){b=b|0;var d=0;d=b|0;b=c[d>>2]|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);if((b|0)==(c[12708]|0)){return}hb(c[d>>2]|0);return}function Ug(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+112|0;f=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[f>>2];f=g|0;l=g+8|0;m=l|0;n=f|0;a[n]=37;o=f+1|0;a[o]=j;p=f+2|0;a[p]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[o]=k;a[p]=j}j=ub(m|0,100,n|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;l=c[e>>2]|0;if((j|0)==0){q=l;r=b|0;c[r>>2]=q;i=g;return}else{s=l;t=m}while(1){m=a[t]|0;if((s|0)==0){u=0}else{l=s+24|0;j=c[l>>2]|0;if((j|0)==(c[s+28>>2]|0)){v=uc[c[(c[s>>2]|0)+52>>2]&31](s,m&255)|0}else{c[l>>2]=j+1;a[j]=m;v=m&255}u=(v|0)==-1?0:s}m=t+1|0;if((m|0)==(d|0)){q=u;break}else{s=u;t=m}}r=b|0;c[r>>2]=q;i=g;return}function Vg(a){a=a|0;Tg(a+8|0);fd(a|0);Lm(a);return}function Wg(a){a=a|0;Tg(a+8|0);fd(a|0);return}function Xg(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+408|0;e=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[e>>2];e=f|0;k=f+400|0;l=e|0;c[k>>2]=e+400;Yg(b+8|0,l,k,g,h,j);j=c[k>>2]|0;k=c[d>>2]|0;if((l|0)==(j|0)){m=k;n=a|0;c[n>>2]=m;i=f;return}else{o=k;p=l}while(1){l=c[p>>2]|0;if((o|0)==0){q=0}else{k=o+24|0;d=c[k>>2]|0;if((d|0)==(c[o+28>>2]|0)){r=uc[c[(c[o>>2]|0)+52>>2]&31](o,l)|0}else{c[k>>2]=d+4;c[d>>2]=l;r=l}q=(r|0)==-1?0:o}l=p+4|0;if((l|0)==(j|0)){m=q;break}else{o=q;p=l}}n=a|0;c[n>>2]=m;i=f;return}function Yg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+120|0;k=j|0;l=j+112|0;m=i;i=i+4|0;i=i+7&-8;n=j+8|0;o=k|0;a[o]=37;p=k+1|0;a[p]=g;q=k+2|0;a[q]=h;a[k+3|0]=0;if(h<<24>>24!=0){a[p]=h;a[q]=g}g=b|0;ub(n|0,100,o|0,f|0,c[g>>2]|0)|0;c[l>>2]=0;c[l+4>>2]=0;c[m>>2]=n;n=(c[e>>2]|0)-d>>2;f=Mb(c[g>>2]|0)|0;g=$l(d,m,n,l)|0;if((f|0)!=0){Mb(f|0)|0}if((g|0)==-1){Uh(1080)}else{c[e>>2]=d+(g<<2);i=j;return}}function Zg(a){a=a|0;fd(a|0);Lm(a);return}function _g(a){a=a|0;fd(a|0);return}function $g(a){a=a|0;return 127}function ah(a){a=a|0;return 127}function bh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function ch(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function dh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function eh(a,b){a=a|0;b=b|0;Gd(a,1,45);return}function fh(a){a=a|0;return 0}function gh(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function hh(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function ih(a){a=a|0;fd(a|0);Lm(a);return}function jh(a){a=a|0;fd(a|0);return}function kh(a){a=a|0;return 127}function lh(a){a=a|0;return 127}function mh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function nh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function oh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function ph(a,b){a=a|0;b=b|0;Gd(a,1,45);return}function qh(a){a=a|0;return 0}function rh(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function sh(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function th(a){a=a|0;fd(a|0);Lm(a);return}function uh(a){a=a|0;fd(a|0);return}function vh(a){a=a|0;return 2147483647}function wh(a){a=a|0;return 2147483647}function xh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function yh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function zh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function Ah(a,b){a=a|0;b=b|0;Sd(a,1,45);return}function Bh(a){a=a|0;return 0}function Ch(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function Dh(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function Eh(a){a=a|0;fd(a|0);Lm(a);return}function Fh(a){a=a|0;fd(a|0);return}function Gh(a){a=a|0;return 2147483647}function Hh(a){a=a|0;return 2147483647}function Ih(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function Jh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function Kh(a,b){a=a|0;b=b|0;bn(a|0,0,12)|0;return}function Lh(a,b){a=a|0;b=b|0;Sd(a,1,45);return}function Mh(a){a=a|0;return 0}function Nh(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function Oh(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C;C=C>>8;a[c+1|0]=C;C=C>>8;a[c+2|0]=C;C=C>>8;a[c+3|0]=C;return}function Ph(a){a=a|0;fd(a|0);Lm(a);return}function Qh(a){a=a|0;fd(a|0);return}function Rh(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;d=i;i=i+280|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=d+160|0;t=d+176|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=170;w=m+100|0;$d(p,h);m=p|0;x=c[m>>2]|0;if((c[13102]|0)!=-1){c[l>>2]=52408;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52408,l,104)}l=(c[13103]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(Th(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;fc[c[(c[z>>2]|0)+32>>2]&15](A,2064,2074,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>98){H=Gm(G+2|0)|0;if((H|0)!=0){I=H;J=H;break}Qm();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+10|0;H=s;L=K;M=F;while(1){N=a[M]|0;O=C;while(1){P=O+1|0;if((a[O]|0)==N<<24>>24){Q=O;break}if((P|0)==(G|0)){Q=G;break}else{O=P}}a[L]=a[2064+(Q-H)|0]|0;O=M+1|0;N=L+1|0;if(O>>>0<(c[o>>2]|0)>>>0){L=N;M=O}else{R=N;break}}}else{R=K}a[R]=0;M=Ob(D|0,888,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}Hm(J);break}M=Yb(8)|0;nd(M,576);vb(M|0,8104,24)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){S=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){S=z;break}if((mc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[A>>2]=0;S=0;break}else{S=c[A>>2]|0;break}}}while(0);z=(S|0)==0;M=c[B>>2]|0;do{if((M|0)==0){T=46}else{if((c[M+12>>2]|0)!=(c[M+16>>2]|0)){if(z){break}else{T=48;break}}if((mc[c[(c[M>>2]|0)+36>>2]&127](M)|0)==-1){c[B>>2]=0;T=46;break}else{if(z^(M|0)==0){break}else{T=48;break}}}}while(0);if((T|0)==46){if(z){T=48}}if((T|0)==48){c[j>>2]=c[j>>2]|2}c[b>>2]=c[A>>2];hd(c[m>>2]|0)|0;M=c[u>>2]|0;c[u>>2]=0;if((M|0)==0){i=d;return}ic[c[v>>2]&511](M);i=d;return}}while(0);d=Yb(4)|0;jm(d);vb(d|0,8088,140)}function Sh(a){a=a|0;return}function Th(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0;q=i;i=i+440|0;r=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[r>>2];r=q|0;s=q+400|0;t=q+408|0;u=q+416|0;v=q+424|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=r|0;c[s>>2]=0;bn(w|0,0,12)|0;D=x;E=y;F=z;G=A;bn(D|0,0,12)|0;bn(E|0,0,12)|0;bn(F|0,0,12)|0;bn(G|0,0,12)|0;Wh(g,h,s,t,u,v,x,y,z,B);h=n|0;c[o>>2]=c[h>>2];g=e|0;e=f|0;f=s;s=m+8|0;m=z+1|0;H=z+4|0;I=z+8|0;J=y+1|0;K=y+4|0;L=y+8|0;M=(j&512|0)!=0;j=x+1|0;N=x+4|0;O=x+8|0;P=A+1|0;Q=A+4|0;R=A+8|0;S=f+3|0;T=v+4|0;U=n+4|0;n=p;p=170;V=C;W=C;C=r+400|0;r=0;X=0;L2:while(1){Y=c[g>>2]|0;do{if((Y|0)==0){Z=0}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){Z=Y;break}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)==-1){c[g>>2]=0;Z=0;break}else{Z=c[g>>2]|0;break}}}while(0);Y=(Z|0)==0;_=c[e>>2]|0;do{if((_|0)==0){$=15}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){if(Y){aa=_;break}else{ba=p;ca=V;da=W;ea=r;$=273;break L2}}if((mc[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[e>>2]=0;$=15;break}else{if(Y){aa=_;break}else{ba=p;ca=V;da=W;ea=r;$=273;break L2}}}}while(0);if(($|0)==15){$=0;if(Y){ba=p;ca=V;da=W;ea=r;$=273;break}else{aa=0}}L24:do{switch(a[f+X|0]|0){case 3:{_=a[E]|0;fa=_&255;ga=(fa&1|0)==0?fa>>>1:c[K>>2]|0;fa=a[F]|0;ha=fa&255;ia=(ha&1|0)==0?ha>>>1:c[H>>2]|0;if((ga|0)==(-ia|0)){ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L24}ha=(ga|0)==0;ga=c[g>>2]|0;pa=c[ga+12>>2]|0;qa=c[ga+16>>2]|0;ra=(pa|0)==(qa|0);if(!(ha|(ia|0)==0)){if(ra){ia=(mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)&255;sa=c[g>>2]|0;ta=ia;ua=a[E]|0;va=sa;wa=c[sa+12>>2]|0;xa=c[sa+16>>2]|0}else{ta=a[pa]|0;ua=_;va=ga;wa=pa;xa=qa}qa=va+12|0;sa=(wa|0)==(xa|0);if(ta<<24>>24==(a[(ua&1)==0?J:c[L>>2]|0]|0)){if(sa){mc[c[(c[va>>2]|0)+40>>2]&127](va)|0}else{c[qa>>2]=wa+1}qa=d[E]|0;ja=((qa&1|0)==0?qa>>>1:c[K>>2]|0)>>>0>1>>>0?y:r;ka=C;la=W;ma=V;na=p;oa=n;break L24}if(sa){ya=(mc[c[(c[va>>2]|0)+36>>2]&127](va)|0)&255}else{ya=a[wa]|0}if(ya<<24>>24!=(a[(a[F]&1)==0?m:c[I>>2]|0]|0)){$=110;break L2}sa=c[g>>2]|0;qa=sa+12|0;ia=c[qa>>2]|0;if((ia|0)==(c[sa+16>>2]|0)){mc[c[(c[sa>>2]|0)+40>>2]&127](sa)|0}else{c[qa>>2]=ia+1}a[l]=1;ia=d[F]|0;ja=((ia&1|0)==0?ia>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;ka=C;la=W;ma=V;na=p;oa=n;break L24}if(ha){if(ra){ha=(mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)&255;za=ha;Aa=a[F]|0}else{za=a[pa]|0;Aa=fa}if(za<<24>>24!=(a[(Aa&1)==0?m:c[I>>2]|0]|0)){ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L24}fa=c[g>>2]|0;ha=fa+12|0;ia=c[ha>>2]|0;if((ia|0)==(c[fa+16>>2]|0)){mc[c[(c[fa>>2]|0)+40>>2]&127](fa)|0}else{c[ha>>2]=ia+1}a[l]=1;ia=d[F]|0;ja=((ia&1|0)==0?ia>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;ka=C;la=W;ma=V;na=p;oa=n;break L24}if(ra){ra=(mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)&255;Ba=ra;Ca=a[E]|0}else{Ba=a[pa]|0;Ca=_}if(Ba<<24>>24!=(a[(Ca&1)==0?J:c[L>>2]|0]|0)){a[l]=1;ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L24}_=c[g>>2]|0;pa=_+12|0;ra=c[pa>>2]|0;if((ra|0)==(c[_+16>>2]|0)){mc[c[(c[_>>2]|0)+40>>2]&127](_)|0}else{c[pa>>2]=ra+1}ra=d[E]|0;ja=((ra&1|0)==0?ra>>>1:c[K>>2]|0)>>>0>1>>>0?y:r;ka=C;la=W;ma=V;na=p;oa=n;break};case 4:{ra=0;pa=C;_=W;ga=V;ia=p;ha=n;L77:while(1){fa=c[g>>2]|0;do{if((fa|0)==0){Da=0}else{if((c[fa+12>>2]|0)!=(c[fa+16>>2]|0)){Da=fa;break}if((mc[c[(c[fa>>2]|0)+36>>2]&127](fa)|0)==-1){c[g>>2]=0;Da=0;break}else{Da=c[g>>2]|0;break}}}while(0);fa=(Da|0)==0;qa=c[e>>2]|0;do{if((qa|0)==0){$=167}else{if((c[qa+12>>2]|0)!=(c[qa+16>>2]|0)){if(fa){break}else{break L77}}if((mc[c[(c[qa>>2]|0)+36>>2]&127](qa)|0)==-1){c[e>>2]=0;$=167;break}else{if(fa){break}else{break L77}}}}while(0);if(($|0)==167){$=0;if(fa){break}}qa=c[g>>2]|0;sa=c[qa+12>>2]|0;if((sa|0)==(c[qa+16>>2]|0)){Ea=(mc[c[(c[qa>>2]|0)+36>>2]&127](qa)|0)&255}else{Ea=a[sa]|0}sa=Ea<<24>>24;do{if((Db(sa|0)|0)==0){$=187}else{if((b[(c[s>>2]|0)+(sa<<1)>>1]&2048)==0){$=187;break}qa=c[o>>2]|0;if((qa|0)==(ha|0)){Fa=(c[U>>2]|0)!=170;Ga=c[h>>2]|0;Ha=ha-Ga|0;Ia=Ha>>>0<2147483647>>>0?Ha<<1:-1;Ja=Im(Fa?Ga:0,Ia)|0;if((Ja|0)==0){Qm()}do{if(Fa){c[h>>2]=Ja;Ka=Ja}else{Ga=c[h>>2]|0;c[h>>2]=Ja;if((Ga|0)==0){Ka=Ja;break}ic[c[U>>2]&511](Ga);Ka=c[h>>2]|0}}while(0);c[U>>2]=86;Ja=Ka+Ha|0;c[o>>2]=Ja;La=(c[h>>2]|0)+Ia|0;Ma=Ja}else{La=ha;Ma=qa}c[o>>2]=Ma+1;a[Ma]=Ea;Na=ra+1|0;Oa=pa;Pa=_;Qa=ga;Ra=ia;Sa=La}}while(0);if(($|0)==187){$=0;sa=d[w]|0;if(!((((sa&1|0)==0?sa>>>1:c[T>>2]|0)|0)!=0&(ra|0)!=0&Ea<<24>>24==(a[u]|0))){break}if((_|0)==(pa|0)){sa=_-ga|0;fa=sa>>>0<2147483647>>>0?sa<<1:-1;if((ia|0)==170){Ta=0}else{Ta=ga}Ja=Im(Ta,fa)|0;Fa=Ja;if((Ja|0)==0){Qm()}Ua=Fa+(fa>>>2<<2)|0;Va=Fa+(sa>>2<<2)|0;Wa=Fa;Xa=86}else{Ua=pa;Va=_;Wa=ga;Xa=ia}c[Va>>2]=ra;Na=0;Oa=Ua;Pa=Va+4|0;Qa=Wa;Ra=Xa;Sa=ha}Fa=c[g>>2]|0;sa=Fa+12|0;fa=c[sa>>2]|0;if((fa|0)==(c[Fa+16>>2]|0)){mc[c[(c[Fa>>2]|0)+40>>2]&127](Fa)|0;ra=Na;pa=Oa;_=Pa;ga=Qa;ia=Ra;ha=Sa;continue}else{c[sa>>2]=fa+1;ra=Na;pa=Oa;_=Pa;ga=Qa;ia=Ra;ha=Sa;continue}}if((ga|0)!=(_|0)&(ra|0)!=0){if((_|0)==(pa|0)){fa=_-ga|0;sa=fa>>>0<2147483647>>>0?fa<<1:-1;if((ia|0)==170){Ya=0}else{Ya=ga}Fa=Im(Ya,sa)|0;Ja=Fa;if((Fa|0)==0){Qm()}Za=Ja+(sa>>>2<<2)|0;_a=Ja+(fa>>2<<2)|0;$a=Ja;ab=86}else{Za=pa;_a=_;$a=ga;ab=ia}c[_a>>2]=ra;bb=Za;cb=_a+4|0;db=$a;eb=ab}else{bb=pa;cb=_;db=ga;eb=ia}if((c[B>>2]|0)>0){Ja=c[g>>2]|0;do{if((Ja|0)==0){fb=0}else{if((c[Ja+12>>2]|0)!=(c[Ja+16>>2]|0)){fb=Ja;break}if((mc[c[(c[Ja>>2]|0)+36>>2]&127](Ja)|0)==-1){c[g>>2]=0;fb=0;break}else{fb=c[g>>2]|0;break}}}while(0);Ja=(fb|0)==0;ia=c[e>>2]|0;do{if((ia|0)==0){$=219}else{if((c[ia+12>>2]|0)!=(c[ia+16>>2]|0)){if(Ja){gb=ia;break}else{$=226;break L2}}if((mc[c[(c[ia>>2]|0)+36>>2]&127](ia)|0)==-1){c[e>>2]=0;$=219;break}else{if(Ja){gb=ia;break}else{$=226;break L2}}}}while(0);if(($|0)==219){$=0;if(Ja){$=226;break L2}else{gb=0}}ia=c[g>>2]|0;ga=c[ia+12>>2]|0;if((ga|0)==(c[ia+16>>2]|0)){hb=(mc[c[(c[ia>>2]|0)+36>>2]&127](ia)|0)&255}else{hb=a[ga]|0}if(hb<<24>>24!=(a[t]|0)){$=226;break L2}ga=c[g>>2]|0;ia=ga+12|0;_=c[ia>>2]|0;if((_|0)==(c[ga+16>>2]|0)){mc[c[(c[ga>>2]|0)+40>>2]&127](ga)|0;ib=ha;jb=gb}else{c[ia>>2]=_+1;ib=ha;jb=gb}while(1){_=c[g>>2]|0;do{if((_|0)==0){kb=0}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){kb=_;break}if((mc[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[g>>2]=0;kb=0;break}else{kb=c[g>>2]|0;break}}}while(0);_=(kb|0)==0;do{if((jb|0)==0){$=242}else{if((c[jb+12>>2]|0)!=(c[jb+16>>2]|0)){if(_){lb=jb;break}else{$=251;break L2}}if((mc[c[(c[jb>>2]|0)+36>>2]&127](jb)|0)==-1){c[e>>2]=0;$=242;break}else{if(_){lb=jb;break}else{$=251;break L2}}}}while(0);if(($|0)==242){$=0;if(_){$=251;break L2}else{lb=0}}ia=c[g>>2]|0;ga=c[ia+12>>2]|0;if((ga|0)==(c[ia+16>>2]|0)){mb=(mc[c[(c[ia>>2]|0)+36>>2]&127](ia)|0)&255}else{mb=a[ga]|0}ga=mb<<24>>24;if((Db(ga|0)|0)==0){$=251;break L2}if((b[(c[s>>2]|0)+(ga<<1)>>1]&2048)==0){$=251;break L2}ga=c[o>>2]|0;if((ga|0)==(ib|0)){ia=(c[U>>2]|0)!=170;pa=c[h>>2]|0;ra=ib-pa|0;fa=ra>>>0<2147483647>>>0?ra<<1:-1;sa=Im(ia?pa:0,fa)|0;if((sa|0)==0){Qm()}do{if(ia){c[h>>2]=sa;nb=sa}else{pa=c[h>>2]|0;c[h>>2]=sa;if((pa|0)==0){nb=sa;break}ic[c[U>>2]&511](pa);nb=c[h>>2]|0}}while(0);c[U>>2]=86;sa=nb+ra|0;c[o>>2]=sa;ob=(c[h>>2]|0)+fa|0;pb=sa}else{ob=ib;pb=ga}sa=c[g>>2]|0;ia=c[sa+12>>2]|0;if((ia|0)==(c[sa+16>>2]|0)){_=(mc[c[(c[sa>>2]|0)+36>>2]&127](sa)|0)&255;qb=_;rb=c[o>>2]|0}else{qb=a[ia]|0;rb=pb}c[o>>2]=rb+1;a[rb]=qb;ia=(c[B>>2]|0)-1|0;c[B>>2]=ia;_=c[g>>2]|0;sa=_+12|0;pa=c[sa>>2]|0;if((pa|0)==(c[_+16>>2]|0)){mc[c[(c[_>>2]|0)+40>>2]&127](_)|0}else{c[sa>>2]=pa+1}if((ia|0)>0){ib=ob;jb=lb}else{sb=ob;break}}}else{sb=ha}if((c[o>>2]|0)==(c[h>>2]|0)){$=271;break L2}else{ja=r;ka=bb;la=cb;ma=db;na=eb;oa=sb}break};case 2:{if(!((r|0)!=0|X>>>0<2>>>0)){if((X|0)==2){tb=(a[S]|0)!=0}else{tb=0}if(!(M|tb)){ja=0;ka=C;la=W;ma=V;na=p;oa=n;break L24}}Ja=a[D]|0;ia=c[O>>2]|0;pa=(Ja&1)==0?j:ia;L239:do{if((X|0)==0){ub=pa;vb=Ja;wb=ia}else{if((d[f+(X-1)|0]|0)>>>0>=2>>>0){ub=pa;vb=Ja;wb=ia;break}sa=Ja&255;L242:do{if((((sa&1|0)==0?sa>>>1:c[N>>2]|0)|0)==0){xb=pa;yb=Ja;zb=ia}else{_=pa;while(1){Fa=a[_]|0;if((Db(Fa|0)|0)==0){break}if((b[(c[s>>2]|0)+(Fa<<1)>>1]&8192)==0){break}Fa=_+1|0;Ga=a[D]|0;Ab=c[O>>2]|0;Bb=Ga&255;if((Fa|0)==(((Ga&1)==0?j:Ab)+((Bb&1|0)==0?Bb>>>1:c[N>>2]|0)|0)){xb=Fa;yb=Ga;zb=Ab;break L242}else{_=Fa}}xb=_;yb=a[D]|0;zb=c[O>>2]|0}}while(0);sa=(yb&1)==0?j:zb;ga=xb-sa|0;fa=a[G]|0;ra=fa&255;qa=(ra&1|0)==0?ra>>>1:c[Q>>2]|0;if(qa>>>0<ga>>>0){ub=sa;vb=yb;wb=zb;break}ra=(fa&1)==0?P:c[R>>2]|0;fa=ra+qa|0;if((xb|0)==(sa|0)){ub=xb;vb=yb;wb=zb;break}Ia=ra+(qa-ga)|0;ga=sa;while(1){if((a[Ia]|0)!=(a[ga]|0)){ub=sa;vb=yb;wb=zb;break L239}qa=Ia+1|0;if((qa|0)==(fa|0)){ub=xb;vb=yb;wb=zb;break}else{Ia=qa;ga=ga+1|0}}}}while(0);pa=vb&255;L256:do{if((ub|0)==(((vb&1)==0?j:wb)+((pa&1|0)==0?pa>>>1:c[N>>2]|0)|0)){Cb=ub}else{ia=aa;Ja=ub;while(1){ha=c[g>>2]|0;do{if((ha|0)==0){Eb=0}else{if((c[ha+12>>2]|0)!=(c[ha+16>>2]|0)){Eb=ha;break}if((mc[c[(c[ha>>2]|0)+36>>2]&127](ha)|0)==-1){c[g>>2]=0;Eb=0;break}else{Eb=c[g>>2]|0;break}}}while(0);ha=(Eb|0)==0;do{if((ia|0)==0){$=141}else{if((c[ia+12>>2]|0)!=(c[ia+16>>2]|0)){if(ha){Fb=ia;break}else{Cb=Ja;break L256}}if((mc[c[(c[ia>>2]|0)+36>>2]&127](ia)|0)==-1){c[e>>2]=0;$=141;break}else{if(ha){Fb=ia;break}else{Cb=Ja;break L256}}}}while(0);if(($|0)==141){$=0;if(ha){Cb=Ja;break L256}else{Fb=0}}_=c[g>>2]|0;ga=c[_+12>>2]|0;if((ga|0)==(c[_+16>>2]|0)){Gb=(mc[c[(c[_>>2]|0)+36>>2]&127](_)|0)&255}else{Gb=a[ga]|0}if(Gb<<24>>24!=(a[Ja]|0)){Cb=Ja;break L256}ga=c[g>>2]|0;_=ga+12|0;Ia=c[_>>2]|0;if((Ia|0)==(c[ga+16>>2]|0)){mc[c[(c[ga>>2]|0)+40>>2]&127](ga)|0}else{c[_>>2]=Ia+1}Ia=Ja+1|0;_=a[D]|0;ga=_&255;if((Ia|0)==(((_&1)==0?j:c[O>>2]|0)+((ga&1|0)==0?ga>>>1:c[N>>2]|0)|0)){Cb=Ia;break}else{ia=Fb;Ja=Ia}}}}while(0);if(!M){ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L24}pa=a[D]|0;Ja=pa&255;if((Cb|0)==(((pa&1)==0?j:c[O>>2]|0)+((Ja&1|0)==0?Ja>>>1:c[N>>2]|0)|0)){ja=r;ka=C;la=W;ma=V;na=p;oa=n}else{$=154;break L2}break};case 0:{$=43;break};case 1:{if((X|0)==3){ba=p;ca=V;da=W;ea=r;$=273;break L2}Ja=c[g>>2]|0;pa=c[Ja+12>>2]|0;if((pa|0)==(c[Ja+16>>2]|0)){Hb=(mc[c[(c[Ja>>2]|0)+36>>2]&127](Ja)|0)&255}else{Hb=a[pa]|0}pa=Hb<<24>>24;if((Db(pa|0)|0)==0){$=42;break L2}if((b[(c[s>>2]|0)+(pa<<1)>>1]&8192)==0){$=42;break L2}pa=c[g>>2]|0;Ja=pa+12|0;ia=c[Ja>>2]|0;if((ia|0)==(c[pa+16>>2]|0)){Ib=(mc[c[(c[pa>>2]|0)+40>>2]&127](pa)|0)&255}else{c[Ja>>2]=ia+1;Ib=a[ia]|0}Od(A,Ib);$=43;break};default:{ja=r;ka=C;la=W;ma=V;na=p;oa=n}}}while(0);L306:do{if(($|0)==43){$=0;if((X|0)==3){ba=p;ca=V;da=W;ea=r;$=273;break L2}else{Jb=aa}while(1){Y=c[g>>2]|0;do{if((Y|0)==0){Kb=0}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){Kb=Y;break}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)==-1){c[g>>2]=0;Kb=0;break}else{Kb=c[g>>2]|0;break}}}while(0);Y=(Kb|0)==0;do{if((Jb|0)==0){$=56}else{if((c[Jb+12>>2]|0)!=(c[Jb+16>>2]|0)){if(Y){Lb=Jb;break}else{ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L306}}if((mc[c[(c[Jb>>2]|0)+36>>2]&127](Jb)|0)==-1){c[e>>2]=0;$=56;break}else{if(Y){Lb=Jb;break}else{ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L306}}}}while(0);if(($|0)==56){$=0;if(Y){ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L306}else{Lb=0}}ia=c[g>>2]|0;Ja=c[ia+12>>2]|0;if((Ja|0)==(c[ia+16>>2]|0)){Mb=(mc[c[(c[ia>>2]|0)+36>>2]&127](ia)|0)&255}else{Mb=a[Ja]|0}Ja=Mb<<24>>24;if((Db(Ja|0)|0)==0){ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L306}if((b[(c[s>>2]|0)+(Ja<<1)>>1]&8192)==0){ja=r;ka=C;la=W;ma=V;na=p;oa=n;break L306}Ja=c[g>>2]|0;ia=Ja+12|0;pa=c[ia>>2]|0;if((pa|0)==(c[Ja+16>>2]|0)){Nb=(mc[c[(c[Ja>>2]|0)+40>>2]&127](Ja)|0)&255}else{c[ia>>2]=pa+1;Nb=a[pa]|0}Od(A,Nb);Jb=Lb}}}while(0);pa=X+1|0;if(pa>>>0<4>>>0){n=oa;p=na;V=ma;W=la;C=ka;r=ja;X=pa}else{ba=na;ca=ma;da=la;ea=ja;$=273;break}}L344:do{if(($|0)==42){c[k>>2]=c[k>>2]|4;Ob=0;Pb=V;Qb=p}else if(($|0)==271){c[k>>2]=c[k>>2]|4;Ob=0;Pb=db;Qb=eb}else if(($|0)==110){c[k>>2]=c[k>>2]|4;Ob=0;Pb=V;Qb=p}else if(($|0)==273){L349:do{if((ea|0)!=0){ja=ea;la=ea+1|0;ma=ea+8|0;na=ea+4|0;X=1;L351:while(1){r=d[ja]|0;if((r&1|0)==0){Rb=r>>>1}else{Rb=c[na>>2]|0}if(X>>>0>=Rb>>>0){break L349}r=c[g>>2]|0;do{if((r|0)==0){Sb=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){Sb=r;break}if((mc[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1){c[g>>2]=0;Sb=0;break}else{Sb=c[g>>2]|0;break}}}while(0);r=(Sb|0)==0;Y=c[e>>2]|0;do{if((Y|0)==0){$=291}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){if(r){break}else{break L351}}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)==-1){c[e>>2]=0;$=291;break}else{if(r){break}else{break L351}}}}while(0);if(($|0)==291){$=0;if(r){break}}Y=c[g>>2]|0;ka=c[Y+12>>2]|0;if((ka|0)==(c[Y+16>>2]|0)){Tb=(mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)&255}else{Tb=a[ka]|0}if((a[ja]&1)==0){Ub=la}else{Ub=c[ma>>2]|0}if(Tb<<24>>24!=(a[Ub+X|0]|0)){break}ka=X+1|0;Y=c[g>>2]|0;C=Y+12|0;W=c[C>>2]|0;if((W|0)==(c[Y+16>>2]|0)){mc[c[(c[Y>>2]|0)+40>>2]&127](Y)|0;X=ka;continue}else{c[C>>2]=W+1;X=ka;continue}}c[k>>2]=c[k>>2]|4;Ob=0;Pb=ca;Qb=ba;break L344}}while(0);if((ca|0)==(da|0)){Ob=1;Pb=da;Qb=ba;break}X=v;ma=a[w]|0;la=ma&255;if((((la&1|0)==0?la>>>1:c[T>>2]|0)|0)==0){Ob=1;Pb=ca;Qb=ba;break}la=da-4|0;ja=la>>>0>ca>>>0;if(ja){na=ca;ka=la;do{W=c[na>>2]|0;c[na>>2]=c[ka>>2];c[ka>>2]=W;na=na+4|0;ka=ka-4|0;}while(na>>>0<ka>>>0);Vb=a[w]|0}else{Vb=ma}if((Vb&1)==0){Wb=X+1|0}else{Wb=c[v+8>>2]|0}ka=Vb&255;na=a[Wb]|0;W=na<<24>>24;C=na<<24>>24<1|na<<24>>24==127;L403:do{if(ja){na=Wb+((ka&1|0)==0?ka>>>1:c[T>>2]|0)|0;Y=Wb;oa=ca;n=W;Lb=C;while(1){if(!Lb){if((n|0)!=(c[oa>>2]|0)){break L403}}Jb=(na-Y|0)>1?Y+1|0:Y;Nb=oa+4|0;s=a[Jb]|0;Mb=s<<24>>24;Kb=s<<24>>24<1|s<<24>>24==127;if(Nb>>>0<la>>>0){Y=Jb;oa=Nb;n=Mb;Lb=Kb}else{Xb=Mb;Yb=Kb;$=317;break}}}else{Xb=W;Yb=C;$=317}}while(0);if(($|0)==317){if(Yb){Ob=1;Pb=ca;Qb=ba;break}if(((c[la>>2]|0)-1|0)>>>0<Xb>>>0){Ob=1;Pb=ca;Qb=ba;break}}c[k>>2]=c[k>>2]|4;Ob=0;Pb=ca;Qb=ba}else if(($|0)==226){c[k>>2]=c[k>>2]|4;Ob=0;Pb=db;Qb=eb}else if(($|0)==154){c[k>>2]=c[k>>2]|4;Ob=0;Pb=V;Qb=p}else if(($|0)==251){c[k>>2]=c[k>>2]|4;Ob=0;Pb=db;Qb=eb}}while(0);Hd(A);Hd(z);Hd(y);Hd(x);Hd(v);if((Pb|0)==0){i=q;return Ob|0}ic[Qb&511](Pb);i=q;return Ob|0}function Uh(a){a=a|0;var b=0;b=Yb(8)|0;nd(b,a);vb(b|0,8104,24)}function Vh(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;i=i+160|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=170;u=m+100|0;$d(p,h);m=p|0;v=c[m>>2]|0;if((c[13102]|0)!=-1){c[l>>2]=52408;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52408,l,104)}l=(c[13103]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(Th(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){a[k+1|0]=0;a[B]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){Od(k,uc[c[(c[B>>2]|0)+28>>2]&31](y,45)|0)}x=uc[c[(c[B>>2]|0)+28>>2]&31](y,48)|0;y=c[s>>2]|0;B=c[o>>2]|0;C=B-1|0;L20:do{if(y>>>0<C>>>0){D=y;while(1){E=D+1|0;if((a[D]|0)!=x<<24>>24){F=D;break L20}if(E>>>0<C>>>0){D=E}else{F=E;break}}}else{F=y}}while(0);yl(k,F,B)|0}y=e|0;C=c[y>>2]|0;do{if((C|0)==0){G=0}else{if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){G=C;break}if((mc[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[y>>2]=0;G=0;break}else{G=c[y>>2]|0;break}}}while(0);C=(G|0)==0;do{if((A|0)==0){H=34}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(C){break}else{H=36;break}}if((mc[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[z>>2]=0;H=34;break}else{if(C^(A|0)==0){break}else{H=36;break}}}}while(0);if((H|0)==34){if(C){H=36}}if((H|0)==36){c[j>>2]=c[j>>2]|2}c[b>>2]=c[y>>2];hd(c[m>>2]|0)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}ic[c[t>>2]&511](A);i=d;return}}while(0);d=Yb(4)|0;jm(d);vb(d|0,8088,140)}function Wh(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[13220]|0)!=-1){c[p>>2]=52880;c[p+4>>2]=14;c[p+8>>2]=0;Cd(52880,p,104)}p=(c[13221]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=Yb(4)|0;L=K;jm(L);vb(K|0,8088,140)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=Yb(4)|0;L=K;jm(L);vb(K|0,8088,140)}K=b;jc[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C;C=C>>8;a[L+1|0]=C;C=C>>8;a[L+2|0]=C;C=C>>8;a[L+3|0]=C;L=b;jc[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){a[l+1|0]=0;a[q]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}Md(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];bn(s|0,0,12)|0;Hd(r);jc[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){a[k+1|0]=0;a[r]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}Md(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];bn(u|0,0,12)|0;Hd(t);t=b;a[f]=mc[c[(c[t>>2]|0)+12>>2]&127](K)|0;a[g]=mc[c[(c[t>>2]|0)+16>>2]&127](K)|0;jc[c[(c[L>>2]|0)+20>>2]&127](v,K);t=h;if((a[t]&1)==0){a[h+1|0]=0;a[t]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}Md(h,0);c[t>>2]=c[w>>2];c[t+4>>2]=c[w+4>>2];c[t+8>>2]=c[w+8>>2];bn(w|0,0,12)|0;Hd(v);jc[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){a[j+1|0]=0;a[L]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}Md(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];bn(y|0,0,12)|0;Hd(x);M=mc[c[(c[b>>2]|0)+36>>2]&127](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[13222]|0)!=-1){c[o>>2]=52888;c[o+4>>2]=14;c[o+8>>2]=0;Cd(52888,o,104)}o=(c[13223]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=Yb(4)|0;O=N;jm(O);vb(N|0,8088,140)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=Yb(4)|0;O=N;jm(O);vb(N|0,8088,140)}N=K;jc[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C;C=C>>8;a[O+1|0]=C;C=C>>8;a[O+2|0]=C;C=C>>8;a[O+3|0]=C;O=K;jc[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){a[l+1|0]=0;a[z]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}Md(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];bn(B|0,0,12)|0;Hd(A);jc[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){a[k+1|0]=0;a[A]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}Md(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];bn(E|0,0,12)|0;Hd(D);D=K;a[f]=mc[c[(c[D>>2]|0)+12>>2]&127](N)|0;a[g]=mc[c[(c[D>>2]|0)+16>>2]&127](N)|0;jc[c[(c[O>>2]|0)+20>>2]&127](F,N);D=h;if((a[D]&1)==0){a[h+1|0]=0;a[D]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}Md(h,0);c[D>>2]=c[G>>2];c[D+4>>2]=c[G+4>>2];c[D+8>>2]=c[G+8>>2];bn(G|0,0,12)|0;Hd(F);jc[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){a[j+1|0]=0;a[O]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}Md(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];bn(I|0,0,12)|0;Hd(H);M=mc[c[(c[K>>2]|0)+36>>2]&127](N)|0;c[m>>2]=M;i=n;return}}function Xh(a){a=a|0;fd(a|0);Lm(a);return}function Yh(a){a=a|0;fd(a|0);return}function Zh(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;d=i;i=i+600|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=d+456|0;t=d+496|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=170;w=m+400|0;$d(p,h);m=p|0;x=c[m>>2]|0;if((c[13100]|0)!=-1){c[l>>2]=52400;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52400,l,104)}l=(c[13101]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(_h(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;fc[c[(c[z>>2]|0)+48>>2]&15](A,2048,2058,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>392){H=Gm((G>>2)+2|0)|0;if((H|0)!=0){I=H;J=H;break}Qm();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+40|0;H=s;L=K;M=F;while(1){N=c[M>>2]|0;O=C;while(1){P=O+4|0;if((c[O>>2]|0)==(N|0)){Q=O;break}if((P|0)==(G|0)){Q=G;break}else{O=P}}a[L]=a[2048+(Q-H>>2)|0]|0;O=M+4|0;N=L+1|0;if(O>>>0<(c[o>>2]|0)>>>0){L=N;M=O}else{R=N;break}}}else{R=K}a[R]=0;M=Ob(D|0,888,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}Hm(J);break}M=Yb(8)|0;nd(M,576);vb(M|0,8104,24)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){S=1}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){T=mc[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{T=c[M>>2]|0}if((T|0)==-1){c[A>>2]=0;S=1;break}else{S=(c[A>>2]|0)==0;break}}}while(0);z=c[B>>2]|0;do{if((z|0)==0){U=47}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){V=mc[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{V=c[M>>2]|0}if((V|0)==-1){c[B>>2]=0;U=47;break}else{if(S^(z|0)==0){break}else{U=49;break}}}}while(0);if((U|0)==47){if(S){U=49}}if((U|0)==49){c[j>>2]=c[j>>2]|2}c[b>>2]=c[A>>2];hd(c[m>>2]|0)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}ic[c[v>>2]&511](z);i=d;return}}while(0);d=Yb(4)|0;jm(d);vb(d|0,8088,140)}function _h(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0;p=i;i=i+440|0;q=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[q>>2];q=p|0;r=p+400|0;s=p+408|0;t=p+416|0;u=p+424|0;v=u;w=i;i=i+12|0;i=i+7&-8;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;B=q|0;c[r>>2]=0;bn(v|0,0,12)|0;C=w;D=x;E=y;F=z;bn(C|0,0,12)|0;bn(D|0,0,12)|0;bn(E|0,0,12)|0;bn(F|0,0,12)|0;ai(f,g,r,s,t,u,w,x,y,A);g=m|0;c[n>>2]=c[g>>2];f=b|0;b=e|0;e=r;r=l;G=y+4|0;H=y+8|0;I=x+4|0;J=x+8|0;K=(h&512|0)!=0;h=w+4|0;L=w+8|0;M=z+4|0;N=z+8|0;O=e+3|0;P=m+4|0;m=u+4|0;Q=o;o=170;R=B;S=B;B=q+400|0;q=0;T=0;L2:while(1){U=c[f>>2]|0;do{if((U|0)==0){V=1}else{W=c[U+12>>2]|0;if((W|0)==(c[U+16>>2]|0)){X=mc[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{X=c[W>>2]|0}if((X|0)==-1){c[f>>2]=0;V=1;break}else{V=(c[f>>2]|0)==0;break}}}while(0);U=c[b>>2]|0;do{if((U|0)==0){Y=16}else{W=c[U+12>>2]|0;if((W|0)==(c[U+16>>2]|0)){Z=mc[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{Z=c[W>>2]|0}if((Z|0)==-1){c[b>>2]=0;Y=16;break}else{if(V^(U|0)==0){_=U;break}else{$=o;aa=R;ba=S;ca=q;Y=274;break L2}}}}while(0);if((Y|0)==16){Y=0;if(V){$=o;aa=R;ba=S;ca=q;Y=274;break}else{_=0}}L26:do{switch(a[e+T|0]|0){case 1:{if((T|0)==3){$=o;aa=R;ba=S;ca=q;Y=274;break L2}U=c[f>>2]|0;W=c[U+12>>2]|0;if((W|0)==(c[U+16>>2]|0)){da=mc[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{da=c[W>>2]|0}if(!(kc[c[(c[r>>2]|0)+12>>2]&63](l,8192,da)|0)){Y=40;break L2}W=c[f>>2]|0;U=W+12|0;ea=c[U>>2]|0;if((ea|0)==(c[W+16>>2]|0)){fa=mc[c[(c[W>>2]|0)+40>>2]&127](W)|0}else{c[U>>2]=ea+4;fa=c[ea>>2]|0}Wd(z,fa);Y=41;break};case 0:{Y=41;break};case 3:{ea=a[D]|0;U=ea&255;W=(U&1|0)==0;ga=a[E]|0;ha=ga&255;ia=(ha&1|0)==0;if(((W?U>>>1:c[I>>2]|0)|0)==(-(ia?ha>>>1:c[G>>2]|0)|0)){ja=q;ka=B;la=S;ma=R;na=o;oa=Q;break L26}do{if(((W?U>>>1:c[I>>2]|0)|0)!=0){if(((ia?ha>>>1:c[G>>2]|0)|0)==0){break}pa=c[f>>2]|0;qa=c[pa+12>>2]|0;if((qa|0)==(c[pa+16>>2]|0)){ra=mc[c[(c[pa>>2]|0)+36>>2]&127](pa)|0;sa=ra;ta=a[D]|0}else{sa=c[qa>>2]|0;ta=ea}qa=c[f>>2]|0;ra=qa+12|0;pa=c[ra>>2]|0;ua=(pa|0)==(c[qa+16>>2]|0);if((sa|0)==(c[((ta&1)==0?I:c[J>>2]|0)>>2]|0)){if(ua){mc[c[(c[qa>>2]|0)+40>>2]&127](qa)|0}else{c[ra>>2]=pa+4}ra=d[D]|0;ja=((ra&1|0)==0?ra>>>1:c[I>>2]|0)>>>0>1>>>0?x:q;ka=B;la=S;ma=R;na=o;oa=Q;break L26}if(ua){va=mc[c[(c[qa>>2]|0)+36>>2]&127](qa)|0}else{va=c[pa>>2]|0}if((va|0)!=(c[((a[E]&1)==0?G:c[H>>2]|0)>>2]|0)){Y=106;break L2}pa=c[f>>2]|0;qa=pa+12|0;ua=c[qa>>2]|0;if((ua|0)==(c[pa+16>>2]|0)){mc[c[(c[pa>>2]|0)+40>>2]&127](pa)|0}else{c[qa>>2]=ua+4}a[k]=1;ua=d[E]|0;ja=((ua&1|0)==0?ua>>>1:c[G>>2]|0)>>>0>1>>>0?y:q;ka=B;la=S;ma=R;na=o;oa=Q;break L26}}while(0);ha=c[f>>2]|0;ia=c[ha+12>>2]|0;ua=(ia|0)==(c[ha+16>>2]|0);if(((W?U>>>1:c[I>>2]|0)|0)==0){if(ua){qa=mc[c[(c[ha>>2]|0)+36>>2]&127](ha)|0;wa=qa;xa=a[E]|0}else{wa=c[ia>>2]|0;xa=ga}if((wa|0)!=(c[((xa&1)==0?G:c[H>>2]|0)>>2]|0)){ja=q;ka=B;la=S;ma=R;na=o;oa=Q;break L26}qa=c[f>>2]|0;pa=qa+12|0;ra=c[pa>>2]|0;if((ra|0)==(c[qa+16>>2]|0)){mc[c[(c[qa>>2]|0)+40>>2]&127](qa)|0}else{c[pa>>2]=ra+4}a[k]=1;ra=d[E]|0;ja=((ra&1|0)==0?ra>>>1:c[G>>2]|0)>>>0>1>>>0?y:q;ka=B;la=S;ma=R;na=o;oa=Q;break L26}if(ua){ua=mc[c[(c[ha>>2]|0)+36>>2]&127](ha)|0;ya=ua;za=a[D]|0}else{ya=c[ia>>2]|0;za=ea}if((ya|0)!=(c[((za&1)==0?I:c[J>>2]|0)>>2]|0)){a[k]=1;ja=q;ka=B;la=S;ma=R;na=o;oa=Q;break L26}ia=c[f>>2]|0;ua=ia+12|0;ha=c[ua>>2]|0;if((ha|0)==(c[ia+16>>2]|0)){mc[c[(c[ia>>2]|0)+40>>2]&127](ia)|0}else{c[ua>>2]=ha+4}ha=d[D]|0;ja=((ha&1|0)==0?ha>>>1:c[I>>2]|0)>>>0>1>>>0?x:q;ka=B;la=S;ma=R;na=o;oa=Q;break};case 2:{if(!((q|0)!=0|T>>>0<2>>>0)){if((T|0)==2){Aa=(a[O]|0)!=0}else{Aa=0}if(!(K|Aa)){ja=0;ka=B;la=S;ma=R;na=o;oa=Q;break L26}}ha=a[C]|0;ua=(ha&1)==0?h:c[L>>2]|0;L98:do{if((T|0)==0){Ba=ua;Ca=ha;Da=_}else{if((d[e+(T-1)|0]|0)>>>0<2>>>0){Ea=ua;Fa=ha}else{Ba=ua;Ca=ha;Da=_;break}while(1){ia=Fa&255;if((Ea|0)==(((Fa&1)==0?h:c[L>>2]|0)+(((ia&1|0)==0?ia>>>1:c[h>>2]|0)<<2)|0)){Ga=Fa;break}if(!(kc[c[(c[r>>2]|0)+12>>2]&63](l,8192,c[Ea>>2]|0)|0)){Y=116;break}Ea=Ea+4|0;Fa=a[C]|0}if((Y|0)==116){Y=0;Ga=a[C]|0}ia=(Ga&1)==0;ra=Ea-(ia?h:c[L>>2]|0)>>2;pa=a[F]|0;qa=pa&255;Ha=(qa&1|0)==0;L108:do{if(ra>>>0<=(Ha?qa>>>1:c[M>>2]|0)>>>0){Ia=(pa&1)==0;Ja=(Ia?M:c[N>>2]|0)+((Ha?qa>>>1:c[M>>2]|0)-ra<<2)|0;Ka=(Ia?M:c[N>>2]|0)+((Ha?qa>>>1:c[M>>2]|0)<<2)|0;if((Ja|0)==(Ka|0)){Ba=Ea;Ca=Ga;Da=_;break L98}else{La=Ja;Ma=ia?h:c[L>>2]|0}while(1){if((c[La>>2]|0)!=(c[Ma>>2]|0)){break L108}Ja=La+4|0;if((Ja|0)==(Ka|0)){Ba=Ea;Ca=Ga;Da=_;break L98}else{La=Ja;Ma=Ma+4|0}}}}while(0);Ba=ia?h:c[L>>2]|0;Ca=Ga;Da=_}}while(0);L114:while(1){ha=Ca&255;if((Ba|0)==(((Ca&1)==0?h:c[L>>2]|0)+(((ha&1|0)==0?ha>>>1:c[h>>2]|0)<<2)|0)){break}ha=c[f>>2]|0;do{if((ha|0)==0){Na=1}else{ua=c[ha+12>>2]|0;if((ua|0)==(c[ha+16>>2]|0)){Oa=mc[c[(c[ha>>2]|0)+36>>2]&127](ha)|0}else{Oa=c[ua>>2]|0}if((Oa|0)==-1){c[f>>2]=0;Na=1;break}else{Na=(c[f>>2]|0)==0;break}}}while(0);do{if((Da|0)==0){Y=137}else{ha=c[Da+12>>2]|0;if((ha|0)==(c[Da+16>>2]|0)){Pa=mc[c[(c[Da>>2]|0)+36>>2]&127](Da)|0}else{Pa=c[ha>>2]|0}if((Pa|0)==-1){c[b>>2]=0;Y=137;break}else{if(Na^(Da|0)==0){Qa=Da;break}else{break L114}}}}while(0);if((Y|0)==137){Y=0;if(Na){break}else{Qa=0}}ha=c[f>>2]|0;ia=c[ha+12>>2]|0;if((ia|0)==(c[ha+16>>2]|0)){Ra=mc[c[(c[ha>>2]|0)+36>>2]&127](ha)|0}else{Ra=c[ia>>2]|0}if((Ra|0)!=(c[Ba>>2]|0)){break}ia=c[f>>2]|0;ha=ia+12|0;ua=c[ha>>2]|0;if((ua|0)==(c[ia+16>>2]|0)){mc[c[(c[ia>>2]|0)+40>>2]&127](ia)|0}else{c[ha>>2]=ua+4}Ba=Ba+4|0;Ca=a[C]|0;Da=Qa}if(!K){ja=q;ka=B;la=S;ma=R;na=o;oa=Q;break L26}ua=a[C]|0;ha=ua&255;if((Ba|0)==(((ua&1)==0?h:c[L>>2]|0)+(((ha&1|0)==0?ha>>>1:c[h>>2]|0)<<2)|0)){ja=q;ka=B;la=S;ma=R;na=o;oa=Q}else{Y=149;break L2}break};case 4:{ha=0;ua=B;ia=S;ea=R;ga=o;U=Q;L150:while(1){W=c[f>>2]|0;do{if((W|0)==0){Sa=1}else{qa=c[W+12>>2]|0;if((qa|0)==(c[W+16>>2]|0)){Ta=mc[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{Ta=c[qa>>2]|0}if((Ta|0)==-1){c[f>>2]=0;Sa=1;break}else{Sa=(c[f>>2]|0)==0;break}}}while(0);W=c[b>>2]|0;do{if((W|0)==0){Y=163}else{qa=c[W+12>>2]|0;if((qa|0)==(c[W+16>>2]|0)){Ua=mc[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{Ua=c[qa>>2]|0}if((Ua|0)==-1){c[b>>2]=0;Y=163;break}else{if(Sa^(W|0)==0){break}else{break L150}}}}while(0);if((Y|0)==163){Y=0;if(Sa){break}}W=c[f>>2]|0;qa=c[W+12>>2]|0;if((qa|0)==(c[W+16>>2]|0)){Va=mc[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{Va=c[qa>>2]|0}if(kc[c[(c[r>>2]|0)+12>>2]&63](l,2048,Va)|0){qa=c[n>>2]|0;if((qa|0)==(U|0)){W=(c[P>>2]|0)!=170;Ha=c[g>>2]|0;ra=U-Ha|0;pa=ra>>>0<2147483647>>>0?ra<<1:-1;Ka=ra>>2;if(W){Wa=Ha}else{Wa=0}Ha=Im(Wa,pa)|0;ra=Ha;if((Ha|0)==0){Qm()}do{if(W){c[g>>2]=ra;Xa=ra}else{Ha=c[g>>2]|0;c[g>>2]=ra;if((Ha|0)==0){Xa=ra;break}ic[c[P>>2]&511](Ha);Xa=c[g>>2]|0}}while(0);c[P>>2]=86;ra=Xa+(Ka<<2)|0;c[n>>2]=ra;Ya=(c[g>>2]|0)+(pa>>>2<<2)|0;Za=ra}else{Ya=U;Za=qa}c[n>>2]=Za+4;c[Za>>2]=Va;_a=ha+1|0;$a=ua;ab=ia;bb=ea;cb=ga;db=Ya}else{ra=d[v]|0;if(!((((ra&1|0)==0?ra>>>1:c[m>>2]|0)|0)!=0&(ha|0)!=0&(Va|0)==(c[t>>2]|0))){break}if((ia|0)==(ua|0)){ra=(ga|0)!=170;W=ia-ea|0;Ha=W>>>0<2147483647>>>0?W<<1:-1;if(ra){eb=ea}else{eb=0}ra=Im(eb,Ha)|0;Ja=ra;if((ra|0)==0){Qm()}fb=Ja+(Ha>>>2<<2)|0;gb=Ja+(W>>2<<2)|0;hb=Ja;ib=86}else{fb=ua;gb=ia;hb=ea;ib=ga}c[gb>>2]=ha;_a=0;$a=fb;ab=gb+4|0;bb=hb;cb=ib;db=U}Ja=c[f>>2]|0;W=Ja+12|0;Ha=c[W>>2]|0;if((Ha|0)==(c[Ja+16>>2]|0)){mc[c[(c[Ja>>2]|0)+40>>2]&127](Ja)|0;ha=_a;ua=$a;ia=ab;ea=bb;ga=cb;U=db;continue}else{c[W>>2]=Ha+4;ha=_a;ua=$a;ia=ab;ea=bb;ga=cb;U=db;continue}}if((ea|0)!=(ia|0)&(ha|0)!=0){if((ia|0)==(ua|0)){Ha=(ga|0)!=170;W=ia-ea|0;Ja=W>>>0<2147483647>>>0?W<<1:-1;if(Ha){jb=ea}else{jb=0}Ha=Im(jb,Ja)|0;ra=Ha;if((Ha|0)==0){Qm()}kb=ra+(Ja>>>2<<2)|0;lb=ra+(W>>2<<2)|0;mb=ra;nb=86}else{kb=ua;lb=ia;mb=ea;nb=ga}c[lb>>2]=ha;ob=kb;pb=lb+4|0;qb=mb;rb=nb}else{ob=ua;pb=ia;qb=ea;rb=ga}if((c[A>>2]|0)>0){ra=c[f>>2]|0;do{if((ra|0)==0){sb=1}else{W=c[ra+12>>2]|0;if((W|0)==(c[ra+16>>2]|0)){tb=mc[c[(c[ra>>2]|0)+36>>2]&127](ra)|0}else{tb=c[W>>2]|0}if((tb|0)==-1){c[f>>2]=0;sb=1;break}else{sb=(c[f>>2]|0)==0;break}}}while(0);ra=c[b>>2]|0;do{if((ra|0)==0){Y=220}else{ga=c[ra+12>>2]|0;if((ga|0)==(c[ra+16>>2]|0)){ub=mc[c[(c[ra>>2]|0)+36>>2]&127](ra)|0}else{ub=c[ga>>2]|0}if((ub|0)==-1){c[b>>2]=0;Y=220;break}else{if(sb^(ra|0)==0){vb=ra;break}else{Y=226;break L2}}}}while(0);if((Y|0)==220){Y=0;if(sb){Y=226;break L2}else{vb=0}}ra=c[f>>2]|0;ga=c[ra+12>>2]|0;if((ga|0)==(c[ra+16>>2]|0)){wb=mc[c[(c[ra>>2]|0)+36>>2]&127](ra)|0}else{wb=c[ga>>2]|0}if((wb|0)!=(c[s>>2]|0)){Y=226;break L2}ga=c[f>>2]|0;ra=ga+12|0;ea=c[ra>>2]|0;if((ea|0)==(c[ga+16>>2]|0)){mc[c[(c[ga>>2]|0)+40>>2]&127](ga)|0;xb=U;yb=vb}else{c[ra>>2]=ea+4;xb=U;yb=vb}while(1){ea=c[f>>2]|0;do{if((ea|0)==0){zb=1}else{ra=c[ea+12>>2]|0;if((ra|0)==(c[ea+16>>2]|0)){Ab=mc[c[(c[ea>>2]|0)+36>>2]&127](ea)|0}else{Ab=c[ra>>2]|0}if((Ab|0)==-1){c[f>>2]=0;zb=1;break}else{zb=(c[f>>2]|0)==0;break}}}while(0);do{if((yb|0)==0){Y=243}else{ea=c[yb+12>>2]|0;if((ea|0)==(c[yb+16>>2]|0)){Bb=mc[c[(c[yb>>2]|0)+36>>2]&127](yb)|0}else{Bb=c[ea>>2]|0}if((Bb|0)==-1){c[b>>2]=0;Y=243;break}else{if(zb^(yb|0)==0){Cb=yb;break}else{Y=250;break L2}}}}while(0);if((Y|0)==243){Y=0;if(zb){Y=250;break L2}else{Cb=0}}ea=c[f>>2]|0;qa=c[ea+12>>2]|0;if((qa|0)==(c[ea+16>>2]|0)){Db=mc[c[(c[ea>>2]|0)+36>>2]&127](ea)|0}else{Db=c[qa>>2]|0}if(!(kc[c[(c[r>>2]|0)+12>>2]&63](l,2048,Db)|0)){Y=250;break L2}qa=c[n>>2]|0;if((qa|0)==(xb|0)){ea=(c[P>>2]|0)!=170;pa=c[g>>2]|0;Ka=xb-pa|0;ra=Ka>>>0<2147483647>>>0?Ka<<1:-1;ga=Ka>>2;if(ea){Eb=pa}else{Eb=0}pa=Im(Eb,ra)|0;Ka=pa;if((pa|0)==0){Qm()}do{if(ea){c[g>>2]=Ka;Fb=Ka}else{pa=c[g>>2]|0;c[g>>2]=Ka;if((pa|0)==0){Fb=Ka;break}ic[c[P>>2]&511](pa);Fb=c[g>>2]|0}}while(0);c[P>>2]=86;Ka=Fb+(ga<<2)|0;c[n>>2]=Ka;Gb=(c[g>>2]|0)+(ra>>>2<<2)|0;Hb=Ka}else{Gb=xb;Hb=qa}Ka=c[f>>2]|0;ea=c[Ka+12>>2]|0;if((ea|0)==(c[Ka+16>>2]|0)){pa=mc[c[(c[Ka>>2]|0)+36>>2]&127](Ka)|0;Ib=pa;Jb=c[n>>2]|0}else{Ib=c[ea>>2]|0;Jb=Hb}c[n>>2]=Jb+4;c[Jb>>2]=Ib;ea=(c[A>>2]|0)-1|0;c[A>>2]=ea;pa=c[f>>2]|0;Ka=pa+12|0;ia=c[Ka>>2]|0;if((ia|0)==(c[pa+16>>2]|0)){mc[c[(c[pa>>2]|0)+40>>2]&127](pa)|0}else{c[Ka>>2]=ia+4}if((ea|0)>0){xb=Gb;yb=Cb}else{Kb=Gb;break}}}else{Kb=U}if((c[n>>2]|0)==(c[g>>2]|0)){Y=272;break L2}else{ja=q;ka=ob;la=pb;ma=qb;na=rb;oa=Kb}break};default:{ja=q;ka=B;la=S;ma=R;na=o;oa=Q}}}while(0);L317:do{if((Y|0)==41){Y=0;if((T|0)==3){$=o;aa=R;ba=S;ca=q;Y=274;break L2}else{Lb=_}while(1){ea=c[f>>2]|0;do{if((ea|0)==0){Mb=1}else{ia=c[ea+12>>2]|0;if((ia|0)==(c[ea+16>>2]|0)){Nb=mc[c[(c[ea>>2]|0)+36>>2]&127](ea)|0}else{Nb=c[ia>>2]|0}if((Nb|0)==-1){c[f>>2]=0;Mb=1;break}else{Mb=(c[f>>2]|0)==0;break}}}while(0);do{if((Lb|0)==0){Y=55}else{ea=c[Lb+12>>2]|0;if((ea|0)==(c[Lb+16>>2]|0)){Ob=mc[c[(c[Lb>>2]|0)+36>>2]&127](Lb)|0}else{Ob=c[ea>>2]|0}if((Ob|0)==-1){c[b>>2]=0;Y=55;break}else{if(Mb^(Lb|0)==0){Pb=Lb;break}else{ja=q;ka=B;la=S;ma=R;na=o;oa=Q;break L317}}}}while(0);if((Y|0)==55){Y=0;if(Mb){ja=q;ka=B;la=S;ma=R;na=o;oa=Q;break L317}else{Pb=0}}ea=c[f>>2]|0;qa=c[ea+12>>2]|0;if((qa|0)==(c[ea+16>>2]|0)){Qb=mc[c[(c[ea>>2]|0)+36>>2]&127](ea)|0}else{Qb=c[qa>>2]|0}if(!(kc[c[(c[r>>2]|0)+12>>2]&63](l,8192,Qb)|0)){ja=q;ka=B;la=S;ma=R;na=o;oa=Q;break L317}qa=c[f>>2]|0;ea=qa+12|0;ra=c[ea>>2]|0;if((ra|0)==(c[qa+16>>2]|0)){Rb=mc[c[(c[qa>>2]|0)+40>>2]&127](qa)|0}else{c[ea>>2]=ra+4;Rb=c[ra>>2]|0}Wd(z,Rb);Lb=Pb}}}while(0);U=T+1|0;if(U>>>0<4>>>0){Q=oa;o=na;R=ma;S=la;B=ka;q=ja;T=U}else{$=na;aa=ma;ba=la;ca=ja;Y=274;break}}L354:do{if((Y|0)==40){c[j>>2]=c[j>>2]|4;Sb=0;Tb=R;Ub=o}else if((Y|0)==106){c[j>>2]=c[j>>2]|4;Sb=0;Tb=R;Ub=o}else if((Y|0)==149){c[j>>2]=c[j>>2]|4;Sb=0;Tb=R;Ub=o}else if((Y|0)==226){c[j>>2]=c[j>>2]|4;Sb=0;Tb=qb;Ub=rb}else if((Y|0)==250){c[j>>2]=c[j>>2]|4;Sb=0;Tb=qb;Ub=rb}else if((Y|0)==272){c[j>>2]=c[j>>2]|4;Sb=0;Tb=qb;Ub=rb}else if((Y|0)==274){L362:do{if((ca|0)!=0){ja=ca;la=ca+4|0;ma=ca+8|0;na=1;L364:while(1){T=d[ja]|0;if((T&1|0)==0){Vb=T>>>1}else{Vb=c[la>>2]|0}if(na>>>0>=Vb>>>0){break L362}T=c[f>>2]|0;do{if((T|0)==0){Wb=1}else{q=c[T+12>>2]|0;if((q|0)==(c[T+16>>2]|0)){Xb=mc[c[(c[T>>2]|0)+36>>2]&127](T)|0}else{Xb=c[q>>2]|0}if((Xb|0)==-1){c[f>>2]=0;Wb=1;break}else{Wb=(c[f>>2]|0)==0;break}}}while(0);T=c[b>>2]|0;do{if((T|0)==0){Y=293}else{q=c[T+12>>2]|0;if((q|0)==(c[T+16>>2]|0)){Yb=mc[c[(c[T>>2]|0)+36>>2]&127](T)|0}else{Yb=c[q>>2]|0}if((Yb|0)==-1){c[b>>2]=0;Y=293;break}else{if(Wb^(T|0)==0){break}else{break L364}}}}while(0);if((Y|0)==293){Y=0;if(Wb){break}}T=c[f>>2]|0;q=c[T+12>>2]|0;if((q|0)==(c[T+16>>2]|0)){Zb=mc[c[(c[T>>2]|0)+36>>2]&127](T)|0}else{Zb=c[q>>2]|0}if((a[ja]&1)==0){_b=la}else{_b=c[ma>>2]|0}if((Zb|0)!=(c[_b+(na<<2)>>2]|0)){break}q=na+1|0;T=c[f>>2]|0;ka=T+12|0;B=c[ka>>2]|0;if((B|0)==(c[T+16>>2]|0)){mc[c[(c[T>>2]|0)+40>>2]&127](T)|0;na=q;continue}else{c[ka>>2]=B+4;na=q;continue}}c[j>>2]=c[j>>2]|4;Sb=0;Tb=aa;Ub=$;break L354}}while(0);if((aa|0)==(ba|0)){Sb=1;Tb=ba;Ub=$;break}na=u;ma=a[v]|0;la=ma&255;if((((la&1|0)==0?la>>>1:c[m>>2]|0)|0)==0){Sb=1;Tb=aa;Ub=$;break}la=ba-4|0;if(la>>>0>aa>>>0){ja=aa;q=la;do{la=c[ja>>2]|0;c[ja>>2]=c[q>>2];c[q>>2]=la;ja=ja+4|0;q=q-4|0;}while(ja>>>0<q>>>0);$b=a[v]|0}else{$b=ma}if(($b&1)==0){ac=na+1|0}else{ac=c[u+8>>2]|0}q=$b&255;ja=ba-4|0;la=a[ac]|0;B=la<<24>>24;ka=la<<24>>24<1|la<<24>>24==127;L417:do{if(ja>>>0>aa>>>0){la=ac+((q&1|0)==0?q>>>1:c[m>>2]|0)|0;T=ac;S=aa;oa=B;Q=ka;while(1){if(!Q){if((oa|0)!=(c[S>>2]|0)){break L417}}Pb=(la-T|0)>1?T+1|0:T;Lb=S+4|0;Rb=a[Pb]|0;Qb=Rb<<24>>24;l=Rb<<24>>24<1|Rb<<24>>24==127;if(Lb>>>0<ja>>>0){T=Pb;S=Lb;oa=Qb;Q=l}else{bc=Qb;cc=l;Y=318;break}}}else{bc=B;cc=ka;Y=318}}while(0);if((Y|0)==318){if(cc){Sb=1;Tb=aa;Ub=$;break}if(((c[ja>>2]|0)-1|0)>>>0<bc>>>0){Sb=1;Tb=aa;Ub=$;break}}c[j>>2]=c[j>>2]|4;Sb=0;Tb=aa;Ub=$}}while(0);Td(z);Td(y);Td(x);Td(w);Hd(u);if((Tb|0)==0){i=p;return Sb|0}ic[Ub&511](Tb);i=p;return Sb|0}function $h(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+456|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=170;u=m+400|0;$d(p,h);m=p|0;v=c[m>>2]|0;if((c[13100]|0)!=-1){c[l>>2]=52400;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52400,l,104)}l=(c[13101]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(_h(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){c[k+4>>2]=0;a[B]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){Wd(k,uc[c[(c[B>>2]|0)+44>>2]&31](y,45)|0)}x=uc[c[(c[B>>2]|0)+44>>2]&31](y,48)|0;y=c[s>>2]|0;B=c[o>>2]|0;C=B-4|0;L20:do{if(y>>>0<C>>>0){D=y;while(1){E=D+4|0;if((c[D>>2]|0)!=(x|0)){F=D;break L20}if(E>>>0<C>>>0){D=E}else{F=E;break}}}else{F=y}}while(0);zl(k,F,B)|0}y=e|0;C=c[y>>2]|0;do{if((C|0)==0){G=1}else{x=c[C+12>>2]|0;if((x|0)==(c[C+16>>2]|0)){H=mc[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[x>>2]|0}if((H|0)==-1){c[y>>2]=0;G=1;break}else{G=(c[y>>2]|0)==0;break}}}while(0);do{if((A|0)==0){I=35}else{C=c[A+12>>2]|0;if((C|0)==(c[A+16>>2]|0)){J=mc[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{J=c[C>>2]|0}if((J|0)==-1){c[z>>2]=0;I=35;break}else{if(G^(A|0)==0){break}else{I=37;break}}}}while(0);if((I|0)==35){if(G){I=37}}if((I|0)==37){c[j>>2]=c[j>>2]|2}c[b>>2]=c[y>>2];hd(c[m>>2]|0)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}ic[c[t>>2]&511](A);i=d;return}}while(0);d=Yb(4)|0;jm(d);vb(d|0,8088,140)}function ai(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[13216]|0)!=-1){c[p>>2]=52864;c[p+4>>2]=14;c[p+8>>2]=0;Cd(52864,p,104)}p=(c[13217]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=Yb(4)|0;L=K;jm(L);vb(K|0,8088,140)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=Yb(4)|0;L=K;jm(L);vb(K|0,8088,140)}K=b;jc[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C;C=C>>8;a[L+1|0]=C;C=C>>8;a[L+2|0]=C;C=C>>8;a[L+3|0]=C;L=b;jc[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){c[l+4>>2]=0;a[q]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Vd(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];bn(s|0,0,12)|0;Td(r);jc[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){c[k+4>>2]=0;a[r]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Vd(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];bn(u|0,0,12)|0;Td(t);t=b;c[f>>2]=mc[c[(c[t>>2]|0)+12>>2]&127](K)|0;c[g>>2]=mc[c[(c[t>>2]|0)+16>>2]&127](K)|0;jc[c[(c[b>>2]|0)+20>>2]&127](v,K);b=h;if((a[b]&1)==0){a[h+1|0]=0;a[b]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}Md(h,0);c[b>>2]=c[w>>2];c[b+4>>2]=c[w+4>>2];c[b+8>>2]=c[w+8>>2];bn(w|0,0,12)|0;Hd(v);jc[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){c[j+4>>2]=0;a[L]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}Vd(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];bn(y|0,0,12)|0;Td(x);M=mc[c[(c[t>>2]|0)+36>>2]&127](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[13218]|0)!=-1){c[o>>2]=52872;c[o+4>>2]=14;c[o+8>>2]=0;Cd(52872,o,104)}o=(c[13219]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=Yb(4)|0;O=N;jm(O);vb(N|0,8088,140)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=Yb(4)|0;O=N;jm(O);vb(N|0,8088,140)}N=K;jc[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C;C=C>>8;a[O+1|0]=C;C=C>>8;a[O+2|0]=C;C=C>>8;a[O+3|0]=C;O=K;jc[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){c[l+4>>2]=0;a[z]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Vd(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];bn(B|0,0,12)|0;Td(A);jc[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){c[k+4>>2]=0;a[A]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Vd(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];bn(E|0,0,12)|0;Td(D);D=K;c[f>>2]=mc[c[(c[D>>2]|0)+12>>2]&127](N)|0;c[g>>2]=mc[c[(c[D>>2]|0)+16>>2]&127](N)|0;jc[c[(c[K>>2]|0)+20>>2]&127](F,N);K=h;if((a[K]&1)==0){a[h+1|0]=0;a[K]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}Md(h,0);c[K>>2]=c[G>>2];c[K+4>>2]=c[G+4>>2];c[K+8>>2]=c[G+8>>2];bn(G|0,0,12)|0;Hd(F);jc[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){c[j+4>>2]=0;a[O]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}Vd(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];bn(I|0,0,12)|0;Td(H);M=mc[c[(c[D>>2]|0)+36>>2]&127](N)|0;c[m>>2]=M;i=n;return}}function bi(a){a=a|0;fd(a|0);Lm(a);return}function ci(a){a=a|0;fd(a|0);return}function di(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+248|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+232|0;p=e+240|0;q=p;r=i;i=i+1|0;i=i+7&-8;s=i;i=i+1|0;i=i+7&-8;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+100|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=i;i=i+4|0;i=i+7&-8;E=e+16|0;c[n>>2]=E;F=e+128|0;G=Ya(E|0,100,400,(E=i,i=i+8|0,h[E>>3]=l,E)|0)|0;i=E;do{if(G>>>0>99>>>0){do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);H=ul(n,c[12708]|0,400,(E=i,i=i+8|0,h[E>>3]=l,E)|0)|0;i=E;I=c[n>>2]|0;if((I|0)==0){Qm();J=c[n>>2]|0}else{J=I}I=Gm(H)|0;if((I|0)!=0){K=I;L=H;M=J;N=I;break}Qm();K=0;L=H;M=J;N=0}else{K=F;L=G;M=0;N=0}}while(0);$d(o,j);G=o|0;F=c[G>>2]|0;if((c[13102]|0)!=-1){c[m>>2]=52408;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52408,m,104)}m=(c[13103]|0)-1|0;J=c[F+8>>2]|0;do{if((c[F+12>>2]|0)-J>>2>>>0>m>>>0){E=c[J+(m<<2)>>2]|0;if((E|0)==0){break}H=E;I=c[n>>2]|0;fc[c[(c[E>>2]|0)+32>>2]&15](H,I,I+L|0,K)|0;if((L|0)==0){O=0}else{O=(a[c[n>>2]|0]|0)==45}c[p>>2]=0;bn(u|0,0,12)|0;bn(w|0,0,12)|0;bn(y|0,0,12)|0;ei(g,O,o,q,r,s,t,v,x,z);I=A|0;E=c[z>>2]|0;if((L|0)>(E|0)){P=d[y]|0;if((P&1|0)==0){Q=P>>>1}else{Q=c[x+4>>2]|0}P=d[w]|0;if((P&1|0)==0){R=P>>>1}else{R=c[v+4>>2]|0}S=(L-E<<1|1)+Q+R|0}else{P=d[y]|0;if((P&1|0)==0){T=P>>>1}else{T=c[x+4>>2]|0}P=d[w]|0;if((P&1|0)==0){U=P>>>1}else{U=c[v+4>>2]|0}S=T+2+U|0}P=S+E|0;do{if(P>>>0>100>>>0){V=Gm(P)|0;if((V|0)!=0){W=V;X=V;break}Qm();W=0;X=0}else{W=I;X=0}}while(0);fi(W,B,C,c[j+4>>2]|0,K,K+L|0,H,O,q,a[r]|0,a[s]|0,t,v,x,E);c[D>>2]=c[f>>2];Tc(b,D,W,c[B>>2]|0,c[C>>2]|0,j,k);if((X|0)!=0){Hm(X)}Hd(x);Hd(v);Hd(t);hd(c[G>>2]|0)|0;if((N|0)!=0){Hm(N)}if((M|0)==0){i=e;return}Hm(M);i=e;return}}while(0);e=Yb(4)|0;jm(e);vb(e|0,8088,140)}function ei(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[13220]|0)!=-1){c[p>>2]=52880;c[p+4>>2]=14;c[p+8>>2]=0;Cd(52880,p,104)}p=(c[13221]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=Yb(4)|0;R=Q;jm(R);vb(Q|0,8088,140)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=Yb(4)|0;R=Q;jm(R);vb(Q|0,8088,140)}Q=e;R=c[e>>2]|0;if(d){jc[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C;C=C>>8;a[r+1|0]=C;C=C>>8;a[r+2|0]=C;C=C>>8;a[r+3|0]=C;jc[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){a[l+1|0]=0;a[r]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}Md(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];bn(t|0,0,12)|0;Hd(s)}else{jc[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C;C=C>>8;a[v+1|0]=C;C=C>>8;a[v+2|0]=C;C=C>>8;a[v+3|0]=C;jc[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){a[l+1|0]=0;a[v]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}Md(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];bn(x|0,0,12)|0;Hd(w)}w=e;a[g]=mc[c[(c[w>>2]|0)+12>>2]&127](Q)|0;a[h]=mc[c[(c[w>>2]|0)+16>>2]&127](Q)|0;w=e;jc[c[(c[w>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}Md(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];bn(z|0,0,12)|0;Hd(y);jc[c[(c[w>>2]|0)+24>>2]&127](A,Q);w=k;if((a[w]&1)==0){a[k+1|0]=0;a[w]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}Md(k,0);c[w>>2]=c[B>>2];c[w+4>>2]=c[B+4>>2];c[w+8>>2]=c[B+8>>2];bn(B|0,0,12)|0;Hd(A);S=mc[c[(c[e>>2]|0)+36>>2]&127](Q)|0;c[m>>2]=S;i=n;return}else{if((c[13222]|0)!=-1){c[o>>2]=52888;c[o+4>>2]=14;c[o+8>>2]=0;Cd(52888,o,104)}o=(c[13223]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=Yb(4)|0;U=T;jm(U);vb(T|0,8088,140)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=Yb(4)|0;U=T;jm(U);vb(T|0,8088,140)}T=P;U=c[P>>2]|0;if(d){jc[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C;C=C>>8;a[E+1|0]=C;C=C>>8;a[E+2|0]=C;C=C>>8;a[E+3|0]=C;jc[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){a[l+1|0]=0;a[E]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}Md(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];bn(G|0,0,12)|0;Hd(F)}else{jc[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C;C=C>>8;a[I+1|0]=C;C=C>>8;a[I+2|0]=C;C=C>>8;a[I+3|0]=C;jc[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){a[l+1|0]=0;a[I]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}Md(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];bn(K|0,0,12)|0;Hd(J)}J=P;a[g]=mc[c[(c[J>>2]|0)+12>>2]&127](T)|0;a[h]=mc[c[(c[J>>2]|0)+16>>2]&127](T)|0;J=P;jc[c[(c[J>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}Md(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];bn(M|0,0,12)|0;Hd(L);jc[c[(c[J>>2]|0)+24>>2]&127](N,T);J=k;if((a[J]&1)==0){a[k+1|0]=0;a[J]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}Md(k,0);c[J>>2]=c[O>>2];c[J+4>>2]=c[O+4>>2];c[J+8>>2]=c[O+8>>2];bn(O|0,0,12)|0;Hd(N);S=mc[c[(c[P>>2]|0)+36>>2]&127](T)|0;c[m>>2]=S;i=n;return}}function fi(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0;c[f>>2]=d;s=j;t=q;u=q+1|0;v=q+8|0;w=q+4|0;q=p;x=(g&512|0)==0;y=p+1|0;z=p+4|0;A=p+8|0;p=(r|0)>0;B=o;C=o+1|0;D=o+8|0;E=o+4|0;o=j+8|0;F=-r|0;G=h;h=0;while(1){L3:do{switch(a[l+h|0]|0){case 1:{c[e>>2]=c[f>>2];H=uc[c[(c[s>>2]|0)+28>>2]&31](j,32)|0;I=c[f>>2]|0;c[f>>2]=I+1;a[I]=H;J=G;break};case 3:{H=a[t]|0;I=H&255;if((I&1|0)==0){K=I>>>1}else{K=c[w>>2]|0}if((K|0)==0){J=G;break L3}if((H&1)==0){L=u}else{L=c[v>>2]|0}H=a[L]|0;I=c[f>>2]|0;c[f>>2]=I+1;a[I]=H;J=G;break};case 4:{H=c[f>>2]|0;I=k?G+1|0:G;L15:do{if(I>>>0<i>>>0){M=I;while(1){N=a[M]|0;if(N<<24>>24<=-1){O=M;break L15}P=M+1|0;if((b[(c[o>>2]|0)+(N<<24>>24<<1)>>1]&2048)==0){O=M;break L15}if(P>>>0<i>>>0){M=P}else{O=P;break}}}else{O=I}}while(0);M=O;if(p){if(O>>>0>I>>>0){P=I-M|0;M=P>>>0<F>>>0?F:P;P=M+r|0;N=O;Q=r;R=H;while(1){S=N-1|0;T=a[S]|0;c[f>>2]=R+1;a[R]=T;T=Q-1|0;U=(T|0)>0;if(!(S>>>0>I>>>0&U)){break}N=S;Q=T;R=c[f>>2]|0}R=O+M|0;if(U){V=P;W=R;X=34}else{Y=0;Z=P;_=R}}else{V=r;W=O;X=34}if((X|0)==34){X=0;Y=uc[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;Z=V;_=W}R=c[f>>2]|0;c[f>>2]=R+1;if((Z|0)>0){Q=Z;N=R;while(1){a[N]=Y;T=Q-1|0;S=c[f>>2]|0;c[f>>2]=S+1;if((T|0)>0){Q=T;N=S}else{$=S;break}}}else{$=R}a[$]=m;aa=_}else{aa=O}if((aa|0)==(I|0)){N=uc[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;Q=c[f>>2]|0;c[f>>2]=Q+1;a[Q]=N}else{N=a[B]|0;Q=N&255;if((Q&1|0)==0){ba=Q>>>1}else{ba=c[E>>2]|0}if((ba|0)==0){ca=aa;da=0;ea=0;fa=-1}else{if((N&1)==0){ga=C}else{ga=c[D>>2]|0}ca=aa;da=0;ea=0;fa=a[ga]|0}while(1){do{if((da|0)==(fa|0)){N=c[f>>2]|0;c[f>>2]=N+1;a[N]=n;N=ea+1|0;Q=a[B]|0;P=Q&255;if((P&1|0)==0){ha=P>>>1}else{ha=c[E>>2]|0}if(N>>>0>=ha>>>0){ia=fa;ja=N;ka=0;break}P=(Q&1)==0;if(P){la=C}else{la=c[D>>2]|0}if((a[la+N|0]|0)==127){ia=-1;ja=N;ka=0;break}if(P){ma=C}else{ma=c[D>>2]|0}ia=a[ma+N|0]|0;ja=N;ka=0}else{ia=fa;ja=ea;ka=da}}while(0);N=ca-1|0;P=a[N]|0;Q=c[f>>2]|0;c[f>>2]=Q+1;a[Q]=P;if((N|0)==(I|0)){break}else{ca=N;da=ka+1|0;ea=ja;fa=ia}}}R=c[f>>2]|0;if((H|0)==(R|0)){J=I;break L3}N=R-1|0;if(H>>>0<N>>>0){na=H;oa=N}else{J=I;break L3}while(1){N=a[na]|0;a[na]=a[oa]|0;a[oa]=N;N=na+1|0;R=oa-1|0;if(N>>>0<R>>>0){na=N;oa=R}else{J=I;break}}break};case 0:{c[e>>2]=c[f>>2];J=G;break};case 2:{I=a[q]|0;H=I&255;R=(H&1|0)==0;if(R){pa=H>>>1}else{pa=c[z>>2]|0}if((pa|0)==0|x){J=G;break L3}if((I&1)==0){qa=y;ra=y}else{I=c[A>>2]|0;qa=I;ra=I}if(R){sa=H>>>1}else{sa=c[z>>2]|0}H=qa+sa|0;R=c[f>>2]|0;if((ra|0)==(H|0)){ta=R}else{I=ra;N=R;while(1){a[N]=a[I]|0;R=I+1|0;P=N+1|0;if((R|0)==(H|0)){ta=P;break}else{I=R;N=P}}}c[f>>2]=ta;J=G;break};default:{J=G}}}while(0);N=h+1|0;if(N>>>0<4>>>0){G=J;h=N}else{break}}h=a[t]|0;t=h&255;J=(t&1|0)==0;if(J){ua=t>>>1}else{ua=c[w>>2]|0}if(ua>>>0>1>>>0){if((h&1)==0){va=u;wa=u}else{u=c[v>>2]|0;va=u;wa=u}if(J){xa=t>>>1}else{xa=c[w>>2]|0}w=va+xa|0;xa=c[f>>2]|0;va=wa+1|0;if((va|0)==(w|0)){ya=xa}else{wa=xa;xa=va;while(1){a[wa]=a[xa]|0;va=wa+1|0;t=xa+1|0;if((t|0)==(w|0)){ya=va;break}else{wa=va;xa=t}}}c[f>>2]=ya}ya=g&176;if((ya|0)==32){c[e>>2]=c[f>>2];return}else if((ya|0)==16){return}else{c[e>>2]=d;return}}function gi(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0;e=i;i=i+32|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=n;p=i;i=i+1|0;i=i+7&-8;q=i;i=i+1|0;i=i+7&-8;r=i;i=i+12|0;i=i+7&-8;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+4|0;i=i+7&-8;y=i;i=i+100|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;$d(m,h);C=m|0;D=c[C>>2]|0;if((c[13102]|0)!=-1){c[l>>2]=52408;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52408,l,104)}l=(c[13103]|0)-1|0;E=c[D+8>>2]|0;do{if((c[D+12>>2]|0)-E>>2>>>0>l>>>0){F=c[E+(l<<2)>>2]|0;if((F|0)==0){break}G=F;H=k;I=k;J=a[I]|0;K=J&255;if((K&1|0)==0){L=K>>>1}else{L=c[k+4>>2]|0}if((L|0)==0){M=0}else{if((J&1)==0){N=H+1|0}else{N=c[k+8>>2]|0}J=a[N]|0;M=J<<24>>24==(uc[c[(c[F>>2]|0)+28>>2]&31](G,45)|0)<<24>>24}c[n>>2]=0;bn(s|0,0,12)|0;bn(u|0,0,12)|0;bn(w|0,0,12)|0;ei(g,M,m,o,p,q,r,t,v,x);F=y|0;J=a[I]|0;K=J&255;O=(K&1|0)==0;if(O){P=K>>>1}else{P=c[k+4>>2]|0}Q=c[x>>2]|0;if((P|0)>(Q|0)){if(O){R=K>>>1}else{R=c[k+4>>2]|0}K=d[w]|0;if((K&1|0)==0){S=K>>>1}else{S=c[v+4>>2]|0}K=d[u]|0;if((K&1|0)==0){T=K>>>1}else{T=c[t+4>>2]|0}U=(R-Q<<1|1)+S+T|0}else{K=d[w]|0;if((K&1|0)==0){V=K>>>1}else{V=c[v+4>>2]|0}K=d[u]|0;if((K&1|0)==0){W=K>>>1}else{W=c[t+4>>2]|0}U=V+2+W|0}K=U+Q|0;do{if(K>>>0>100>>>0){O=Gm(K)|0;if((O|0)!=0){X=O;Y=O;Z=J;break}Qm();X=0;Y=0;Z=a[I]|0}else{X=F;Y=0;Z=J}}while(0);if((Z&1)==0){_=H+1|0;$=H+1|0}else{J=c[k+8>>2]|0;_=J;$=J}J=Z&255;if((J&1|0)==0){aa=J>>>1}else{aa=c[k+4>>2]|0}fi(X,z,A,c[h+4>>2]|0,$,_+aa|0,G,M,o,a[p]|0,a[q]|0,r,t,v,Q);c[B>>2]=c[f>>2];Tc(b,B,X,c[z>>2]|0,c[A>>2]|0,h,j);if((Y|0)==0){Hd(v);Hd(t);Hd(r);ba=c[C>>2]|0;ca=ba|0;da=hd(ca)|0;i=e;return}Hm(Y);Hd(v);Hd(t);Hd(r);ba=c[C>>2]|0;ca=ba|0;da=hd(ca)|0;i=e;return}}while(0);e=Yb(4)|0;jm(e);vb(e|0,8088,140)}function hi(a){a=a|0;fd(a|0);Lm(a);return}function ii(a){a=a|0;fd(a|0);return}function ji(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+544|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+528|0;p=e+536|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+400|0;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=i;i=i+4|0;i=i+7&-8;E=e+16|0;c[n>>2]=E;F=e+128|0;G=Ya(E|0,100,400,(E=i,i=i+8|0,h[E>>3]=l,E)|0)|0;i=E;do{if(G>>>0>99>>>0){do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);H=ul(n,c[12708]|0,400,(E=i,i=i+8|0,h[E>>3]=l,E)|0)|0;i=E;I=c[n>>2]|0;if((I|0)==0){Qm();J=c[n>>2]|0}else{J=I}I=Gm(H<<2)|0;K=I;if((I|0)!=0){L=K;M=H;N=J;O=K;break}Qm();L=K;M=H;N=J;O=K}else{L=F;M=G;N=0;O=0}}while(0);$d(o,j);G=o|0;F=c[G>>2]|0;if((c[13100]|0)!=-1){c[m>>2]=52400;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52400,m,104)}m=(c[13101]|0)-1|0;J=c[F+8>>2]|0;do{if((c[F+12>>2]|0)-J>>2>>>0>m>>>0){E=c[J+(m<<2)>>2]|0;if((E|0)==0){break}K=E;H=c[n>>2]|0;fc[c[(c[E>>2]|0)+48>>2]&15](K,H,H+M|0,L)|0;if((M|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}c[p>>2]=0;bn(u|0,0,12)|0;bn(w|0,0,12)|0;bn(y|0,0,12)|0;ki(g,P,o,q,r,s,t,v,x,z);H=A|0;E=c[z>>2]|0;if((M|0)>(E|0)){I=d[y]|0;if((I&1|0)==0){Q=I>>>1}else{Q=c[x+4>>2]|0}I=d[w]|0;if((I&1|0)==0){R=I>>>1}else{R=c[v+4>>2]|0}S=(M-E<<1|1)+Q+R|0}else{I=d[y]|0;if((I&1|0)==0){T=I>>>1}else{T=c[x+4>>2]|0}I=d[w]|0;if((I&1|0)==0){U=I>>>1}else{U=c[v+4>>2]|0}S=T+2+U|0}I=S+E|0;do{if(I>>>0>100>>>0){V=Gm(I<<2)|0;W=V;if((V|0)!=0){X=W;Y=W;break}Qm();X=W;Y=W}else{X=H;Y=0}}while(0);li(X,B,C,c[j+4>>2]|0,L,L+(M<<2)|0,K,P,q,c[r>>2]|0,c[s>>2]|0,t,v,x,E);c[D>>2]=c[f>>2];vl(b,D,X,c[B>>2]|0,c[C>>2]|0,j,k);if((Y|0)!=0){Hm(Y)}Td(x);Td(v);Hd(t);hd(c[G>>2]|0)|0;if((O|0)!=0){Hm(O)}if((N|0)==0){i=e;return}Hm(N);i=e;return}}while(0);e=Yb(4)|0;jm(e);vb(e|0,8088,140)}function ki(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[13216]|0)!=-1){c[p>>2]=52864;c[p+4>>2]=14;c[p+8>>2]=0;Cd(52864,p,104)}p=(c[13217]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=Yb(4)|0;R=Q;jm(R);vb(Q|0,8088,140)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=Yb(4)|0;R=Q;jm(R);vb(Q|0,8088,140)}Q=e;R=c[e>>2]|0;if(d){jc[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C;C=C>>8;a[r+1|0]=C;C=C>>8;a[r+2|0]=C;C=C>>8;a[r+3|0]=C;jc[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){c[l+4>>2]=0;a[r]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Vd(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];bn(t|0,0,12)|0;Td(s)}else{jc[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C;C=C>>8;a[v+1|0]=C;C=C>>8;a[v+2|0]=C;C=C>>8;a[v+3|0]=C;jc[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){c[l+4>>2]=0;a[v]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Vd(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];bn(x|0,0,12)|0;Td(w)}w=e;c[g>>2]=mc[c[(c[w>>2]|0)+12>>2]&127](Q)|0;c[h>>2]=mc[c[(c[w>>2]|0)+16>>2]&127](Q)|0;jc[c[(c[e>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}Md(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];bn(z|0,0,12)|0;Hd(y);jc[c[(c[e>>2]|0)+24>>2]&127](A,Q);e=k;if((a[e]&1)==0){c[k+4>>2]=0;a[e]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Vd(k,0);c[e>>2]=c[B>>2];c[e+4>>2]=c[B+4>>2];c[e+8>>2]=c[B+8>>2];bn(B|0,0,12)|0;Td(A);S=mc[c[(c[w>>2]|0)+36>>2]&127](Q)|0;c[m>>2]=S;i=n;return}else{if((c[13218]|0)!=-1){c[o>>2]=52872;c[o+4>>2]=14;c[o+8>>2]=0;Cd(52872,o,104)}o=(c[13219]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=Yb(4)|0;U=T;jm(U);vb(T|0,8088,140)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=Yb(4)|0;U=T;jm(U);vb(T|0,8088,140)}T=P;U=c[P>>2]|0;if(d){jc[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C;C=C>>8;a[E+1|0]=C;C=C>>8;a[E+2|0]=C;C=C>>8;a[E+3|0]=C;jc[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){c[l+4>>2]=0;a[E]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Vd(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];bn(G|0,0,12)|0;Td(F)}else{jc[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C;C=C>>8;a[I+1|0]=C;C=C>>8;a[I+2|0]=C;C=C>>8;a[I+3|0]=C;jc[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){c[l+4>>2]=0;a[I]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Vd(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];bn(K|0,0,12)|0;Td(J)}J=P;c[g>>2]=mc[c[(c[J>>2]|0)+12>>2]&127](T)|0;c[h>>2]=mc[c[(c[J>>2]|0)+16>>2]&127](T)|0;jc[c[(c[P>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}Md(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];bn(M|0,0,12)|0;Hd(L);jc[c[(c[P>>2]|0)+24>>2]&127](N,T);P=k;if((a[P]&1)==0){c[k+4>>2]=0;a[P]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Vd(k,0);c[P>>2]=c[O>>2];c[P+4>>2]=c[O+4>>2];c[P+8>>2]=c[O+8>>2];bn(O|0,0,12)|0;Td(N);S=mc[c[(c[J>>2]|0)+36>>2]&127](T)|0;c[m>>2]=S;i=n;return}}function li(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0;c[e>>2]=b;r=i;s=p;t=p+4|0;u=p+8|0;p=o;v=(f&512|0)==0;w=o+4|0;x=o+8|0;o=(q|0)>0;y=n;z=n+1|0;A=n+8|0;B=n+4|0;n=i;C=g;g=0;while(1){L3:do{switch(a[k+g|0]|0){case 1:{c[d>>2]=c[e>>2];D=uc[c[(c[r>>2]|0)+44>>2]&31](i,32)|0;E=c[e>>2]|0;c[e>>2]=E+4;c[E>>2]=D;F=C;break};case 4:{D=c[e>>2]|0;E=j?C+4|0:C;L6:do{if(E>>>0<h>>>0){G=E;while(1){H=G+4|0;if(!(kc[c[(c[n>>2]|0)+12>>2]&63](i,2048,c[G>>2]|0)|0)){I=G;break L6}if(H>>>0<h>>>0){G=H}else{I=H;break}}}else{I=E}}while(0);if(o){if(I>>>0>E>>>0){G=I;H=q;do{G=G-4|0;J=c[G>>2]|0;K=c[e>>2]|0;c[e>>2]=K+4;c[K>>2]=J;H=H-1|0;L=(H|0)>0;}while(G>>>0>E>>>0&L);if(L){M=H;N=G;O=34}else{P=0;Q=H;R=G}}else{M=q;N=I;O=34}if((O|0)==34){O=0;P=uc[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;Q=M;R=N}J=c[e>>2]|0;c[e>>2]=J+4;if((Q|0)>0){K=Q;S=J;while(1){c[S>>2]=P;T=K-1|0;U=c[e>>2]|0;c[e>>2]=U+4;if((T|0)>0){K=T;S=U}else{V=U;break}}}else{V=J}c[V>>2]=l;W=R}else{W=I}if((W|0)==(E|0)){S=uc[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;K=c[e>>2]|0;c[e>>2]=K+4;c[K>>2]=S}else{S=a[y]|0;K=S&255;if((K&1|0)==0){X=K>>>1}else{X=c[B>>2]|0}if((X|0)==0){Y=W;Z=0;_=0;$=-1}else{if((S&1)==0){aa=z}else{aa=c[A>>2]|0}Y=W;Z=0;_=0;$=a[aa]|0}while(1){do{if((Z|0)==($|0)){S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=m;S=_+1|0;K=a[y]|0;G=K&255;if((G&1|0)==0){ba=G>>>1}else{ba=c[B>>2]|0}if(S>>>0>=ba>>>0){ca=$;da=S;ea=0;break}G=(K&1)==0;if(G){fa=z}else{fa=c[A>>2]|0}if((a[fa+S|0]|0)==127){ca=-1;da=S;ea=0;break}if(G){ga=z}else{ga=c[A>>2]|0}ca=a[ga+S|0]|0;da=S;ea=0}else{ca=$;da=_;ea=Z}}while(0);S=Y-4|0;G=c[S>>2]|0;K=c[e>>2]|0;c[e>>2]=K+4;c[K>>2]=G;if((S|0)==(E|0)){break}else{Y=S;Z=ea+1|0;_=da;$=ca}}}J=c[e>>2]|0;if((D|0)==(J|0)){F=E;break L3}S=J-4|0;if(D>>>0<S>>>0){ha=D;ia=S}else{F=E;break L3}while(1){S=c[ha>>2]|0;c[ha>>2]=c[ia>>2];c[ia>>2]=S;S=ha+4|0;J=ia-4|0;if(S>>>0<J>>>0){ha=S;ia=J}else{F=E;break}}break};case 3:{E=a[s]|0;D=E&255;if((D&1|0)==0){ja=D>>>1}else{ja=c[t>>2]|0}if((ja|0)==0){F=C;break L3}if((E&1)==0){ka=t}else{ka=c[u>>2]|0}E=c[ka>>2]|0;D=c[e>>2]|0;c[e>>2]=D+4;c[D>>2]=E;F=C;break};case 2:{E=a[p]|0;D=E&255;J=(D&1|0)==0;if(J){la=D>>>1}else{la=c[w>>2]|0}if((la|0)==0|v){F=C;break L3}if((E&1)==0){ma=w;na=w;oa=w}else{E=c[x>>2]|0;ma=E;na=E;oa=E}if(J){pa=D>>>1}else{pa=c[w>>2]|0}D=ma+(pa<<2)|0;J=c[e>>2]|0;if((na|0)==(D|0)){qa=J}else{E=(ma+(pa-1<<2)-oa|0)>>>2;S=na;G=J;while(1){c[G>>2]=c[S>>2];K=S+4|0;if((K|0)==(D|0)){break}else{S=K;G=G+4|0}}qa=J+(E+1<<2)|0}c[e>>2]=qa;F=C;break};case 0:{c[d>>2]=c[e>>2];F=C;break};default:{F=C}}}while(0);G=g+1|0;if(G>>>0<4>>>0){C=F;g=G}else{break}}g=a[s]|0;s=g&255;F=(s&1|0)==0;if(F){ra=s>>>1}else{ra=c[t>>2]|0}if(ra>>>0>1>>>0){if((g&1)==0){sa=t;ta=t;ua=t}else{g=c[u>>2]|0;sa=g;ta=g;ua=g}if(F){va=s>>>1}else{va=c[t>>2]|0}t=sa+(va<<2)|0;s=c[e>>2]|0;F=ta+4|0;if((F|0)==(t|0)){wa=s}else{ta=((sa+(va-2<<2)-ua|0)>>>2)+1|0;ua=s;va=F;while(1){c[ua>>2]=c[va>>2];F=va+4|0;if((F|0)==(t|0)){break}else{ua=ua+4|0;va=F}}wa=s+(ta<<2)|0}c[e>>2]=wa}wa=f&176;if((wa|0)==32){c[d>>2]=c[e>>2];return}else if((wa|0)==16){return}else{c[d>>2]=b;return}}function mi(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0;e=i;i=i+32|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=n;p=i;i=i+4|0;i=i+7&-8;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+12|0;i=i+7&-8;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+4|0;i=i+7&-8;y=i;i=i+400|0;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;$d(m,h);C=m|0;D=c[C>>2]|0;if((c[13100]|0)!=-1){c[l>>2]=52400;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52400,l,104)}l=(c[13101]|0)-1|0;E=c[D+8>>2]|0;do{if((c[D+12>>2]|0)-E>>2>>>0>l>>>0){F=c[E+(l<<2)>>2]|0;if((F|0)==0){break}G=F;H=k;I=a[H]|0;J=I&255;if((J&1|0)==0){K=J>>>1}else{K=c[k+4>>2]|0}if((K|0)==0){L=0}else{if((I&1)==0){M=k+4|0}else{M=c[k+8>>2]|0}I=c[M>>2]|0;L=(I|0)==(uc[c[(c[F>>2]|0)+44>>2]&31](G,45)|0)}c[n>>2]=0;bn(s|0,0,12)|0;bn(u|0,0,12)|0;bn(w|0,0,12)|0;ki(g,L,m,o,p,q,r,t,v,x);F=y|0;I=a[H]|0;J=I&255;N=(J&1|0)==0;if(N){O=J>>>1}else{O=c[k+4>>2]|0}P=c[x>>2]|0;if((O|0)>(P|0)){if(N){Q=J>>>1}else{Q=c[k+4>>2]|0}J=d[w]|0;if((J&1|0)==0){R=J>>>1}else{R=c[v+4>>2]|0}J=d[u]|0;if((J&1|0)==0){S=J>>>1}else{S=c[t+4>>2]|0}T=(Q-P<<1|1)+R+S|0}else{J=d[w]|0;if((J&1|0)==0){U=J>>>1}else{U=c[v+4>>2]|0}J=d[u]|0;if((J&1|0)==0){V=J>>>1}else{V=c[t+4>>2]|0}T=U+2+V|0}J=T+P|0;do{if(J>>>0>100>>>0){N=Gm(J<<2)|0;W=N;if((N|0)!=0){X=W;Y=W;Z=I;break}Qm();X=W;Y=W;Z=a[H]|0}else{X=F;Y=0;Z=I}}while(0);if((Z&1)==0){_=k+4|0;$=k+4|0}else{I=c[k+8>>2]|0;_=I;$=I}I=Z&255;if((I&1|0)==0){aa=I>>>1}else{aa=c[k+4>>2]|0}li(X,z,A,c[h+4>>2]|0,$,_+(aa<<2)|0,G,L,o,c[p>>2]|0,c[q>>2]|0,r,t,v,P);c[B>>2]=c[f>>2];vl(b,B,X,c[z>>2]|0,c[A>>2]|0,h,j);if((Y|0)==0){Td(v);Td(t);Hd(r);ba=c[C>>2]|0;ca=ba|0;da=hd(ca)|0;i=e;return}Hm(Y);Td(v);Td(t);Hd(r);ba=c[C>>2]|0;ca=ba|0;da=hd(ca)|0;i=e;return}}while(0);e=Yb(4)|0;jm(e);vb(e|0,8088,140)}function ni(a){a=a|0;fd(a|0);Lm(a);return}function oi(a){a=a|0;fd(a|0);return}function pi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=_b(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function qi(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+16|0;j=d|0;k=j;bn(k|0,0,12)|0;l=b;m=h;n=a[h]|0;if((n&1)==0){o=m+1|0;p=m+1|0}else{m=c[h+8>>2]|0;o=m;p=m}m=n&255;if((m&1|0)==0){q=m>>>1}else{q=c[h+4>>2]|0}h=o+q|0;do{if(p>>>0<h>>>0){q=p;do{Od(j,a[q]|0);q=q+1|0;}while(q>>>0<h>>>0);q=(e|0)==-1?-1:e<<1;if((a[k]&1)==0){r=q;s=16;break}t=c[j+8>>2]|0;u=q}else{r=(e|0)==-1?-1:e<<1;s=16}}while(0);if((s|0)==16){t=j+1|0;u=r}r=ib(u|0,f|0,g|0,t|0)|0;bn(l|0,0,12)|0;l=cn(r|0)|0;t=r+l|0;if((l|0)>0){v=r}else{Hd(j);i=d;return}do{Od(b,a[v]|0);v=v+1|0;}while(v>>>0<t>>>0);Hd(j);i=d;return}function ri(a,b){a=a|0;b=b|0;Ib(((b|0)==-1?-1:b<<1)|0)|0;return}function si(a){a=a|0;fd(a|0);Lm(a);return}function ti(a){a=a|0;fd(a|0);return}function ui(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=_b(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function vi(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+224|0;j=d|0;k=d+8|0;l=d+40|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+192|0;q=d+200|0;r=d+208|0;s=r;t=i;i=i+8|0;u=i;i=i+8|0;bn(s|0,0,12)|0;v=b;w=j;x=n;y=t|0;c[t+4>>2]=0;c[t>>2]=4064;z=a[h]|0;if((z&1)==0){A=h+4|0;B=h+4|0}else{C=c[h+8>>2]|0;A=C;B=C}C=z&255;if((C&1|0)==0){D=C>>>1}else{D=c[h+4>>2]|0}h=A+(D<<2)|0;c[j>>2]=0;c[j+4>>2]=0;L9:do{if(B>>>0<h>>>0){j=t;D=k|0;A=k+32|0;C=B;z=4064;while(1){c[m>>2]=C;E=(qc[c[z+12>>2]&31](y,w,C,h,m,D,A,l)|0)==2;F=c[m>>2]|0;if(E|(F|0)==(C|0)){break}if(D>>>0<(c[l>>2]|0)>>>0){E=D;do{Od(r,a[E]|0);E=E+1|0;}while(E>>>0<(c[l>>2]|0)>>>0);G=c[m>>2]|0}else{G=F}if(G>>>0>=h>>>0){break L9}C=G;z=c[j>>2]|0}j=Yb(8)|0;nd(j,1080);vb(j|0,8104,24)}}while(0);fd(t|0);if((a[s]&1)==0){H=r+1|0}else{H=c[r+8>>2]|0}s=ib(((e|0)==-1?-1:e<<1)|0,f|0,g|0,H|0)|0;bn(v|0,0,12)|0;v=u|0;c[u+4>>2]=0;c[u>>2]=4008;H=cn(s|0)|0;g=s+H|0;c[n>>2]=0;c[n+4>>2]=0;if((H|0)<=0){I=u|0;fd(I);Hd(r);i=d;return}H=u;n=g;f=o|0;e=o+128|0;o=s;s=4008;while(1){c[q>>2]=o;t=(qc[c[s+16>>2]&31](v,x,o,(n-o|0)>32?o+32|0:g,q,f,e,p)|0)==2;G=c[q>>2]|0;if(t|(G|0)==(o|0)){break}if(f>>>0<(c[p>>2]|0)>>>0){t=f;do{Wd(b,c[t>>2]|0);t=t+4|0;}while(t>>>0<(c[p>>2]|0)>>>0);J=c[q>>2]|0}else{J=G}if(J>>>0>=g>>>0){K=51;break}o=J;s=c[H>>2]|0}if((K|0)==51){I=u|0;fd(I);Hd(r);i=d;return}d=Yb(8)|0;nd(d,1080);vb(d|0,8104,24)}function wi(a,b){a=a|0;b=b|0;Ib(((b|0)==-1?-1:b<<1)|0)|0;return}function xi(a){a=a|0;fd(a|0);return}function yi(b){b=b|0;var d=0,e=0,f=0;c[b>>2]=3528;d=b+8|0;e=c[d>>2]|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);if((e|0)==(c[12708]|0)){f=b|0;fd(f);return}hb(c[d>>2]|0);f=b|0;fd(f);return}function zi(a){a=a|0;fd(a|0);return}function Ai(a){a=a|0;fd(a|0);return}function Bi(a){a=a|0;a=Yb(8)|0;id(a,288);c[a>>2]=2464;vb(a|0,8120,36)}function Ci(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+448|0;f=e|0;g=e+16|0;h=e+32|0;j=e+48|0;k=e+64|0;l=e+80|0;m=e+96|0;n=e+112|0;o=e+128|0;p=e+144|0;q=e+160|0;r=e+176|0;s=e+192|0;t=e+208|0;u=e+224|0;v=e+240|0;w=e+256|0;x=e+272|0;y=e+288|0;z=e+304|0;A=e+320|0;B=e+336|0;C=e+352|0;D=e+368|0;E=e+384|0;F=e+400|0;G=e+416|0;H=e+432|0;c[b+4>>2]=d-1;c[b>>2]=3784;d=b+8|0;I=b+12|0;a[b+136|0]=1;J=b+24|0;K=J;c[I>>2]=K;c[d>>2]=K;c[b+16>>2]=J+112;J=28;L=K;do{if((L|0)==0){M=0}else{c[L>>2]=0;M=c[I>>2]|0}L=M+4|0;c[I>>2]=L;J=J-1|0;}while((J|0)!=0);Fd(b+144|0,144,1);J=c[d>>2]|0;d=c[I>>2]|0;if((J|0)!=(d|0)){c[I>>2]=d+(~((d-4-J|0)>>>2)<<2)}c[12765]=0;c[12764]=3488;if((c[13022]|0)!=-1){c[H>>2]=52088;c[H+4>>2]=14;c[H+8>>2]=0;Cd(52088,H,104)}Di(b,51056,(c[13023]|0)-1|0);c[12763]=0;c[12762]=3448;if((c[13020]|0)!=-1){c[G>>2]=52080;c[G+4>>2]=14;c[G+8>>2]=0;Cd(52080,G,104)}Di(b,51048,(c[13021]|0)-1|0);c[12819]=0;c[12818]=3896;c[12820]=0;a[51284]=0;c[12820]=c[(gb()|0)>>2];if((c[13102]|0)!=-1){c[F>>2]=52408;c[F+4>>2]=14;c[F+8>>2]=0;Cd(52408,F,104)}Di(b,51272,(c[13103]|0)-1|0);c[12817]=0;c[12816]=3816;if((c[13100]|0)!=-1){c[E>>2]=52400;c[E+4>>2]=14;c[E+8>>2]=0;Cd(52400,E,104)}Di(b,51264,(c[13101]|0)-1|0);c[12771]=0;c[12770]=3584;if((c[13026]|0)!=-1){c[D>>2]=52104;c[D+4>>2]=14;c[D+8>>2]=0;Cd(52104,D,104)}Di(b,51080,(c[13027]|0)-1|0);c[12767]=0;c[12766]=3528;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);c[12768]=c[12708];if((c[13024]|0)!=-1){c[C>>2]=52096;c[C+4>>2]=14;c[C+8>>2]=0;Cd(52096,C,104)}Di(b,51064,(c[13025]|0)-1|0);c[12773]=0;c[12772]=3640;if((c[13028]|0)!=-1){c[B>>2]=52112;c[B+4>>2]=14;c[B+8>>2]=0;Cd(52112,B,104)}Di(b,51088,(c[13029]|0)-1|0);c[12775]=0;c[12774]=3696;if((c[13030]|0)!=-1){c[A>>2]=52120;c[A+4>>2]=14;c[A+8>>2]=0;Cd(52120,A,104)}Di(b,51096,(c[13031]|0)-1|0);c[12745]=0;c[12744]=2992;a[50984]=46;a[50985]=44;bn(50988,0,12)|0;if((c[13006]|0)!=-1){c[z>>2]=52024;c[z+4>>2]=14;c[z+8>>2]=0;Cd(52024,z,104)}Di(b,50976,(c[13007]|0)-1|0);c[12737]=0;c[12736]=2944;c[12738]=46;c[12739]=44;bn(50960,0,12)|0;if((c[13004]|0)!=-1){c[y>>2]=52016;c[y+4>>2]=14;c[y+8>>2]=0;Cd(52016,y,104)}Di(b,50944,(c[13005]|0)-1|0);c[12761]=0;c[12760]=3376;if((c[13018]|0)!=-1){c[x>>2]=52072;c[x+4>>2]=14;c[x+8>>2]=0;Cd(52072,x,104)}Di(b,51040,(c[13019]|0)-1|0);c[12759]=0;c[12758]=3304;if((c[13016]|0)!=-1){c[w>>2]=52064;c[w+4>>2]=14;c[w+8>>2]=0;Cd(52064,w,104)}Di(b,51032,(c[13017]|0)-1|0);c[12757]=0;c[12756]=3240;if((c[13014]|0)!=-1){c[v>>2]=52056;c[v+4>>2]=14;c[v+8>>2]=0;Cd(52056,v,104)}Di(b,51024,(c[13015]|0)-1|0);c[12755]=0;c[12754]=3176;if((c[13012]|0)!=-1){c[u>>2]=52048;c[u+4>>2]=14;c[u+8>>2]=0;Cd(52048,u,104)}Di(b,51016,(c[13013]|0)-1|0);c[12829]=0;c[12828]=4824;if((c[13222]|0)!=-1){c[t>>2]=52888;c[t+4>>2]=14;c[t+8>>2]=0;Cd(52888,t,104)}Di(b,51312,(c[13223]|0)-1|0);c[12827]=0;c[12826]=4760;if((c[13220]|0)!=-1){c[s>>2]=52880;c[s+4>>2]=14;c[s+8>>2]=0;Cd(52880,s,104)}Di(b,51304,(c[13221]|0)-1|0);c[12825]=0;c[12824]=4696;if((c[13218]|0)!=-1){c[r>>2]=52872;c[r+4>>2]=14;c[r+8>>2]=0;Cd(52872,r,104)}Di(b,51296,(c[13219]|0)-1|0);c[12823]=0;c[12822]=4632;if((c[13216]|0)!=-1){c[q>>2]=52864;c[q+4>>2]=14;c[q+8>>2]=0;Cd(52864,q,104)}Di(b,51288,(c[13217]|0)-1|0);c[12719]=0;c[12718]=2648;if((c[12994]|0)!=-1){c[p>>2]=51976;c[p+4>>2]=14;c[p+8>>2]=0;Cd(51976,p,104)}Di(b,50872,(c[12995]|0)-1|0);c[12717]=0;c[12716]=2608;if((c[12992]|0)!=-1){c[o>>2]=51968;c[o+4>>2]=14;c[o+8>>2]=0;Cd(51968,o,104)}Di(b,50864,(c[12993]|0)-1|0);c[12715]=0;c[12714]=2568;if((c[12990]|0)!=-1){c[n>>2]=51960;c[n+4>>2]=14;c[n+8>>2]=0;Cd(51960,n,104)}Di(b,50856,(c[12991]|0)-1|0);c[12713]=0;c[12712]=2528;if((c[12988]|0)!=-1){c[m>>2]=51952;c[m+4>>2]=14;c[m+8>>2]=0;Cd(51952,m,104)}Di(b,50848,(c[12989]|0)-1|0);c[12733]=0;c[12732]=2848;c[12734]=2896;if((c[13002]|0)!=-1){c[l>>2]=52008;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52008,l,104)}Di(b,50928,(c[13003]|0)-1|0);c[12729]=0;c[12728]=2752;c[12730]=2800;if((c[13e3]|0)!=-1){c[k>>2]=52e3;c[k+4>>2]=14;c[k+8>>2]=0;Cd(52e3,k,104)}Di(b,50912,(c[13001]|0)-1|0);c[12725]=0;c[12724]=3752;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);c[12726]=c[12708];c[12724]=2720;if((c[12998]|0)!=-1){c[j>>2]=51992;c[j+4>>2]=14;c[j+8>>2]=0;Cd(51992,j,104)}Di(b,50896,(c[12999]|0)-1|0);c[12721]=0;c[12720]=3752;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);c[12722]=c[12708];c[12720]=2688;if((c[12996]|0)!=-1){c[h>>2]=51984;c[h+4>>2]=14;c[h+8>>2]=0;Cd(51984,h,104)}Di(b,50880,(c[12997]|0)-1|0);c[12753]=0;c[12752]=3080;if((c[13010]|0)!=-1){c[g>>2]=52040;c[g+4>>2]=14;c[g+8>>2]=0;Cd(52040,g,104)}Di(b,51008,(c[13011]|0)-1|0);c[12751]=0;c[12750]=3040;if((c[13008]|0)!=-1){c[f>>2]=52032;c[f+4>>2]=14;c[f+8>>2]=0;Cd(52032,f,104)}Di(b,51e3,(c[13009]|0)-1|0);i=e;return}function Di(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;gd(b|0);e=a+8|0;f=a+12|0;a=c[f>>2]|0;g=e|0;h=c[g>>2]|0;i=a-h>>2;do{if(i>>>0>d>>>0){j=h}else{k=d+1|0;if(k>>>0>i>>>0){Al(e,k-i|0);j=c[g>>2]|0;break}if(k>>>0>=i>>>0){j=h;break}l=h+(k<<2)|0;if((l|0)==(a|0)){j=h;break}c[f>>2]=a+(~((a-4-l|0)>>>2)<<2);j=h}}while(0);h=c[j+(d<<2)>>2]|0;if((h|0)==0){m=j;n=m+(d<<2)|0;c[n>>2]=b;return}hd(h|0)|0;m=c[g>>2]|0;n=m+(d<<2)|0;c[n>>2]=b;return}function Ei(a){a=a|0;Fi(a);Lm(a);return}function Fi(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;c[b>>2]=3784;d=b+12|0;e=c[d>>2]|0;f=b+8|0;g=c[f>>2]|0;if((e|0)!=(g|0)){h=0;i=g;g=e;while(1){e=c[i+(h<<2)>>2]|0;if((e|0)==0){j=g;k=i}else{hd(e|0)|0;j=c[d>>2]|0;k=c[f>>2]|0}e=h+1|0;if(e>>>0<j-k>>2>>>0){h=e;i=k;g=j}else{break}}}Hd(b+144|0);j=c[f>>2]|0;if((j|0)==0){l=b|0;fd(l);return}f=c[d>>2]|0;if((j|0)!=(f|0)){c[d>>2]=f+(~((f-4-j|0)>>>2)<<2)}if((j|0)==(b+24|0)){a[b+136|0]=0;l=b|0;fd(l);return}else{Lm(j);l=b|0;fd(l);return}}function Gi(){var b=0,d=0;if((a[52952]|0)!=0){b=c[12700]|0;return b|0}if((mb(52952)|0)==0){b=c[12700]|0;return b|0}do{if((a[52960]|0)==0){if((mb(52960)|0)==0){break}Ci(51104,1);c[12704]=51104;c[12702]=50816}}while(0);d=c[c[12702]>>2]|0;c[12706]=d;gd(d|0);c[12700]=50824;b=c[12700]|0;return b|0}function Hi(a){a=a|0;var b=0;b=c[(Gi()|0)>>2]|0;c[a>>2]=b;gd(b|0);return}function Ii(a,b){a=a|0;b=b|0;var d=0;d=c[b>>2]|0;c[a>>2]=d;gd(d|0);return}function Ji(a){a=a|0;hd(c[a>>2]|0)|0;return}function Ki(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=c[a>>2]|0;a=b|0;if((c[a>>2]|0)!=-1){c[e>>2]=b;c[e+4>>2]=14;c[e+8>>2]=0;Cd(a,e,104)}e=(c[b+4>>2]|0)-1|0;b=c[f+8>>2]|0;if((c[f+12>>2]|0)-b>>2>>>0<=e>>>0){g=Yb(4)|0;h=g;jm(h);vb(g|0,8088,140);return 0}f=c[b+(e<<2)>>2]|0;if((f|0)==0){g=Yb(4)|0;h=g;jm(h);vb(g|0,8088,140);return 0}else{i=d;return f|0}return 0}function Li(a){a=a|0;fd(a|0);Lm(a);return}function Mi(a){a=a|0;if((a|0)==0){return}ic[c[(c[a>>2]|0)+4>>2]&511](a);return}function Ni(a){a=a|0;c[a+4>>2]=(I=c[13032]|0,c[13032]=I+1,I)+1;return}function Oi(a){a=a|0;fd(a|0);Lm(a);return}function Pi(a){a=a|0;fd(a|0);return}function Qi(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;if(e>>>0>=128>>>0){f=0;return f|0}f=(b[(c[(gb()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return f|0}function Ri(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){f=c[h>>2]|0;if(f>>>0<128>>>0){j=b[(c[(gb()|0)>>2]|0)+(f<<1)>>1]|0}else{j=0}b[i>>1]=j;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+2|0}}return g|0}function Si(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((e|0)==(f|0)){g=e;return g|0}else{h=e}while(1){e=c[h>>2]|0;if(e>>>0<128>>>0){if((b[(c[(gb()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0){g=h;i=9;break}}e=h+4|0;if((e|0)==(f|0)){g=f;i=10;break}else{h=e}}if((i|0)==9){return g|0}else if((i|0)==10){return g|0}return 0}function Ti(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;L1:do{if((e|0)==(f|0)){g=e}else{a=e;while(1){h=c[a>>2]|0;if(h>>>0>=128>>>0){g=a;break L1}i=a+4|0;if((b[(c[(gb()|0)>>2]|0)+(h<<1)>>1]&d)<<16>>16==0){g=a;break L1}if((i|0)==(f|0)){g=f;break}else{a=i}}}}while(0);return g|0}function Ui(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[($b()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function Vi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[($b()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function Wi(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(ac()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function Xi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(ac()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function Yi(a,b){a=a|0;b=b|0;return b<<24>>24|0}function Zi(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){c[i>>2]=a[h]|0;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+4|0}}return g|0}function _i(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128>>>0?b&255:c)|0}function $i(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;if((d|0)==(e|0)){h=d;return h|0}b=((e-4-d|0)>>>2)+1|0;i=d;j=g;while(1){g=c[i>>2]|0;a[j]=g>>>0<128>>>0?g&255:f;g=i+4|0;if((g|0)==(e|0)){break}else{i=g;j=j+1|0}}h=d+(b<<2)|0;return h|0}function aj(b){b=b|0;var d=0;c[b>>2]=3896;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}Mm(d)}}while(0);fd(b|0);Lm(b);return}function bj(b){b=b|0;var d=0;c[b>>2]=3896;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}Mm(d)}}while(0);fd(b|0);return}function cj(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<=-1){d=b;return d|0}d=c[(c[($b()|0)>>2]|0)+((b&255)<<2)>>2]&255;return d|0}function dj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24>-1){h=c[(c[($b()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}else{h=d}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function ej(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<=-1){d=b;return d|0}d=c[(c[(ac()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;return d|0}function fj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24>-1){h=c[(c[(ac()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}else{h=d}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function gj(a,b){a=a|0;b=b|0;return b|0}function hj(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((c|0)==(d|0)){f=c;return f|0}else{g=c;h=e}while(1){a[h]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;h=h+1|0}}return f|0}function ij(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24>-1?b:c)|0}function jj(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((c|0)==(d|0)){g=c;return g|0}else{h=c;i=f}while(1){f=a[h]|0;a[i]=f<<24>>24>-1?f:e;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;i=i+1|0}}return g|0}function kj(a){a=a|0;fd(a|0);Lm(a);return}function lj(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function mj(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function nj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function oj(a){a=a|0;return 1}function pj(a){a=a|0;return 1}function qj(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function rj(a){a=a|0;return 1}function sj(a){a=a|0;yi(a);Lm(a);return}function tj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+8|0;m=l|0;n=m;o=i;i=i+4|0;i=i+7&-8;p=(e|0)==(f|0);L1:do{if(p){c[k>>2]=h;c[g>>2]=e;q=e}else{r=e;while(1){s=r+4|0;if((c[r>>2]|0)==0){t=r;break}if((s|0)==(f|0)){t=f;break}else{r=s}}c[k>>2]=h;c[g>>2]=e;if(p|(h|0)==(j|0)){q=e;break}r=d;s=j;u=b+8|0;v=o|0;w=h;x=e;y=t;while(1){z=c[r+4>>2]|0;c[m>>2]=c[r>>2];c[m+4>>2]=z;z=Mb(c[u>>2]|0)|0;A=cm(w,g,y-x>>2,s-w|0,d)|0;if((z|0)!=0){Mb(z|0)|0}if((A|0)==0){B=1;C=56;break}else if((A|0)==(-1|0)){C=16;break}z=(c[k>>2]|0)+A|0;c[k>>2]=z;if((z|0)==(j|0)){C=49;break}if((y|0)==(f|0)){D=f;E=c[g>>2]|0;F=z}else{z=Mb(c[u>>2]|0)|0;A=bm(v,0,d)|0;if((z|0)!=0){Mb(z|0)|0}if((A|0)==-1){B=2;C=53;break}z=c[k>>2]|0;if(A>>>0>(s-z|0)>>>0){B=1;C=54;break}L24:do{if((A|0)!=0){G=A;H=v;I=z;while(1){J=a[H]|0;c[k>>2]=I+1;a[I]=J;J=G-1|0;if((J|0)==0){break L24}G=J;H=H+1|0;I=c[k>>2]|0}}}while(0);z=(c[g>>2]|0)+4|0;c[g>>2]=z;L29:do{if((z|0)==(f|0)){K=f}else{A=z;while(1){I=A+4|0;if((c[A>>2]|0)==0){K=A;break L29}if((I|0)==(f|0)){K=f;break}else{A=I}}}}while(0);D=K;E=z;F=c[k>>2]|0}if((E|0)==(f|0)|(F|0)==(j|0)){q=E;break L1}else{w=F;x=E;y=D}}if((C|0)==49){q=c[g>>2]|0;break}else if((C|0)==53){i=l;return B|0}else if((C|0)==54){i=l;return B|0}else if((C|0)==56){i=l;return B|0}else if((C|0)==16){c[k>>2]=w;L41:do{if((x|0)==(c[g>>2]|0)){L=x}else{y=x;v=w;while(1){s=c[y>>2]|0;r=Mb(c[u>>2]|0)|0;A=bm(v,s,n)|0;if((r|0)!=0){Mb(r|0)|0}if((A|0)==-1){L=y;break L41}r=(c[k>>2]|0)+A|0;c[k>>2]=r;A=y+4|0;if((A|0)==(c[g>>2]|0)){L=A;break}else{y=A;v=r}}}}while(0);c[g>>2]=L;B=2;i=l;return B|0}}}while(0);B=(q|0)!=(f|0)|0;i=l;return B|0}function uj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;l=i;i=i+8|0;m=l|0;n=m;o=(e|0)==(f|0);L1:do{if(o){c[k>>2]=h;c[g>>2]=e;p=e}else{q=e;while(1){r=q+1|0;if((a[q]|0)==0){s=q;break}if((r|0)==(f|0)){s=f;break}else{q=r}}c[k>>2]=h;c[g>>2]=e;if(o|(h|0)==(j|0)){p=e;break}q=d;r=j;t=b+8|0;u=h;v=e;w=s;while(1){x=c[q+4>>2]|0;c[m>>2]=c[q>>2];c[m+4>>2]=x;y=w;x=Mb(c[t>>2]|0)|0;z=_l(u,g,y-v|0,r-u>>2,d)|0;if((x|0)!=0){Mb(x|0)|0}if((z|0)==(-1|0)){A=16;break}else if((z|0)==0){B=2;A=56;break}x=(c[k>>2]|0)+(z<<2)|0;c[k>>2]=x;if((x|0)==(j|0)){A=48;break}z=c[g>>2]|0;if((w|0)==(f|0)){C=f;D=z;E=x}else{F=Mb(c[t>>2]|0)|0;G=Zl(x,z,1,d)|0;if((F|0)!=0){Mb(F|0)|0}if((G|0)!=0){B=2;A=54;break}c[k>>2]=(c[k>>2]|0)+4;G=(c[g>>2]|0)+1|0;c[g>>2]=G;L23:do{if((G|0)==(f|0)){H=f}else{F=G;while(1){z=F+1|0;if((a[F]|0)==0){H=F;break L23}if((z|0)==(f|0)){H=f;break}else{F=z}}}}while(0);C=H;D=G;E=c[k>>2]|0}if((D|0)==(f|0)|(E|0)==(j|0)){p=D;break L1}else{u=E;v=D;w=C}}if((A|0)==16){c[k>>2]=u;L31:do{if((v|0)==(c[g>>2]|0)){I=v}else{w=u;r=v;while(1){q=Mb(c[t>>2]|0)|0;F=Zl(w,r,y-r|0,n)|0;if((q|0)!=0){Mb(q|0)|0}if((F|0)==0){J=r+1|0}else if((F|0)==(-1|0)){A=27;break}else if((F|0)==(-2|0)){A=28;break}else{J=r+F|0}F=(c[k>>2]|0)+4|0;c[k>>2]=F;if((J|0)==(c[g>>2]|0)){I=J;break L31}else{w=F;r=J}}if((A|0)==27){c[g>>2]=r;B=2;i=l;return B|0}else if((A|0)==28){c[g>>2]=r;B=1;i=l;return B|0}}}while(0);c[g>>2]=I;B=(I|0)!=(f|0)|0;i=l;return B|0}else if((A|0)==48){p=c[g>>2]|0;break}else if((A|0)==54){i=l;return B|0}else if((A|0)==56){i=l;return B|0}}}while(0);B=(p|0)!=(f|0)|0;i=l;return B|0}function vj(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+8|0;c[g>>2]=e;e=h|0;j=Mb(c[b+8>>2]|0)|0;b=bm(e,0,d)|0;if((j|0)!=0){Mb(j|0)|0}if((b|0)==(-1|0)|(b|0)==0){k=2;i=h;return k|0}j=b-1|0;b=c[g>>2]|0;if(j>>>0>(f-b|0)>>>0){k=1;i=h;return k|0}if((j|0)==0){k=0;i=h;return k|0}else{l=j;m=e;n=b}while(1){b=a[m]|0;c[g>>2]=n+1;a[n]=b;b=l-1|0;if((b|0)==0){k=0;break}l=b;m=m+1|0;n=c[g>>2]|0}i=h;return k|0}function wj(a){a=a|0;var b=0,d=0,e=0;b=a+8|0;a=Mb(c[b>>2]|0)|0;d=am(0,0,4)|0;if((a|0)!=0){Mb(a|0)|0}if((d|0)!=0){e=-1;return e|0}d=c[b>>2]|0;if((d|0)==0){e=1;return e|0}b=Mb(d|0)|0;if((b|0)==0){e=0;return e|0}Mb(b|0)|0;e=0;return e|0}function xj(a){a=a|0;return 0}function yj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((f|0)==0|(d|0)==(e|0)){g=0;return g|0}h=e;i=a+8|0;a=d;d=0;j=0;while(1){k=Mb(c[i>>2]|0)|0;l=Yl(a,h-a|0,b)|0;if((k|0)!=0){Mb(k|0)|0}if((l|0)==(-1|0)|(l|0)==(-2|0)){g=d;m=18;break}else if((l|0)==0){n=1;o=a+1|0}else{n=l;o=a+l|0}l=n+d|0;k=j+1|0;if(k>>>0>=f>>>0|(o|0)==(e|0)){g=l;m=16;break}else{a=o;d=l;j=k}}if((m|0)==16){return g|0}else if((m|0)==18){return g|0}return 0}function zj(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)==0){d=1}else{a=Mb(b|0)|0;if((a|0)==0){d=4;break}Mb(a|0)|0;d=4}}while(0);return d|0}function Aj(a){a=a|0;fd(a|0);Lm(a);return}function Bj(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=Bl(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>1<<1);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function Cj(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=Cl(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>1<<1);i=b;return l|0}function Dj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function Ej(a){a=a|0;return 0}function Fj(a){a=a|0;return 0}function Gj(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Dl(c,d,e,1114111,0)|0}function Hj(a){a=a|0;return 4}function Ij(a){a=a|0;fd(a|0);Lm(a);return}function Jj(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=El(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>2<<2);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function Kj(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=Fl(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>2<<2);i=b;return l|0}function Lj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function Mj(a){a=a|0;return 0}function Nj(a){a=a|0;return 0}function Oj(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Gl(c,d,e,1114111,0)|0}function Pj(a){a=a|0;return 4}function Qj(a){a=a|0;fd(a|0);Lm(a);return}function Rj(a){a=a|0;fd(a|0);return}function Sj(a){a=a|0;fd(a|0);Lm(a);return}function Tj(a){a=a|0;fd(a|0);return}function Uj(a){a=a|0;c[a>>2]=2992;Hd(a+12|0);fd(a|0);Lm(a);return}function Vj(a){a=a|0;c[a>>2]=2992;Hd(a+12|0);fd(a|0);return}function Wj(a){a=a|0;c[a>>2]=2944;Hd(a+16|0);fd(a|0);Lm(a);return}function Xj(a){a=a|0;c[a>>2]=2944;Hd(a+16|0);fd(a|0);return}function Yj(b){b=b|0;return a[b+8|0]|0}function Zj(a){a=a|0;return c[a+8>>2]|0}function _j(b){b=b|0;return a[b+9|0]|0}function $j(a){a=a|0;return c[a+12>>2]|0}function ak(a,b){a=a|0;b=b|0;Ed(a,b+12|0);return}function bk(a,b){a=a|0;b=b|0;Ed(a,b+16|0);return}function ck(a,b){a=a|0;b=b|0;Fd(a,1520,4);return}function dk(a,b){a=a|0;b=b|0;Rd(a,1496,em(1496)|0);return}function ek(a,b){a=a|0;b=b|0;Fd(a,1488,5);return}function fk(a,b){a=a|0;b=b|0;Rd(a,1440,em(1440)|0);return}function gk(b){b=b|0;var d=0;if((a[53048]|0)!=0){d=c[12854]|0;return d|0}if((mb(53048)|0)==0){d=c[12854]|0;return d|0}do{if((a[52936]|0)==0){if((mb(52936)|0)==0){break}bn(50344,0,168)|0;$a(76,0,u|0)|0}}while(0);Id(50344,1720)|0;Id(50356,1672)|0;Id(50368,1664)|0;Id(50380,1648)|0;Id(50392,1632)|0;Id(50404,1624)|0;Id(50416,1608)|0;Id(50428,1600)|0;Id(50440,1592)|0;Id(50452,1584)|0;Id(50464,1576)|0;Id(50476,1568)|0;Id(50488,1560)|0;Id(50500,1552)|0;c[12854]=50344;d=c[12854]|0;return d|0}function hk(b){b=b|0;var d=0;if((a[52992]|0)!=0){d=c[12832]|0;return d|0}if((mb(52992)|0)==0){d=c[12832]|0;return d|0}do{if((a[52912]|0)==0){if((mb(52912)|0)==0){break}bn(49600,0,168)|0;$a(246,0,u|0)|0}}while(0);Ud(49600,80)|0;Ud(49612,48)|0;Ud(49624,1992)|0;Ud(49636,1952)|0;Ud(49648,1912)|0;Ud(49660,1880)|0;Ud(49672,1840)|0;Ud(49684,1824)|0;Ud(49696,1808)|0;Ud(49708,1792)|0;Ud(49720,1776)|0;Ud(49732,1760)|0;Ud(49744,1744)|0;Ud(49756,1728)|0;c[12832]=49600;d=c[12832]|0;return d|0}function ik(b){b=b|0;var d=0;if((a[53040]|0)!=0){d=c[12852]|0;return d|0}if((mb(53040)|0)==0){d=c[12852]|0;return d|0}do{if((a[52928]|0)==0){if((mb(52928)|0)==0){break}bn(50056,0,288)|0;$a(12,0,u|0)|0}}while(0);Id(50056,392)|0;Id(50068,376)|0;Id(50080,368)|0;Id(50092,360)|0;Id(50104,352)|0;Id(50116,344)|0;Id(50128,336)|0;Id(50140,312)|0;Id(50152,296)|0;Id(50164,280)|0;Id(50176,264)|0;Id(50188,248)|0;Id(50200,240)|0;Id(50212,232)|0;Id(50224,224)|0;Id(50236,216)|0;Id(50248,352)|0;Id(50260,208)|0;Id(50272,200)|0;Id(50284,192)|0;Id(50296,136)|0;Id(50308,128)|0;Id(50320,120)|0;Id(50332,112)|0;c[12852]=50056;d=c[12852]|0;return d|0}function jk(b){b=b|0;var d=0;if((a[52984]|0)!=0){d=c[12830]|0;return d|0}if((mb(52984)|0)==0){d=c[12830]|0;return d|0}do{if((a[52904]|0)==0){if((mb(52904)|0)==0){break}bn(49312,0,288)|0;$a(58,0,u|0)|0}}while(0);Ud(49312,984)|0;Ud(49324,944)|0;Ud(49336,920)|0;Ud(49348,896)|0;Ud(49360,528)|0;Ud(49372,864)|0;Ud(49384,840)|0;Ud(49396,808)|0;Ud(49408,768)|0;Ud(49420,736)|0;Ud(49432,696)|0;Ud(49444,640)|0;Ud(49456,624)|0;Ud(49468,608)|0;Ud(49480,560)|0;Ud(49492,544)|0;Ud(49504,528)|0;Ud(49516,512)|0;Ud(49528,496)|0;Ud(49540,480)|0;Ud(49552,464)|0;Ud(49564,440)|0;Ud(49576,424)|0;Ud(49588,408)|0;c[12830]=49312;d=c[12830]|0;return d|0}function kk(b){b=b|0;var d=0;if((a[53056]|0)!=0){d=c[12856]|0;return d|0}if((mb(53056)|0)==0){d=c[12856]|0;return d|0}do{if((a[52944]|0)==0){if((mb(52944)|0)==0){break}bn(50512,0,288)|0;$a(62,0,u|0)|0}}while(0);Id(50512,1024)|0;Id(50524,1016)|0;c[12856]=50512;d=c[12856]|0;return d|0}function lk(b){b=b|0;var d=0;if((a[53e3]|0)!=0){d=c[12834]|0;return d|0}if((mb(53e3)|0)==0){d=c[12834]|0;return d|0}do{if((a[52920]|0)==0){if((mb(52920)|0)==0){break}bn(49768,0,288)|0;$a(206,0,u|0)|0}}while(0);Ud(49768,1048)|0;Ud(49780,1032)|0;c[12834]=49768;d=c[12834]|0;return d|0}function mk(b){b=b|0;if((a[53064]|0)!=0){return 51432}if((mb(53064)|0)==0){return 51432}Fd(51432,1408,8);$a(274,51432,u|0)|0;return 51432}function nk(b){b=b|0;if((a[53008]|0)!=0){return 51344}if((mb(53008)|0)==0){return 51344}Rd(51344,1368,em(1368)|0);$a(204,51344,u|0)|0;return 51344}function ok(b){b=b|0;if((a[53088]|0)!=0){return 51480}if((mb(53088)|0)==0){return 51480}Fd(51480,1328,8);$a(274,51480,u|0)|0;return 51480}function pk(b){b=b|0;if((a[53032]|0)!=0){return 51392}if((mb(53032)|0)==0){return 51392}Rd(51392,1288,em(1288)|0);$a(204,51392,u|0)|0;return 51392}function qk(b){b=b|0;if((a[53080]|0)!=0){return 51464}if((mb(53080)|0)==0){return 51464}Fd(51464,1264,20);$a(274,51464,u|0)|0;return 51464}function rk(b){b=b|0;if((a[53024]|0)!=0){return 51376}if((mb(53024)|0)==0){return 51376}Rd(51376,1176,em(1176)|0);$a(204,51376,u|0)|0;return 51376}function sk(b){b=b|0;if((a[53072]|0)!=0){return 51448}if((mb(53072)|0)==0){return 51448}Fd(51448,1152,11);$a(274,51448,u|0)|0;return 51448}function tk(b){b=b|0;if((a[53016]|0)!=0){return 51360}if((mb(53016)|0)==0){return 51360}Rd(51360,1104,em(1104)|0);$a(204,51360,u|0)|0;return 51360}function uk(){dd(0);$a(148,52856,u|0)|0;return}function vk(a){a=a|0;c[a>>2]=4120;Ji(a+4|0);return}function wk(a){a=a|0;c[a>>2]=4120;Ji(a+4|0);Lm(a);return}function xk(b,d){b=b|0;d=d|0;var e=0;mc[c[(c[b>>2]|0)+24>>2]&127](b)|0;e=Ki(d,52096)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(mc[c[(c[e>>2]|0)+28>>2]&127](d)|0)&1;return}function yk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=vc[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((La(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=7;break}if((l|0)==2){m=-1;n=6;break}else if((l|0)!=1){n=4;break}}if((n|0)==7){i=b;return m|0}else if((n|0)==6){i=b;return m|0}else if((n|0)==4){m=((Ja(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}return 0}function zk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if((a[b+44|0]&1)!=0){f=La(d|0,4,e|0,c[b+32>>2]|0)|0;return f|0}g=b;if((e|0)>0){h=d;i=0}else{f=0;return f|0}while(1){if((uc[c[(c[g>>2]|0)+52>>2]&31](b,c[h>>2]|0)|0)==-1){f=i;j=9;break}d=i+1|0;if((d|0)<(e|0)){h=h+4|0;i=d}else{f=d;j=10;break}}if((j|0)==9){return f|0}else if((j|0)==10){return f|0}return 0}function Ak(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L1:do{if(!k){c[g>>2]=d;if((a[b+44|0]&1)!=0){if((La(g|0,4,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+4|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=qc[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=15;break}if((v|0)==3){w=7;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=16;break}v=(c[h>>2]|0)-r|0;if((La(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=14;break}if(u){t=u?c[j>>2]|0:t}else{break L1}}if((w|0)==7){if((La(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==16){i=e;return l|0}else if((w|0)==14){i=e;return l|0}else if((w|0)==15){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function Bk(a){a=a|0;c[a>>2]=4120;Ji(a+4|0);return}function Ck(a){a=a|0;c[a>>2]=4120;Ji(a+4|0);Lm(a);return}function Dk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=Ki(d,52096)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=mc[c[(c[e>>2]|0)+24>>2]&127](d)|0;d=c[f>>2]|0;a[b+53|0]=(mc[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;if((c[g>>2]|0)<=8){return}Uh(152);return}function Ek(a){a=a|0;return Nl(a,0)|0}function Fk(a){a=a|0;return Nl(a,1)|0}function Gk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L8:do{if(l){c[h>>2]=c[n>>2];o=c[b+36>>2]|0;p=f|0;q=qc[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+4|0,j,p,f+8|0,g)|0;if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}else if((q|0)==3){a[p]=c[n>>2];c[g>>2]=f+1}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L8}r=o-1|0;c[g>>2]=r;if((Lb(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function Hk(a){a=a|0;c[a>>2]=4192;Ji(a+4|0);return}function Ik(a){a=a|0;c[a>>2]=4192;Ji(a+4|0);Lm(a);return}function Jk(b,d){b=b|0;d=d|0;var e=0;mc[c[(c[b>>2]|0)+24>>2]&127](b)|0;e=Ki(d,52104)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(mc[c[(c[e>>2]|0)+28>>2]&127](d)|0)&1;return}function Kk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=vc[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((La(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=6;break}if((l|0)==2){m=-1;n=7;break}else if((l|0)!=1){n=4;break}}if((n|0)==7){i=b;return m|0}else if((n|0)==6){i=b;return m|0}else if((n|0)==4){m=((Ja(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}return 0}function Lk(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;if((a[b+44|0]&1)!=0){g=La(e|0,1,f|0,c[b+32>>2]|0)|0;return g|0}h=b;if((f|0)>0){i=e;j=0}else{g=0;return g|0}while(1){if((uc[c[(c[h>>2]|0)+52>>2]&31](b,d[i]|0)|0)==-1){g=j;k=8;break}e=j+1|0;if((e|0)<(f|0)){i=i+1|0;j=e}else{g=e;k=10;break}}if((k|0)==8){return g|0}else if((k|0)==10){return g|0}return 0}function Mk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L1:do{if(!k){a[g]=d;if((a[b+44|0]&1)!=0){if((La(g|0,1,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+1|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=qc[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=14;break}if((v|0)==3){w=7;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=15;break}v=(c[h>>2]|0)-r|0;if((La(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=18;break}if(u){t=u?c[j>>2]|0:t}else{break L1}}if((w|0)==14){i=e;return l|0}else if((w|0)==15){i=e;return l|0}else if((w|0)==7){if((La(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==18){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function Nk(a){a=a|0;c[a>>2]=4192;Ji(a+4|0);return}function Ok(a){a=a|0;c[a>>2]=4192;Ji(a+4|0);Lm(a);return}function Pk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=Ki(d,52104)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=mc[c[(c[e>>2]|0)+24>>2]&127](d)|0;d=c[f>>2]|0;a[b+53|0]=(mc[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;if((c[g>>2]|0)<=8){return}Uh(152);return}function Qk(a){a=a|0;return Ol(a,0)|0}function Rk(a){a=a|0;return Ol(a,1)|0}function Sk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L8:do{if(l){a[h]=c[n>>2];o=c[b+36>>2]|0;p=f|0;q=qc[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+1|0,j,p,f+8|0,g)|0;if((q|0)==3){a[p]=c[n>>2];c[g>>2]=f+1}else if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L8}r=o-1|0;c[g>>2]=r;if((Lb(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function Tk(a){a=a|0;td(a|0);return}function Uk(a){a=a|0;td(a|0);Lm(a);return}function Vk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4192;j=b+4|0;Hi(j);bn(b+8|0,0,24)|0;c[h>>2]=4960;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;Ii(g,j);j=Ki(g,52104)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=mc[c[(c[j>>2]|0)+24>>2]&127](e)|0;e=c[d>>2]|0;a[b+53|0]=(mc[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[h>>2]|0)<=8){Ji(g);i=f;return}Uh(152);Ji(g);i=f;return}function Wk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4192;j=b+4|0;Hi(j);bn(b+8|0,0,24)|0;c[h>>2]=4560;c[b+32>>2]=d;Ii(g,j);j=Ki(g,52104)|0;d=j;Ji(g);c[b+36>>2]=d;c[b+40>>2]=e;a[b+44|0]=(mc[c[(c[j>>2]|0)+28>>2]&127](d)|0)&1;i=f;return}function Xk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4120;j=b+4|0;Hi(j);bn(b+8|0,0,24)|0;c[h>>2]=4888;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;Ii(g,j);j=Ki(g,52096)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=mc[c[(c[j>>2]|0)+24>>2]&127](e)|0;e=c[d>>2]|0;a[b+53|0]=(mc[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[h>>2]|0)<=8){Ji(g);i=f;return}Uh(152);Ji(g);i=f;return}function Yk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4120;j=b+4|0;Hi(j);bn(b+8|0,0,24)|0;c[h>>2]=4488;c[b+32>>2]=d;Ii(g,j);j=Ki(g,52096)|0;d=j;Ji(g);c[b+36>>2]=d;c[b+40>>2]=e;a[b+44|0]=(mc[c[(c[j>>2]|0)+28>>2]&127](d)|0)&1;i=f;return}function Zk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a+4|0;d=c[b+4>>2]|0;e=(c[a>>2]|0)+(d>>1)|0;a=e;f=c[b>>2]|0;if((d&1|0)==0){g=f;ic[g&511](a);return}else{g=c[(c[e>>2]|0)+f>>2]|0;ic[g&511](a);return}}function _k(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=Gm(m)|0;if((o|0)!=0){p=o;q=o;break}Qm();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){z=r;break}if((mc[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){A=z;B=0}else{do{if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if((mc[c[(c[m>>2]|0)+36>>2]&127](m)|0)!=-1){C=m;break}c[b>>2]=0;C=0}else{C=m}}while(0);A=c[u>>2]|0;B=C}D=(B|0)==0;if(!((r^D)&(s|0)!=0)){break}m=c[A+12>>2]|0;if((m|0)==(c[A+16>>2]|0)){E=(mc[c[(c[A>>2]|0)+36>>2]&127](A)|0)&255}else{E=a[m]|0}if(k){F=E}else{F=uc[c[(c[e>>2]|0)+12>>2]&31](h,E)|0}do{if(n){G=x;H=s}else{m=t+1|0;if(k){y=s;o=x;w=p;v=0;I=f;while(1){do{if((a[w]|0)==1){J=a[I]|0;if((J&1)==0){K=I+1|0}else{K=c[I+8>>2]|0}if(F<<24>>24!=(a[K+t|0]|0)){a[w]=0;L=v;M=o;N=y-1|0;break}O=J&255;if((O&1|0)==0){P=O>>>1}else{P=c[I+4>>2]|0}if((P|0)!=(m|0)){L=1;M=o;N=y;break}a[w]=2;L=1;M=o+1|0;N=y-1|0}else{L=v;M=o;N=y}}while(0);O=I+12|0;if((O|0)==(g|0)){Q=N;R=M;S=L;break}else{y=N;o=M;w=w+1|0;v=L;I=O}}}else{I=s;v=x;w=p;o=0;y=f;while(1){do{if((a[w]|0)==1){O=y;if((a[O]&1)==0){T=y+1|0}else{T=c[y+8>>2]|0}if(F<<24>>24!=(uc[c[(c[e>>2]|0)+12>>2]&31](h,a[T+t|0]|0)|0)<<24>>24){a[w]=0;U=o;V=v;W=I-1|0;break}J=d[O]|0;if((J&1|0)==0){X=J>>>1}else{X=c[y+4>>2]|0}if((X|0)!=(m|0)){U=1;V=v;W=I;break}a[w]=2;U=1;V=v+1|0;W=I-1|0}else{U=o;V=v;W=I}}while(0);J=y+12|0;if((J|0)==(g|0)){Q=W;R=V;S=U;break}else{I=W;v=V;w=w+1|0;o=U;y=J}}}if(!S){G=R;H=Q;break}y=c[u>>2]|0;o=y+12|0;w=c[o>>2]|0;if((w|0)==(c[y+16>>2]|0)){mc[c[(c[y>>2]|0)+40>>2]&127](y)|0}else{c[o>>2]=w+1}if((R+Q|0)>>>0<2>>>0|n){G=R;H=Q;break}w=t+1|0;o=R;y=p;v=f;while(1){do{if((a[y]|0)==2){I=d[v]|0;if((I&1|0)==0){Y=I>>>1}else{Y=c[v+4>>2]|0}if((Y|0)==(w|0)){Z=o;break}a[y]=0;Z=o-1|0}else{Z=o}}while(0);I=v+12|0;if((I|0)==(g|0)){G=Z;H=Q;break}else{o=Z;y=y+1|0;v=I}}}}while(0);t=t+1|0;x=G;s=H}do{if((A|0)==0){_=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){_=A;break}if((mc[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[u>>2]=0;_=0;break}else{_=c[u>>2]|0;break}}}while(0);u=(_|0)==0;do{if(D){$=91}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){if(u){break}else{$=93;break}}if((mc[c[(c[B>>2]|0)+36>>2]&127](B)|0)==-1){c[b>>2]=0;$=91;break}else{if(u^(B|0)==0){break}else{$=93;break}}}}while(0);if(($|0)==91){if(u){$=93}}if(($|0)==93){c[j>>2]=c[j>>2]|2}L123:do{if(n){$=97}else{u=f;B=p;while(1){if((a[B]|0)==2){aa=u;break L123}b=u+12|0;if((b|0)==(g|0)){$=97;break}else{u=b;B=B+1|0}}}}while(0);if(($|0)==97){c[j>>2]=c[j>>2]|4;aa=g}if((q|0)==0){i=l;return aa|0}Hm(q);i=l;return aa|0}function $k(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+160|0;r=c[h+4>>2]&74;if((r|0)==0){s=0}else if((r|0)==64){s=8}else if((r|0)==8){s=16}else{s=10}r=l|0;Rf(n,h,r,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){t=h+1|0;u=t;v=t;w=o+8|0}else{t=o+8|0;u=c[t>>2]|0;v=h+1|0;w=t}t=q|0;h=f|0;f=g|0;g=o|0;x=o+4|0;y=l+24|0;z=l+25|0;A=n;B=q;q=l+26|0;C=l;l=n+4|0;D=u;E=0;F=t;G=u;u=c[h>>2]|0;L11:while(1){do{if((u|0)==0){H=0}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){H=u;break}if((mc[c[(c[u>>2]|0)+36>>2]&127](u)|0)!=-1){H=u;break}c[h>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[f>>2]|0;do{if((J|0)==0){K=21}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{K=23;break L11}}if((mc[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[f>>2]=0;K=21;break}else{if(I^(J|0)==0){break}else{K=23;break L11}}}}while(0);if((K|0)==21){K=0;if(I){K=23;break}}J=d[p]|0;L=(J&1|0)==0;if((G-D|0)==((L?J>>>1:c[x>>2]|0)|0)){if(L){M=J>>>1;N=J>>>1}else{J=c[x>>2]|0;M=J;N=J}Kd(o,M<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}Kd(o,O,0);if((a[p]&1)==0){P=v}else{P=c[w>>2]|0}Q=P;R=P+N|0}else{Q=D;R=G}J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){S=(mc[c[(c[H>>2]|0)+36>>2]&127](H)|0)&255}else{S=a[J]|0}J=a[m]|0;L=(R|0)==(Q|0);do{if(L){T=(a[y]|0)==S<<24>>24;if(!(T|(a[z]|0)==S<<24>>24)){K=45;break}a[R]=T?43:45;U=0;V=F;W=R+1|0}else{K=45}}while(0);L54:do{if((K|0)==45){K=0;I=a[A]|0;T=I&255;if((((T&1|0)==0?T>>>1:c[l>>2]|0)|0)!=0&S<<24>>24==J<<24>>24){if((F-B|0)>=160){U=E;V=F;W=R;break}c[F>>2]=E;U=0;V=F+4|0;W=R;break}else{X=r}while(1){T=X+1|0;if((a[X]|0)==S<<24>>24){Y=X;break}if((T|0)==(q|0)){Y=q;break}else{X=T}}T=Y-C|0;if((T|0)>23){Z=Q;_=R;$=I;break L11}do{if((s|0)==8|(s|0)==10){if((T|0)>=(s|0)){Z=Q;_=R;$=I;break L11}}else if((s|0)==16){if((T|0)<22){break}if(L){Z=R;_=R;$=I;break L11}if((R-Q|0)>=3){Z=Q;_=R;$=I;break L11}if((a[R-1|0]|0)!=48){Z=Q;_=R;$=I;break L11}a[R]=a[9632+T|0]|0;U=0;V=F;W=R+1|0;break L54}}while(0);a[R]=a[9632+T|0]|0;U=E+1|0;V=F;W=R+1|0}}while(0);L=c[h>>2]|0;J=L+12|0;I=c[J>>2]|0;if((I|0)==(c[L+16>>2]|0)){mc[c[(c[L>>2]|0)+40>>2]&127](L)|0;D=Q;E=U;F=V;G=W;u=L;continue}else{c[J>>2]=I+1;D=Q;E=U;F=V;G=W;u=L;continue}}if((K|0)==23){Z=D;_=G;$=a[A]|0}G=$&255;do{if((((G&1|0)==0?G>>>1:c[l>>2]|0)|0)==0){aa=F}else{if((F-B|0)>=160){aa=F;break}c[F>>2]=E;aa=F+4|0}}while(0);c[k>>2]=Pl(Z,_,j,s)|0;s=n;_=a[A]|0;Z=_&255;L84:do{if((((Z&1|0)==0?Z>>>1:c[l>>2]|0)|0)!=0){do{if((t|0)==(aa|0)){ba=_}else{k=aa-4|0;if(k>>>0>t>>>0){ca=t;da=k}else{ba=_;break}do{k=c[ca>>2]|0;c[ca>>2]=c[da>>2];c[da>>2]=k;ca=ca+4|0;da=da-4|0;}while(ca>>>0<da>>>0);ba=a[A]|0}}while(0);if((ba&1)==0){ea=s+1|0}else{ea=c[n+8>>2]|0}T=ba&255;k=aa-4|0;F=a[ea]|0;E=F<<24>>24;B=F<<24>>24<1|F<<24>>24==127;L96:do{if(k>>>0>t>>>0){F=ea+((T&1|0)==0?T>>>1:c[l>>2]|0)|0;G=ea;$=t;D=E;u=B;while(1){if(!u){if((D|0)!=(c[$>>2]|0)){break}}W=(F-G|0)>1?G+1|0:G;V=$+4|0;U=a[W]|0;Q=U<<24>>24;R=U<<24>>24<1|U<<24>>24==127;if(V>>>0<k>>>0){G=W;$=V;D=Q;u=R}else{fa=Q;ga=R;break L96}}c[j>>2]=4;break L84}else{fa=E;ga=B}}while(0);if(ga){break}if(((c[k>>2]|0)-1|0)>>>0<fa>>>0){break}c[j>>2]=4}}while(0);fa=c[h>>2]|0;do{if((fa|0)==0){ha=0}else{if((c[fa+12>>2]|0)!=(c[fa+16>>2]|0)){ha=fa;break}if((mc[c[(c[fa>>2]|0)+36>>2]&127](fa)|0)!=-1){ha=fa;break}c[h>>2]=0;ha=0}}while(0);h=(ha|0)==0;fa=c[f>>2]|0;do{if((fa|0)==0){K=94}else{if((c[fa+12>>2]|0)!=(c[fa+16>>2]|0)){if(!h){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}if((mc[c[(c[fa>>2]|0)+36>>2]&127](fa)|0)==-1){c[f>>2]=0;K=94;break}if(!(h^(fa|0)==0)){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}}while(0);do{if((K|0)==94){if(h){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}function al(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+160|0;r=c[h+4>>2]&74;if((r|0)==64){s=8}else if((r|0)==0){s=0}else if((r|0)==8){s=16}else{s=10}r=l|0;Rf(n,h,r,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){t=h+1|0;u=t;v=t;w=o+8|0}else{t=o+8|0;u=c[t>>2]|0;v=h+1|0;w=t}t=q|0;h=f|0;f=g|0;g=o|0;x=o+4|0;y=l+24|0;z=l+25|0;A=n;B=q;q=l+26|0;C=l;l=n+4|0;D=u;E=0;F=t;G=u;u=c[h>>2]|0;L11:while(1){do{if((u|0)==0){H=0}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){H=u;break}if((mc[c[(c[u>>2]|0)+36>>2]&127](u)|0)!=-1){H=u;break}c[h>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[f>>2]|0;do{if((J|0)==0){L=21}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{L=23;break L11}}if((mc[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[f>>2]=0;L=21;break}else{if(I^(J|0)==0){break}else{L=23;break L11}}}}while(0);if((L|0)==21){L=0;if(I){L=23;break}}J=d[p]|0;M=(J&1|0)==0;if((G-D|0)==((M?J>>>1:c[x>>2]|0)|0)){if(M){N=J>>>1;O=J>>>1}else{J=c[x>>2]|0;N=J;O=J}Kd(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}Kd(o,P,0);if((a[p]&1)==0){Q=v}else{Q=c[w>>2]|0}R=Q;S=Q+O|0}else{R=D;S=G}J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){T=(mc[c[(c[H>>2]|0)+36>>2]&127](H)|0)&255}else{T=a[J]|0}J=a[m]|0;M=(S|0)==(R|0);do{if(M){U=(a[y]|0)==T<<24>>24;if(!(U|(a[z]|0)==T<<24>>24)){L=45;break}a[S]=U?43:45;V=0;W=F;X=S+1|0}else{L=45}}while(0);L54:do{if((L|0)==45){L=0;I=a[A]|0;U=I&255;if((((U&1|0)==0?U>>>1:c[l>>2]|0)|0)!=0&T<<24>>24==J<<24>>24){if((F-B|0)>=160){V=E;W=F;X=S;break}c[F>>2]=E;V=0;W=F+4|0;X=S;break}else{Y=r}while(1){U=Y+1|0;if((a[Y]|0)==T<<24>>24){Z=Y;break}if((U|0)==(q|0)){Z=q;break}else{Y=U}}U=Z-C|0;if((U|0)>23){_=R;$=S;aa=I;break L11}do{if((s|0)==8|(s|0)==10){if((U|0)>=(s|0)){_=R;$=S;aa=I;break L11}}else if((s|0)==16){if((U|0)<22){break}if(M){_=S;$=S;aa=I;break L11}if((S-R|0)>=3){_=R;$=S;aa=I;break L11}if((a[S-1|0]|0)!=48){_=R;$=S;aa=I;break L11}a[S]=a[9632+U|0]|0;V=0;W=F;X=S+1|0;break L54}}while(0);a[S]=a[9632+U|0]|0;V=E+1|0;W=F;X=S+1|0}}while(0);M=c[h>>2]|0;J=M+12|0;I=c[J>>2]|0;if((I|0)==(c[M+16>>2]|0)){mc[c[(c[M>>2]|0)+40>>2]&127](M)|0;D=R;E=V;F=W;G=X;u=M;continue}else{c[J>>2]=I+1;D=R;E=V;F=W;G=X;u=M;continue}}if((L|0)==23){_=D;$=G;aa=a[A]|0}G=aa&255;do{if((((G&1|0)==0?G>>>1:c[l>>2]|0)|0)==0){ba=F}else{if((F-B|0)>=160){ba=F;break}c[F>>2]=E;ba=F+4|0}}while(0);F=Ql(_,$,j,s)|0;c[k>>2]=F;c[k+4>>2]=K;k=n;F=a[A]|0;s=F&255;L84:do{if((((s&1|0)==0?s>>>1:c[l>>2]|0)|0)!=0){do{if((t|0)==(ba|0)){ca=F}else{$=ba-4|0;if($>>>0>t>>>0){da=t;ea=$}else{ca=F;break}do{$=c[da>>2]|0;c[da>>2]=c[ea>>2];c[ea>>2]=$;da=da+4|0;ea=ea-4|0;}while(da>>>0<ea>>>0);ca=a[A]|0}}while(0);if((ca&1)==0){fa=k+1|0}else{fa=c[n+8>>2]|0}U=ca&255;$=ba-4|0;_=a[fa]|0;E=_<<24>>24;B=_<<24>>24<1|_<<24>>24==127;L96:do{if($>>>0>t>>>0){_=fa+((U&1|0)==0?U>>>1:c[l>>2]|0)|0;G=fa;aa=t;D=E;u=B;while(1){if(!u){if((D|0)!=(c[aa>>2]|0)){break}}X=(_-G|0)>1?G+1|0:G;W=aa+4|0;V=a[X]|0;R=V<<24>>24;S=V<<24>>24<1|V<<24>>24==127;if(W>>>0<$>>>0){G=X;aa=W;D=R;u=S}else{ga=R;ha=S;break L96}}c[j>>2]=4;break L84}else{ga=E;ha=B}}while(0);if(ha){break}if(((c[$>>2]|0)-1|0)>>>0<ga>>>0){break}c[j>>2]=4}}while(0);ga=c[h>>2]|0;do{if((ga|0)==0){ia=0}else{if((c[ga+12>>2]|0)!=(c[ga+16>>2]|0)){ia=ga;break}if((mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)!=-1){ia=ga;break}c[h>>2]=0;ia=0}}while(0);h=(ia|0)==0;ga=c[f>>2]|0;do{if((ga|0)==0){L=94}else{if((c[ga+12>>2]|0)!=(c[ga+16>>2]|0)){if(!h){break}ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}if((mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)==-1){c[f>>2]=0;L=94;break}if(!(h^(ga|0)==0)){break}ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}}while(0);do{if((L|0)==94){if(h){break}ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}function bl(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0;f=i;i=i+72|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+32|0;o=f+40|0;p=f+56|0;q=p;r=i;i=i+160|0;s=c[j+4>>2]&74;if((s|0)==0){t=0}else if((s|0)==64){t=8}else if((s|0)==8){t=16}else{t=10}s=m|0;Rf(o,j,s,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){u=j+1|0;v=u;w=u;x=p+8|0}else{u=p+8|0;v=c[u>>2]|0;w=j+1|0;x=u}u=r|0;j=g|0;g=h|0;h=p|0;y=p+4|0;z=m+24|0;A=m+25|0;B=o;C=r;r=m+26|0;D=m;m=o+4|0;E=v;F=0;G=u;H=v;v=c[j>>2]|0;L11:while(1){do{if((v|0)==0){I=0}else{if((c[v+12>>2]|0)!=(c[v+16>>2]|0)){I=v;break}if((mc[c[(c[v>>2]|0)+36>>2]&127](v)|0)!=-1){I=v;break}c[j>>2]=0;I=0}}while(0);J=(I|0)==0;K=c[g>>2]|0;do{if((K|0)==0){L=21}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){if(J){break}else{L=23;break L11}}if((mc[c[(c[K>>2]|0)+36>>2]&127](K)|0)==-1){c[g>>2]=0;L=21;break}else{if(J^(K|0)==0){break}else{L=23;break L11}}}}while(0);if((L|0)==21){L=0;if(J){L=23;break}}K=d[q]|0;M=(K&1|0)==0;if((H-E|0)==((M?K>>>1:c[y>>2]|0)|0)){if(M){N=K>>>1;O=K>>>1}else{K=c[y>>2]|0;N=K;O=K}Kd(p,N<<1,0);if((a[q]&1)==0){P=10}else{P=(c[h>>2]&-2)-1|0}Kd(p,P,0);if((a[q]&1)==0){Q=w}else{Q=c[x>>2]|0}R=Q;S=Q+O|0}else{R=E;S=H}K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){T=(mc[c[(c[I>>2]|0)+36>>2]&127](I)|0)&255}else{T=a[K]|0}K=a[n]|0;M=(S|0)==(R|0);do{if(M){U=(a[z]|0)==T<<24>>24;if(!(U|(a[A]|0)==T<<24>>24)){L=45;break}a[S]=U?43:45;V=0;W=G;X=S+1|0}else{L=45}}while(0);L54:do{if((L|0)==45){L=0;J=a[B]|0;U=J&255;if((((U&1|0)==0?U>>>1:c[m>>2]|0)|0)!=0&T<<24>>24==K<<24>>24){if((G-C|0)>=160){V=F;W=G;X=S;break}c[G>>2]=F;V=0;W=G+4|0;X=S;break}else{Y=s}while(1){U=Y+1|0;if((a[Y]|0)==T<<24>>24){Z=Y;break}if((U|0)==(r|0)){Z=r;break}else{Y=U}}U=Z-D|0;if((U|0)>23){_=R;$=S;aa=J;break L11}do{if((t|0)==8|(t|0)==10){if((U|0)>=(t|0)){_=R;$=S;aa=J;break L11}}else if((t|0)==16){if((U|0)<22){break}if(M){_=S;$=S;aa=J;break L11}if((S-R|0)>=3){_=R;$=S;aa=J;break L11}if((a[S-1|0]|0)!=48){_=R;$=S;aa=J;break L11}a[S]=a[9632+U|0]|0;V=0;W=G;X=S+1|0;break L54}}while(0);a[S]=a[9632+U|0]|0;V=F+1|0;W=G;X=S+1|0}}while(0);M=c[j>>2]|0;K=M+12|0;J=c[K>>2]|0;if((J|0)==(c[M+16>>2]|0)){mc[c[(c[M>>2]|0)+40>>2]&127](M)|0;E=R;F=V;G=W;H=X;v=M;continue}else{c[K>>2]=J+1;E=R;F=V;G=W;H=X;v=M;continue}}if((L|0)==23){_=E;$=H;aa=a[B]|0}H=aa&255;do{if((((H&1|0)==0?H>>>1:c[m>>2]|0)|0)==0){ba=G}else{if((G-C|0)>=160){ba=G;break}c[G>>2]=F;ba=G+4|0}}while(0);b[l>>1]=Rl(_,$,k,t)|0;t=o;$=a[B]|0;_=$&255;L84:do{if((((_&1|0)==0?_>>>1:c[m>>2]|0)|0)!=0){do{if((u|0)==(ba|0)){ca=$}else{l=ba-4|0;if(l>>>0>u>>>0){da=u;ea=l}else{ca=$;break}do{l=c[da>>2]|0;c[da>>2]=c[ea>>2];c[ea>>2]=l;da=da+4|0;ea=ea-4|0;}while(da>>>0<ea>>>0);ca=a[B]|0}}while(0);if((ca&1)==0){fa=t+1|0}else{fa=c[o+8>>2]|0}U=ca&255;l=ba-4|0;G=a[fa]|0;F=G<<24>>24;C=G<<24>>24<1|G<<24>>24==127;L96:do{if(l>>>0>u>>>0){G=fa+((U&1|0)==0?U>>>1:c[m>>2]|0)|0;H=fa;aa=u;E=F;v=C;while(1){if(!v){if((E|0)!=(c[aa>>2]|0)){break}}X=(G-H|0)>1?H+1|0:H;W=aa+4|0;V=a[X]|0;R=V<<24>>24;S=V<<24>>24<1|V<<24>>24==127;if(W>>>0<l>>>0){H=X;aa=W;E=R;v=S}else{ga=R;ha=S;break L96}}c[k>>2]=4;break L84}else{ga=F;ha=C}}while(0);if(ha){break}if(((c[l>>2]|0)-1|0)>>>0<ga>>>0){break}c[k>>2]=4}}while(0);ga=c[j>>2]|0;do{if((ga|0)==0){ia=0}else{if((c[ga+12>>2]|0)!=(c[ga+16>>2]|0)){ia=ga;break}if((mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)!=-1){ia=ga;break}c[j>>2]=0;ia=0}}while(0);j=(ia|0)==0;ga=c[g>>2]|0;do{if((ga|0)==0){L=94}else{if((c[ga+12>>2]|0)!=(c[ga+16>>2]|0)){if(!j){break}ja=e|0;c[ja>>2]=ia;Hd(p);Hd(o);i=f;return}if((mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)==-1){c[g>>2]=0;L=94;break}if(!(j^(ga|0)==0)){break}ja=e|0;c[ja>>2]=ia;Hd(p);Hd(o);i=f;return}}while(0);do{if((L|0)==94){if(j){break}ja=e|0;c[ja>>2]=ia;Hd(p);Hd(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;ja=e|0;c[ja>>2]=ia;Hd(p);Hd(o);i=f;return}function cl(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+160|0;r=c[h+4>>2]&74;if((r|0)==8){s=16}else if((r|0)==64){s=8}else if((r|0)==0){s=0}else{s=10}r=l|0;Rf(n,h,r,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){t=h+1|0;u=t;v=t;w=o+8|0}else{t=o+8|0;u=c[t>>2]|0;v=h+1|0;w=t}t=q|0;h=f|0;f=g|0;g=o|0;x=o+4|0;y=l+24|0;z=l+25|0;A=n;B=q;q=l+26|0;C=l;l=n+4|0;D=u;E=0;F=t;G=u;u=c[h>>2]|0;L11:while(1){do{if((u|0)==0){H=0}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){H=u;break}if((mc[c[(c[u>>2]|0)+36>>2]&127](u)|0)!=-1){H=u;break}c[h>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[f>>2]|0;do{if((J|0)==0){K=21}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{K=23;break L11}}if((mc[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[f>>2]=0;K=21;break}else{if(I^(J|0)==0){break}else{K=23;break L11}}}}while(0);if((K|0)==21){K=0;if(I){K=23;break}}J=d[p]|0;L=(J&1|0)==0;if((G-D|0)==((L?J>>>1:c[x>>2]|0)|0)){if(L){M=J>>>1;N=J>>>1}else{J=c[x>>2]|0;M=J;N=J}Kd(o,M<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}Kd(o,O,0);if((a[p]&1)==0){P=v}else{P=c[w>>2]|0}Q=P;R=P+N|0}else{Q=D;R=G}J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){S=(mc[c[(c[H>>2]|0)+36>>2]&127](H)|0)&255}else{S=a[J]|0}J=a[m]|0;L=(R|0)==(Q|0);do{if(L){T=(a[y]|0)==S<<24>>24;if(!(T|(a[z]|0)==S<<24>>24)){K=45;break}a[R]=T?43:45;U=0;V=F;W=R+1|0}else{K=45}}while(0);L54:do{if((K|0)==45){K=0;I=a[A]|0;T=I&255;if((((T&1|0)==0?T>>>1:c[l>>2]|0)|0)!=0&S<<24>>24==J<<24>>24){if((F-B|0)>=160){U=E;V=F;W=R;break}c[F>>2]=E;U=0;V=F+4|0;W=R;break}else{X=r}while(1){T=X+1|0;if((a[X]|0)==S<<24>>24){Y=X;break}if((T|0)==(q|0)){Y=q;break}else{X=T}}T=Y-C|0;if((T|0)>23){Z=Q;_=R;$=I;break L11}do{if((s|0)==8|(s|0)==10){if((T|0)>=(s|0)){Z=Q;_=R;$=I;break L11}}else if((s|0)==16){if((T|0)<22){break}if(L){Z=R;_=R;$=I;break L11}if((R-Q|0)>=3){Z=Q;_=R;$=I;break L11}if((a[R-1|0]|0)!=48){Z=Q;_=R;$=I;break L11}a[R]=a[9632+T|0]|0;U=0;V=F;W=R+1|0;break L54}}while(0);a[R]=a[9632+T|0]|0;U=E+1|0;V=F;W=R+1|0}}while(0);L=c[h>>2]|0;J=L+12|0;I=c[J>>2]|0;if((I|0)==(c[L+16>>2]|0)){mc[c[(c[L>>2]|0)+40>>2]&127](L)|0;D=Q;E=U;F=V;G=W;u=L;continue}else{c[J>>2]=I+1;D=Q;E=U;F=V;G=W;u=L;continue}}if((K|0)==23){Z=D;_=G;$=a[A]|0}G=$&255;do{if((((G&1|0)==0?G>>>1:c[l>>2]|0)|0)==0){aa=F}else{if((F-B|0)>=160){aa=F;break}c[F>>2]=E;aa=F+4|0}}while(0);c[k>>2]=Sl(Z,_,j,s)|0;s=n;_=a[A]|0;Z=_&255;L84:do{if((((Z&1|0)==0?Z>>>1:c[l>>2]|0)|0)!=0){do{if((t|0)==(aa|0)){ba=_}else{k=aa-4|0;if(k>>>0>t>>>0){ca=t;da=k}else{ba=_;break}do{k=c[ca>>2]|0;c[ca>>2]=c[da>>2];c[da>>2]=k;ca=ca+4|0;da=da-4|0;}while(ca>>>0<da>>>0);ba=a[A]|0}}while(0);if((ba&1)==0){ea=s+1|0}else{ea=c[n+8>>2]|0}T=ba&255;k=aa-4|0;F=a[ea]|0;E=F<<24>>24;B=F<<24>>24<1|F<<24>>24==127;L96:do{if(k>>>0>t>>>0){F=ea+((T&1|0)==0?T>>>1:c[l>>2]|0)|0;G=ea;$=t;D=E;u=B;while(1){if(!u){if((D|0)!=(c[$>>2]|0)){break}}W=(F-G|0)>1?G+1|0:G;V=$+4|0;U=a[W]|0;Q=U<<24>>24;R=U<<24>>24<1|U<<24>>24==127;if(V>>>0<k>>>0){G=W;$=V;D=Q;u=R}else{fa=Q;ga=R;break L96}}c[j>>2]=4;break L84}else{fa=E;ga=B}}while(0);if(ga){break}if(((c[k>>2]|0)-1|0)>>>0<fa>>>0){break}c[j>>2]=4}}while(0);fa=c[h>>2]|0;do{if((fa|0)==0){ha=0}else{if((c[fa+12>>2]|0)!=(c[fa+16>>2]|0)){ha=fa;break}if((mc[c[(c[fa>>2]|0)+36>>2]&127](fa)|0)!=-1){ha=fa;break}c[h>>2]=0;ha=0}}while(0);h=(ha|0)==0;fa=c[f>>2]|0;do{if((fa|0)==0){K=94}else{if((c[fa+12>>2]|0)!=(c[fa+16>>2]|0)){if(!h){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}if((mc[c[(c[fa>>2]|0)+36>>2]&127](fa)|0)==-1){c[f>>2]=0;K=94;break}if(!(h^(fa|0)==0)){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}}while(0);do{if((K|0)==94){if(h){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}function dl(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+160|0;r=c[h+4>>2]&74;if((r|0)==0){s=0}else if((r|0)==64){s=8}else if((r|0)==8){s=16}else{s=10}r=l|0;Rf(n,h,r,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){t=h+1|0;u=t;v=t;w=o+8|0}else{t=o+8|0;u=c[t>>2]|0;v=h+1|0;w=t}t=q|0;h=f|0;f=g|0;g=o|0;x=o+4|0;y=l+24|0;z=l+25|0;A=n;B=q;q=l+26|0;C=l;l=n+4|0;D=u;E=0;F=t;G=u;u=c[h>>2]|0;L11:while(1){do{if((u|0)==0){H=0}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){H=u;break}if((mc[c[(c[u>>2]|0)+36>>2]&127](u)|0)!=-1){H=u;break}c[h>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[f>>2]|0;do{if((J|0)==0){K=21}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{K=23;break L11}}if((mc[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[f>>2]=0;K=21;break}else{if(I^(J|0)==0){break}else{K=23;break L11}}}}while(0);if((K|0)==21){K=0;if(I){K=23;break}}J=d[p]|0;L=(J&1|0)==0;if((G-D|0)==((L?J>>>1:c[x>>2]|0)|0)){if(L){M=J>>>1;N=J>>>1}else{J=c[x>>2]|0;M=J;N=J}Kd(o,M<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}Kd(o,O,0);if((a[p]&1)==0){P=v}else{P=c[w>>2]|0}Q=P;R=P+N|0}else{Q=D;R=G}J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){S=(mc[c[(c[H>>2]|0)+36>>2]&127](H)|0)&255}else{S=a[J]|0}J=a[m]|0;L=(R|0)==(Q|0);do{if(L){T=(a[y]|0)==S<<24>>24;if(!(T|(a[z]|0)==S<<24>>24)){K=45;break}a[R]=T?43:45;U=0;V=F;W=R+1|0}else{K=45}}while(0);L54:do{if((K|0)==45){K=0;I=a[A]|0;T=I&255;if((((T&1|0)==0?T>>>1:c[l>>2]|0)|0)!=0&S<<24>>24==J<<24>>24){if((F-B|0)>=160){U=E;V=F;W=R;break}c[F>>2]=E;U=0;V=F+4|0;W=R;break}else{X=r}while(1){T=X+1|0;if((a[X]|0)==S<<24>>24){Y=X;break}if((T|0)==(q|0)){Y=q;break}else{X=T}}T=Y-C|0;if((T|0)>23){Z=Q;_=R;$=I;break L11}do{if((s|0)==8|(s|0)==10){if((T|0)>=(s|0)){Z=Q;_=R;$=I;break L11}}else if((s|0)==16){if((T|0)<22){break}if(L){Z=R;_=R;$=I;break L11}if((R-Q|0)>=3){Z=Q;_=R;$=I;break L11}if((a[R-1|0]|0)!=48){Z=Q;_=R;$=I;break L11}a[R]=a[9632+T|0]|0;U=0;V=F;W=R+1|0;break L54}}while(0);a[R]=a[9632+T|0]|0;U=E+1|0;V=F;W=R+1|0}}while(0);L=c[h>>2]|0;J=L+12|0;I=c[J>>2]|0;if((I|0)==(c[L+16>>2]|0)){mc[c[(c[L>>2]|0)+40>>2]&127](L)|0;D=Q;E=U;F=V;G=W;u=L;continue}else{c[J>>2]=I+1;D=Q;E=U;F=V;G=W;u=L;continue}}if((K|0)==23){Z=D;_=G;$=a[A]|0}G=$&255;do{if((((G&1|0)==0?G>>>1:c[l>>2]|0)|0)==0){aa=F}else{if((F-B|0)>=160){aa=F;break}c[F>>2]=E;aa=F+4|0}}while(0);c[k>>2]=Tl(Z,_,j,s)|0;s=n;_=a[A]|0;Z=_&255;L84:do{if((((Z&1|0)==0?Z>>>1:c[l>>2]|0)|0)!=0){do{if((t|0)==(aa|0)){ba=_}else{k=aa-4|0;if(k>>>0>t>>>0){ca=t;da=k}else{ba=_;break}do{k=c[ca>>2]|0;c[ca>>2]=c[da>>2];c[da>>2]=k;ca=ca+4|0;da=da-4|0;}while(ca>>>0<da>>>0);ba=a[A]|0}}while(0);if((ba&1)==0){ea=s+1|0}else{ea=c[n+8>>2]|0}T=ba&255;k=aa-4|0;F=a[ea]|0;E=F<<24>>24;B=F<<24>>24<1|F<<24>>24==127;L96:do{if(k>>>0>t>>>0){F=ea+((T&1|0)==0?T>>>1:c[l>>2]|0)|0;G=ea;$=t;D=E;u=B;while(1){if(!u){if((D|0)!=(c[$>>2]|0)){break}}W=(F-G|0)>1?G+1|0:G;V=$+4|0;U=a[W]|0;Q=U<<24>>24;R=U<<24>>24<1|U<<24>>24==127;if(V>>>0<k>>>0){G=W;$=V;D=Q;u=R}else{fa=Q;ga=R;break L96}}c[j>>2]=4;break L84}else{fa=E;ga=B}}while(0);if(ga){break}if(((c[k>>2]|0)-1|0)>>>0<fa>>>0){break}c[j>>2]=4}}while(0);fa=c[h>>2]|0;do{if((fa|0)==0){ha=0}else{if((c[fa+12>>2]|0)!=(c[fa+16>>2]|0)){ha=fa;break}if((mc[c[(c[fa>>2]|0)+36>>2]&127](fa)|0)!=-1){ha=fa;break}c[h>>2]=0;ha=0}}while(0);h=(ha|0)==0;fa=c[f>>2]|0;do{if((fa|0)==0){K=94}else{if((c[fa+12>>2]|0)!=(c[fa+16>>2]|0)){if(!h){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}if((mc[c[(c[fa>>2]|0)+36>>2]&127](fa)|0)==-1){c[f>>2]=0;K=94;break}if(!(h^(fa|0)==0)){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}}while(0);do{if((K|0)==94){if(h){break}ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ia=b|0;c[ia>>2]=ha;Hd(o);Hd(n);i=e;return}function el(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+160|0;r=c[h+4>>2]&74;if((r|0)==64){s=8}else if((r|0)==0){s=0}else if((r|0)==8){s=16}else{s=10}r=l|0;Rf(n,h,r,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){t=h+1|0;u=t;v=t;w=o+8|0}else{t=o+8|0;u=c[t>>2]|0;v=h+1|0;w=t}t=q|0;h=f|0;f=g|0;g=o|0;x=o+4|0;y=l+24|0;z=l+25|0;A=n;B=q;q=l+26|0;C=l;l=n+4|0;D=u;E=0;F=t;G=u;u=c[h>>2]|0;L11:while(1){do{if((u|0)==0){H=0}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){H=u;break}if((mc[c[(c[u>>2]|0)+36>>2]&127](u)|0)!=-1){H=u;break}c[h>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[f>>2]|0;do{if((J|0)==0){L=21}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{L=23;break L11}}if((mc[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[f>>2]=0;L=21;break}else{if(I^(J|0)==0){break}else{L=23;break L11}}}}while(0);if((L|0)==21){L=0;if(I){L=23;break}}J=d[p]|0;M=(J&1|0)==0;if((G-D|0)==((M?J>>>1:c[x>>2]|0)|0)){if(M){N=J>>>1;O=J>>>1}else{J=c[x>>2]|0;N=J;O=J}Kd(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}Kd(o,P,0);if((a[p]&1)==0){Q=v}else{Q=c[w>>2]|0}R=Q;S=Q+O|0}else{R=D;S=G}J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){T=(mc[c[(c[H>>2]|0)+36>>2]&127](H)|0)&255}else{T=a[J]|0}J=a[m]|0;M=(S|0)==(R|0);do{if(M){U=(a[y]|0)==T<<24>>24;if(!(U|(a[z]|0)==T<<24>>24)){L=45;break}a[S]=U?43:45;V=0;W=F;X=S+1|0}else{L=45}}while(0);L54:do{if((L|0)==45){L=0;I=a[A]|0;U=I&255;if((((U&1|0)==0?U>>>1:c[l>>2]|0)|0)!=0&T<<24>>24==J<<24>>24){if((F-B|0)>=160){V=E;W=F;X=S;break}c[F>>2]=E;V=0;W=F+4|0;X=S;break}else{Y=r}while(1){U=Y+1|0;if((a[Y]|0)==T<<24>>24){Z=Y;break}if((U|0)==(q|0)){Z=q;break}else{Y=U}}U=Z-C|0;if((U|0)>23){_=R;$=S;aa=I;break L11}do{if((s|0)==8|(s|0)==10){if((U|0)>=(s|0)){_=R;$=S;aa=I;break L11}}else if((s|0)==16){if((U|0)<22){break}if(M){_=S;$=S;aa=I;break L11}if((S-R|0)>=3){_=R;$=S;aa=I;break L11}if((a[S-1|0]|0)!=48){_=R;$=S;aa=I;break L11}a[S]=a[9632+U|0]|0;V=0;W=F;X=S+1|0;break L54}}while(0);a[S]=a[9632+U|0]|0;V=E+1|0;W=F;X=S+1|0}}while(0);M=c[h>>2]|0;J=M+12|0;I=c[J>>2]|0;if((I|0)==(c[M+16>>2]|0)){mc[c[(c[M>>2]|0)+40>>2]&127](M)|0;D=R;E=V;F=W;G=X;u=M;continue}else{c[J>>2]=I+1;D=R;E=V;F=W;G=X;u=M;continue}}if((L|0)==23){_=D;$=G;aa=a[A]|0}G=aa&255;do{if((((G&1|0)==0?G>>>1:c[l>>2]|0)|0)==0){ba=F}else{if((F-B|0)>=160){ba=F;break}c[F>>2]=E;ba=F+4|0}}while(0);F=Ul(_,$,j,s)|0;c[k>>2]=F;c[k+4>>2]=K;k=n;F=a[A]|0;s=F&255;L84:do{if((((s&1|0)==0?s>>>1:c[l>>2]|0)|0)!=0){do{if((t|0)==(ba|0)){ca=F}else{$=ba-4|0;if($>>>0>t>>>0){da=t;ea=$}else{ca=F;break}do{$=c[da>>2]|0;c[da>>2]=c[ea>>2];c[ea>>2]=$;da=da+4|0;ea=ea-4|0;}while(da>>>0<ea>>>0);ca=a[A]|0}}while(0);if((ca&1)==0){fa=k+1|0}else{fa=c[n+8>>2]|0}U=ca&255;$=ba-4|0;_=a[fa]|0;E=_<<24>>24;B=_<<24>>24<1|_<<24>>24==127;L96:do{if($>>>0>t>>>0){_=fa+((U&1|0)==0?U>>>1:c[l>>2]|0)|0;G=fa;aa=t;D=E;u=B;while(1){if(!u){if((D|0)!=(c[aa>>2]|0)){break}}X=(_-G|0)>1?G+1|0:G;W=aa+4|0;V=a[X]|0;R=V<<24>>24;S=V<<24>>24<1|V<<24>>24==127;if(W>>>0<$>>>0){G=X;aa=W;D=R;u=S}else{ga=R;ha=S;break L96}}c[j>>2]=4;break L84}else{ga=E;ha=B}}while(0);if(ha){break}if(((c[$>>2]|0)-1|0)>>>0<ga>>>0){break}c[j>>2]=4}}while(0);ga=c[h>>2]|0;do{if((ga|0)==0){ia=0}else{if((c[ga+12>>2]|0)!=(c[ga+16>>2]|0)){ia=ga;break}if((mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)!=-1){ia=ga;break}c[h>>2]=0;ia=0}}while(0);h=(ia|0)==0;ga=c[f>>2]|0;do{if((ga|0)==0){L=94}else{if((c[ga+12>>2]|0)!=(c[ga+16>>2]|0)){if(!h){break}ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}if((mc[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)==-1){c[f>>2]=0;L=94;break}if(!(h^(ga|0)==0)){break}ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}}while(0);do{if((L|0)==94){if(h){break}ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ja=b|0;c[ja>>2]=ia;Hd(o);Hd(n);i=e;return}function fl(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;Sf(o,j,x,m,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L6:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((mc[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=17}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){break}else{I=n;break L6}}if((mc[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[f>>2]=0;H=17;break}else{if(F^(G|0)==0){break}else{I=n;break L6}}}}while(0);if((H|0)==17){H=0;if(F){I=n;break}}G=d[q]|0;J=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?G>>>1:c[C>>2]|0)|0)){if(J){K=G>>>1;L=G>>>1}else{G=c[C>>2]|0;K=G;L=G}Kd(p,K<<1,0);if((a[q]&1)==0){M=10}else{M=(c[h>>2]&-2)-1|0}Kd(p,M,0);if((a[q]&1)==0){N=A}else{N=c[B>>2]|0}c[r>>2]=N+L;O=N}else{O=n}G=E+12|0;J=c[G>>2]|0;P=E+16|0;if((J|0)==(c[P>>2]|0)){Q=(mc[c[(c[E>>2]|0)+36>>2]&127](E)|0)&255}else{Q=a[J]|0}if((Tf(Q,v,w,O,r,D,m,o,y,t,u,x)|0)!=0){I=O;break}J=c[G>>2]|0;if((J|0)==(c[P>>2]|0)){mc[c[(c[E>>2]|0)+40>>2]&127](E)|0;n=O;z=E;continue}else{c[G>>2]=J+1;n=O;z=E;continue}}E=o;z=d[E]|0;if((z&1|0)==0){R=z>>>1}else{R=c[o+4>>2]|0}do{if((R|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}O=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=O}}while(0);g[l>>2]=+Vl(I,c[r>>2]|0,k);r=c[t>>2]|0;t=o;I=a[E]|0;l=I&255;if((l&1|0)==0){S=l>>>1}else{S=c[o+4>>2]|0}L65:do{if((S|0)!=0){do{if((y|0)==(r|0)){T=I}else{l=r-4|0;if(l>>>0>y>>>0){U=y;V=l}else{T=I;break}do{l=c[U>>2]|0;c[U>>2]=c[V>>2];c[V>>2]=l;U=U+4|0;V=V-4|0;}while(U>>>0<V>>>0);T=a[E]|0}}while(0);if((T&1)==0){W=t+1|0}else{W=c[o+8>>2]|0}F=T&255;if((F&1|0)==0){X=F>>>1}else{X=c[o+4>>2]|0}F=r-4|0;l=a[W]|0;u=l<<24>>24;s=l<<24>>24<1|l<<24>>24==127;L81:do{if(F>>>0>y>>>0){l=W+X|0;v=W;R=y;O=u;z=s;while(1){if(!z){if((O|0)!=(c[R>>2]|0)){break}}n=(l-v|0)>1?v+1|0:v;x=R+4|0;m=a[n]|0;D=m<<24>>24;w=m<<24>>24<1|m<<24>>24==127;if(x>>>0<F>>>0){v=n;R=x;O=D;z=w}else{Y=D;Z=w;break L81}}c[k>>2]=4;break L65}else{Y=u;Z=s}}while(0);if(Z){break}if(((c[F>>2]|0)-1|0)>>>0<Y>>>0){break}c[k>>2]=4}}while(0);Y=c[j>>2]|0;do{if((Y|0)==0){_=0}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){_=Y;break}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)!=-1){_=Y;break}c[j>>2]=0;_=0}}while(0);j=(_|0)==0;Y=c[f>>2]|0;do{if((Y|0)==0){H=83}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){if(!j){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)==-1){c[f>>2]=0;H=83;break}if(!(j^(Y|0)==0)){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}}while(0);do{if((H|0)==83){if(j){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}function gl(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;Sf(o,j,x,m,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L6:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((mc[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=17}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){break}else{I=n;break L6}}if((mc[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[f>>2]=0;H=17;break}else{if(F^(G|0)==0){break}else{I=n;break L6}}}}while(0);if((H|0)==17){H=0;if(F){I=n;break}}G=d[q]|0;J=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?G>>>1:c[C>>2]|0)|0)){if(J){K=G>>>1;L=G>>>1}else{G=c[C>>2]|0;K=G;L=G}Kd(p,K<<1,0);if((a[q]&1)==0){M=10}else{M=(c[g>>2]&-2)-1|0}Kd(p,M,0);if((a[q]&1)==0){N=A}else{N=c[B>>2]|0}c[r>>2]=N+L;O=N}else{O=n}G=E+12|0;J=c[G>>2]|0;P=E+16|0;if((J|0)==(c[P>>2]|0)){Q=(mc[c[(c[E>>2]|0)+36>>2]&127](E)|0)&255}else{Q=a[J]|0}if((Tf(Q,v,w,O,r,D,m,o,y,t,u,x)|0)!=0){I=O;break}J=c[G>>2]|0;if((J|0)==(c[P>>2]|0)){mc[c[(c[E>>2]|0)+40>>2]&127](E)|0;n=O;z=E;continue}else{c[G>>2]=J+1;n=O;z=E;continue}}E=o;z=d[E]|0;if((z&1|0)==0){R=z>>>1}else{R=c[o+4>>2]|0}do{if((R|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}O=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=O}}while(0);h[l>>3]=+Wl(I,c[r>>2]|0,k);r=c[t>>2]|0;t=o;I=a[E]|0;l=I&255;if((l&1|0)==0){S=l>>>1}else{S=c[o+4>>2]|0}L65:do{if((S|0)!=0){do{if((y|0)==(r|0)){T=I}else{l=r-4|0;if(l>>>0>y>>>0){U=y;V=l}else{T=I;break}do{l=c[U>>2]|0;c[U>>2]=c[V>>2];c[V>>2]=l;U=U+4|0;V=V-4|0;}while(U>>>0<V>>>0);T=a[E]|0}}while(0);if((T&1)==0){W=t+1|0}else{W=c[o+8>>2]|0}F=T&255;if((F&1|0)==0){X=F>>>1}else{X=c[o+4>>2]|0}F=r-4|0;l=a[W]|0;u=l<<24>>24;s=l<<24>>24<1|l<<24>>24==127;L81:do{if(F>>>0>y>>>0){l=W+X|0;v=W;R=y;O=u;z=s;while(1){if(!z){if((O|0)!=(c[R>>2]|0)){break}}n=(l-v|0)>1?v+1|0:v;x=R+4|0;m=a[n]|0;D=m<<24>>24;w=m<<24>>24<1|m<<24>>24==127;if(x>>>0<F>>>0){v=n;R=x;O=D;z=w}else{Y=D;Z=w;break L81}}c[k>>2]=4;break L65}else{Y=u;Z=s}}while(0);if(Z){break}if(((c[F>>2]|0)-1|0)>>>0<Y>>>0){break}c[k>>2]=4}}while(0);Y=c[j>>2]|0;do{if((Y|0)==0){_=0}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){_=Y;break}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)!=-1){_=Y;break}c[j>>2]=0;_=0}}while(0);j=(_|0)==0;Y=c[f>>2]|0;do{if((Y|0)==0){H=83}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){if(!j){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)==-1){c[f>>2]=0;H=83;break}if(!(j^(Y|0)==0)){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}}while(0);do{if((H|0)==83){if(j){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}function hl(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;Sf(o,j,x,m,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L6:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((mc[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=17}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){break}else{I=n;break L6}}if((mc[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[f>>2]=0;H=17;break}else{if(F^(G|0)==0){break}else{I=n;break L6}}}}while(0);if((H|0)==17){H=0;if(F){I=n;break}}G=d[q]|0;J=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?G>>>1:c[C>>2]|0)|0)){if(J){K=G>>>1;L=G>>>1}else{G=c[C>>2]|0;K=G;L=G}Kd(p,K<<1,0);if((a[q]&1)==0){M=10}else{M=(c[g>>2]&-2)-1|0}Kd(p,M,0);if((a[q]&1)==0){N=A}else{N=c[B>>2]|0}c[r>>2]=N+L;O=N}else{O=n}G=E+12|0;J=c[G>>2]|0;P=E+16|0;if((J|0)==(c[P>>2]|0)){Q=(mc[c[(c[E>>2]|0)+36>>2]&127](E)|0)&255}else{Q=a[J]|0}if((Tf(Q,v,w,O,r,D,m,o,y,t,u,x)|0)!=0){I=O;break}J=c[G>>2]|0;if((J|0)==(c[P>>2]|0)){mc[c[(c[E>>2]|0)+40>>2]&127](E)|0;n=O;z=E;continue}else{c[G>>2]=J+1;n=O;z=E;continue}}E=o;z=d[E]|0;if((z&1|0)==0){R=z>>>1}else{R=c[o+4>>2]|0}do{if((R|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}O=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=O}}while(0);h[l>>3]=+Xl(I,c[r>>2]|0,k);r=c[t>>2]|0;t=o;I=a[E]|0;l=I&255;if((l&1|0)==0){S=l>>>1}else{S=c[o+4>>2]|0}L65:do{if((S|0)!=0){do{if((y|0)==(r|0)){T=I}else{l=r-4|0;if(l>>>0>y>>>0){U=y;V=l}else{T=I;break}do{l=c[U>>2]|0;c[U>>2]=c[V>>2];c[V>>2]=l;U=U+4|0;V=V-4|0;}while(U>>>0<V>>>0);T=a[E]|0}}while(0);if((T&1)==0){W=t+1|0}else{W=c[o+8>>2]|0}F=T&255;if((F&1|0)==0){X=F>>>1}else{X=c[o+4>>2]|0}F=r-4|0;l=a[W]|0;u=l<<24>>24;s=l<<24>>24<1|l<<24>>24==127;L81:do{if(F>>>0>y>>>0){l=W+X|0;v=W;R=y;O=u;z=s;while(1){if(!z){if((O|0)!=(c[R>>2]|0)){break}}n=(l-v|0)>1?v+1|0:v;x=R+4|0;m=a[n]|0;D=m<<24>>24;w=m<<24>>24<1|m<<24>>24==127;if(x>>>0<F>>>0){v=n;R=x;O=D;z=w}else{Y=D;Z=w;break L81}}c[k>>2]=4;break L65}else{Y=u;Z=s}}while(0);if(Z){break}if(((c[F>>2]|0)-1|0)>>>0<Y>>>0){break}c[k>>2]=4}}while(0);Y=c[j>>2]|0;do{if((Y|0)==0){_=0}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){_=Y;break}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)!=-1){_=Y;break}c[j>>2]=0;_=0}}while(0);j=(_|0)==0;Y=c[f>>2]|0;do{if((Y|0)==0){H=83}else{if((c[Y+12>>2]|0)!=(c[Y+16>>2]|0)){if(!j){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}if((mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0)==-1){c[f>>2]=0;H=83;break}if(!(j^(Y|0)==0)){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}}while(0);do{if((H|0)==83){if(j){break}$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=_;Hd(p);Hd(o);i=e;return}function il(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=Mb(b|0)|0;b=Xa(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}Mb(h|0)|0;i=f;return b|0}function jl(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=Gm(m)|0;if((o|0)!=0){p=o;q=o;break}Qm();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{m=c[r+12>>2]|0;if((m|0)==(c[r+16>>2]|0)){A=mc[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{A=c[m>>2]|0}if((A|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){B=z;C=0}else{y=c[m+12>>2]|0;if((y|0)==(c[m+16>>2]|0)){D=mc[c[(c[m>>2]|0)+36>>2]&127](m)|0}else{D=c[y>>2]|0}if((D|0)==-1){c[b>>2]=0;E=0}else{E=m}B=c[u>>2]|0;C=E}F=(C|0)==0;if(!((r^F)&(s|0)!=0)){break}r=c[B+12>>2]|0;if((r|0)==(c[B+16>>2]|0)){G=mc[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{G=c[r>>2]|0}if(k){H=G}else{H=uc[c[(c[e>>2]|0)+28>>2]&31](h,G)|0}do{if(n){I=x;J=s}else{r=t+1|0;if(k){m=s;y=x;o=p;w=0;v=f;while(1){do{if((a[o]|0)==1){K=a[v]|0;if((K&1)==0){L=v+4|0}else{L=c[v+8>>2]|0}if((H|0)!=(c[L+(t<<2)>>2]|0)){a[o]=0;M=w;N=y;O=m-1|0;break}P=K&255;if((P&1|0)==0){Q=P>>>1}else{Q=c[v+4>>2]|0}if((Q|0)!=(r|0)){M=1;N=y;O=m;break}a[o]=2;M=1;N=y+1|0;O=m-1|0}else{M=w;N=y;O=m}}while(0);P=v+12|0;if((P|0)==(g|0)){R=O;S=N;T=M;break}else{m=O;y=N;o=o+1|0;w=M;v=P}}}else{v=s;w=x;o=p;y=0;m=f;while(1){do{if((a[o]|0)==1){P=m;if((a[P]&1)==0){U=m+4|0}else{U=c[m+8>>2]|0}if((H|0)!=(uc[c[(c[e>>2]|0)+28>>2]&31](h,c[U+(t<<2)>>2]|0)|0)){a[o]=0;V=y;W=w;X=v-1|0;break}K=d[P]|0;if((K&1|0)==0){Y=K>>>1}else{Y=c[m+4>>2]|0}if((Y|0)!=(r|0)){V=1;W=w;X=v;break}a[o]=2;V=1;W=w+1|0;X=v-1|0}else{V=y;W=w;X=v}}while(0);K=m+12|0;if((K|0)==(g|0)){R=X;S=W;T=V;break}else{v=X;w=W;o=o+1|0;y=V;m=K}}}if(!T){I=S;J=R;break}m=c[u>>2]|0;y=m+12|0;o=c[y>>2]|0;if((o|0)==(c[m+16>>2]|0)){mc[c[(c[m>>2]|0)+40>>2]&127](m)|0}else{c[y>>2]=o+4}if((S+R|0)>>>0<2>>>0|n){I=S;J=R;break}o=t+1|0;y=S;m=p;w=f;while(1){do{if((a[m]|0)==2){v=d[w]|0;if((v&1|0)==0){Z=v>>>1}else{Z=c[w+4>>2]|0}if((Z|0)==(o|0)){_=y;break}a[m]=0;_=y-1|0}else{_=y}}while(0);v=w+12|0;if((v|0)==(g|0)){I=_;J=R;break}else{y=_;m=m+1|0;w=v}}}}while(0);t=t+1|0;x=I;s=J}do{if((B|0)==0){$=1}else{J=c[B+12>>2]|0;if((J|0)==(c[B+16>>2]|0)){aa=mc[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{aa=c[J>>2]|0}if((aa|0)==-1){c[u>>2]=0;$=1;break}else{$=(c[u>>2]|0)==0;break}}}while(0);do{if(F){ba=93}else{u=c[C+12>>2]|0;if((u|0)==(c[C+16>>2]|0)){ca=mc[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{ca=c[u>>2]|0}if((ca|0)==-1){c[b>>2]=0;ba=93;break}else{if($^(C|0)==0){break}else{ba=95;break}}}}while(0);if((ba|0)==93){if($){ba=95}}if((ba|0)==95){c[j>>2]=c[j>>2]|2}L128:do{if(n){ba=99}else{$=f;C=p;while(1){if((a[C]|0)==2){da=$;break L128}b=$+12|0;if((b|0)==(g|0)){ba=99;break}else{$=b;C=C+1|0}}}}while(0);if((ba|0)==99){c[j>>2]=c[j>>2]|4;da=g}if((q|0)==0){i=l;return da|0}Hm(q);i=l;return da|0}function kl(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==0){v=0}else if((u|0)==8){v=16}else{v=10}u=l|0;Uf(n,h,u,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L11:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=mc[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;E=c[f>>2]|0;do{if((E|0)==0){F=22}else{G=c[E+12>>2]|0;if((G|0)==(c[E+16>>2]|0)){H=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=22;break}else{if(C^(E|0)==0){break}else{I=m;break L11}}}}while(0);if((F|0)==22){F=0;if(C){I=m;break}}E=d[p]|0;G=(E&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?E>>>1:c[z>>2]|0)|0)){if(G){J=E>>>1;K=E>>>1}else{E=c[z>>2]|0;J=E;K=E}Kd(o,J<<1,0);if((a[p]&1)==0){L=10}else{L=(c[g>>2]&-2)-1|0}Kd(o,L,0);if((a[p]&1)==0){M=x}else{M=c[y>>2]|0}c[q>>2]=M+K;N=M}else{N=m}E=B+12|0;G=c[E>>2]|0;O=B+16|0;if((G|0)==(c[O>>2]|0)){P=mc[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{P=c[G>>2]|0}if((Qf(P,v,N,q,t,A,n,l,s,u)|0)!=0){I=N;break}G=c[E>>2]|0;if((G|0)==(c[O>>2]|0)){mc[c[(c[B>>2]|0)+40>>2]&127](B)|0;m=N;w=B;continue}else{c[E>>2]=G+4;m=N;w=B;continue}}B=n;w=d[B]|0;if((w&1|0)==0){Q=w>>>1}else{Q=c[n+4>>2]|0}do{if((Q|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}N=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=N}}while(0);c[k>>2]=Pl(I,c[q>>2]|0,j,v)|0;v=c[s>>2]|0;s=n;q=a[B]|0;I=q&255;if((I&1|0)==0){R=I>>>1}else{R=c[n+4>>2]|0}L70:do{if((R|0)!=0){do{if((l|0)==(v|0)){S=q}else{I=v-4|0;if(I>>>0>l>>>0){T=l;U=I}else{S=q;break}do{I=c[T>>2]|0;c[T>>2]=c[U>>2];c[U>>2]=I;T=T+4|0;U=U-4|0;}while(T>>>0<U>>>0);S=a[B]|0}}while(0);if((S&1)==0){V=s+1|0}else{V=c[n+8>>2]|0}C=S&255;if((C&1|0)==0){W=C>>>1}else{W=c[n+4>>2]|0}C=v-4|0;I=a[V]|0;k=I<<24>>24;t=I<<24>>24<1|I<<24>>24==127;L86:do{if(C>>>0>l>>>0){I=V+W|0;r=V;Q=l;N=k;w=t;while(1){if(!w){if((N|0)!=(c[Q>>2]|0)){break}}m=(I-r|0)>1?r+1|0:r;u=Q+4|0;A=a[m]|0;P=A<<24>>24;M=A<<24>>24<1|A<<24>>24==127;if(u>>>0<C>>>0){r=m;Q=u;N=P;w=M}else{X=P;Y=M;break L86}}c[j>>2]=4;break L70}else{X=k;Y=t}}while(0);if(Y){break}if(((c[C>>2]|0)-1|0)>>>0<X>>>0){break}c[j>>2]=4}}while(0);X=c[h>>2]|0;do{if((X|0)==0){Z=0}else{Y=c[X+12>>2]|0;if((Y|0)==(c[X+16>>2]|0)){_=mc[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{_=c[Y>>2]|0}if((_|0)!=-1){Z=X;break}c[h>>2]=0;Z=0}}while(0);h=(Z|0)==0;X=c[f>>2]|0;do{if((X|0)==0){F=87}else{_=c[X+12>>2]|0;if((_|0)==(c[X+16>>2]|0)){$=mc[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{$=c[_>>2]|0}if(($|0)==-1){c[f>>2]=0;F=87;break}if(!(h^(X|0)==0)){break}aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}}while(0);do{if((F|0)==87){if(h){break}aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}function ll(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;Uf(n,h,u,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L11:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=mc[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;E=c[f>>2]|0;do{if((E|0)==0){F=22}else{G=c[E+12>>2]|0;if((G|0)==(c[E+16>>2]|0)){H=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=22;break}else{if(C^(E|0)==0){break}else{I=m;break L11}}}}while(0);if((F|0)==22){F=0;if(C){I=m;break}}E=d[p]|0;G=(E&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?E>>>1:c[z>>2]|0)|0)){if(G){J=E>>>1;L=E>>>1}else{E=c[z>>2]|0;J=E;L=E}Kd(o,J<<1,0);if((a[p]&1)==0){M=10}else{M=(c[g>>2]&-2)-1|0}Kd(o,M,0);if((a[p]&1)==0){N=x}else{N=c[y>>2]|0}c[q>>2]=N+L;O=N}else{O=m}E=B+12|0;G=c[E>>2]|0;P=B+16|0;if((G|0)==(c[P>>2]|0)){Q=mc[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{Q=c[G>>2]|0}if((Qf(Q,v,O,q,t,A,n,l,s,u)|0)!=0){I=O;break}G=c[E>>2]|0;if((G|0)==(c[P>>2]|0)){mc[c[(c[B>>2]|0)+40>>2]&127](B)|0;m=O;w=B;continue}else{c[E>>2]=G+4;m=O;w=B;continue}}B=n;w=d[B]|0;if((w&1|0)==0){R=w>>>1}else{R=c[n+4>>2]|0}do{if((R|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}O=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=O}}while(0);t=Ql(I,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;k=c[s>>2]|0;s=n;t=a[B]|0;v=t&255;if((v&1|0)==0){S=v>>>1}else{S=c[n+4>>2]|0}L70:do{if((S|0)!=0){do{if((l|0)==(k|0)){T=t}else{v=k-4|0;if(v>>>0>l>>>0){U=l;V=v}else{T=t;break}do{v=c[U>>2]|0;c[U>>2]=c[V>>2];c[V>>2]=v;U=U+4|0;V=V-4|0;}while(U>>>0<V>>>0);T=a[B]|0}}while(0);if((T&1)==0){W=s+1|0}else{W=c[n+8>>2]|0}C=T&255;if((C&1|0)==0){X=C>>>1}else{X=c[n+4>>2]|0}C=k-4|0;v=a[W]|0;q=v<<24>>24;I=v<<24>>24<1|v<<24>>24==127;L86:do{if(C>>>0>l>>>0){v=W+X|0;r=W;R=l;O=q;w=I;while(1){if(!w){if((O|0)!=(c[R>>2]|0)){break}}m=(v-r|0)>1?r+1|0:r;u=R+4|0;A=a[m]|0;Q=A<<24>>24;N=A<<24>>24<1|A<<24>>24==127;if(u>>>0<C>>>0){r=m;R=u;O=Q;w=N}else{Y=Q;Z=N;break L86}}c[j>>2]=4;break L70}else{Y=q;Z=I}}while(0);if(Z){break}if(((c[C>>2]|0)-1|0)>>>0<Y>>>0){break}c[j>>2]=4}}while(0);Y=c[h>>2]|0;do{if((Y|0)==0){_=0}else{Z=c[Y+12>>2]|0;if((Z|0)==(c[Y+16>>2]|0)){$=mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{$=c[Z>>2]|0}if(($|0)!=-1){_=Y;break}c[h>>2]=0;_=0}}while(0);h=(_|0)==0;Y=c[f>>2]|0;do{if((Y|0)==0){F=87}else{$=c[Y+12>>2]|0;if(($|0)==(c[Y+16>>2]|0)){aa=mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{aa=c[$>>2]|0}if((aa|0)==-1){c[f>>2]=0;F=87;break}if(!(h^(Y|0)==0)){break}ba=b|0;c[ba>>2]=_;Hd(o);Hd(n);i=e;return}}while(0);do{if((F|0)==87){if(h){break}ba=b|0;c[ba>>2]=_;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ba=b|0;c[ba>>2]=_;Hd(o);Hd(n);i=e;return}function ml(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;f=i;i=i+144|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+104|0;o=f+112|0;p=f+128|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==0){w=0}else if((v|0)==8){w=16}else{w=10}v=m|0;Uf(o,j,v,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=c[n>>2]|0;n=x;x=c[j>>2]|0;L11:while(1){do{if((x|0)==0){C=0}else{D=c[x+12>>2]|0;if((D|0)==(c[x+16>>2]|0)){E=mc[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{E=c[D>>2]|0}if((E|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);D=(C|0)==0;F=c[g>>2]|0;do{if((F|0)==0){G=22}else{H=c[F+12>>2]|0;if((H|0)==(c[F+16>>2]|0)){I=mc[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{I=c[H>>2]|0}if((I|0)==-1){c[g>>2]=0;G=22;break}else{if(D^(F|0)==0){break}else{J=n;break L11}}}}while(0);if((G|0)==22){G=0;if(D){J=n;break}}F=d[q]|0;H=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((H?F>>>1:c[A>>2]|0)|0)){if(H){K=F>>>1;L=F>>>1}else{F=c[A>>2]|0;K=F;L=F}Kd(p,K<<1,0);if((a[q]&1)==0){M=10}else{M=(c[h>>2]&-2)-1|0}Kd(p,M,0);if((a[q]&1)==0){N=y}else{N=c[z>>2]|0}c[r>>2]=N+L;O=N}else{O=n}F=C+12|0;H=c[F>>2]|0;P=C+16|0;if((H|0)==(c[P>>2]|0)){Q=mc[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{Q=c[H>>2]|0}if((Qf(Q,w,O,r,u,B,o,m,t,v)|0)!=0){J=O;break}H=c[F>>2]|0;if((H|0)==(c[P>>2]|0)){mc[c[(c[C>>2]|0)+40>>2]&127](C)|0;n=O;x=C;continue}else{c[F>>2]=H+4;n=O;x=C;continue}}C=o;x=d[C]|0;if((x&1|0)==0){R=x>>>1}else{R=c[o+4>>2]|0}do{if((R|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}O=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=O}}while(0);b[l>>1]=Rl(J,c[r>>2]|0,k,w)|0;w=c[t>>2]|0;t=o;r=a[C]|0;J=r&255;if((J&1|0)==0){S=J>>>1}else{S=c[o+4>>2]|0}L70:do{if((S|0)!=0){do{if((m|0)==(w|0)){T=r}else{J=w-4|0;if(J>>>0>m>>>0){U=m;V=J}else{T=r;break}do{J=c[U>>2]|0;c[U>>2]=c[V>>2];c[V>>2]=J;U=U+4|0;V=V-4|0;}while(U>>>0<V>>>0);T=a[C]|0}}while(0);if((T&1)==0){W=t+1|0}else{W=c[o+8>>2]|0}D=T&255;if((D&1|0)==0){X=D>>>1}else{X=c[o+4>>2]|0}D=w-4|0;J=a[W]|0;l=J<<24>>24;u=J<<24>>24<1|J<<24>>24==127;L86:do{if(D>>>0>m>>>0){J=W+X|0;s=W;R=m;O=l;x=u;while(1){if(!x){if((O|0)!=(c[R>>2]|0)){break}}n=(J-s|0)>1?s+1|0:s;v=R+4|0;B=a[n]|0;Q=B<<24>>24;N=B<<24>>24<1|B<<24>>24==127;if(v>>>0<D>>>0){s=n;R=v;O=Q;x=N}else{Y=Q;Z=N;break L86}}c[k>>2]=4;break L70}else{Y=l;Z=u}}while(0);if(Z){break}if(((c[D>>2]|0)-1|0)>>>0<Y>>>0){break}c[k>>2]=4}}while(0);Y=c[j>>2]|0;do{if((Y|0)==0){_=0}else{Z=c[Y+12>>2]|0;if((Z|0)==(c[Y+16>>2]|0)){$=mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{$=c[Z>>2]|0}if(($|0)!=-1){_=Y;break}c[j>>2]=0;_=0}}while(0);j=(_|0)==0;Y=c[g>>2]|0;do{if((Y|0)==0){G=87}else{$=c[Y+12>>2]|0;if(($|0)==(c[Y+16>>2]|0)){aa=mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{aa=c[$>>2]|0}if((aa|0)==-1){c[g>>2]=0;G=87;break}if(!(j^(Y|0)==0)){break}ba=e|0;c[ba>>2]=_;Hd(p);Hd(o);i=f;return}}while(0);do{if((G|0)==87){if(j){break}ba=e|0;c[ba>>2]=_;Hd(p);Hd(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;ba=e|0;c[ba>>2]=_;Hd(p);Hd(o);i=f;return}function nl(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;Uf(n,h,u,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L11:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=mc[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;E=c[f>>2]|0;do{if((E|0)==0){F=22}else{G=c[E+12>>2]|0;if((G|0)==(c[E+16>>2]|0)){H=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=22;break}else{if(C^(E|0)==0){break}else{I=m;break L11}}}}while(0);if((F|0)==22){F=0;if(C){I=m;break}}E=d[p]|0;G=(E&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?E>>>1:c[z>>2]|0)|0)){if(G){J=E>>>1;K=E>>>1}else{E=c[z>>2]|0;J=E;K=E}Kd(o,J<<1,0);if((a[p]&1)==0){L=10}else{L=(c[g>>2]&-2)-1|0}Kd(o,L,0);if((a[p]&1)==0){M=x}else{M=c[y>>2]|0}c[q>>2]=M+K;N=M}else{N=m}E=B+12|0;G=c[E>>2]|0;O=B+16|0;if((G|0)==(c[O>>2]|0)){P=mc[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{P=c[G>>2]|0}if((Qf(P,v,N,q,t,A,n,l,s,u)|0)!=0){I=N;break}G=c[E>>2]|0;if((G|0)==(c[O>>2]|0)){mc[c[(c[B>>2]|0)+40>>2]&127](B)|0;m=N;w=B;continue}else{c[E>>2]=G+4;m=N;w=B;continue}}B=n;w=d[B]|0;if((w&1|0)==0){Q=w>>>1}else{Q=c[n+4>>2]|0}do{if((Q|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}N=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=N}}while(0);c[k>>2]=Sl(I,c[q>>2]|0,j,v)|0;v=c[s>>2]|0;s=n;q=a[B]|0;I=q&255;if((I&1|0)==0){R=I>>>1}else{R=c[n+4>>2]|0}L70:do{if((R|0)!=0){do{if((l|0)==(v|0)){S=q}else{I=v-4|0;if(I>>>0>l>>>0){T=l;U=I}else{S=q;break}do{I=c[T>>2]|0;c[T>>2]=c[U>>2];c[U>>2]=I;T=T+4|0;U=U-4|0;}while(T>>>0<U>>>0);S=a[B]|0}}while(0);if((S&1)==0){V=s+1|0}else{V=c[n+8>>2]|0}C=S&255;if((C&1|0)==0){W=C>>>1}else{W=c[n+4>>2]|0}C=v-4|0;I=a[V]|0;k=I<<24>>24;t=I<<24>>24<1|I<<24>>24==127;L86:do{if(C>>>0>l>>>0){I=V+W|0;r=V;Q=l;N=k;w=t;while(1){if(!w){if((N|0)!=(c[Q>>2]|0)){break}}m=(I-r|0)>1?r+1|0:r;u=Q+4|0;A=a[m]|0;P=A<<24>>24;M=A<<24>>24<1|A<<24>>24==127;if(u>>>0<C>>>0){r=m;Q=u;N=P;w=M}else{X=P;Y=M;break L86}}c[j>>2]=4;break L70}else{X=k;Y=t}}while(0);if(Y){break}if(((c[C>>2]|0)-1|0)>>>0<X>>>0){break}c[j>>2]=4}}while(0);X=c[h>>2]|0;do{if((X|0)==0){Z=0}else{Y=c[X+12>>2]|0;if((Y|0)==(c[X+16>>2]|0)){_=mc[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{_=c[Y>>2]|0}if((_|0)!=-1){Z=X;break}c[h>>2]=0;Z=0}}while(0);h=(Z|0)==0;X=c[f>>2]|0;do{if((X|0)==0){F=87}else{_=c[X+12>>2]|0;if((_|0)==(c[X+16>>2]|0)){$=mc[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{$=c[_>>2]|0}if(($|0)==-1){c[f>>2]=0;F=87;break}if(!(h^(X|0)==0)){break}aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}}while(0);do{if((F|0)==87){if(h){break}aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}function ol(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==0){v=0}else if((u|0)==8){v=16}else{v=10}u=l|0;Uf(n,h,u,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L11:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=mc[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;E=c[f>>2]|0;do{if((E|0)==0){F=22}else{G=c[E+12>>2]|0;if((G|0)==(c[E+16>>2]|0)){H=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=22;break}else{if(C^(E|0)==0){break}else{I=m;break L11}}}}while(0);if((F|0)==22){F=0;if(C){I=m;break}}E=d[p]|0;G=(E&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?E>>>1:c[z>>2]|0)|0)){if(G){J=E>>>1;K=E>>>1}else{E=c[z>>2]|0;J=E;K=E}Kd(o,J<<1,0);if((a[p]&1)==0){L=10}else{L=(c[g>>2]&-2)-1|0}Kd(o,L,0);if((a[p]&1)==0){M=x}else{M=c[y>>2]|0}c[q>>2]=M+K;N=M}else{N=m}E=B+12|0;G=c[E>>2]|0;O=B+16|0;if((G|0)==(c[O>>2]|0)){P=mc[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{P=c[G>>2]|0}if((Qf(P,v,N,q,t,A,n,l,s,u)|0)!=0){I=N;break}G=c[E>>2]|0;if((G|0)==(c[O>>2]|0)){mc[c[(c[B>>2]|0)+40>>2]&127](B)|0;m=N;w=B;continue}else{c[E>>2]=G+4;m=N;w=B;continue}}B=n;w=d[B]|0;if((w&1|0)==0){Q=w>>>1}else{Q=c[n+4>>2]|0}do{if((Q|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}N=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=N}}while(0);c[k>>2]=Tl(I,c[q>>2]|0,j,v)|0;v=c[s>>2]|0;s=n;q=a[B]|0;I=q&255;if((I&1|0)==0){R=I>>>1}else{R=c[n+4>>2]|0}L70:do{if((R|0)!=0){do{if((l|0)==(v|0)){S=q}else{I=v-4|0;if(I>>>0>l>>>0){T=l;U=I}else{S=q;break}do{I=c[T>>2]|0;c[T>>2]=c[U>>2];c[U>>2]=I;T=T+4|0;U=U-4|0;}while(T>>>0<U>>>0);S=a[B]|0}}while(0);if((S&1)==0){V=s+1|0}else{V=c[n+8>>2]|0}C=S&255;if((C&1|0)==0){W=C>>>1}else{W=c[n+4>>2]|0}C=v-4|0;I=a[V]|0;k=I<<24>>24;t=I<<24>>24<1|I<<24>>24==127;L86:do{if(C>>>0>l>>>0){I=V+W|0;r=V;Q=l;N=k;w=t;while(1){if(!w){if((N|0)!=(c[Q>>2]|0)){break}}m=(I-r|0)>1?r+1|0:r;u=Q+4|0;A=a[m]|0;P=A<<24>>24;M=A<<24>>24<1|A<<24>>24==127;if(u>>>0<C>>>0){r=m;Q=u;N=P;w=M}else{X=P;Y=M;break L86}}c[j>>2]=4;break L70}else{X=k;Y=t}}while(0);if(Y){break}if(((c[C>>2]|0)-1|0)>>>0<X>>>0){break}c[j>>2]=4}}while(0);X=c[h>>2]|0;do{if((X|0)==0){Z=0}else{Y=c[X+12>>2]|0;if((Y|0)==(c[X+16>>2]|0)){_=mc[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{_=c[Y>>2]|0}if((_|0)!=-1){Z=X;break}c[h>>2]=0;Z=0}}while(0);h=(Z|0)==0;X=c[f>>2]|0;do{if((X|0)==0){F=87}else{_=c[X+12>>2]|0;if((_|0)==(c[X+16>>2]|0)){$=mc[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{$=c[_>>2]|0}if(($|0)==-1){c[f>>2]=0;F=87;break}if(!(h^(X|0)==0)){break}aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}}while(0);do{if((F|0)==87){if(h){break}aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;aa=b|0;c[aa>>2]=Z;Hd(o);Hd(n);i=e;return}function pl(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;Uf(n,h,u,m);bn(p|0,0,12)|0;h=o;Kd(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L11:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=mc[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;E=c[f>>2]|0;do{if((E|0)==0){F=22}else{G=c[E+12>>2]|0;if((G|0)==(c[E+16>>2]|0)){H=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=22;break}else{if(C^(E|0)==0){break}else{I=m;break L11}}}}while(0);if((F|0)==22){F=0;if(C){I=m;break}}E=d[p]|0;G=(E&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?E>>>1:c[z>>2]|0)|0)){if(G){J=E>>>1;L=E>>>1}else{E=c[z>>2]|0;J=E;L=E}Kd(o,J<<1,0);if((a[p]&1)==0){M=10}else{M=(c[g>>2]&-2)-1|0}Kd(o,M,0);if((a[p]&1)==0){N=x}else{N=c[y>>2]|0}c[q>>2]=N+L;O=N}else{O=m}E=B+12|0;G=c[E>>2]|0;P=B+16|0;if((G|0)==(c[P>>2]|0)){Q=mc[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{Q=c[G>>2]|0}if((Qf(Q,v,O,q,t,A,n,l,s,u)|0)!=0){I=O;break}G=c[E>>2]|0;if((G|0)==(c[P>>2]|0)){mc[c[(c[B>>2]|0)+40>>2]&127](B)|0;m=O;w=B;continue}else{c[E>>2]=G+4;m=O;w=B;continue}}B=n;w=d[B]|0;if((w&1|0)==0){R=w>>>1}else{R=c[n+4>>2]|0}do{if((R|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}O=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=O}}while(0);t=Ul(I,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;k=c[s>>2]|0;s=n;t=a[B]|0;v=t&255;if((v&1|0)==0){S=v>>>1}else{S=c[n+4>>2]|0}L70:do{if((S|0)!=0){do{if((l|0)==(k|0)){T=t}else{v=k-4|0;if(v>>>0>l>>>0){U=l;V=v}else{T=t;break}do{v=c[U>>2]|0;c[U>>2]=c[V>>2];c[V>>2]=v;U=U+4|0;V=V-4|0;}while(U>>>0<V>>>0);T=a[B]|0}}while(0);if((T&1)==0){W=s+1|0}else{W=c[n+8>>2]|0}C=T&255;if((C&1|0)==0){X=C>>>1}else{X=c[n+4>>2]|0}C=k-4|0;v=a[W]|0;q=v<<24>>24;I=v<<24>>24<1|v<<24>>24==127;L86:do{if(C>>>0>l>>>0){v=W+X|0;r=W;R=l;O=q;w=I;while(1){if(!w){if((O|0)!=(c[R>>2]|0)){break}}m=(v-r|0)>1?r+1|0:r;u=R+4|0;A=a[m]|0;Q=A<<24>>24;N=A<<24>>24<1|A<<24>>24==127;if(u>>>0<C>>>0){r=m;R=u;O=Q;w=N}else{Y=Q;Z=N;break L86}}c[j>>2]=4;break L70}else{Y=q;Z=I}}while(0);if(Z){break}if(((c[C>>2]|0)-1|0)>>>0<Y>>>0){break}c[j>>2]=4}}while(0);Y=c[h>>2]|0;do{if((Y|0)==0){_=0}else{Z=c[Y+12>>2]|0;if((Z|0)==(c[Y+16>>2]|0)){$=mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{$=c[Z>>2]|0}if(($|0)!=-1){_=Y;break}c[h>>2]=0;_=0}}while(0);h=(_|0)==0;Y=c[f>>2]|0;do{if((Y|0)==0){F=87}else{$=c[Y+12>>2]|0;if(($|0)==(c[Y+16>>2]|0)){aa=mc[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{aa=c[$>>2]|0}if((aa|0)==-1){c[f>>2]=0;F=87;break}if(!(h^(Y|0)==0)){break}ba=b|0;c[ba>>2]=_;Hd(o);Hd(n);i=e;return}}while(0);do{if((F|0)==87){if(h){break}ba=b|0;c[ba>>2]=_;Hd(o);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ba=b|0;c[ba>>2]=_;Hd(o);Hd(n);i=e;return}function ql(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;Vf(o,j,x,m,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L6:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=mc[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;H=c[f>>2]|0;do{if((H|0)==0){I=18}else{J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){K=mc[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=18;break}else{if(F^(H|0)==0){break}else{L=n;break L6}}}}while(0);if((I|0)==18){I=0;if(F){L=n;break}}H=d[q]|0;J=(H&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?H>>>1:c[C>>2]|0)|0)){if(J){M=H>>>1;N=H>>>1}else{H=c[C>>2]|0;M=H;N=H}Kd(p,M<<1,0);if((a[q]&1)==0){O=10}else{O=(c[h>>2]&-2)-1|0}Kd(p,O,0);if((a[q]&1)==0){P=A}else{P=c[B>>2]|0}c[r>>2]=P+N;Q=P}else{Q=n}H=E+12|0;J=c[H>>2]|0;R=E+16|0;if((J|0)==(c[R>>2]|0)){S=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{S=c[J>>2]|0}if((Wf(S,v,w,Q,r,D,m,o,y,t,u,x)|0)!=0){L=Q;break}J=c[H>>2]|0;if((J|0)==(c[R>>2]|0)){mc[c[(c[E>>2]|0)+40>>2]&127](E)|0;n=Q;z=E;continue}else{c[H>>2]=J+4;n=Q;z=E;continue}}E=o;z=d[E]|0;if((z&1|0)==0){T=z>>>1}else{T=c[o+4>>2]|0}do{if((T|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}Q=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=Q}}while(0);g[l>>2]=+Vl(L,c[r>>2]|0,k);r=c[t>>2]|0;t=o;L=a[E]|0;l=L&255;if((l&1|0)==0){U=l>>>1}else{U=c[o+4>>2]|0}L66:do{if((U|0)!=0){do{if((y|0)==(r|0)){V=L}else{l=r-4|0;if(l>>>0>y>>>0){W=y;X=l}else{V=L;break}do{l=c[W>>2]|0;c[W>>2]=c[X>>2];c[X>>2]=l;W=W+4|0;X=X-4|0;}while(W>>>0<X>>>0);V=a[E]|0}}while(0);if((V&1)==0){Y=t+1|0}else{Y=c[o+8>>2]|0}F=V&255;if((F&1|0)==0){Z=F>>>1}else{Z=c[o+4>>2]|0}F=r-4|0;l=a[Y]|0;u=l<<24>>24;s=l<<24>>24<1|l<<24>>24==127;L82:do{if(F>>>0>y>>>0){l=Y+Z|0;v=Y;T=y;Q=u;z=s;while(1){if(!z){if((Q|0)!=(c[T>>2]|0)){break}}n=(l-v|0)>1?v+1|0:v;x=T+4|0;m=a[n]|0;D=m<<24>>24;w=m<<24>>24<1|m<<24>>24==127;if(x>>>0<F>>>0){v=n;T=x;Q=D;z=w}else{_=D;$=w;break L82}}c[k>>2]=4;break L66}else{_=u;$=s}}while(0);if($){break}if(((c[F>>2]|0)-1|0)>>>0<_>>>0){break}c[k>>2]=4}}while(0);_=c[j>>2]|0;do{if((_|0)==0){aa=0}else{$=c[_+12>>2]|0;if(($|0)==(c[_+16>>2]|0)){ba=mc[c[(c[_>>2]|0)+36>>2]&127](_)|0}else{ba=c[$>>2]|0}if((ba|0)!=-1){aa=_;break}c[j>>2]=0;aa=0}}while(0);j=(aa|0)==0;_=c[f>>2]|0;do{if((_|0)==0){I=84}else{ba=c[_+12>>2]|0;if((ba|0)==(c[_+16>>2]|0)){ca=mc[c[(c[_>>2]|0)+36>>2]&127](_)|0}else{ca=c[ba>>2]|0}if((ca|0)==-1){c[f>>2]=0;I=84;break}if(!(j^(_|0)==0)){break}da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}}while(0);do{if((I|0)==84){if(j){break}da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}function rl(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;Vf(o,j,x,m,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L6:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=mc[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;H=c[f>>2]|0;do{if((H|0)==0){I=18}else{J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){K=mc[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=18;break}else{if(F^(H|0)==0){break}else{L=n;break L6}}}}while(0);if((I|0)==18){I=0;if(F){L=n;break}}H=d[q]|0;J=(H&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?H>>>1:c[C>>2]|0)|0)){if(J){M=H>>>1;N=H>>>1}else{H=c[C>>2]|0;M=H;N=H}Kd(p,M<<1,0);if((a[q]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}Kd(p,O,0);if((a[q]&1)==0){P=A}else{P=c[B>>2]|0}c[r>>2]=P+N;Q=P}else{Q=n}H=E+12|0;J=c[H>>2]|0;R=E+16|0;if((J|0)==(c[R>>2]|0)){S=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{S=c[J>>2]|0}if((Wf(S,v,w,Q,r,D,m,o,y,t,u,x)|0)!=0){L=Q;break}J=c[H>>2]|0;if((J|0)==(c[R>>2]|0)){mc[c[(c[E>>2]|0)+40>>2]&127](E)|0;n=Q;z=E;continue}else{c[H>>2]=J+4;n=Q;z=E;continue}}E=o;z=d[E]|0;if((z&1|0)==0){T=z>>>1}else{T=c[o+4>>2]|0}do{if((T|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}Q=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=Q}}while(0);h[l>>3]=+Wl(L,c[r>>2]|0,k);r=c[t>>2]|0;t=o;L=a[E]|0;l=L&255;if((l&1|0)==0){U=l>>>1}else{U=c[o+4>>2]|0}L66:do{if((U|0)!=0){do{if((y|0)==(r|0)){V=L}else{l=r-4|0;if(l>>>0>y>>>0){W=y;X=l}else{V=L;break}do{l=c[W>>2]|0;c[W>>2]=c[X>>2];c[X>>2]=l;W=W+4|0;X=X-4|0;}while(W>>>0<X>>>0);V=a[E]|0}}while(0);if((V&1)==0){Y=t+1|0}else{Y=c[o+8>>2]|0}F=V&255;if((F&1|0)==0){Z=F>>>1}else{Z=c[o+4>>2]|0}F=r-4|0;l=a[Y]|0;u=l<<24>>24;s=l<<24>>24<1|l<<24>>24==127;L82:do{if(F>>>0>y>>>0){l=Y+Z|0;v=Y;T=y;Q=u;z=s;while(1){if(!z){if((Q|0)!=(c[T>>2]|0)){break}}n=(l-v|0)>1?v+1|0:v;x=T+4|0;m=a[n]|0;D=m<<24>>24;w=m<<24>>24<1|m<<24>>24==127;if(x>>>0<F>>>0){v=n;T=x;Q=D;z=w}else{_=D;$=w;break L82}}c[k>>2]=4;break L66}else{_=u;$=s}}while(0);if($){break}if(((c[F>>2]|0)-1|0)>>>0<_>>>0){break}c[k>>2]=4}}while(0);_=c[j>>2]|0;do{if((_|0)==0){aa=0}else{$=c[_+12>>2]|0;if(($|0)==(c[_+16>>2]|0)){ba=mc[c[(c[_>>2]|0)+36>>2]&127](_)|0}else{ba=c[$>>2]|0}if((ba|0)!=-1){aa=_;break}c[j>>2]=0;aa=0}}while(0);j=(aa|0)==0;_=c[f>>2]|0;do{if((_|0)==0){I=84}else{ba=c[_+12>>2]|0;if((ba|0)==(c[_+16>>2]|0)){ca=mc[c[(c[_>>2]|0)+36>>2]&127](_)|0}else{ca=c[ba>>2]|0}if((ca|0)==-1){c[f>>2]=0;I=84;break}if(!(j^(_|0)==0)){break}da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}}while(0);do{if((I|0)==84){if(j){break}da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}function sl(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;Vf(o,j,x,m,n);bn(q|0,0,12)|0;j=p;Kd(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L6:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=mc[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;H=c[f>>2]|0;do{if((H|0)==0){I=18}else{J=c[H+12>>2]|0;if((J|0)==(c[H+16>>2]|0)){K=mc[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=18;break}else{if(F^(H|0)==0){break}else{L=n;break L6}}}}while(0);if((I|0)==18){I=0;if(F){L=n;break}}H=d[q]|0;J=(H&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?H>>>1:c[C>>2]|0)|0)){if(J){M=H>>>1;N=H>>>1}else{H=c[C>>2]|0;M=H;N=H}Kd(p,M<<1,0);if((a[q]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}Kd(p,O,0);if((a[q]&1)==0){P=A}else{P=c[B>>2]|0}c[r>>2]=P+N;Q=P}else{Q=n}H=E+12|0;J=c[H>>2]|0;R=E+16|0;if((J|0)==(c[R>>2]|0)){S=mc[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{S=c[J>>2]|0}if((Wf(S,v,w,Q,r,D,m,o,y,t,u,x)|0)!=0){L=Q;break}J=c[H>>2]|0;if((J|0)==(c[R>>2]|0)){mc[c[(c[E>>2]|0)+40>>2]&127](E)|0;n=Q;z=E;continue}else{c[H>>2]=J+4;n=Q;z=E;continue}}E=o;z=d[E]|0;if((z&1|0)==0){T=z>>>1}else{T=c[o+4>>2]|0}do{if((T|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}Q=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=Q}}while(0);h[l>>3]=+Xl(L,c[r>>2]|0,k);r=c[t>>2]|0;t=o;L=a[E]|0;l=L&255;if((l&1|0)==0){U=l>>>1}else{U=c[o+4>>2]|0}L66:do{if((U|0)!=0){do{if((y|0)==(r|0)){V=L}else{l=r-4|0;if(l>>>0>y>>>0){W=y;X=l}else{V=L;break}do{l=c[W>>2]|0;c[W>>2]=c[X>>2];c[X>>2]=l;W=W+4|0;X=X-4|0;}while(W>>>0<X>>>0);V=a[E]|0}}while(0);if((V&1)==0){Y=t+1|0}else{Y=c[o+8>>2]|0}F=V&255;if((F&1|0)==0){Z=F>>>1}else{Z=c[o+4>>2]|0}F=r-4|0;l=a[Y]|0;u=l<<24>>24;s=l<<24>>24<1|l<<24>>24==127;L82:do{if(F>>>0>y>>>0){l=Y+Z|0;v=Y;T=y;Q=u;z=s;while(1){if(!z){if((Q|0)!=(c[T>>2]|0)){break}}n=(l-v|0)>1?v+1|0:v;x=T+4|0;m=a[n]|0;D=m<<24>>24;w=m<<24>>24<1|m<<24>>24==127;if(x>>>0<F>>>0){v=n;T=x;Q=D;z=w}else{_=D;$=w;break L82}}c[k>>2]=4;break L66}else{_=u;$=s}}while(0);if($){break}if(((c[F>>2]|0)-1|0)>>>0<_>>>0){break}c[k>>2]=4}}while(0);_=c[j>>2]|0;do{if((_|0)==0){aa=0}else{$=c[_+12>>2]|0;if(($|0)==(c[_+16>>2]|0)){ba=mc[c[(c[_>>2]|0)+36>>2]&127](_)|0}else{ba=c[$>>2]|0}if((ba|0)!=-1){aa=_;break}c[j>>2]=0;aa=0}}while(0);j=(aa|0)==0;_=c[f>>2]|0;do{if((_|0)==0){I=84}else{ba=c[_+12>>2]|0;if((ba|0)==(c[_+16>>2]|0)){ca=mc[c[(c[_>>2]|0)+36>>2]&127](_)|0}else{ca=c[ba>>2]|0}if((ca|0)==-1){c[f>>2]=0;I=84;break}if(!(j^(_|0)==0)){break}da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}}while(0);do{if((I|0)==84){if(j){break}da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;da=b|0;c[da>>2]=aa;Hd(p);Hd(o);i=e;return}function tl(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+16|0;h=g|0;j=h;c[j>>2]=f;c[j+4>>2]=0;j=Mb(d|0)|0;d=Nb(a|0,b|0,e|0,h|0)|0;if((j|0)==0){i=g;return d|0}Mb(j|0)|0;i=g;return d|0}function ul(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=Mb(b|0)|0;b=Zb(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}Mb(h|0)|0;i=f;return b|0}function vl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g>>2;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;g=h>>2;do{if((h|0)>0){if((kc[c[(c[d>>2]|0)+48>>2]&63](d,e,g)|0)==(g|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){Sd(l,q,j);if((a[l]&1)==0){r=l+4|0}else{r=c[l+8>>2]|0}if((kc[c[(c[d>>2]|0)+48>>2]&63](d,r,q)|0)==(q|0)){Td(l);break}c[m>>2]=0;c[b>>2]=0;Td(l);i=k;return}}while(0);l=n-o|0;o=l>>2;do{if((l|0)>0){if((kc[c[(c[d>>2]|0)+48>>2]&63](d,f,o)|0)==(o|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function wl(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;j=i;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){l=d;break}if((mc[c[(c[d>>2]|0)+36>>2]&127](d)|0)==-1){c[k>>2]=0;l=0;break}else{l=c[k>>2]|0;break}}}while(0);d=(l|0)==0;l=e|0;e=c[l>>2]|0;L8:do{if((e|0)==0){m=11}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((mc[c[(c[e>>2]|0)+36>>2]&127](e)|0)!=-1){break}c[l>>2]=0;m=11;break L8}}while(0);if(d){n=e}else{m=12}}}while(0);if((m|0)==11){if(d){m=12}else{n=0}}if((m|0)==12){c[f>>2]=c[f>>2]|6;o=0;i=j;return o|0}d=c[k>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){p=(mc[c[(c[d>>2]|0)+36>>2]&127](d)|0)&255}else{p=a[e]|0}do{if(p<<24>>24>-1){e=g+8|0;if((b[(c[e>>2]|0)+(p<<24>>24<<1)>>1]&2048)==0){break}d=g;q=(kc[c[(c[d>>2]|0)+36>>2]&63](g,p,0)|0)<<24>>24;r=c[k>>2]|0;s=r+12|0;t=c[s>>2]|0;if((t|0)==(c[r+16>>2]|0)){mc[c[(c[r>>2]|0)+40>>2]&127](r)|0;u=q;v=h;w=n}else{c[s>>2]=t+1;u=q;v=h;w=n}while(1){x=u-48|0;q=v-1|0;t=c[k>>2]|0;do{if((t|0)==0){y=0}else{if((c[t+12>>2]|0)!=(c[t+16>>2]|0)){y=t;break}if((mc[c[(c[t>>2]|0)+36>>2]&127](t)|0)==-1){c[k>>2]=0;y=0;break}else{y=c[k>>2]|0;break}}}while(0);t=(y|0)==0;if((w|0)==0){z=y;A=0}else{do{if((c[w+12>>2]|0)==(c[w+16>>2]|0)){if((mc[c[(c[w>>2]|0)+36>>2]&127](w)|0)!=-1){B=w;break}c[l>>2]=0;B=0}else{B=w}}while(0);z=c[k>>2]|0;A=B}C=(A|0)==0;if(!((t^C)&(q|0)>0)){m=41;break}s=c[z+12>>2]|0;if((s|0)==(c[z+16>>2]|0)){D=(mc[c[(c[z>>2]|0)+36>>2]&127](z)|0)&255}else{D=a[s]|0}if(D<<24>>24<=-1){o=x;m=54;break}if((b[(c[e>>2]|0)+(D<<24>>24<<1)>>1]&2048)==0){o=x;m=55;break}s=((kc[c[(c[d>>2]|0)+36>>2]&63](g,D,0)|0)<<24>>24)+(x*10|0)|0;r=c[k>>2]|0;E=r+12|0;F=c[E>>2]|0;if((F|0)==(c[r+16>>2]|0)){mc[c[(c[r>>2]|0)+40>>2]&127](r)|0;u=s;v=q;w=A;continue}else{c[E>>2]=F+1;u=s;v=q;w=A;continue}}if((m|0)==41){do{if((z|0)==0){G=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){G=z;break}if((mc[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[k>>2]=0;G=0;break}else{G=c[k>>2]|0;break}}}while(0);d=(G|0)==0;L65:do{if(C){m=51}else{do{if((c[A+12>>2]|0)==(c[A+16>>2]|0)){if((mc[c[(c[A>>2]|0)+36>>2]&127](A)|0)!=-1){break}c[l>>2]=0;m=51;break L65}}while(0);if(d){o=x}else{break}i=j;return o|0}}while(0);do{if((m|0)==51){if(d){break}else{o=x}i=j;return o|0}}while(0);c[f>>2]=c[f>>2]|2;o=x;i=j;return o|0}else if((m|0)==54){i=j;return o|0}else if((m|0)==55){i=j;return o|0}}}while(0);c[f>>2]=c[f>>2]|4;o=0;i=j;return o|0}function xl(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=i;h=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[h>>2];h=a|0;a=c[h>>2]|0;do{if((a|0)==0){j=1}else{k=c[a+12>>2]|0;if((k|0)==(c[a+16>>2]|0)){l=mc[c[(c[a>>2]|0)+36>>2]&127](a)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[h>>2]=0;j=1;break}else{j=(c[h>>2]|0)==0;break}}}while(0);l=b|0;b=c[l>>2]|0;do{if((b|0)==0){m=14}else{a=c[b+12>>2]|0;if((a|0)==(c[b+16>>2]|0)){n=mc[c[(c[b>>2]|0)+36>>2]&127](b)|0}else{n=c[a>>2]|0}if((n|0)==-1){c[l>>2]=0;m=14;break}else{if(j^(b|0)==0){o=b;break}else{m=16;break}}}}while(0);if((m|0)==14){if(j){m=16}else{o=0}}if((m|0)==16){c[d>>2]=c[d>>2]|6;p=0;i=g;return p|0}j=c[h>>2]|0;b=c[j+12>>2]|0;if((b|0)==(c[j+16>>2]|0)){q=mc[c[(c[j>>2]|0)+36>>2]&127](j)|0}else{q=c[b>>2]|0}b=e;if(!(kc[c[(c[b>>2]|0)+12>>2]&63](e,2048,q)|0)){c[d>>2]=c[d>>2]|4;p=0;i=g;return p|0}j=e;n=(kc[c[(c[j>>2]|0)+52>>2]&63](e,q,0)|0)<<24>>24;q=c[h>>2]|0;a=q+12|0;k=c[a>>2]|0;if((k|0)==(c[q+16>>2]|0)){mc[c[(c[q>>2]|0)+40>>2]&127](q)|0;r=n;s=f;t=o}else{c[a>>2]=k+4;r=n;s=f;t=o}while(1){u=r-48|0;o=s-1|0;f=c[h>>2]|0;do{if((f|0)==0){v=0}else{n=c[f+12>>2]|0;if((n|0)==(c[f+16>>2]|0)){w=mc[c[(c[f>>2]|0)+36>>2]&127](f)|0}else{w=c[n>>2]|0}if((w|0)==-1){c[h>>2]=0;v=0;break}else{v=c[h>>2]|0;break}}}while(0);f=(v|0)==0;if((t|0)==0){x=v;y=0}else{n=c[t+12>>2]|0;if((n|0)==(c[t+16>>2]|0)){z=mc[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{z=c[n>>2]|0}if((z|0)==-1){c[l>>2]=0;A=0}else{A=t}x=c[h>>2]|0;y=A}B=(y|0)==0;if(!((f^B)&(o|0)>0)){break}f=c[x+12>>2]|0;if((f|0)==(c[x+16>>2]|0)){C=mc[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{C=c[f>>2]|0}if(!(kc[c[(c[b>>2]|0)+12>>2]&63](e,2048,C)|0)){p=u;m=65;break}f=((kc[c[(c[j>>2]|0)+52>>2]&63](e,C,0)|0)<<24>>24)+(u*10|0)|0;n=c[h>>2]|0;k=n+12|0;a=c[k>>2]|0;if((a|0)==(c[n+16>>2]|0)){mc[c[(c[n>>2]|0)+40>>2]&127](n)|0;r=f;s=o;t=y;continue}else{c[k>>2]=a+4;r=f;s=o;t=y;continue}}if((m|0)==65){i=g;return p|0}do{if((x|0)==0){D=1}else{t=c[x+12>>2]|0;if((t|0)==(c[x+16>>2]|0)){E=mc[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{E=c[t>>2]|0}if((E|0)==-1){c[h>>2]=0;D=1;break}else{D=(c[h>>2]|0)==0;break}}}while(0);do{if(B){m=60}else{h=c[y+12>>2]|0;if((h|0)==(c[y+16>>2]|0)){F=mc[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{F=c[h>>2]|0}if((F|0)==-1){c[l>>2]=0;m=60;break}if(D^(y|0)==0){p=u}else{break}i=g;return p|0}}while(0);do{if((m|0)==60){if(D){break}else{p=u}i=g;return p|0}}while(0);c[d>>2]=c[d>>2]|2;p=u;i=g;return p|0}function yl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=10;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g|0;if((e|0)==(d|0)){return b|0}if((k-j|0)>>>0<h>>>0){Qd(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+1|0}else{n=c[b+8>>2]|0}m=e+(j-g)|0;g=d;d=n+j|0;while(1){a[d]=a[g]|0;l=g+1|0;if((l|0)==(e|0)){break}else{g=l;d=d+1|0}}a[n+m|0]=0;m=j+h|0;if((a[f]&1)==0){a[f]=m<<1;return b|0}else{c[b+4>>2]=m;return b|0}return 0}function zl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=1;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g>>2;if((h|0)==0){return b|0}if((k-j|0)>>>0<h>>>0){Yd(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+4|0}else{n=c[b+8>>2]|0}m=n+(j<<2)|0;if((d|0)==(e|0)){o=m}else{l=j+((e-4-g|0)>>>2)+1|0;g=d;d=m;while(1){c[d>>2]=c[g>>2];m=g+4|0;if((m|0)==(e|0)){break}else{g=m;d=d+4|0}}o=n+(l<<2)|0}c[o>>2]=0;o=j+h|0;if((a[f]&1)==0){a[f]=o<<1;return b|0}else{c[b+4>>2]=o;return b|0}return 0}function Al(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if(h-i>>2>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{c[k>>2]=0;l=c[f>>2]|0}k=l+4|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b+16|0;k=b|0;l=c[k>>2]|0;g=i-l>>2;i=g+d|0;if(i>>>0>1073741823>>>0){Bi(b)}m=h-l|0;do{if(m>>2>>>0>536870910>>>0){n=1073741823;o=11}else{l=m>>1;h=l>>>0<i>>>0?i:l;if((h|0)==0){p=0;q=0;break}l=b+128|0;if(!((a[l]&1)==0&h>>>0<29>>>0)){n=h;o=11;break}a[l]=1;p=j;q=h}}while(0);if((o|0)==11){p=Jm(n<<2)|0;q=n}n=d;d=p+(g<<2)|0;do{if((d|0)==0){r=0}else{c[d>>2]=0;r=d}d=r+4|0;n=n-1|0;}while((n|0)!=0);n=c[k>>2]|0;r=(c[f>>2]|0)-n|0;o=p+(g-(r>>2)<<2)|0;g=n;an(o|0,g|0,r)|0;c[k>>2]=o;c[f>>2]=d;c[e>>2]=p+(q<<2);if((n|0)==0){return}if((n|0)==(j|0)){a[b+128|0]=0;return}else{Lm(g);return}}function Bl(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0;c[g>>2]=d;c[j>>2]=h;do{if((l&2|0)!=0){if((i-h|0)<3){m=1;return m|0}else{c[j>>2]=h+1;a[h]=-17;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-69;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-65;break}}}while(0);h=f;l=c[g>>2]|0;if(l>>>0>=f>>>0){m=0;return m|0}d=i;i=l;L10:while(1){l=b[i>>1]|0;n=l&65535;if(n>>>0>k>>>0){m=2;o=37;break}do{if((l&65535)>>>0<128>>>0){p=c[j>>2]|0;if((d-p|0)<1){m=1;o=39;break L10}c[j>>2]=p+1;a[p]=l}else{if((l&65535)>>>0<2048>>>0){p=c[j>>2]|0;if((d-p|0)<2){m=1;o=28;break L10}c[j>>2]=p+1;a[p]=n>>>6|192;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n&63|128;break}if((l&65535)>>>0<55296>>>0){p=c[j>>2]|0;if((d-p|0)<3){m=1;o=30;break L10}c[j>>2]=p+1;a[p]=n>>>12|224;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n>>>6&63|128;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n&63|128;break}if((l&65535)>>>0>=56320>>>0){if((l&65535)>>>0<57344>>>0){m=2;o=32;break L10}p=c[j>>2]|0;if((d-p|0)<3){m=1;o=33;break L10}c[j>>2]=p+1;a[p]=n>>>12|224;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n>>>6&63|128;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n&63|128;break}if((h-i|0)<4){m=1;o=27;break L10}p=i+2|0;q=e[p>>1]|0;if((q&64512|0)!=56320){m=2;o=38;break L10}if((d-(c[j>>2]|0)|0)<4){m=1;o=29;break L10}r=n&960;if(((r<<10)+65536|n<<10&64512|q&1023)>>>0>k>>>0){m=2;o=31;break L10}c[g>>2]=p;p=(r>>>6)+1|0;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=p>>>2|240;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=n>>>2&15|p<<4&48|128;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n<<4&48|q>>>6&15|128;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=q&63|128}}while(0);n=(c[g>>2]|0)+2|0;c[g>>2]=n;if(n>>>0<f>>>0){i=n}else{m=0;o=34;break}}if((o|0)==27){return m|0}else if((o|0)==28){return m|0}else if((o|0)==29){return m|0}else if((o|0)==30){return m|0}else if((o|0)==31){return m|0}else if((o|0)==32){return m|0}else if((o|0)==33){return m|0}else if((o|0)==34){return m|0}else if((o|0)==37){return m|0}else if((o|0)==38){return m|0}else if((o|0)==39){return m|0}return 0}function Cl(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;c[g>>2]=e;c[j>>2]=h;h=c[g>>2]|0;do{if((l&4|0)==0){m=h}else{if((f-h|0)<=2){m=h;break}if((a[h]|0)!=-17){m=h;break}if((a[h+1|0]|0)!=-69){m=h;break}if((a[h+2|0]|0)!=-65){m=h;break}e=h+3|0;c[g>>2]=e;m=e}}while(0);L8:do{if(m>>>0<f>>>0){h=f;l=i;e=m;n=c[j>>2]|0;L10:while(1){if(n>>>0>=i>>>0){o=e;break L8}p=a[e]|0;q=p&255;if(q>>>0>k>>>0){r=2;s=61;break}do{if(p<<24>>24>-1){b[n>>1]=p&255;c[g>>2]=(c[g>>2]|0)+1}else{if((p&255)>>>0<194>>>0){r=2;s=62;break L10}if((p&255)>>>0<224>>>0){if((h-e|0)<2){r=1;s=42;break L10}t=d[e+1|0]|0;if((t&192|0)!=128){r=2;s=43;break L10}u=t&63|q<<6&1984;if(u>>>0>k>>>0){r=2;s=44;break L10}b[n>>1]=u;c[g>>2]=(c[g>>2]|0)+2;break}if((p&255)>>>0<240>>>0){if((h-e|0)<3){r=1;s=45;break L10}u=a[e+1|0]|0;t=a[e+2|0]|0;if((q|0)==224){if((u&-32)<<24>>24!=-96){r=2;s=46;break L10}}else if((q|0)==237){if((u&-32)<<24>>24!=-128){r=2;s=47;break L10}}else{if((u&-64)<<24>>24!=-128){r=2;s=48;break L10}}v=t&255;if((v&192|0)!=128){r=2;s=49;break L10}t=(u&255)<<6&4032|q<<12|v&63;if((t&65535)>>>0>k>>>0){r=2;s=50;break L10}b[n>>1]=t;c[g>>2]=(c[g>>2]|0)+3;break}if((p&255)>>>0>=245>>>0){r=2;s=51;break L10}if((h-e|0)<4){r=1;s=52;break L10}t=a[e+1|0]|0;v=a[e+2|0]|0;u=a[e+3|0]|0;if((q|0)==240){if((t+112&255)>>>0>=48>>>0){r=2;s=53;break L10}}else if((q|0)==244){if((t&-16)<<24>>24!=-128){r=2;s=54;break L10}}else{if((t&-64)<<24>>24!=-128){r=2;s=55;break L10}}w=v&255;if((w&192|0)!=128){r=2;s=56;break L10}v=u&255;if((v&192|0)!=128){r=2;s=57;break L10}if((l-n|0)<4){r=1;s=58;break L10}u=q&7;x=t&255;t=w<<6;y=v&63;if((x<<12&258048|u<<18|t&4032|y)>>>0>k>>>0){r=2;s=59;break L10}b[n>>1]=x<<2&60|w>>>4&3|((x>>>4&3|u<<2)<<6)+16320|55296;u=(c[j>>2]|0)+2|0;c[j>>2]=u;b[u>>1]=y|t&960|56320;c[g>>2]=(c[g>>2]|0)+4}}while(0);q=(c[j>>2]|0)+2|0;c[j>>2]=q;p=c[g>>2]|0;if(p>>>0<f>>>0){e=p;n=q}else{o=p;break L8}}if((s|0)==42){return r|0}else if((s|0)==43){return r|0}else if((s|0)==44){return r|0}else if((s|0)==45){return r|0}else if((s|0)==46){return r|0}else if((s|0)==47){return r|0}else if((s|0)==48){return r|0}else if((s|0)==49){return r|0}else if((s|0)==50){return r|0}else if((s|0)==51){return r|0}else if((s|0)==52){return r|0}else if((s|0)==53){return r|0}else if((s|0)==54){return r|0}else if((s|0)==55){return r|0}else if((s|0)==56){return r|0}else if((s|0)==57){return r|0}else if((s|0)==58){return r|0}else if((s|0)==59){return r|0}else if((s|0)==61){return r|0}else if((s|0)==62){return r|0}}else{o=m}}while(0);r=o>>>0<f>>>0|0;return r|0}function Dl(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L7:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=0;j=h;L9:while(1){k=a[j]|0;l=k&255;if(l>>>0>f>>>0){m=j;break L7}do{if(k<<24>>24>-1){n=j+1|0;o=i}else{if((k&255)>>>0<194>>>0){m=j;break L7}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L7}p=d[j+1|0]|0;if((p&192|0)!=128){m=j;break L7}if((p&63|l<<6&1984)>>>0>f>>>0){m=j;break L7}n=j+2|0;o=i;break}if((k&255)>>>0<240>>>0){q=j;if((g-q|0)<3){m=j;break L7}p=a[j+1|0]|0;r=a[j+2|0]|0;if((l|0)==224){if((p&-32)<<24>>24!=-96){s=21;break L9}}else if((l|0)==237){if((p&-32)<<24>>24!=-128){s=23;break L9}}else{if((p&-64)<<24>>24!=-128){s=25;break L9}}t=r&255;if((t&192|0)!=128){m=j;break L7}if(((p&255)<<6&4032|l<<12&61440|t&63)>>>0>f>>>0){m=j;break L7}n=j+3|0;o=i;break}if((k&255)>>>0>=245>>>0){m=j;break L7}u=j;if((g-u|0)<4|(e-i|0)>>>0<2>>>0){m=j;break L7}t=a[j+1|0]|0;p=a[j+2|0]|0;r=a[j+3|0]|0;if((l|0)==240){if((t+112&255)>>>0>=48>>>0){s=33;break L9}}else if((l|0)==244){if((t&-16)<<24>>24!=-128){s=35;break L9}}else{if((t&-64)<<24>>24!=-128){s=37;break L9}}v=p&255;if((v&192|0)!=128){m=j;break L7}p=r&255;if((p&192|0)!=128){m=j;break L7}if(((t&255)<<12&258048|l<<18&1835008|v<<6&4032|p&63)>>>0>f>>>0){m=j;break L7}n=j+4|0;o=i+1|0}}while(0);l=o+1|0;if(n>>>0<c>>>0&l>>>0<e>>>0){i=l;j=n}else{m=n;break L7}}if((s|0)==21){w=q-b|0;return w|0}else if((s|0)==23){w=q-b|0;return w|0}else if((s|0)==25){w=q-b|0;return w|0}else if((s|0)==33){w=u-b|0;return w|0}else if((s|0)==35){w=u-b|0;return w|0}else if((s|0)==37){w=u-b|0;return w|0}}else{m=h}}while(0);w=m-b|0;return w|0}function El(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0;c[e>>2]=b;c[h>>2]=f;do{if((j&2|0)!=0){if((g-f|0)<3){k=1;return k|0}else{c[h>>2]=f+1;a[f]=-17;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-69;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-65;break}}}while(0);f=c[e>>2]|0;if(f>>>0>=d>>>0){k=0;return k|0}j=g;g=f;L10:while(1){f=c[g>>2]|0;if((f&-2048|0)==55296|f>>>0>i>>>0){k=2;l=22;break}do{if(f>>>0<128>>>0){b=c[h>>2]|0;if((j-b|0)<1){k=1;l=27;break L10}c[h>>2]=b+1;a[b]=f}else{if(f>>>0<2048>>>0){b=c[h>>2]|0;if((j-b|0)<2){k=1;l=26;break L10}c[h>>2]=b+1;a[b]=f>>>6|192;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f&63|128;break}b=c[h>>2]|0;m=j-b|0;if(f>>>0<65536>>>0){if((m|0)<3){k=1;l=23;break L10}c[h>>2]=b+1;a[b]=f>>>12|224;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=f>>>6&63|128;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=f&63|128;break}else{if((m|0)<4){k=1;l=21;break L10}c[h>>2]=b+1;a[b]=f>>>18|240;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f>>>12&63|128;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f>>>6&63|128;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f&63|128;break}}}while(0);f=(c[e>>2]|0)+4|0;c[e>>2]=f;if(f>>>0<d>>>0){g=f}else{k=0;l=20;break}}if((l|0)==20){return k|0}else if((l|0)==21){return k|0}else if((l|0)==22){return k|0}else if((l|0)==23){return k|0}else if((l|0)==26){return k|0}else if((l|0)==27){return k|0}return 0}function Fl(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;c[f>>2]=b;c[i>>2]=g;g=c[f>>2]|0;do{if((k&4|0)==0){l=g}else{if((e-g|0)<=2){l=g;break}if((a[g]|0)!=-17){l=g;break}if((a[g+1|0]|0)!=-69){l=g;break}if((a[g+2|0]|0)!=-65){l=g;break}b=g+3|0;c[f>>2]=b;l=b}}while(0);L8:do{if(l>>>0<e>>>0){g=e;k=l;b=c[i>>2]|0;L10:while(1){if(b>>>0>=h>>>0){m=k;break L8}n=a[k]|0;o=n&255;do{if(n<<24>>24>-1){if(o>>>0>j>>>0){p=2;q=42;break L10}c[b>>2]=o;c[f>>2]=(c[f>>2]|0)+1}else{if((n&255)>>>0<194>>>0){p=2;q=41;break L10}if((n&255)>>>0<224>>>0){if((g-k|0)<2){p=1;q=60;break L10}r=d[k+1|0]|0;if((r&192|0)!=128){p=2;q=59;break L10}s=r&63|o<<6&1984;if(s>>>0>j>>>0){p=2;q=43;break L10}c[b>>2]=s;c[f>>2]=(c[f>>2]|0)+2;break}if((n&255)>>>0<240>>>0){if((g-k|0)<3){p=1;q=44;break L10}s=a[k+1|0]|0;r=a[k+2|0]|0;if((o|0)==224){if((s&-32)<<24>>24!=-96){p=2;q=45;break L10}}else if((o|0)==237){if((s&-32)<<24>>24!=-128){p=2;q=46;break L10}}else{if((s&-64)<<24>>24!=-128){p=2;q=47;break L10}}t=r&255;if((t&192|0)!=128){p=2;q=48;break L10}r=(s&255)<<6&4032|o<<12&61440|t&63;if(r>>>0>j>>>0){p=2;q=49;break L10}c[b>>2]=r;c[f>>2]=(c[f>>2]|0)+3;break}if((n&255)>>>0>=245>>>0){p=2;q=50;break L10}if((g-k|0)<4){p=1;q=51;break L10}r=a[k+1|0]|0;t=a[k+2|0]|0;s=a[k+3|0]|0;if((o|0)==240){if((r+112&255)>>>0>=48>>>0){p=2;q=52;break L10}}else if((o|0)==244){if((r&-16)<<24>>24!=-128){p=2;q=53;break L10}}else{if((r&-64)<<24>>24!=-128){p=2;q=54;break L10}}u=t&255;if((u&192|0)!=128){p=2;q=55;break L10}t=s&255;if((t&192|0)!=128){p=2;q=56;break L10}s=(r&255)<<12&258048|o<<18&1835008|u<<6&4032|t&63;if(s>>>0>j>>>0){p=2;q=57;break L10}c[b>>2]=s;c[f>>2]=(c[f>>2]|0)+4}}while(0);o=(c[i>>2]|0)+4|0;c[i>>2]=o;n=c[f>>2]|0;if(n>>>0<e>>>0){k=n;b=o}else{m=n;break L8}}if((q|0)==41){return p|0}else if((q|0)==42){return p|0}else if((q|0)==43){return p|0}else if((q|0)==44){return p|0}else if((q|0)==45){return p|0}else if((q|0)==46){return p|0}else if((q|0)==47){return p|0}else if((q|0)==48){return p|0}else if((q|0)==49){return p|0}else if((q|0)==50){return p|0}else if((q|0)==51){return p|0}else if((q|0)==52){return p|0}else if((q|0)==53){return p|0}else if((q|0)==54){return p|0}else if((q|0)==55){return p|0}else if((q|0)==56){return p|0}else if((q|0)==57){return p|0}else if((q|0)==59){return p|0}else if((q|0)==60){return p|0}}else{m=l}}while(0);p=m>>>0<e>>>0|0;return p|0}function Gl(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L7:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=0;j=h;L9:while(1){k=a[j]|0;l=k&255;do{if(k<<24>>24>-1){if(l>>>0>f>>>0){m=j;break L7}n=j+1|0}else{if((k&255)>>>0<194>>>0){m=j;break L7}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L7}o=d[j+1|0]|0;if((o&192|0)!=128){m=j;break L7}if((o&63|l<<6&1984)>>>0>f>>>0){m=j;break L7}n=j+2|0;break}if((k&255)>>>0<240>>>0){p=j;if((g-p|0)<3){m=j;break L7}o=a[j+1|0]|0;q=a[j+2|0]|0;if((l|0)==224){if((o&-32)<<24>>24!=-96){r=21;break L9}}else if((l|0)==237){if((o&-32)<<24>>24!=-128){r=23;break L9}}else{if((o&-64)<<24>>24!=-128){r=25;break L9}}s=q&255;if((s&192|0)!=128){m=j;break L7}if(((o&255)<<6&4032|l<<12&61440|s&63)>>>0>f>>>0){m=j;break L7}n=j+3|0;break}if((k&255)>>>0>=245>>>0){m=j;break L7}t=j;if((g-t|0)<4){m=j;break L7}s=a[j+1|0]|0;o=a[j+2|0]|0;q=a[j+3|0]|0;if((l|0)==240){if((s+112&255)>>>0>=48>>>0){r=33;break L9}}else if((l|0)==244){if((s&-16)<<24>>24!=-128){r=35;break L9}}else{if((s&-64)<<24>>24!=-128){r=37;break L9}}u=o&255;if((u&192|0)!=128){m=j;break L7}o=q&255;if((o&192|0)!=128){m=j;break L7}if(((s&255)<<12&258048|l<<18&1835008|u<<6&4032|o&63)>>>0>f>>>0){m=j;break L7}n=j+4|0}}while(0);l=i+1|0;if(n>>>0<c>>>0&l>>>0<e>>>0){i=l;j=n}else{m=n;break L7}}if((r|0)==21){v=p-b|0;return v|0}else if((r|0)==23){v=p-b|0;return v|0}else if((r|0)==25){v=p-b|0;return v|0}else if((r|0)==33){v=t-b|0;return v|0}else if((r|0)==35){v=t-b|0;return v|0}else if((r|0)==37){v=t-b|0;return v|0}}else{m=h}}while(0);v=m-b|0;return v|0}function Hl(a){a=a|0;Hd(50500);Hd(50488);Hd(50476);Hd(50464);Hd(50452);Hd(50440);Hd(50428);Hd(50416);Hd(50404);Hd(50392);Hd(50380);Hd(50368);Hd(50356);Hd(50344);return}function Il(a){a=a|0;Td(49756);Td(49744);Td(49732);Td(49720);Td(49708);Td(49696);Td(49684);Td(49672);Td(49660);Td(49648);Td(49636);Td(49624);Td(49612);Td(49600);return}function Jl(a){a=a|0;Hd(50332);Hd(50320);Hd(50308);Hd(50296);Hd(50284);Hd(50272);Hd(50260);Hd(50248);Hd(50236);Hd(50224);Hd(50212);Hd(50200);Hd(50188);Hd(50176);Hd(50164);Hd(50152);Hd(50140);Hd(50128);Hd(50116);Hd(50104);Hd(50092);Hd(50080);Hd(50068);Hd(50056);return}function Kl(a){a=a|0;Td(49588);Td(49576);Td(49564);Td(49552);Td(49540);Td(49528);Td(49516);Td(49504);Td(49492);Td(49480);Td(49468);Td(49456);Td(49444);Td(49432);Td(49420);Td(49408);Td(49396);Td(49384);Td(49372);Td(49360);Td(49348);Td(49336);Td(49324);Td(49312);return}function Ll(a){a=a|0;Hd(50788);Hd(50776);Hd(50764);Hd(50752);Hd(50740);Hd(50728);Hd(50716);Hd(50704);Hd(50692);Hd(50680);Hd(50668);Hd(50656);Hd(50644);Hd(50632);Hd(50620);Hd(50608);Hd(50596);Hd(50584);Hd(50572);Hd(50560);Hd(50548);Hd(50536);Hd(50524);Hd(50512);return}function Ml(a){a=a|0;Td(50044);Td(50032);Td(50020);Td(50008);Td(49996);Td(49984);Td(49972);Td(49960);Td(49948);Td(49936);Td(49924);Td(49912);Td(49900);Td(49888);Td(49876);Td(49864);Td(49852);Td(49840);Td(49828);Td(49816);Td(49804);Td(49792);Td(49780);Td(49768);return}function Nl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;if((a[k]&1)!=0){l=b+48|0;m=c[l>>2]|0;if(!d){n=m;i=e;return n|0}c[l>>2]=-1;a[k]=0;n=m;i=e;return n|0}m=c[b+44>>2]|0;k=(m|0)>1?m:1;L8:do{if((k|0)>0){m=b+32|0;l=0;while(1){o=Za(c[m>>2]|0)|0;if((o|0)==-1){n=-1;break}a[f+l|0]=o;l=l+1|0;if((l|0)>=(k|0)){break L8}}i=e;return n|0}}while(0);L15:do{if((a[b+53|0]&1)==0){l=b+40|0;m=b+36|0;o=f|0;p=g+4|0;q=b+32|0;r=k;while(1){s=c[l>>2]|0;t=s;u=c[t>>2]|0;v=c[t+4>>2]|0;t=c[m>>2]|0;w=f+r|0;x=qc[c[(c[t>>2]|0)+16>>2]&31](t,s,o,w,h,g,p,j)|0;if((x|0)==3){y=14;break}else if((x|0)==2){n=-1;y=31;break}else if((x|0)!=1){z=r;break L15}x=c[l>>2]|0;c[x>>2]=u;c[x+4>>2]=v;if((r|0)==8){n=-1;y=24;break}v=Za(c[q>>2]|0)|0;if((v|0)==-1){n=-1;y=29;break}a[w]=v;r=r+1|0}if((y|0)==14){c[g>>2]=a[o]|0;z=r;break}else if((y|0)==24){i=e;return n|0}else if((y|0)==29){i=e;return n|0}else if((y|0)==31){i=e;return n|0}}else{c[g>>2]=a[f|0]|0;z=k}}while(0);if(d){d=c[g>>2]|0;c[b+48>>2]=d;n=d;i=e;return n|0}d=b+32|0;b=z;while(1){if((b|0)<=0){break}z=b-1|0;if((Lb(a[f+z|0]|0,c[d>>2]|0)|0)==-1){n=-1;y=25;break}else{b=z}}if((y|0)==25){i=e;return n|0}n=c[g>>2]|0;i=e;return n|0}function Ol(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=b+52|0;if((a[l]&1)!=0){m=b+48|0;n=c[m>>2]|0;if(!e){o=n;i=f;return o|0}c[m>>2]=-1;a[l]=0;o=n;i=f;return o|0}n=c[b+44>>2]|0;l=(n|0)>1?n:1;L8:do{if((l|0)>0){n=b+32|0;m=0;while(1){p=Za(c[n>>2]|0)|0;if((p|0)==-1){o=-1;break}a[g+m|0]=p;m=m+1|0;if((m|0)>=(l|0)){break L8}}i=f;return o|0}}while(0);L15:do{if((a[b+53|0]&1)==0){m=b+40|0;n=b+36|0;p=g|0;q=h+1|0;r=b+32|0;s=l;while(1){t=c[m>>2]|0;u=t;v=c[u>>2]|0;w=c[u+4>>2]|0;u=c[n>>2]|0;x=g+s|0;y=qc[c[(c[u>>2]|0)+16>>2]&31](u,t,p,x,j,h,q,k)|0;if((y|0)==2){o=-1;z=30;break}else if((y|0)==3){z=14;break}else if((y|0)!=1){A=s;break L15}y=c[m>>2]|0;c[y>>2]=v;c[y+4>>2]=w;if((s|0)==8){o=-1;z=28;break}w=Za(c[r>>2]|0)|0;if((w|0)==-1){o=-1;z=31;break}a[x]=w;s=s+1|0}if((z|0)==28){i=f;return o|0}else if((z|0)==30){i=f;return o|0}else if((z|0)==31){i=f;return o|0}else if((z|0)==14){a[h]=a[p]|0;A=s;break}}else{a[h]=a[g|0]|0;A=l}}while(0);do{if(e){l=a[h]|0;c[b+48>>2]=l&255;B=l}else{l=b+32|0;k=A;while(1){if((k|0)<=0){z=21;break}j=k-1|0;if((Lb(d[g+j|0]|0|0,c[l>>2]|0)|0)==-1){o=-1;z=26;break}else{k=j}}if((z|0)==21){B=a[h]|0;break}else if((z|0)==26){i=f;return o|0}}}while(0);o=B&255;i=f;return o|0}function Pl(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=Gb()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);m=Tb(b|0,h|0,f|0,c[12708]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=-1;h=0;if((b|0)==34|((f|0)<(d|0)|(f|0)==(d|0)&m>>>0<-2147483648>>>0)|((f|0)>(h|0)|(f|0)==(h|0)&m>>>0>2147483647>>>0)){c[e>>2]=4;e=0;j=(f|0)>(e|0)|(f|0)==(e|0)&m>>>0>0>>>0?2147483647:-2147483648;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function Ql(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}l=Gb()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);n=Tb(b|0,h|0,f|0,c[12708]|0)|0;f=K;b=c[l>>2]|0;if((b|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}if((b|0)!=34){j=f;k=n;i=g;return(K=j,k)|0}c[e>>2]=4;e=0;b=(f|0)>(e|0)|(f|0)==(e|0)&n>>>0>0>>>0;j=b?2147483647:-2147483648;k=b?-1:0;i=g;return(K=j,k)|0}function Rl(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=Gb()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);m=Ia(b|0,h|0,f|0,c[12708]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>65535>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m&65535;i=g;return j|0}return 0}function Sl(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=Gb()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);m=Ia(b|0,h|0,f|0,c[12708]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function Tl(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=Gb()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);m=Ia(b|0,h|0,f|0,c[12708]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function Ul(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0}else{if((a[b]|0)==45){c[e>>2]=4;j=0;k=0;break}l=Gb()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);n=Ia(b|0,h|0,f|0,c[12708]|0)|0;o=c[l>>2]|0;if((o|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)!=34){j=K;k=n;break}c[e>>2]=4;j=-1;k=-1}}while(0);i=g;return(K=j,k)|0}function Vl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=Gb()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=+Ym(b,g,c[12708]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)==34){c[e>>2]=4}h=l;i=f;return+h}function Wl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=Gb()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=+Ym(b,g,c[12708]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function Xl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=Gb()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=+Ym(b,g,c[12708]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function Yl(a,b,c){a=a|0;b=b|0;c=c|0;return Zl(0,a,b,(c|0)!=0?c:48832)|0}function Zl(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;j=((f|0)==0?48824:f)|0;f=c[j>>2]|0;L1:do{if((d|0)==0){if((f|0)==0){k=0}else{break}i=g;return k|0}else{if((b|0)==0){l=h;c[h>>2]=l;m=l}else{m=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((f|0)==0){l=a[d]|0;n=l&255;if(l<<24>>24>-1){c[m>>2]=n;k=l<<24>>24!=0|0;i=g;return k|0}else{l=n-194|0;if(l>>>0>50>>>0){break L1}o=d+1|0;p=c[s+(l<<2)>>2]|0;q=e-1|0;break}}else{o=d;p=f;q=e}}while(0);L17:do{if((q|0)==0){r=p}else{l=a[o]|0;n=(l&255)>>>3;if((n-16|n+(p>>26))>>>0>7>>>0){break L1}else{t=o;u=p;v=q;w=l}while(1){t=t+1|0;u=(w&255)-128|u<<6;v=v-1|0;if((u|0)>=0){break}if((v|0)==0){r=u;break L17}w=a[t]|0;if((w&-64)<<24>>24!=-128){break L1}}c[j>>2]=0;c[m>>2]=u;k=e-v|0;i=g;return k|0}}while(0);c[j>>2]=r;k=-2;i=g;return k|0}}while(0);c[j>>2]=0;c[(Gb()|0)>>2]=84;k=-1;i=g;return k|0}function _l(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;g=i;i=i+1032|0;h=g+1024|0;j=c[b>>2]|0;c[h>>2]=j;k=(a|0)!=0;l=g|0;m=k?e:256;e=k?a:l;L1:do{if((j|0)!=0&(m|0)!=0){a=m;n=d;o=0;p=e;q=j;while(1){r=n>>>2;s=r>>>0>=a>>>0;if(!(s|n>>>0>131>>>0)){t=a;u=n;v=o;w=p;x=q;y=7;break L1}z=s?a:r;r=n-z|0;s=$l(p,h,z,f)|0;if((s|0)==-1){A=-1;break L1}if((p|0)==(l|0)){B=l;C=a}else{B=p+(s<<2)|0;C=a-s|0}z=s+o|0;s=c[h>>2]|0;if((s|0)!=0&(C|0)!=0){a=C;n=r;o=z;p=B;q=s}else{t=C;u=r;v=z;w=B;x=s;y=7;break}}}else{t=m;u=d;v=0;w=e;x=j;y=7}}while(0);L9:do{if((y|0)==7){if((x|0)!=0&(t|0)!=0&(u|0)!=0){D=w;E=v;F=u;G=t;H=x}else{A=v;break}while(1){I=Zl(D,H,F,f)|0;if((I+2|0)>>>0<3>>>0){break}j=(c[h>>2]|0)+I|0;c[h>>2]=j;e=G-1|0;d=E+1|0;if((e|0)!=0&(F|0)!=(I|0)){D=D+4|0;E=d;F=F-I|0;G=e;H=j}else{A=d;break L9}}if((I|0)==0){c[h>>2]=0;A=E;break}else if((I|0)==(-1|0)){A=-1;break}else{c[f>>2]=0;A=E;break}}}while(0);if(!k){i=g;return A|0}c[b>>2]=c[h>>2];i=g;return A|0}function $l(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0;h=c[e>>2]|0;do{if((g|0)==0){i=5}else{j=g|0;k=c[j>>2]|0;if((k|0)==0){i=5;break}if((b|0)==0){l=k;m=h;n=f;i=16;break}c[j>>2]=0;o=k;p=h;q=b;r=f;i=35}}while(0);if((i|0)==5){if((b|0)==0){t=h;u=f;i=7}else{v=h;w=b;x=f;i=6}}L7:while(1){if((i|0)==35){i=0;h=d[p]|0;g=h>>>3;if((g-16|g+(o>>26))>>>0>7>>>0){i=36;break}g=p+1|0;y=h-128|o<<6;do{if((y|0)<0){h=d[g]|0;if((h&192|0)!=128){i=39;break L7}k=p+2|0;z=h-128|y<<6;if((z|0)>=0){A=z;B=k;break}h=d[k]|0;if((h&192|0)!=128){i=42;break L7}A=h-128|z<<6;B=p+3|0}else{A=y;B=g}}while(0);c[q>>2]=A;v=B;w=q+4|0;x=r-1|0;i=6;continue}else if((i|0)==6){i=0;if((x|0)==0){C=f;i=57;break}else{D=x;E=w;F=v}while(1){g=a[F]|0;L20:do{if(((g&255)-1|0)>>>0<127>>>0){if((F&3|0)==0&D>>>0>3>>>0){G=F;H=E;I=D}else{J=F;K=E;L=D;M=g;break}while(1){h=c[G>>2]|0;if(((h-16843009|h)&-2139062144|0)!=0){J=G;K=H;L=I;M=h&255;break L20}c[H>>2]=h&255;c[H+4>>2]=d[G+1|0]|0;c[H+8>>2]=d[G+2|0]|0;N=G+4|0;O=H+16|0;c[H+12>>2]=d[G+3|0]|0;P=I-4|0;if(P>>>0>3>>>0){G=N;H=O;I=P}else{break}}J=N;K=O;L=P;M=a[N]|0}else{J=F;K=E;L=D;M=g}}while(0);Q=M&255;if((Q-1|0)>>>0>=127>>>0){break}c[K>>2]=Q;g=L-1|0;if((g|0)==0){C=f;i=53;break L7}else{D=g;E=K+4|0;F=J+1|0}}g=Q-194|0;if(g>>>0>50>>>0){R=L;S=K;T=J;i=46;break}o=c[s+(g<<2)>>2]|0;p=J+1|0;q=K;r=L;i=35;continue}else if((i|0)==7){i=0;g=a[t]|0;do{if(((g&255)-1|0)>>>0<127>>>0){if((t&3|0)!=0){U=t;V=u;W=g;break}h=c[t>>2]|0;if(((h-16843009|h)&-2139062144|0)==0){X=u;Y=t}else{U=t;V=u;W=h&255;break}do{Y=Y+4|0;X=X-4|0;Z=c[Y>>2]|0;}while(((Z-16843009|Z)&-2139062144|0)==0);U=Y;V=X;W=Z&255}else{U=t;V=u;W=g}}while(0);g=W&255;if((g-1|0)>>>0<127>>>0){t=U+1|0;u=V-1|0;i=7;continue}h=g-194|0;if(h>>>0>50>>>0){R=V;S=b;T=U;i=46;break}l=c[s+(h<<2)>>2]|0;m=U+1|0;n=V;i=16;continue}else if((i|0)==16){i=0;h=(d[m]|0)>>>3;if((h-16|h+(l>>26))>>>0>7>>>0){i=17;break}h=m+1|0;do{if((l&33554432|0)==0){_=h}else{if((a[h]&-64)<<24>>24!=-128){i=20;break L7}g=m+2|0;if((l&524288|0)==0){_=g;break}if((a[g]&-64)<<24>>24!=-128){i=23;break L7}_=m+3|0}}while(0);t=_;u=n-1|0;i=7;continue}}if((i|0)==17){$=l;aa=m-1|0;ba=b;ca=n;i=45}else if((i|0)==20){$=l;aa=m-1|0;ba=b;ca=n;i=45}else if((i|0)==23){$=l;aa=m-1|0;ba=b;ca=n;i=45}else if((i|0)==36){$=o;aa=p-1|0;ba=q;ca=r;i=45}else if((i|0)==39){$=y;aa=p-1|0;ba=q;ca=r;i=45}else if((i|0)==42){$=z;aa=p-1|0;ba=q;ca=r;i=45}else if((i|0)==53){return C|0}else if((i|0)==57){return C|0}if((i|0)==45){if(($|0)==0){R=ca;S=ba;T=aa;i=46}else{da=ba;ea=aa}}do{if((i|0)==46){if((a[T]|0)!=0){da=S;ea=T;break}if((S|0)!=0){c[S>>2]=0;c[e>>2]=0}C=f-R|0;return C|0}}while(0);c[(Gb()|0)>>2]=84;if((da|0)==0){C=-1;return C|0}c[e>>2]=ea;C=-1;return C|0}function am(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;if((e|0)==0){j=0;i=g;return j|0}do{if((f|0)!=0){if((b|0)==0){k=h;c[h>>2]=k;l=k}else{l=b}k=a[e]|0;m=k&255;if(k<<24>>24>-1){c[l>>2]=m;j=k<<24>>24!=0|0;i=g;return j|0}k=m-194|0;if(k>>>0>50>>>0){break}m=e+1|0;n=c[s+(k<<2)>>2]|0;if(f>>>0<4>>>0){if((n&-2147483648>>>(((f*6|0)-6|0)>>>0)|0)!=0){break}}k=d[m]|0;m=k>>>3;if((m-16|m+(n>>26))>>>0>7>>>0){break}m=k-128|n<<6;if((m|0)>=0){c[l>>2]=m;j=2;i=g;return j|0}n=d[e+2|0]|0;if((n&192|0)!=128){break}k=n-128|m<<6;if((k|0)>=0){c[l>>2]=k;j=3;i=g;return j|0}m=d[e+3|0]|0;if((m&192|0)!=128){break}c[l>>2]=m-128|k<<6;j=4;i=g;return j|0}}while(0);c[(Gb()|0)>>2]=84;j=-1;i=g;return j|0}function bm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((b|0)==0){f=1;return f|0}if(d>>>0<128>>>0){a[b]=d;f=1;return f|0}if(d>>>0<2048>>>0){a[b]=d>>>6|192;a[b+1|0]=d&63|128;f=2;return f|0}if(d>>>0<55296>>>0|(d&-8192|0)==57344){a[b]=d>>>12|224;a[b+1|0]=d>>>6&63|128;a[b+2|0]=d&63|128;f=3;return f|0}if((d-65536|0)>>>0<1048576>>>0){a[b]=d>>>18|240;a[b+1|0]=d>>>12&63|128;a[b+2|0]=d>>>6&63|128;a[b+3|0]=d&63|128;f=4;return f|0}else{c[(Gb()|0)>>2]=84;f=-1;return f|0}return 0}function cm(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+264|0;g=f+256|0;h=c[b>>2]|0;c[g>>2]=h;j=(a|0)!=0;k=f|0;l=j?e:256;e=j?a:k;L1:do{if((h|0)!=0&(l|0)!=0){a=l;m=d;n=0;o=e;p=h;while(1){q=m>>>0>=a>>>0;if(!(q|m>>>0>32>>>0)){r=a;s=m;t=n;u=o;v=p;w=7;break L1}x=q?a:m;q=m-x|0;y=dm(o,g,x,0)|0;if((y|0)==-1){z=-1;break L1}if((o|0)==(k|0)){A=k;B=a}else{A=o+y|0;B=a-y|0}x=y+n|0;y=c[g>>2]|0;if((y|0)!=0&(B|0)!=0){a=B;m=q;n=x;o=A;p=y}else{r=B;s=q;t=x;u=A;v=y;w=7;break}}}else{r=l;s=d;t=0;u=e;v=h;w=7}}while(0);L9:do{if((w|0)==7){if((v|0)!=0&(r|0)!=0&(s|0)!=0){C=u;D=t;E=s;F=r;G=v}else{z=t;break}while(1){H=bm(C,c[G>>2]|0,0)|0;if((H+1|0)>>>0<2>>>0){break}h=(c[g>>2]|0)+4|0;c[g>>2]=h;e=E-1|0;d=D+1|0;if((F|0)!=(H|0)&(e|0)!=0){C=C+H|0;D=d;E=e;F=F-H|0;G=h}else{z=d;break L9}}if((H|0)!=0){z=-1;break}c[g>>2]=0;z=D}}while(0);if(!j){i=f;return z|0}c[b>>2]=c[g>>2];i=f;return z|0}function dm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+8|0;g=f|0;if((b|0)==0){h=c[d>>2]|0;j=g|0;k=c[h>>2]|0;if((k|0)==0){l=0;i=f;return l|0}else{m=0;n=h;o=k}while(1){if(o>>>0>127>>>0){k=bm(j,o,0)|0;if((k|0)==-1){l=-1;p=32;break}else{q=k}}else{q=1}k=q+m|0;h=n+4|0;r=c[h>>2]|0;if((r|0)==0){l=k;p=28;break}else{m=k;n=h;o=r}}if((p|0)==28){i=f;return l|0}else if((p|0)==32){i=f;return l|0}}L14:do{if(e>>>0>3>>>0){o=e;n=b;m=c[d>>2]|0;while(1){q=c[m>>2]|0;if((q|0)==0){s=o;t=n;break L14}if(q>>>0>127>>>0){j=bm(n,q,0)|0;if((j|0)==-1){l=-1;break}u=n+j|0;v=o-j|0;w=m}else{a[n]=q;u=n+1|0;v=o-1|0;w=c[d>>2]|0}q=w+4|0;c[d>>2]=q;if(v>>>0>3>>>0){o=v;n=u;m=q}else{s=v;t=u;break L14}}i=f;return l|0}else{s=e;t=b}}while(0);L26:do{if((s|0)==0){x=0}else{b=g|0;u=s;v=t;w=c[d>>2]|0;while(1){m=c[w>>2]|0;if((m|0)==0){p=24;break}if(m>>>0>127>>>0){n=bm(b,m,0)|0;if((n|0)==-1){l=-1;p=31;break}if(u>>>0<n>>>0){p=20;break}bm(v,c[w>>2]|0,0)|0;y=v+n|0;z=u-n|0;A=w}else{a[v]=m;y=v+1|0;z=u-1|0;A=c[d>>2]|0}m=A+4|0;c[d>>2]=m;if((z|0)==0){x=0;break L26}else{u=z;v=y;w=m}}if((p|0)==24){a[v]=0;x=u;break}else if((p|0)==31){i=f;return l|0}else if((p|0)==20){l=e-u|0;i=f;return l|0}}}while(0);c[d>>2]=0;l=e-x|0;i=f;return l|0}function em(a){a=a|0;var b=0;b=a;while(1){if((c[b>>2]|0)==0){break}else{b=b+4|0}}return b-a>>2|0}function fm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((d|0)==0){return a|0}else{e=b;f=d;g=a}while(1){d=f-1|0;c[g>>2]=c[e>>2];if((d|0)==0){break}else{e=e+4|0;f=d;g=g+4|0}}return a|0}function gm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=(d|0)==0;if(a-b>>2>>>0<d>>>0){if(e){return a|0}else{f=d}do{f=f-1|0;c[a+(f<<2)>>2]=c[b+(f<<2)>>2];}while((f|0)!=0);return a|0}else{if(e){return a|0}else{g=b;h=d;i=a}while(1){d=h-1|0;c[i>>2]=c[g>>2];if((d|0)==0){break}else{g=g+4|0;h=d;i=i+4|0}}return a|0}return 0}function hm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;if((d|0)==0){return a|0}else{e=d;f=a}while(1){d=e-1|0;c[f>>2]=b;if((d|0)==0){break}else{e=d;f=f+4|0}}return a|0}function im(a){a=a|0;return}function jm(a){a=a|0;c[a>>2]=2400;return}function km(a){a=a|0;Lm(a);return}function lm(a){a=a|0;return}function mm(a){a=a|0;return 1344}function nm(a){a=a|0;return}function om(a){a=a|0;return}function pm(a){a=a|0;im(a|0);Lm(a);return}function qm(a){a=a|0;im(a|0);return}function rm(a){a=a|0;im(a|0);Lm(a);return}function sm(a){a=a|0;im(a|0);return}function tm(a){a=a|0;im(a|0);Lm(a);return}function um(a){a=a|0;im(a|0);return}function vm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=zm(b,9616,9600,0)|0;b=h;if((h|0)==0){g=0;i=e;return g|0}bn(f|0,0,56)|0;c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;gc[c[(c[h>>2]|0)+28>>2]&15](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function wm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function xm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;gc[c[(c[g>>2]|0)+28>>2]&15](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function ym(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;gc[c[(c[j>>2]|0)+28>>2]&15](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;gc[c[(c[j>>2]|0)+28>>2]&15](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)!=0){m=22;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=17;break}}if((m|0)==22){return}else if((m|0)==17){return}}function zm(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+56|0;g=f|0;h=c[a>>2]|0;j=a+(c[h-8>>2]|0)|0;k=c[h-4>>2]|0;h=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;e=g+16|0;b=g+20|0;a=g+24|0;l=g+28|0;m=g+32|0;n=g+40|0;bn(e|0,0,39)|0;if((k|0)==(d|0)){c[g+48>>2]=1;tc[c[(c[k>>2]|0)+20>>2]&31](h,g,j,j,1,0);i=f;return((c[a>>2]|0)==1?j:0)|0}hc[c[(c[k>>2]|0)+24>>2]&7](h,g,j,1,0);j=c[g+36>>2]|0;if((j|0)==1){do{if((c[a>>2]|0)!=1){if((c[n>>2]|0)==0&(c[l>>2]|0)==1&(c[m>>2]|0)==1){break}else{o=0}i=f;return o|0}}while(0);o=c[e>>2]|0;i=f;return o|0}else if((j|0)==0){i=f;return((c[n>>2]|0)==1&(c[l>>2]|0)==1&(c[m>>2]|0)==1?c[b>>2]|0:0)|0}else{o=0;i=f;return o|0}return 0}function Am(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L19:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L21:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;tc[c[(c[v>>2]|0)+20>>2]&31](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)!=0){x=t;y=r;break}do{if((a[m]&1)==0){z=t;A=r}else{if((a[l]&1)==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L21}else{z=1;A=r;break}}if((c[p>>2]|0)==1){B=27;break L19}if((c[o>>2]&2|0)==0){B=27;break L19}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if(y){C=x;B=26}else{D=x;B=23}}else{D=0;B=23}}while(0);do{if((B|0)==23){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;if((c[d+36>>2]|0)!=1){C=D;B=26;break}if((c[d+24>>2]|0)!=2){C=D;B=26;break}a[d+54|0]=1;if(D){B=27}else{B=28}}}while(0);if((B|0)==26){if(C){B=27}else{B=28}}if((B|0)==27){c[i>>2]=3;return}else if((B|0)==28){c[i>>2]=4;return}}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}C=c[b+12>>2]|0;D=b+16+(C<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;hc[c[(c[y>>2]|0)+24>>2]&7](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((C|0)<=1){return}C=c[b+8>>2]|0;do{if((C&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((C&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)!=0){B=65;break}if((c[b>>2]|0)==1){B=66;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;hc[c[(c[w>>2]|0)+24>>2]&7](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<D>>>0){A=z}else{B=67;break}}if((B|0)==65){return}else if((B|0)==66){return}else if((B|0)==67){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)!=0){B=62;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){B=63;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;hc[c[(c[w>>2]|0)+24>>2]&7](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<D>>>0){i=z}else{B=64;break}}if((B|0)==62){return}else if((B|0)==63){return}else if((B|0)==64){return}}}while(0);G=d+54|0;F=e;C=x;while(1){if((a[G]&1)!=0){B=60;break}x=c[C+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[C>>2]|0;hc[c[(c[i>>2]|0)+24>>2]&7](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=C+8|0;if(x>>>0<D>>>0){C=x}else{B=61;break}}if((B|0)==60){return}else if((B|0)==61){return}}function Bm(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;hc[c[(c[h>>2]|0)+24>>2]&7](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;tc[c[(c[l>>2]|0)+20>>2]&31](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=13}else{if((a[j]&1)==0){m=1;n=13}}L23:do{if((n|0)==13){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=16;break}a[d+54|0]=1;if(m){break L23}}else{n=16}}while(0);if((n|0)==16){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function Cm(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function Dm(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;tc[c[(c[p>>2]|0)+20>>2]&31](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L6:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;do{if((a[p]&1)!=0){break L6}do{if((a[i]&1)==0){if((a[k]&1)==0){break}if((c[q>>2]&1|0)==0){break L6}}else{if((c[o>>2]|0)==1){break L6}if((c[q>>2]&2|0)==0){break L6}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;tc[c[(c[u>>2]|0)+20>>2]&31](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);s=s+8|0;}while(s>>>0<n>>>0)}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function Em(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;tc[c[(c[i>>2]|0)+20>>2]&31](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function Fm(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function Gm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[12210]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=48880+(h<<2)|0;j=48880+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[12210]=e&~(1<<g)}else{if(l>>>0<(c[12214]|0)>>>0){Rb();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{Rb();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[12212]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=48880+(p<<2)|0;m=48880+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[12210]=e&~(1<<r)}else{if(l>>>0<(c[12214]|0)>>>0){Rb();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{Rb();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[12212]|0;if((l|0)!=0){q=c[12215]|0;d=l>>>3;l=d<<1;f=48880+(l<<2)|0;k=c[12210]|0;h=1<<d;do{if((k&h|0)==0){c[12210]=k|h;s=f;t=48880+(l+2<<2)|0}else{d=48880+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[12214]|0)>>>0){s=g;t=d;break}Rb();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[12212]=m;c[12215]=e;n=i;return n|0}l=c[12211]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[49144+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[12214]|0;if(r>>>0<i>>>0){Rb();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){Rb();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){Rb();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){Rb();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){Rb();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{Rb();return 0}}}while(0);L199:do{if((e|0)!=0){f=d+28|0;i=49144+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[12211]=c[12211]&~(1<<c[f>>2]);break L199}else{if(e>>>0<(c[12214]|0)>>>0){Rb();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L199}}}while(0);if(v>>>0<(c[12214]|0)>>>0){Rb();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[12212]|0;if((f|0)!=0){e=c[12215]|0;i=f>>>3;f=i<<1;q=48880+(f<<2)|0;k=c[12210]|0;g=1<<i;do{if((k&g|0)==0){c[12210]=k|g;y=q;z=48880+(f+2<<2)|0}else{i=48880+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[12214]|0)>>>0){y=l;z=i;break}Rb();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[12212]=p;c[12215]=m}n=d+8|0;return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[12211]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[49144+(A<<2)>>2]|0;L9:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L9}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[49144+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[12212]|0)-g|0)>>>0){o=g;break}q=K;m=c[12214]|0;if(q>>>0<m>>>0){Rb();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){Rb();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){Rb();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){Rb();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){Rb();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{Rb();return 0}}}while(0);L59:do{if((e|0)!=0){i=K+28|0;m=49144+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[12211]=c[12211]&~(1<<c[i>>2]);break L59}else{if(e>>>0<(c[12214]|0)>>>0){Rb();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L59}}}while(0);if(L>>>0<(c[12214]|0)>>>0){Rb();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);L87:do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=48880+(e<<2)|0;r=c[12210]|0;j=1<<i;do{if((r&j|0)==0){c[12210]=r|j;O=m;P=48880+(e+2<<2)|0}else{i=48880+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[12214]|0)>>>0){O=d;P=i;break}Rb();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=49144+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[12211]|0;l=1<<Q;if((m&l|0)==0){c[12211]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}l=c[j>>2]|0;if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}L108:do{if((c[l+4>>2]&-8|0)==(J|0)){S=l}else{j=l;m=J<<R;while(1){T=j+16+(m>>>31<<2)|0;i=c[T>>2]|0;if((i|0)==0){break}if((c[i+4>>2]&-8|0)==(J|0)){S=i;break L108}else{j=i;m=m<<1}}if(T>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[T>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break L87}}}while(0);l=S+8|0;m=c[l>>2]|0;i=c[12214]|0;if(S>>>0>=i>>>0&m>>>0>=i>>>0){c[m+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=m;c[q+(g+12)>>2]=S;c[q+(g+24)>>2]=0;break}else{Rb();return 0}}}while(0);n=K+8|0;return n|0}}while(0);K=c[12212]|0;if(K>>>0>=o>>>0){S=K-o|0;T=c[12215]|0;if(S>>>0>15>>>0){J=T;c[12215]=J+o;c[12212]=S;c[J+(o+4)>>2]=S|1;c[J+K>>2]=S;c[T+4>>2]=o|3}else{c[12212]=0;c[12215]=0;c[T+4>>2]=K|3;S=T+(K+4)|0;c[S>>2]=c[S>>2]|1}n=T+8|0;return n|0}T=c[12213]|0;if(T>>>0>o>>>0){S=T-o|0;c[12213]=S;T=c[12216]|0;K=T;c[12216]=K+o;c[K+(o+4)>>2]=S|1;c[T+4>>2]=o|3;n=T+8|0;return n|0}do{if((c[12200]|0)==0){T=Pb(30)|0;if((T-1&T|0)==0){c[12202]=T;c[12201]=T;c[12203]=-1;c[12204]=-1;c[12205]=0;c[12321]=0;c[12200]=(dc(0)|0)&-16^1431655768;break}else{Rb();return 0}}}while(0);T=o+48|0;S=c[12202]|0;K=o+47|0;J=S+K|0;R=-S|0;S=J&R;if(S>>>0<=o>>>0){n=0;return n|0}Q=c[12320]|0;do{if((Q|0)!=0){O=c[12318]|0;P=O+S|0;if(P>>>0<=O>>>0|P>>>0>Q>>>0){n=0}else{break}return n|0}}while(0);L266:do{if((c[12321]&4|0)==0){Q=c[12216]|0;L268:do{if((Q|0)==0){U=181}else{P=Q;O=49288;while(1){V=O|0;L=c[V>>2]|0;if(L>>>0<=P>>>0){W=O+4|0;if((L+(c[W>>2]|0)|0)>>>0>P>>>0){break}}L=c[O+8>>2]|0;if((L|0)==0){U=181;break L268}else{O=L}}if((O|0)==0){U=181;break}P=J-(c[12213]|0)&R;if(P>>>0>=2147483647>>>0){X=0;break}e=Fb(P|0)|0;if((e|0)==((c[V>>2]|0)+(c[W>>2]|0)|0)){Y=e;Z=P;U=190}else{_=P;$=e;U=191}}}while(0);do{if((U|0)==181){Q=Fb(0)|0;if((Q|0)==-1){X=0;break}e=Q;P=c[12201]|0;L=P-1|0;if((L&e|0)==0){aa=S}else{aa=S-e+(L+e&-P)|0}P=c[12318]|0;e=P+aa|0;if(!(aa>>>0>o>>>0&aa>>>0<2147483647>>>0)){X=0;break}L=c[12320]|0;if((L|0)!=0){if(e>>>0<=P>>>0|e>>>0>L>>>0){X=0;break}}L=Fb(aa|0)|0;if((L|0)==(Q|0)){Y=Q;Z=aa;U=190}else{_=aa;$=L;U=191}}}while(0);L288:do{if((U|0)==190){if((Y|0)==-1){X=Z}else{ba=Z;ca=Y;U=201;break L266}}else if((U|0)==191){L=-_|0;do{if(($|0)!=-1&_>>>0<2147483647>>>0&T>>>0>_>>>0){Q=c[12202]|0;e=K-_+Q&-Q;if(e>>>0>=2147483647>>>0){da=_;break}if((Fb(e|0)|0)==-1){Fb(L|0)|0;X=0;break L288}else{da=e+_|0;break}}else{da=_}}while(0);if(($|0)==-1){X=0}else{ba=da;ca=$;U=201;break L266}}}while(0);c[12321]=c[12321]|4;ea=X;U=198}else{ea=0;U=198}}while(0);do{if((U|0)==198){if(S>>>0>=2147483647>>>0){break}X=Fb(S|0)|0;$=Fb(0)|0;if(!((X|0)!=-1&($|0)!=-1&X>>>0<$>>>0)){break}da=$-X|0;$=da>>>0>(o+40|0)>>>0;if($){ba=$?da:ea;ca=X;U=201}}}while(0);do{if((U|0)==201){ea=(c[12318]|0)+ba|0;c[12318]=ea;if(ea>>>0>(c[12319]|0)>>>0){c[12319]=ea}ea=c[12216]|0;L308:do{if((ea|0)==0){S=c[12214]|0;if((S|0)==0|ca>>>0<S>>>0){c[12214]=ca}c[12322]=ca;c[12323]=ba;c[12325]=0;c[12219]=c[12200];c[12218]=-1;S=0;do{X=S<<1;da=48880+(X<<2)|0;c[48880+(X+3<<2)>>2]=da;c[48880+(X+2<<2)>>2]=da;S=S+1|0;}while(S>>>0<32>>>0);S=ca+8|0;if((S&7|0)==0){fa=0}else{fa=-S&7}S=ba-40-fa|0;c[12216]=ca+fa;c[12213]=S;c[ca+(fa+4)>>2]=S|1;c[ca+(ba-36)>>2]=40;c[12217]=c[12204]}else{S=49288;while(1){ga=c[S>>2]|0;ha=S+4|0;ia=c[ha>>2]|0;if((ca|0)==(ga+ia|0)){U=213;break}da=c[S+8>>2]|0;if((da|0)==0){break}else{S=da}}do{if((U|0)==213){if((c[S+12>>2]&8|0)!=0){break}da=ea;if(!(da>>>0>=ga>>>0&da>>>0<ca>>>0)){break}c[ha>>2]=ia+ba;da=c[12216]|0;X=(c[12213]|0)+ba|0;$=da;_=da+8|0;if((_&7|0)==0){ja=0}else{ja=-_&7}_=X-ja|0;c[12216]=$+ja;c[12213]=_;c[$+(ja+4)>>2]=_|1;c[$+(X+4)>>2]=40;c[12217]=c[12204];break L308}}while(0);if(ca>>>0<(c[12214]|0)>>>0){c[12214]=ca}S=ca+ba|0;X=49288;while(1){ka=X|0;if((c[ka>>2]|0)==(S|0)){U=223;break}$=c[X+8>>2]|0;if(($|0)==0){break}else{X=$}}do{if((U|0)==223){if((c[X+12>>2]&8|0)!=0){break}c[ka>>2]=ca;S=X+4|0;c[S>>2]=(c[S>>2]|0)+ba;S=ca+8|0;if((S&7|0)==0){la=0}else{la=-S&7}S=ca+(ba+8)|0;if((S&7|0)==0){ma=0}else{ma=-S&7}S=ca+(ma+ba)|0;$=S;_=la+o|0;da=ca+_|0;K=da;T=S-(ca+la)-o|0;c[ca+(la+4)>>2]=o|3;L345:do{if(($|0)==(c[12216]|0)){Y=(c[12213]|0)+T|0;c[12213]=Y;c[12216]=K;c[ca+(_+4)>>2]=Y|1}else{if(($|0)==(c[12215]|0)){Y=(c[12212]|0)+T|0;c[12212]=Y;c[12215]=K;c[ca+(_+4)>>2]=Y|1;c[ca+(Y+_)>>2]=Y;break}Y=ba+4|0;Z=c[ca+(Y+ma)>>2]|0;if((Z&3|0)==1){aa=Z&-8;W=Z>>>3;L353:do{if(Z>>>0<256>>>0){V=c[ca+((ma|8)+ba)>>2]|0;R=c[ca+(ba+12+ma)>>2]|0;J=48880+(W<<1<<2)|0;do{if((V|0)!=(J|0)){if(V>>>0<(c[12214]|0)>>>0){Rb();return 0}if((c[V+12>>2]|0)==($|0)){break}Rb();return 0}}while(0);if((R|0)==(V|0)){c[12210]=c[12210]&~(1<<W);break}do{if((R|0)==(J|0)){na=R+8|0}else{if(R>>>0<(c[12214]|0)>>>0){Rb();return 0}L=R+8|0;if((c[L>>2]|0)==($|0)){na=L;break}Rb();return 0}}while(0);c[V+12>>2]=R;c[na>>2]=V}else{J=S;L=c[ca+((ma|24)+ba)>>2]|0;O=c[ca+(ba+12+ma)>>2]|0;do{if((O|0)==(J|0)){e=ma|16;Q=ca+(Y+e)|0;P=c[Q>>2]|0;if((P|0)==0){M=ca+(e+ba)|0;e=c[M>>2]|0;if((e|0)==0){oa=0;break}else{pa=e;qa=M}}else{pa=P;qa=Q}while(1){Q=pa+20|0;P=c[Q>>2]|0;if((P|0)!=0){pa=P;qa=Q;continue}Q=pa+16|0;P=c[Q>>2]|0;if((P|0)==0){break}else{pa=P;qa=Q}}if(qa>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[qa>>2]=0;oa=pa;break}}else{Q=c[ca+((ma|8)+ba)>>2]|0;if(Q>>>0<(c[12214]|0)>>>0){Rb();return 0}P=Q+12|0;if((c[P>>2]|0)!=(J|0)){Rb();return 0}M=O+8|0;if((c[M>>2]|0)==(J|0)){c[P>>2]=O;c[M>>2]=Q;oa=O;break}else{Rb();return 0}}}while(0);if((L|0)==0){break}O=ca+(ba+28+ma)|0;V=49144+(c[O>>2]<<2)|0;do{if((J|0)==(c[V>>2]|0)){c[V>>2]=oa;if((oa|0)!=0){break}c[12211]=c[12211]&~(1<<c[O>>2]);break L353}else{if(L>>>0<(c[12214]|0)>>>0){Rb();return 0}R=L+16|0;if((c[R>>2]|0)==(J|0)){c[R>>2]=oa}else{c[L+20>>2]=oa}if((oa|0)==0){break L353}}}while(0);if(oa>>>0<(c[12214]|0)>>>0){Rb();return 0}c[oa+24>>2]=L;J=ma|16;O=c[ca+(J+ba)>>2]|0;do{if((O|0)!=0){if(O>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[oa+16>>2]=O;c[O+24>>2]=oa;break}}}while(0);O=c[ca+(Y+J)>>2]|0;if((O|0)==0){break}if(O>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[oa+20>>2]=O;c[O+24>>2]=oa;break}}}while(0);ra=ca+((aa|ma)+ba)|0;sa=aa+T|0}else{ra=$;sa=T}Y=ra+4|0;c[Y>>2]=c[Y>>2]&-2;c[ca+(_+4)>>2]=sa|1;c[ca+(sa+_)>>2]=sa;Y=sa>>>3;if(sa>>>0<256>>>0){W=Y<<1;Z=48880+(W<<2)|0;O=c[12210]|0;L=1<<Y;do{if((O&L|0)==0){c[12210]=O|L;ta=Z;ua=48880+(W+2<<2)|0}else{Y=48880+(W+2<<2)|0;V=c[Y>>2]|0;if(V>>>0>=(c[12214]|0)>>>0){ta=V;ua=Y;break}Rb();return 0}}while(0);c[ua>>2]=K;c[ta+12>>2]=K;c[ca+(_+8)>>2]=ta;c[ca+(_+12)>>2]=Z;break}W=da;L=sa>>>8;do{if((L|0)==0){va=0}else{if(sa>>>0>16777215>>>0){va=31;break}O=(L+1048320|0)>>>16&8;aa=L<<O;Y=(aa+520192|0)>>>16&4;V=aa<<Y;aa=(V+245760|0)>>>16&2;R=14-(Y|O|aa)+(V<<aa>>>15)|0;va=sa>>>((R+7|0)>>>0)&1|R<<1}}while(0);L=49144+(va<<2)|0;c[ca+(_+28)>>2]=va;c[ca+(_+20)>>2]=0;c[ca+(_+16)>>2]=0;Z=c[12211]|0;R=1<<va;if((Z&R|0)==0){c[12211]=Z|R;c[L>>2]=W;c[ca+(_+24)>>2]=L;c[ca+(_+12)>>2]=W;c[ca+(_+8)>>2]=W;break}R=c[L>>2]|0;if((va|0)==31){wa=0}else{wa=25-(va>>>1)|0}L442:do{if((c[R+4>>2]&-8|0)==(sa|0)){xa=R}else{L=R;Z=sa<<wa;while(1){ya=L+16+(Z>>>31<<2)|0;aa=c[ya>>2]|0;if((aa|0)==0){break}if((c[aa+4>>2]&-8|0)==(sa|0)){xa=aa;break L442}else{L=aa;Z=Z<<1}}if(ya>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[ya>>2]=W;c[ca+(_+24)>>2]=L;c[ca+(_+12)>>2]=W;c[ca+(_+8)>>2]=W;break L345}}}while(0);R=xa+8|0;Z=c[R>>2]|0;J=c[12214]|0;if(xa>>>0>=J>>>0&Z>>>0>=J>>>0){c[Z+12>>2]=W;c[R>>2]=W;c[ca+(_+8)>>2]=Z;c[ca+(_+12)>>2]=xa;c[ca+(_+24)>>2]=0;break}else{Rb();return 0}}}while(0);n=ca+(la|8)|0;return n|0}}while(0);X=ea;_=49288;while(1){za=c[_>>2]|0;if(za>>>0<=X>>>0){Aa=c[_+4>>2]|0;Ba=za+Aa|0;if(Ba>>>0>X>>>0){break}}_=c[_+8>>2]|0}_=za+(Aa-39)|0;if((_&7|0)==0){Ca=0}else{Ca=-_&7}_=za+(Aa-47+Ca)|0;da=_>>>0<(ea+16|0)>>>0?X:_;_=da+8|0;K=ca+8|0;if((K&7|0)==0){Da=0}else{Da=-K&7}K=ba-40-Da|0;c[12216]=ca+Da;c[12213]=K;c[ca+(Da+4)>>2]=K|1;c[ca+(ba-36)>>2]=40;c[12217]=c[12204];c[da+4>>2]=27;c[_>>2]=c[12322];c[_+4>>2]=c[12323];c[_+8>>2]=c[12324];c[_+12>>2]=c[12325];c[12322]=ca;c[12323]=ba;c[12325]=0;c[12324]=_;_=da+28|0;c[_>>2]=7;if((da+32|0)>>>0<Ba>>>0){K=_;while(1){_=K+4|0;c[_>>2]=7;if((K+8|0)>>>0<Ba>>>0){K=_}else{break}}}if((da|0)==(X|0)){break}K=da-ea|0;_=X+(K+4)|0;c[_>>2]=c[_>>2]&-2;c[ea+4>>2]=K|1;c[X+K>>2]=K;_=K>>>3;if(K>>>0<256>>>0){T=_<<1;$=48880+(T<<2)|0;S=c[12210]|0;j=1<<_;do{if((S&j|0)==0){c[12210]=S|j;Ea=$;Fa=48880+(T+2<<2)|0}else{_=48880+(T+2<<2)|0;Z=c[_>>2]|0;if(Z>>>0>=(c[12214]|0)>>>0){Ea=Z;Fa=_;break}Rb();return 0}}while(0);c[Fa>>2]=ea;c[Ea+12>>2]=ea;c[ea+8>>2]=Ea;c[ea+12>>2]=$;break}T=ea;j=K>>>8;do{if((j|0)==0){Ga=0}else{if(K>>>0>16777215>>>0){Ga=31;break}S=(j+1048320|0)>>>16&8;X=j<<S;da=(X+520192|0)>>>16&4;_=X<<da;X=(_+245760|0)>>>16&2;Z=14-(da|S|X)+(_<<X>>>15)|0;Ga=K>>>((Z+7|0)>>>0)&1|Z<<1}}while(0);j=49144+(Ga<<2)|0;c[ea+28>>2]=Ga;c[ea+20>>2]=0;c[ea+16>>2]=0;$=c[12211]|0;Z=1<<Ga;if(($&Z|0)==0){c[12211]=$|Z;c[j>>2]=T;c[ea+24>>2]=j;c[ea+12>>2]=ea;c[ea+8>>2]=ea;break}Z=c[j>>2]|0;if((Ga|0)==31){Ha=0}else{Ha=25-(Ga>>>1)|0}L493:do{if((c[Z+4>>2]&-8|0)==(K|0)){Ia=Z}else{j=Z;$=K<<Ha;while(1){Ja=j+16+($>>>31<<2)|0;X=c[Ja>>2]|0;if((X|0)==0){break}if((c[X+4>>2]&-8|0)==(K|0)){Ia=X;break L493}else{j=X;$=$<<1}}if(Ja>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[Ja>>2]=T;c[ea+24>>2]=j;c[ea+12>>2]=ea;c[ea+8>>2]=ea;break L308}}}while(0);K=Ia+8|0;Z=c[K>>2]|0;$=c[12214]|0;if(Ia>>>0>=$>>>0&Z>>>0>=$>>>0){c[Z+12>>2]=T;c[K>>2]=T;c[ea+8>>2]=Z;c[ea+12>>2]=Ia;c[ea+24>>2]=0;break}else{Rb();return 0}}}while(0);ea=c[12213]|0;if(ea>>>0<=o>>>0){break}Z=ea-o|0;c[12213]=Z;ea=c[12216]|0;K=ea;c[12216]=K+o;c[K+(o+4)>>2]=Z|1;c[ea+4>>2]=o|3;n=ea+8|0;return n|0}}while(0);c[(Gb()|0)>>2]=12;n=0;return n|0}function Hm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[12214]|0;if(b>>>0<e>>>0){Rb()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){Rb()}h=f&-8;i=a+(h-8)|0;j=i;L10:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){Rb()}if((n|0)==(c[12215]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[12212]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=48880+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){Rb()}if((c[k+12>>2]|0)==(n|0)){break}Rb()}}while(0);if((s|0)==(k|0)){c[12210]=c[12210]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){Rb()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}Rb()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){Rb()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){Rb()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){Rb()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{Rb()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=49144+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[12211]=c[12211]&~(1<<c[v>>2]);q=n;r=o;break L10}else{if(p>>>0<(c[12214]|0)>>>0){Rb()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L10}}}while(0);if(A>>>0<(c[12214]|0)>>>0){Rb()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[12214]|0)>>>0){Rb()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[12214]|0)>>>0){Rb()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){Rb()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){Rb()}do{if((e&2|0)==0){if((j|0)==(c[12216]|0)){B=(c[12213]|0)+r|0;c[12213]=B;c[12216]=q;c[q+4>>2]=B|1;if((q|0)!=(c[12215]|0)){return}c[12215]=0;c[12212]=0;return}if((j|0)==(c[12215]|0)){B=(c[12212]|0)+r|0;c[12212]=B;c[12215]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L112:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=48880+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[12214]|0)>>>0){Rb()}if((c[u+12>>2]|0)==(j|0)){break}Rb()}}while(0);if((g|0)==(u|0)){c[12210]=c[12210]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[12214]|0)>>>0){Rb()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}Rb()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[12214]|0)>>>0){Rb()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[12214]|0)>>>0){Rb()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){Rb()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{Rb()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=49144+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[12211]=c[12211]&~(1<<c[t>>2]);break L112}else{if(f>>>0<(c[12214]|0)>>>0){Rb()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L112}}}while(0);if(E>>>0<(c[12214]|0)>>>0){Rb()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[12214]|0)>>>0){Rb()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[12214]|0)>>>0){Rb()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[12215]|0)){H=B;break}c[12212]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=48880+(d<<2)|0;A=c[12210]|0;E=1<<r;do{if((A&E|0)==0){c[12210]=A|E;I=e;J=48880+(d+2<<2)|0}else{r=48880+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[12214]|0)>>>0){I=h;J=r;break}Rb()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=49144+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[12211]|0;d=1<<K;L199:do{if((r&d|0)==0){c[12211]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{A=c[I>>2]|0;if((K|0)==31){L=0}else{L=25-(K>>>1)|0}L205:do{if((c[A+4>>2]&-8|0)==(H|0)){M=A}else{J=A;E=H<<L;while(1){N=J+16+(E>>>31<<2)|0;h=c[N>>2]|0;if((h|0)==0){break}if((c[h+4>>2]&-8|0)==(H|0)){M=h;break L205}else{J=h;E=E<<1}}if(N>>>0<(c[12214]|0)>>>0){Rb()}else{c[N>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break L199}}}while(0);A=M+8|0;B=c[A>>2]|0;E=c[12214]|0;if(M>>>0>=E>>>0&B>>>0>=E>>>0){c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=M;c[q+24>>2]=0;break}else{Rb()}}}while(0);q=(c[12218]|0)-1|0;c[12218]=q;if((q|0)==0){O=49296}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[12218]=-1;return}function Im(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=Gm(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(Gb()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=Zm(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=Gm(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;an(f|0,a|0,g>>>0<b>>>0?g:b)|0;Hm(a);d=f;return d|0}function Jm(a){a=a|0;var b=0,d=0,e=0;b=(a|0)==0?1:a;while(1){d=Gm(b)|0;if((d|0)!=0){e=10;break}a=(I=c[13224]|0,c[13224]=I+0,I);if((a|0)==0){break}pc[a&1]()}if((e|0)==10){return d|0}d=Yb(4)|0;c[d>>2]=2368;vb(d|0,8072,34);return 0}function Km(a){a=a|0;return Jm(a)|0}function Lm(a){a=a|0;if((a|0)==0){return}Hm(a);return}function Mm(a){a=a|0;Lm(a);return}function Nm(a){a=a|0;Lm(a);return}function Om(a){a=a|0;return}function Pm(a){a=a|0;return 1064}function Qm(){var a=0;a=Yb(4)|0;c[a>>2]=2368;vb(a|0,8072,34)}function Rm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0.0,P=0.0,Q=0,R=0,S=0,T=0,U=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0.0,ea=0.0,fa=0,ha=0,ia=0.0,ja=0.0,ka=0,la=0.0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0.0,va=0,wa=0.0,xa=0,ya=0.0,za=0,Aa=0,Ba=0,Ca=0,Da=0.0,Ea=0,Fa=0.0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,zc=0,Ac=0,Bc=0,Cc=0,Dc=0,Ec=0,Fc=0,Gc=0,Hc=0,Ic=0.0,Jc=0,Kc=0,Lc=0,Mc=0,Nc=0.0,Oc=0.0,Pc=0.0,Qc=0,Rc=0,Sc=0.0,Tc=0.0,Uc=0.0,Vc=0.0,Wc=0,Xc=0,Yc=0.0,Zc=0,_c=0,$c=0,ad=0,bd=0,cd=0;g=i;i=i+512|0;h=g|0;if((e|0)==0){j=-149;k=24}else if((e|0)==1){j=-1074;k=53}else if((e|0)==2){j=-1074;k=53}else{l=0.0;i=g;return+l}e=b+4|0;m=b+100|0;do{n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;o=d[n]|0}else{o=Tm(b)|0}}while((Na(o|0)|0)!=0);do{if((o|0)==45|(o|0)==43){n=1-(((o|0)==45)<<1)|0;p=c[e>>2]|0;if(p>>>0<(c[m>>2]|0)>>>0){c[e>>2]=p+1;q=d[p]|0;r=n;break}else{q=Tm(b)|0;r=n;break}}else{q=o;r=1}}while(0);o=0;n=q;while(1){if((n|32|0)!=(a[592+o|0]|0)){s=o;t=n;break}do{if(o>>>0<7>>>0){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;u=d[q]|0;break}else{u=Tm(b)|0;break}}else{u=n}}while(0);q=o+1|0;if(q>>>0<8>>>0){o=q;n=u}else{s=q;t=u;break}}do{if((s|0)==3){x=23}else if((s|0)!=8){u=(f|0)!=0;if(s>>>0>3>>>0&u){if((s|0)==8){break}else{x=23;break}}L34:do{if((s|0)==0){n=0;o=t;while(1){if((o|32|0)!=(a[1528+n|0]|0)){y=o;z=n;break L34}do{if(n>>>0<2>>>0){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;A=d[q]|0;break}else{A=Tm(b)|0;break}}else{A=o}}while(0);q=n+1|0;if(q>>>0<3>>>0){n=q;o=A}else{y=A;z=q;break}}}else{y=t;z=s}}while(0);if((z|0)==0){do{if((y|0)==48){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;B=d[o]|0}else{B=Tm(b)|0}if((B|32|0)!=120){if((c[m>>2]|0)==0){C=48;break}c[e>>2]=(c[e>>2]|0)-1;C=48;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;E=0}else{D=Tm(b)|0;E=0}while(1){if((D|0)==46){x=70;break}else if((D|0)!=48){F=D;G=0;H=0;I=0;J=0;L=E;M=0;N=0;O=1.0;P=0.0;Q=0;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;E=1;continue}else{D=Tm(b)|0;E=1;continue}}do{if((x|0)==70){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;R=d[o]|0}else{R=Tm(b)|0}if((R|0)==48){S=0;T=0}else{F=R;G=0;H=0;I=0;J=0;L=E;M=1;N=0;O=1.0;P=0.0;Q=0;break}while(1){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;U=d[o]|0}else{U=Tm(b)|0}o=en(T,S,-1,-1)|0;n=K;if((U|0)==48){S=n;T=o}else{F=U;G=0;H=0;I=n;J=o;L=1;M=1;N=0;O=1.0;P=0.0;Q=0;break}}}}while(0);L78:while(1){o=F-48|0;do{if(o>>>0<10>>>0){W=o;x=83}else{n=F|32;q=(F|0)==46;if(!((n-97|0)>>>0<6>>>0|q)){X=F;break L78}if(q){if((M|0)==0){Y=G;Z=H;_=G;$=H;aa=L;ba=1;ca=N;da=O;ea=P;fa=Q;break}else{X=46;break L78}}else{W=(F|0)>57?n-87|0:o;x=83;break}}}while(0);if((x|0)==83){x=0;o=0;do{if((G|0)<(o|0)|(G|0)==(o|0)&H>>>0<8>>>0){ha=N;ia=O;ja=P;ka=W+(Q<<4)|0}else{n=0;if((G|0)<(n|0)|(G|0)==(n|0)&H>>>0<14>>>0){la=O*.0625;ha=N;ia=la;ja=P+la*+(W|0);ka=Q;break}if((W|0)==0|(N|0)!=0){ha=N;ia=O;ja=P;ka=Q;break}ha=1;ia=O;ja=P+O*.5;ka=Q}}while(0);o=en(H,G,1,0)|0;Y=K;Z=o;_=I;$=J;aa=1;ba=M;ca=ha;da=ia;ea=ja;fa=ka}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;F=d[o]|0;G=Y;H=Z;I=_;J=$;L=aa;M=ba;N=ca;O=da;P=ea;Q=fa;continue}else{F=Tm(b)|0;G=Y;H=Z;I=_;J=$;L=aa;M=ba;N=ca;O=da;P=ea;Q=fa;continue}}if((L|0)==0){o=(c[m>>2]|0)==0;if(!o){c[e>>2]=(c[e>>2]|0)-1}do{if((f|0)==0){Sm(b,0)}else{if(o){break}n=c[e>>2]|0;c[e>>2]=n-1;if((M|0)==0){break}c[e>>2]=n-2}}while(0);l=+(r|0)*0.0;i=g;return+l}o=(M|0)==0;n=o?H:J;q=o?G:I;o=0;if((G|0)<(o|0)|(G|0)==(o|0)&H>>>0<8>>>0){o=Q;p=G;ma=H;while(1){na=o<<4;oa=en(ma,p,1,0)|0;pa=K;qa=0;if((pa|0)<(qa|0)|(pa|0)==(qa|0)&oa>>>0<8>>>0){o=na;p=pa;ma=oa}else{ra=na;break}}}else{ra=Q}do{if((X|32|0)==112){ma=$m(b,f)|0;p=K;if(!((ma|0)==0&(p|0)==(-2147483648|0))){sa=p;ta=ma;break}if((f|0)==0){Sm(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){sa=0;ta=0;break}c[e>>2]=(c[e>>2]|0)-1;sa=0;ta=0;break}}else{if((c[m>>2]|0)==0){sa=0;ta=0;break}c[e>>2]=(c[e>>2]|0)-1;sa=0;ta=0}}while(0);ma=en(n<<2|0>>>30,q<<2|n>>>30,-32,-1)|0;p=en(ma,K,ta,sa)|0;ma=K;if((ra|0)==0){l=+(r|0)*0.0;i=g;return+l}o=0;if((ma|0)>(o|0)|(ma|0)==(o|0)&p>>>0>(-j|0)>>>0){c[(Gb()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}o=j-106|0;na=(o|0)<0|0?-1:0;if((ma|0)<(na|0)|(ma|0)==(na|0)&p>>>0<o>>>0){c[(Gb()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((ra|0)>-1){o=ra;la=P;na=ma;oa=p;while(1){pa=o<<1;if(la<.5){ua=la;va=pa}else{ua=la+-1.0;va=pa|1}wa=la+ua;pa=en(oa,na,-1,-1)|0;qa=K;if((va|0)>-1){o=va;la=wa;na=qa;oa=pa}else{xa=va;ya=wa;za=qa;Aa=pa;break}}}else{xa=ra;ya=P;za=ma;Aa=p}oa=0;na=fn(32,0,j,(j|0)<0|0?-1:0)|0;o=en(Aa,za,na,K)|0;na=K;if((oa|0)>(na|0)|(oa|0)==(na|0)&k>>>0>o>>>0){na=o;if((na|0)<0){Ba=0;x=126}else{Ca=na;x=124}}else{Ca=k;x=124}do{if((x|0)==124){if((Ca|0)<53){Ba=Ca;x=126;break}Da=0.0;Ea=Ca;Fa=+(r|0)}}while(0);if((x|0)==126){la=+(r|0);Da=+sb(+(+Um(1.0,84-Ba|0)),+la);Ea=Ba;Fa=la}p=(Ea|0)<32&ya!=0.0&(xa&1|0)==0;la=Fa*(p?0.0:ya)+(Da+Fa*+(((p&1)+xa|0)>>>0>>>0))-Da;if(la==0.0){c[(Gb()|0)>>2]=34}l=+Vm(la,Aa);i=g;return+l}else{C=y}}while(0);p=j+k|0;ma=-p|0;na=C;o=0;while(1){if((na|0)==46){x=137;break}else if((na|0)!=48){Ga=na;Ha=0;Ia=o;Ja=0;Ka=0;break}oa=c[e>>2]|0;if(oa>>>0<(c[m>>2]|0)>>>0){c[e>>2]=oa+1;na=d[oa]|0;o=1;continue}else{na=Tm(b)|0;o=1;continue}}do{if((x|0)==137){na=c[e>>2]|0;if(na>>>0<(c[m>>2]|0)>>>0){c[e>>2]=na+1;La=d[na]|0}else{La=Tm(b)|0}if((La|0)==48){Ma=0;Oa=0}else{Ga=La;Ha=1;Ia=o;Ja=0;Ka=0;break}while(1){na=en(Oa,Ma,-1,-1)|0;oa=K;n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;Pa=d[n]|0}else{Pa=Tm(b)|0}if((Pa|0)==48){Ma=oa;Oa=na}else{Ga=Pa;Ha=1;Ia=1;Ja=oa;Ka=na;break}}}}while(0);o=h|0;c[o>>2]=0;na=Ga-48|0;oa=(Ga|0)==46;L180:do{if(na>>>0<10>>>0|oa){n=h+496|0;q=Ja;pa=Ka;qa=0;Qa=0;Ra=0;Sa=Ia;Ta=Ha;Va=0;Wa=0;Xa=Ga;Ya=na;Za=oa;L182:while(1){do{if(Za){if((Ta|0)==0){_a=Wa;$a=Va;ab=1;bb=Sa;cb=Ra;db=qa;eb=Qa;fb=qa;gb=Qa}else{break L182}}else{hb=en(Qa,qa,1,0)|0;ib=K;jb=(Xa|0)!=48;if((Va|0)>=125){if(!jb){_a=Wa;$a=Va;ab=Ta;bb=Sa;cb=Ra;db=ib;eb=hb;fb=q;gb=pa;break}c[n>>2]=c[n>>2]|1;_a=Wa;$a=Va;ab=Ta;bb=Sa;cb=Ra;db=ib;eb=hb;fb=q;gb=pa;break}kb=h+(Va<<2)|0;if((Wa|0)==0){lb=Ya}else{lb=Xa-48+((c[kb>>2]|0)*10|0)|0}c[kb>>2]=lb;kb=Wa+1|0;mb=(kb|0)==9;_a=mb?0:kb;$a=(mb&1)+Va|0;ab=Ta;bb=1;cb=jb?hb:Ra;db=ib;eb=hb;fb=q;gb=pa}}while(0);hb=c[e>>2]|0;if(hb>>>0<(c[m>>2]|0)>>>0){c[e>>2]=hb+1;nb=d[hb]|0}else{nb=Tm(b)|0}hb=nb-48|0;ib=(nb|0)==46;if(hb>>>0<10>>>0|ib){q=fb;pa=gb;qa=db;Qa=eb;Ra=cb;Sa=bb;Ta=ab;Va=$a;Wa=_a;Xa=nb;Ya=hb;Za=ib}else{ob=fb;pb=gb;qb=db;rb=eb;tb=cb;ub=bb;vb=ab;wb=$a;xb=_a;yb=nb;x=160;break L180}}zb=(Sa|0)!=0;Ab=q;Bb=pa;Cb=qa;Db=Qa;Eb=Ra;Fb=Va;Hb=Wa;x=168}else{ob=Ja;pb=Ka;qb=0;rb=0;tb=0;ub=Ia;vb=Ha;wb=0;xb=0;yb=Ga;x=160}}while(0);do{if((x|0)==160){oa=(vb|0)==0;na=oa?rb:pb;Za=oa?qb:ob;oa=(ub|0)!=0;if(!(oa&(yb|32|0)==101)){if((yb|0)>-1){zb=oa;Ab=Za;Bb=na;Cb=qb;Db=rb;Eb=tb;Fb=wb;Hb=xb;x=168;break}else{Ib=Za;Jb=na;Kb=oa;Lb=qb;Mb=rb;Nb=tb;Ob=wb;Pb=xb;x=170;break}}oa=$m(b,f)|0;Ya=K;do{if((oa|0)==0&(Ya|0)==(-2147483648|0)){if((f|0)==0){Sm(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){Qb=0;Rb=0;break}c[e>>2]=(c[e>>2]|0)-1;Qb=0;Rb=0;break}}else{Qb=Ya;Rb=oa}}while(0);oa=en(Rb,Qb,na,Za)|0;Sb=K;Tb=oa;Ub=qb;Vb=rb;Wb=tb;Xb=wb;Yb=xb}}while(0);do{if((x|0)==168){if((c[m>>2]|0)==0){Ib=Ab;Jb=Bb;Kb=zb;Lb=Cb;Mb=Db;Nb=Eb;Ob=Fb;Pb=Hb;x=170;break}c[e>>2]=(c[e>>2]|0)-1;if(zb){Sb=Ab;Tb=Bb;Ub=Cb;Vb=Db;Wb=Eb;Xb=Fb;Yb=Hb}else{x=171}}}while(0);if((x|0)==170){if(Kb){Sb=Ib;Tb=Jb;Ub=Lb;Vb=Mb;Wb=Nb;Xb=Ob;Yb=Pb}else{x=171}}if((x|0)==171){c[(Gb()|0)>>2]=22;Sm(b,0);l=0.0;i=g;return+l}oa=c[o>>2]|0;if((oa|0)==0){l=+(r|0)*0.0;i=g;return+l}Ya=0;do{if((Tb|0)==(Vb|0)&(Sb|0)==(Ub|0)&((Ub|0)<(Ya|0)|(Ub|0)==(Ya|0)&Vb>>>0<10>>>0)){if(!(k>>>0>30>>>0|(oa>>>(k>>>0)|0)==0)){break}l=+(r|0)*+(oa>>>0>>>0);i=g;return+l}}while(0);oa=(j|0)/-2|0;Ya=(oa|0)<0|0?-1:0;if((Sb|0)>(Ya|0)|(Sb|0)==(Ya|0)&Tb>>>0>oa>>>0){c[(Gb()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}oa=j-106|0;Ya=(oa|0)<0|0?-1:0;if((Sb|0)<(Ya|0)|(Sb|0)==(Ya|0)&Tb>>>0<oa>>>0){c[(Gb()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((Yb|0)==0){Zb=Xb}else{if((Yb|0)<9){oa=h+(Xb<<2)|0;Ya=Yb;Wa=c[oa>>2]|0;do{Wa=Wa*10|0;Ya=Ya+1|0;}while((Ya|0)<9);c[oa>>2]=Wa}Zb=Xb+1|0}Ya=Tb;do{if((Wb|0)<9){if(!((Wb|0)<=(Ya|0)&(Ya|0)<18)){break}if((Ya|0)==9){l=+(r|0)*+((c[o>>2]|0)>>>0>>>0);i=g;return+l}if((Ya|0)<9){l=+(r|0)*+((c[o>>2]|0)>>>0>>>0)/+(c[16+(8-Ya<<2)>>2]|0);i=g;return+l}Va=k+27+(Ya*-3|0)|0;Ra=c[o>>2]|0;if(!((Va|0)>30|(Ra>>>(Va>>>0)|0)==0)){break}l=+(r|0)*+(Ra>>>0>>>0)*+(c[16+(Ya-10<<2)>>2]|0);i=g;return+l}}while(0);o=(Ya|0)%9|0;if((o|0)==0){_b=0;$b=Zb;ac=0;bc=Ya}else{Wa=(Ya|0)>-1?o:o+9|0;o=c[16+(8-Wa<<2)>>2]|0;do{if((Zb|0)==0){cc=0;dc=0;ec=Ya}else{oa=1e9/(o|0)|0;Ra=Ya;Va=0;Qa=0;qa=0;while(1){pa=h+(Qa<<2)|0;q=c[pa>>2]|0;Sa=((q>>>0)/(o>>>0)|0)+qa|0;c[pa>>2]=Sa;fc=ga((q>>>0)%(o>>>0)|0,oa)|0;q=Qa+1|0;if((Qa|0)==(Va|0)&(Sa|0)==0){gc=q&127;hc=Ra-9|0}else{gc=Va;hc=Ra}if((q|0)==(Zb|0)){break}else{Ra=hc;Va=gc;Qa=q;qa=fc}}if((fc|0)==0){cc=Zb;dc=gc;ec=hc;break}c[h+(Zb<<2)>>2]=fc;cc=Zb+1|0;dc=gc;ec=hc}}while(0);_b=dc;$b=cc;ac=0;bc=9-Wa+ec|0}L274:while(1){o=h+(_b<<2)|0;if((bc|0)<18){Ya=$b;qa=ac;while(1){Qa=0;Va=Ya+127|0;Ra=Ya;while(1){oa=Va&127;Za=h+(oa<<2)|0;na=c[Za>>2]|0;q=en(na<<29|0>>>3,0<<29|na>>>3,Qa,0)|0;na=K;Sa=0;if(na>>>0>Sa>>>0|na>>>0==Sa>>>0&q>>>0>1e9>>>0){Sa=qn(q,na,1e9,0)|0;pa=rn(q,na,1e9,0)|0;ic=Sa;jc=pa}else{ic=0;jc=q}c[Za>>2]=jc;Za=(oa|0)==(_b|0);if((oa|0)!=(Ra+127&127|0)|Za){kc=Ra}else{kc=(jc|0)==0?oa:Ra}if(Za){break}else{Qa=ic;Va=oa-1|0;Ra=kc}}Ra=qa-29|0;if((ic|0)==0){Ya=kc;qa=Ra}else{lc=Ra;mc=kc;nc=ic;break}}}else{if((bc|0)==18){oc=$b;pc=ac}else{qc=_b;rc=$b;sc=ac;tc=bc;break}while(1){if((c[o>>2]|0)>>>0>=9007199>>>0){qc=_b;rc=oc;sc=pc;tc=18;break L274}qa=0;Ya=oc+127|0;Ra=oc;while(1){Va=Ya&127;Qa=h+(Va<<2)|0;oa=c[Qa>>2]|0;Za=en(oa<<29|0>>>3,0<<29|oa>>>3,qa,0)|0;oa=K;q=0;if(oa>>>0>q>>>0|oa>>>0==q>>>0&Za>>>0>1e9>>>0){q=qn(Za,oa,1e9,0)|0;pa=rn(Za,oa,1e9,0)|0;uc=q;vc=pa}else{uc=0;vc=Za}c[Qa>>2]=vc;Qa=(Va|0)==(_b|0);if((Va|0)!=(Ra+127&127|0)|Qa){wc=Ra}else{wc=(vc|0)==0?Va:Ra}if(Qa){break}else{qa=uc;Ya=Va-1|0;Ra=wc}}Ra=pc-29|0;if((uc|0)==0){oc=wc;pc=Ra}else{lc=Ra;mc=wc;nc=uc;break}}}o=_b+127&127;if((o|0)==(mc|0)){Ra=mc+127&127;Ya=h+((mc+126&127)<<2)|0;c[Ya>>2]=c[Ya>>2]|c[h+(Ra<<2)>>2];xc=Ra}else{xc=mc}c[h+(o<<2)>>2]=nc;_b=o;$b=xc;ac=lc;bc=bc+9|0}L305:while(1){yc=rc+1&127;Wa=h+((rc+127&127)<<2)|0;o=qc;Ra=sc;Ya=tc;while(1){qa=(Ya|0)==18;Va=(Ya|0)>27?9:1;zc=o;Ac=Ra;while(1){Qa=0;while(1){Za=Qa+zc&127;if((Za|0)==(rc|0)){Bc=2;break}pa=c[h+(Za<<2)>>2]|0;Za=c[8+(Qa<<2)>>2]|0;if(pa>>>0<Za>>>0){Bc=2;break}q=Qa+1|0;if(pa>>>0>Za>>>0){Bc=Qa;break}if((q|0)<2){Qa=q}else{Bc=q;break}}if((Bc|0)==2&qa){break L305}Cc=Va+Ac|0;if((zc|0)==(rc|0)){zc=rc;Ac=Cc}else{break}}qa=(1<<Va)-1|0;Qa=1e9>>>(Va>>>0);Dc=Ya;Ec=zc;q=zc;Fc=0;do{Za=h+(q<<2)|0;pa=c[Za>>2]|0;oa=(pa>>>(Va>>>0))+Fc|0;c[Za>>2]=oa;Fc=ga(pa&qa,Qa)|0;pa=(q|0)==(Ec|0)&(oa|0)==0;q=q+1&127;Dc=pa?Dc-9|0:Dc;Ec=pa?q:Ec;}while((q|0)!=(rc|0));if((Fc|0)==0){o=Ec;Ra=Cc;Ya=Dc;continue}if((yc|0)!=(Ec|0)){break}c[Wa>>2]=c[Wa>>2]|1;o=Ec;Ra=Cc;Ya=Dc}c[h+(rc<<2)>>2]=Fc;qc=Ec;rc=yc;sc=Cc;tc=Dc}Ya=zc&127;if((Ya|0)==(rc|0)){c[h+(yc-1<<2)>>2]=0;Gc=yc}else{Gc=rc}la=+((c[h+(Ya<<2)>>2]|0)>>>0>>>0);Ya=zc+1&127;if((Ya|0)==(Gc|0)){Ra=Gc+1&127;c[h+(Ra-1<<2)>>2]=0;Hc=Ra}else{Hc=Gc}wa=+(r|0);Ic=wa*(la*1.0e9+ +((c[h+(Ya<<2)>>2]|0)>>>0>>>0));Ya=Ac+53|0;Ra=Ya-j|0;if((Ra|0)<(k|0)){if((Ra|0)<0){Jc=1;Kc=0;x=244}else{Lc=Ra;Mc=1;x=243}}else{Lc=k;Mc=0;x=243}if((x|0)==243){if((Lc|0)<53){Jc=Mc;Kc=Lc;x=244}else{Nc=0.0;Oc=0.0;Pc=Ic;Qc=Mc;Rc=Lc}}if((x|0)==244){la=+sb(+(+Um(1.0,105-Kc|0)),+Ic);Sc=+Ua(+Ic,+(+Um(1.0,53-Kc|0)));Nc=la;Oc=Sc;Pc=la+(Ic-Sc);Qc=Jc;Rc=Kc}o=zc+2&127;do{if((o|0)==(Hc|0)){Tc=Oc}else{Wa=c[h+(o<<2)>>2]|0;do{if(Wa>>>0<5e8>>>0){if((Wa|0)==0){if((zc+3&127|0)==(Hc|0)){Uc=Oc;break}}Uc=wa*.25+Oc}else{if(Wa>>>0>5e8>>>0){Uc=wa*.75+Oc;break}if((zc+3&127|0)==(Hc|0)){Uc=wa*.5+Oc;break}else{Uc=wa*.75+Oc;break}}}while(0);if((53-Rc|0)<=1){Tc=Uc;break}if(+Ua(+Uc,+1.0)!=0.0){Tc=Uc;break}Tc=Uc+1.0}}while(0);wa=Pc+Tc-Nc;do{if((Ya&2147483647|0)>(-2-p|0)){if(+V(+wa)<9007199254740992.0){Vc=wa;Wc=Qc;Xc=Ac}else{Vc=wa*.5;Wc=(Qc|0)!=0&(Rc|0)==(Ra|0)?0:Qc;Xc=Ac+1|0}if((Xc+50|0)<=(ma|0)){if(!((Wc|0)!=0&Tc!=0.0)){Yc=Vc;Zc=Xc;break}}c[(Gb()|0)>>2]=34;Yc=Vc;Zc=Xc}else{Yc=wa;Zc=Ac}}while(0);l=+Vm(Yc,Zc);i=g;return+l}else if((z|0)==3){ma=c[e>>2]|0;if(ma>>>0<(c[m>>2]|0)>>>0){c[e>>2]=ma+1;_c=d[ma]|0}else{_c=Tm(b)|0}if((_c|0)==40){$c=1}else{if((c[m>>2]|0)==0){l=+v;i=g;return+l}c[e>>2]=(c[e>>2]|0)-1;l=+v;i=g;return+l}while(1){ma=c[e>>2]|0;if(ma>>>0<(c[m>>2]|0)>>>0){c[e>>2]=ma+1;ad=d[ma]|0}else{ad=Tm(b)|0}if(!((ad-48|0)>>>0<10>>>0|(ad-65|0)>>>0<26>>>0)){if(!((ad-97|0)>>>0<26>>>0|(ad|0)==95)){break}}$c=$c+1|0}if((ad|0)==41){l=+v;i=g;return+l}ma=(c[m>>2]|0)==0;if(!ma){c[e>>2]=(c[e>>2]|0)-1}if(!u){c[(Gb()|0)>>2]=22;Sm(b,0);l=0.0;i=g;return+l}if(($c|0)==0|ma){l=+v;i=g;return+l}else{bd=$c}while(1){ma=bd-1|0;c[e>>2]=(c[e>>2]|0)-1;if((ma|0)==0){l=+v;break}else{bd=ma}}i=g;return+l}else{if((c[m>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)-1}c[(Gb()|0)>>2]=22;Sm(b,0);l=0.0;i=g;return+l}}}while(0);do{if((x|0)==23){b=(c[m>>2]|0)==0;if(!b){c[e>>2]=(c[e>>2]|0)-1}if(s>>>0<4>>>0|(f|0)==0|b){break}else{cd=s}do{c[e>>2]=(c[e>>2]|0)-1;cd=cd-1|0;}while(cd>>>0>3>>>0)}}while(0);l=+(r|0)*w;i=g;return+l}function Sm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a+104>>2]=b;d=c[a+8>>2]|0;e=c[a+4>>2]|0;f=d-e|0;c[a+108>>2]=f;if((b|0)!=0&(f|0)>(b|0)){c[a+100>>2]=e+b;return}else{c[a+100>>2]=d;return}}function Tm(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=b+104|0;f=c[e>>2]|0;if((f|0)==0){g=3}else{if((c[b+108>>2]|0)<(f|0)){g=3}}do{if((g|0)==3){f=Xm(b)|0;if((f|0)<0){break}h=c[e>>2]|0;i=c[b+8>>2]|0;do{if((h|0)==0){g=8}else{j=c[b+4>>2]|0;k=h-(c[b+108>>2]|0)-1|0;if((i-j|0)<=(k|0)){g=8;break}c[b+100>>2]=j+k}}while(0);if((g|0)==8){c[b+100>>2]=i}h=c[b+4>>2]|0;if((i|0)!=0){k=b+108|0;c[k>>2]=i+1-h+(c[k>>2]|0)}k=h-1|0;if((d[k]|0|0)==(f|0)){l=f;return l|0}a[k]=f;l=f;return l|0}}while(0);c[b+100>>2]=0;l=-1;return l|0}function Um(a,b){a=+a;b=b|0;var d=0.0,e=0,f=0.0,g=0;do{if((b|0)>1023){d=a*8.98846567431158e+307;e=b-1023|0;if((e|0)<=1023){f=d;g=e;break}e=b-2046|0;f=d*8.98846567431158e+307;g=(e|0)>1023?1023:e}else{if((b|0)>=-1022){f=a;g=b;break}d=a*2.2250738585072014e-308;e=b+1022|0;if((e|0)>=-1022){f=d;g=e;break}e=b+2044|0;f=d*2.2250738585072014e-308;g=(e|0)<-1022?-1022:e}}while(0);return+(f*(c[k>>2]=0<<20|0>>>12,c[k+4>>2]=g+1023<<20|0>>>12,+h[k>>3]))}function Vm(a,b){a=+a;b=b|0;return+(+Um(a,b))}function Wm(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=b+74|0;e=a[d]|0;a[d]=e-1&255|e;e=b+20|0;d=b+44|0;if((c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){kc[c[b+36>>2]&63](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[e>>2]=0;e=b|0;f=c[e>>2]|0;if((f&20|0)==0){g=c[d>>2]|0;c[b+8>>2]=g;c[b+4>>2]=g;h=0;return h|0}if((f&4|0)==0){h=-1;return h|0}c[e>>2]=f|32;h=-1;return h|0}function Xm(a){a=a|0;var b=0,e=0,f=0,g=0;b=i;i=i+8|0;e=b|0;if((c[a+8>>2]|0)==0){if((Wm(a)|0)==0){f=3}else{g=-1}}else{f=3}do{if((f|0)==3){if((kc[c[a+32>>2]&63](a,e,1)|0)!=1){g=-1;break}g=d[e]|0}}while(0);i=b;return g|0}function Ym(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0.0,j=0,k=0,l=0,m=0;d=i;i=i+112|0;e=d|0;bn(e|0,0,112)|0;f=e+4|0;c[f>>2]=a;g=e+8|0;c[g>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;Sm(e,0);h=+Rm(e,2,1);j=(c[f>>2]|0)-(c[g>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){k=112;l=0;i=d;return+h}if((j|0)==0){m=a}else{m=a+j|0}c[b>>2]=m;k=112;l=0;i=d;return+h}function Zm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[12214]|0;k=e&3;if(!((k|0)!=1&g>>>0>=j>>>0&g>>>0<h>>>0)){Rb();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){Rb();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[12202]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;_m(g+b|0,k);n=a;return n|0}if((i|0)==(c[12216]|0)){k=(c[12213]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[12216]=g+b;c[12213]=l;n=a;return n|0}if((i|0)==(c[12215]|0)){l=(c[12212]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[12212]=q;c[12215]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L49:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=48880+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){Rb();return 0}if((c[l+12>>2]|0)==(i|0)){break}Rb();return 0}}while(0);if((k|0)==(l|0)){c[12210]=c[12210]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){Rb();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}Rb();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){Rb();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){Rb();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){Rb();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{Rb();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=49144+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[12211]=c[12211]&~(1<<c[t>>2]);break L49}else{if(s>>>0<(c[12214]|0)>>>0){Rb();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L49}}}while(0);if(y>>>0<(c[12214]|0)>>>0){Rb();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[12214]|0)>>>0){Rb();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;_m(g+b|0,q);n=a;return n|0}return 0}function _m(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L1:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[12214]|0;if(i>>>0<l>>>0){Rb()}if((j|0)==(c[12215]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[12212]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=48880+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){Rb()}if((c[p+12>>2]|0)==(j|0)){break}Rb()}}while(0);if((q|0)==(p|0)){c[12210]=c[12210]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){Rb()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}Rb()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){Rb()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){Rb()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){Rb()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{Rb()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=49144+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[12211]=c[12211]&~(1<<c[t>>2]);n=j;o=k;break L1}else{if(m>>>0<(c[12214]|0)>>>0){Rb()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L1}}}while(0);if(y>>>0<(c[12214]|0)>>>0){Rb()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[12214]|0)>>>0){Rb()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[12214]|0)>>>0){Rb()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[12214]|0;if(e>>>0<a>>>0){Rb()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[12216]|0)){A=(c[12213]|0)+o|0;c[12213]=A;c[12216]=n;c[n+4>>2]=A|1;if((n|0)!=(c[12215]|0)){return}c[12215]=0;c[12212]=0;return}if((f|0)==(c[12215]|0)){A=(c[12212]|0)+o|0;c[12212]=A;c[12215]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L101:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=48880+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){Rb()}if((c[g+12>>2]|0)==(f|0)){break}Rb()}}while(0);if((t|0)==(g|0)){c[12210]=c[12210]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){Rb()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}Rb()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){Rb()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){Rb()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){Rb()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{Rb()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=49144+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[12211]=c[12211]&~(1<<c[l>>2]);break L101}else{if(m>>>0<(c[12214]|0)>>>0){Rb()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L101}}}while(0);if(C>>>0<(c[12214]|0)>>>0){Rb()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[12214]|0)>>>0){Rb()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[12214]|0)>>>0){Rb()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[12215]|0)){F=A;break}c[12212]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=48880+(z<<2)|0;C=c[12210]|0;b=1<<o;do{if((C&b|0)==0){c[12210]=C|b;G=y;H=48880+(z+2<<2)|0}else{o=48880+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[12214]|0)>>>0){G=d;H=o;break}Rb()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=49144+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[12211]|0;z=1<<I;if((o&z|0)==0){c[12211]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}z=c[G>>2]|0;if((I|0)==31){J=0}else{J=25-(I>>>1)|0}L194:do{if((c[z+4>>2]&-8|0)==(F|0)){K=z}else{I=z;G=F<<J;while(1){L=I+16+(G>>>31<<2)|0;o=c[L>>2]|0;if((o|0)==0){break}if((c[o+4>>2]&-8|0)==(F|0)){K=o;break L194}else{I=o;G=G<<1}}if(L>>>0<(c[12214]|0)>>>0){Rb()}c[L>>2]=y;c[n+24>>2]=I;c[n+12>>2]=n;c[n+8>>2]=n;return}}while(0);L=K+8|0;F=c[L>>2]|0;J=c[12214]|0;if(!(K>>>0>=J>>>0&F>>>0>=J>>>0)){Rb()}c[F+12>>2]=y;c[L>>2]=y;c[n+8>>2]=F;c[n+12>>2]=K;c[n+24>>2]=0;return}function $m(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=a+4|0;f=c[e>>2]|0;g=a+100|0;if(f>>>0<(c[g>>2]|0)>>>0){c[e>>2]=f+1;h=d[f]|0}else{h=Tm(a)|0}do{if((h|0)==45|(h|0)==43){f=c[e>>2]|0;i=(h|0)==45|0;if(f>>>0<(c[g>>2]|0)>>>0){c[e>>2]=f+1;j=d[f]|0}else{j=Tm(a)|0}if(!((j-48|0)>>>0>9>>>0&(b|0)!=0)){k=i;l=j;break}if((c[g>>2]|0)==0){k=i;l=j;break}c[e>>2]=(c[e>>2]|0)-1;k=i;l=j}else{k=0;l=h}}while(0);if((l-48|0)>>>0>9>>>0){if((c[g>>2]|0)==0){m=-2147483648;n=0;return(K=m,n)|0}c[e>>2]=(c[e>>2]|0)-1;m=-2147483648;n=0;return(K=m,n)|0}else{o=l;p=0}while(1){q=o-48+(p*10|0)|0;l=c[e>>2]|0;if(l>>>0<(c[g>>2]|0)>>>0){c[e>>2]=l+1;r=d[l]|0}else{r=Tm(a)|0}if((r-48|0)>>>0<10>>>0&(q|0)<214748364){o=r;p=q}else{break}}p=q;o=(q|0)<0|0?-1:0;if((r-48|0)>>>0<10>>>0){q=r;l=o;h=p;while(1){j=pn(h,l,10,0)|0;b=K;i=en(q,(q|0)<0|0?-1:0,-48,-1)|0;f=en(i,K,j,b)|0;b=K;j=c[e>>2]|0;if(j>>>0<(c[g>>2]|0)>>>0){c[e>>2]=j+1;s=d[j]|0}else{s=Tm(a)|0}j=21474836;if((s-48|0)>>>0<10>>>0&((b|0)<(j|0)|(b|0)==(j|0)&f>>>0<2061584302>>>0)){q=s;l=b;h=f}else{t=s;u=b;v=f;break}}}else{t=r;u=o;v=p}if((t-48|0)>>>0<10>>>0){do{t=c[e>>2]|0;if(t>>>0<(c[g>>2]|0)>>>0){c[e>>2]=t+1;w=d[t]|0}else{w=Tm(a)|0}}while((w-48|0)>>>0<10>>>0)}if((c[g>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)-1}e=(k|0)!=0;k=fn(0,0,v,u)|0;m=e?K:u;n=e?k:v;return(K=m,n)|0}function an(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function bn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function cn(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function dn(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{an(b,c,d)|0}return b|0}function en(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(K=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function fn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(K=e,a-c>>>0|0)|0}function gn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}K=a<<c-32;return 0}function hn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=0;return b>>>c-32|0}function jn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=(b|0)<0?-1:0;return b>>c-32|0}function kn(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function ln(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function mn(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ga(d,c)|0;f=a>>>16;a=(e>>>16)+(ga(d,f)|0)|0;d=b>>>16;b=ga(d,c)|0;return(K=(a>>>16)+(ga(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function nn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=fn(e^a,f^b,e,f)|0;b=K;a=g^e;e=h^f;f=fn((sn(i,b,fn(g^c,h^d,g,h)|0,K,0)|0)^a,K^e,a,e)|0;return(K=K,f)|0}function on(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=fn(h^a,j^b,h,j)|0;b=K;sn(m,b,fn(k^d,l^e,k,l)|0,K,g)|0;l=fn(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=K;i=f;return(K=j,l)|0}function pn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=mn(e,a)|0;f=K;return(K=(ga(b,a)|0)+(ga(d,e)|0)+f|f&0,c|0|0)|0}function qn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=sn(a,b,c,d,0)|0;return(K=K,e)|0}function rn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;sn(a,b,d,e,g)|0;i=f;return(K=c[g+4>>2]|0,c[g>>2]|0)|0}function sn(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(K=n,o)|0}else{if(!m){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(K=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(K=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(K=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((ln(l|0)|0)>>>0);return(K=n,o)|0}p=(kn(l|0)|0)-(kn(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}else{if(!m){r=(kn(l|0)|0)-(kn(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(kn(j|0)|0)+33-(kn(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(K=n,o)|0}else{p=ln(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(K=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;G=0}else{g=d|0|0;d=k|e&0;e=en(g,d,-1,-1)|0;k=K;i=w;w=v;v=u;u=t;t=s;s=0;while(1){H=w>>>31|i<<1;I=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;fn(e,k,j,a)|0;b=K;h=b>>31|((b|0)<0?-1:0)<<1;J=h&1;L=fn(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=K;b=t-1|0;if((b|0)==0){break}else{i=H;w=I;v=M;u=L;t=b;s=J}}B=H;C=I;D=M;E=L;F=0;G=J}J=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(J|0)>>>31|(B|C)<<1|(C<<1|J>>>31)&0|F;o=(J<<1|0>>>31)&-2|G;return(K=n,o)|0}
function xc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function yc(){return i|0}function zc(a){a=a|0;i=a}function Ac(a,b){a=a|0;b=b|0;if((x|0)==0){x=a;y=b}}function Bc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Cc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Dc(a){a=a|0;K=a}function Ec(a){a=a|0;L=a}function Fc(a){a=a|0;M=a}function Gc(a){a=a|0;N=a}function Hc(a){a=a|0;O=a}function Ic(a){a=a|0;P=a}function Jc(a){a=a|0;Q=a}function Kc(a){a=a|0;R=a}function Lc(a){a=a|0;S=a}function Mc(a){a=a|0;T=a}function Nc(){c[2014]=p+8;c[2016]=p+8;c[2018]=q+8;c[2022]=q+8;c[2026]=q+8;c[2030]=q+8;c[2034]=q+8;c[2038]=p+8;c[2072]=q+8;c[2076]=q+8;c[2140]=q+8;c[2144]=q+8;c[2164]=p+8;c[2166]=q+8;c[2202]=q+8;c[2206]=q+8;c[2242]=q+8;c[2246]=q+8;c[2266]=p+8;c[2268]=p+8;c[2270]=q+8;c[2274]=q+8;c[2278]=q+8;c[2282]=p+8;c[2284]=p+8;c[2286]=p+8;c[2288]=p+8;c[2290]=p+8;c[2292]=p+8;c[2294]=p+8;c[2320]=q+8;c[2324]=p+8;c[2326]=q+8;c[2330]=q+8;c[2334]=q+8;c[2338]=p+8;c[2340]=p+8;c[2342]=p+8;c[2344]=p+8;c[2378]=p+8;c[2380]=p+8;c[2382]=p+8;c[2384]=q+8;c[2388]=q+8;c[2392]=q+8;c[2396]=q+8;c[2400]=q+8;c[2404]=q+8}function Oc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0.0;e=i;i=i+16|0;f=e|0;g=e+8|0;do{if((a[53096]|0)==0){if((mb(53096)|0)==0){break}j=dc(0)|0;bn(51496,0,16)|0;a[51512]=1;k=51520;c[k>>2]=j;c[k+4>>2]=(j|0)<0|0?-1:0;$a(264,51496,u|0)|0}}while(0);j=bb()|0;k=Qc(51496,b,+h[294],d)|0;d=bb()|0;b=fn(d,(d|0)<0|0?-1:0,j,(j|0)<0|0?-1:0)|0;j=pn(b,K,1e3,0)|0;l=(+(j>>>0)+ +(K|0)*4294967296.0)/1.0e9;h[294]=+h[294]-l;j=Te(52680,k)|0;$d(f,j+(c[(c[j>>2]|0)-12>>2]|0)|0);b=Ki(f,52408)|0;d=uc[c[(c[b>>2]|0)+28>>2]&31](b,10)|0;Ji(f);Ve(j,d)|0;He(j)|0;j=Rc(Ue(Rc(52680,2040)|0,l)|0,2024)|0;d=Rc(Ue(j,+h[294])|0,1464)|0;$d(g,d+(c[(c[d>>2]|0)-12>>2]|0)|0);j=Ki(g,52408)|0;f=uc[c[(c[j>>2]|0)+28>>2]&31](j,10)|0;Ji(g);Ve(d,f)|0;He(d)|0;i=e;return k|0}function Pc(a){a=a|0;var b=0,d=0;b=c[a>>2]|0;if((b|0)!=0){Uc(b);Lm(b|0)}b=c[a+4>>2]|0;if((b|0)==0){return}d=a+8|0;a=c[d>>2]|0;if((b|0)!=(a|0)){c[d>>2]=a+(~((a-4-b|0)>>>2)<<2)}Lm(b);return}function Qc(b,e,f,g){b=b|0;e=e|0;f=+f;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;h=i;i=i+16|0;j=h|0;k=h+8|0;c[j>>2]=e;do{if((e|0)>0){l=b+8|0;m=c[l>>2]|0;if((m|0)==(c[b+12>>2]|0)){_c(b+4|0,j)}else{if((m|0)==0){n=0}else{c[m>>2]=e;n=c[l>>2]|0}c[l>>2]=n+4}l=b|0;m=c[l>>2]|0;if((m|0)==0){o=Jm(1552)|0;p=o;q=0;while(1){r=q+1|0;a[p+q|0]=r;a[p+106+r|0]=q;if((r|0)<106){q=r}else{break}}c[o+216>>2]=106;bn(o+260|0,0,1292)|0;bn(o+224|0,0,33)|0;s=p}else{s=m}q=s+1124+(e<<2)|0;r=c[q>>2]|0;if((r|0)==0){t=Jm(1552)|0;Xc(t,s,e);u=t}else{c[q>>2]=0;u=r}c[l>>2]=u;v=s;w=l;x=e}else{r=b|0;q=c[r>>2]|0;if((e|0)==0){t=Jm(1552)|0;y=t;z=0;while(1){A=z+1|0;a[y+z|0]=A;a[y+106+A|0]=z;if((A|0)<106){z=A}else{break}}c[t+216>>2]=106;bn(t+224|0,0,32)|0;a[t+256|0]=1;bn(t+260|0,0,1292)|0;c[r>>2]=y;if((e|0)!=-1){v=q;w=r;x=e;break}}else if((e|0)!=(-1|0)){v=q;w=r;x=e;break}z=q+224|0;l=c[z>>2]|0;m=c[z+4>>2]|0;p=q+232|0;o=c[p>>2]|0;A=c[p+4>>2]|0;B=q+240|0;C=c[B+4>>2]|0;c[z>>2]=c[B>>2];c[z+4>>2]=C;C=q+248|0;D=c[C+4>>2]|0;c[p>>2]=c[C>>2];c[p+4>>2]=D;c[B>>2]=l;c[B+4>>2]=m;c[C>>2]=o;c[C+4>>2]=A;A=Jm(1552)|0;o=q+216|0;dn(A|0,q|0,c[o>>2]|0)|0;dn(A+107|0,q+107|0,106)|0;c[A+216>>2]=c[o>>2];o=c[z+4>>2]|0;m=A+224|0;c[m>>2]=c[z>>2];c[m+4>>2]=o;o=c[p+4>>2]|0;m=A+232|0;c[m>>2]=c[p>>2];c[m+4>>2]=o;o=c[B+4>>2]|0;m=A+240|0;c[m>>2]=c[B>>2];c[m+4>>2]=o;o=c[C+4>>2]|0;m=A+248|0;c[m>>2]=c[C>>2];c[m+4>>2]=o;a[A+256|0]=1;bn(A+260|0,0,1292)|0;c[r>>2]=A;v=q;w=r;x=-1}}while(0);if((v|0)!=0){Uc(v);Lm(v|0)}v=b+16|0;L31:do{if((a[v]&1)!=0&(x|0)!=0){if((c[43656+(x<<2)>>2]|0)<=1){switch(x|0){case 96:case 95:case 81:case 74:case 71:case 63:case 24:case 18:case 15:case 11:{break};default:{E=26;break L31}}}c[k>>2]=-1;F=c[w>>2]|0;E=30}else{E=26}}while(0);do{if((E|0)==26){x=cd(b+4|0)|0;c[k>>2]=x;do{if((x|0)==0){G=f/10.0;e=Vc(c[w>>2]|0,G<.1?.1:G,g,b+24|0)|0;c[k>>2]=e;if((e|0)!=0){H=e;E=29;break}e=d[c[w>>2]|0]|0;c[k>>2]=e;I=e;J=c[w>>2]|0}else{H=x;E=29}}while(0);if((E|0)==29){x=c[w>>2]|0;if((H|0)==-1){F=x;E=30;break}else{I=H;J=x}}x=J+1124+(I<<2)|0;r=c[x>>2]|0;if((r|0)==0){q=Jm(1552)|0;Xc(q,J,I);K=q;L=J;E=34;break}else{c[x>>2]=0;c[w>>2]=r;M=J;E=35;break}}}while(0);if((E|0)==30){J=F+224|0;I=c[J>>2]|0;H=c[J+4>>2]|0;g=F+232|0;r=c[g>>2]|0;x=c[g+4>>2]|0;q=F+240|0;y=c[q+4>>2]|0;c[J>>2]=c[q>>2];c[J+4>>2]=y;y=F+248|0;J=c[y+4>>2]|0;c[g>>2]=c[y>>2];c[g+4>>2]=J;c[q>>2]=I;c[q+4>>2]=H;c[y>>2]=r;c[y+4>>2]=x;x=Jm(1552)|0;y=c[w>>2]|0;r=y+216|0;dn(x|0,y|0,c[r>>2]|0)|0;dn(x+107|0,y+107|0,106)|0;c[x+216>>2]=c[r>>2];r=y+224|0;H=c[r+4>>2]|0;q=x+224|0;c[q>>2]=c[r>>2];c[q+4>>2]=H;H=y+232|0;q=c[H+4>>2]|0;r=x+232|0;c[r>>2]=c[H>>2];c[r+4>>2]=q;q=y+240|0;r=c[q+4>>2]|0;H=x+240|0;c[H>>2]=c[q>>2];c[H+4>>2]=r;r=y+248|0;y=c[r+4>>2]|0;H=x+248|0;c[H>>2]=c[r>>2];c[H+4>>2]=y;a[x+256|0]=0;bn(x+260|0,0,1292)|0;K=x;L=F;E=34}if((E|0)==34){c[w>>2]=K;if((L|0)!=0){M=L;E=35}}if((E|0)==35){Uc(M);Lm(M|0)}a[v]=0;v=c[k>>2]|0;if((v|0)==-1){i=h;return v|0}M=b+8|0;E=c[M>>2]|0;if((E|0)==(c[b+12>>2]|0)){_c(b+4|0,k);i=h;return v|0}if((E|0)==0){N=0}else{c[E>>2]=v;N=c[M>>2]|0}c[M>>2]=N+4;i=h;return v|0}function Rc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=g|0;a[k]=0;c[g+4>>2]=b;l=b;m=c[(c[l>>2]|0)-12>>2]|0;n=b;do{if((c[n+(m+16)>>2]|0)==0){o=c[n+(m+72)>>2]|0;if((o|0)!=0){He(o)|0}a[k]=1;o=cn(d|0)|0;p=c[(c[l>>2]|0)-12>>2]|0;c[h>>2]=c[n+(p+24)>>2];q=d+o|0;o=(c[n+(p+4)>>2]&176|0)==32?q:d;r=n+p|0;s=n+(p+76)|0;p=c[s>>2]|0;if((p|0)==-1){$d(f,r);t=Ki(f,52408)|0;u=uc[c[(c[t>>2]|0)+28>>2]&31](t,32)|0;Ji(f);c[s>>2]=u<<24>>24;v=u}else{v=p&255}Tc(j,h,d,o,q,r,v);if((c[j>>2]|0)!=0){break}r=c[(c[l>>2]|0)-12>>2]|0;Zd(n+r|0,c[n+(r+16)>>2]|5)}}while(0);Se(g);i=e;return b|0}function Sc(a){a=a|0;nb(a|0)|0;Cb()}function Tc(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g|0;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;do{if((h|0)>0){if((kc[c[(c[d>>2]|0)+48>>2]&63](d,e,h)|0)==(h|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){if(q>>>0<11>>>0){h=q<<1&255;e=l;a[e]=h;r=l+1|0;s=h;t=e}else{e=q+16&-16;h=Jm(e)|0;c[l+8>>2]=h;g=e|1;c[l>>2]=g;c[l+4>>2]=q;r=h;s=g&255;t=l}bn(r|0,j|0,q|0)|0;a[r+q|0]=0;if((s&1)==0){u=l+1|0}else{u=c[l+8>>2]|0}if((kc[c[(c[d>>2]|0)+48>>2]&63](d,u,q)|0)==(q|0)){if((a[t]&1)==0){break}Lm(c[l+8>>2]|0);break}c[m>>2]=0;c[b>>2]=0;if((a[t]&1)==0){i=k;return}Lm(c[l+8>>2]|0);i=k;return}}while(0);l=n-o|0;do{if((l|0)>0){if((kc[c[(c[d>>2]|0)+48>>2]&63](d,f,l)|0)==(l|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function Uc(a){a=a|0;var b=0,d=0;b=a+1552|0;d=a+1124|0;do{a=c[d>>2]|0;if((a|0)!=0){Uc(a);Lm(a|0)}d=d+4|0;}while((d|0)!=(b|0));return}function Vc(b,d,e,f){b=b|0;d=+d;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+1728|0;h=g|0;j=g+8|0;k=bb()|0;l=k;m=(k|0)<0|0?-1:0;k=b+216|0;L1:do{if((c[k>>2]|0)>0){n=d*1.0e9;if((e|0)>0){o=0;while(1){Wc(j,b,f);p=o+1|0;if((p|0)>=(e|0)){q=p;break L1}if((c[k>>2]|0)>0){o=p}else{q=p;break L1}}}else{r=0}while(1){Wc(j,b,f);o=r+1|0;if((o&63|0)==0){p=bb()|0;s=fn(p,(p|0)<0|0?-1:0,l,m)|0;p=pn(s,K,1e3,0)|0;if(+(p>>>0)+ +(K|0)*4294967296.0>=n){q=o;break L1}}if((c[k>>2]|0)>0){r=o}else{q=o;break}}}else{q=0}}while(0);r=Rc(Te(Rc(52680,680)|0,q)|0,456)|0;$d(h,r+(c[(c[r>>2]|0)-12>>2]|0)|0);q=Ki(h,52408)|0;m=uc[c[(c[q>>2]|0)+28>>2]&31](q,10)|0;Ji(h);Ve(r,m)|0;He(r)|0;r=a[b|0]|0;m=r&255;h=c[k>>2]|0;if((h|0)>0){t=1;u=m;v=-1;w=r}else{x=m;i=g;return x|0}while(1){m=w&255;r=c[b+1124+(m<<2)>>2]|0;if((r|0)==0){y=v;z=u}else{k=c[r+260>>2]|0;r=(k|0)>(v|0);y=r?k:v;z=r?m:u}if((t|0)>=(h|0)){x=z;break}m=a[b+t|0]|0;t=t+1|0;u=z;v=y;w=m}i=g;return x|0}function Wc(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0.0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0.0,s=0,t=0,u=0.0,v=0,w=0.0,x=0,y=0;bn(b|0,0,1720)|0;g=c[e+216>>2]|0;if((g|0)==0){return}h=e+256|0;i=(g|0)>0;do{if((a[h]&1)==0){if(i){j=0;k=-1.0;l=0}else{m=0;break}while(1){n=d[e+j|0]|0;o=c[e+268+(n<<2)>>2]|0;p=+(o-(c[e+696+(n<<2)>>2]|0)|0)/+(o|0);q=c[e+1124+(n<<2)>>2]|0;if((q|0)==0){r=p}else{s=c[q+260>>2]|0;r=p*.75+ +(s-(c[q+264>>2]|0)|0)/+(s|0)*.25}p=(o|0)==0?100.0:r;o=p>k;s=o?n:l;n=j+1|0;if((n|0)<(g|0)){j=n;k=o?p:k;l=s}else{m=s;break}}}else{if(i){t=0;u=-1.0;v=0}else{m=0;break}while(1){s=d[e+t|0]|0;o=c[e+268+(s<<2)>>2]|0;p=+(c[e+696+(s<<2)>>2]|0)/+(o|0);n=c[e+1124+(s<<2)>>2]|0;if((n|0)==0){w=p}else{w=p*.75+ +(c[n+264>>2]|0)/+(c[n+260>>2]|0)*.25}p=(o|0)==0?100.0:w;o=p>u;n=o?s:v;s=t+1|0;if((s|0)<(g|0)){t=s;u=o?p:u;v=n}else{m=n;break}}}}while(0);v=e+1124+(m<<2)|0;t=c[v>>2]|0;if((t|0)==0){g=Jm(1552)|0;i=g;Xc(i,e,m);c[v>>2]=i;Yc(b,g,(a[g+256|0]&1)!=0,f);g=c[v>>2]|0;v=(a[g+256|0]&1)==0;i=c[b>>2]|0;m=g+260|0;c[m>>2]=(c[m>>2]|0)+i;m=c[b+4>>2]|0;l=g+264|0;c[l>>2]=(c[l>>2]|0)+m;if(v){v=1;while(1){l=g+268+(v<<2)|0;c[l>>2]=(c[l>>2]|0)+(c[b+864+(v<<2)>>2]|0);l=g+696+(v<<2)|0;c[l>>2]=(c[l>>2]|0)+(c[b+1292+(v<<2)>>2]|0);l=v+1|0;if((l|0)<107){v=l}else{x=i;y=m;break}}}else{v=1;while(1){l=g+268+(v<<2)|0;c[l>>2]=(c[l>>2]|0)+(c[b+8+(v<<2)>>2]|0);l=g+696+(v<<2)|0;c[l>>2]=(c[l>>2]|0)+(c[b+436+(v<<2)>>2]|0);l=v+1|0;if((l|0)<107){v=l}else{x=i;y=m;break}}}}else{Wc(b,t,f);x=c[b>>2]|0;y=c[b+4>>2]|0}f=(a[h]&1)==0;h=e+260|0;c[h>>2]=(c[h>>2]|0)+x;x=e+264|0;c[x>>2]=(c[x>>2]|0)+y;if(f){f=1;do{y=e+268+(f<<2)|0;c[y>>2]=(c[y>>2]|0)+(c[b+864+(f<<2)>>2]|0);y=e+696+(f<<2)|0;c[y>>2]=(c[y>>2]|0)+(c[b+1292+(f<<2)>>2]|0);f=f+1|0;}while((f|0)<107);return}else{f=1;do{y=e+268+(f<<2)|0;c[y>>2]=(c[y>>2]|0)+(c[b+8+(f<<2)>>2]|0);y=e+696+(f<<2)|0;c[y>>2]=(c[y>>2]|0)+(c[b+436+(f<<2)>>2]|0);f=f+1|0;}while((f|0)<107);return}}function Xc(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;g=e+216|0;dn(b|0,e|0,c[g>>2]|0)|0;dn(b+107|0,e+107|0,106)|0;h=c[g>>2]|0;g=b+216|0;c[g>>2]=h;i=e+224|0;j=c[i+4>>2]|0;k=b+224|0;c[k>>2]=c[i>>2];c[k+4>>2]=j;j=e+232|0;i=c[j+4>>2]|0;l=b+232|0;c[l>>2]=c[j>>2];c[l+4>>2]=i;i=e+240|0;j=c[i+4>>2]|0;m=b+240|0;c[m>>2]=c[i>>2];c[m+4>>2]=j;j=e+248|0;i=c[j+4>>2]|0;n=b+248|0;c[n>>2]=c[j>>2];c[n+4>>2]=i;i=e+256|0;a[b+256|0]=a[i]&1^1;bn(b+260|0,0,1292)|0;e=(a[i]&1)==0;i=a[b+106+f|0]|0;j=h-1|0;c[g>>2]=j;g=b+(i&255)|0;h=a[g]|0;o=b+j|0;a[g]=a[o]|0;a[o]=h;a[(d[g]|0)+(b+106)|0]=i;a[(d[o]|0)+(b+106)|0]=j;j=(f|0)<64;if(e){if(j){e=gn(1,0,f|0)|0;b=c[m+4>>2]|K;c[m>>2]=c[m>>2]|e;c[m+4>>2]=b;return}else{b=gn(1,0,f-64|0)|0;m=c[n+4>>2]|K;c[n>>2]=c[n>>2]|b;c[n+4>>2]=m;return}}else{if(j){j=gn(1,0,f|0)|0;m=c[k+4>>2]|K;c[k>>2]=c[k>>2]|j;c[k+4>>2]=m;return}else{m=gn(1,0,f-64|0)|0;f=c[l+4>>2]|K;c[l>>2]=c[l>>2]|m;c[l+4>>2]=f;return}}}function Yc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;h=i;i=i+48|0;j=h|0;bn(b|0,0,1720)|0;c[b>>2]=32;if(f){k=e+224|0;l=e+232|0;m=e+240|0;n=e+248|0}else{k=e+240|0;l=e+248|0;m=e+224|0;n=e+232|0}o=c[k>>2]|0;p=c[k+4>>2]|0;k=c[l>>2]|0;q=c[l+4>>2]|0;l=c[m>>2]|0;r=c[m+4>>2]|0;m=c[n>>2]|0;s=c[n+4>>2]|0;n=e+216|0;t=c[n>>2]|0;u=(t&1|0)!=0^f;f=g|0;g=b+4|0;v=1;w=t;while(1){if((w|0)>0){t=p;x=o;y=q;z=k;A=r;B=l;C=s;D=m;E=w;F=0;while(1){do{if((F|0)==0){G=20}else{H=c[47512+(F*12|0)>>2]|0;I=(c[47516+(F*12|0)>>2]|0)-H|0;if((I|0)<=0){G=20;break}J=I>>3;I=0;L=0;while(1){M=H+(L<<3)|0;N=c[M>>2]|0;O=c[M+4>>2]|0;do{if((N&x|0)==(N|0)&(O&t|0)==(O|0)){M=H+((L|1)<<3)|0;P=c[M>>2]|0;Q=c[M+4>>2]|0;if(!((P&z|0)==(P|0)&(Q&y|0)==(Q|0))){R=I;break}Q=H+((L|2)<<3)|0;if(!((c[Q>>2]&B|0)==0&(c[Q+4>>2]&A|0)==0)){R=I;break}Q=H+((L|3)<<3)|0;P=c[Q+4>>2]|0;if(!((c[Q>>2]&D|0)==0&(P&C|0)==0)){R=I;break}Q=P>>>16|0<<16;P=Q;if(P>>>0<64>>>0){M=gn(1,0,Q|0)|0;if(!((M&x|0)==0&(K&t|0)==0)){R=I;break}}else{M=gn(1,0,P-64|0)|0;if(!((M&z|0)==0&(K&y|0)==0)){R=I;break}}c[j+(I<<2)>>2]=P;R=I+1|0}else{R=I}}while(0);O=L+4|0;if((O|0)<(J|0)){I=R;L=O}else{break}}if((R|0)<=0){G=20;break}L=pn(c[f>>2]|0,c[f+4>>2]|0,-554899859,5)|0;I=en(L,K,11,0)|0;L=K;c[f>>2]=I;c[f+4>>2]=L;I=c[j+((((L&65535)>>>0)%(R>>>0)|0)<<2)>>2]|0;if((I|0)==0){G=20}else{S=I}}}while(0);L27:do{if((G|0)==20){G=0;I=pn(c[f>>2]|0,c[f+4>>2]|0,-554899859,5)|0;L=en(I,K,11,0)|0;I=K;c[f>>2]=L;c[f+4>>2]=I;J=d[e+(((I&65535)>>>0)%(E>>>0)|0)|0]|0;if((E|0)>96){if((c[43656+(J<<2)>>2]|0)<2){T=I;U=L}else{S=J;break}while(1){H=pn(U,T,-554899859,5)|0;O=en(H,K,11,0)|0;H=K;c[f>>2]=O;c[f+4>>2]=H;N=d[e+(((H&65535)>>>0)%(E>>>0)|0)|0]|0;if((c[43656+(N<<2)>>2]|0)<2){T=H;U=O}else{S=N;break L27}}}if((E|0)<=50){S=J;break}if((c[43656+(J<<2)>>2]|0)<1){V=I;W=L}else{S=J;break}while(1){N=pn(W,V,-554899859,5)|0;O=en(N,K,11,0)|0;N=K;c[f>>2]=O;c[f+4>>2]=N;H=d[e+(((N&65535)>>>0)%(E>>>0)|0)|0]|0;if((c[43656+(H<<2)>>2]|0)<1){V=N;W=O}else{S=H;break}}}}while(0);J=a[e+106+S|0]|0;L=E-1|0;I=e+(J&255)|0;H=a[I]|0;O=e+L|0;a[I]=a[O]|0;a[O]=H;a[(d[I]|0)+(e+106)|0]=J;a[(d[O]|0)+(e+106)|0]=L;if((S|0)<64){O=gn(1,0,S|0)|0;X=y;Y=z;Z=K|t;_=O|x}else{O=gn(1,0,S-64|0)|0;X=K|y;Y=O|z;Z=t;_=x}if((L|0)>0){t=A;x=B;y=C;z=D;A=Z;B=_;C=X;D=Y;E=L;F=S}else{$=A;aa=B;ba=C;ca=D;break}}}else{$=p;aa=o;ba=q;ca=k}D=(u^(Zc(e,aa,$,ca,ba)|0))&1^1;c[g>>2]=D+(c[g>>2]|0);if(u){C=1;do{if((C|0)<64){B=gn(1,0,C|0)|0;if((B&aa|0)==0&(K&$|0)==0){G=35}else{G=34}}else{B=gn(1,0,C-64|0)|0;if((B&ca|0)==0&(K&ba|0)==0){G=35}else{G=34}}if((G|0)==34){G=0;B=b+8+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+1;B=b+436+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+D}else if((G|0)==35){G=0;B=b+864+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+1;B=b+1292+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+D}C=C+1|0;}while((C|0)<107)}else{C=1;do{if((C|0)<64){B=gn(1,0,C|0)|0;if((B&aa|0)==0&(K&$|0)==0){G=40}else{G=41}}else{B=gn(1,0,C-64|0)|0;if((B&ca|0)==0&(K&ba|0)==0){G=40}else{G=41}}if((G|0)==40){G=0;B=b+8+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+1;B=b+436+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+D}else if((G|0)==41){G=0;B=b+864+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+1;B=b+1292+(C<<2)|0;c[B>>2]=(c[B>>2]|0)+D}C=C+1|0;}while((C|0)<107)}if((v|0)>=32){break}v=v+1|0;w=c[n>>2]|0}i=h;return}function Zc(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;a=i;i=i+424|0;g=a|0;h=g|0;j=43224;k=0;l=f;f=e;e=d;d=b;while(1){b=c[j>>2]|0;if((b|0)<64){m=gn(1,0,b|0)|0;if((m&d|0)==0&(K&e|0)==0){n=e;o=d;p=l;q=f;r=k}else{s=5}}else{m=gn(1,0,b-64|0)|0;if((m&f|0)==0&(K&l|0)==0){n=e;o=d;p=l;q=f;r=k}else{s=5}}if((s|0)==5){s=0;c[h>>2]=b;b=l;m=f;t=1;u=0;v=e;w=d;while(1){x=t-1|0;y=c[g+(x<<2)>>2]|0;z=c[42792+(y<<2)>>2]|u;if((y|0)==0){A=b;B=m;C=x;D=v;E=w}else{F=b;G=m;H=x;x=v;I=w;J=0;L=c[44088+(y<<5)>>2]|0;while(1){M=(L|0)<64;do{if(M){N=gn(1,0,L|0)|0;O=K;if(!((N&I|0)==0&(O&x|0)==0)){P=O;Q=N;s=15;break}if((L|0)>63){s=12}else{R=J;S=x;T=I;U=H;V=F;W=G}}else{s=12}}while(0);do{if((s|0)==12){s=0;N=gn(1,0,L-64|0)|0;O=K;if((N&G|0)==0&(O&F|0)==0){R=J;S=x;T=I;U=H;V=F;W=G;break}if(M){X=gn(1,0,L|0)|0;P=K;Q=X;s=15;break}else{Y=x;Z=I;_=F&~O;$=G&~N;s=17;break}}}while(0);if((s|0)==15){s=0;Y=x&~P;Z=I&~Q;_=F;$=G;s=17}if((s|0)==17){s=0;c[g+(H<<2)>>2]=L;R=J+1|0;S=Y;T=Z;U=H+1|0;V=_;W=$}M=R+1|0;N=c[44088+(y<<5)+(M<<2)>>2]|0;if((N|0)==0){A=V;B=W;C=U;D=S;E=T;break}else{F=V;G=W;H=U;x=S;I=T;J=M;L=N}}}if((C|0)==0){break}else{b=A;m=B;t=C;u=z;v=D;w=E}}w=c[9672+(z<<2)>>2]|k;if((-18290560>>>(w>>>0)&1|0)==0){n=D;o=E;p=A;q=B;r=w}else{aa=1;s=22;break}}w=j+4|0;if((w|0)==43652){aa=0;s=23;break}else{j=w;k=r;l=p;f=q;e=n;d=o}}if((s|0)==22){i=a;return aa|0}else if((s|0)==23){i=a;return aa|0}return 0}function _c(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;d=a+4|0;e=a|0;f=c[e>>2]|0;g=(c[d>>2]|0)-f>>2;h=g+1|0;if(h>>>0>1073741823>>>0){Bi(a)}i=a+8|0;a=(c[i>>2]|0)-f|0;if(a>>2>>>0>536870910>>>0){j=1073741823;k=5}else{f=a>>1;a=f>>>0<h>>>0?h:f;if((a|0)==0){l=0;m=0}else{j=a;k=5}}if((k|0)==5){l=Jm(j<<2)|0;m=j}j=l+(g<<2)|0;if((j|0)!=0){c[j>>2]=c[b>>2]}b=c[e>>2]|0;j=(c[d>>2]|0)-b|0;k=l+(g-(j>>2)<<2)|0;g=b;an(k|0,g|0,j)|0;c[e>>2]=k;c[d>>2]=l+(h<<2);c[i>>2]=l+(m<<2);if((b|0)==0){return}Lm(g);return}function $c(){ad();return}function ad(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,zc=0,Ac=0,Bc=0,Cc=0,Dc=0,Ec=0,Fc=0,Gc=0,Hc=0,Ic=0,Jc=0,Kc=0,Lc=0,Mc=0,Nc=0,Oc=0,Pc=0,Qc=0,Rc=0,Sc=0,Tc=0,Uc=0,Vc=0,Wc=0,Xc=0,Yc=0,Zc=0,_c=0,$c=0,ad=0,bd=0,cd=0,dd=0,ed=0,fd=0,gd=0,hd=0,id=0,jd=0,kd=0,ld=0,md=0,nd=0,od=0,pd=0,qd=0,rd=0,sd=0,td=0,ud=0,vd=0,wd=0,xd=0,yd=0,zd=0,Ad=0,Bd=0,Cd=0,Dd=0,Ed=0,Fd=0,Gd=0,Hd=0,Id=0,Jd=0,Kd=0,Ld=0,Md=0,Nd=0,Od=0,Pd=0,Qd=0,Rd=0,Sd=0,Td=0,Ud=0,Vd=0,Wd=0,Xd=0,Yd=0,Zd=0,_d=0;a=i;i=i+22560|0;b=a|0;d=a+64|0;e=a+128|0;f=a+416|0;g=a+480|0;h=a+544|0;j=a+896|0;k=a+1184|0;l=a+1536|0;m=a+1600|0;n=a+1664|0;o=a+1984|0;p=a+2336|0;q=a+2528|0;r=a+2880|0;s=a+3200|0;t=a+3264|0;v=a+3328|0;w=a+3648|0;x=a+3968|0;y=a+4160|0;z=a+4352|0;A=a+4544|0;B=a+4864|0;C=a+5184|0;D=a+5248|0;E=a+5312|0;F=a+5664|0;G=a+6016|0;H=a+6208|0;I=a+6400|0;J=a+6592|0;K=a+6784|0;L=a+6976|0;M=a+7328|0;N=a+7680|0;O=a+7744|0;P=a+7808|0;Q=a+8096|0;R=a+8384|0;S=a+8576|0;T=a+8768|0;U=a+8960|0;V=a+9120|0;W=a+9312|0;X=a+9504|0;Y=a+9696|0;Z=a+9984|0;_=a+10272|0;$=a+10336|0;aa=a+10400|0;ba=a+10752|0;ca=a+11104|0;da=a+11296|0;ea=a+11488|0;fa=a+11680|0;ga=a+11872|0;ha=a+12064|0;ia=a+12256|0;ja=a+12608|0;ka=a+12960|0;la=a+13024|0;ma=a+13088|0;na=a+13408|0;oa=a+13728|0;pa=a+13920|0;qa=a+14112|0;ra=a+14304|0;sa=a+14496|0;ta=a+14688|0;ua=a+15008|0;va=a+15328|0;wa=a+15392|0;xa=a+15456|0;ya=a+15776|0;za=a+16128|0;Aa=a+16320|0;Ba=a+16512|0;Ca=a+16704|0;Da=a+16896|0;Ea=a+17248|0;Fa=a+17568|0;Ga=a+17632|0;Ha=a+17696|0;Ia=a+18048|0;Ja=a+18336|0;Ka=a+18688|0;La=a+19008|0;Ma=a+19360|0;Na=a+19648|0;Oa=a+2e4|0;Pa=a+20064|0;Qa=a+20128|0;Ra=a+20416|0;Sa=a+20768|0;Ta=a+21088|0;Ua=a+21408|0;Va=a+21760|0;Wa=a+22048|0;Xa=a+22112|0;Ya=a+22176|0;Za=a+22240|0;_a=a+22304|0;ab=a+22368|0;bb=a+22432|0;cb=a+22496|0;c[11878]=0;c[11879]=0;c[11880]=0;db=b|0;c[db>>2]=8;c[db+4>>2]=0;db=b+8|0;c[db>>2]=0;c[db+4>>2]=0;db=b+16|0;c[db>>2]=16;c[db+4>>2]=0;db=b+24|0;c[db>>2]=0;c[db+4>>2]=262144;db=b+32|0;c[db>>2]=8;c[db+4>>2]=0;db=b+40|0;c[db>>2]=0;c[db+4>>2]=0;db=b+48|0;c[db>>2]=4;c[db+4>>2]=0;db=b+56|0;c[db>>2]=0;c[db+4>>2]=131072;c[11881]=0;c[11882]=0;c[11883]=0;db=Jm(64)|0;eb=db;c[11882]=eb;c[11881]=eb;c[11883]=db+64;if((db|0)==0){fb=0}else{c[eb>>2]=8;c[eb+4>>2]=0;fb=eb}eb=fb+8|0;c[11882]=eb;c[eb>>2]=0;c[eb+4>>2]=0;eb=(c[11882]|0)+8|0;c[11882]=eb;c[eb>>2]=16;c[eb+4>>2]=0;eb=(c[11882]|0)+8|0;c[11882]=eb;c[eb>>2]=0;c[eb+4>>2]=262144;eb=(c[11882]|0)+8|0;c[11882]=eb;c[eb>>2]=8;c[eb+4>>2]=0;eb=(c[11882]|0)+8|0;c[11882]=eb;c[eb>>2]=0;c[eb+4>>2]=0;eb=(c[11882]|0)+8|0;c[11882]=eb;fb=b+48|0;db=c[fb+4>>2]|0;c[eb>>2]=c[fb>>2];c[eb+4>>2]=db;db=(c[11882]|0)+8|0;c[11882]=db;eb=b+56|0;b=c[eb+4>>2]|0;c[db>>2]=c[eb>>2];c[db+4>>2]=b;c[11882]=(c[11882]|0)+8;b=d|0;c[b>>2]=64;c[b+4>>2]=0;b=d+8|0;c[b>>2]=0;c[b+4>>2]=0;b=d+16|0;c[b>>2]=32;c[b+4>>2]=0;b=d+24|0;c[b>>2]=0;c[b+4>>2]=327680;b=d+32|0;c[b>>2]=8;c[b+4>>2]=0;b=d+40|0;c[b>>2]=0;c[b+4>>2]=0;b=d+48|0;c[b>>2]=2;c[b+4>>2]=0;b=d+56|0;c[b>>2]=0;c[b+4>>2]=65536;c[11884]=0;c[11885]=0;c[11886]=0;b=Jm(64)|0;db=b;c[11885]=db;c[11884]=db;c[11886]=b+64;if((b|0)==0){gb=0}else{c[db>>2]=64;c[db+4>>2]=0;gb=db}db=gb+8|0;c[11885]=db;c[db>>2]=0;c[db+4>>2]=0;db=(c[11885]|0)+8|0;c[11885]=db;c[db>>2]=32;c[db+4>>2]=0;db=(c[11885]|0)+8|0;c[11885]=db;c[db>>2]=0;c[db+4>>2]=327680;db=(c[11885]|0)+8|0;c[11885]=db;c[db>>2]=8;c[db+4>>2]=0;db=(c[11885]|0)+8|0;c[11885]=db;c[db>>2]=0;c[db+4>>2]=0;db=(c[11885]|0)+8|0;c[11885]=db;gb=d+48|0;b=c[gb+4>>2]|0;c[db>>2]=c[gb>>2];c[db+4>>2]=b;b=(c[11885]|0)+8|0;c[11885]=b;db=d+56|0;d=c[db+4>>2]|0;c[b>>2]=c[db>>2];c[b+4>>2]=d;c[11885]=(c[11885]|0)+8;d=e|0;c[d>>2]=128;c[d+4>>2]=0;b=e+8|0;c[b>>2]=0;c[b+4>>2]=0;b=e+16|0;c[b>>2]=30;c[b+4>>2]=0;b=e+24|0;c[b>>2]=0;c[b+4>>2]=196608;b=e+32|0;c[b>>2]=128;c[b+4>>2]=0;b=e+40|0;c[b>>2]=0;c[b+4>>2]=0;b=e+48|0;c[b>>2]=100;c[b+4>>2]=0;b=e+56|0;c[b>>2]=0;c[b+4>>2]=393216;b=e+64|0;c[b>>2]=128;c[b+4>>2]=0;b=e+72|0;c[b>>2]=0;c[b+4>>2]=0;b=e+80|0;c[b>>2]=784;c[b+4>>2]=0;b=e+88|0;c[b>>2]=0;c[b+4>>2]=524288;b=e+96|0;c[b>>2]=66;c[b+4>>2]=0;b=e+104|0;c[b>>2]=0;c[b+4>>2]=0;b=e+112|0;c[b>>2]=4;c[b+4>>2]=0;b=e+120|0;c[b>>2]=0;c[b+4>>2]=131072;b=e+128|0;c[b>>2]=132;c[b+4>>2]=0;b=e+136|0;c[b>>2]=0;c[b+4>>2]=0;b=e+144|0;c[b>>2]=64;c[b+4>>2]=0;b=e+152|0;c[b>>2]=0;c[b+4>>2]=393216;b=e+160|0;c[b>>2]=320;c[b+4>>2]=0;b=e+168|0;c[b>>2]=0;c[b+4>>2]=0;b=e+176|0;c[b>>2]=128;c[b+4>>2]=0;b=e+184|0;c[b>>2]=0;c[b+4>>2]=458752;b=e+192|0;c[b>>2]=144;c[b+4>>2]=0;b=e+200|0;c[b>>2]=0;c[b+4>>2]=0;b=e+208|0;c[b>>2]=256;c[b+4>>2]=0;b=e+216|0;c[b>>2]=0;c[b+4>>2]=524288;b=e+224|0;c[b>>2]=258;c[b+4>>2]=0;b=e+232|0;c[b>>2]=0;c[b+4>>2]=0;b=e+240|0;c[b>>2]=16;c[b+4>>2]=0;b=e+248|0;c[b>>2]=0;c[b+4>>2]=262144;b=e+256|0;c[b>>2]=20;c[b+4>>2]=0;b=e+264|0;c[b>>2]=0;c[b+4>>2]=0;b=e+272|0;c[b>>2]=2;c[b+4>>2]=0;b=e+280|0;c[b>>2]=0;c[b+4>>2]=65536;c[11887]=0;c[11888]=0;c[11889]=0;b=Jm(288)|0;db=b;c[11888]=db;c[11887]=db;c[11889]=b+288;b=e+288|0;e=d;d=db;do{if((d|0)==0){hb=0}else{db=c[e+4>>2]|0;c[d>>2]=c[e>>2];c[d+4>>2]=db;hb=c[11888]|0}d=hb+8|0;c[11888]=d;e=e+8|0;}while((e|0)!=(b|0));b=f|0;c[b>>2]=256;c[b+4>>2]=0;b=f+8|0;c[b>>2]=0;c[b+4>>2]=0;b=f+16|0;c[b>>2]=512;c[b+4>>2]=0;b=f+24|0;c[b>>2]=0;c[b+4>>2]=589824;b=f+32|0;c[b>>2]=8;c[b+4>>2]=0;b=f+40|0;c[b>>2]=0;c[b+4>>2]=0;b=f+48|0;c[b>>2]=2;c[b+4>>2]=0;b=f+56|0;c[b>>2]=0;c[b+4>>2]=65536;c[11890]=0;c[11891]=0;c[11892]=0;b=Jm(64)|0;e=b;c[11891]=e;c[11890]=e;c[11892]=b+64;if((b|0)==0){ib=0}else{c[e>>2]=256;c[e+4>>2]=0;ib=e}e=ib+8|0;c[11891]=e;c[e>>2]=0;c[e+4>>2]=0;e=(c[11891]|0)+8|0;c[11891]=e;c[e>>2]=512;c[e+4>>2]=0;e=(c[11891]|0)+8|0;c[11891]=e;c[e>>2]=0;c[e+4>>2]=589824;e=(c[11891]|0)+8|0;c[11891]=e;c[e>>2]=8;c[e+4>>2]=0;e=(c[11891]|0)+8|0;c[11891]=e;c[e>>2]=0;c[e+4>>2]=0;e=(c[11891]|0)+8|0;c[11891]=e;ib=f+48|0;b=c[ib+4>>2]|0;c[e>>2]=c[ib>>2];c[e+4>>2]=b;b=(c[11891]|0)+8|0;c[11891]=b;e=f+56|0;f=c[e+4>>2]|0;c[b>>2]=c[e>>2];c[b+4>>2]=f;c[11891]=(c[11891]|0)+8;f=g|0;c[f>>2]=2048;c[f+4>>2]=0;f=g+8|0;c[f>>2]=0;c[f+4>>2]=0;f=g+16|0;c[f>>2]=1024;c[f+4>>2]=0;f=g+24|0;c[f>>2]=0;c[f+4>>2]=655360;f=g+32|0;c[f>>2]=64;c[f+4>>2]=0;f=g+40|0;c[f>>2]=0;c[f+4>>2]=0;f=g+48|0;c[f>>2]=4;c[f+4>>2]=0;f=g+56|0;c[f>>2]=0;c[f+4>>2]=131072;c[11893]=0;c[11894]=0;c[11895]=0;f=Jm(64)|0;b=f;c[11894]=b;c[11893]=b;c[11895]=f+64;if((f|0)==0){jb=0}else{c[b>>2]=2048;c[b+4>>2]=0;jb=b}b=jb+8|0;c[11894]=b;c[b>>2]=0;c[b+4>>2]=0;b=(c[11894]|0)+8|0;c[11894]=b;c[b>>2]=1024;c[b+4>>2]=0;b=(c[11894]|0)+8|0;c[11894]=b;c[b>>2]=0;c[b+4>>2]=655360;b=(c[11894]|0)+8|0;c[11894]=b;c[b>>2]=64;c[b+4>>2]=0;b=(c[11894]|0)+8|0;c[11894]=b;c[b>>2]=0;c[b+4>>2]=0;b=(c[11894]|0)+8|0;c[11894]=b;jb=g+48|0;f=c[jb+4>>2]|0;c[b>>2]=c[jb>>2];c[b+4>>2]=f;f=(c[11894]|0)+8|0;c[11894]=f;b=g+56|0;g=c[b+4>>2]|0;c[f>>2]=c[b>>2];c[f+4>>2]=g;c[11894]=(c[11894]|0)+8;g=h|0;c[g>>2]=128;c[g+4>>2]=0;f=h+8|0;c[f>>2]=0;c[f+4>>2]=0;f=h+16|0;c[f>>2]=30;c[f+4>>2]=0;f=h+24|0;c[f>>2]=0;c[f+4>>2]=196608;f=h+32|0;c[f>>2]=128;c[f+4>>2]=0;f=h+40|0;c[f>>2]=0;c[f+4>>2]=0;f=h+48|0;c[f>>2]=100;c[f+4>>2]=0;f=h+56|0;c[f>>2]=0;c[f+4>>2]=393216;f=h+64|0;c[f>>2]=128;c[f+4>>2]=0;f=h+72|0;c[f>>2]=0;c[f+4>>2]=0;f=h+80|0;c[f>>2]=784;c[f+4>>2]=0;f=h+88|0;c[f>>2]=0;c[f+4>>2]=524288;f=h+96|0;c[f>>2]=4096;c[f+4>>2]=0;f=h+104|0;c[f>>2]=0;c[f+4>>2]=0;f=h+112|0;c[f>>2]=100;c[f+4>>2]=0;f=h+120|0;c[f>>2]=0;c[f+4>>2]=393216;f=h+128|0;c[f>>2]=4096;c[f+4>>2]=0;f=h+136|0;c[f>>2]=0;c[f+4>>2]=0;f=h+144|0;c[f>>2]=3104;c[f+4>>2]=0;f=h+152|0;c[f>>2]=0;c[f+4>>2]=720896;f=h+160|0;c[f>>2]=132;c[f+4>>2]=0;f=h+168|0;c[f>>2]=0;c[f+4>>2]=0;f=h+176|0;c[f>>2]=8;c[f+4>>2]=0;f=h+184|0;c[f>>2]=0;c[f+4>>2]=196608;f=h+192|0;c[f>>2]=4104;c[f+4>>2]=0;f=h+200|0;c[f>>2]=0;c[f+4>>2]=0;f=h+208|0;c[f>>2]=128;c[f+4>>2]=0;f=h+216|0;c[f>>2]=0;c[f+4>>2]=458752;f=h+224|0;c[f>>2]=2176;c[f+4>>2]=0;f=h+232|0;c[f>>2]=0;c[f+4>>2]=0;f=h+240|0;c[f>>2]=4096;c[f+4>>2]=0;f=h+248|0;c[f>>2]=0;c[f+4>>2]=786432;f=h+256|0;c[f>>2]=4128;c[f+4>>2]=0;f=h+264|0;c[f>>2]=0;c[f+4>>2]=0;f=h+272|0;c[f>>2]=2048;c[f+4>>2]=0;f=h+280|0;c[f>>2]=0;c[f+4>>2]=720896;f=h+288|0;c[f>>2]=2052;c[f+4>>2]=0;f=h+296|0;c[f>>2]=0;c[f+4>>2]=0;f=h+304|0;c[f>>2]=32;c[f+4>>2]=0;f=h+312|0;c[f>>2]=0;c[f+4>>2]=327680;f=h+320|0;c[f>>2]=40;c[f+4>>2]=0;f=h+328|0;c[f>>2]=0;c[f+4>>2]=0;f=h+336|0;c[f>>2]=4;c[f+4>>2]=0;f=h+344|0;c[f>>2]=0;c[f+4>>2]=131072;c[11896]=0;c[11897]=0;c[11898]=0;f=Jm(352)|0;b=f;c[11897]=b;c[11896]=b;c[11898]=f+352;f=h+352|0;h=g;g=b;do{if((g|0)==0){kb=0}else{b=c[h+4>>2]|0;c[g>>2]=c[h>>2];c[g+4>>2]=b;kb=c[11897]|0}g=kb+8|0;c[11897]=g;h=h+8|0;}while((h|0)!=(f|0));f=j|0;c[f>>2]=8192;c[f+4>>2]=0;h=j+8|0;c[h>>2]=0;c[h+4>>2]=0;h=j+16|0;c[h>>2]=456;c[h+4>>2]=0;h=j+24|0;c[h>>2]=0;c[h+4>>2]=458752;h=j+32|0;c[h>>2]=8192;c[h+4>>2]=0;h=j+40|0;c[h>>2]=0;c[h+4>>2]=0;h=j+48|0;c[h>>2]=6208;c[h+4>>2]=0;h=j+56|0;c[h>>2]=0;c[h+4>>2]=786432;h=j+64|0;c[h>>2]=8192;c[h+4>>2]=0;h=j+72|0;c[h>>2]=0;c[h+4>>2]=0;h=j+80|0;c[h>>2]=49408;c[h+4>>2]=0;h=j+88|0;c[h>>2]=0;c[h+4>>2]=917504;h=j+96|0;c[h>>2]=4104;c[h+4>>2]=0;h=j+104|0;c[h>>2]=0;c[h+4>>2]=0;h=j+112|0;c[h>>2]=64;c[h+4>>2]=0;h=j+120|0;c[h>>2]=0;c[h+4>>2]=393216;h=j+128|0;c[h>>2]=8256;c[h+4>>2]=0;h=j+136|0;c[h>>2]=0;c[h+4>>2]=0;h=j+144|0;c[h>>2]=4096;c[h+4>>2]=0;h=j+152|0;c[h>>2]=0;c[h+4>>2]=786432;h=j+160|0;c[h>>2]=20480;c[h+4>>2]=0;h=j+168|0;c[h>>2]=0;c[h+4>>2]=0;h=j+176|0;c[h>>2]=8192;c[h+4>>2]=0;h=j+184|0;c[h>>2]=0;c[h+4>>2]=851968;h=j+192|0;c[h>>2]=8448;c[h+4>>2]=0;h=j+200|0;c[h>>2]=0;c[h+4>>2]=0;h=j+208|0;c[h>>2]=16384;c[h+4>>2]=0;h=j+216|0;c[h>>2]=0;c[h+4>>2]=917504;h=j+224|0;c[h>>2]=16392;c[h+4>>2]=0;h=j+232|0;c[h>>2]=0;c[h+4>>2]=0;h=j+240|0;c[h>>2]=256;c[h+4>>2]=0;h=j+248|0;c[h>>2]=0;c[h+4>>2]=524288;h=j+256|0;c[h>>2]=320;c[h+4>>2]=0;h=j+264|0;c[h>>2]=0;c[h+4>>2]=0;h=j+272|0;c[h>>2]=8;c[h+4>>2]=0;h=j+280|0;c[h>>2]=0;c[h+4>>2]=196608;c[11899]=0;c[11900]=0;c[11901]=0;h=Jm(288)|0;g=h;c[11900]=g;c[11899]=g;c[11901]=h+288;h=j+288|0;j=f;f=g;do{if((f|0)==0){lb=0}else{g=c[j+4>>2]|0;c[f>>2]=c[j>>2];c[f+4>>2]=g;lb=c[11900]|0}f=lb+8|0;c[11900]=f;j=j+8|0;}while((j|0)!=(h|0));h=k|0;c[h>>2]=16384;c[h+4>>2]=0;j=k+8|0;c[j>>2]=0;c[j+4>>2]=0;j=k+16|0;c[j>>2]=784;c[j+4>>2]=0;j=k+24|0;c[j>>2]=0;c[j+4>>2]=524288;j=k+32|0;c[j>>2]=16384;c[j+4>>2]=0;j=k+40|0;c[j>>2]=0;c[j+4>>2]=0;j=k+48|0;c[j>>2]=98816;c[j+4>>2]=0;j=k+56|0;c[j>>2]=0;c[j+4>>2]=983040;j=k+64|0;c[j>>2]=128;c[j+4>>2]=0;j=k+72|0;c[j>>2]=0;c[j+4>>2]=0;j=k+80|0;c[j>>2]=30;c[j+4>>2]=0;j=k+88|0;c[j>>2]=0;c[j+4>>2]=196608;j=k+96|0;c[j>>2]=128;c[j+4>>2]=0;j=k+104|0;c[j>>2]=0;c[j+4>>2]=0;j=k+112|0;c[j>>2]=100;c[j+4>>2]=0;j=k+120|0;c[j>>2]=0;c[j+4>>2]=393216;j=k+128|0;c[j>>2]=128;c[j+4>>2]=0;j=k+136|0;c[j>>2]=0;c[j+4>>2]=0;j=k+144|0;c[j>>2]=784;c[j+4>>2]=0;j=k+152|0;c[j>>2]=0;c[j+4>>2]=524288;j=k+160|0;c[j>>2]=520;c[j+4>>2]=0;j=k+168|0;c[j>>2]=0;c[j+4>>2]=0;j=k+176|0;c[j>>2]=16;c[j+4>>2]=0;j=k+184|0;c[j>>2]=0;c[j+4>>2]=262144;j=k+192|0;c[j>>2]=32784;c[j+4>>2]=0;j=k+200|0;c[j>>2]=0;c[j+4>>2]=0;j=k+208|0;c[j>>2]=512;c[j+4>>2]=0;j=k+216|0;c[j>>2]=0;c[j+4>>2]=589824;j=k+224|0;c[j>>2]=16896;c[j+4>>2]=0;j=k+232|0;c[j>>2]=0;c[j+4>>2]=0;j=k+240|0;c[j>>2]=32768;c[j+4>>2]=0;j=k+248|0;c[j>>2]=0;c[j+4>>2]=983040;j=k+256|0;c[j>>2]=32896;c[j+4>>2]=0;j=k+264|0;c[j>>2]=0;c[j+4>>2]=0;j=k+272|0;c[j>>2]=16384;c[j+4>>2]=0;j=k+280|0;c[j>>2]=0;c[j+4>>2]=917504;j=k+288|0;c[j>>2]=16392;c[j+4>>2]=0;j=k+296|0;c[j>>2]=0;c[j+4>>2]=0;j=k+304|0;c[j>>2]=128;c[j+4>>2]=0;j=k+312|0;c[j>>2]=0;c[j+4>>2]=458752;j=k+320|0;c[j>>2]=144;c[j+4>>2]=0;j=k+328|0;c[j>>2]=0;c[j+4>>2]=0;j=k+336|0;c[j>>2]=8;c[j+4>>2]=0;j=k+344|0;c[j>>2]=0;c[j+4>>2]=196608;c[11902]=0;c[11903]=0;c[11904]=0;j=Jm(352)|0;f=j;c[11903]=f;c[11902]=f;c[11904]=j+352;j=k+352|0;k=h;h=f;do{if((h|0)==0){mb=0}else{f=c[k+4>>2]|0;c[h>>2]=c[k>>2];c[h+4>>2]=f;mb=c[11903]|0}h=mb+8|0;c[11903]=h;k=k+8|0;}while((k|0)!=(j|0));j=l|0;c[j>>2]=256;c[j+4>>2]=0;j=l+8|0;c[j>>2]=0;c[j+4>>2]=0;j=l+16|0;c[j>>2]=16;c[j+4>>2]=0;j=l+24|0;c[j>>2]=0;c[j+4>>2]=262144;j=l+32|0;c[j>>2]=32768;c[j+4>>2]=0;j=l+40|0;c[j>>2]=0;c[j+4>>2]=0;j=l+48|0;c[j>>2]=65536;c[j+4>>2]=0;j=l+56|0;c[j>>2]=0;c[j+4>>2]=1048576;c[11905]=0;c[11906]=0;c[11907]=0;j=Jm(64)|0;k=j;c[11906]=k;c[11905]=k;c[11907]=j+64;if((j|0)==0){nb=0}else{c[k>>2]=256;c[k+4>>2]=0;nb=k}k=nb+8|0;c[11906]=k;c[k>>2]=0;c[k+4>>2]=0;k=(c[11906]|0)+8|0;c[11906]=k;c[k>>2]=16;c[k+4>>2]=0;k=(c[11906]|0)+8|0;c[11906]=k;c[k>>2]=0;c[k+4>>2]=262144;k=(c[11906]|0)+8|0;c[11906]=k;c[k>>2]=32768;c[k+4>>2]=0;k=(c[11906]|0)+8|0;c[11906]=k;c[k>>2]=0;c[k+4>>2]=0;k=(c[11906]|0)+8|0;c[11906]=k;nb=l+48|0;j=c[nb+4>>2]|0;c[k>>2]=c[nb>>2];c[k+4>>2]=j;j=(c[11906]|0)+8|0;c[11906]=j;k=l+56|0;l=c[k+4>>2]|0;c[j>>2]=c[k>>2];c[j+4>>2]=l;c[11906]=(c[11906]|0)+8;l=m|0;c[l>>2]=2048;c[l+4>>2]=0;l=m+8|0;c[l>>2]=0;c[l+4>>2]=0;l=m+16|0;c[l>>2]=32;c[l+4>>2]=0;l=m+24|0;c[l>>2]=0;c[l+4>>2]=327680;l=m+32|0;c[l>>2]=262144;c[l+4>>2]=0;l=m+40|0;c[l>>2]=0;c[l+4>>2]=0;l=m+48|0;c[l>>2]=131072;c[l+4>>2]=0;l=m+56|0;c[l>>2]=0;c[l+4>>2]=1114112;c[11908]=0;c[11909]=0;c[11910]=0;l=Jm(64)|0;j=l;c[11909]=j;c[11908]=j;c[11910]=l+64;if((l|0)==0){ob=0}else{c[j>>2]=2048;c[j+4>>2]=0;ob=j}j=ob+8|0;c[11909]=j;c[j>>2]=0;c[j+4>>2]=0;j=(c[11909]|0)+8|0;c[11909]=j;c[j>>2]=32;c[j+4>>2]=0;j=(c[11909]|0)+8|0;c[11909]=j;c[j>>2]=0;c[j+4>>2]=327680;j=(c[11909]|0)+8|0;c[11909]=j;c[j>>2]=262144;c[j+4>>2]=0;j=(c[11909]|0)+8|0;c[11909]=j;c[j>>2]=0;c[j+4>>2]=0;j=(c[11909]|0)+8|0;c[11909]=j;ob=m+48|0;l=c[ob+4>>2]|0;c[j>>2]=c[ob>>2];c[j+4>>2]=l;l=(c[11909]|0)+8|0;c[11909]=l;j=m+56|0;m=c[j+4>>2]|0;c[l>>2]=c[j>>2];c[l+4>>2]=m;c[11909]=(c[11909]|0)+8;m=n|0;c[m>>2]=524288;c[m+4>>2]=0;l=n+8|0;c[l>>2]=0;c[l+4>>2]=0;l=n+16|0;c[l>>2]=394240;c[l+4>>2]=0;l=n+24|0;c[l>>2]=0;c[l+4>>2]=1179648;l=n+32|0;c[l>>2]=524288;c[l+4>>2]=0;l=n+40|0;c[l>>2]=0;c[l+4>>2]=0;l=n+48|0;c[l>>2]=3104;c[l+4>>2]=0;l=n+56|0;c[l>>2]=0;c[l+4>>2]=720896;l=n+64|0;c[l>>2]=4096;c[l+4>>2]=0;l=n+72|0;c[l>>2]=0;c[l+4>>2]=0;l=n+80|0;c[l>>2]=100;c[l+4>>2]=0;l=n+88|0;c[l>>2]=0;c[l+4>>2]=393216;l=n+96|0;c[l>>2]=4096;c[l+4>>2]=0;l=n+104|0;c[l>>2]=0;c[l+4>>2]=0;l=n+112|0;c[l>>2]=3104;c[l+4>>2]=0;l=n+120|0;c[l>>2]=0;c[l+4>>2]=720896;l=n+128|0;c[l>>2]=525312;c[l+4>>2]=0;l=n+136|0;c[l>>2]=0;c[l+4>>2]=0;l=n+144|0;c[l>>2]=262144;c[l+4>>2]=0;l=n+152|0;c[l>>2]=0;c[l+4>>2]=1179648;l=n+160|0;c[l>>2]=262176;c[l+4>>2]=0;l=n+168|0;c[l>>2]=0;c[l+4>>2]=0;l=n+176|0;c[l>>2]=1024;c[l+4>>2]=0;l=n+184|0;c[l>>2]=0;c[l+4>>2]=655360;l=n+192|0;c[l>>2]=1088;c[l+4>>2]=0;l=n+200|0;c[l>>2]=0;c[l+4>>2]=0;l=n+208|0;c[l>>2]=32;c[l+4>>2]=0;l=n+216|0;c[l>>2]=0;c[l+4>>2]=327680;l=n+224|0;c[l>>2]=4128;c[l+4>>2]=0;l=n+232|0;c[l>>2]=0;c[l+4>>2]=0;l=n+240|0;c[l>>2]=64;c[l+4>>2]=0;l=n+248|0;c[l>>2]=0;c[l+4>>2]=393216;l=n+256|0;c[l>>2]=524352;c[l+4>>2]=0;l=n+264|0;c[l>>2]=0;c[l+4>>2]=0;l=n+272|0;c[l>>2]=4096;c[l+4>>2]=0;l=n+280|0;c[l>>2]=0;c[l+4>>2]=786432;l=n+288|0;c[l>>2]=266240;c[l+4>>2]=0;l=n+296|0;c[l>>2]=0;c[l+4>>2]=0;l=n+304|0;c[l>>2]=524288;c[l+4>>2]=0;l=n+312|0;c[l>>2]=0;c[l+4>>2]=1245184;c[11911]=0;c[11912]=0;c[11913]=0;l=Jm(320)|0;j=l;c[11912]=j;c[11911]=j;c[11913]=l+320;l=n+320|0;n=m;m=j;do{if((m|0)==0){pb=0}else{j=c[n+4>>2]|0;c[m>>2]=c[n>>2];c[m+4>>2]=j;pb=c[11912]|0}m=pb+8|0;c[11912]=m;n=n+8|0;}while((n|0)!=(l|0));l=o|0;c[l>>2]=1048576;c[l+4>>2]=0;n=o+8|0;c[n>>2]=0;c[n+4>>2]=0;n=o+16|0;c[n>>2]=788480;c[n+4>>2]=0;n=o+24|0;c[n>>2]=0;c[n+4>>2]=1245184;n=o+32|0;c[n>>2]=1048576;c[n+4>>2]=0;n=o+40|0;c[n>>2]=0;c[n+4>>2]=0;n=o+48|0;c[n>>2]=6208;c[n+4>>2]=0;n=o+56|0;c[n>>2]=0;c[n+4>>2]=786432;n=o+64|0;c[n>>2]=8192;c[n+4>>2]=0;n=o+72|0;c[n>>2]=0;c[n+4>>2]=0;n=o+80|0;c[n>>2]=456;c[n+4>>2]=0;n=o+88|0;c[n>>2]=0;c[n+4>>2]=458752;n=o+96|0;c[n>>2]=8192;c[n+4>>2]=0;n=o+104|0;c[n>>2]=0;c[n+4>>2]=0;n=o+112|0;c[n>>2]=6208;c[n+4>>2]=0;n=o+120|0;c[n>>2]=0;c[n+4>>2]=786432;n=o+128|0;c[n>>2]=8192;c[n+4>>2]=0;n=o+136|0;c[n>>2]=0;c[n+4>>2]=0;n=o+144|0;c[n>>2]=49408;c[n+4>>2]=0;n=o+152|0;c[n>>2]=0;c[n+4>>2]=917504;n=o+160|0;c[n>>2]=532480;c[n+4>>2]=0;n=o+168|0;c[n>>2]=0;c[n+4>>2]=0;n=o+176|0;c[n>>2]=1048576;c[n+4>>2]=0;n=o+184|0;c[n>>2]=0;c[n+4>>2]=1310720;n=o+192|0;c[n>>2]=1048704;c[n+4>>2]=0;n=o+200|0;c[n>>2]=0;c[n+4>>2]=0;n=o+208|0;c[n>>2]=8192;c[n+4>>2]=0;n=o+216|0;c[n>>2]=0;c[n+4>>2]=851968;n=o+224|0;c[n>>2]=8256;c[n+4>>2]=0;n=o+232|0;c[n>>2]=0;c[n+4>>2]=0;n=o+240|0;c[n>>2]=128;c[n+4>>2]=0;n=o+248|0;c[n>>2]=0;c[n+4>>2]=458752;n=o+256|0;c[n>>2]=2176;c[n+4>>2]=0;n=o+264|0;c[n>>2]=0;c[n+4>>2]=0;n=o+272|0;c[n>>2]=64;c[n+4>>2]=0;n=o+280|0;c[n>>2]=0;c[n+4>>2]=393216;n=o+288|0;c[n>>2]=524352;c[n+4>>2]=0;n=o+296|0;c[n>>2]=0;c[n+4>>2]=0;n=o+304|0;c[n>>2]=2048;c[n+4>>2]=0;n=o+312|0;c[n>>2]=0;c[n+4>>2]=720896;n=o+320|0;c[n>>2]=1050624;c[n+4>>2]=0;n=o+328|0;c[n>>2]=0;c[n+4>>2]=0;n=o+336|0;c[n>>2]=524288;c[n+4>>2]=0;n=o+344|0;c[n>>2]=0;c[n+4>>2]=1245184;c[11914]=0;c[11915]=0;c[11916]=0;n=Jm(352)|0;m=n;c[11915]=m;c[11914]=m;c[11916]=n+352;n=o+352|0;o=l;l=m;do{if((l|0)==0){qb=0}else{m=c[o+4>>2]|0;c[l>>2]=c[o>>2];c[l+4>>2]=m;qb=c[11915]|0}l=qb+8|0;c[11915]=l;o=o+8|0;}while((o|0)!=(n|0));n=p|0;c[n>>2]=2101248;c[n+4>>2]=0;o=p+8|0;c[o>>2]=0;c[o+4>>2]=0;o=p+16|0;c[o>>2]=1048576;c[o+4>>2]=0;o=p+24|0;c[o>>2]=0;c[o+4>>2]=1310720;o=p+32|0;c[o>>2]=1048704;c[o+4>>2]=0;o=p+40|0;c[o>>2]=0;c[o+4>>2]=0;o=p+48|0;c[o>>2]=4096;c[o+4>>2]=0;o=p+56|0;c[o>>2]=0;c[o+4>>2]=786432;o=p+64|0;c[o>>2]=20480;c[o+4>>2]=0;o=p+72|0;c[o>>2]=0;c[o+4>>2]=0;o=p+80|0;c[o>>2]=128;c[o+4>>2]=0;o=p+88|0;c[o>>2]=0;c[o+4>>2]=458752;o=p+96|0;c[o>>2]=4194432;c[o+4>>2]=0;o=p+104|0;c[o>>2]=0;c[o+4>>2]=0;o=p+112|0;c[o>>2]=16384;c[o+4>>2]=0;o=p+120|0;c[o>>2]=0;c[o+4>>2]=917504;o=p+128|0;c[o>>2]=2113536;c[o+4>>2]=0;o=p+136|0;c[o>>2]=0;c[o+4>>2]=0;o=p+144|0;c[o>>2]=4194304;c[o+4>>2]=0;o=p+152|0;c[o>>2]=0;c[o+4>>2]=1441792;o=p+160|0;c[o>>2]=5242880;c[o+4>>2]=0;o=p+168|0;c[o>>2]=0;c[o+4>>2]=0;o=p+176|0;c[o>>2]=2097152;c[o+4>>2]=0;o=p+184|0;c[o>>2]=0;c[o+4>>2]=1376256;c[11917]=0;c[11918]=0;c[11919]=0;o=Jm(192)|0;l=o;c[11918]=l;c[11917]=l;c[11919]=o+192;o=p+192|0;p=n;n=l;do{if((n|0)==0){rb=0}else{l=c[p+4>>2]|0;c[n>>2]=c[p>>2];c[n+4>>2]=l;rb=c[11918]|0}n=rb+8|0;c[11918]=n;p=p+8|0;}while((p|0)!=(o|0));o=q|0;c[o>>2]=4194304;c[o+4>>2]=0;p=q+8|0;c[p>>2]=0;c[p+4>>2]=0;p=q+16|0;c[p>>2]=25198592;c[p+4>>2]=0;p=q+24|0;c[p>>2]=0;c[p+4>>2]=1507328;p=q+32|0;c[p>>2]=4194304;c[p+4>>2]=0;p=q+40|0;c[p>>2]=0;c[p+4>>2]=0;p=q+48|0;c[p>>2]=49408;c[p+4>>2]=0;p=q+56|0;c[p>>2]=0;c[p+4>>2]=917504;p=q+64|0;c[p>>2]=8192;c[p+4>>2]=0;p=q+72|0;c[p>>2]=0;c[p+4>>2]=0;p=q+80|0;c[p>>2]=456;c[p+4>>2]=0;p=q+88|0;c[p>>2]=0;c[p+4>>2]=458752;p=q+96|0;c[p>>2]=8192;c[p+4>>2]=0;p=q+104|0;c[p>>2]=0;c[p+4>>2]=0;p=q+112|0;c[p>>2]=6208;c[p+4>>2]=0;p=q+120|0;c[p>>2]=0;c[p+4>>2]=786432;p=q+128|0;c[p>>2]=8192;c[p+4>>2]=0;p=q+136|0;c[p>>2]=0;c[p+4>>2]=0;p=q+144|0;c[p>>2]=49408;c[p+4>>2]=0;p=q+152|0;c[p>>2]=0;c[p+4>>2]=917504;p=q+160|0;c[p>>2]=8396800;c[p+4>>2]=0;p=q+168|0;c[p>>2]=0;c[p+4>>2]=0;p=q+176|0;c[p>>2]=4194304;c[p+4>>2]=0;p=q+184|0;c[p>>2]=0;c[p+4>>2]=1441792;p=q+192|0;c[p>>2]=4194432;c[p+4>>2]=0;p=q+200|0;c[p>>2]=0;c[p+4>>2]=0;p=q+208|0;c[p>>2]=8192;c[p+4>>2]=0;p=q+216|0;c[p>>2]=0;c[p+4>>2]=851968;p=q+224|0;c[p>>2]=8448;c[p+4>>2]=0;p=q+232|0;c[p>>2]=0;c[p+4>>2]=0;p=q+240|0;c[p>>2]=128;c[p+4>>2]=0;p=q+248|0;c[p>>2]=0;c[p+4>>2]=458752;p=q+256|0;c[p>>2]=32896;c[p+4>>2]=0;p=q+264|0;c[p>>2]=0;c[p+4>>2]=0;p=q+272|0;c[p>>2]=256;c[p+4>>2]=0;p=q+280|0;c[p>>2]=0;c[p+4>>2]=524288;p=q+288|0;c[p>>2]=8388864;c[p+4>>2]=0;p=q+296|0;c[p>>2]=0;c[p+4>>2]=0;p=q+304|0;c[p>>2]=32768;c[p+4>>2]=0;p=q+312|0;c[p>>2]=0;c[p+4>>2]=983040;p=q+320|0;c[p>>2]=4227072;c[p+4>>2]=0;p=q+328|0;c[p>>2]=0;c[p+4>>2]=0;p=q+336|0;c[p>>2]=8388608;c[p+4>>2]=0;p=q+344|0;c[p>>2]=0;c[p+4>>2]=1507328;c[11920]=0;c[11921]=0;c[11922]=0;p=Jm(352)|0;n=p;c[11921]=n;c[11920]=n;c[11922]=p+352;p=q+352|0;q=o;o=n;do{if((o|0)==0){sb=0}else{n=c[q+4>>2]|0;c[o>>2]=c[q>>2];c[o+4>>2]=n;sb=c[11921]|0}o=sb+8|0;c[11921]=o;q=q+8|0;}while((q|0)!=(p|0));p=r|0;c[p>>2]=8388608;c[p+4>>2]=0;q=r+8|0;c[q>>2]=0;c[q+4>>2]=0;q=r+16|0;c[q>>2]=50397184;c[q+4>>2]=0;q=r+24|0;c[q>>2]=0;c[q+4>>2]=1572864;q=r+32|0;c[q>>2]=8388608;c[q+4>>2]=0;q=r+40|0;c[q>>2]=0;c[q+4>>2]=0;q=r+48|0;c[q>>2]=98816;c[q+4>>2]=0;q=r+56|0;c[q>>2]=0;c[q+4>>2]=983040;q=r+64|0;c[q>>2]=16384;c[q+4>>2]=0;q=r+72|0;c[q>>2]=0;c[q+4>>2]=0;q=r+80|0;c[q>>2]=784;c[q+4>>2]=0;q=r+88|0;c[q>>2]=0;c[q+4>>2]=524288;q=r+96|0;c[q>>2]=16384;c[q+4>>2]=0;q=r+104|0;c[q>>2]=0;c[q+4>>2]=0;q=r+112|0;c[q>>2]=98816;c[q+4>>2]=0;q=r+120|0;c[q>>2]=0;c[q+4>>2]=983040;q=r+128|0;c[q>>2]=8454144;c[q+4>>2]=0;q=r+136|0;c[q>>2]=0;c[q+4>>2]=0;q=r+144|0;c[q>>2]=16777216;c[q+4>>2]=0;q=r+152|0;c[q>>2]=0;c[q+4>>2]=1572864;q=r+160|0;c[q>>2]=16793600;c[q+4>>2]=0;q=r+168|0;c[q>>2]=0;c[q+4>>2]=0;q=r+176|0;c[q>>2]=8388608;c[q+4>>2]=0;q=r+184|0;c[q>>2]=0;c[q+4>>2]=1507328;q=r+192|0;c[q>>2]=8388864;c[q+4>>2]=0;q=r+200|0;c[q>>2]=0;c[q+4>>2]=0;q=r+208|0;c[q>>2]=16384;c[q+4>>2]=0;q=r+216|0;c[q>>2]=0;c[q+4>>2]=917504;q=r+224|0;c[q>>2]=16896;c[q+4>>2]=0;q=r+232|0;c[q>>2]=0;c[q+4>>2]=0;q=r+240|0;c[q>>2]=256;c[q+4>>2]=0;q=r+248|0;c[q>>2]=0;c[q+4>>2]=524288;q=r+256|0;c[q>>2]=65792;c[q+4>>2]=0;q=r+264|0;c[q>>2]=0;c[q+4>>2]=0;q=r+272|0;c[q>>2]=512;c[q+4>>2]=0;q=r+280|0;c[q>>2]=0;c[q+4>>2]=589824;q=r+288|0;c[q>>2]=16777728;c[q+4>>2]=0;q=r+296|0;c[q>>2]=0;c[q+4>>2]=0;q=r+304|0;c[q>>2]=65536;c[q+4>>2]=0;q=r+312|0;c[q>>2]=0;c[q+4>>2]=1048576;c[11923]=0;c[11924]=0;c[11925]=0;q=Jm(320)|0;o=q;c[11924]=o;c[11923]=o;c[11925]=q+320;q=r+320|0;r=p;p=o;do{if((p|0)==0){tb=0}else{o=c[r+4>>2]|0;c[p>>2]=c[r>>2];c[p+4>>2]=o;tb=c[11924]|0}p=tb+8|0;c[11924]=p;r=r+8|0;}while((r|0)!=(q|0));q=s|0;c[q>>2]=32768;c[q+4>>2]=0;q=s+8|0;c[q>>2]=0;c[q+4>>2]=0;q=s+16|0;c[q>>2]=512;c[q+4>>2]=0;q=s+24|0;c[q>>2]=0;c[q+4>>2]=589824;q=s+32|0;c[q>>2]=16777216;c[q+4>>2]=0;q=s+40|0;c[q>>2]=0;c[q+4>>2]=0;q=s+48|0;c[q>>2]=33554432;c[q+4>>2]=0;q=s+56|0;c[q>>2]=0;c[q+4>>2]=1638400;c[11926]=0;c[11927]=0;c[11928]=0;q=Jm(64)|0;r=q;c[11927]=r;c[11926]=r;c[11928]=q+64;if((q|0)==0){ub=0}else{c[r>>2]=32768;c[r+4>>2]=0;ub=r}r=ub+8|0;c[11927]=r;c[r>>2]=0;c[r+4>>2]=0;r=(c[11927]|0)+8|0;c[11927]=r;c[r>>2]=512;c[r+4>>2]=0;r=(c[11927]|0)+8|0;c[11927]=r;c[r>>2]=0;c[r+4>>2]=589824;r=(c[11927]|0)+8|0;c[11927]=r;c[r>>2]=16777216;c[r+4>>2]=0;r=(c[11927]|0)+8|0;c[11927]=r;c[r>>2]=0;c[r+4>>2]=0;r=(c[11927]|0)+8|0;c[11927]=r;ub=s+48|0;q=c[ub+4>>2]|0;c[r>>2]=c[ub>>2];c[r+4>>2]=q;q=(c[11927]|0)+8|0;c[11927]=q;r=s+56|0;s=c[r+4>>2]|0;c[q>>2]=c[r>>2];c[q+4>>2]=s;c[11927]=(c[11927]|0)+8;s=t|0;c[s>>2]=134217728;c[s+4>>2]=0;s=t+8|0;c[s>>2]=0;c[s+4>>2]=0;s=t+16|0;c[s>>2]=67108864;c[s+4>>2]=0;s=t+24|0;c[s>>2]=0;c[s+4>>2]=1703936;s=t+32|0;c[s>>2]=262144;c[s+4>>2]=0;s=t+40|0;c[s>>2]=0;c[s+4>>2]=0;s=t+48|0;c[s>>2]=1024;c[s+4>>2]=0;s=t+56|0;c[s>>2]=0;c[s+4>>2]=655360;c[11929]=0;c[11930]=0;c[11931]=0;s=Jm(64)|0;q=s;c[11930]=q;c[11929]=q;c[11931]=s+64;if((s|0)==0){vb=0}else{c[q>>2]=134217728;c[q+4>>2]=0;vb=q}q=vb+8|0;c[11930]=q;c[q>>2]=0;c[q+4>>2]=0;q=(c[11930]|0)+8|0;c[11930]=q;c[q>>2]=67108864;c[q+4>>2]=0;q=(c[11930]|0)+8|0;c[11930]=q;c[q>>2]=0;c[q+4>>2]=1703936;q=(c[11930]|0)+8|0;c[11930]=q;c[q>>2]=262144;c[q+4>>2]=0;q=(c[11930]|0)+8|0;c[11930]=q;c[q>>2]=0;c[q+4>>2]=0;q=(c[11930]|0)+8|0;c[11930]=q;vb=t+48|0;s=c[vb+4>>2]|0;c[q>>2]=c[vb>>2];c[q+4>>2]=s;s=(c[11930]|0)+8|0;c[11930]=s;q=t+56|0;t=c[q+4>>2]|0;c[s>>2]=c[q>>2];c[s+4>>2]=t;c[11930]=(c[11930]|0)+8;t=v|0;c[t>>2]=268435456;c[t+4>>2]=0;s=v+8|0;c[s>>2]=0;c[s+4>>2]=0;s=v+16|0;c[s>>2]=394240;c[s+4>>2]=0;s=v+24|0;c[s>>2]=0;c[s+4>>2]=1179648;s=v+32|0;c[s>>2]=268435456;c[s+4>>2]=0;s=v+40|0;c[s>>2]=0;c[s+4>>2]=0;s=v+48|0;c[s>>2]=201457664;c[s+4>>2]=0;s=v+56|0;c[s>>2]=0;c[s+4>>2]=1769472;s=v+64|0;c[s>>2]=524288;c[s+4>>2]=0;s=v+72|0;c[s>>2]=0;c[s+4>>2]=0;s=v+80|0;c[s>>2]=394240;c[s+4>>2]=0;s=v+88|0;c[s>>2]=0;c[s+4>>2]=1179648;s=v+96|0;c[s>>2]=524288;c[s+4>>2]=0;s=v+104|0;c[s>>2]=0;c[s+4>>2]=0;s=v+112|0;c[s>>2]=3104;c[s+4>>2]=0;s=v+120|0;c[s>>2]=0;c[s+4>>2]=720896;s=v+128|0;c[s>>2]=268566528;c[s+4>>2]=0;s=v+136|0;c[s>>2]=0;c[s+4>>2]=0;s=v+144|0;c[s>>2]=134217728;c[s+4>>2]=0;s=v+152|0;c[s>>2]=0;c[s+4>>2]=1769472;s=v+160|0;c[s>>2]=134742016;c[s+4>>2]=0;s=v+168|0;c[s>>2]=0;c[s+4>>2]=0;s=v+176|0;c[s>>2]=268435456;c[s+4>>2]=0;s=v+184|0;c[s>>2]=0;c[s+4>>2]=1835008;s=v+192|0;c[s>>2]=268437504;c[s+4>>2]=0;s=v+200|0;c[s>>2]=0;c[s+4>>2]=0;s=v+208|0;c[s>>2]=524288;c[s+4>>2]=0;s=v+216|0;c[s>>2]=0;c[s+4>>2]=1245184;s=v+224|0;c[s>>2]=525312;c[s+4>>2]=0;s=v+232|0;c[s>>2]=0;c[s+4>>2]=0;s=v+240|0;c[s>>2]=2048;c[s+4>>2]=0;s=v+248|0;c[s>>2]=0;c[s+4>>2]=720896;s=v+256|0;c[s>>2]=133120;c[s+4>>2]=0;s=v+264|0;c[s>>2]=0;c[s+4>>2]=0;s=v+272|0;c[s>>2]=1024;c[s+4>>2]=0;s=v+280|0;c[s>>2]=0;c[s+4>>2]=655360;s=v+288|0;c[s>>2]=134218752;c[s+4>>2]=0;s=v+296|0;c[s>>2]=0;c[s+4>>2]=0;s=v+304|0;c[s>>2]=131072;c[s+4>>2]=0;s=v+312|0;c[s>>2]=0;c[s+4>>2]=1114112;c[11932]=0;c[11933]=0;c[11934]=0;s=Jm(320)|0;q=s;c[11933]=q;c[11932]=q;c[11934]=s+320;s=v+320|0;v=t;t=q;do{if((t|0)==0){wb=0}else{q=c[v+4>>2]|0;c[t>>2]=c[v>>2];c[t+4>>2]=q;wb=c[11933]|0}t=wb+8|0;c[11933]=t;v=v+8|0;}while((v|0)!=(s|0));s=w|0;c[s>>2]=1048576;c[s+4>>2]=0;v=w+8|0;c[v>>2]=0;c[v+4>>2]=0;v=w+16|0;c[v>>2]=788480;c[v+4>>2]=0;v=w+24|0;c[v>>2]=0;c[v+4>>2]=1245184;v=w+32|0;c[v>>2]=1048576;c[v+4>>2]=0;v=w+40|0;c[v>>2]=0;c[v+4>>2]=0;v=w+48|0;c[v>>2]=6208;c[v+4>>2]=0;v=w+56|0;c[v>>2]=0;c[v+4>>2]=786432;v=w+64|0;c[v>>2]=536870912;c[v+4>>2]=0;v=w+72|0;c[v>>2]=0;c[v+4>>2]=0;v=w+80|0;c[v>>2]=788480;c[v+4>>2]=0;v=w+88|0;c[v>>2]=0;c[v+4>>2]=1245184;v=w+96|0;c[v>>2]=536870912;c[v+4>>2]=0;v=w+104|0;c[v>>2]=0;c[v+4>>2]=0;v=w+112|0;c[v>>2]=402915328;c[v+4>>2]=0;v=w+120|0;c[v>>2]=0;c[v+4>>2]=1835008;v=w+128|0;c[v>>2]=266240;c[v+4>>2]=0;v=w+136|0;c[v>>2]=0;c[v+4>>2]=0;v=w+144|0;c[v>>2]=2048;c[v+4>>2]=0;v=w+152|0;c[v>>2]=0;c[v+4>>2]=720896;v=w+160|0;c[v>>2]=1050624;c[v+4>>2]=0;v=w+168|0;c[v>>2]=0;c[v+4>>2]=0;v=w+176|0;c[v>>2]=4096;c[v+4>>2]=0;v=w+184|0;c[v>>2]=0;c[v+4>>2]=786432;v=w+192|0;c[v>>2]=536875008;c[v+4>>2]=0;v=w+200|0;c[v>>2]=0;c[v+4>>2]=0;v=w+208|0;c[v>>2]=1048576;c[v+4>>2]=0;v=w+216|0;c[v>>2]=0;c[v+4>>2]=1310720;v=w+224|0;c[v>>2]=269484032;c[v+4>>2]=0;v=w+232|0;c[v>>2]=0;c[v+4>>2]=0;v=w+240|0;c[v>>2]=536870912;c[v+4>>2]=0;v=w+248|0;c[v>>2]=0;c[v+4>>2]=1900544;v=w+256|0;c[v>>2]=537133056;c[v+4>>2]=0;v=w+264|0;c[v>>2]=0;c[v+4>>2]=0;v=w+272|0;c[v>>2]=268435456;c[v+4>>2]=0;v=w+280|0;c[v>>2]=0;c[v+4>>2]=1835008;v=w+288|0;c[v>>2]=268437504;c[v+4>>2]=0;v=w+296|0;c[v>>2]=0;c[v+4>>2]=0;v=w+304|0;c[v>>2]=262144;c[v+4>>2]=0;v=w+312|0;c[v>>2]=0;c[v+4>>2]=1179648;c[11935]=0;c[11936]=0;c[11937]=0;v=Jm(320)|0;t=v;c[11936]=t;c[11935]=t;c[11937]=v+320;v=w+320|0;w=s;s=t;do{if((s|0)==0){xb=0}else{t=c[w+4>>2]|0;c[s>>2]=c[w>>2];c[s+4>>2]=t;xb=c[11936]|0}s=xb+8|0;c[11936]=s;w=w+8|0;}while((w|0)!=(v|0));v=x|0;c[v>>2]=1074266112;c[v+4>>2]=0;w=x+8|0;c[w>>2]=0;c[w+4>>2]=0;w=x+16|0;c[w>>2]=536870912;c[w+4>>2]=0;w=x+24|0;c[w>>2]=0;c[w+4>>2]=1900544;w=x+32|0;c[w>>2]=538968064;c[w+4>>2]=0;w=x+40|0;c[w>>2]=0;c[w+4>>2]=0;w=x+48|0;c[w>>2]=1073741824;c[w+4>>2]=0;w=x+56|0;c[w>>2]=0;c[w+4>>2]=1966080;w=x+64|0;c[w>>2]=1073750016;c[w+4>>2]=0;w=x+72|0;c[w>>2]=0;c[w+4>>2]=0;w=x+80|0;c[w>>2]=2097152;c[w+4>>2]=0;w=x+88|0;c[w>>2]=0;c[w+4>>2]=1376256;w=x+96|0;c[w>>2]=2101248;c[w+4>>2]=0;w=x+104|0;c[w>>2]=0;c[w+4>>2]=0;w=x+112|0;c[w>>2]=8192;c[w+4>>2]=0;w=x+120|0;c[w>>2]=0;c[w+4>>2]=851968;w=x+128|0;c[w>>2]=532480;c[w+4>>2]=0;w=x+136|0;c[w>>2]=0;c[w+4>>2]=0;w=x+144|0;c[w>>2]=4096;c[w+4>>2]=0;w=x+152|0;c[w>>2]=0;c[w+4>>2]=786432;w=x+160|0;c[w>>2]=536875008;c[w+4>>2]=0;w=x+168|0;c[w>>2]=0;c[w+4>>2]=0;w=x+176|0;c[w>>2]=524288;c[w+4>>2]=0;w=x+184|0;c[w>>2]=0;c[w+4>>2]=1245184;c[11938]=0;c[11939]=0;c[11940]=0;w=Jm(192)|0;s=w;c[11939]=s;c[11938]=s;c[11940]=w+192;w=x+192|0;x=v;v=s;do{if((v|0)==0){yb=0}else{s=c[x+4>>2]|0;c[v>>2]=c[x>>2];c[v+4>>2]=s;yb=c[11939]|0}v=yb+8|0;c[11939]=v;x=x+8|0;}while((x|0)!=(w|0));w=y|0;c[w>>2]=8192;c[w+4>>2]=1;x=y+8|0;c[x>>2]=0;c[x+4>>2]=0;x=y+16|0;c[x>>2]=4194304;c[x+4>>2]=0;x=y+24|0;c[x>>2]=0;c[x+4>>2]=1441792;x=y+32|0;c[x>>2]=5242880;c[x+4>>2]=0;x=y+40|0;c[x>>2]=0;c[x+4>>2]=0;x=y+48|0;c[x>>2]=8192;c[x+4>>2]=0;x=y+56|0;c[x>>2]=0;c[x+4>>2]=851968;x=y+64|0;c[x>>2]=1073750016;c[x+4>>2]=0;x=y+72|0;c[x>>2]=0;c[x+4>>2]=0;x=y+80|0;c[x>>2]=1048576;c[x+4>>2]=0;x=y+88|0;c[x>>2]=0;c[x+4>>2]=1310720;x=y+96|0;c[x>>2]=-2146435072;c[x+4>>2]=0;x=y+104|0;c[x>>2]=0;c[x+4>>2]=0;x=y+112|0;c[x>>2]=1073741824;c[x+4>>2]=0;x=y+120|0;c[x>>2]=0;c[x+4>>2]=1966080;x=y+128|0;c[x>>2]=1073741824;c[x+4>>2]=1;x=y+136|0;c[x>>2]=0;c[x+4>>2]=0;x=y+144|0;c[x>>2]=-2147483648;c[x+4>>2]=0;x=y+152|0;c[x>>2]=0;c[x+4>>2]=2031616;x=y+160|0;c[x>>2]=-2143289344;c[x+4>>2]=0;x=y+168|0;c[x>>2]=0;c[x+4>>2]=0;x=y+176|0;c[x>>2]=0;c[x+4>>2]=1;x=y+184|0;c[x>>2]=0;c[x+4>>2]=2097152;c[11941]=0;c[11942]=0;c[11943]=0;x=Jm(192)|0;v=x;c[11942]=v;c[11941]=v;c[11943]=x+192;x=y+192|0;y=w;w=v;do{if((w|0)==0){zb=0}else{v=c[y+4>>2]|0;c[w>>2]=c[y>>2];c[w+4>>2]=v;zb=c[11942]|0}w=zb+8|0;c[11942]=w;y=y+8|0;}while((y|0)!=(x|0));x=z|0;c[x>>2]=8388608;c[x+4>>2]=1;y=z+8|0;c[y>>2]=0;c[y+4>>2]=0;y=z+16|0;c[y>>2]=0;c[y+4>>2]=2;y=z+24|0;c[y>>2]=0;c[y+4>>2]=2162688;y=z+32|0;c[y>>2]=16384;c[y+4>>2]=2;y=z+40|0;c[y>>2]=0;c[y+4>>2]=0;y=z+48|0;c[y>>2]=8388608;c[y+4>>2]=0;y=z+56|0;c[y>>2]=0;c[y+4>>2]=1507328;y=z+64|0;c[y>>2]=8396800;c[y+4>>2]=0;y=z+72|0;c[y>>2]=0;c[y+4>>2]=0;y=z+80|0;c[y>>2]=16384;c[y+4>>2]=0;y=z+88|0;c[y>>2]=0;c[y+4>>2]=917504;y=z+96|0;c[y>>2]=2113536;c[y+4>>2]=0;y=z+104|0;c[y>>2]=0;c[y+4>>2]=0;y=z+112|0;c[y>>2]=8192;c[y+4>>2]=0;y=z+120|0;c[y>>2]=0;c[y+4>>2]=851968;y=z+128|0;c[y>>2]=8192;c[y+4>>2]=1;y=z+136|0;c[y>>2]=0;c[y+4>>2]=0;y=z+144|0;c[y>>2]=2097152;c[y+4>>2]=0;y=z+152|0;c[y>>2]=0;c[y+4>>2]=1376256;y=z+160|0;c[y>>2]=2097152;c[y+4>>2]=2;y=z+168|0;c[y>>2]=0;c[y+4>>2]=0;y=z+176|0;c[y>>2]=0;c[y+4>>2]=1;y=z+184|0;c[y>>2]=0;c[y+4>>2]=2097152;c[11944]=0;c[11945]=0;c[11946]=0;y=Jm(192)|0;w=y;c[11945]=w;c[11944]=w;c[11946]=y+192;y=z+192|0;z=x;x=w;do{if((x|0)==0){Ab=0}else{w=c[z+4>>2]|0;c[x>>2]=c[z>>2];c[x+4>>2]=w;Ab=c[11945]|0}x=Ab+8|0;c[11945]=x;z=z+8|0;}while((z|0)!=(y|0));y=A|0;c[y>>2]=0;c[y+4>>2]=2;z=A+8|0;c[z>>2]=0;c[z+4>>2]=0;z=A+16|0;c[z>>2]=16777216;c[z+4>>2]=12;z=A+24|0;c[z>>2]=0;c[z+4>>2]=2228224;z=A+32|0;c[z>>2]=0;c[z+4>>2]=2;z=A+40|0;c[z>>2]=0;c[z+4>>2]=0;z=A+48|0;c[z>>2]=25198592;c[z+4>>2]=0;z=A+56|0;c[z>>2]=0;c[z+4>>2]=1507328;z=A+64|0;c[z>>2]=4194304;c[z+4>>2]=0;z=A+72|0;c[z>>2]=0;c[z+4>>2]=0;z=A+80|0;c[z>>2]=25198592;c[z+4>>2]=0;z=A+88|0;c[z>>2]=0;c[z+4>>2]=1507328;z=A+96|0;c[z>>2]=4194304;c[z+4>>2]=0;z=A+104|0;c[z>>2]=0;c[z+4>>2]=0;z=A+112|0;c[z>>2]=49408;c[z+4>>2]=0;z=A+120|0;c[z>>2]=0;c[z+4>>2]=917504;z=A+128|0;c[z>>2]=4194304;c[z+4>>2]=4;z=A+136|0;c[z>>2]=0;c[z+4>>2]=0;z=A+144|0;c[z>>2]=0;c[z+4>>2]=2;z=A+152|0;c[z>>2]=0;c[z+4>>2]=2162688;z=A+160|0;c[z>>2]=16384;c[z+4>>2]=2;z=A+168|0;c[z>>2]=0;c[z+4>>2]=0;z=A+176|0;c[z>>2]=4194304;c[z+4>>2]=0;z=A+184|0;c[z>>2]=0;c[z+4>>2]=1441792;z=A+192|0;c[z>>2]=4227072;c[z+4>>2]=0;z=A+200|0;c[z>>2]=0;c[z+4>>2]=0;z=A+208|0;c[z>>2]=16384;c[z+4>>2]=0;z=A+216|0;c[z>>2]=0;c[z+4>>2]=917504;z=A+224|0;c[z>>2]=16793600;c[z+4>>2]=0;z=A+232|0;c[z>>2]=0;c[z+4>>2]=0;z=A+240|0;c[z>>2]=32768;c[z+4>>2]=0;z=A+248|0;c[z>>2]=0;c[z+4>>2]=983040;z=A+256|0;c[z>>2]=32768;c[z+4>>2]=4;z=A+264|0;c[z>>2]=0;c[z+4>>2]=0;z=A+272|0;c[z>>2]=16777216;c[z+4>>2]=0;z=A+280|0;c[z>>2]=0;c[z+4>>2]=1572864;z=A+288|0;c[z>>2]=16777216;c[z+4>>2]=2;z=A+296|0;c[z>>2]=0;c[z+4>>2]=0;z=A+304|0;c[z>>2]=0;c[z+4>>2]=4;z=A+312|0;c[z>>2]=0;c[z+4>>2]=2228224;c[11947]=0;c[11948]=0;c[11949]=0;z=Jm(320)|0;x=z;c[11948]=x;c[11947]=x;c[11949]=z+320;z=A+320|0;A=y;y=x;do{if((y|0)==0){Bb=0}else{x=c[A+4>>2]|0;c[y>>2]=c[A>>2];c[y+4>>2]=x;Bb=c[11948]|0}y=Bb+8|0;c[11948]=y;A=A+8|0;}while((A|0)!=(z|0));z=B|0;c[z>>2]=0;c[z+4>>2]=4;A=B+8|0;c[A>>2]=0;c[A+4>>2]=0;A=B+16|0;c[A>>2]=33554432;c[A+4>>2]=24;A=B+24|0;c[A>>2]=0;c[A+4>>2]=2293760;A=B+32|0;c[A>>2]=0;c[A+4>>2]=4;A=B+40|0;c[A>>2]=0;c[A+4>>2]=0;A=B+48|0;c[A>>2]=50397184;c[A+4>>2]=0;A=B+56|0;c[A>>2]=0;c[A+4>>2]=1572864;A=B+64|0;c[A>>2]=8388608;c[A+4>>2]=0;A=B+72|0;c[A>>2]=0;c[A+4>>2]=0;A=B+80|0;c[A>>2]=50397184;c[A+4>>2]=0;A=B+88|0;c[A>>2]=0;c[A+4>>2]=1572864;A=B+96|0;c[A>>2]=8388608;c[A+4>>2]=0;A=B+104|0;c[A>>2]=0;c[A+4>>2]=0;A=B+112|0;c[A>>2]=98816;c[A+4>>2]=0;A=B+120|0;c[A>>2]=0;c[A+4>>2]=983040;A=B+128|0;c[A>>2]=33554432;c[A+4>>2]=4;A=B+136|0;c[A>>2]=0;c[A+4>>2]=0;A=B+144|0;c[A>>2]=0;c[A+4>>2]=8;A=B+152|0;c[A>>2]=0;c[A+4>>2]=2293760;A=B+160|0;c[A>>2]=65536;c[A+4>>2]=8;A=B+168|0;c[A>>2]=0;c[A+4>>2]=0;A=B+176|0;c[A>>2]=33554432;c[A+4>>2]=0;A=B+184|0;c[A>>2]=0;c[A+4>>2]=1638400;A=B+192|0;c[A>>2]=33587200;c[A+4>>2]=0;A=B+200|0;c[A>>2]=0;c[A+4>>2]=0;A=B+208|0;c[A>>2]=65536;c[A+4>>2]=0;A=B+216|0;c[A>>2]=0;c[A+4>>2]=1048576;A=B+224|0;c[A>>2]=8454144;c[A+4>>2]=0;A=B+232|0;c[A>>2]=0;c[A+4>>2]=0;A=B+240|0;c[A>>2]=32768;c[A+4>>2]=0;A=B+248|0;c[A>>2]=0;c[A+4>>2]=983040;A=B+256|0;c[A>>2]=32768;c[A+4>>2]=4;A=B+264|0;c[A>>2]=0;c[A+4>>2]=0;A=B+272|0;c[A>>2]=8388608;c[A+4>>2]=0;A=B+280|0;c[A>>2]=0;c[A+4>>2]=1507328;A=B+288|0;c[A>>2]=8388608;c[A+4>>2]=8;A=B+296|0;c[A>>2]=0;c[A+4>>2]=0;A=B+304|0;c[A>>2]=0;c[A+4>>2]=4;A=B+312|0;c[A>>2]=0;c[A+4>>2]=2228224;c[11950]=0;c[11951]=0;c[11952]=0;A=Jm(320)|0;y=A;c[11951]=y;c[11950]=y;c[11952]=A+320;A=B+320|0;B=z;z=y;do{if((z|0)==0){Cb=0}else{y=c[B+4>>2]|0;c[z>>2]=c[B>>2];c[z+4>>2]=y;Cb=c[11951]|0}z=Cb+8|0;c[11951]=z;B=B+8|0;}while((B|0)!=(A|0));A=C|0;c[A>>2]=0;c[A+4>>2]=8;A=C+8|0;c[A>>2]=0;c[A+4>>2]=0;A=C+16|0;c[A>>2]=0;c[A+4>>2]=16;A=C+24|0;c[A>>2]=0;c[A+4>>2]=2359296;A=C+32|0;c[A>>2]=16777216;c[A+4>>2]=0;A=C+40|0;c[A>>2]=0;c[A+4>>2]=0;A=C+48|0;c[A>>2]=65536;c[A+4>>2]=0;A=C+56|0;c[A>>2]=0;c[A+4>>2]=1048576;c[11953]=0;c[11954]=0;c[11955]=0;A=Jm(64)|0;B=A;c[11954]=B;c[11953]=B;c[11955]=A+64;if((A|0)==0){Db=0}else{c[B>>2]=0;c[B+4>>2]=8;Db=B}B=Db+8|0;c[11954]=B;c[B>>2]=0;c[B+4>>2]=0;B=(c[11954]|0)+8|0;c[11954]=B;c[B>>2]=0;c[B+4>>2]=16;B=(c[11954]|0)+8|0;c[11954]=B;c[B>>2]=0;c[B+4>>2]=2359296;B=(c[11954]|0)+8|0;c[11954]=B;c[B>>2]=16777216;c[B+4>>2]=0;B=(c[11954]|0)+8|0;c[11954]=B;c[B>>2]=0;c[B+4>>2]=0;B=(c[11954]|0)+8|0;c[11954]=B;Db=C+48|0;A=c[Db+4>>2]|0;c[B>>2]=c[Db>>2];c[B+4>>2]=A;A=(c[11954]|0)+8|0;c[11954]=A;B=C+56|0;C=c[B+4>>2]|0;c[A>>2]=c[B>>2];c[A+4>>2]=C;c[11954]=(c[11954]|0)+8;C=D|0;c[C>>2]=0;c[C+4>>2]=64;C=D+8|0;c[C>>2]=0;c[C+4>>2]=0;C=D+16|0;c[C>>2]=0;c[C+4>>2]=32;C=D+24|0;c[C>>2]=0;c[C+4>>2]=2424832;C=D+32|0;c[C>>2]=134217728;c[C+4>>2]=0;C=D+40|0;c[C>>2]=0;c[C+4>>2]=0;C=D+48|0;c[C>>2]=131072;c[C+4>>2]=0;C=D+56|0;c[C>>2]=0;c[C+4>>2]=1114112;c[11956]=0;c[11957]=0;c[11958]=0;C=Jm(64)|0;A=C;c[11957]=A;c[11956]=A;c[11958]=C+64;if((C|0)==0){Eb=0}else{c[A>>2]=0;c[A+4>>2]=64;Eb=A}A=Eb+8|0;c[11957]=A;c[A>>2]=0;c[A+4>>2]=0;A=(c[11957]|0)+8|0;c[11957]=A;c[A>>2]=0;c[A+4>>2]=32;A=(c[11957]|0)+8|0;c[11957]=A;c[A>>2]=0;c[A+4>>2]=2424832;A=(c[11957]|0)+8|0;c[11957]=A;c[A>>2]=134217728;c[A+4>>2]=0;A=(c[11957]|0)+8|0;c[11957]=A;c[A>>2]=0;c[A+4>>2]=0;A=(c[11957]|0)+8|0;c[11957]=A;Eb=D+48|0;C=c[Eb+4>>2]|0;c[A>>2]=c[Eb>>2];c[A+4>>2]=C;C=(c[11957]|0)+8|0;c[11957]=C;A=D+56|0;D=c[A+4>>2]|0;c[C>>2]=c[A>>2];c[C+4>>2]=D;c[11957]=(c[11957]|0)+8;D=E|0;c[D>>2]=268435456;c[D+4>>2]=0;C=E+8|0;c[C>>2]=0;c[C+4>>2]=0;C=E+16|0;c[C>>2]=394240;c[C+4>>2]=0;C=E+24|0;c[C>>2]=0;c[C+4>>2]=1179648;C=E+32|0;c[C>>2]=268435456;c[C+4>>2]=0;C=E+40|0;c[C>>2]=0;c[C+4>>2]=0;C=E+48|0;c[C>>2]=201457664;c[C+4>>2]=0;C=E+56|0;c[C>>2]=0;c[C+4>>2]=1769472;C=E+64|0;c[C>>2]=0;c[C+4>>2]=128;C=E+72|0;c[C>>2]=0;c[C+4>>2]=0;C=E+80|0;c[C>>2]=0;c[C+4>>2]=1074528256;C=E+88|0;c[C>>2]=0;c[C+4>>2]=3342336;C=E+96|0;c[C>>2]=0;c[C+4>>2]=128;C=E+104|0;c[C>>2]=0;c[C+4>>2]=0;C=E+112|0;c[C>>2]=67108864;c[C+4>>2]=262240;C=E+120|0;c[C>>2]=0;c[C+4>>2]=2490368;C=E+128|0;c[C>>2]=0;c[C+4>>2]=128;C=E+136|0;c[C>>2]=0;c[C+4>>2]=0;C=E+144|0;c[C>>2]=201457664;c[C+4>>2]=0;C=E+152|0;c[C>>2]=0;c[C+4>>2]=1769472;C=E+160|0;c[C>>2]=268566528;c[C+4>>2]=0;C=E+168|0;c[C>>2]=0;c[C+4>>2]=0;C=E+176|0;c[C>>2]=262144;c[C+4>>2]=0;C=E+184|0;c[C>>2]=0;c[C+4>>2]=1179648;C=E+192|0;c[C>>2]=262144;c[C+4>>2]=128;C=E+200|0;c[C>>2]=0;c[C+4>>2]=0;C=E+208|0;c[C>>2]=268435456;c[C+4>>2]=0;C=E+216|0;c[C>>2]=0;c[C+4>>2]=1835008;C=E+224|0;c[C>>2]=268435456;c[C+4>>2]=64;C=E+232|0;c[C>>2]=0;c[C+4>>2]=0;C=E+240|0;c[C>>2]=0;c[C+4>>2]=128;C=E+248|0;c[C>>2]=0;c[C+4>>2]=2555904;C=E+256|0;c[C>>2]=67108864;c[C+4>>2]=128;C=E+264|0;c[C>>2]=0;c[C+4>>2]=0;C=E+272|0;c[C>>2]=0;c[C+4>>2]=64;C=E+280|0;c[C>>2]=0;c[C+4>>2]=2490368;C=E+288|0;c[C>>2]=131072;c[C+4>>2]=64;C=E+296|0;c[C>>2]=0;c[C+4>>2]=0;C=E+304|0;c[C>>2]=67108864;c[C+4>>2]=0;C=E+312|0;c[C>>2]=0;c[C+4>>2]=1703936;C=E+320|0;c[C>>2]=67371008;c[C+4>>2]=0;C=E+328|0;c[C>>2]=0;c[C+4>>2]=0;C=E+336|0;c[C>>2]=131072;c[C+4>>2]=0;C=E+344|0;c[C>>2]=0;c[C+4>>2]=1114112;c[11959]=0;c[11960]=0;c[11961]=0;C=Jm(352)|0;A=C;c[11960]=A;c[11959]=A;c[11961]=C+352;C=E+352|0;E=D;D=A;do{if((D|0)==0){Fb=0}else{A=c[E+4>>2]|0;c[D>>2]=c[E>>2];c[D+4>>2]=A;Fb=c[11960]|0}D=Fb+8|0;c[11960]=D;E=E+8|0;}while((E|0)!=(C|0));C=F|0;c[C>>2]=0;c[C+4>>2]=256;E=F+8|0;c[E>>2]=0;c[E+4>>2]=0;E=F+16|0;c[E>>2]=134217728;c[E+4>>2]=524480;E=F+24|0;c[E>>2]=0;c[E+4>>2]=2555904;E=F+32|0;c[E>>2]=0;c[E+4>>2]=256;E=F+40|0;c[E>>2]=0;c[E+4>>2]=0;E=F+48|0;c[E>>2]=0;c[E+4>>2]=-2145910784;E=F+56|0;c[E>>2]=0;c[E+4>>2]=3407872;E=F+64|0;c[E>>2]=0;c[E+4>>2]=256;E=F+72|0;c[E>>2]=0;c[E+4>>2]=0;E=F+80|0;c[E>>2]=402915328;c[E+4>>2]=0;E=F+88|0;c[E>>2]=0;c[E+4>>2]=1835008;E=F+96|0;c[E>>2]=536870912;c[E+4>>2]=0;E=F+104|0;c[E>>2]=0;c[E+4>>2]=0;E=F+112|0;c[E>>2]=788480;c[E+4>>2]=0;E=F+120|0;c[E>>2]=0;c[E+4>>2]=1245184;E=F+128|0;c[E>>2]=536870912;c[E+4>>2]=0;E=F+136|0;c[E>>2]=0;c[E+4>>2]=0;E=F+144|0;c[E>>2]=402915328;c[E+4>>2]=0;E=F+152|0;c[E>>2]=0;c[E+4>>2]=1835008;E=F+160|0;c[E>>2]=134742016;c[E+4>>2]=0;E=F+168|0;c[E>>2]=0;c[E+4>>2]=0;E=F+176|0;c[E>>2]=262144;c[E+4>>2]=0;E=F+184|0;c[E>>2]=0;c[E+4>>2]=1179648;E=F+192|0;c[E>>2]=262144;c[E+4>>2]=128;E=F+200|0;c[E>>2]=0;c[E+4>>2]=0;E=F+208|0;c[E>>2]=134217728;c[E+4>>2]=0;E=F+216|0;c[E>>2]=0;c[E+4>>2]=1769472;E=F+224|0;c[E>>2]=134217728;c[E+4>>2]=256;E=F+232|0;c[E>>2]=0;c[E+4>>2]=0;E=F+240|0;c[E>>2]=0;c[E+4>>2]=128;E=F+248|0;c[E>>2]=0;c[E+4>>2]=2555904;E=F+256|0;c[E>>2]=536870912;c[E+4>>2]=128;E=F+264|0;c[E>>2]=0;c[E+4>>2]=0;E=F+272|0;c[E>>2]=0;c[E+4>>2]=256;E=F+280|0;c[E>>2]=0;c[E+4>>2]=2621440;E=F+288|0;c[E>>2]=524288;c[E+4>>2]=256;E=F+296|0;c[E>>2]=0;c[E+4>>2]=0;E=F+304|0;c[E>>2]=536870912;c[E+4>>2]=0;E=F+312|0;c[E>>2]=0;c[E+4>>2]=1900544;E=F+320|0;c[E>>2]=537133056;c[E+4>>2]=0;E=F+328|0;c[E>>2]=0;c[E+4>>2]=0;E=F+336|0;c[E>>2]=524288;c[E+4>>2]=0;E=F+344|0;c[E>>2]=0;c[E+4>>2]=1245184;c[11962]=0;c[11963]=0;c[11964]=0;E=Jm(352)|0;D=E;c[11963]=D;c[11962]=D;c[11964]=E+352;E=F+352|0;F=C;C=D;do{if((C|0)==0){Gb=0}else{D=c[F+4>>2]|0;c[C>>2]=c[F>>2];c[C+4>>2]=D;Gb=c[11963]|0}C=Gb+8|0;c[11963]=C;F=F+8|0;}while((F|0)!=(E|0));E=G|0;c[E>>2]=1074266112;c[E+4>>2]=0;F=G+8|0;c[F>>2]=0;c[F+4>>2]=0;F=G+16|0;c[F>>2]=1048576;c[F+4>>2]=0;F=G+24|0;c[F>>2]=0;c[F+4>>2]=1310720;F=G+32|0;c[F>>2]=1048576;c[F+4>>2]=512;F=G+40|0;c[F>>2]=0;c[F+4>>2]=0;F=G+48|0;c[F>>2]=1073741824;c[F+4>>2]=0;F=G+56|0;c[F>>2]=0;c[F+4>>2]=1966080;F=G+64|0;c[F>>2]=1073741824;c[F+4>>2]=256;F=G+72|0;c[F>>2]=0;c[F+4>>2]=0;F=G+80|0;c[F>>2]=0;c[F+4>>2]=512;F=G+88|0;c[F>>2]=0;c[F+4>>2]=2686976;F=G+96|0;c[F>>2]=268435456;c[F+4>>2]=512;F=G+104|0;c[F>>2]=0;c[F+4>>2]=0;F=G+112|0;c[F>>2]=0;c[F+4>>2]=256;F=G+120|0;c[F>>2]=0;c[F+4>>2]=2621440;F=G+128|0;c[F>>2]=524288;c[F+4>>2]=256;F=G+136|0;c[F>>2]=0;c[F+4>>2]=0;F=G+144|0;c[F>>2]=268435456;c[F+4>>2]=0;F=G+152|0;c[F>>2]=0;c[F+4>>2]=1835008;F=G+160|0;c[F>>2]=269484032;c[F+4>>2]=0;F=G+168|0;c[F>>2]=0;c[F+4>>2]=0;F=G+176|0;c[F>>2]=524288;c[F+4>>2]=0;F=G+184|0;c[F>>2]=0;c[F+4>>2]=1245184;c[11965]=0;c[11966]=0;c[11967]=0;F=Jm(192)|0;C=F;c[11966]=C;c[11965]=C;c[11967]=F+192;F=G+192|0;G=E;E=C;do{if((E|0)==0){Hb=0}else{C=c[G+4>>2]|0;c[E>>2]=c[G>>2];c[E+4>>2]=C;Hb=c[11966]|0}E=Hb+8|0;c[11966]=E;G=G+8|0;}while((G|0)!=(F|0));F=H|0;c[F>>2]=538968064;c[F+4>>2]=0;G=H+8|0;c[G>>2]=0;c[G+4>>2]=0;G=H+16|0;c[G>>2]=1048576;c[G+4>>2]=0;G=H+24|0;c[G>>2]=0;c[G+4>>2]=1310720;G=H+32|0;c[G>>2]=1048576;c[G+4>>2]=512;G=H+40|0;c[G>>2]=0;c[G+4>>2]=0;G=H+48|0;c[G>>2]=536870912;c[G+4>>2]=0;G=H+56|0;c[G>>2]=0;c[G+4>>2]=1900544;G=H+64|0;c[G>>2]=536870912;c[G+4>>2]=1024;G=H+72|0;c[G>>2]=0;c[G+4>>2]=0;G=H+80|0;c[G>>2]=0;c[G+4>>2]=512;G=H+88|0;c[G>>2]=0;c[G+4>>2]=2686976;G=H+96|0;c[G>>2]=-2147483648;c[G+4>>2]=512;G=H+104|0;c[G>>2]=0;c[G+4>>2]=0;G=H+112|0;c[G>>2]=0;c[G+4>>2]=1024;G=H+120|0;c[G>>2]=0;c[G+4>>2]=2752512;G=H+128|0;c[G>>2]=2097152;c[G+4>>2]=1024;G=H+136|0;c[G>>2]=0;c[G+4>>2]=0;G=H+144|0;c[G>>2]=-2147483648;c[G+4>>2]=0;G=H+152|0;c[G>>2]=0;c[G+4>>2]=2031616;G=H+160|0;c[G>>2]=-2146435072;c[G+4>>2]=0;G=H+168|0;c[G>>2]=0;c[G+4>>2]=0;G=H+176|0;c[G>>2]=2097152;c[G+4>>2]=0;G=H+184|0;c[G>>2]=0;c[G+4>>2]=1376256;c[11968]=0;c[11969]=0;c[11970]=0;G=Jm(192)|0;E=G;c[11969]=E;c[11968]=E;c[11970]=G+192;G=H+192|0;H=F;F=E;do{if((F|0)==0){Ib=0}else{E=c[H+4>>2]|0;c[F>>2]=c[H>>2];c[F+4>>2]=E;Ib=c[11969]|0}F=Ib+8|0;c[11969]=F;H=H+8|0;}while((H|0)!=(G|0));G=I|0;c[G>>2]=1073741824;c[G+4>>2]=1;H=I+8|0;c[H>>2]=0;c[H+4>>2]=0;H=I+16|0;c[H>>2]=2097152;c[H+4>>2]=0;H=I+24|0;c[H>>2]=0;c[H+4>>2]=1376256;H=I+32|0;c[H>>2]=2097152;c[H+4>>2]=1024;H=I+40|0;c[H>>2]=0;c[H+4>>2]=0;H=I+48|0;c[H>>2]=1073741824;c[H+4>>2]=0;H=I+56|0;c[H>>2]=0;c[H+4>>2]=1966080;H=I+64|0;c[H>>2]=1073741824;c[H+4>>2]=2048;H=I+72|0;c[H>>2]=0;c[H+4>>2]=0;H=I+80|0;c[H>>2]=0;c[H+4>>2]=1024;H=I+88|0;c[H>>2]=0;c[H+4>>2]=2752512;H=I+96|0;c[H>>2]=0;c[H+4>>2]=5120;H=I+104|0;c[H>>2]=0;c[H+4>>2]=0;H=I+112|0;c[H>>2]=0;c[H+4>>2]=2048;H=I+120|0;c[H>>2]=0;c[H+4>>2]=2818048;H=I+128|0;c[H>>2]=0;c[H+4>>2]=2049;H=I+136|0;c[H>>2]=0;c[H+4>>2]=0;H=I+144|0;c[H>>2]=0;c[H+4>>2]=4096;H=I+152|0;c[H>>2]=0;c[H+4>>2]=2883584;H=I+160|0;c[H>>2]=2097152;c[H+4>>2]=4096;H=I+168|0;c[H>>2]=0;c[H+4>>2]=0;H=I+176|0;c[H>>2]=0;c[H+4>>2]=1;H=I+184|0;c[H>>2]=0;c[H+4>>2]=2097152;c[11971]=0;c[11972]=0;c[11973]=0;H=Jm(192)|0;F=H;c[11972]=F;c[11971]=F;c[11973]=H+192;H=I+192|0;I=G;G=F;do{if((G|0)==0){Jb=0}else{F=c[I+4>>2]|0;c[G>>2]=c[I>>2];c[G+4>>2]=F;Jb=c[11972]|0}G=Jb+8|0;c[11972]=G;I=I+8|0;}while((I|0)!=(H|0));H=J|0;c[H>>2]=2097152;c[H+4>>2]=2;I=J+8|0;c[I>>2]=0;c[I+4>>2]=0;I=J+16|0;c[I>>2]=4194304;c[I+4>>2]=0;I=J+24|0;c[I>>2]=0;c[I+4>>2]=1441792;I=J+32|0;c[I>>2]=-2143289344;c[I+4>>2]=0;I=J+40|0;c[I>>2]=0;c[I+4>>2]=0;I=J+48|0;c[I>>2]=2097152;c[I+4>>2]=0;I=J+56|0;c[I>>2]=0;c[I+4>>2]=1376256;I=J+64|0;c[I>>2]=2097152;c[I+4>>2]=4096;I=J+72|0;c[I>>2]=0;c[I+4>>2]=0;I=J+80|0;c[I>>2]=-2147483648;c[I+4>>2]=0;I=J+88|0;c[I>>2]=0;c[I+4>>2]=2031616;I=J+96|0;c[I>>2]=-2147483648;c[I+4>>2]=8192;I=J+104|0;c[I>>2]=0;c[I+4>>2]=0;I=J+112|0;c[I>>2]=0;c[I+4>>2]=4096;I=J+120|0;c[I>>2]=0;c[I+4>>2]=2883584;I=J+128|0;c[I>>2]=0;c[I+4>>2]=4098;I=J+136|0;c[I>>2]=0;c[I+4>>2]=0;I=J+144|0;c[I>>2]=0;c[I+4>>2]=8192;I=J+152|0;c[I>>2]=0;c[I+4>>2]=2949120;I=J+160|0;c[I>>2]=4194304;c[I+4>>2]=8192;I=J+168|0;c[I>>2]=0;c[I+4>>2]=0;I=J+176|0;c[I>>2]=0;c[I+4>>2]=2;I=J+184|0;c[I>>2]=0;c[I+4>>2]=2162688;c[11974]=0;c[11975]=0;c[11976]=0;I=Jm(192)|0;G=I;c[11975]=G;c[11974]=G;c[11976]=I+192;I=J+192|0;J=H;H=G;do{if((H|0)==0){Kb=0}else{G=c[J+4>>2]|0;c[H>>2]=c[J>>2];c[H+4>>2]=G;Kb=c[11975]|0}H=Kb+8|0;c[11975]=H;J=J+8|0;}while((J|0)!=(I|0));I=K|0;c[I>>2]=4194304;c[I+4>>2]=4;J=K+8|0;c[J>>2]=0;c[J+4>>2]=0;J=K+16|0;c[J>>2]=8388608;c[J+4>>2]=0;J=K+24|0;c[J>>2]=0;c[J+4>>2]=1507328;J=K+32|0;c[J>>2]=8388608;c[J+4>>2]=1;J=K+40|0;c[J>>2]=0;c[J+4>>2]=0;J=K+48|0;c[J>>2]=4194304;c[J+4>>2]=0;J=K+56|0;c[J>>2]=0;c[J+4>>2]=1441792;J=K+64|0;c[J>>2]=4194304;c[J+4>>2]=8192;J=K+72|0;c[J>>2]=0;c[J+4>>2]=0;J=K+80|0;c[J>>2]=0;c[J+4>>2]=1;J=K+88|0;c[J>>2]=0;c[J+4>>2]=2097152;J=K+96|0;c[J>>2]=0;c[J+4>>2]=16385;J=K+104|0;c[J>>2]=0;c[J+4>>2]=0;J=K+112|0;c[J>>2]=0;c[J+4>>2]=8192;J=K+120|0;c[J>>2]=0;c[J+4>>2]=2949120;J=K+128|0;c[J>>2]=0;c[J+4>>2]=8196;J=K+136|0;c[J>>2]=0;c[J+4>>2]=0;J=K+144|0;c[J>>2]=0;c[J+4>>2]=16384;J=K+152|0;c[J>>2]=0;c[J+4>>2]=3014656;J=K+160|0;c[J>>2]=8388608;c[J+4>>2]=16384;J=K+168|0;c[J>>2]=0;c[J+4>>2]=0;J=K+176|0;c[J>>2]=0;c[J+4>>2]=4;J=K+184|0;c[J>>2]=0;c[J+4>>2]=2228224;c[11977]=0;c[11978]=0;c[11979]=0;J=Jm(192)|0;H=J;c[11978]=H;c[11977]=H;c[11979]=J+192;J=K+192|0;K=I;I=H;do{if((I|0)==0){Lb=0}else{H=c[K+4>>2]|0;c[I>>2]=c[K>>2];c[I+4>>2]=H;Lb=c[11978]|0}I=Lb+8|0;c[11978]=I;K=K+8|0;}while((K|0)!=(J|0));J=L|0;c[J>>2]=0;c[J+4>>2]=2;K=L+8|0;c[K>>2]=0;c[K+4>>2]=0;K=L+16|0;c[K>>2]=16777216;c[K+4>>2]=12;K=L+24|0;c[K>>2]=0;c[K+4>>2]=2228224;K=L+32|0;c[K>>2]=0;c[K+4>>2]=2;K=L+40|0;c[K>>2]=0;c[K+4>>2]=0;K=L+48|0;c[K>>2]=25198592;c[K+4>>2]=0;K=L+56|0;c[K>>2]=0;c[K+4>>2]=1507328;K=L+64|0;c[K>>2]=0;c[K+4>>2]=16384;K=L+72|0;c[K>>2]=0;c[K+4>>2]=0;K=L+80|0;c[K>>2]=16777216;c[K+4>>2]=12;K=L+88|0;c[K>>2]=0;c[K+4>>2]=2228224;K=L+96|0;c[K>>2]=0;c[K+4>>2]=16384;K=L+104|0;c[K>>2]=0;c[K+4>>2]=0;K=L+112|0;c[K>>2]=0;c[K+4>>2]=402653184;K=L+120|0;c[K>>2]=128;c[K+4>>2]=3866624;K=L+128|0;c[K>>2]=0;c[K+4>>2]=16384;K=L+136|0;c[K>>2]=0;c[K+4>>2]=0;K=L+144|0;c[K>>2]=0;c[K+4>>2]=268533768;K=L+152|0;c[K>>2]=0;c[K+4>>2]=3080192;K=L+160|0;c[K>>2]=8388608;c[K+4>>2]=8;K=L+168|0;c[K>>2]=0;c[K+4>>2]=0;K=L+176|0;c[K>>2]=16777216;c[K+4>>2]=0;K=L+184|0;c[K>>2]=0;c[K+4>>2]=1572864;K=L+192|0;c[K>>2]=16777216;c[K+4>>2]=2;K=L+200|0;c[K>>2]=0;c[K+4>>2]=0;K=L+208|0;c[K>>2]=8388608;c[K+4>>2]=0;K=L+216|0;c[K>>2]=0;c[K+4>>2]=1507328;K=L+224|0;c[K>>2]=8388608;c[K+4>>2]=16384;K=L+232|0;c[K>>2]=0;c[K+4>>2]=0;K=L+240|0;c[K>>2]=0;c[K+4>>2]=2;K=L+248|0;c[K>>2]=0;c[K+4>>2]=2162688;K=L+256|0;c[K>>2]=0;c[K+4>>2]=32770;K=L+264|0;c[K>>2]=0;c[K+4>>2]=0;K=L+272|0;c[K>>2]=0;c[K+4>>2]=16384;K=L+280|0;c[K>>2]=0;c[K+4>>2]=3014656;K=L+288|0;c[K>>2]=0;c[K+4>>2]=16392;K=L+296|0;c[K>>2]=0;c[K+4>>2]=0;K=L+304|0;c[K>>2]=0;c[K+4>>2]=32768;K=L+312|0;c[K>>2]=0;c[K+4>>2]=3080192;K=L+320|0;c[K>>2]=16777216;c[K+4>>2]=32768;K=L+328|0;c[K>>2]=0;c[K+4>>2]=0;K=L+336|0;c[K>>2]=0;c[K+4>>2]=8;K=L+344|0;c[K>>2]=0;c[K+4>>2]=2293760;c[11980]=0;c[11981]=0;c[11982]=0;K=Jm(352)|0;I=K;c[11981]=I;c[11980]=I;c[11982]=K+352;K=L+352|0;L=J;J=I;do{if((J|0)==0){Mb=0}else{I=c[L+4>>2]|0;c[J>>2]=c[L>>2];c[J+4>>2]=I;Mb=c[11981]|0}J=Mb+8|0;c[11981]=J;L=L+8|0;}while((L|0)!=(K|0));K=M|0;c[K>>2]=0;c[K+4>>2]=4;L=M+8|0;c[L>>2]=0;c[L+4>>2]=0;L=M+16|0;c[L>>2]=33554432;c[L+4>>2]=24;L=M+24|0;c[L>>2]=0;c[L+4>>2]=2293760;L=M+32|0;c[L>>2]=0;c[L+4>>2]=4;L=M+40|0;c[L>>2]=0;c[L+4>>2]=0;L=M+48|0;c[L>>2]=50397184;c[L+4>>2]=0;L=M+56|0;c[L>>2]=0;c[L+4>>2]=1572864;L=M+64|0;c[L>>2]=0;c[L+4>>2]=32768;L=M+72|0;c[L>>2]=0;c[L+4>>2]=0;L=M+80|0;c[L>>2]=33554432;c[L+4>>2]=24;L=M+88|0;c[L>>2]=0;c[L+4>>2]=2293760;L=M+96|0;c[L>>2]=0;c[L+4>>2]=32768;L=M+104|0;c[L>>2]=0;c[L+4>>2]=0;L=M+112|0;c[L>>2]=0;c[L+4>>2]=537067536;L=M+120|0;c[L>>2]=0;c[L+4>>2]=3145728;L=M+128|0;c[L>>2]=0;c[L+4>>2]=32768;L=M+136|0;c[L>>2]=0;c[L+4>>2]=0;L=M+144|0;c[L>>2]=0;c[L+4>>2]=805306368;L=M+152|0;c[L>>2]=256;c[L+4>>2]=3932160;L=M+160|0;c[L>>2]=33554432;c[L+4>>2]=4;L=M+168|0;c[L>>2]=0;c[L+4>>2]=0;L=M+176|0;c[L>>2]=16777216;c[L+4>>2]=0;L=M+184|0;c[L>>2]=0;c[L+4>>2]=1572864;L=M+192|0;c[L>>2]=16777216;c[L+4>>2]=16;L=M+200|0;c[L>>2]=0;c[L+4>>2]=0;L=M+208|0;c[L>>2]=33554432;c[L+4>>2]=0;L=M+216|0;c[L>>2]=0;c[L+4>>2]=1638400;L=M+224|0;c[L>>2]=33554432;c[L+4>>2]=65536;L=M+232|0;c[L>>2]=0;c[L+4>>2]=0;L=M+240|0;c[L>>2]=0;c[L+4>>2]=16;L=M+248|0;c[L>>2]=0;c[L+4>>2]=2359296;L=M+256|0;c[L>>2]=0;c[L+4>>2]=32784;L=M+264|0;c[L>>2]=0;c[L+4>>2]=0;L=M+272|0;c[L>>2]=0;c[L+4>>2]=65536;L=M+280|0;c[L>>2]=0;c[L+4>>2]=3145728;L=M+288|0;c[L>>2]=0;c[L+4>>2]=65540;L=M+296|0;c[L>>2]=0;c[L+4>>2]=0;L=M+304|0;c[L>>2]=0;c[L+4>>2]=32768;L=M+312|0;c[L>>2]=0;c[L+4>>2]=3080192;L=M+320|0;c[L>>2]=16777216;c[L+4>>2]=32768;L=M+328|0;c[L>>2]=0;c[L+4>>2]=0;L=M+336|0;c[L>>2]=0;c[L+4>>2]=4;L=M+344|0;c[L>>2]=0;c[L+4>>2]=2228224;c[11983]=0;c[11984]=0;c[11985]=0;L=Jm(352)|0;J=L;c[11984]=J;c[11983]=J;c[11985]=L+352;L=M+352|0;M=K;K=J;do{if((K|0)==0){Nb=0}else{J=c[M+4>>2]|0;c[K>>2]=c[M>>2];c[K+4>>2]=J;Nb=c[11984]|0}K=Nb+8|0;c[11984]=K;M=M+8|0;}while((M|0)!=(L|0));L=N|0;c[L>>2]=0;c[L+4>>2]=8;L=N+8|0;c[L>>2]=0;c[L+4>>2]=0;L=N+16|0;c[L>>2]=33554432;c[L+4>>2]=0;L=N+24|0;c[L>>2]=0;c[L+4>>2]=1638400;L=N+32|0;c[L>>2]=0;c[L+4>>2]=65536;L=N+40|0;c[L>>2]=0;c[L+4>>2]=0;L=N+48|0;c[L>>2]=0;c[L+4>>2]=131072;L=N+56|0;c[L>>2]=0;c[L+4>>2]=3211264;c[11986]=0;c[11987]=0;c[11988]=0;L=Jm(64)|0;M=L;c[11987]=M;c[11986]=M;c[11988]=L+64;if((L|0)==0){Ob=0}else{c[M>>2]=0;c[M+4>>2]=8;Ob=M}M=Ob+8|0;c[11987]=M;c[M>>2]=0;c[M+4>>2]=0;M=(c[11987]|0)+8|0;c[11987]=M;c[M>>2]=33554432;c[M+4>>2]=0;M=(c[11987]|0)+8|0;c[11987]=M;c[M>>2]=0;c[M+4>>2]=1638400;M=(c[11987]|0)+8|0;c[11987]=M;c[M>>2]=0;c[M+4>>2]=65536;M=(c[11987]|0)+8|0;c[11987]=M;c[M>>2]=0;c[M+4>>2]=0;M=(c[11987]|0)+8|0;c[11987]=M;Ob=N+48|0;L=c[Ob+4>>2]|0;c[M>>2]=c[Ob>>2];c[M+4>>2]=L;L=(c[11987]|0)+8|0;c[11987]=L;M=N+56|0;N=c[M+4>>2]|0;c[L>>2]=c[M>>2];c[L+4>>2]=N;c[11987]=(c[11987]|0)+8;N=O|0;c[N>>2]=0;c[N+4>>2]=64;N=O+8|0;c[N>>2]=0;c[N+4>>2]=0;N=O+16|0;c[N>>2]=67108864;c[N+4>>2]=0;N=O+24|0;c[N>>2]=0;c[N+4>>2]=1703936;N=O+32|0;c[N>>2]=0;c[N+4>>2]=64;N=O+40|0;c[N>>2]=0;c[N+4>>2]=0;N=O+48|0;c[N>>2]=0;c[N+4>>2]=262144;N=O+56|0;c[N>>2]=0;c[N+4>>2]=3276800;c[11989]=0;c[11990]=0;c[11991]=0;N=Jm(64)|0;L=N;c[11990]=L;c[11989]=L;c[11991]=N+64;if((N|0)==0){Pb=0}else{c[L>>2]=0;c[L+4>>2]=64;Pb=L}L=Pb+8|0;c[11990]=L;c[L>>2]=0;c[L+4>>2]=0;L=(c[11990]|0)+8|0;c[11990]=L;c[L>>2]=67108864;c[L+4>>2]=0;L=(c[11990]|0)+8|0;c[11990]=L;c[L>>2]=0;c[L+4>>2]=1703936;L=(c[11990]|0)+8|0;c[11990]=L;c[L>>2]=0;c[L+4>>2]=64;L=(c[11990]|0)+8|0;c[11990]=L;c[L>>2]=0;c[L+4>>2]=0;L=(c[11990]|0)+8|0;c[11990]=L;Pb=O+48|0;N=c[Pb+4>>2]|0;c[L>>2]=c[Pb>>2];c[L+4>>2]=N;N=(c[11990]|0)+8|0;c[11990]=N;L=O+56|0;O=c[L+4>>2]|0;c[N>>2]=c[L>>2];c[N+4>>2]=O;c[11990]=(c[11990]|0)+8;O=P|0;c[O>>2]=0;c[O+4>>2]=128;N=P+8|0;c[N>>2]=0;c[N+4>>2]=0;N=P+16|0;c[N>>2]=0;c[N+4>>2]=1074528256;N=P+24|0;c[N>>2]=0;c[N+4>>2]=3342336;N=P+32|0;c[N>>2]=0;c[N+4>>2]=128;N=P+40|0;c[N>>2]=0;c[N+4>>2]=0;N=P+48|0;c[N>>2]=67108864;c[N+4>>2]=262240;N=P+56|0;c[N>>2]=0;c[N+4>>2]=2490368;N=P+64|0;c[N>>2]=0;c[N+4>>2]=128;N=P+72|0;c[N>>2]=0;c[N+4>>2]=0;N=P+80|0;c[N>>2]=201457664;c[N+4>>2]=0;N=P+88|0;c[N>>2]=0;c[N+4>>2]=1769472;N=P+96|0;c[N>>2]=0;c[N+4>>2]=524320;N=P+104|0;c[N>>2]=0;c[N+4>>2]=0;N=P+112|0;c[N>>2]=0;c[N+4>>2]=262144;N=P+120|0;c[N>>2]=0;c[N+4>>2]=3276800;N=P+128|0;c[N>>2]=67108864;c[N+4>>2]=262144;N=P+136|0;c[N>>2]=0;c[N+4>>2]=0;N=P+144|0;c[N>>2]=0;c[N+4>>2]=32;N=P+152|0;c[N>>2]=0;c[N+4>>2]=2424832;N=P+160|0;c[N>>2]=134217728;c[N+4>>2]=32;N=P+168|0;c[N>>2]=0;c[N+4>>2]=0;N=P+176|0;c[N>>2]=67108864;c[N+4>>2]=0;N=P+184|0;c[N>>2]=0;c[N+4>>2]=1703936;N=P+192|0;c[N>>2]=67108864;c[N+4>>2]=128;N=P+200|0;c[N>>2]=0;c[N+4>>2]=0;N=P+208|0;c[N>>2]=134217728;c[N+4>>2]=0;N=P+216|0;c[N>>2]=0;c[N+4>>2]=1769472;N=P+224|0;c[N>>2]=134217728;c[N+4>>2]=524288;N=P+232|0;c[N>>2]=0;c[N+4>>2]=0;N=P+240|0;c[N>>2]=0;c[N+4>>2]=128;N=P+248|0;c[N>>2]=0;c[N+4>>2]=2555904;N=P+256|0;c[N>>2]=0;c[N+4>>2]=262272;N=P+264|0;c[N>>2]=0;c[N+4>>2]=0;N=P+272|0;c[N>>2]=0;c[N+4>>2]=524288;N=P+280|0;c[N>>2]=0;c[N+4>>2]=3342336;c[11992]=0;c[11993]=0;c[11994]=0;N=Jm(288)|0;L=N;c[11993]=L;c[11992]=L;c[11994]=N+288;N=P+288|0;P=O;O=L;do{if((O|0)==0){Qb=0}else{L=c[P+4>>2]|0;c[O>>2]=c[P>>2];c[O+4>>2]=L;Qb=c[11993]|0}O=Qb+8|0;c[11993]=O;P=P+8|0;}while((P|0)!=(N|0));N=Q|0;c[N>>2]=0;c[N+4>>2]=256;P=Q+8|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+16|0;c[P>>2]=134217728;c[P+4>>2]=524480;P=Q+24|0;c[P>>2]=0;c[P+4>>2]=2555904;P=Q+32|0;c[P>>2]=0;c[P+4>>2]=256;P=Q+40|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+48|0;c[P>>2]=0;c[P+4>>2]=-2145910784;P=Q+56|0;c[P>>2]=0;c[P+4>>2]=3407872;P=Q+64|0;c[P>>2]=0;c[P+4>>2]=256;P=Q+72|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+80|0;c[P>>2]=402915328;c[P+4>>2]=0;P=Q+88|0;c[P>>2]=0;c[P+4>>2]=1835008;P=Q+96|0;c[P>>2]=134217728;c[P+4>>2]=524288;P=Q+104|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+112|0;c[P>>2]=0;c[P+4>>2]=64;P=Q+120|0;c[P>>2]=0;c[P+4>>2]=2490368;P=Q+128|0;c[P>>2]=268435456;c[P+4>>2]=64;P=Q+136|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+144|0;c[P>>2]=134217728;c[P+4>>2]=0;P=Q+152|0;c[P>>2]=0;c[P+4>>2]=1769472;P=Q+160|0;c[P>>2]=134217728;c[P+4>>2]=256;P=Q+168|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+176|0;c[P>>2]=268435456;c[P+4>>2]=0;P=Q+184|0;c[P>>2]=0;c[P+4>>2]=1835008;P=Q+192|0;c[P>>2]=268435456;c[P+4>>2]=1048576;P=Q+200|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+208|0;c[P>>2]=0;c[P+4>>2]=256;P=Q+216|0;c[P>>2]=0;c[P+4>>2]=2621440;P=Q+224|0;c[P>>2]=0;c[P+4>>2]=524544;P=Q+232|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+240|0;c[P>>2]=0;c[P+4>>2]=1048576;P=Q+248|0;c[P>>2]=0;c[P+4>>2]=3407872;P=Q+256|0;c[P>>2]=0;c[P+4>>2]=1048640;P=Q+264|0;c[P>>2]=0;c[P+4>>2]=0;P=Q+272|0;c[P>>2]=0;c[P+4>>2]=524288;P=Q+280|0;c[P>>2]=0;c[P+4>>2]=3342336;c[11995]=0;c[11996]=0;c[11997]=0;P=Jm(288)|0;O=P;c[11996]=O;c[11995]=O;c[11997]=P+288;P=Q+288|0;Q=N;N=O;do{if((N|0)==0){Rb=0}else{O=c[Q+4>>2]|0;c[N>>2]=c[Q>>2];c[N+4>>2]=O;Rb=c[11996]|0}N=Rb+8|0;c[11996]=N;Q=Q+8|0;}while((Q|0)!=(P|0));P=R|0;c[P>>2]=0;c[P+4>>2]=2097280;Q=R+8|0;c[Q>>2]=0;c[Q+4>>2]=0;Q=R+16|0;c[Q>>2]=0;c[Q+4>>2]=1048576;Q=R+24|0;c[Q>>2]=0;c[Q+4>>2]=3407872;Q=R+32|0;c[Q>>2]=0;c[Q+4>>2]=1049088;Q=R+40|0;c[Q>>2]=0;c[Q+4>>2]=0;Q=R+48|0;c[Q>>2]=0;c[Q+4>>2]=2097152;Q=R+56|0;c[Q>>2]=0;c[Q+4>>2]=3473408;Q=R+64|0;c[Q>>2]=536870912;c[Q+4>>2]=2097152;Q=R+72|0;c[Q>>2]=0;c[Q+4>>2]=0;Q=R+80|0;c[Q>>2]=0;c[Q+4>>2]=512;Q=R+88|0;c[Q>>2]=0;c[Q+4>>2]=2686976;Q=R+96|0;c[Q>>2]=268435456;c[Q+4>>2]=512;Q=R+104|0;c[Q>>2]=0;c[Q+4>>2]=0;Q=R+112|0;c[Q>>2]=536870912;c[Q+4>>2]=0;Q=R+120|0;c[Q>>2]=0;c[Q+4>>2]=1900544;Q=R+128|0;c[Q>>2]=536870912;c[Q+4>>2]=128;Q=R+136|0;c[Q>>2]=0;c[Q+4>>2]=0;Q=R+144|0;c[Q>>2]=268435456;c[Q+4>>2]=0;Q=R+152|0;c[Q>>2]=0;c[Q+4>>2]=1835008;Q=R+160|0;c[Q>>2]=268435456;c[Q+4>>2]=1048576;Q=R+168|0;c[Q>>2]=0;c[Q+4>>2]=0;Q=R+176|0;c[Q>>2]=0;c[Q+4>>2]=128;Q=R+184|0;c[Q>>2]=0;c[Q+4>>2]=2555904;c[11998]=0;c[11999]=0;c[12e3]=0;Q=Jm(192)|0;N=Q;c[11999]=N;c[11998]=N;c[12e3]=Q+192;Q=R+192|0;R=P;P=N;do{if((P|0)==0){Sb=0}else{N=c[R+4>>2]|0;c[P>>2]=c[R>>2];c[P+4>>2]=N;Sb=c[11999]|0}P=Sb+8|0;c[11999]=P;R=R+8|0;}while((R|0)!=(Q|0));Q=S|0;c[Q>>2]=0;c[Q+4>>2]=4194560;R=S+8|0;c[R>>2]=0;c[R+4>>2]=0;R=S+16|0;c[R>>2]=0;c[R+4>>2]=2097152;R=S+24|0;c[R>>2]=0;c[R+4>>2]=3473408;R=S+32|0;c[R>>2]=536870912;c[R+4>>2]=2097152;R=S+40|0;c[R>>2]=0;c[R+4>>2]=0;R=S+48|0;c[R>>2]=0;c[R+4>>2]=256;R=S+56|0;c[R>>2]=0;c[R+4>>2]=2621440;R=S+64|0;c[R>>2]=1073741824;c[R+4>>2]=256;R=S+72|0;c[R>>2]=0;c[R+4>>2]=0;R=S+80|0;c[R>>2]=536870912;c[R+4>>2]=0;R=S+88|0;c[R>>2]=0;c[R+4>>2]=1900544;R=S+96|0;c[R>>2]=536870912;c[R+4>>2]=1024;R=S+104|0;c[R>>2]=0;c[R+4>>2]=0;R=S+112|0;c[R>>2]=1073741824;c[R+4>>2]=0;R=S+120|0;c[R>>2]=0;c[R+4>>2]=1966080;R=S+128|0;c[R>>2]=1073741824;c[R+4>>2]=4194304;R=S+136|0;c[R>>2]=0;c[R+4>>2]=0;R=S+144|0;c[R>>2]=0;c[R+4>>2]=1024;R=S+152|0;c[R>>2]=0;c[R+4>>2]=2752512;R=S+160|0;c[R>>2]=0;c[R+4>>2]=2098176;R=S+168|0;c[R>>2]=0;c[R+4>>2]=0;R=S+176|0;c[R>>2]=0;c[R+4>>2]=4194304;R=S+184|0;c[R>>2]=0;c[R+4>>2]=3538944;c[12001]=0;c[12002]=0;c[12003]=0;R=Jm(192)|0;P=R;c[12002]=P;c[12001]=P;c[12003]=R+192;R=S+192|0;S=Q;Q=P;do{if((Q|0)==0){Tb=0}else{P=c[S+4>>2]|0;c[Q>>2]=c[S>>2];c[Q+4>>2]=P;Tb=c[12002]|0}Q=Tb+8|0;c[12002]=Q;S=S+8|0;}while((S|0)!=(R|0));R=T|0;c[R>>2]=0;c[R+4>>2]=8389120;S=T+8|0;c[S>>2]=0;c[S+4>>2]=0;S=T+16|0;c[S>>2]=0;c[S+4>>2]=4194304;S=T+24|0;c[S>>2]=0;c[S+4>>2]=3538944;S=T+32|0;c[S>>2]=1073741824;c[S+4>>2]=4194304;S=T+40|0;c[S>>2]=0;c[S+4>>2]=0;S=T+48|0;c[S>>2]=0;c[S+4>>2]=512;S=T+56|0;c[S>>2]=0;c[S+4>>2]=2686976;S=T+64|0;c[S>>2]=-2147483648;c[S+4>>2]=512;S=T+72|0;c[S>>2]=0;c[S+4>>2]=0;S=T+80|0;c[S>>2]=1073741824;c[S+4>>2]=0;S=T+88|0;c[S>>2]=0;c[S+4>>2]=1966080;S=T+96|0;c[S>>2]=1073741824;c[S+4>>2]=2048;S=T+104|0;c[S>>2]=0;c[S+4>>2]=0;S=T+112|0;c[S>>2]=-2147483648;c[S+4>>2]=0;S=T+120|0;c[S>>2]=0;c[S+4>>2]=2031616;S=T+128|0;c[S>>2]=-2147483648;c[S+4>>2]=8388608;S=T+136|0;c[S>>2]=0;c[S+4>>2]=0;S=T+144|0;c[S>>2]=0;c[S+4>>2]=2048;S=T+152|0;c[S>>2]=0;c[S+4>>2]=2818048;S=T+160|0;c[S>>2]=0;c[S+4>>2]=4196352;S=T+168|0;c[S>>2]=0;c[S+4>>2]=0;S=T+176|0;c[S>>2]=0;c[S+4>>2]=8388608;S=T+184|0;c[S>>2]=0;c[S+4>>2]=3604480;c[12004]=0;c[12005]=0;c[12006]=0;S=Jm(192)|0;Q=S;c[12005]=Q;c[12004]=Q;c[12006]=S+192;S=T+192|0;T=R;R=Q;do{if((R|0)==0){Ub=0}else{Q=c[T+4>>2]|0;c[R>>2]=c[T>>2];c[R+4>>2]=Q;Ub=c[12005]|0}R=Ub+8|0;c[12005]=R;T=T+8|0;}while((T|0)!=(S|0));S=U|0;c[S>>2]=-2147483648;c[S+4>>2]=8388608;T=U+8|0;c[T>>2]=0;c[T+4>>2]=0;T=U+16|0;c[T>>2]=0;c[T+4>>2]=1024;T=U+24|0;c[T>>2]=0;c[T+4>>2]=2752512;T=U+32|0;c[T>>2]=0;c[T+4>>2]=5120;T=U+40|0;c[T>>2]=0;c[T+4>>2]=0;T=U+48|0;c[T>>2]=-2147483648;c[T+4>>2]=0;T=U+56|0;c[T>>2]=0;c[T+4>>2]=2031616;T=U+64|0;c[T>>2]=-2147483648;c[T+4>>2]=16777216;T=U+72|0;c[T>>2]=0;c[T+4>>2]=0;T=U+80|0;c[T>>2]=0;c[T+4>>2]=4096;T=U+88|0;c[T>>2]=0;c[T+4>>2]=2883584;T=U+96|0;c[T>>2]=0;c[T+4>>2]=8392704;T=U+104|0;c[T>>2]=0;c[T+4>>2]=0;T=U+112|0;c[T>>2]=0;c[T+4>>2]=16777216;T=U+120|0;c[T>>2]=0;c[T+4>>2]=3670016;T=U+128|0;c[T>>2]=0;c[T+4>>2]=16778240;T=U+136|0;c[T>>2]=0;c[T+4>>2]=0;T=U+144|0;c[T>>2]=0;c[T+4>>2]=8388608;T=U+152|0;c[T>>2]=0;c[T+4>>2]=3604480;c[12007]=0;c[12008]=0;c[12009]=0;T=Jm(160)|0;R=T;c[12008]=R;c[12007]=R;c[12009]=T+160;T=U+160|0;U=S;S=R;do{if((S|0)==0){Vb=0}else{R=c[U+4>>2]|0;c[S>>2]=c[U>>2];c[S+4>>2]=R;Vb=c[12008]|0}S=Vb+8|0;c[12008]=S;U=U+8|0;}while((U|0)!=(T|0));T=V|0;c[T>>2]=0;c[T+4>>2]=2049;U=V+8|0;c[U>>2]=0;c[U+4>>2]=0;U=V+16|0;c[U>>2]=-2147483648;c[U+4>>2]=0;U=V+24|0;c[U>>2]=0;c[U+4>>2]=2031616;U=V+32|0;c[U>>2]=-2147483648;c[U+4>>2]=16777216;U=V+40|0;c[U>>2]=0;c[U+4>>2]=0;U=V+48|0;c[U>>2]=0;c[U+4>>2]=2048;U=V+56|0;c[U>>2]=0;c[U+4>>2]=2818048;U=V+64|0;c[U>>2]=0;c[U+4>>2]=33556480;U=V+72|0;c[U>>2]=0;c[U+4>>2]=0;U=V+80|0;c[U>>2]=0;c[U+4>>2]=16777216;U=V+88|0;c[U>>2]=0;c[U+4>>2]=3670016;U=V+96|0;c[U>>2]=0;c[U+4>>2]=16785408;U=V+104|0;c[U>>2]=0;c[U+4>>2]=0;U=V+112|0;c[U>>2]=0;c[U+4>>2]=33554432;U=V+120|0;c[U>>2]=0;c[U+4>>2]=3735552;U=V+128|0;c[U>>2]=0;c[U+4>>2]=33554433;U=V+136|0;c[U>>2]=0;c[U+4>>2]=0;U=V+144|0;c[U>>2]=0;c[U+4>>2]=8192;U=V+152|0;c[U>>2]=0;c[U+4>>2]=2949120;U=V+160|0;c[U>>2]=-2147483648;c[U+4>>2]=8192;U=V+168|0;c[U>>2]=0;c[U+4>>2]=0;U=V+176|0;c[U>>2]=0;c[U+4>>2]=1;U=V+184|0;c[U>>2]=0;c[U+4>>2]=2097152;c[12010]=0;c[12011]=0;c[12012]=0;U=Jm(192)|0;S=U;c[12011]=S;c[12010]=S;c[12012]=U+192;U=V+192|0;V=T;T=S;do{if((T|0)==0){Wb=0}else{S=c[V+4>>2]|0;c[T>>2]=c[V>>2];c[T+4>>2]=S;Wb=c[12011]|0}T=Wb+8|0;c[12011]=T;V=V+8|0;}while((V|0)!=(U|0));U=W|0;c[U>>2]=0;c[U+4>>2]=16385;V=W+8|0;c[V>>2]=0;c[V+4>>2]=0;V=W+16|0;c[V>>2]=0;c[V+4>>2]=2;V=W+24|0;c[V>>2]=0;c[V+4>>2]=2162688;V=W+32|0;c[V>>2]=0;c[V+4>>2]=67108866;V=W+40|0;c[V>>2]=0;c[V+4>>2]=0;V=W+48|0;c[V>>2]=0;c[V+4>>2]=16384;V=W+56|0;c[V>>2]=0;c[V+4>>2]=3014656;V=W+64|0;c[V>>2]=0;c[V+4>>2]=33570816;V=W+72|0;c[V>>2]=0;c[V+4>>2]=0;V=W+80|0;c[V>>2]=0;c[V+4>>2]=67108864;V=W+88|0;c[V>>2]=0;c[V+4>>2]=3801088;V=W+96|0;c[V>>2]=0;c[V+4>>2]=67112960;V=W+104|0;c[V>>2]=0;c[V+4>>2]=0;V=W+112|0;c[V>>2]=0;c[V+4>>2]=33554432;V=W+120|0;c[V>>2]=0;c[V+4>>2]=3735552;V=W+128|0;c[V>>2]=0;c[V+4>>2]=33554433;V=W+136|0;c[V>>2]=0;c[V+4>>2]=0;V=W+144|0;c[V>>2]=0;c[V+4>>2]=4096;V=W+152|0;c[V>>2]=0;c[V+4>>2]=2883584;V=W+160|0;c[V>>2]=0;c[V+4>>2]=4098;V=W+168|0;c[V>>2]=0;c[V+4>>2]=0;V=W+176|0;c[V>>2]=0;c[V+4>>2]=1;V=W+184|0;c[V>>2]=0;c[V+4>>2]=2097152;c[12013]=0;c[12014]=0;c[12015]=0;V=Jm(192)|0;T=V;c[12014]=T;c[12013]=T;c[12015]=V+192;V=W+192|0;W=U;U=T;do{if((U|0)==0){Xb=0}else{T=c[W+4>>2]|0;c[U>>2]=c[W>>2];c[U+4>>2]=T;Xb=c[12014]|0}U=Xb+8|0;c[12014]=U;W=W+8|0;}while((W|0)!=(V|0));V=X|0;c[V>>2]=0;c[V+4>>2]=8196;W=X+8|0;c[W>>2]=0;c[W+4>>2]=0;W=X+16|0;c[W>>2]=0;c[W+4>>2]=2;W=X+24|0;c[W>>2]=0;c[W+4>>2]=2162688;W=X+32|0;c[W>>2]=0;c[W+4>>2]=67108866;W=X+40|0;c[W>>2]=0;c[W+4>>2]=0;W=X+48|0;c[W>>2]=0;c[W+4>>2]=8192;W=X+56|0;c[W>>2]=0;c[W+4>>2]=2949120;W=X+64|0;c[W>>2]=0;c[W+4>>2]=134225920;W=X+72|0;c[W>>2]=0;c[W+4>>2]=0;W=X+80|0;c[W>>2]=0;c[W+4>>2]=67108864;W=X+88|0;c[W>>2]=0;c[W+4>>2]=3801088;W=X+96|0;c[W>>2]=0;c[W+4>>2]=67141632;W=X+104|0;c[W>>2]=0;c[W+4>>2]=0;W=X+112|0;c[W>>2]=0;c[W+4>>2]=134217728;W=X+120|0;c[W>>2]=0;c[W+4>>2]=3866624;W=X+128|0;c[W>>2]=0;c[W+4>>2]=134217732;W=X+136|0;c[W>>2]=0;c[W+4>>2]=0;W=X+144|0;c[W>>2]=0;c[W+4>>2]=32768;W=X+152|0;c[W>>2]=0;c[W+4>>2]=3080192;W=X+160|0;c[W>>2]=0;c[W+4>>2]=32770;W=X+168|0;c[W>>2]=0;c[W+4>>2]=0;W=X+176|0;c[W>>2]=0;c[W+4>>2]=4;W=X+184|0;c[W>>2]=0;c[W+4>>2]=2228224;c[12016]=0;c[12017]=0;c[12018]=0;W=Jm(192)|0;U=W;c[12017]=U;c[12016]=U;c[12018]=W+192;W=X+192|0;X=V;V=U;do{if((V|0)==0){Yb=0}else{U=c[X+4>>2]|0;c[V>>2]=c[X>>2];c[V+4>>2]=U;Yb=c[12017]|0}V=Yb+8|0;c[12017]=V;X=X+8|0;}while((X|0)!=(W|0));W=Y|0;c[W>>2]=0;c[W+4>>2]=16384;X=Y+8|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+16|0;c[X>>2]=16777216;c[X+4>>2]=12;X=Y+24|0;c[X>>2]=0;c[X+4>>2]=2228224;X=Y+32|0;c[X>>2]=0;c[X+4>>2]=16384;X=Y+40|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+48|0;c[X>>2]=0;c[X+4>>2]=402653184;X=Y+56|0;c[X>>2]=128;c[X+4>>2]=3866624;X=Y+64|0;c[X>>2]=0;c[X+4>>2]=16384;X=Y+72|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+80|0;c[X>>2]=0;c[X+4>>2]=268533768;X=Y+88|0;c[X>>2]=0;c[X+4>>2]=3080192;X=Y+96|0;c[X>>2]=0;c[X+4>>2]=65540;X=Y+104|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+112|0;c[X>>2]=0;c[X+4>>2]=8;X=Y+120|0;c[X>>2]=0;c[X+4>>2]=2293760;X=Y+128|0;c[X>>2]=0;c[X+4>>2]=268435464;X=Y+136|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+144|0;c[X>>2]=0;c[X+4>>2]=65536;X=Y+152|0;c[X>>2]=0;c[X+4>>2]=3145728;X=Y+160|0;c[X>>2]=0;c[X+4>>2]=134283264;X=Y+168|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+176|0;c[X>>2]=0;c[X+4>>2]=268435456;X=Y+184|0;c[X>>2]=0;c[X+4>>2]=3932160;X=Y+192|0;c[X>>2]=0;c[X+4>>2]=268451840;X=Y+200|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+208|0;c[X>>2]=0;c[X+4>>2]=134217728;X=Y+216|0;c[X>>2]=0;c[X+4>>2]=3866624;X=Y+224|0;c[X>>2]=0;c[X+4>>2]=134217732;X=Y+232|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+240|0;c[X>>2]=0;c[X+4>>2]=16384;X=Y+248|0;c[X>>2]=0;c[X+4>>2]=3014656;X=Y+256|0;c[X>>2]=0;c[X+4>>2]=16392;X=Y+264|0;c[X>>2]=0;c[X+4>>2]=0;X=Y+272|0;c[X>>2]=0;c[X+4>>2]=4;X=Y+280|0;c[X>>2]=0;c[X+4>>2]=2228224;c[12019]=0;c[12020]=0;c[12021]=0;X=Jm(288)|0;V=X;c[12020]=V;c[12019]=V;c[12021]=X+288;X=Y+288|0;Y=W;W=V;do{if((W|0)==0){Zb=0}else{V=c[Y+4>>2]|0;c[W>>2]=c[Y>>2];c[W+4>>2]=V;Zb=c[12020]|0}W=Zb+8|0;c[12020]=W;Y=Y+8|0;}while((Y|0)!=(X|0));X=Z|0;c[X>>2]=0;c[X+4>>2]=32768;Y=Z+8|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+16|0;c[Y>>2]=33554432;c[Y+4>>2]=24;Y=Z+24|0;c[Y>>2]=0;c[Y+4>>2]=2293760;Y=Z+32|0;c[Y>>2]=0;c[Y+4>>2]=32768;Y=Z+40|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+48|0;c[Y>>2]=0;c[Y+4>>2]=537067536;Y=Z+56|0;c[Y>>2]=0;c[Y+4>>2]=3145728;Y=Z+64|0;c[Y>>2]=0;c[Y+4>>2]=32768;Y=Z+72|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+80|0;c[Y>>2]=0;c[Y+4>>2]=805306368;Y=Z+88|0;c[Y>>2]=256;c[Y+4>>2]=3932160;Y=Z+96|0;c[Y>>2]=0;c[Y+4>>2]=131080;Y=Z+104|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+112|0;c[Y>>2]=0;c[Y+4>>2]=16;Y=Z+120|0;c[Y>>2]=0;c[Y+4>>2]=2359296;Y=Z+128|0;c[Y>>2]=0;c[Y+4>>2]=536870928;Y=Z+136|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+144|0;c[Y>>2]=0;c[Y+4>>2]=131072;Y=Z+152|0;c[Y>>2]=0;c[Y+4>>2]=3211264;Y=Z+160|0;c[Y>>2]=0;c[Y+4>>2]=268566528;Y=Z+168|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+176|0;c[Y>>2]=0;c[Y+4>>2]=536870912;Y=Z+184|0;c[Y>>2]=0;c[Y+4>>2]=3997696;Y=Z+192|0;c[Y>>2]=0;c[Y+4>>2]=536903680;Y=Z+200|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+208|0;c[Y>>2]=0;c[Y+4>>2]=268435456;Y=Z+216|0;c[Y>>2]=0;c[Y+4>>2]=3932160;Y=Z+224|0;c[Y>>2]=0;c[Y+4>>2]=268435464;Y=Z+232|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+240|0;c[Y>>2]=0;c[Y+4>>2]=32768;Y=Z+248|0;c[Y>>2]=0;c[Y+4>>2]=3080192;Y=Z+256|0;c[Y>>2]=0;c[Y+4>>2]=32784;Y=Z+264|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=Z+272|0;c[Y>>2]=0;c[Y+4>>2]=8;Y=Z+280|0;c[Y>>2]=0;c[Y+4>>2]=2293760;c[12022]=0;c[12023]=0;c[12024]=0;Y=Jm(288)|0;W=Y;c[12023]=W;c[12022]=W;c[12024]=Y+288;Y=Z+288|0;Z=X;X=W;do{if((X|0)==0){_b=0}else{W=c[Z+4>>2]|0;c[X>>2]=c[Z>>2];c[X+4>>2]=W;_b=c[12023]|0}X=_b+8|0;c[12023]=X;Z=Z+8|0;}while((Z|0)!=(Y|0));Y=_|0;c[Y>>2]=0;c[Y+4>>2]=65536;Y=_+8|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=_+16|0;c[Y>>2]=0;c[Y+4>>2]=536870912;Y=_+24|0;c[Y>>2]=0;c[Y+4>>2]=3997696;Y=_+32|0;c[Y>>2]=0;c[Y+4>>2]=65536;Y=_+40|0;c[Y>>2]=0;c[Y+4>>2]=0;Y=_+48|0;c[Y>>2]=0;c[Y+4>>2]=16;Y=_+56|0;c[Y>>2]=0;c[Y+4>>2]=2359296;c[12025]=0;c[12026]=0;c[12027]=0;Y=Jm(64)|0;Z=Y;c[12026]=Z;c[12025]=Z;c[12027]=Y+64;if((Y|0)==0){$b=0}else{c[Z>>2]=0;c[Z+4>>2]=65536;$b=Z}Z=$b+8|0;c[12026]=Z;c[Z>>2]=0;c[Z+4>>2]=0;Z=(c[12026]|0)+8|0;c[12026]=Z;c[Z>>2]=0;c[Z+4>>2]=536870912;Z=(c[12026]|0)+8|0;c[12026]=Z;c[Z>>2]=0;c[Z+4>>2]=3997696;Z=(c[12026]|0)+8|0;c[12026]=Z;c[Z>>2]=0;c[Z+4>>2]=65536;Z=(c[12026]|0)+8|0;c[12026]=Z;c[Z>>2]=0;c[Z+4>>2]=0;Z=(c[12026]|0)+8|0;c[12026]=Z;$b=_+48|0;Y=c[$b+4>>2]|0;c[Z>>2]=c[$b>>2];c[Z+4>>2]=Y;Y=(c[12026]|0)+8|0;c[12026]=Y;Z=_+56|0;_=c[Z+4>>2]|0;c[Y>>2]=c[Z>>2];c[Y+4>>2]=_;c[12026]=(c[12026]|0)+8;_=$|0;c[_>>2]=0;c[_+4>>2]=524288;_=$+8|0;c[_>>2]=0;c[_+4>>2]=0;_=$+16|0;c[_>>2]=0;c[_+4>>2]=1073741824;_=$+24|0;c[_>>2]=0;c[_+4>>2]=4063232;_=$+32|0;c[_>>2]=0;c[_+4>>2]=64;_=$+40|0;c[_>>2]=0;c[_+4>>2]=0;_=$+48|0;c[_>>2]=0;c[_+4>>2]=32;_=$+56|0;c[_>>2]=0;c[_+4>>2]=2424832;c[12028]=0;c[12029]=0;c[12030]=0;_=Jm(64)|0;Y=_;c[12029]=Y;c[12028]=Y;c[12030]=_+64;if((_|0)==0){ac=0}else{c[Y>>2]=0;c[Y+4>>2]=524288;ac=Y}Y=ac+8|0;c[12029]=Y;c[Y>>2]=0;c[Y+4>>2]=0;Y=(c[12029]|0)+8|0;c[12029]=Y;c[Y>>2]=0;c[Y+4>>2]=1073741824;Y=(c[12029]|0)+8|0;c[12029]=Y;c[Y>>2]=0;c[Y+4>>2]=4063232;Y=(c[12029]|0)+8|0;c[12029]=Y;c[Y>>2]=0;c[Y+4>>2]=64;Y=(c[12029]|0)+8|0;c[12029]=Y;c[Y>>2]=0;c[Y+4>>2]=0;Y=(c[12029]|0)+8|0;c[12029]=Y;ac=$+48|0;_=c[ac+4>>2]|0;c[Y>>2]=c[ac>>2];c[Y+4>>2]=_;_=(c[12029]|0)+8|0;c[12029]=_;Y=$+56|0;$=c[Y+4>>2]|0;c[_>>2]=c[Y>>2];c[_+4>>2]=$;c[12029]=(c[12029]|0)+8;$=aa|0;c[$>>2]=0;c[$+4>>2]=128;_=aa+8|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+16|0;c[_>>2]=0;c[_+4>>2]=1074528256;_=aa+24|0;c[_>>2]=0;c[_+4>>2]=3342336;_=aa+32|0;c[_>>2]=0;c[_+4>>2]=128;_=aa+40|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+48|0;c[_>>2]=67108864;c[_+4>>2]=262240;_=aa+56|0;c[_>>2]=0;c[_+4>>2]=2490368;_=aa+64|0;c[_>>2]=0;c[_+4>>2]=128;_=aa+72|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+80|0;c[_>>2]=201457664;c[_+4>>2]=0;_=aa+88|0;c[_>>2]=0;c[_+4>>2]=1769472;_=aa+96|0;c[_>>2]=0;c[_+4>>2]=1048576;_=aa+104|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+112|0;c[_>>2]=0;c[_+4>>2]=1074528256;_=aa+120|0;c[_>>2]=0;c[_+4>>2]=3342336;_=aa+128|0;c[_>>2]=0;c[_+4>>2]=1048576;_=aa+136|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+144|0;c[_>>2]=0;c[_+4>>2]=-1073741824;_=aa+152|0;c[_>>2]=512;c[_+4>>2]=4128768;_=aa+160|0;c[_>>2]=0;c[_+4>>2]=262272;_=aa+168|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+176|0;c[_>>2]=0;c[_+4>>2]=64;_=aa+184|0;c[_>>2]=0;c[_+4>>2]=2490368;_=aa+192|0;c[_>>2]=0;c[_+4>>2]=1048640;_=aa+200|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+208|0;c[_>>2]=0;c[_+4>>2]=128;_=aa+216|0;c[_>>2]=0;c[_+4>>2]=2555904;_=aa+224|0;c[_>>2]=0;c[_+4>>2]=-2147483520;_=aa+232|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+240|0;c[_>>2]=0;c[_+4>>2]=1048576;_=aa+248|0;c[_>>2]=0;c[_+4>>2]=3407872;_=aa+256|0;c[_>>2]=0;c[_+4>>2]=1074790400;_=aa+264|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+272|0;c[_>>2]=0;c[_+4>>2]=-2147483648;_=aa+280|0;c[_>>2]=0;c[_+4>>2]=4128768;_=aa+288|0;c[_>>2]=0;c[_+4>>2]=-2147221504;_=aa+296|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+304|0;c[_>>2]=0;c[_+4>>2]=1073741824;_=aa+312|0;c[_>>2]=0;c[_+4>>2]=4063232;_=aa+320|0;c[_>>2]=0;c[_+4>>2]=1073741888;_=aa+328|0;c[_>>2]=0;c[_+4>>2]=0;_=aa+336|0;c[_>>2]=0;c[_+4>>2]=262144;_=aa+344|0;c[_>>2]=0;c[_+4>>2]=3276800;c[12031]=0;c[12032]=0;c[12033]=0;_=Jm(352)|0;Y=_;c[12032]=Y;c[12031]=Y;c[12033]=_+352;_=aa+352|0;aa=$;$=Y;do{if(($|0)==0){bc=0}else{Y=c[aa+4>>2]|0;c[$>>2]=c[aa>>2];c[$+4>>2]=Y;bc=c[12032]|0}$=bc+8|0;c[12032]=$;aa=aa+8|0;}while((aa|0)!=(_|0));_=ba|0;c[_>>2]=0;c[_+4>>2]=256;aa=ba+8|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+16|0;c[aa>>2]=134217728;c[aa+4>>2]=524480;aa=ba+24|0;c[aa>>2]=0;c[aa+4>>2]=2555904;aa=ba+32|0;c[aa>>2]=0;c[aa+4>>2]=256;aa=ba+40|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+48|0;c[aa>>2]=0;c[aa+4>>2]=-2145910784;aa=ba+56|0;c[aa>>2]=0;c[aa+4>>2]=3407872;aa=ba+64|0;c[aa>>2]=0;c[aa+4>>2]=256;aa=ba+72|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+80|0;c[aa>>2]=402915328;c[aa+4>>2]=0;aa=ba+88|0;c[aa>>2]=0;c[aa+4>>2]=1835008;aa=ba+96|0;c[aa>>2]=0;c[aa+4>>2]=2097152;aa=ba+104|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+112|0;c[aa>>2]=0;c[aa+4>>2]=-2147483648;aa=ba+120|0;c[aa>>2]=1025;c[aa+4>>2]=4194304;aa=ba+128|0;c[aa>>2]=0;c[aa+4>>2]=2097152;aa=ba+136|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+144|0;c[aa>>2]=0;c[aa+4>>2]=-2145910784;aa=ba+152|0;c[aa>>2]=0;c[aa+4>>2]=3407872;aa=ba+160|0;c[aa>>2]=0;c[aa+4>>2]=524544;aa=ba+168|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+176|0;c[aa>>2]=0;c[aa+4>>2]=128;aa=ba+184|0;c[aa>>2]=0;c[aa+4>>2]=2555904;aa=ba+192|0;c[aa>>2]=0;c[aa+4>>2]=2097280;aa=ba+200|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+208|0;c[aa>>2]=0;c[aa+4>>2]=256;aa=ba+216|0;c[aa>>2]=0;c[aa+4>>2]=2621440;aa=ba+224|0;c[aa>>2]=0;c[aa+4>>2]=256;aa=ba+232|0;c[aa>>2]=1;c[aa+4>>2]=0;aa=ba+240|0;c[aa>>2]=0;c[aa+4>>2]=2097152;aa=ba+248|0;c[aa>>2]=0;c[aa+4>>2]=3473408;aa=ba+256|0;c[aa>>2]=0;c[aa+4>>2]=-2145386496;aa=ba+280|0;bn(ba+264|0,0,16)|0;c[aa>>2]=1;c[aa+4>>2]=4194304;aa=ba+288|0;c[aa>>2]=0;c[aa+4>>2]=524288;aa=ba+296|0;c[aa>>2]=1;c[aa+4>>2]=0;aa=ba+304|0;c[aa>>2]=0;c[aa+4>>2]=-2147483648;aa=ba+312|0;c[aa>>2]=0;c[aa+4>>2]=4128768;aa=ba+320|0;c[aa>>2]=0;c[aa+4>>2]=-2147483520;aa=ba+328|0;c[aa>>2]=0;c[aa+4>>2]=0;aa=ba+336|0;c[aa>>2]=0;c[aa+4>>2]=524288;aa=ba+344|0;c[aa>>2]=0;c[aa+4>>2]=3342336;c[12034]=0;c[12035]=0;c[12036]=0;aa=Jm(352)|0;$=aa;c[12035]=$;c[12034]=$;c[12036]=aa+352;aa=ba+352|0;ba=_;_=$;do{if((_|0)==0){cc=0}else{$=c[ba+4>>2]|0;c[_>>2]=c[ba>>2];c[_+4>>2]=$;cc=c[12035]|0}_=cc+8|0;c[12035]=_;ba=ba+8|0;}while((ba|0)!=(aa|0));aa=ca|0;c[aa>>2]=0;c[aa+4>>2]=4194304;ba=ca+8|0;c[ba>>2]=1;c[ba+4>>2]=0;ba=ca+16|0;c[ba>>2]=0;c[ba+4>>2]=0;ba=ca+24|0;c[ba>>2]=2;c[ba+4>>2]=4259840;ba=ca+32|0;c[ba>>2]=0;c[ba+4>>2]=512;ba=ca+40|0;c[ba>>2]=2;c[ba+4>>2]=0;ba=ca+48|0;c[ba>>2]=0;c[ba+4>>2]=4194304;ba=ca+56|0;c[ba>>2]=0;c[ba+4>>2]=3538944;ba=ca+64|0;c[ba>>2]=0;c[ba+4>>2]=4194560;ba=ca+72|0;c[ba>>2]=0;c[ba+4>>2]=0;ba=ca+80|0;c[ba>>2]=0;c[ba+4>>2]=512;ba=ca+88|0;c[ba>>2]=0;c[ba+4>>2]=2686976;ba=ca+96|0;c[ba>>2]=0;c[ba+4>>2]=1049088;ba=ca+104|0;c[ba>>2]=0;c[ba+4>>2]=0;ba=ca+112|0;c[ba>>2]=0;c[ba+4>>2]=256;ba=ca+120|0;c[ba>>2]=0;c[ba+4>>2]=2621440;ba=ca+128|0;c[ba>>2]=0;c[ba+4>>2]=256;ba=ca+136|0;c[ba>>2]=1;c[ba+4>>2]=0;ba=ca+144|0;c[ba>>2]=0;c[ba+4>>2]=1048576;ba=ca+152|0;c[ba>>2]=0;c[ba+4>>2]=3407872;ba=ca+160|0;c[ba>>2]=0;c[ba+4>>2]=1048576;ba=ca+168|0;c[ba>>2]=2;c[ba+4>>2]=0;ba=ca+176|0;c[ba>>2]=0;c[ba+4>>2]=0;ba=ca+184|0;c[ba>>2]=1;c[ba+4>>2]=4194304;c[12037]=0;c[12038]=0;c[12039]=0;ba=Jm(192)|0;_=ba;c[12038]=_;c[12037]=_;c[12039]=ba+192;ba=ca+192|0;ca=aa;aa=_;do{if((aa|0)==0){dc=0}else{_=c[ca+4>>2]|0;c[aa>>2]=c[ca>>2];c[aa+4>>2]=_;dc=c[12038]|0}aa=dc+8|0;c[12038]=aa;ca=ca+8|0;}while((ca|0)!=(ba|0));ba=da|0;c[ba>>2]=0;c[ba+4>>2]=8388608;ca=da+8|0;c[ca>>2]=2;c[ca+4>>2]=0;ca=da+16|0;c[ca>>2]=0;c[ca+4>>2]=0;ca=da+24|0;c[ca>>2]=4;c[ca+4>>2]=4325376;ca=da+32|0;c[ca>>2]=0;c[ca+4>>2]=2097152;ca=da+40|0;c[ca>>2]=4;c[ca+4>>2]=0;ca=da+48|0;c[ca>>2]=0;c[ca+4>>2]=0;ca=da+56|0;c[ca>>2]=2;c[ca+4>>2]=4259840;ca=da+64|0;c[ca>>2]=0;c[ca+4>>2]=512;ca=da+72|0;c[ca>>2]=2;c[ca+4>>2]=0;ca=da+80|0;c[ca>>2]=0;c[ca+4>>2]=2097152;ca=da+88|0;c[ca>>2]=0;c[ca+4>>2]=3473408;ca=da+96|0;c[ca>>2]=0;c[ca+4>>2]=2098176;ca=da+104|0;c[ca>>2]=0;c[ca+4>>2]=0;ca=da+112|0;c[ca>>2]=0;c[ca+4>>2]=512;ca=da+120|0;c[ca>>2]=0;c[ca+4>>2]=2686976;ca=da+128|0;c[ca>>2]=0;c[ca+4>>2]=8389120;ca=da+136|0;c[ca>>2]=0;c[ca+4>>2]=0;ca=da+144|0;c[ca>>2]=0;c[ca+4>>2]=1024;ca=da+152|0;c[ca>>2]=0;c[ca+4>>2]=2752512;ca=da+160|0;c[ca>>2]=0;c[ca+4>>2]=1024;ca=da+168|0;c[ca>>2]=4;c[ca+4>>2]=0;ca=da+176|0;c[ca>>2]=0;c[ca+4>>2]=8388608;ca=da+184|0;c[ca>>2]=0;c[ca+4>>2]=3604480;c[12040]=0;c[12041]=0;c[12042]=0;ca=Jm(192)|0;aa=ca;c[12041]=aa;c[12040]=aa;c[12042]=ca+192;ca=da+192|0;da=ba;ba=aa;do{if((ba|0)==0){ec=0}else{aa=c[da+4>>2]|0;c[ba>>2]=c[da>>2];c[ba+4>>2]=aa;ec=c[12041]|0}ba=ec+8|0;c[12041]=ba;da=da+8|0;}while((da|0)!=(ca|0));ca=ea|0;c[ca>>2]=0;c[ca+4>>2]=4194304;da=ea+8|0;c[da>>2]=8;c[da+4>>2]=0;da=ea+16|0;c[da>>2]=0;c[da+4>>2]=0;da=ea+24|0;c[da>>2]=4;c[da+4>>2]=4325376;da=ea+32|0;c[da>>2]=0;c[da+4>>2]=16777216;da=ea+40|0;c[da>>2]=4;c[da+4>>2]=0;da=ea+48|0;c[da>>2]=0;c[da+4>>2]=0;da=ea+56|0;c[da>>2]=8;c[da+4>>2]=4390912;da=ea+64|0;c[da>>2]=0;c[da+4>>2]=2048;da=ea+72|0;c[da>>2]=8;c[da+4>>2]=0;da=ea+80|0;c[da>>2]=0;c[da+4>>2]=16777216;da=ea+88|0;c[da>>2]=0;c[da+4>>2]=3670016;da=ea+96|0;c[da>>2]=0;c[da+4>>2]=16778240;da=ea+104|0;c[da>>2]=0;c[da+4>>2]=0;da=ea+112|0;c[da>>2]=0;c[da+4>>2]=2048;da=ea+120|0;c[da>>2]=0;c[da+4>>2]=2818048;da=ea+128|0;c[da>>2]=0;c[da+4>>2]=4196352;da=ea+136|0;c[da>>2]=0;c[da+4>>2]=0;da=ea+144|0;c[da>>2]=0;c[da+4>>2]=1024;da=ea+152|0;c[da>>2]=0;c[da+4>>2]=2752512;da=ea+160|0;c[da>>2]=0;c[da+4>>2]=1024;da=ea+168|0;c[da>>2]=4;c[da+4>>2]=0;da=ea+176|0;c[da>>2]=0;c[da+4>>2]=4194304;da=ea+184|0;c[da>>2]=0;c[da+4>>2]=3538944;c[12043]=0;c[12044]=0;c[12045]=0;da=Jm(192)|0;ba=da;c[12044]=ba;c[12043]=ba;c[12045]=da+192;da=ea+192|0;ea=ca;ca=ba;do{if((ca|0)==0){fc=0}else{ba=c[ea+4>>2]|0;c[ca>>2]=c[ea>>2];c[ca+4>>2]=ba;fc=c[12044]|0}ca=fc+8|0;c[12044]=ca;ea=ea+8|0;}while((ea|0)!=(da|0));da=fa|0;c[da>>2]=0;c[da+4>>2]=8388608;ea=fa+8|0;c[ea>>2]=16;c[ea+4>>2]=0;ea=fa+16|0;c[ea>>2]=0;c[ea+4>>2]=0;ea=fa+24|0;c[ea>>2]=8;c[ea+4>>2]=4390912;ea=fa+32|0;c[ea>>2]=0;c[ea+4>>2]=2048;ea=fa+40|0;c[ea>>2]=8;c[ea+4>>2]=0;ea=fa+48|0;c[ea>>2]=0;c[ea+4>>2]=8388608;ea=fa+56|0;c[ea>>2]=0;c[ea+4>>2]=3604480;ea=fa+64|0;c[ea>>2]=0;c[ea+4>>2]=8392704;ea=fa+72|0;c[ea>>2]=0;c[ea+4>>2]=0;ea=fa+80|0;c[ea>>2]=0;c[ea+4>>2]=2048;ea=fa+88|0;c[ea>>2]=0;c[ea+4>>2]=2818048;ea=fa+96|0;c[ea>>2]=0;c[ea+4>>2]=33556480;ea=fa+104|0;c[ea>>2]=0;c[ea+4>>2]=0;ea=fa+112|0;c[ea>>2]=0;c[ea+4>>2]=4096;ea=fa+120|0;c[ea>>2]=0;c[ea+4>>2]=2883584;ea=fa+128|0;c[ea>>2]=0;c[ea+4>>2]=4096;ea=fa+136|0;c[ea>>2]=16;c[ea+4>>2]=0;ea=fa+144|0;c[ea>>2]=0;c[ea+4>>2]=33554432;ea=fa+152|0;c[ea>>2]=0;c[ea+4>>2]=3735552;ea=fa+160|0;c[ea>>2]=0;c[ea+4>>2]=33554432;ea=fa+168|0;c[ea>>2]=8;c[ea+4>>2]=0;ea=fa+176|0;c[ea>>2]=0;c[ea+4>>2]=0;ea=fa+184|0;c[ea>>2]=16;c[ea+4>>2]=4456448;c[12046]=0;c[12047]=0;c[12048]=0;ea=Jm(192)|0;ca=ea;c[12047]=ca;c[12046]=ca;c[12048]=ea+192;ea=fa+192|0;fa=da;da=ca;do{if((da|0)==0){gc=0}else{ca=c[fa+4>>2]|0;c[da>>2]=c[fa>>2];c[da+4>>2]=ca;gc=c[12047]|0}da=gc+8|0;c[12047]=da;fa=fa+8|0;}while((fa|0)!=(ea|0));ea=ga|0;c[ea>>2]=0;c[ea+4>>2]=67108864;fa=ga+8|0;c[fa>>2]=16;c[fa+4>>2]=0;fa=ga+16|0;c[fa>>2]=0;c[fa+4>>2]=0;fa=ga+24|0;c[fa>>2]=32;c[fa+4>>2]=4521984;fa=ga+32|0;c[fa>>2]=0;c[fa+4>>2]=8192;fa=ga+40|0;c[fa>>2]=32;c[fa+4>>2]=0;fa=ga+48|0;c[fa>>2]=0;c[fa+4>>2]=67108864;fa=ga+56|0;c[fa>>2]=0;c[fa+4>>2]=3801088;fa=ga+64|0;c[fa>>2]=0;c[fa+4>>2]=67112960;fa=ga+72|0;c[fa>>2]=0;c[fa+4>>2]=0;fa=ga+80|0;c[fa>>2]=0;c[fa+4>>2]=8192;fa=ga+88|0;c[fa>>2]=0;c[fa+4>>2]=2949120;fa=ga+96|0;c[fa>>2]=0;c[fa+4>>2]=16785408;fa=ga+104|0;c[fa>>2]=0;c[fa+4>>2]=0;fa=ga+112|0;c[fa>>2]=0;c[fa+4>>2]=4096;fa=ga+120|0;c[fa>>2]=0;c[fa+4>>2]=2883584;fa=ga+128|0;c[fa>>2]=0;c[fa+4>>2]=4096;fa=ga+136|0;c[fa>>2]=16;c[fa+4>>2]=0;fa=ga+144|0;c[fa>>2]=0;c[fa+4>>2]=16777216;fa=ga+152|0;c[fa>>2]=0;c[fa+4>>2]=3670016;fa=ga+160|0;c[fa>>2]=0;c[fa+4>>2]=16777216;fa=ga+168|0;c[fa>>2]=32;c[fa+4>>2]=0;fa=ga+176|0;c[fa>>2]=0;c[fa+4>>2]=0;fa=ga+184|0;c[fa>>2]=16;c[fa+4>>2]=4456448;c[12049]=0;c[12050]=0;c[12051]=0;fa=Jm(192)|0;da=fa;c[12050]=da;c[12049]=da;c[12051]=fa+192;fa=ga+192|0;ga=ea;ea=da;do{if((ea|0)==0){hc=0}else{da=c[ga+4>>2]|0;c[ea>>2]=c[ga>>2];c[ea+4>>2]=da;hc=c[12050]|0}ea=hc+8|0;c[12050]=ea;ga=ga+8|0;}while((ga|0)!=(fa|0));fa=ha|0;c[fa>>2]=0;c[fa+4>>2]=134217728;ga=ha+8|0;c[ga>>2]=32;c[ga+4>>2]=0;ga=ha+16|0;c[ga>>2]=0;c[ga+4>>2]=0;ga=ha+24|0;c[ga>>2]=64;c[ga+4>>2]=4587520;ga=ha+32|0;c[ga>>2]=0;c[ga+4>>2]=16384;ga=ha+40|0;c[ga>>2]=64;c[ga+4>>2]=0;ga=ha+48|0;c[ga>>2]=0;c[ga+4>>2]=134217728;ga=ha+56|0;c[ga>>2]=0;c[ga+4>>2]=3866624;ga=ha+64|0;c[ga>>2]=0;c[ga+4>>2]=134225920;ga=ha+72|0;c[ga>>2]=0;c[ga+4>>2]=0;ga=ha+80|0;c[ga>>2]=0;c[ga+4>>2]=16384;ga=ha+88|0;c[ga>>2]=0;c[ga+4>>2]=3014656;ga=ha+96|0;c[ga>>2]=0;c[ga+4>>2]=33570816;ga=ha+104|0;c[ga>>2]=0;c[ga+4>>2]=0;ga=ha+112|0;c[ga>>2]=0;c[ga+4>>2]=8192;ga=ha+120|0;c[ga>>2]=0;c[ga+4>>2]=2949120;ga=ha+128|0;c[ga>>2]=0;c[ga+4>>2]=8192;ga=ha+136|0;c[ga>>2]=32;c[ga+4>>2]=0;ga=ha+144|0;c[ga>>2]=0;c[ga+4>>2]=33554432;ga=ha+152|0;c[ga>>2]=0;c[ga+4>>2]=3735552;ga=ha+160|0;c[ga>>2]=0;c[ga+4>>2]=33554432;ga=ha+168|0;c[ga>>2]=64;c[ga+4>>2]=0;ga=ha+176|0;c[ga>>2]=0;c[ga+4>>2]=0;ga=ha+184|0;c[ga>>2]=32;c[ga+4>>2]=4521984;c[12052]=0;c[12053]=0;c[12054]=0;ga=Jm(192)|0;ea=ga;c[12053]=ea;c[12052]=ea;c[12054]=ga+192;ga=ha+192|0;ha=fa;fa=ea;do{if((fa|0)==0){ic=0}else{ea=c[ha+4>>2]|0;c[fa>>2]=c[ha>>2];c[fa+4>>2]=ea;ic=c[12053]|0}fa=ic+8|0;c[12053]=fa;ha=ha+8|0;}while((ha|0)!=(ga|0));ga=ia|0;c[ga>>2]=0;c[ga+4>>2]=16384;ha=ia+8|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+16|0;c[ha>>2]=16777216;c[ha+4>>2]=12;ha=ia+24|0;c[ha>>2]=0;c[ha+4>>2]=2228224;ha=ia+32|0;c[ha>>2]=0;c[ha+4>>2]=16384;ha=ia+40|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+48|0;c[ha>>2]=0;c[ha+4>>2]=402653184;ha=ia+56|0;c[ha>>2]=128;c[ha+4>>2]=3866624;ha=ia+64|0;c[ha>>2]=0;c[ha+4>>2]=16384;ha=ia+72|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+80|0;c[ha>>2]=0;c[ha+4>>2]=268533768;ha=ia+88|0;c[ha>>2]=0;c[ha+4>>2]=3080192;ha=ia+96|0;c[ha>>2]=0;c[ha+4>>2]=67108864;ha=ia+120|0;bn(ia+104|0,0,16)|0;c[ha>>2]=131264;c[ha+4>>2]=4587520;ha=ia+128|0;c[ha>>2]=0;c[ha+4>>2]=67108864;ha=ia+136|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+144|0;c[ha>>2]=0;c[ha+4>>2]=402653184;ha=ia+152|0;c[ha>>2]=128;c[ha+4>>2]=3866624;ha=ia+160|0;c[ha>>2]=0;c[ha+4>>2]=268435456;ha=ia+168|0;c[ha>>2]=64;c[ha+4>>2]=0;ha=ia+176|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+184|0;c[ha>>2]=128;c[ha+4>>2]=4653056;ha=ia+192|0;c[ha>>2]=0;c[ha+4>>2]=32768;ha=ia+200|0;c[ha>>2]=128;c[ha+4>>2]=0;ha=ia+208|0;c[ha>>2]=0;c[ha+4>>2]=268435456;ha=ia+216|0;c[ha>>2]=0;c[ha+4>>2]=3932160;ha=ia+224|0;c[ha>>2]=0;c[ha+4>>2]=268451840;ha=ia+232|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+240|0;c[ha>>2]=0;c[ha+4>>2]=32768;ha=ia+248|0;c[ha>>2]=0;c[ha+4>>2]=3080192;ha=ia+256|0;c[ha>>2]=0;c[ha+4>>2]=67141632;ha=ia+264|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+272|0;c[ha>>2]=0;c[ha+4>>2]=16384;ha=ia+280|0;c[ha>>2]=0;c[ha+4>>2]=3014656;ha=ia+288|0;c[ha>>2]=0;c[ha+4>>2]=16384;ha=ia+296|0;c[ha>>2]=64;c[ha+4>>2]=0;ha=ia+304|0;c[ha>>2]=0;c[ha+4>>2]=67108864;ha=ia+312|0;c[ha>>2]=0;c[ha+4>>2]=3801088;ha=ia+320|0;c[ha>>2]=0;c[ha+4>>2]=67108864;ha=ia+328|0;c[ha>>2]=128;c[ha+4>>2]=0;ha=ia+336|0;c[ha>>2]=0;c[ha+4>>2]=0;ha=ia+344|0;c[ha>>2]=64;c[ha+4>>2]=4587520;c[12055]=0;c[12056]=0;c[12057]=0;ha=Jm(352)|0;fa=ha;c[12056]=fa;c[12055]=fa;c[12057]=ha+352;ha=ia+352|0;ia=ga;ga=fa;do{if((ga|0)==0){jc=0}else{fa=c[ia+4>>2]|0;c[ga>>2]=c[ia>>2];c[ga+4>>2]=fa;jc=c[12056]|0}ga=jc+8|0;c[12056]=ga;ia=ia+8|0;}while((ia|0)!=(ha|0));ha=ja|0;c[ha>>2]=0;c[ha+4>>2]=134217728;ia=ja+24|0;bn(ja+8|0,0,16)|0;c[ia>>2]=262528;c[ia+4>>2]=4653056;ia=ja+32|0;c[ia>>2]=0;c[ia+4>>2]=134217728;ia=ja+40|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+48|0;c[ia>>2]=0;c[ia+4>>2]=805306368;ia=ja+56|0;c[ia>>2]=256;c[ia+4>>2]=3932160;ia=ja+64|0;c[ia>>2]=0;c[ia+4>>2]=32768;ia=ja+72|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+80|0;c[ia>>2]=33554432;c[ia+4>>2]=24;ia=ja+88|0;c[ia>>2]=0;c[ia+4>>2]=2293760;ia=ja+96|0;c[ia>>2]=0;c[ia+4>>2]=32768;ia=ja+104|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+112|0;c[ia>>2]=0;c[ia+4>>2]=537067536;ia=ja+120|0;c[ia>>2]=0;c[ia+4>>2]=3145728;ia=ja+128|0;c[ia>>2]=0;c[ia+4>>2]=32768;ia=ja+136|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+144|0;c[ia>>2]=0;c[ia+4>>2]=805306368;ia=ja+152|0;c[ia>>2]=256;c[ia+4>>2]=3932160;ia=ja+160|0;c[ia>>2]=0;c[ia+4>>2]=32768;ia=ja+168|0;c[ia>>2]=128;c[ia+4>>2]=0;ia=ja+176|0;c[ia>>2]=0;c[ia+4>>2]=134217728;ia=ja+184|0;c[ia>>2]=0;c[ia+4>>2]=3866624;ia=ja+192|0;c[ia>>2]=0;c[ia+4>>2]=134283264;ia=ja+200|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+208|0;c[ia>>2]=0;c[ia+4>>2]=32768;ia=ja+216|0;c[ia>>2]=0;c[ia+4>>2]=3080192;ia=ja+224|0;c[ia>>2]=0;c[ia+4>>2]=536903680;ia=ja+232|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+240|0;c[ia>>2]=0;c[ia+4>>2]=65536;ia=ja+248|0;c[ia>>2]=0;c[ia+4>>2]=3145728;ia=ja+256|0;c[ia>>2]=0;c[ia+4>>2]=65536;ia=ja+264|0;c[ia>>2]=256;c[ia+4>>2]=0;ia=ja+272|0;c[ia>>2]=0;c[ia+4>>2]=536870912;ia=ja+280|0;c[ia>>2]=0;c[ia+4>>2]=3997696;ia=ja+288|0;c[ia>>2]=0;c[ia+4>>2]=536870912;ia=ja+296|0;c[ia>>2]=128;c[ia+4>>2]=0;ia=ja+304|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+312|0;c[ia>>2]=256;c[ia+4>>2]=4718592;ia=ja+320|0;c[ia>>2]=0;c[ia+4>>2]=134217728;ia=ja+328|0;c[ia>>2]=256;c[ia+4>>2]=0;ia=ja+336|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ja+344|0;c[ia>>2]=128;c[ia+4>>2]=4653056;c[12058]=0;c[12059]=0;c[12060]=0;ia=Jm(352)|0;ga=ia;c[12059]=ga;c[12058]=ga;c[12060]=ia+352;ia=ja+352|0;ja=ha;ha=ga;do{if((ha|0)==0){kc=0}else{ga=c[ja+4>>2]|0;c[ha>>2]=c[ja>>2];c[ha+4>>2]=ga;kc=c[12059]|0}ha=kc+8|0;c[12059]=ha;ja=ja+8|0;}while((ja|0)!=(ia|0));ia=ka|0;c[ia>>2]=0;c[ia+4>>2]=268435456;ia=ka+24|0;bn(ka+8|0,0,16)|0;c[ia>>2]=256;c[ia+4>>2]=4718592;ia=ka+32|0;c[ia>>2]=0;c[ia+4>>2]=65536;ia=ka+40|0;c[ia>>2]=0;c[ia+4>>2]=0;ia=ka+48|0;c[ia>>2]=0;c[ia+4>>2]=131072;ia=ka+56|0;c[ia>>2]=0;c[ia+4>>2]=3211264;c[12061]=0;c[12062]=0;c[12063]=0;ia=Jm(64)|0;ja=ia;c[12062]=ja;c[12061]=ja;c[12063]=ia+64;if((ia|0)==0){lc=0}else{c[ja>>2]=0;c[ja+4>>2]=268435456;lc=ja}ja=lc+8|0;c[12062]=ja;c[ja>>2]=0;c[ja+4>>2]=0;ja=(c[12062]|0)+8|0;c[12062]=ja;c[ja>>2]=0;c[ja+4>>2]=0;ja=(c[12062]|0)+8|0;c[12062]=ja;c[ja>>2]=256;c[ja+4>>2]=4718592;ja=(c[12062]|0)+8|0;c[12062]=ja;c[ja>>2]=0;c[ja+4>>2]=65536;ja=(c[12062]|0)+8|0;c[12062]=ja;c[ja>>2]=0;c[ja+4>>2]=0;ja=(c[12062]|0)+8|0;c[12062]=ja;lc=ka+48|0;ia=c[lc+4>>2]|0;c[ja>>2]=c[lc>>2];c[ja+4>>2]=ia;ia=(c[12062]|0)+8|0;c[12062]=ia;ja=ka+56|0;ka=c[ja+4>>2]|0;c[ia>>2]=c[ja>>2];c[ia+4>>2]=ka;c[12062]=(c[12062]|0)+8;ka=la|0;c[ka>>2]=0;c[ka+4>>2]=-2147483648;ka=la+24|0;bn(la+8|0,0,16)|0;c[ka>>2]=512;c[ka+4>>2]=4784128;ka=la+32|0;c[ka>>2]=0;c[ka+4>>2]=524288;ka=la+40|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=la+48|0;c[ka>>2]=0;c[ka+4>>2]=262144;ka=la+56|0;c[ka>>2]=0;c[ka+4>>2]=3276800;c[12064]=0;c[12065]=0;c[12066]=0;ka=Jm(64)|0;ia=ka;c[12065]=ia;c[12064]=ia;c[12066]=ka+64;if((ka|0)==0){mc=0}else{c[ia>>2]=0;c[ia+4>>2]=-2147483648;mc=ia}ia=mc+8|0;c[12065]=ia;c[ia>>2]=0;c[ia+4>>2]=0;ia=(c[12065]|0)+8|0;c[12065]=ia;c[ia>>2]=0;c[ia+4>>2]=0;ia=(c[12065]|0)+8|0;c[12065]=ia;c[ia>>2]=512;c[ia+4>>2]=4784128;ia=(c[12065]|0)+8|0;c[12065]=ia;c[ia>>2]=0;c[ia+4>>2]=524288;ia=(c[12065]|0)+8|0;c[12065]=ia;c[ia>>2]=0;c[ia+4>>2]=0;ia=(c[12065]|0)+8|0;c[12065]=ia;mc=la+48|0;ka=c[mc+4>>2]|0;c[ia>>2]=c[mc>>2];c[ia+4>>2]=ka;ka=(c[12065]|0)+8|0;c[12065]=ka;ia=la+56|0;la=c[ia+4>>2]|0;c[ka>>2]=c[ia>>2];c[ka+4>>2]=la;c[12065]=(c[12065]|0)+8;la=ma|0;c[la>>2]=0;c[la+4>>2]=1048576;ka=ma+8|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+16|0;c[ka>>2]=0;c[ka+4>>2]=1074528256;ka=ma+24|0;c[ka>>2]=0;c[ka+4>>2]=3342336;ka=ma+32|0;c[ka>>2]=0;c[ka+4>>2]=1048576;ka=ma+40|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+48|0;c[ka>>2]=0;c[ka+4>>2]=-1073741824;ka=ma+56|0;c[ka>>2]=512;c[ka+4>>2]=4128768;ka=ma+64|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+72|0;c[ka>>2]=1;c[ka+4>>2]=0;ka=ma+80|0;c[ka>>2]=0;c[ka+4>>2]=-1073741824;ka=ma+88|0;c[ka>>2]=512;c[ka+4>>2]=4128768;ka=ma+96|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+104|0;c[ka>>2]=1;c[ka+4>>2]=0;ka=ma+112|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+120|0;c[ka>>2]=525824;c[ka+4>>2]=4849664;ka=ma+128|0;c[ka>>2]=0;c[ka+4>>2]=524288;ka=ma+136|0;c[ka>>2]=1;c[ka+4>>2]=0;ka=ma+144|0;c[ka>>2]=0;c[ka+4>>2]=1048576;ka=ma+152|0;c[ka>>2]=0;c[ka+4>>2]=3407872;ka=ma+160|0;c[ka>>2]=0;c[ka+4>>2]=1048576;ka=ma+168|0;c[ka>>2]=1024;c[ka+4>>2]=0;ka=ma+176|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+184|0;c[ka>>2]=1;c[ka+4>>2]=4194304;ka=ma+192|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+200|0;c[ka>>2]=513;c[ka+4>>2]=0;ka=ma+208|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+216|0;c[ka>>2]=1024;c[ka+4>>2]=4849664;ka=ma+224|0;c[ka>>2]=0;c[ka+4>>2]=1073741824;ka=ma+232|0;c[ka>>2]=1024;c[ka+4>>2]=0;ka=ma+240|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+248|0;c[ka>>2]=512;c[ka+4>>2]=4784128;ka=ma+256|0;c[ka>>2]=0;c[ka+4>>2]=524288;ka=ma+264|0;c[ka>>2]=512;c[ka+4>>2]=0;ka=ma+272|0;c[ka>>2]=0;c[ka+4>>2]=1073741824;ka=ma+280|0;c[ka>>2]=0;c[ka+4>>2]=4063232;ka=ma+288|0;c[ka>>2]=0;c[ka+4>>2]=1074790400;ka=ma+296|0;c[ka>>2]=0;c[ka+4>>2]=0;ka=ma+304|0;c[ka>>2]=0;c[ka+4>>2]=524288;ka=ma+312|0;c[ka>>2]=0;c[ka+4>>2]=3342336;c[12067]=0;c[12068]=0;c[12069]=0;ka=Jm(320)|0;ia=ka;c[12068]=ia;c[12067]=ia;c[12069]=ka+320;ka=ma+320|0;ma=la;la=ia;do{if((la|0)==0){nc=0}else{ia=c[ma+4>>2]|0;c[la>>2]=c[ma>>2];c[la+4>>2]=ia;nc=c[12068]|0}la=nc+8|0;c[12068]=la;ma=ma+8|0;}while((ma|0)!=(ka|0));ka=na|0;c[ka>>2]=0;c[ka+4>>2]=0;ma=na+8|0;c[ma>>2]=2;c[ma+4>>2]=0;ma=na+16|0;c[ma>>2]=0;c[ma+4>>2]=-2147483648;ma=na+24|0;c[ma>>2]=1025;c[ma+4>>2]=4194304;ma=na+32|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+40|0;c[ma>>2]=2;c[ma+4>>2]=0;ma=na+48|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+56|0;c[ma>>2]=1051648;c[ma+4>>2]=4915200;ma=na+64|0;c[ma>>2]=0;c[ma+4>>2]=2097152;ma=na+72|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+80|0;c[ma>>2]=0;c[ma+4>>2]=-2147483648;ma=na+88|0;c[ma>>2]=1025;c[ma+4>>2]=4194304;ma=na+96|0;c[ma>>2]=0;c[ma+4>>2]=2097152;ma=na+104|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+112|0;c[ma>>2]=0;c[ma+4>>2]=-2145910784;ma=na+120|0;c[ma>>2]=0;c[ma+4>>2]=3407872;ma=na+128|0;c[ma>>2]=0;c[ma+4>>2]=1048576;ma=na+136|0;c[ma>>2]=2;c[ma+4>>2]=0;ma=na+144|0;c[ma>>2]=0;c[ma+4>>2]=2097152;ma=na+152|0;c[ma>>2]=0;c[ma+4>>2]=3473408;ma=na+160|0;c[ma>>2]=0;c[ma+4>>2]=-2145386496;ma=na+168|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+176|0;c[ma>>2]=0;c[ma+4>>2]=1048576;ma=na+184|0;c[ma>>2]=0;c[ma+4>>2]=3407872;ma=na+192|0;c[ma>>2]=0;c[ma+4>>2]=1048576;ma=na+200|0;c[ma>>2]=1024;c[ma+4>>2]=0;ma=na+208|0;c[ma>>2]=0;c[ma+4>>2]=-2147483648;ma=na+216|0;c[ma>>2]=0;c[ma+4>>2]=4128768;ma=na+224|0;c[ma>>2]=0;c[ma+4>>2]=-2147483648;ma=na+232|0;c[ma>>2]=2048;c[ma+4>>2]=0;ma=na+240|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+248|0;c[ma>>2]=1024;c[ma+4>>2]=4849664;ma=na+256|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+264|0;c[ma>>2]=1026;c[ma+4>>2]=0;ma=na+272|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+280|0;c[ma>>2]=2048;c[ma+4>>2]=4915200;ma=na+288|0;c[ma>>2]=0;c[ma+4>>2]=2097152;ma=na+296|0;c[ma>>2]=2048;c[ma+4>>2]=0;ma=na+304|0;c[ma>>2]=0;c[ma+4>>2]=0;ma=na+312|0;c[ma>>2]=2;c[ma+4>>2]=4259840;c[12070]=0;c[12071]=0;c[12072]=0;ma=Jm(320)|0;la=ma;c[12071]=la;c[12070]=la;c[12072]=ma+320;ma=na+320|0;na=ka;ka=la;do{if((ka|0)==0){oc=0}else{la=c[na+4>>2]|0;c[ka>>2]=c[na>>2];c[ka+4>>2]=la;oc=c[12071]|0}ka=oc+8|0;c[12071]=ka;na=na+8|0;}while((na|0)!=(ma|0));ma=oa|0;c[ma>>2]=0;c[ma+4>>2]=4194304;na=oa+8|0;c[na>>2]=1;c[na+4>>2]=0;na=oa+16|0;c[na>>2]=0;c[na+4>>2]=2097152;na=oa+24|0;c[na>>2]=0;c[na+4>>2]=3473408;na=oa+32|0;c[na>>2]=0;c[na+4>>2]=2097152;na=oa+40|0;c[na>>2]=4;c[na+4>>2]=0;na=oa+48|0;c[na>>2]=0;c[na+4>>2]=4194304;na=oa+56|0;c[na>>2]=0;c[na+4>>2]=3538944;na=oa+64|0;c[na>>2]=0;c[na+4>>2]=4194304;na=oa+72|0;c[na>>2]=4096;c[na+4>>2]=0;na=oa+80|0;c[na>>2]=0;c[na+4>>2]=0;na=oa+88|0;c[na>>2]=4;c[na+4>>2]=4325376;na=oa+96|0;c[na>>2]=0;c[na+4>>2]=0;na=oa+104|0;c[na>>2]=2052;c[na+4>>2]=0;na=oa+112|0;c[na>>2]=0;c[na+4>>2]=0;na=oa+120|0;c[na>>2]=4096;c[na+4>>2]=4980736;na=oa+128|0;c[na>>2]=0;c[na+4>>2]=0;na=oa+136|0;c[na>>2]=4097;c[na+4>>2]=0;na=oa+144|0;c[na>>2]=0;c[na+4>>2]=0;na=oa+152|0;c[na>>2]=2048;c[na+4>>2]=4915200;na=oa+160|0;c[na>>2]=0;c[na+4>>2]=2097152;na=oa+168|0;c[na>>2]=2048;c[na+4>>2]=0;na=oa+176|0;c[na>>2]=0;c[na+4>>2]=0;na=oa+184|0;c[na>>2]=1;c[na+4>>2]=4194304;c[12073]=0;c[12074]=0;c[12075]=0;na=Jm(192)|0;ka=na;c[12074]=ka;c[12073]=ka;c[12075]=na+192;na=oa+192|0;oa=ma;ma=ka;do{if((ma|0)==0){pc=0}else{ka=c[oa+4>>2]|0;c[ma>>2]=c[oa>>2];c[ma+4>>2]=ka;pc=c[12074]|0}ma=pc+8|0;c[12074]=ma;oa=oa+8|0;}while((oa|0)!=(na|0));na=pa|0;c[na>>2]=0;c[na+4>>2]=8388608;oa=pa+8|0;c[oa>>2]=2;c[oa+4>>2]=0;oa=pa+16|0;c[oa>>2]=0;c[oa+4>>2]=4194304;oa=pa+24|0;c[oa>>2]=0;c[oa+4>>2]=3538944;oa=pa+32|0;c[oa>>2]=0;c[oa+4>>2]=4194304;oa=pa+40|0;c[oa>>2]=4096;c[oa+4>>2]=0;oa=pa+48|0;c[oa>>2]=0;c[oa+4>>2]=0;oa=pa+56|0;c[oa>>2]=2;c[oa+4>>2]=4259840;oa=pa+64|0;c[oa>>2]=0;c[oa+4>>2]=0;oa=pa+72|0;c[oa>>2]=8194;c[oa+4>>2]=0;oa=pa+80|0;c[oa>>2]=0;c[oa+4>>2]=0;oa=pa+88|0;c[oa>>2]=4096;c[oa+4>>2]=4980736;oa=pa+96|0;c[oa>>2]=0;c[oa+4>>2]=0;oa=pa+104|0;c[oa>>2]=4104;c[oa+4>>2]=0;oa=pa+112|0;c[oa>>2]=0;c[oa+4>>2]=0;oa=pa+120|0;c[oa>>2]=8192;c[oa+4>>2]=5046272;oa=pa+128|0;c[oa>>2]=0;c[oa+4>>2]=8388608;oa=pa+136|0;c[oa>>2]=8192;c[oa+4>>2]=0;oa=pa+144|0;c[oa>>2]=0;c[oa+4>>2]=0;oa=pa+152|0;c[oa>>2]=8;c[oa+4>>2]=4390912;oa=pa+160|0;c[oa>>2]=0;c[oa+4>>2]=4194304;oa=pa+168|0;c[oa>>2]=8;c[oa+4>>2]=0;oa=pa+176|0;c[oa>>2]=0;c[oa+4>>2]=8388608;oa=pa+184|0;c[oa>>2]=0;c[oa+4>>2]=3604480;c[12076]=0;c[12077]=0;c[12078]=0;oa=Jm(192)|0;ma=oa;c[12077]=ma;c[12076]=ma;c[12078]=oa+192;oa=pa+192|0;pa=na;na=ma;do{if((na|0)==0){qc=0}else{ma=c[pa+4>>2]|0;c[na>>2]=c[pa>>2];c[na+4>>2]=ma;qc=c[12077]|0}na=qc+8|0;c[12077]=na;pa=pa+8|0;}while((pa|0)!=(oa|0));oa=qa|0;c[oa>>2]=0;c[oa+4>>2]=0;pa=qa+8|0;c[pa>>2]=8208;c[pa+4>>2]=0;pa=qa+16|0;c[pa>>2]=0;c[pa+4>>2]=0;pa=qa+24|0;c[pa>>2]=16384;c[pa+4>>2]=5111808;pa=qa+32|0;c[pa>>2]=0;c[pa+4>>2]=0;pa=qa+40|0;c[pa>>2]=16388;c[pa+4>>2]=0;pa=qa+48|0;c[pa>>2]=0;c[pa+4>>2]=0;pa=qa+56|0;c[pa>>2]=8192;c[pa+4>>2]=5046272;pa=qa+64|0;c[pa>>2]=0;c[pa+4>>2]=8388608;pa=qa+72|0;c[pa>>2]=8192;c[pa+4>>2]=0;pa=qa+80|0;c[pa>>2]=0;c[pa+4>>2]=0;pa=qa+88|0;c[pa>>2]=4;c[pa+4>>2]=4325376;pa=qa+96|0;c[pa>>2]=0;c[pa+4>>2]=16777216;pa=qa+104|0;c[pa>>2]=4;c[pa+4>>2]=0;pa=qa+112|0;c[pa>>2]=0;c[pa+4>>2]=8388608;pa=qa+120|0;c[pa>>2]=0;c[pa+4>>2]=3604480;pa=qa+128|0;c[pa>>2]=0;c[pa+4>>2]=8388608;pa=qa+136|0;c[pa>>2]=16;c[pa+4>>2]=0;pa=qa+144|0;c[pa>>2]=0;c[pa+4>>2]=16777216;pa=qa+152|0;c[pa>>2]=0;c[pa+4>>2]=3670016;pa=qa+160|0;c[pa>>2]=0;c[pa+4>>2]=16777216;pa=qa+168|0;c[pa>>2]=16384;c[pa+4>>2]=0;pa=qa+176|0;c[pa>>2]=0;c[pa+4>>2]=0;pa=qa+184|0;c[pa>>2]=16;c[pa+4>>2]=4456448;c[12079]=0;c[12080]=0;c[12081]=0;pa=Jm(192)|0;na=pa;c[12080]=na;c[12079]=na;c[12081]=pa+192;pa=qa+192|0;qa=oa;oa=na;do{if((oa|0)==0){rc=0}else{na=c[qa+4>>2]|0;c[oa>>2]=c[qa>>2];c[oa+4>>2]=na;rc=c[12080]|0}oa=rc+8|0;c[12080]=oa;qa=qa+8|0;}while((qa|0)!=(pa|0));pa=ra|0;c[pa>>2]=0;c[pa+4>>2]=16777216;qa=ra+8|0;c[qa>>2]=32;c[qa+4>>2]=0;qa=ra+16|0;c[qa>>2]=0;c[qa+4>>2]=33554432;qa=ra+24|0;c[qa>>2]=0;c[qa+4>>2]=3735552;qa=ra+32|0;c[qa>>2]=0;c[qa+4>>2]=33554432;qa=ra+40|0;c[qa>>2]=8;c[qa+4>>2]=0;qa=ra+48|0;c[qa>>2]=0;c[qa+4>>2]=16777216;qa=ra+56|0;c[qa>>2]=0;c[qa+4>>2]=3670016;qa=ra+64|0;c[qa>>2]=0;c[qa+4>>2]=16777216;qa=ra+72|0;c[qa>>2]=16384;c[qa+4>>2]=0;qa=ra+80|0;c[qa>>2]=0;c[qa+4>>2]=0;qa=ra+88|0;c[qa>>2]=8;c[qa+4>>2]=4390912;qa=ra+96|0;c[qa>>2]=0;c[qa+4>>2]=0;qa=ra+104|0;c[qa>>2]=32776;c[qa+4>>2]=0;qa=ra+112|0;c[qa>>2]=0;c[qa+4>>2]=0;qa=ra+120|0;c[qa>>2]=16384;c[qa+4>>2]=5111808;qa=ra+128|0;c[qa>>2]=0;c[qa+4>>2]=0;qa=ra+136|0;c[qa>>2]=16416;c[qa+4>>2]=0;qa=ra+144|0;c[qa>>2]=0;c[qa+4>>2]=0;qa=ra+152|0;c[qa>>2]=32768;c[qa+4>>2]=5177344;qa=ra+160|0;c[qa>>2]=0;c[qa+4>>2]=33554432;qa=ra+168|0;c[qa>>2]=32768;c[qa+4>>2]=0;qa=ra+176|0;c[qa>>2]=0;c[qa+4>>2]=0;qa=ra+184|0;c[qa>>2]=32;c[qa+4>>2]=4521984;c[12082]=0;c[12083]=0;c[12084]=0;qa=Jm(192)|0;oa=qa;c[12083]=oa;c[12082]=oa;c[12084]=qa+192;qa=ra+192|0;ra=pa;pa=oa;do{if((pa|0)==0){sc=0}else{oa=c[ra+4>>2]|0;c[pa>>2]=c[ra>>2];c[pa+4>>2]=oa;sc=c[12083]|0}pa=sc+8|0;c[12083]=pa;ra=ra+8|0;}while((ra|0)!=(qa|0));qa=sa|0;c[qa>>2]=0;c[qa+4>>2]=67108864;ra=sa+8|0;c[ra>>2]=16;c[ra+4>>2]=0;ra=sa+16|0;c[ra>>2]=0;c[ra+4>>2]=33554432;ra=sa+24|0;c[ra>>2]=0;c[ra+4>>2]=3735552;ra=sa+32|0;c[ra>>2]=0;c[ra+4>>2]=33554432;ra=sa+40|0;c[ra>>2]=64;c[ra+4>>2]=0;ra=sa+48|0;c[ra>>2]=0;c[ra+4>>2]=67108864;ra=sa+56|0;c[ra>>2]=0;c[ra+4>>2]=3801088;ra=sa+64|0;c[ra>>2]=0;c[ra+4>>2]=67108864;ra=sa+72|0;c[ra>>2]=65536;c[ra+4>>2]=0;ra=sa+80|0;c[ra>>2]=0;c[ra+4>>2]=0;ra=sa+88|0;c[ra>>2]=64;c[ra+4>>2]=4587520;ra=sa+96|0;c[ra>>2]=0;c[ra+4>>2]=0;ra=sa+104|0;c[ra>>2]=32832;c[ra+4>>2]=0;ra=sa+112|0;c[ra>>2]=0;c[ra+4>>2]=0;ra=sa+120|0;c[ra>>2]=65536;c[ra+4>>2]=5242880;ra=sa+128|0;c[ra>>2]=0;c[ra+4>>2]=0;ra=sa+136|0;c[ra>>2]=65552;c[ra+4>>2]=0;ra=sa+144|0;c[ra>>2]=0;c[ra+4>>2]=0;ra=sa+152|0;c[ra>>2]=32768;c[ra+4>>2]=5177344;ra=sa+160|0;c[ra>>2]=0;c[ra+4>>2]=33554432;ra=sa+168|0;c[ra>>2]=32768;c[ra+4>>2]=0;ra=sa+176|0;c[ra>>2]=0;c[ra+4>>2]=0;ra=sa+184|0;c[ra>>2]=16;c[ra+4>>2]=4456448;c[12085]=0;c[12086]=0;c[12087]=0;ra=Jm(192)|0;pa=ra;c[12086]=pa;c[12085]=pa;c[12087]=ra+192;ra=sa+192|0;sa=qa;qa=pa;do{if((qa|0)==0){tc=0}else{pa=c[sa+4>>2]|0;c[qa>>2]=c[sa>>2];c[qa+4>>2]=pa;tc=c[12086]|0}qa=tc+8|0;c[12086]=qa;sa=sa+8|0;}while((sa|0)!=(ra|0));ra=ta|0;c[ra>>2]=0;c[ra+4>>2]=0;sa=ta+8|0;c[sa>>2]=32;c[sa+4>>2]=0;sa=ta+16|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+24|0;c[sa>>2]=131264;c[sa+4>>2]=4587520;sa=ta+32|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+40|0;c[sa>>2]=32;c[sa+4>>2]=0;sa=ta+48|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+56|0;c[sa>>2]=67305472;c[sa+4>>2]=5242880;sa=ta+64|0;c[sa>>2]=0;c[sa+4>>2]=67108864;sa=ta+88|0;bn(ta+72|0,0,16)|0;c[sa>>2]=131264;c[sa+4>>2]=4587520;sa=ta+96|0;c[sa>>2]=0;c[sa+4>>2]=67108864;sa=ta+104|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+112|0;c[sa>>2]=0;c[sa+4>>2]=402653184;sa=ta+120|0;c[sa>>2]=128;c[sa+4>>2]=3866624;sa=ta+128|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+136|0;c[sa>>2]=131104;c[sa+4>>2]=0;sa=ta+144|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+152|0;c[sa>>2]=65536;c[sa+4>>2]=5242880;sa=ta+160|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+168|0;c[sa>>2]=65664;c[sa+4>>2]=0;sa=ta+176|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+184|0;c[sa>>2]=131072;c[sa+4>>2]=5308416;sa=ta+192|0;c[sa>>2]=0;c[sa+4>>2]=134217728;sa=ta+200|0;c[sa>>2]=131072;c[sa+4>>2]=0;sa=ta+208|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+216|0;c[sa>>2]=128;c[sa+4>>2]=4653056;sa=ta+224|0;c[sa>>2]=0;c[sa+4>>2]=67108864;sa=ta+232|0;c[sa>>2]=128;c[sa+4>>2]=0;sa=ta+240|0;c[sa>>2]=0;c[sa+4>>2]=134217728;sa=ta+248|0;c[sa>>2]=0;c[sa+4>>2]=3866624;sa=ta+256|0;c[sa>>2]=0;c[sa+4>>2]=134217728;sa=ta+264|0;c[sa>>2]=32;c[sa+4>>2]=0;sa=ta+272|0;c[sa>>2]=0;c[sa+4>>2]=67108864;sa=ta+280|0;c[sa>>2]=0;c[sa+4>>2]=3801088;sa=ta+288|0;c[sa>>2]=0;c[sa+4>>2]=67108864;sa=ta+296|0;c[sa>>2]=65536;c[sa+4>>2]=0;sa=ta+304|0;c[sa>>2]=0;c[sa+4>>2]=0;sa=ta+312|0;c[sa>>2]=32;c[sa+4>>2]=4521984;c[12088]=0;c[12089]=0;c[12090]=0;sa=Jm(320)|0;qa=sa;c[12089]=qa;c[12088]=qa;c[12090]=sa+320;sa=ta+320|0;ta=ra;ra=qa;do{if((ra|0)==0){uc=0}else{qa=c[ta+4>>2]|0;c[ra>>2]=c[ta>>2];c[ra+4>>2]=qa;uc=c[12089]|0}ra=uc+8|0;c[12089]=ra;ta=ta+8|0;}while((ta|0)!=(sa|0));sa=ua|0;c[sa>>2]=0;c[sa+4>>2]=0;ta=ua+8|0;c[ta>>2]=64;c[ta+4>>2]=0;ta=ua+16|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+24|0;c[ta>>2]=262528;c[ta+4>>2]=4653056;ta=ua+32|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+40|0;c[ta>>2]=64;c[ta+4>>2]=0;ta=ua+48|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+56|0;c[ta>>2]=134610944;c[ta+4>>2]=5308416;ta=ua+64|0;c[ta>>2]=0;c[ta+4>>2]=134217728;ta=ua+88|0;bn(ua+72|0,0,16)|0;c[ta>>2]=262528;c[ta+4>>2]=4653056;ta=ua+96|0;c[ta>>2]=0;c[ta+4>>2]=134217728;ta=ua+104|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+112|0;c[ta>>2]=0;c[ta+4>>2]=805306368;ta=ua+120|0;c[ta>>2]=256;c[ta+4>>2]=3932160;ta=ua+128|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+136|0;c[ta>>2]=262208;c[ta+4>>2]=0;ta=ua+144|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+152|0;c[ta>>2]=131072;c[ta+4>>2]=5308416;ta=ua+160|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+168|0;c[ta>>2]=131328;c[ta+4>>2]=0;ta=ua+176|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+184|0;c[ta>>2]=262144;c[ta+4>>2]=5373952;ta=ua+192|0;c[ta>>2]=0;c[ta+4>>2]=268435456;ta=ua+200|0;c[ta>>2]=262144;c[ta+4>>2]=0;ta=ua+208|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+216|0;c[ta>>2]=256;c[ta+4>>2]=4718592;ta=ua+224|0;c[ta>>2]=0;c[ta+4>>2]=134217728;ta=ua+232|0;c[ta>>2]=256;c[ta+4>>2]=0;ta=ua+240|0;c[ta>>2]=0;c[ta+4>>2]=268435456;ta=ua+248|0;c[ta>>2]=0;c[ta+4>>2]=3932160;ta=ua+256|0;c[ta>>2]=0;c[ta+4>>2]=268435456;ta=ua+264|0;c[ta>>2]=64;c[ta+4>>2]=0;ta=ua+272|0;c[ta>>2]=0;c[ta+4>>2]=134217728;ta=ua+280|0;c[ta>>2]=0;c[ta+4>>2]=3866624;ta=ua+288|0;c[ta>>2]=0;c[ta+4>>2]=134217728;ta=ua+296|0;c[ta>>2]=131072;c[ta+4>>2]=0;ta=ua+304|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=ua+312|0;c[ta>>2]=64;c[ta+4>>2]=4587520;c[12091]=0;c[12092]=0;c[12093]=0;ta=Jm(320)|0;ra=ta;c[12092]=ra;c[12091]=ra;c[12093]=ta+320;ta=ua+320|0;ua=sa;sa=ra;do{if((sa|0)==0){vc=0}else{ra=c[ua+4>>2]|0;c[sa>>2]=c[ua>>2];c[sa+4>>2]=ra;vc=c[12092]|0}sa=vc+8|0;c[12092]=sa;ua=ua+8|0;}while((ua|0)!=(ta|0));ta=va|0;c[ta>>2]=0;c[ta+4>>2]=268435456;ta=va+8|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=va+16|0;c[ta>>2]=0;c[ta+4>>2]=536870912;ta=va+24|0;c[ta>>2]=0;c[ta+4>>2]=3997696;ta=va+32|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=va+40|0;c[ta>>2]=128;c[ta+4>>2]=0;ta=va+48|0;c[ta>>2]=0;c[ta+4>>2]=0;ta=va+56|0;c[ta>>2]=262144;c[ta+4>>2]=5373952;c[12094]=0;c[12095]=0;c[12096]=0;ta=Jm(64)|0;ua=ta;c[12095]=ua;c[12094]=ua;c[12096]=ta+64;if((ta|0)==0){wc=0}else{c[ua>>2]=0;c[ua+4>>2]=268435456;wc=ua}ua=wc+8|0;c[12095]=ua;c[ua>>2]=0;c[ua+4>>2]=0;ua=(c[12095]|0)+8|0;c[12095]=ua;c[ua>>2]=0;c[ua+4>>2]=536870912;ua=(c[12095]|0)+8|0;c[12095]=ua;c[ua>>2]=0;c[ua+4>>2]=3997696;ua=(c[12095]|0)+8|0;c[12095]=ua;c[ua>>2]=0;c[ua+4>>2]=0;ua=(c[12095]|0)+8|0;c[12095]=ua;c[ua>>2]=128;c[ua+4>>2]=0;ua=(c[12095]|0)+8|0;c[12095]=ua;wc=va+48|0;ta=c[wc+4>>2]|0;c[ua>>2]=c[wc>>2];c[ua+4>>2]=ta;ta=(c[12095]|0)+8|0;c[12095]=ta;ua=va+56|0;va=c[ua+4>>2]|0;c[ta>>2]=c[ua>>2];c[ta+4>>2]=va;c[12095]=(c[12095]|0)+8;va=wa|0;c[va>>2]=0;c[va+4>>2]=-2147483648;va=wa+8|0;c[va>>2]=0;c[va+4>>2]=0;va=wa+16|0;c[va>>2]=0;c[va+4>>2]=1073741824;va=wa+24|0;c[va>>2]=0;c[va+4>>2]=4063232;va=wa+32|0;c[va>>2]=0;c[va+4>>2]=0;va=wa+40|0;c[va>>2]=1024;c[va+4>>2]=0;va=wa+48|0;c[va>>2]=0;c[va+4>>2]=0;va=wa+56|0;c[va>>2]=524288;c[va+4>>2]=5439488;c[12097]=0;c[12098]=0;c[12099]=0;va=Jm(64)|0;ta=va;c[12098]=ta;c[12097]=ta;c[12099]=va+64;if((va|0)==0){xc=0}else{c[ta>>2]=0;c[ta+4>>2]=-2147483648;xc=ta}ta=xc+8|0;c[12098]=ta;c[ta>>2]=0;c[ta+4>>2]=0;ta=(c[12098]|0)+8|0;c[12098]=ta;c[ta>>2]=0;c[ta+4>>2]=1073741824;ta=(c[12098]|0)+8|0;c[12098]=ta;c[ta>>2]=0;c[ta+4>>2]=4063232;ta=(c[12098]|0)+8|0;c[12098]=ta;c[ta>>2]=0;c[ta+4>>2]=0;ta=(c[12098]|0)+8|0;c[12098]=ta;c[ta>>2]=1024;c[ta+4>>2]=0;ta=(c[12098]|0)+8|0;c[12098]=ta;xc=wa+48|0;va=c[xc+4>>2]|0;c[ta>>2]=c[xc>>2];c[ta+4>>2]=va;va=(c[12098]|0)+8|0;c[12098]=va;ta=wa+56|0;wa=c[ta+4>>2]|0;c[va>>2]=c[ta>>2];c[va+4>>2]=wa;c[12098]=(c[12098]|0)+8;wa=xa|0;c[wa>>2]=0;c[wa+4>>2]=0;va=xa+8|0;c[va>>2]=1;c[va+4>>2]=0;va=xa+16|0;c[va>>2]=0;c[va+4>>2]=-1073741824;va=xa+24|0;c[va>>2]=512;c[va+4>>2]=4128768;va=xa+32|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+40|0;c[va>>2]=1;c[va+4>>2]=0;va=xa+48|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+56|0;c[va>>2]=525824;c[va+4>>2]=4849664;va=xa+64|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+72|0;c[va>>2]=2048;c[va+4>>2]=0;va=xa+80|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+88|0;c[va>>2]=270008320;c[va+4>>2]=5505024;va=xa+96|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+104|0;c[va>>2]=2048;c[va+4>>2]=0;va=xa+112|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+120|0;c[va>>2]=525824;c[va+4>>2]=4849664;va=xa+128|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+136|0;c[va>>2]=1049088;c[va+4>>2]=0;va=xa+144|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+152|0;c[va>>2]=524288;c[va+4>>2]=5439488;va=xa+160|0;c[va>>2]=0;c[va+4>>2]=-2147483648;va=xa+168|0;c[va>>2]=524288;c[va+4>>2]=0;va=xa+176|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+184|0;c[va>>2]=512;c[va+4>>2]=4784128;va=xa+192|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+200|0;c[va>>2]=513;c[va+4>>2]=0;va=xa+208|0;c[va>>2]=0;c[va+4>>2]=-2147483648;va=xa+216|0;c[va>>2]=0;c[va+4>>2]=4128768;va=xa+224|0;c[va>>2]=0;c[va+4>>2]=-2147483648;va=xa+232|0;c[va>>2]=2048;c[va+4>>2]=0;va=xa+240|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+248|0;c[va>>2]=1;c[va+4>>2]=4194304;va=xa+256|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+264|0;c[va>>2]=1048577;c[va+4>>2]=0;va=xa+272|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+280|0;c[va>>2]=2048;c[va+4>>2]=4915200;va=xa+288|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+296|0;c[va>>2]=526336;c[va+4>>2]=0;va=xa+304|0;c[va>>2]=0;c[va+4>>2]=0;va=xa+312|0;c[va>>2]=1048576;c[va+4>>2]=5505024;c[12100]=0;c[12101]=0;c[12102]=0;va=Jm(320)|0;ta=va;c[12101]=ta;c[12100]=ta;c[12102]=va+320;va=xa+320|0;xa=wa;wa=ta;do{if((wa|0)==0){yc=0}else{ta=c[xa+4>>2]|0;c[wa>>2]=c[xa>>2];c[wa+4>>2]=ta;yc=c[12101]|0}wa=yc+8|0;c[12101]=wa;xa=xa+8|0;}while((xa|0)!=(va|0));va=ya|0;c[va>>2]=0;c[va+4>>2]=0;xa=ya+8|0;c[xa>>2]=2;c[xa+4>>2]=0;xa=ya+16|0;c[xa>>2]=0;c[xa+4>>2]=-2147483648;xa=ya+24|0;c[xa>>2]=1025;c[xa+4>>2]=4194304;xa=ya+32|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+40|0;c[xa>>2]=2;c[xa+4>>2]=0;xa=ya+48|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+56|0;c[xa>>2]=1051648;c[xa+4>>2]=4915200;xa=ya+64|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+72|0;c[xa>>2]=4096;c[xa+4>>2]=0;xa=ya+80|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+88|0;c[xa>>2]=1613758464;c[xa+4>>2]=5570560;xa=ya+96|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+104|0;c[xa>>2]=4096;c[xa+4>>2]=0;xa=ya+112|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+120|0;c[xa>>2]=-1069547520;c[xa+4>>2]=5636096;xa=ya+128|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+136|0;c[xa>>2]=4096;c[xa+4>>2]=0;xa=ya+144|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+152|0;c[xa>>2]=1051648;c[xa+4>>2]=4915200;xa=ya+160|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+168|0;c[xa>>2]=2098176;c[xa+4>>2]=0;xa=ya+176|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+184|0;c[xa>>2]=1048576;c[xa+4>>2]=5505024;xa=ya+192|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+200|0;c[xa>>2]=1048577;c[xa+4>>2]=0;xa=ya+208|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+216|0;c[xa>>2]=1024;c[xa+4>>2]=4849664;xa=ya+224|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+232|0;c[xa>>2]=1026;c[xa+4>>2]=0;xa=ya+240|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+248|0;c[xa>>2]=1;c[xa+4>>2]=4194304;xa=ya+256|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+264|0;c[xa>>2]=4097;c[xa+4>>2]=0;xa=ya+272|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+280|0;c[xa>>2]=2;c[xa+4>>2]=4259840;xa=ya+288|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+296|0;c[xa>>2]=2097154;c[xa+4>>2]=0;xa=ya+304|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+312|0;c[xa>>2]=4096;c[xa+4>>2]=4980736;xa=ya+320|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+328|0;c[xa>>2]=1052672;c[xa+4>>2]=0;xa=ya+336|0;c[xa>>2]=0;c[xa+4>>2]=0;xa=ya+344|0;c[xa>>2]=2097152;c[xa+4>>2]=5570560;c[12103]=0;c[12104]=0;c[12105]=0;xa=Jm(352)|0;wa=xa;c[12104]=wa;c[12103]=wa;c[12105]=xa+352;xa=ya+352|0;ya=va;va=wa;do{if((va|0)==0){zc=0}else{wa=c[ya+4>>2]|0;c[va>>2]=c[ya>>2];c[va+4>>2]=wa;zc=c[12104]|0}va=zc+8|0;c[12104]=va;ya=ya+8|0;}while((ya|0)!=(xa|0));xa=za|0;c[xa>>2]=0;c[xa+4>>2]=0;ya=za+8|0;c[ya>>2]=2105344;c[ya+4>>2]=0;ya=za+16|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+24|0;c[ya>>2]=4194304;c[ya+4>>2]=5636096;ya=za+32|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+40|0;c[ya>>2]=4194308;c[ya+4>>2]=0;ya=za+48|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+56|0;c[ya>>2]=8192;c[ya+4>>2]=5046272;ya=za+64|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+72|0;c[ya>>2]=8194;c[ya+4>>2]=0;ya=za+80|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+88|0;c[ya>>2]=4;c[ya+4>>2]=4325376;ya=za+96|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+104|0;c[ya>>2]=2052;c[ya+4>>2]=0;ya=za+112|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+120|0;c[ya>>2]=2;c[ya+4>>2]=4259840;ya=za+128|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+136|0;c[ya>>2]=2097154;c[ya+4>>2]=0;ya=za+144|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+152|0;c[ya>>2]=2048;c[ya+4>>2]=4915200;ya=za+160|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+168|0;c[ya>>2]=4196352;c[ya+4>>2]=0;ya=za+176|0;c[ya>>2]=0;c[ya+4>>2]=0;ya=za+184|0;c[ya>>2]=2097152;c[ya+4>>2]=5570560;c[12106]=0;c[12107]=0;c[12108]=0;ya=Jm(192)|0;va=ya;c[12107]=va;c[12106]=va;c[12108]=ya+192;ya=za+192|0;za=xa;xa=va;do{if((xa|0)==0){Ac=0}else{va=c[za+4>>2]|0;c[xa>>2]=c[za>>2];c[xa+4>>2]=va;Ac=c[12107]|0}xa=Ac+8|0;c[12107]=xa;za=za+8|0;}while((za|0)!=(ya|0));ya=Aa|0;c[ya>>2]=0;c[ya+4>>2]=0;za=Aa+8|0;c[za>>2]=8392704;c[za+4>>2]=0;za=Aa+16|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+24|0;c[za>>2]=4194304;c[za+4>>2]=5636096;za=Aa+32|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+40|0;c[za>>2]=4194308;c[za+4>>2]=0;za=Aa+48|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+56|0;c[za>>2]=4096;c[za+4>>2]=4980736;za=Aa+64|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+72|0;c[za>>2]=4104;c[za+4>>2]=0;za=Aa+80|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+88|0;c[za>>2]=4;c[za+4>>2]=4325376;za=Aa+96|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+104|0;c[za>>2]=16388;c[za+4>>2]=0;za=Aa+112|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+120|0;c[za>>2]=8;c[za+4>>2]=4390912;za=Aa+128|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+136|0;c[za>>2]=8388616;c[za+4>>2]=0;za=Aa+144|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+152|0;c[za>>2]=16384;c[za+4>>2]=5111808;za=Aa+160|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+168|0;c[za>>2]=4210688;c[za+4>>2]=0;za=Aa+176|0;c[za>>2]=0;c[za+4>>2]=0;za=Aa+184|0;c[za>>2]=8388608;c[za+4>>2]=5701632;c[12109]=0;c[12110]=0;c[12111]=0;za=Jm(192)|0;xa=za;c[12110]=xa;c[12109]=xa;c[12111]=za+192;za=Aa+192|0;Aa=ya;ya=xa;do{if((ya|0)==0){Bc=0}else{xa=c[Aa+4>>2]|0;c[ya>>2]=c[Aa>>2];c[ya+4>>2]=xa;Bc=c[12110]|0}ya=Bc+8|0;c[12110]=ya;Aa=Aa+8|0;}while((Aa|0)!=(za|0));za=Ba|0;c[za>>2]=0;c[za+4>>2]=0;Aa=Ba+8|0;c[Aa>>2]=8208;c[Aa+4>>2]=0;Aa=Ba+16|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+24|0;c[Aa>>2]=8;c[Aa+4>>2]=4390912;Aa=Ba+32|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+40|0;c[Aa>>2]=8388616;c[Aa+4>>2]=0;Aa=Ba+48|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+56|0;c[Aa>>2]=8192;c[Aa+4>>2]=5046272;Aa=Ba+64|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+72|0;c[Aa>>2]=16785408;c[Aa+4>>2]=0;Aa=Ba+80|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+88|0;c[Aa>>2]=8388608;c[Aa+4>>2]=5701632;Aa=Ba+96|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+104|0;c[Aa>>2]=8421376;c[Aa+4>>2]=0;Aa=Ba+112|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+120|0;c[Aa>>2]=16777216;c[Aa+4>>2]=5767168;Aa=Ba+128|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+136|0;c[Aa>>2]=16777232;c[Aa+4>>2]=0;Aa=Ba+144|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+152|0;c[Aa>>2]=32768;c[Aa+4>>2]=5177344;Aa=Ba+160|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+168|0;c[Aa>>2]=32776;c[Aa+4>>2]=0;Aa=Ba+176|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Aa=Ba+184|0;c[Aa>>2]=16;c[Aa+4>>2]=4456448;c[12112]=0;c[12113]=0;c[12114]=0;Aa=Jm(192)|0;ya=Aa;c[12113]=ya;c[12112]=ya;c[12114]=Aa+192;Aa=Ba+192|0;Ba=za;za=ya;do{if((za|0)==0){Cc=0}else{ya=c[Ba+4>>2]|0;c[za>>2]=c[Ba>>2];c[za+4>>2]=ya;Cc=c[12113]|0}za=Cc+8|0;c[12113]=za;Ba=Ba+8|0;}while((Ba|0)!=(Aa|0));Aa=Ca|0;c[Aa>>2]=0;c[Aa+4>>2]=0;Ba=Ca+8|0;c[Ba>>2]=65552;c[Ba+4>>2]=0;Ba=Ca+16|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+24|0;c[Ba>>2]=32;c[Ba+4>>2]=4521984;Ba=Ca+32|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+40|0;c[Ba>>2]=33554464;c[Ba+4>>2]=0;Ba=Ca+48|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+56|0;c[Ba>>2]=65536;c[Ba+4>>2]=5242880;Ba=Ca+64|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+72|0;c[Ba>>2]=16842752;c[Ba+4>>2]=0;Ba=Ca+80|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+88|0;c[Ba>>2]=33554432;c[Ba+4>>2]=5832704;Ba=Ca+96|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+104|0;c[Ba>>2]=33570816;c[Ba+4>>2]=0;Ba=Ca+112|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+120|0;c[Ba>>2]=16777216;c[Ba+4>>2]=5767168;Ba=Ca+128|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+136|0;c[Ba>>2]=16777232;c[Ba+4>>2]=0;Ba=Ca+144|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+152|0;c[Ba>>2]=16384;c[Ba+4>>2]=5111808;Ba=Ca+160|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+168|0;c[Ba>>2]=16416;c[Ba+4>>2]=0;Ba=Ca+176|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ba=Ca+184|0;c[Ba>>2]=16;c[Ba+4>>2]=4456448;c[12115]=0;c[12116]=0;c[12117]=0;Ba=Jm(192)|0;za=Ba;c[12116]=za;c[12115]=za;c[12117]=Ba+192;Ba=Ca+192|0;Ca=Aa;Aa=za;do{if((Aa|0)==0){Dc=0}else{za=c[Ca+4>>2]|0;c[Aa>>2]=c[Ca>>2];c[Aa+4>>2]=za;Dc=c[12116]|0}Aa=Dc+8|0;c[12116]=Aa;Ca=Ca+8|0;}while((Ca|0)!=(Ba|0));Ba=Da|0;c[Ba>>2]=0;c[Ba+4>>2]=0;Ca=Da+8|0;c[Ca>>2]=32;c[Ca+4>>2]=0;Ca=Da+16|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+24|0;c[Ca>>2]=131264;c[Ca+4>>2]=4587520;Ca=Da+32|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+40|0;c[Ca>>2]=32;c[Ca+4>>2]=0;Ca=Da+48|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+56|0;c[Ca>>2]=67305472;c[Ca+4>>2]=5242880;Ca=Da+64|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+72|0;c[Ca>>2]=32768;c[Ca+4>>2]=0;Ca=Da+80|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+88|0;c[Ca>>2]=67305472;c[Ca+4>>2]=5242880;Ca=Da+96|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+104|0;c[Ca>>2]=32768;c[Ca+4>>2]=0;Ca=Da+112|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+120|0;c[Ca>>2]=100663296;c[Ca+4>>2]=5832710;Ca=Da+128|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+136|0;c[Ca>>2]=32768;c[Ca+4>>2]=0;Ca=Da+144|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+152|0;c[Ca>>2]=16777216;c[Ca+4>>2]=5767171;Ca=Da+160|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+168|0;c[Ca>>2]=131104;c[Ca+4>>2]=0;Ca=Da+176|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+184|0;c[Ca>>2]=64;c[Ca+4>>2]=4587520;Ca=Da+192|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+200|0;c[Ca>>2]=67108928;c[Ca+4>>2]=0;Ca=Da+208|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+216|0;c[Ca>>2]=131072;c[Ca+4>>2]=5308416;Ca=Da+224|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+232|0;c[Ca>>2]=33685504;c[Ca+4>>2]=0;Ca=Da+240|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+248|0;c[Ca>>2]=67108864;c[Ca+4>>2]=5898240;Ca=Da+256|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+264|0;c[Ca>>2]=67141632;c[Ca+4>>2]=0;Ca=Da+272|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+280|0;c[Ca>>2]=33554432;c[Ca+4>>2]=5832704;Ca=Da+288|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+296|0;c[Ca>>2]=33554464;c[Ca+4>>2]=0;Ca=Da+304|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+312|0;c[Ca>>2]=32768;c[Ca+4>>2]=5177344;Ca=Da+320|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+328|0;c[Ca>>2]=32832;c[Ca+4>>2]=0;Ca=Da+336|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Ca=Da+344|0;c[Ca>>2]=32;c[Ca+4>>2]=4521984;c[12118]=0;c[12119]=0;c[12120]=0;Ca=Jm(352)|0;Aa=Ca;c[12119]=Aa;c[12118]=Aa;c[12120]=Ca+352;Ca=Da+352|0;Da=Ba;Ba=Aa;do{if((Ba|0)==0){Ec=0}else{Aa=c[Da+4>>2]|0;c[Ba>>2]=c[Da>>2];c[Ba+4>>2]=Aa;Ec=c[12119]|0}Ba=Ec+8|0;c[12119]=Ba;Da=Da+8|0;}while((Da|0)!=(Ca|0));Ca=Ea|0;c[Ca>>2]=0;c[Ca+4>>2]=0;Da=Ea+8|0;c[Da>>2]=64;c[Da+4>>2]=0;Da=Ea+16|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+24|0;c[Da>>2]=262528;c[Da+4>>2]=4653056;Da=Ea+32|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+40|0;c[Da>>2]=64;c[Da+4>>2]=0;Da=Ea+48|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+56|0;c[Da>>2]=134610944;c[Da+4>>2]=5308416;Da=Ea+64|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+72|0;c[Da>>2]=65536;c[Da+4>>2]=0;Da=Ea+80|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+88|0;c[Da>>2]=134610944;c[Da+4>>2]=5308416;Da=Ea+96|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+104|0;c[Da>>2]=65536;c[Da+4>>2]=0;Da=Ea+112|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+120|0;c[Da>>2]=201326592;c[Da+4>>2]=5898248;Da=Ea+128|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+136|0;c[Da>>2]=262208;c[Da+4>>2]=0;Da=Ea+144|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+152|0;c[Da>>2]=128;c[Da+4>>2]=4653056;Da=Ea+160|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+168|0;c[Da>>2]=134217856;c[Da+4>>2]=0;Da=Ea+176|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+184|0;c[Da>>2]=262144;c[Da+4>>2]=5373952;Da=Ea+192|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+200|0;c[Da>>2]=67371008;c[Da+4>>2]=0;Da=Ea+208|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+216|0;c[Da>>2]=134217728;c[Da+4>>2]=5963776;Da=Ea+224|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+232|0;c[Da>>2]=134283264;c[Da+4>>2]=0;Da=Ea+240|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+248|0;c[Da>>2]=67108864;c[Da+4>>2]=5898240;Da=Ea+256|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+264|0;c[Da>>2]=67108928;c[Da+4>>2]=0;Da=Ea+272|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+280|0;c[Da>>2]=65536;c[Da+4>>2]=5242880;Da=Ea+288|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+296|0;c[Da>>2]=65664;c[Da+4>>2]=0;Da=Ea+304|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Ea+312|0;c[Da>>2]=64;c[Da+4>>2]=4587520;c[12121]=0;c[12122]=0;c[12123]=0;Da=Jm(320)|0;Ba=Da;c[12122]=Ba;c[12121]=Ba;c[12123]=Da+320;Da=Ea+320|0;Ea=Ca;Ca=Ba;do{if((Ca|0)==0){Fc=0}else{Ba=c[Ea+4>>2]|0;c[Ca>>2]=c[Ea>>2];c[Ca+4>>2]=Ba;Fc=c[12122]|0}Ca=Fc+8|0;c[12122]=Ca;Ea=Ea+8|0;}while((Ea|0)!=(Da|0));Da=Fa|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Fa+8|0;c[Da>>2]=131072;c[Da+4>>2]=0;Da=Fa+16|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Fa+24|0;c[Da>>2]=134217728;c[Da+4>>2]=5963776;Da=Fa+32|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Fa+40|0;c[Da>>2]=128;c[Da+4>>2]=0;Da=Fa+48|0;c[Da>>2]=0;c[Da+4>>2]=0;Da=Fa+56|0;c[Da>>2]=256;c[Da+4>>2]=4718592;c[12124]=0;c[12125]=0;c[12126]=0;Da=Jm(64)|0;Ea=Da;c[12125]=Ea;c[12124]=Ea;c[12126]=Da+64;if((Da|0)==0){Gc=0}else{c[Ea>>2]=0;c[Ea+4>>2]=0;Gc=Ea}Ea=Gc+8|0;c[12125]=Ea;c[Ea>>2]=131072;c[Ea+4>>2]=0;Ea=(c[12125]|0)+8|0;c[12125]=Ea;c[Ea>>2]=0;c[Ea+4>>2]=0;Ea=(c[12125]|0)+8|0;c[12125]=Ea;c[Ea>>2]=134217728;c[Ea+4>>2]=5963776;Ea=(c[12125]|0)+8|0;c[12125]=Ea;c[Ea>>2]=0;c[Ea+4>>2]=0;Ea=(c[12125]|0)+8|0;c[12125]=Ea;c[Ea>>2]=128;c[Ea+4>>2]=0;Ea=(c[12125]|0)+8|0;c[12125]=Ea;Gc=Fa+48|0;Da=c[Gc+4>>2]|0;c[Ea>>2]=c[Gc>>2];c[Ea+4>>2]=Da;Da=(c[12125]|0)+8|0;c[12125]=Da;Ea=Fa+56|0;Fa=c[Ea+4>>2]|0;c[Da>>2]=c[Ea>>2];c[Da+4>>2]=Fa;c[12125]=(c[12125]|0)+8;Fa=Ga|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ga+8|0;c[Fa>>2]=1024;c[Fa+4>>2]=0;Fa=Ga+16|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ga+24|0;c[Fa>>2]=512;c[Fa+4>>2]=4784128;Fa=Ga+32|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ga+40|0;c[Fa>>2]=1048576;c[Fa+4>>2]=0;Fa=Ga+48|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ga+56|0;c[Fa>>2]=268435456;c[Fa+4>>2]=6029312;c[12127]=0;c[12128]=0;c[12129]=0;Fa=Jm(64)|0;Da=Fa;c[12128]=Da;c[12127]=Da;c[12129]=Fa+64;if((Fa|0)==0){Hc=0}else{c[Da>>2]=0;c[Da+4>>2]=0;Hc=Da}Da=Hc+8|0;c[12128]=Da;c[Da>>2]=1024;c[Da+4>>2]=0;Da=(c[12128]|0)+8|0;c[12128]=Da;c[Da>>2]=0;c[Da+4>>2]=0;Da=(c[12128]|0)+8|0;c[12128]=Da;c[Da>>2]=512;c[Da+4>>2]=4784128;Da=(c[12128]|0)+8|0;c[12128]=Da;c[Da>>2]=0;c[Da+4>>2]=0;Da=(c[12128]|0)+8|0;c[12128]=Da;c[Da>>2]=1048576;c[Da+4>>2]=0;Da=(c[12128]|0)+8|0;c[12128]=Da;Hc=Ga+48|0;Fa=c[Hc+4>>2]|0;c[Da>>2]=c[Hc>>2];c[Da+4>>2]=Fa;Fa=(c[12128]|0)+8|0;c[12128]=Fa;Da=Ga+56|0;Ga=c[Da+4>>2]|0;c[Fa>>2]=c[Da>>2];c[Fa+4>>2]=Ga;c[12128]=(c[12128]|0)+8;Ga=Ha|0;c[Ga>>2]=0;c[Ga+4>>2]=0;Fa=Ha+8|0;c[Fa>>2]=2097152;c[Fa+4>>2]=0;Fa=Ha+16|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+24|0;c[Fa>>2]=270008320;c[Fa+4>>2]=5505024;Fa=Ha+32|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+40|0;c[Fa>>2]=2097152;c[Fa+4>>2]=0;Fa=Ha+48|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+56|0;c[Fa>>2]=805306368;c[Fa+4>>2]=6094896;Fa=Ha+64|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+72|0;c[Fa>>2]=2097152;c[Fa+4>>2]=0;Fa=Ha+80|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+88|0;c[Fa>>2]=1073741824;c[Fa+4>>2]=6160480;Fa=Ha+96|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+104|0;c[Fa>>2]=2048;c[Fa+4>>2]=0;Fa=Ha+112|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+120|0;c[Fa>>2]=270008320;c[Fa+4>>2]=5505024;Fa=Ha+128|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+136|0;c[Fa>>2]=2048;c[Fa+4>>2]=0;Fa=Ha+144|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+152|0;c[Fa>>2]=525824;c[Fa+4>>2]=4849664;Fa=Ha+160|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+168|0;c[Fa>>2]=270532608;c[Fa+4>>2]=0;Fa=Ha+176|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+184|0;c[Fa>>2]=536870912;c[Fa+4>>2]=6094848;Fa=Ha+192|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+200|0;c[Fa>>2]=537395200;c[Fa+4>>2]=0;Fa=Ha+208|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+216|0;c[Fa>>2]=268435456;c[Fa+4>>2]=6029312;Fa=Ha+224|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+232|0;c[Fa>>2]=268436480;c[Fa+4>>2]=0;Fa=Ha+240|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+248|0;c[Fa>>2]=524288;c[Fa+4>>2]=5439488;Fa=Ha+256|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+264|0;c[Fa>>2]=526336;c[Fa+4>>2]=0;Fa=Ha+272|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+280|0;c[Fa>>2]=1024;c[Fa+4>>2]=4849664;Fa=Ha+288|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+296|0;c[Fa>>2]=2098176;c[Fa+4>>2]=0;Fa=Ha+304|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+312|0;c[Fa>>2]=2048;c[Fa+4>>2]=4915200;Fa=Ha+320|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+328|0;c[Fa>>2]=536872960;c[Fa+4>>2]=0;Fa=Ha+336|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Fa=Ha+344|0;c[Fa>>2]=2097152;c[Fa+4>>2]=5570560;c[12130]=0;c[12131]=0;c[12132]=0;Fa=Jm(352)|0;Da=Fa;c[12131]=Da;c[12130]=Da;c[12132]=Fa+352;Fa=Ha+352|0;Ha=Ga;Ga=Da;do{if((Ga|0)==0){Ic=0}else{Da=c[Ha+4>>2]|0;c[Ga>>2]=c[Ha>>2];c[Ga+4>>2]=Da;Ic=c[12131]|0}Ga=Ic+8|0;c[12131]=Ga;Ha=Ha+8|0;}while((Ha|0)!=(Fa|0));Fa=Ia|0;c[Fa>>2]=0;c[Fa+4>>2]=0;Ha=Ia+8|0;c[Ha>>2]=4096;c[Ha+4>>2]=0;Ha=Ia+16|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+24|0;c[Ha>>2]=1613758464;c[Ha+4>>2]=5570560;Ha=Ia+32|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+40|0;c[Ha>>2]=4096;c[Ha+4>>2]=0;Ha=Ia+48|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+56|0;c[Ha>>2]=-1069547520;c[Ha+4>>2]=5636096;Ha=Ia+64|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+72|0;c[Ha>>2]=4096;c[Ha+4>>2]=0;Ha=Ia+80|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+88|0;c[Ha>>2]=1051648;c[Ha+4>>2]=4915200;Ha=Ia+96|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+104|0;c[Ha>>2]=1074790400;c[Ha+4>>2]=0;Ha=Ia+112|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+120|0;c[Ha>>2]=536870912;c[Ha+4>>2]=6094848;Ha=Ia+128|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+136|0;c[Ha>>2]=541065216;c[Ha+4>>2]=0;Ha=Ia+144|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+152|0;c[Ha>>2]=1073741824;c[Ha+4>>2]=6160384;Ha=Ia+160|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+168|0;c[Ha>>2]=1073745920;c[Ha+4>>2]=0;Ha=Ia+176|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+184|0;c[Ha>>2]=4194304;c[Ha+4>>2]=5636096;Ha=Ia+192|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+200|0;c[Ha>>2]=4196352;c[Ha+4>>2]=0;Ha=Ia+208|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+216|0;c[Ha>>2]=4096;c[Ha+4>>2]=4980736;Ha=Ia+224|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+232|0;c[Ha>>2]=1052672;c[Ha+4>>2]=0;Ha=Ia+240|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+248|0;c[Ha>>2]=2048;c[Ha+4>>2]=4915200;Ha=Ia+256|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+264|0;c[Ha>>2]=536872960;c[Ha+4>>2]=0;Ha=Ia+272|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ha=Ia+280|0;c[Ha>>2]=1048576;c[Ha+4>>2]=5505024;c[12133]=0;c[12134]=0;c[12135]=0;Ha=Jm(288)|0;Ga=Ha;c[12134]=Ga;c[12133]=Ga;c[12135]=Ha+288;Ha=Ia+288|0;Ia=Fa;Fa=Ga;do{if((Fa|0)==0){Jc=0}else{Ga=c[Ia+4>>2]|0;c[Fa>>2]=c[Ia>>2];c[Fa+4>>2]=Ga;Jc=c[12134]|0}Fa=Jc+8|0;c[12134]=Fa;Ia=Ia+8|0;}while((Ia|0)!=(Ha|0));Ha=Ja|0;c[Ha>>2]=0;c[Ha+4>>2]=0;Ia=Ja+8|0;c[Ia>>2]=4096;c[Ia+4>>2]=0;Ia=Ja+16|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+24|0;c[Ia>>2]=1613758464;c[Ia+4>>2]=5570560;Ia=Ja+32|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+40|0;c[Ia>>2]=4096;c[Ia+4>>2]=0;Ia=Ja+48|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+56|0;c[Ia>>2]=-1069547520;c[Ia+4>>2]=5636096;Ia=Ja+64|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+72|0;c[Ia>>2]=4096;c[Ia+4>>2]=0;Ia=Ja+80|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+88|0;c[Ia>>2]=1051648;c[Ia+4>>2]=4915200;Ia=Ja+96|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+104|0;c[Ia>>2]=8192;c[Ia+4>>2]=0;Ia=Ja+112|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+120|0;c[Ia>>2]=-2139095040;c[Ia+4>>2]=5701633;Ia=Ja+128|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+136|0;c[Ia>>2]=8192;c[Ia+4>>2]=0;Ia=Ja+144|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+152|0;c[Ia>>2]=-1069547520;c[Ia+4>>2]=5636096;Ia=Ja+160|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+168|0;c[Ia>>2]=2105344;c[Ia+4>>2]=0;Ia=Ja+176|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+184|0;c[Ia>>2]=4096;c[Ia+4>>2]=4980736;Ia=Ja+192|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+200|0;c[Ia>>2]=8392704;c[Ia+4>>2]=0;Ia=Ja+208|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+216|0;c[Ia>>2]=8192;c[Ia+4>>2]=5046272;Ia=Ja+224|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+232|0;c[Ia>>2]=-2147475456;c[Ia+4>>2]=0;Ia=Ja+240|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+248|0;c[Ia>>2]=8388608;c[Ia+4>>2]=5701632;Ia=Ja+256|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+264|0;c[Ia>>2]=1082130432;c[Ia+4>>2]=0;Ia=Ja+272|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+280|0;c[Ia>>2]=-2147483648;c[Ia+4>>2]=6225920;Ia=Ja+288|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+296|0;c[Ia>>2]=-2145386496;c[Ia+4>>2]=0;Ia=Ja+304|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+312|0;c[Ia>>2]=1073741824;c[Ia+4>>2]=6160384;Ia=Ja+320|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+328|0;c[Ia>>2]=1073745920;c[Ia+4>>2]=0;Ia=Ja+336|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ia=Ja+344|0;c[Ia>>2]=2097152;c[Ia+4>>2]=5570560;c[12136]=0;c[12137]=0;c[12138]=0;Ia=Jm(352)|0;Fa=Ia;c[12137]=Fa;c[12136]=Fa;c[12138]=Ia+352;Ia=Ja+352|0;Ja=Ha;Ha=Fa;do{if((Ha|0)==0){Kc=0}else{Fa=c[Ja+4>>2]|0;c[Ha>>2]=c[Ja>>2];c[Ha+4>>2]=Fa;Kc=c[12137]|0}Ha=Kc+8|0;c[12137]=Ha;Ja=Ja+8|0;}while((Ja|0)!=(Ia|0));Ia=Ka|0;c[Ia>>2]=0;c[Ia+4>>2]=0;Ja=Ka+8|0;c[Ja>>2]=8192;c[Ja+4>>2]=0;Ja=Ka+16|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+24|0;c[Ja>>2]=-2139095040;c[Ja+4>>2]=5701633;Ja=Ka+32|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+40|0;c[Ja>>2]=8192;c[Ja+4>>2]=0;Ja=Ka+48|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+56|0;c[Ja>>2]=-1069547520;c[Ja+4>>2]=5636096;Ja=Ka+64|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+72|0;c[Ja>>2]=16384;c[Ja+4>>2]=0;Ja=Ka+80|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+88|0;c[Ja>>2]=-2139095040;c[Ja+4>>2]=5701633;Ja=Ka+96|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+104|0;c[Ja>>2]=16384;c[Ja+4>>2]=0;Ja=Ka+112|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+120|0;c[Ja>>2]=16777216;c[Ja+4>>2]=5767171;Ja=Ka+128|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+136|0;c[Ja>>2]=4210688;c[Ja+4>>2]=0;Ja=Ka+144|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+152|0;c[Ja>>2]=8192;c[Ja+4>>2]=5046272;Ja=Ka+160|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+168|0;c[Ja>>2]=16785408;c[Ja+4>>2]=0;Ja=Ka+176|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+184|0;c[Ja>>2]=16384;c[Ja+4>>2]=5111808;Ja=Ka+192|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+200|0;c[Ja>>2]=16384;c[Ja+4>>2]=1;Ja=Ka+208|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+216|0;c[Ja>>2]=16777216;c[Ja+4>>2]=5767168;Ja=Ka+224|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+232|0;c[Ja>>2]=-2130706432;c[Ja+4>>2]=0;Ja=Ka+240|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+248|0;c[Ja>>2]=0;c[Ja+4>>2]=6291457;Ja=Ka+256|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+264|0;c[Ja>>2]=4194304;c[Ja+4>>2]=1;Ja=Ka+272|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+280|0;c[Ja>>2]=-2147483648;c[Ja+4>>2]=6225920;Ja=Ka+288|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+296|0;c[Ja>>2]=-2147475456;c[Ja+4>>2]=0;Ja=Ka+304|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ja=Ka+312|0;c[Ja>>2]=4194304;c[Ja+4>>2]=5636096;c[12139]=0;c[12140]=0;c[12141]=0;Ja=Jm(320)|0;Ha=Ja;c[12140]=Ha;c[12139]=Ha;c[12141]=Ja+320;Ja=Ka+320|0;Ka=Ia;Ia=Ha;do{if((Ia|0)==0){Lc=0}else{Ha=c[Ka+4>>2]|0;c[Ia>>2]=c[Ka>>2];c[Ia+4>>2]=Ha;Lc=c[12140]|0}Ia=Lc+8|0;c[12140]=Ia;Ka=Ka+8|0;}while((Ka|0)!=(Ja|0));Ja=La|0;c[Ja>>2]=0;c[Ja+4>>2]=0;Ka=La+8|0;c[Ka>>2]=32768;c[Ka+4>>2]=0;Ka=La+16|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+24|0;c[Ka>>2]=67305472;c[Ka+4>>2]=5242880;Ka=La+32|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+40|0;c[Ka>>2]=32768;c[Ka+4>>2]=0;Ka=La+48|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+56|0;c[Ka>>2]=100663296;c[Ka+4>>2]=5832710;Ka=La+64|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+72|0;c[Ka>>2]=32768;c[Ka+4>>2]=0;Ka=La+80|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+88|0;c[Ka>>2]=16777216;c[Ka+4>>2]=5767171;Ka=La+96|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+104|0;c[Ka>>2]=16384;c[Ka+4>>2]=0;Ka=La+112|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+120|0;c[Ka>>2]=-2139095040;c[Ka+4>>2]=5701633;Ka=La+128|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+136|0;c[Ka>>2]=16384;c[Ka+4>>2]=0;Ka=La+144|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+152|0;c[Ka>>2]=16777216;c[Ka+4>>2]=5767171;Ka=La+160|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+168|0;c[Ka>>2]=8388608;c[Ka+4>>2]=2;Ka=La+176|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+184|0;c[Ka>>2]=0;c[Ka+4>>2]=6291457;Ka=La+192|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+200|0;c[Ka>>2]=33554432;c[Ka+4>>2]=1;Ka=La+208|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+216|0;c[Ka>>2]=0;c[Ka+4>>2]=6356994;Ka=La+224|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+232|0;c[Ka>>2]=32768;c[Ka+4>>2]=2;Ka=La+240|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+248|0;c[Ka>>2]=33554432;c[Ka+4>>2]=5832704;Ka=La+256|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+264|0;c[Ka>>2]=33570816;c[Ka+4>>2]=0;Ka=La+272|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+280|0;c[Ka>>2]=32768;c[Ka+4>>2]=5177344;Ka=La+288|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+296|0;c[Ka>>2]=8421376;c[Ka+4>>2]=0;Ka=La+304|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+312|0;c[Ka>>2]=16384;c[Ka+4>>2]=5111808;Ka=La+320|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+328|0;c[Ka>>2]=16384;c[Ka+4>>2]=1;Ka=La+336|0;c[Ka>>2]=0;c[Ka+4>>2]=0;Ka=La+344|0;c[Ka>>2]=8388608;c[Ka+4>>2]=5701632;c[12142]=0;c[12143]=0;c[12144]=0;Ka=Jm(352)|0;Ia=Ka;c[12143]=Ia;c[12142]=Ia;c[12144]=Ka+352;Ka=La+352|0;La=Ja;Ja=Ia;do{if((Ja|0)==0){Mc=0}else{Ia=c[La+4>>2]|0;c[Ja>>2]=c[La>>2];c[Ja+4>>2]=Ia;Mc=c[12143]|0}Ja=Mc+8|0;c[12143]=Ja;La=La+8|0;}while((La|0)!=(Ka|0));Ka=Ma|0;c[Ka>>2]=0;c[Ka+4>>2]=0;La=Ma+8|0;c[La>>2]=32768;c[La+4>>2]=0;La=Ma+16|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+24|0;c[La>>2]=67305472;c[La+4>>2]=5242880;La=Ma+32|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+40|0;c[La>>2]=32768;c[La+4>>2]=0;La=Ma+48|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+56|0;c[La>>2]=100663296;c[La+4>>2]=5832710;La=Ma+64|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+72|0;c[La>>2]=32768;c[La+4>>2]=0;La=Ma+80|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+88|0;c[La>>2]=16777216;c[La+4>>2]=5767171;La=Ma+96|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+104|0;c[La>>2]=16777216;c[La+4>>2]=4;La=Ma+112|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+120|0;c[La>>2]=0;c[La+4>>2]=6356994;La=Ma+128|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+136|0;c[La>>2]=32768;c[La+4>>2]=2;La=Ma+144|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+152|0;c[La>>2]=16777216;c[La+4>>2]=5767168;La=Ma+160|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+168|0;c[La>>2]=16842752;c[La+4>>2]=0;La=Ma+176|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+184|0;c[La>>2]=32768;c[La+4>>2]=5177344;La=Ma+192|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+200|0;c[La>>2]=67141632;c[La+4>>2]=0;La=Ma+208|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+216|0;c[La>>2]=65536;c[La+4>>2]=5242880;La=Ma+224|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+232|0;c[La>>2]=65536;c[La+4>>2]=4;La=Ma+240|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+248|0;c[La>>2]=67108864;c[La+4>>2]=5898240;La=Ma+256|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+264|0;c[La>>2]=67108864;c[La+4>>2]=2;La=Ma+272|0;c[La>>2]=0;c[La+4>>2]=0;La=Ma+280|0;c[La>>2]=0;c[La+4>>2]=6422532;c[12145]=0;c[12146]=0;c[12147]=0;La=Jm(288)|0;Ja=La;c[12146]=Ja;c[12145]=Ja;c[12147]=La+288;La=Ma+288|0;Ma=Ka;Ka=Ja;do{if((Ka|0)==0){Nc=0}else{Ja=c[Ma+4>>2]|0;c[Ka>>2]=c[Ma>>2];c[Ka+4>>2]=Ja;Nc=c[12146]|0}Ka=Nc+8|0;c[12146]=Ka;Ma=Ma+8|0;}while((Ma|0)!=(La|0));La=Na|0;c[La>>2]=0;c[La+4>>2]=0;Ma=Na+8|0;c[Ma>>2]=65536;c[Ma+4>>2]=0;Ma=Na+16|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+24|0;c[Ma>>2]=134610944;c[Ma+4>>2]=5308416;Ma=Na+32|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+40|0;c[Ma>>2]=65536;c[Ma+4>>2]=0;Ma=Na+48|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+56|0;c[Ma>>2]=201326592;c[Ma+4>>2]=5898248;Ma=Na+64|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+72|0;c[Ma>>2]=33554432;c[Ma+4>>2]=0;Ma=Na+80|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+88|0;c[Ma>>2]=0;c[Ma+4>>2]=6424076;Ma=Na+96|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+104|0;c[Ma>>2]=33554432;c[Ma+4>>2]=0;Ma=Na+112|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+120|0;c[Ma>>2]=0;c[Ma+4>>2]=6357762;Ma=Na+128|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+136|0;c[Ma>>2]=33554432;c[Ma+4>>2]=0;Ma=Na+144|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+152|0;c[Ma>>2]=201326592;c[Ma+4>>2]=5898248;Ma=Na+160|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+168|0;c[Ma>>2]=134217728;c[Ma+4>>2]=4;Ma=Na+176|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+184|0;c[Ma>>2]=0;c[Ma+4>>2]=6488072;Ma=Na+192|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+200|0;c[Ma>>2]=131072;c[Ma+4>>2]=8;Ma=Na+208|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+216|0;c[Ma>>2]=134217728;c[Ma+4>>2]=5963776;Ma=Na+224|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+232|0;c[Ma>>2]=134283264;c[Ma+4>>2]=0;Ma=Na+240|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+248|0;c[Ma>>2]=131072;c[Ma+4>>2]=5308416;Ma=Na+256|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+264|0;c[Ma>>2]=33685504;c[Ma+4>>2]=0;Ma=Na+272|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+280|0;c[Ma>>2]=65536;c[Ma+4>>2]=5242880;Ma=Na+288|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+296|0;c[Ma>>2]=65536;c[Ma+4>>2]=4;Ma=Na+304|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+312|0;c[Ma>>2]=33554432;c[Ma+4>>2]=5832704;Ma=Na+320|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+328|0;c[Ma>>2]=33554432;c[Ma+4>>2]=8;Ma=Na+336|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Na+344|0;c[Ma>>2]=0;c[Ma+4>>2]=6422532;c[12148]=0;c[12149]=0;c[12150]=0;Ma=Jm(352)|0;Ka=Ma;c[12149]=Ka;c[12148]=Ka;c[12150]=Ma+352;Ma=Na+352|0;Na=La;La=Ka;do{if((La|0)==0){Oc=0}else{Ka=c[Na+4>>2]|0;c[La>>2]=c[Na>>2];c[La+4>>2]=Ka;Oc=c[12149]|0}La=Oc+8|0;c[12149]=La;Na=Na+8|0;}while((Na|0)!=(Ma|0));Ma=Oa|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Oa+8|0;c[Ma>>2]=131072;c[Ma+4>>2]=0;Ma=Oa+16|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Oa+24|0;c[Ma>>2]=262144;c[Ma+4>>2]=5373952;Ma=Oa+32|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Oa+40|0;c[Ma>>2]=67108864;c[Ma+4>>2]=0;Ma=Oa+48|0;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=Oa+56|0;c[Ma>>2]=0;c[Ma+4>>2]=6488072;c[12151]=0;c[12152]=0;c[12153]=0;Ma=Jm(64)|0;Na=Ma;c[12152]=Na;c[12151]=Na;c[12153]=Ma+64;if((Ma|0)==0){Pc=0}else{c[Na>>2]=0;c[Na+4>>2]=0;Pc=Na}Na=Pc+8|0;c[12152]=Na;c[Na>>2]=131072;c[Na+4>>2]=0;Na=(c[12152]|0)+8|0;c[12152]=Na;c[Na>>2]=0;c[Na+4>>2]=0;Na=(c[12152]|0)+8|0;c[12152]=Na;c[Na>>2]=262144;c[Na+4>>2]=5373952;Na=(c[12152]|0)+8|0;c[12152]=Na;c[Na>>2]=0;c[Na+4>>2]=0;Na=(c[12152]|0)+8|0;c[12152]=Na;c[Na>>2]=67108864;c[Na+4>>2]=0;Na=(c[12152]|0)+8|0;c[12152]=Na;Pc=Oa+48|0;Ma=c[Pc+4>>2]|0;c[Na>>2]=c[Pc>>2];c[Na+4>>2]=Ma;Ma=(c[12152]|0)+8|0;c[12152]=Ma;Na=Oa+56|0;Oa=c[Na+4>>2]|0;c[Ma>>2]=c[Na>>2];c[Ma+4>>2]=Oa;c[12152]=(c[12152]|0)+8;Oa=Pa|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Pa+8|0;c[Oa>>2]=1048576;c[Oa+4>>2]=0;Oa=Pa+16|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Pa+24|0;c[Oa>>2]=524288;c[Oa+4>>2]=5439488;Oa=Pa+32|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Pa+40|0;c[Oa>>2]=536870912;c[Oa+4>>2]=0;Oa=Pa+48|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Pa+56|0;c[Oa>>2]=0;c[Oa+4>>2]=6553616;c[12154]=0;c[12155]=0;c[12156]=0;Oa=Jm(64)|0;Ma=Oa;c[12155]=Ma;c[12154]=Ma;c[12156]=Oa+64;if((Oa|0)==0){Qc=0}else{c[Ma>>2]=0;c[Ma+4>>2]=0;Qc=Ma}Ma=Qc+8|0;c[12155]=Ma;c[Ma>>2]=1048576;c[Ma+4>>2]=0;Ma=(c[12155]|0)+8|0;c[12155]=Ma;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=(c[12155]|0)+8|0;c[12155]=Ma;c[Ma>>2]=524288;c[Ma+4>>2]=5439488;Ma=(c[12155]|0)+8|0;c[12155]=Ma;c[Ma>>2]=0;c[Ma+4>>2]=0;Ma=(c[12155]|0)+8|0;c[12155]=Ma;c[Ma>>2]=536870912;c[Ma+4>>2]=0;Ma=(c[12155]|0)+8|0;c[12155]=Ma;Qc=Pa+48|0;Oa=c[Qc+4>>2]|0;c[Ma>>2]=c[Qc>>2];c[Ma+4>>2]=Oa;Oa=(c[12155]|0)+8|0;c[12155]=Oa;Ma=Pa+56|0;Pa=c[Ma+4>>2]|0;c[Oa>>2]=c[Ma>>2];c[Oa+4>>2]=Pa;c[12155]=(c[12155]|0)+8;Pa=Qa|0;c[Pa>>2]=0;c[Pa+4>>2]=0;Oa=Qa+8|0;c[Oa>>2]=2097152;c[Oa+4>>2]=0;Oa=Qa+16|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+24|0;c[Oa>>2]=270008320;c[Oa+4>>2]=5505024;Oa=Qa+32|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+40|0;c[Oa>>2]=2097152;c[Oa+4>>2]=0;Oa=Qa+48|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+56|0;c[Oa>>2]=805306368;c[Oa+4>>2]=6094896;Oa=Qa+64|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+72|0;c[Oa>>2]=2097152;c[Oa+4>>2]=0;Oa=Qa+80|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+88|0;c[Oa>>2]=1073741824;c[Oa+4>>2]=6160480;Oa=Qa+96|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+104|0;c[Oa>>2]=270532608;c[Oa+4>>2]=0;Oa=Qa+112|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+120|0;c[Oa>>2]=1048576;c[Oa+4>>2]=5505024;Oa=Qa+128|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+136|0;c[Oa>>2]=1048576;c[Oa+4>>2]=16;Oa=Qa+144|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+152|0;c[Oa>>2]=268435456;c[Oa+4>>2]=6029312;Oa=Qa+160|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+168|0;c[Oa>>2]=268435456;c[Oa+4>>2]=32;Oa=Qa+176|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+184|0;c[Oa>>2]=0;c[Oa+4>>2]=6553616;Oa=Qa+192|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+200|0;c[Oa>>2]=1073741824;c[Oa+4>>2]=16;Oa=Qa+208|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+216|0;c[Oa>>2]=0;c[Oa+4>>2]=6619168;Oa=Qa+224|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+232|0;c[Oa>>2]=2097152;c[Oa+4>>2]=32;Oa=Qa+240|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+248|0;c[Oa>>2]=1073741824;c[Oa+4>>2]=6160384;Oa=Qa+256|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+264|0;c[Oa>>2]=1074790400;c[Oa+4>>2]=0;Oa=Qa+272|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Oa=Qa+280|0;c[Oa>>2]=2097152;c[Oa+4>>2]=5570560;c[12157]=0;c[12158]=0;c[12159]=0;Oa=Jm(288)|0;Ma=Oa;c[12158]=Ma;c[12157]=Ma;c[12159]=Oa+288;Oa=Qa+288|0;Qa=Pa;Pa=Ma;do{if((Pa|0)==0){Rc=0}else{Ma=c[Qa+4>>2]|0;c[Pa>>2]=c[Qa>>2];c[Pa+4>>2]=Ma;Rc=c[12158]|0}Pa=Rc+8|0;c[12158]=Pa;Qa=Qa+8|0;}while((Qa|0)!=(Oa|0));Oa=Ra|0;c[Oa>>2]=0;c[Oa+4>>2]=0;Qa=Ra+8|0;c[Qa>>2]=2097152;c[Qa+4>>2]=0;Qa=Ra+16|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+24|0;c[Qa>>2]=270008320;c[Qa+4>>2]=5505024;Qa=Ra+32|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+40|0;c[Qa>>2]=2097152;c[Qa+4>>2]=0;Qa=Ra+48|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+56|0;c[Qa>>2]=805306368;c[Qa+4>>2]=6094896;Qa=Ra+64|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+72|0;c[Qa>>2]=2097152;c[Qa+4>>2]=0;Qa=Ra+80|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+88|0;c[Qa>>2]=1073741824;c[Qa+4>>2]=6160480;Qa=Ra+96|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+104|0;c[Qa>>2]=4194304;c[Qa+4>>2]=0;Qa=Ra+112|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+120|0;c[Qa>>2]=-2147483648;c[Qa+4>>2]=6226112;Qa=Ra+128|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+136|0;c[Qa>>2]=4194304;c[Qa+4>>2]=0;Qa=Ra+144|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+152|0;c[Qa>>2]=1073741824;c[Qa+4>>2]=6160480;Qa=Ra+160|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+168|0;c[Qa>>2]=-2145386496;c[Qa+4>>2]=0;Qa=Ra+176|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+184|0;c[Qa>>2]=4194304;c[Qa+4>>2]=5636096;Qa=Ra+192|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+200|0;c[Qa>>2]=4194304;c[Qa+4>>2]=64;Qa=Ra+208|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+216|0;c[Qa>>2]=-2147483648;c[Qa+4>>2]=6225920;Qa=Ra+224|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+232|0;c[Qa>>2]=-2147483648;c[Qa+4>>2]=32;Qa=Ra+240|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+248|0;c[Qa>>2]=0;c[Qa+4>>2]=6684736;Qa=Ra+256|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+264|0;c[Qa>>2]=536870912;c[Qa+4>>2]=64;Qa=Ra+272|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+280|0;c[Qa>>2]=0;c[Qa+4>>2]=6619168;Qa=Ra+288|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+296|0;c[Qa>>2]=2097152;c[Qa+4>>2]=32;Qa=Ra+304|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+312|0;c[Qa>>2]=536870912;c[Qa+4>>2]=6094848;Qa=Ra+320|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+328|0;c[Qa>>2]=541065216;c[Qa+4>>2]=0;Qa=Ra+336|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Qa=Ra+344|0;c[Qa>>2]=2097152;c[Qa+4>>2]=5570560;c[12160]=0;c[12161]=0;c[12162]=0;Qa=Jm(352)|0;Pa=Qa;c[12161]=Pa;c[12160]=Pa;c[12162]=Qa+352;Qa=Ra+352|0;Ra=Oa;Oa=Pa;do{if((Oa|0)==0){Sc=0}else{Pa=c[Ra+4>>2]|0;c[Oa>>2]=c[Ra>>2];c[Oa+4>>2]=Pa;Sc=c[12161]|0}Oa=Sc+8|0;c[12161]=Oa;Ra=Ra+8|0;}while((Ra|0)!=(Qa|0));Qa=Sa|0;c[Qa>>2]=0;c[Qa+4>>2]=0;Ra=Sa+8|0;c[Ra>>2]=8388608;c[Ra+4>>2]=0;Ra=Sa+16|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+24|0;c[Ra>>2]=0;c[Ra+4>>2]=6291841;Ra=Sa+32|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+40|0;c[Ra>>2]=8388608;c[Ra+4>>2]=0;Ra=Sa+48|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+56|0;c[Ra>>2]=-2147483648;c[Ra+4>>2]=6226112;Ra=Sa+64|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+72|0;c[Ra>>2]=4194304;c[Ra+4>>2]=0;Ra=Sa+80|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+88|0;c[Ra>>2]=-2147483648;c[Ra+4>>2]=6226112;Ra=Sa+96|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+104|0;c[Ra>>2]=4194304;c[Ra+4>>2]=0;Ra=Sa+112|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+120|0;c[Ra>>2]=1073741824;c[Ra+4>>2]=6160480;Ra=Sa+128|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+136|0;c[Ra>>2]=0;c[Ra+4>>2]=65;Ra=Sa+144|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+152|0;c[Ra>>2]=0;c[Ra+4>>2]=6750336;Ra=Sa+160|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+168|0;c[Ra>>2]=8388608;c[Ra+4>>2]=128;Ra=Sa+176|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+184|0;c[Ra>>2]=0;c[Ra+4>>2]=6291457;Ra=Sa+192|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+200|0;c[Ra>>2]=4194304;c[Ra+4>>2]=1;Ra=Sa+208|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+216|0;c[Ra>>2]=8388608;c[Ra+4>>2]=5701632;Ra=Sa+224|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+232|0;c[Ra>>2]=1082130432;c[Ra+4>>2]=0;Ra=Sa+240|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+248|0;c[Ra>>2]=4194304;c[Ra+4>>2]=5636096;Ra=Sa+256|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+264|0;c[Ra>>2]=4194304;c[Ra+4>>2]=64;Ra=Sa+272|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+280|0;c[Ra>>2]=1073741824;c[Ra+4>>2]=6160384;Ra=Sa+288|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+296|0;c[Ra>>2]=1073741824;c[Ra+4>>2]=128;Ra=Sa+304|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Ra=Sa+312|0;c[Ra>>2]=0;c[Ra+4>>2]=6684736;c[12163]=0;c[12164]=0;c[12165]=0;Ra=Jm(320)|0;Oa=Ra;c[12164]=Oa;c[12163]=Oa;c[12165]=Ra+320;Ra=Sa+320|0;Sa=Qa;Qa=Oa;do{if((Qa|0)==0){Tc=0}else{Oa=c[Sa+4>>2]|0;c[Qa>>2]=c[Sa>>2];c[Qa+4>>2]=Oa;Tc=c[12164]|0}Qa=Tc+8|0;c[12164]=Qa;Sa=Sa+8|0;}while((Sa|0)!=(Ra|0));Ra=Ta|0;c[Ra>>2]=0;c[Ra+4>>2]=0;Sa=Ta+8|0;c[Sa>>2]=8388608;c[Sa+4>>2]=0;Sa=Ta+16|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+24|0;c[Sa>>2]=0;c[Sa+4>>2]=6291841;Sa=Ta+32|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+40|0;c[Sa>>2]=8388608;c[Sa+4>>2]=0;Sa=Ta+48|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+56|0;c[Sa>>2]=-2147483648;c[Sa+4>>2]=6226112;Sa=Ta+64|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+72|0;c[Sa>>2]=16777216;c[Sa+4>>2]=0;Sa=Ta+80|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+88|0;c[Sa>>2]=0;c[Sa+4>>2]=6291841;Sa=Ta+96|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+104|0;c[Sa>>2]=16777216;c[Sa+4>>2]=0;Sa=Ta+112|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+120|0;c[Sa>>2]=0;c[Sa+4>>2]=6357762;Sa=Ta+128|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+136|0;c[Sa>>2]=8388608;c[Sa+4>>2]=128;Sa=Ta+144|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+152|0;c[Sa>>2]=-2147483648;c[Sa+4>>2]=6225920;Sa=Ta+160|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+168|0;c[Sa>>2]=-2130706432;c[Sa+4>>2]=0;Sa=Ta+176|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+184|0;c[Sa>>2]=8388608;c[Sa+4>>2]=5701632;Sa=Ta+192|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+200|0;c[Sa>>2]=8388608;c[Sa+4>>2]=2;Sa=Ta+208|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+216|0;c[Sa>>2]=16777216;c[Sa+4>>2]=5767168;Sa=Ta+224|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+232|0;c[Sa>>2]=16777216;c[Sa+4>>2]=256;Sa=Ta+240|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+248|0;c[Sa>>2]=0;c[Sa+4>>2]=6356994;Sa=Ta+256|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+264|0;c[Sa>>2]=0;c[Sa+4>>2]=130;Sa=Ta+272|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+280|0;c[Sa>>2]=0;c[Sa+4>>2]=6816e3;Sa=Ta+288|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+296|0;c[Sa>>2]=-2147483648;c[Sa+4>>2]=256;Sa=Ta+304|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Sa=Ta+312|0;c[Sa>>2]=0;c[Sa+4>>2]=6750336;c[12166]=0;c[12167]=0;c[12168]=0;Sa=Jm(320)|0;Qa=Sa;c[12167]=Qa;c[12166]=Qa;c[12168]=Sa+320;Sa=Ta+320|0;Ta=Ra;Ra=Qa;do{if((Ra|0)==0){Uc=0}else{Qa=c[Ta+4>>2]|0;c[Ra>>2]=c[Ta>>2];c[Ra+4>>2]=Qa;Uc=c[12167]|0}Ra=Uc+8|0;c[12167]=Ra;Ta=Ta+8|0;}while((Ta|0)!=(Sa|0));Sa=Ua|0;c[Sa>>2]=0;c[Sa+4>>2]=0;Ta=Ua+8|0;c[Ta>>2]=33554432;c[Ta+4>>2]=0;Ta=Ua+16|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+24|0;c[Ta>>2]=0;c[Ta+4>>2]=6424076;Ta=Ua+32|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+40|0;c[Ta>>2]=33554432;c[Ta+4>>2]=0;Ta=Ua+48|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+56|0;c[Ta>>2]=0;c[Ta+4>>2]=6357762;Ta=Ua+64|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+72|0;c[Ta>>2]=33554432;c[Ta+4>>2]=0;Ta=Ua+80|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+88|0;c[Ta>>2]=201326592;c[Ta+4>>2]=5898248;Ta=Ua+96|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+104|0;c[Ta>>2]=16777216;c[Ta+4>>2]=0;Ta=Ua+112|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+120|0;c[Ta>>2]=0;c[Ta+4>>2]=6291841;Ta=Ua+128|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+136|0;c[Ta>>2]=16777216;c[Ta+4>>2]=0;Ta=Ua+144|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+152|0;c[Ta>>2]=0;c[Ta+4>>2]=6357762;Ta=Ua+160|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+168|0;c[Ta>>2]=16777216;c[Ta+4>>2]=4;Ta=Ua+176|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+184|0;c[Ta>>2]=33554432;c[Ta+4>>2]=5832704;Ta=Ua+192|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+200|0;c[Ta>>2]=33554432;c[Ta+4>>2]=1;Ta=Ua+208|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+216|0;c[Ta>>2]=16777216;c[Ta+4>>2]=5767168;Ta=Ua+224|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+232|0;c[Ta>>2]=16777216;c[Ta+4>>2]=256;Ta=Ua+240|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+248|0;c[Ta>>2]=0;c[Ta+4>>2]=6291457;Ta=Ua+256|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+264|0;c[Ta>>2]=0;c[Ta+4>>2]=513;Ta=Ua+272|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+280|0;c[Ta>>2]=0;c[Ta+4>>2]=6816e3;Ta=Ua+288|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+296|0;c[Ta>>2]=0;c[Ta+4>>2]=260;Ta=Ua+304|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+312|0;c[Ta>>2]=0;c[Ta+4>>2]=6881792;Ta=Ua+320|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+328|0;c[Ta>>2]=33554432;c[Ta+4>>2]=512;Ta=Ua+336|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ta=Ua+344|0;c[Ta>>2]=0;c[Ta+4>>2]=6422532;c[12169]=0;c[12170]=0;c[12171]=0;Ta=Jm(352)|0;Ra=Ta;c[12170]=Ra;c[12169]=Ra;c[12171]=Ta+352;Ta=Ua+352|0;Ua=Sa;Sa=Ra;do{if((Sa|0)==0){Vc=0}else{Ra=c[Ua+4>>2]|0;c[Sa>>2]=c[Ua>>2];c[Sa+4>>2]=Ra;Vc=c[12170]|0}Sa=Vc+8|0;c[12170]=Sa;Ua=Ua+8|0;}while((Ua|0)!=(Ta|0));Ta=Va|0;c[Ta>>2]=0;c[Ta+4>>2]=0;Ua=Va+8|0;c[Ua>>2]=33554432;c[Ua+4>>2]=0;Ua=Va+16|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+24|0;c[Ua>>2]=0;c[Ua+4>>2]=6424076;Ua=Va+32|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+40|0;c[Ua>>2]=33554432;c[Ua+4>>2]=0;Ua=Va+48|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+56|0;c[Ua>>2]=0;c[Ua+4>>2]=6357762;Ua=Va+64|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+72|0;c[Ua>>2]=33554432;c[Ua+4>>2]=0;Ua=Va+80|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+88|0;c[Ua>>2]=201326592;c[Ua+4>>2]=5898248;Ua=Va+96|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+104|0;c[Ua>>2]=0;c[Ua+4>>2]=520;Ua=Va+112|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+120|0;c[Ua>>2]=0;c[Ua+4>>2]=6947840;Ua=Va+128|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+136|0;c[Ua>>2]=0;c[Ua+4>>2]=1026;Ua=Va+144|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+152|0;c[Ua>>2]=0;c[Ua+4>>2]=6881792;Ua=Va+160|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+168|0;c[Ua>>2]=33554432;c[Ua+4>>2]=512;Ua=Va+176|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+184|0;c[Ua>>2]=0;c[Ua+4>>2]=6356994;Ua=Va+192|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+200|0;c[Ua>>2]=67108864;c[Ua+4>>2]=2;Ua=Va+208|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+216|0;c[Ua>>2]=33554432;c[Ua+4>>2]=5832704;Ua=Va+224|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+232|0;c[Ua>>2]=33554432;c[Ua+4>>2]=8;Ua=Va+240|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+248|0;c[Ua>>2]=67108864;c[Ua+4>>2]=5898240;Ua=Va+256|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+264|0;c[Ua>>2]=67108864;c[Ua+4>>2]=1024;Ua=Va+272|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Va+280|0;c[Ua>>2]=0;c[Ua+4>>2]=6488072;c[12172]=0;c[12173]=0;c[12174]=0;Ua=Jm(288)|0;Sa=Ua;c[12173]=Sa;c[12172]=Sa;c[12174]=Ua+288;Ua=Va+288|0;Va=Ta;Ta=Sa;do{if((Ta|0)==0){Wc=0}else{Sa=c[Va+4>>2]|0;c[Ta>>2]=c[Va>>2];c[Ta+4>>2]=Sa;Wc=c[12173]|0}Ta=Wc+8|0;c[12173]=Ta;Va=Va+8|0;}while((Va|0)!=(Ua|0));Ua=Wa|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Wa+8|0;c[Ua>>2]=67108864;c[Ua+4>>2]=0;Ua=Wa+16|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Wa+24|0;c[Ua>>2]=134217728;c[Ua+4>>2]=5963776;Ua=Wa+32|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Wa+40|0;c[Ua>>2]=0;c[Ua+4>>2]=4;Ua=Wa+48|0;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=Wa+56|0;c[Ua>>2]=0;c[Ua+4>>2]=6947840;c[12175]=0;c[12176]=0;c[12177]=0;Ua=Jm(64)|0;Va=Ua;c[12176]=Va;c[12175]=Va;c[12177]=Ua+64;if((Ua|0)==0){Xc=0}else{c[Va>>2]=0;c[Va+4>>2]=0;Xc=Va}Va=Xc+8|0;c[12176]=Va;c[Va>>2]=67108864;c[Va+4>>2]=0;Va=(c[12176]|0)+8|0;c[12176]=Va;c[Va>>2]=0;c[Va+4>>2]=0;Va=(c[12176]|0)+8|0;c[12176]=Va;c[Va>>2]=134217728;c[Va+4>>2]=5963776;Va=(c[12176]|0)+8|0;c[12176]=Va;c[Va>>2]=0;c[Va+4>>2]=0;Va=(c[12176]|0)+8|0;c[12176]=Va;c[Va>>2]=0;c[Va+4>>2]=4;Va=(c[12176]|0)+8|0;c[12176]=Va;Xc=Wa+48|0;Ua=c[Xc+4>>2]|0;c[Va>>2]=c[Xc>>2];c[Va+4>>2]=Ua;Ua=(c[12176]|0)+8|0;c[12176]=Ua;Va=Wa+56|0;Wa=c[Va+4>>2]|0;c[Ua>>2]=c[Va>>2];c[Ua+4>>2]=Wa;c[12176]=(c[12176]|0)+8;Wa=Xa|0;c[Wa>>2]=0;c[Wa+4>>2]=0;Wa=Xa+8|0;c[Wa>>2]=536870912;c[Wa+4>>2]=0;Wa=Xa+16|0;c[Wa>>2]=0;c[Wa+4>>2]=0;Wa=Xa+24|0;c[Wa>>2]=268435456;c[Wa+4>>2]=6029312;Wa=Xa+32|0;c[Wa>>2]=0;c[Wa+4>>2]=0;Wa=Xa+40|0;c[Wa>>2]=536870912;c[Wa+4>>2]=0;Wa=Xa+48|0;c[Wa>>2]=0;c[Wa+4>>2]=0;Wa=Xa+56|0;c[Wa>>2]=0;c[Wa+4>>2]=6619168;c[12178]=0;c[12179]=0;c[12180]=0;Wa=Jm(64)|0;Ua=Wa;c[12179]=Ua;c[12178]=Ua;c[12180]=Wa+64;if((Wa|0)==0){Yc=0}else{c[Ua>>2]=0;c[Ua+4>>2]=0;Yc=Ua}Ua=Yc+8|0;c[12179]=Ua;c[Ua>>2]=536870912;c[Ua+4>>2]=0;Ua=(c[12179]|0)+8|0;c[12179]=Ua;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=(c[12179]|0)+8|0;c[12179]=Ua;c[Ua>>2]=268435456;c[Ua+4>>2]=6029312;Ua=(c[12179]|0)+8|0;c[12179]=Ua;c[Ua>>2]=0;c[Ua+4>>2]=0;Ua=(c[12179]|0)+8|0;c[12179]=Ua;c[Ua>>2]=536870912;c[Ua+4>>2]=0;Ua=(c[12179]|0)+8|0;c[12179]=Ua;Yc=Xa+48|0;Wa=c[Yc+4>>2]|0;c[Ua>>2]=c[Yc>>2];c[Ua+4>>2]=Wa;Wa=(c[12179]|0)+8|0;c[12179]=Wa;Ua=Xa+56|0;Xa=c[Ua+4>>2]|0;c[Wa>>2]=c[Ua>>2];c[Wa+4>>2]=Xa;c[12179]=(c[12179]|0)+8;Xa=Ya|0;c[Xa>>2]=0;c[Xa+4>>2]=0;Xa=Ya+8|0;c[Xa>>2]=536870912;c[Xa+4>>2]=0;Xa=Ya+16|0;c[Xa>>2]=0;c[Xa+4>>2]=0;Xa=Ya+24|0;c[Xa>>2]=0;c[Xa+4>>2]=6553616;Xa=Ya+32|0;c[Xa>>2]=0;c[Xa+4>>2]=0;Xa=Ya+40|0;c[Xa>>2]=1073741824;c[Xa+4>>2]=0;Xa=Ya+48|0;c[Xa>>2]=0;c[Xa+4>>2]=0;Xa=Ya+56|0;c[Xa>>2]=0;c[Xa+4>>2]=6684736;c[12181]=0;c[12182]=0;c[12183]=0;Xa=Jm(64)|0;Wa=Xa;c[12182]=Wa;c[12181]=Wa;c[12183]=Xa+64;if((Xa|0)==0){Zc=0}else{c[Wa>>2]=0;c[Wa+4>>2]=0;Zc=Wa}Wa=Zc+8|0;c[12182]=Wa;c[Wa>>2]=536870912;c[Wa+4>>2]=0;Wa=(c[12182]|0)+8|0;c[12182]=Wa;c[Wa>>2]=0;c[Wa+4>>2]=0;Wa=(c[12182]|0)+8|0;c[12182]=Wa;c[Wa>>2]=0;c[Wa+4>>2]=6553616;Wa=(c[12182]|0)+8|0;c[12182]=Wa;c[Wa>>2]=0;c[Wa+4>>2]=0;Wa=(c[12182]|0)+8|0;c[12182]=Wa;c[Wa>>2]=1073741824;c[Wa+4>>2]=0;Wa=(c[12182]|0)+8|0;c[12182]=Wa;Zc=Ya+48|0;Xa=c[Zc+4>>2]|0;c[Wa>>2]=c[Zc>>2];c[Wa+4>>2]=Xa;Xa=(c[12182]|0)+8|0;c[12182]=Xa;Wa=Ya+56|0;Ya=c[Wa+4>>2]|0;c[Xa>>2]=c[Wa>>2];c[Xa+4>>2]=Ya;c[12182]=(c[12182]|0)+8;Ya=Za|0;c[Ya>>2]=0;c[Ya+4>>2]=0;Ya=Za+8|0;c[Ya>>2]=1073741824;c[Ya+4>>2]=0;Ya=Za+16|0;c[Ya>>2]=0;c[Ya+4>>2]=0;Ya=Za+24|0;c[Ya>>2]=0;c[Ya+4>>2]=6619168;Ya=Za+32|0;c[Ya>>2]=0;c[Ya+4>>2]=0;Ya=Za+40|0;c[Ya>>2]=-2147483648;c[Ya+4>>2]=0;Ya=Za+48|0;c[Ya>>2]=0;c[Ya+4>>2]=0;Ya=Za+56|0;c[Ya>>2]=0;c[Ya+4>>2]=6750336;c[12184]=0;c[12185]=0;c[12186]=0;Ya=Jm(64)|0;Xa=Ya;c[12185]=Xa;c[12184]=Xa;c[12186]=Ya+64;if((Ya|0)==0){_c=0}else{c[Xa>>2]=0;c[Xa+4>>2]=0;_c=Xa}Xa=_c+8|0;c[12185]=Xa;c[Xa>>2]=1073741824;c[Xa+4>>2]=0;Xa=(c[12185]|0)+8|0;c[12185]=Xa;c[Xa>>2]=0;c[Xa+4>>2]=0;Xa=(c[12185]|0)+8|0;c[12185]=Xa;c[Xa>>2]=0;c[Xa+4>>2]=6619168;Xa=(c[12185]|0)+8|0;c[12185]=Xa;c[Xa>>2]=0;c[Xa+4>>2]=0;Xa=(c[12185]|0)+8|0;c[12185]=Xa;c[Xa>>2]=-2147483648;c[Xa+4>>2]=0;Xa=(c[12185]|0)+8|0;c[12185]=Xa;_c=Za+48|0;Ya=c[_c+4>>2]|0;c[Xa>>2]=c[_c>>2];c[Xa+4>>2]=Ya;Ya=(c[12185]|0)+8|0;c[12185]=Ya;Xa=Za+56|0;Za=c[Xa+4>>2]|0;c[Ya>>2]=c[Xa>>2];c[Ya+4>>2]=Za;c[12185]=(c[12185]|0)+8;Za=_a|0;c[Za>>2]=0;c[Za+4>>2]=0;Za=_a+8|0;c[Za>>2]=0;c[Za+4>>2]=1;Za=_a+16|0;c[Za>>2]=0;c[Za+4>>2]=0;Za=_a+24|0;c[Za>>2]=0;c[Za+4>>2]=6816e3;Za=_a+32|0;c[Za>>2]=0;c[Za+4>>2]=0;Za=_a+40|0;c[Za>>2]=-2147483648;c[Za+4>>2]=0;Za=_a+48|0;c[Za>>2]=0;c[Za+4>>2]=0;Za=_a+56|0;c[Za>>2]=0;c[Za+4>>2]=6684736;c[12187]=0;c[12188]=0;c[12189]=0;Za=Jm(64)|0;Ya=Za;c[12188]=Ya;c[12187]=Ya;c[12189]=Za+64;if((Za|0)==0){$c=0}else{c[Ya>>2]=0;c[Ya+4>>2]=0;$c=Ya}Ya=$c+8|0;c[12188]=Ya;c[Ya>>2]=0;c[Ya+4>>2]=1;Ya=(c[12188]|0)+8|0;c[12188]=Ya;c[Ya>>2]=0;c[Ya+4>>2]=0;Ya=(c[12188]|0)+8|0;c[12188]=Ya;c[Ya>>2]=0;c[Ya+4>>2]=6816e3;Ya=(c[12188]|0)+8|0;c[12188]=Ya;c[Ya>>2]=0;c[Ya+4>>2]=0;Ya=(c[12188]|0)+8|0;c[12188]=Ya;c[Ya>>2]=-2147483648;c[Ya+4>>2]=0;Ya=(c[12188]|0)+8|0;c[12188]=Ya;$c=_a+48|0;Za=c[$c+4>>2]|0;c[Ya>>2]=c[$c>>2];c[Ya+4>>2]=Za;Za=(c[12188]|0)+8|0;c[12188]=Za;Ya=_a+56|0;_a=c[Ya+4>>2]|0;c[Za>>2]=c[Ya>>2];c[Za+4>>2]=_a;c[12188]=(c[12188]|0)+8;_a=ab|0;c[_a>>2]=0;c[_a+4>>2]=0;_a=ab+8|0;c[_a>>2]=0;c[_a+4>>2]=2;_a=ab+16|0;c[_a>>2]=0;c[_a+4>>2]=0;_a=ab+24|0;c[_a>>2]=0;c[_a+4>>2]=6881792;_a=ab+32|0;c[_a>>2]=0;c[_a+4>>2]=0;_a=ab+40|0;c[_a>>2]=0;c[_a+4>>2]=1;_a=ab+48|0;c[_a>>2]=0;c[_a+4>>2]=0;_a=ab+56|0;c[_a>>2]=0;c[_a+4>>2]=6750336;c[12190]=0;c[12191]=0;c[12192]=0;_a=Jm(64)|0;Za=_a;c[12191]=Za;c[12190]=Za;c[12192]=_a+64;if((_a|0)==0){ad=0}else{c[Za>>2]=0;c[Za+4>>2]=0;ad=Za}Za=ad+8|0;c[12191]=Za;c[Za>>2]=0;c[Za+4>>2]=2;Za=(c[12191]|0)+8|0;c[12191]=Za;c[Za>>2]=0;c[Za+4>>2]=0;Za=(c[12191]|0)+8|0;c[12191]=Za;c[Za>>2]=0;c[Za+4>>2]=6881792;Za=(c[12191]|0)+8|0;c[12191]=Za;c[Za>>2]=0;c[Za+4>>2]=0;Za=(c[12191]|0)+8|0;c[12191]=Za;c[Za>>2]=0;c[Za+4>>2]=1;Za=(c[12191]|0)+8|0;c[12191]=Za;ad=ab+48|0;_a=c[ad+4>>2]|0;c[Za>>2]=c[ad>>2];c[Za+4>>2]=_a;_a=(c[12191]|0)+8|0;c[12191]=_a;Za=ab+56|0;ab=c[Za+4>>2]|0;c[_a>>2]=c[Za>>2];c[_a+4>>2]=ab;c[12191]=(c[12191]|0)+8;ab=bb|0;c[ab>>2]=0;c[ab+4>>2]=0;ab=bb+8|0;c[ab>>2]=0;c[ab+4>>2]=2;ab=bb+16|0;c[ab>>2]=0;c[ab+4>>2]=0;ab=bb+24|0;c[ab>>2]=0;c[ab+4>>2]=6816e3;ab=bb+32|0;c[ab>>2]=0;c[ab+4>>2]=0;ab=bb+40|0;c[ab>>2]=0;c[ab+4>>2]=4;ab=bb+48|0;c[ab>>2]=0;c[ab+4>>2]=0;ab=bb+56|0;c[ab>>2]=0;c[ab+4>>2]=6947840;c[12193]=0;c[12194]=0;c[12195]=0;ab=Jm(64)|0;_a=ab;c[12194]=_a;c[12193]=_a;c[12195]=ab+64;if((ab|0)==0){bd=0}else{c[_a>>2]=0;c[_a+4>>2]=0;bd=_a}_a=bd+8|0;c[12194]=_a;c[_a>>2]=0;c[_a+4>>2]=2;_a=(c[12194]|0)+8|0;c[12194]=_a;c[_a>>2]=0;c[_a+4>>2]=0;_a=(c[12194]|0)+8|0;c[12194]=_a;c[_a>>2]=0;c[_a+4>>2]=6816e3;_a=(c[12194]|0)+8|0;c[12194]=_a;c[_a>>2]=0;c[_a+4>>2]=0;_a=(c[12194]|0)+8|0;c[12194]=_a;c[_a>>2]=0;c[_a+4>>2]=4;_a=(c[12194]|0)+8|0;c[12194]=_a;bd=bb+48|0;ab=c[bd+4>>2]|0;c[_a>>2]=c[bd>>2];c[_a+4>>2]=ab;ab=(c[12194]|0)+8|0;c[12194]=ab;_a=bb+56|0;bb=c[_a+4>>2]|0;c[ab>>2]=c[_a>>2];c[ab+4>>2]=bb;c[12194]=(c[12194]|0)+8;bb=cb|0;c[bb>>2]=0;c[bb+4>>2]=0;bb=cb+8|0;c[bb>>2]=0;c[bb+4>>2]=4;bb=cb+16|0;c[bb>>2]=0;c[bb+4>>2]=0;bb=cb+24|0;c[bb>>2]=0;c[bb+4>>2]=6881792;bb=cb+32|0;c[bb>>2]=0;c[bb+4>>2]=0;bb=cb+40|0;c[bb>>2]=0;c[bb+4>>2]=4;bb=cb+48|0;c[bb>>2]=0;c[bb+4>>2]=0;bb=cb+56|0;c[bb>>2]=0;c[bb+4>>2]=6488072;c[12196]=0;c[12197]=0;c[12198]=0;bb=Jm(64)|0;ab=bb;c[12197]=ab;c[12196]=ab;c[12198]=bb+64;if((bb|0)==0){cd=0;dd=cd+8|0;c[12197]=dd;ed=0;fd=4;gd=dd|0;c[gd>>2]=ed;hd=dd+4|0;c[hd>>2]=fd;id=c[12197]|0;jd=id+8|0;c[12197]=jd;kd=0;ld=0;md=jd|0;c[md>>2]=kd;nd=jd+4|0;c[nd>>2]=ld;od=c[12197]|0;pd=od+8|0;c[12197]=pd;qd=0;rd=6881792;sd=pd|0;c[sd>>2]=qd;td=pd+4|0;c[td>>2]=rd;ud=c[12197]|0;vd=ud+8|0;c[12197]=vd;wd=0;xd=0;yd=vd|0;c[yd>>2]=wd;zd=vd+4|0;c[zd>>2]=xd;Ad=c[12197]|0;Bd=Ad+8|0;c[12197]=Bd;Cd=0;Dd=4;Ed=Bd|0;c[Ed>>2]=Cd;Fd=Bd+4|0;c[Fd>>2]=Dd;Gd=c[12197]|0;Hd=Gd+8|0;c[12197]=Hd;Id=cb+48|0;Jd=Id|0;Kd=c[Jd>>2]|0;Ld=Id+4|0;Md=c[Ld>>2]|0;Nd=Hd|0;c[Nd>>2]=Kd;Od=Hd+4|0;c[Od>>2]=Md;Pd=c[12197]|0;Qd=Pd+8|0;c[12197]=Qd;Rd=cb+56|0;Sd=Rd|0;Td=c[Sd>>2]|0;Ud=Rd+4|0;Vd=c[Ud>>2]|0;Wd=Qd|0;c[Wd>>2]=Td;Xd=Qd+4|0;c[Xd>>2]=Vd;Yd=c[12197]|0;Zd=Yd+8|0;c[12197]=Zd;_d=$a(256,0,u|0)|0;i=a;return}c[ab>>2]=0;c[ab+4>>2]=0;cd=ab;dd=cd+8|0;c[12197]=dd;ed=0;fd=4;gd=dd|0;c[gd>>2]=ed;hd=dd+4|0;c[hd>>2]=fd;id=c[12197]|0;jd=id+8|0;c[12197]=jd;kd=0;ld=0;md=jd|0;c[md>>2]=kd;nd=jd+4|0;c[nd>>2]=ld;od=c[12197]|0;pd=od+8|0;c[12197]=pd;qd=0;rd=6881792;sd=pd|0;c[sd>>2]=qd;td=pd+4|0;c[td>>2]=rd;ud=c[12197]|0;vd=ud+8|0;c[12197]=vd;wd=0;xd=0;yd=vd|0;c[yd>>2]=wd;zd=vd+4|0;c[zd>>2]=xd;Ad=c[12197]|0;Bd=Ad+8|0;c[12197]=Bd;Cd=0;Dd=4;Ed=Bd|0;c[Ed>>2]=Cd;Fd=Bd+4|0;c[Fd>>2]=Dd;Gd=c[12197]|0;Hd=Gd+8|0;c[12197]=Hd;Id=cb+48|0;Jd=Id|0;Kd=c[Jd>>2]|0;Ld=Id+4|0;Md=c[Ld>>2]|0;Nd=Hd|0;c[Nd>>2]=Kd;Od=Hd+4|0;c[Od>>2]=Md;Pd=c[12197]|0;Qd=Pd+8|0;c[12197]=Qd;Rd=cb+56|0;Sd=Rd|0;Td=c[Sd>>2]|0;Ud=Rd+4|0;Vd=c[Ud>>2]|0;Wd=Qd|0;c[Wd>>2]=Td;Xd=Qd+4|0;c[Xd>>2]=Vd;Yd=c[12197]|0;Zd=Yd+8|0;c[12197]=Zd;_d=$a(256,0,u|0)|0;i=a;return}function bd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;a=48796;while(1){b=a-12|0;d=c[b>>2]|0;e=d;if((d|0)!=0){f=a-12+4|0;g=c[f>>2]|0;if((d|0)!=(g|0)){c[f>>2]=g+(~((g-8-e|0)>>>3)<<3)}Lm(d)}if((b|0)==47512){break}else{a=b}}return}function cd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b=c[a>>2]|0;d=(c[a+4>>2]|0)-b|0;a=d>>2;if(a>>>0>3>>>0){e=0;return e|0}L4:do{if((d|0)>0){f=0;g=10116;while(1){h=0;while(1){i=h+1|0;if((c[10104+(f<<4)+(h<<2)>>2]|0)!=(c[b+(h<<2)>>2]|0)){j=h;break}if((i|0)<(a|0)){h=i}else{j=i;break}}if((j|0)==(a|0)){if((a|0)==3){k=g;break L4}if((c[10104+(f<<4)+(a<<2)>>2]|0)==0){k=g;break L4}}h=f+1|0;i=10116+(h<<4)|0;if((c[i>>2]|0)==0){e=0;break}else{f=h;g=i}}return e|0}else{g=0;f=10116;while(1){if((a|0)==0){if((c[10104+(g<<4)>>2]|0)==0){k=f;break L4}}i=g+1|0;h=10116+(i<<4)|0;if((c[h>>2]|0)==0){e=0;break}else{g=i;f=h}}return e|0}}while(0);e=c[k>>2]|0;return e|0}function dd(a){a=a|0;var b=0,d=0,e=0;a=c[o>>2]|0;Vk(51776,a,51904);c[13192]=4412;c[13194]=4432;c[13193]=0;ae(52776,51776);c[13212]=0;c[13213]=-1;b=c[t>>2]|0;Wk(51680,b,51912);c[13126]=4316;c[13127]=4336;ae(52508,51680);c[13145]=0;c[13146]=-1;d=c[r>>2]|0;Wk(51728,d,51920);c[13170]=4316;c[13171]=4336;ae(52684,51728);c[13189]=0;c[13190]=-1;e=c[(c[(c[13170]|0)-12>>2]|0)+52704>>2]|0;c[13148]=4316;c[13149]=4336;ae(52596,e);c[13167]=0;c[13168]=-1;c[(c[(c[13192]|0)-12>>2]|0)+52840>>2]=52504;e=(c[(c[13170]|0)-12>>2]|0)+52684|0;c[e>>2]=c[e>>2]|8192;c[(c[(c[13170]|0)-12>>2]|0)+52752>>2]=52504;Xk(51624,a,51928);c[13104]=4364;c[13106]=4384;c[13105]=0;ae(52424,51624);c[13124]=0;c[13125]=-1;Yk(51528,b,51936);c[13034]=4268;c[13035]=4288;ae(52140,51528);c[13053]=0;c[13054]=-1;Yk(51576,d,51944);c[13078]=4268;c[13079]=4288;ae(52316,51576);c[13097]=0;c[13098]=-1;d=c[(c[(c[13078]|0)-12>>2]|0)+52336>>2]|0;c[13056]=4268;c[13057]=4288;ae(52228,d);c[13075]=0;c[13076]=-1;c[(c[(c[13104]|0)-12>>2]|0)+52488>>2]=52136;d=(c[(c[13078]|0)-12>>2]|0)+52316|0;c[d>>2]=c[d>>2]|8192;c[(c[(c[13078]|0)-12>>2]|0)+52384>>2]=52136;return}function ed(a){a=a|0;He(52504)|0;He(52592)|0;Ne(52136)|0;Ne(52224)|0;return}function fd(a){a=a|0;return}function gd(a){a=a|0;var b=0;b=a+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function hd(a){a=a|0;var b=0,d=0;b=a+4|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){d=0;return d|0}ic[c[(c[a>>2]|0)+8>>2]&511](a);d=1;return d|0}function id(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=2496;d=cn(b|0)|0;e=Km(d+13|0)|0;c[e+4>>2]=d;c[e>>2]=d;f=e+12|0;c[a+4>>2]=f;c[e+8>>2]=0;an(f|0,b|0,d+1|0)|0;return}function jd(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=2496;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;Lm(e);return}Mm((c[b>>2]|0)-12|0);e=a;Lm(e);return}function kd(a){a=a|0;var b=0;c[a>>2]=2496;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}Mm((c[b>>2]|0)-12|0);return}function ld(a){a=a|0;return c[a+4>>2]|0}function md(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;c[b>>2]=2432;if((a[d]&1)==0){e=d+1|0}else{e=c[d+8>>2]|0}d=cn(e|0)|0;f=Km(d+13|0)|0;c[f+4>>2]=d;c[f>>2]=d;g=f+12|0;c[b+4>>2]=g;c[f+8>>2]=0;an(g|0,e|0,d+1|0)|0;return}function nd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=2432;d=cn(b|0)|0;e=Km(d+13|0)|0;c[e+4>>2]=d;c[e>>2]=d;f=e+12|0;c[a+4>>2]=f;c[e+8>>2]=0;an(f|0,b|0,d+1|0)|0;return}function od(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=2432;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;Lm(e);return}Mm((c[b>>2]|0)-12|0);e=a;Lm(e);return}function pd(a){a=a|0;var b=0;c[a>>2]=2432;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}Mm((c[b>>2]|0)-12|0);return}function qd(a){a=a|0;return c[a+4>>2]|0}function rd(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=2496;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;Lm(e);return}Mm((c[b>>2]|0)-12|0);e=a;Lm(e);return}function sd(a){a=a|0;var b=0;c[a>>2]=2496;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}Mm((c[b>>2]|0)-12|0);return}function td(a){a=a|0;return}function ud(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function vd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;wc[c[(c[a>>2]|0)+12>>2]&7](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){g=0;i=e;return g|0}g=(c[f>>2]|0)==(c[d>>2]|0);i=e;return g|0}function wd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[b+4>>2]|0)!=(a|0)){e=0;return e|0}e=(c[b>>2]|0)==(d|0);return e|0}function xd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;d=Hb(e|0)|0;e=cn(d|0)|0;if(e>>>0>4294967279>>>0){Dd(b)}if(e>>>0<11>>>0){a[b]=e<<1;f=b+1|0;an(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=Jm(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;an(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function yd(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;h=f;j=i;i=i+12|0;i=i+7&-8;k=e|0;l=c[k>>2]|0;do{if((l|0)!=0){m=d[h]|0;if((m&1|0)==0){n=m>>>1}else{n=c[f+4>>2]|0}if((n|0)==0){o=l}else{Nd(f,1360)|0;o=c[k>>2]|0}m=c[e+4>>2]|0;wc[c[(c[m>>2]|0)+24>>2]&7](j,m,o);m=j;p=a[m]|0;if((p&1)==0){q=j+1|0}else{q=c[j+8>>2]|0}r=p&255;if((r&1|0)==0){s=r>>>1}else{s=c[j+4>>2]|0}r=f;p=a[h]|0;if((p&1)==0){t=10;u=p}else{p=c[f>>2]|0;t=(p&-2)-1|0;u=p&255}p=u&255;if((p&1|0)==0){v=p>>>1}else{v=c[f+4>>2]|0}do{if((t-v|0)>>>0<s>>>0){Pd(f,t,s-t+v|0,v,v,0,s,q)}else{if((s|0)==0){break}if((u&1)==0){w=r+1|0}else{w=c[f+8>>2]|0}an(w+v|0,q|0,s)|0;p=v+s|0;if((a[h]&1)==0){a[h]=p<<1}else{c[f+4>>2]=p}a[w+p|0]=0}}while(0);if((a[m]&1)==0){break}Lm(c[j+8>>2]|0)}}while(0);j=b;c[j>>2]=c[h>>2];c[j+4>>2]=c[h+4>>2];c[j+8>>2]=c[h+8>>2];bn(h|0,0,12)|0;i=g;return}function zd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+32|0;g=d;d=i;i=i+8|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];g=f|0;h=f+16|0;j=cn(e|0)|0;if(j>>>0>4294967279>>>0){Dd(h)}if(j>>>0<11>>>0){a[h]=j<<1;k=h+1|0}else{l=j+16&-16;m=Jm(l)|0;c[h+8>>2]=m;c[h>>2]=l|1;c[h+4>>2]=j;k=m}an(k|0,e|0,j)|0;a[k+j|0]=0;yd(g,d,h);md(b|0,g);if((a[g]&1)!=0){Lm(c[g+8>>2]|0)}if((a[h]&1)!=0){Lm(c[h+8>>2]|0)}c[b>>2]=4456;h=d;d=b+8|0;b=c[h+4>>2]|0;c[d>>2]=c[h>>2];c[d+4>>2]=b;i=f;return}function Ad(a){a=a|0;pd(a|0);Lm(a);return}function Bd(a){a=a|0;pd(a|0);return}function Cd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e;if((c[a>>2]|0)==1){do{Sa(51856,51832)|0;}while((c[a>>2]|0)==1)}if((c[a>>2]|0)!=0){f;return}c[a>>2]=1;g;ic[d&511](b);h;c[a>>2]=-1;i;Bb(51856)|0;return}function Dd(a){a=a|0;a=Yb(8)|0;id(a,320);c[a>>2]=2464;vb(a|0,8120,36)}function Ed(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d;if((a[e]&1)==0){f=b;c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];return}e=c[d+8>>2]|0;f=c[d+4>>2]|0;if(f>>>0>4294967279>>>0){Dd(b)}if(f>>>0<11>>>0){a[b]=f<<1;g=b+1|0}else{d=f+16&-16;h=Jm(d)|0;c[b+8>>2]=h;c[b>>2]=d|1;c[b+4>>2]=f;g=h}an(g|0,e|0,f)|0;a[g+f|0]=0;return}function Fd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if(e>>>0>4294967279>>>0){Dd(b)}if(e>>>0<11>>>0){a[b]=e<<1;f=b+1|0;an(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=Jm(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;an(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function Gd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if(d>>>0>4294967279>>>0){Dd(b)}if(d>>>0<11>>>0){a[b]=d<<1;f=b+1|0}else{g=d+16&-16;h=Jm(g)|0;c[b+8>>2]=h;c[b>>2]=g|1;c[b+4>>2]=d;f=h}bn(f|0,e|0,d|0)|0;a[f+d|0]=0;return}function Hd(b){b=b|0;if((a[b]&1)==0){return}Lm(c[b+8>>2]|0);return}function Id(a,b){a=a|0;b=b|0;return Jd(a,b,cn(b|0)|0)|0}function Jd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;g=b;h=a[g]|0;if((h&1)==0){i=10;j=h}else{h=c[b>>2]|0;i=(h&-2)-1|0;j=h&255}if(i>>>0>=e>>>0){if((j&1)==0){k=f+1|0}else{k=c[b+8>>2]|0}dn(k|0,d|0,e|0)|0;a[k+e|0]=0;if((a[g]&1)==0){a[g]=e<<1;return b|0}else{c[b+4>>2]=e;return b|0}}if((-18-i|0)>>>0<(e-i|0)>>>0){Dd(b);return 0}if((j&1)==0){l=f+1|0}else{l=c[b+8>>2]|0}do{if(i>>>0<2147483623>>>0){f=i<<1;j=f>>>0>e>>>0?f:e;if(j>>>0<11>>>0){m=11;break}m=j+16&-16}else{m=-17}}while(0);j=Jm(m)|0;if((e|0)!=0){an(j|0,d|0,e)|0}if((i|0)!=10){Lm(l)}c[b+8>>2]=j;c[b>>2]=m|1;c[b+4>>2]=e;a[j+e|0]=0;return b|0}function Kd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;g=a[f]|0;h=g&255;if((h&1|0)==0){i=h>>>1}else{i=c[b+4>>2]|0}if(i>>>0<d>>>0){Ld(b,d-i|0,e)|0;return}if((g&1)==0){a[b+1+d|0]=0;a[f]=d<<1;return}else{a[(c[b+8>>2]|0)+d|0]=0;c[b+4>>2]=d;return}}function Ld(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((d|0)==0){return b|0}f=b;g=b;h=a[g]|0;if((h&1)==0){i=10;j=h}else{h=c[b>>2]|0;i=(h&-2)-1|0;j=h&255}h=j&255;if((h&1|0)==0){k=h>>>1}else{k=c[b+4>>2]|0}if((i-k|0)>>>0<d>>>0){h=k+d|0;if((-17-i|0)>>>0<(h-i|0)>>>0){Dd(b);return 0}if((j&1)==0){l=f+1|0}else{l=c[b+8>>2]|0}do{if(i>>>0<2147483623>>>0){m=i<<1;n=h>>>0<m>>>0?m:h;if(n>>>0<11>>>0){o=11;break}o=n+16&-16}else{o=-17}}while(0);h=Jm(o)|0;if((k|0)!=0){an(h|0,l|0,k)|0}if((i|0)!=10){Lm(l)}c[b+8>>2]=h;h=o|1;c[b>>2]=h;p=h&255}else{p=j}if((p&1)==0){q=f+1|0}else{q=c[b+8>>2]|0}bn(q+k|0,e|0,d|0)|0;e=k+d|0;if((a[g]&1)==0){a[g]=e<<1}else{c[b+4>>2]=e}a[q+e|0]=0;return b|0}function Md(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;if(d>>>0>4294967279>>>0){Dd(b)}e=b;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}g=j>>>0>d>>>0?j:d;if(g>>>0<11>>>0){k=11}else{k=g+16&-16}g=k-1|0;if((g|0)==(h|0)){return}if((g|0)==10){l=e+1|0;m=c[b+8>>2]|0;n=1;o=0;p=i}else{if(g>>>0>h>>>0){q=Jm(k)|0}else{q=Jm(k)|0}h=a[f]|0;g=h&1;if(g<<24>>24==0){r=e+1|0}else{r=c[b+8>>2]|0}l=q;m=r;n=g<<24>>24!=0;o=1;p=h}h=p&255;if((h&1|0)==0){s=h>>>1}else{s=c[b+4>>2]|0}an(l|0,m|0,s+1|0)|0;if(n){Lm(m)}if(o){c[b>>2]=k|1;c[b+4>>2]=j;c[b+8>>2]=l;return}else{a[f]=j<<1;return}}function Nd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=cn(d|0)|0;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<e>>>0){Pd(b,h,e-h+j|0,j,j,0,e,d);return b|0}if((e|0)==0){return b|0}if((i&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}an(k+j|0,d|0,e)|0;d=j+e|0;if((a[f]&1)==0){a[f]=d<<1}else{c[b+4>>2]=d}a[k+d|0]=0;return b|0}function Od(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=b;f=b;g=a[f]|0;if((g&1)==0){h=(g&255)>>>1;i=10;j=g}else{k=c[b>>2]|0;h=c[b+4>>2]|0;i=(k&-2)-1|0;j=k&255}if((h|0)==(i|0)){if((i|0)==-17){Dd(b)}if((j&1)==0){l=e+1|0}else{l=c[b+8>>2]|0}do{if(i>>>0<2147483623>>>0){j=i+1|0;k=i<<1;m=j>>>0<k>>>0?k:j;if(m>>>0<11>>>0){n=11;break}n=m+16&-16}else{n=-17}}while(0);m=Jm(n)|0;an(m|0,l|0,i)|0;if((i|0)!=10){Lm(l)}c[b+8>>2]=m;m=n|1;c[b>>2]=m;o=m&255}else{o=g}if((o&1)==0){a[f]=(h<<1)+2;p=e+1|0;q=h+1|0;r=p+h|0;a[r]=d;s=p+q|0;a[s]=0;return}else{e=c[b+8>>2]|0;f=h+1|0;c[b+4>>2]=f;p=e;q=f;r=p+h|0;a[r]=d;s=p+q|0;a[s]=0;return}}function Pd(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((-18-d|0)>>>0<e>>>0){Dd(b)}if((a[b]&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<11>>>0){o=11;break}o=n+16&-16}else{o=-17}}while(0);e=Jm(o)|0;if((g|0)!=0){an(e|0,k|0,g)|0}if((i|0)!=0){an(e+g|0,j|0,i)|0}j=f-h|0;if((j|0)!=(g|0)){an(e+(i+g)|0,k+(h+g)|0,j-g|0)|0}if((d|0)==10){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}Lm(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}function Qd(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((-17-d|0)>>>0<e>>>0){Dd(b)}if((a[b]&1)==0){j=b+1|0}else{j=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<11>>>0){n=11;break}n=m+16&-16}else{n=-17}}while(0);e=Jm(n)|0;if((g|0)!=0){an(e|0,j|0,g)|0}m=f-h|0;if((m|0)!=(g|0)){an(e+(i+g)|0,j+(h+g)|0,m-g|0)|0}if((d|0)==10){o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}Lm(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function Rd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(e>>>0>1073741807>>>0){Dd(b)}if(e>>>0<2>>>0){a[b]=e<<1;f=b+4|0;g=fm(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}else{i=e+4&-4;j=Jm(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=e;f=j;g=fm(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}}function Sd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(d>>>0>1073741807>>>0){Dd(b)}if(d>>>0<2>>>0){a[b]=d<<1;f=b+4|0;g=hm(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}else{i=d+4&-4;j=Jm(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=d;f=j;g=hm(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}}function Td(b){b=b|0;if((a[b]&1)==0){return}Lm(c[b+8>>2]|0);return}function Ud(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=em(d)|0;f=b;g=a[f]|0;if((g&1)==0){h=1;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}if(e>>>0>h>>>0){g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}Xd(b,h,e-h|0,j,0,j,e,d);return b|0}if((i&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}gm(k,d,e)|0;c[k+(e<<2)>>2]=0;if((a[f]&1)==0){a[f]=e<<1;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function Vd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if(d>>>0>1073741807>>>0){Dd(b)}e=b;f=a[e]|0;if((f&1)==0){g=1;h=f}else{f=c[b>>2]|0;g=(f&-2)-1|0;h=f&255}f=h&255;if((f&1|0)==0){i=f>>>1}else{i=c[b+4>>2]|0}f=i>>>0>d>>>0?i:d;if(f>>>0<2>>>0){j=2}else{j=f+4&-4}f=j-1|0;if((f|0)==(g|0)){return}if((f|0)==1){k=b+4|0;l=c[b+8>>2]|0;m=1;n=0;o=h}else{h=j<<2;if(f>>>0>g>>>0){p=Jm(h)|0}else{p=Jm(h)|0}h=a[e]|0;g=h&1;if(g<<24>>24==0){q=b+4|0}else{q=c[b+8>>2]|0}k=p;l=q;m=g<<24>>24!=0;n=1;o=h}h=k;k=o&255;if((k&1|0)==0){r=k>>>1}else{r=c[b+4>>2]|0}fm(h,l,r+1|0)|0;if(m){Lm(l)}if(n){c[b>>2]=j|1;c[b+4>>2]=i;c[b+8>>2]=h;return}else{a[e]=i<<1;return}}function Wd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b;f=a[e]|0;if((f&1)==0){g=(f&255)>>>1;h=1}else{g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}if((g|0)==(h|0)){Yd(b,h,1,h,h,0,0);i=a[e]|0}else{i=f}if((i&1)==0){a[e]=(g<<1)+2;j=b+4|0;k=g+1|0;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}else{e=c[b+8>>2]|0;i=g+1|0;c[b+4>>2]=i;j=e;k=i;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}}function Xd(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((1073741806-d|0)>>>0<e>>>0){Dd(b)}if((a[b]&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<2>>>0){o=2;break}o=n+4&-4}else{o=1073741807}}while(0);e=Jm(o<<2)|0;if((g|0)!=0){fm(e,k,g)|0}if((i|0)!=0){fm(e+(g<<2)|0,j,i)|0}j=f-h|0;if((j|0)!=(g|0)){fm(e+(i+g<<2)|0,k+(h+g<<2)|0,j-g|0)|0}if((d|0)==1){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}Lm(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}function Yd(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((1073741807-d|0)>>>0<e>>>0){Dd(b)}if((a[b]&1)==0){j=b+4|0}else{j=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<2>>>0){n=2;break}n=m+4&-4}else{n=1073741807}}while(0);e=Jm(n<<2)|0;if((g|0)!=0){fm(e,j,g)|0}m=f-h|0;if((m|0)!=(g|0)){fm(e+(i+g<<2)|0,j+(h+g<<2)|0,m-g|0)|0}if((d|0)==1){o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}Lm(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function Zd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=(c[b+24>>2]|0)==0;if(g){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if(((g&1|d)&c[b+20>>2]|0)==0){i=e;return}e=Yb(16)|0;do{if((a[52976]|0)==0){if((mb(52976)|0)==0){break}c[12710]=3960;$a(202,50840,u|0)|0}}while(0);b=gn(50840,0,32)|0;c[f>>2]=b|1;c[f+4>>2]=K;zd(e,f,1424);c[e>>2]=3144;vb(e|0,8664,32)}function _d(a){a=a|0;var b=0,d=0,e=0,f=0;c[a>>2]=3120;b=c[a+40>>2]|0;d=a+32|0;e=a+36|0;if((b|0)!=0){f=b;do{f=f-1|0;wc[c[(c[d>>2]|0)+(f<<2)>>2]&7](0,a,c[(c[e>>2]|0)+(f<<2)>>2]|0);}while((f|0)!=0)}Ji(a+28|0);Hm(c[d>>2]|0);Hm(c[e>>2]|0);Hm(c[a+48>>2]|0);Hm(c[a+60>>2]|0);return}function $d(a,b){a=a|0;b=b|0;Ii(a,b+28|0);return}function ae(a,b){a=a|0;b=b|0;c[a+24>>2]=b;c[a+16>>2]=(b|0)==0;c[a+20>>2]=0;c[a+4>>2]=4098;c[a+12>>2]=0;c[a+8>>2]=6;bn(a+32|0,0,40)|0;Hi(a+28|0);return}function be(a){a=a|0;c[a>>2]=4192;Ji(a+4|0);Lm(a);return}function ce(a){a=a|0;c[a>>2]=4192;Ji(a+4|0);return}function de(a,b){a=a|0;b=b|0;return}function ee(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function fe(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function ge(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function he(a){a=a|0;return 0}function ie(a){a=a|0;return 0}function je(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;if((e|0)<=0){g=0;return g|0}h=b+12|0;i=b+16|0;j=d;d=0;while(1){k=c[h>>2]|0;if(k>>>0<(c[i>>2]|0)>>>0){c[h>>2]=k+1;l=a[k]|0}else{k=mc[c[(c[f>>2]|0)+40>>2]&127](b)|0;if((k|0)==-1){g=d;m=9;break}l=k&255}a[j]=l;k=d+1|0;if((k|0)<(e|0)){j=j+1|0;d=k}else{g=k;m=10;break}}if((m|0)==10){return g|0}else if((m|0)==9){return g|0}return 0}function ke(a){a=a|0;return-1|0}function le(a){a=a|0;var b=0,e=0;if((mc[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){b=-1;return b|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+1;b=d[a]|0;return b|0}function me(a,b){a=a|0;b=b|0;return-1|0}function ne(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=b;if((f|0)<=0){h=0;return h|0}i=b+24|0;j=b+28|0;k=0;l=e;while(1){e=c[i>>2]|0;if(e>>>0<(c[j>>2]|0)>>>0){m=a[l]|0;c[i>>2]=e+1;a[e]=m}else{if((uc[c[(c[g>>2]|0)+52>>2]&31](b,d[l]|0)|0)==-1){h=k;n=9;break}}m=k+1|0;if((m|0)<(f|0)){k=m;l=l+1|0}else{h=m;n=10;break}}if((n|0)==9){return h|0}else if((n|0)==10){return h|0}return 0}function oe(a,b){a=a|0;b=b|0;return-1|0}function pe(a){a=a|0;c[a>>2]=4120;Ji(a+4|0);Lm(a);return}function qe(a){a=a|0;c[a>>2]=4120;Ji(a+4|0);return}function re(a,b){a=a|0;b=b|0;return}function se(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function te(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function ue(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function ve(a){a=a|0;return 0}function we(a){a=a|0;return 0}function xe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+12|0;h=a+16|0;i=b;b=0;while(1){j=c[g>>2]|0;if(j>>>0<(c[h>>2]|0)>>>0){c[g>>2]=j+4;k=c[j>>2]|0}else{j=mc[c[(c[e>>2]|0)+40>>2]&127](a)|0;if((j|0)==-1){f=b;l=10;break}else{k=j}}c[i>>2]=k;j=b+1|0;if((j|0)<(d|0)){i=i+4|0;b=j}else{f=j;l=8;break}}if((l|0)==10){return f|0}else if((l|0)==8){return f|0}return 0}function ye(a){a=a|0;return-1|0}function ze(a){a=a|0;var b=0,d=0;if((mc[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){b=-1;return b|0}d=a+12|0;a=c[d>>2]|0;c[d>>2]=a+4;b=c[a>>2]|0;return b|0}function Ae(a,b){a=a|0;b=b|0;return-1|0}function Be(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+24|0;h=a+28|0;i=0;j=b;while(1){b=c[g>>2]|0;if(b>>>0<(c[h>>2]|0)>>>0){k=c[j>>2]|0;c[g>>2]=b+4;c[b>>2]=k}else{if((uc[c[(c[e>>2]|0)+52>>2]&31](a,c[j>>2]|0)|0)==-1){f=i;l=9;break}}k=i+1|0;if((k|0)<(d|0)){i=k;j=j+4|0}else{f=k;l=8;break}}if((l|0)==8){return f|0}else if((l|0)==9){return f|0}return 0}function Ce(a,b){a=a|0;b=b|0;return-1|0}function De(a){a=a|0;_d(a+8|0);Lm(a);return}function Ee(a){a=a|0;_d(a+8|0);return}function Fe(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;_d(b+(d+8)|0);Lm(b+d|0);return}function Ge(a){a=a|0;_d(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function He(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){He(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((mc[c[(c[k>>2]|0)+24>>2]&127](k)|0)!=-1){break}k=c[(c[f>>2]|0)-12>>2]|0;Zd(h+k|0,c[h+(k+16)>>2]|1)}}while(0);Se(e);i=d;return b|0}function Ie(a){a=a|0;var b=0;b=a+16|0;c[b>>2]=c[b>>2]|1;if((c[a+20>>2]&1|0)==0){return}else{Ta()}}function Je(a){a=a|0;_d(a+8|0);Lm(a);return}function Ke(a){a=a|0;_d(a+8|0);return}function Le(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;_d(b+(d+8)|0);Lm(b+d|0);return}function Me(a){a=a|0;_d(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function Ne(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){Ne(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((mc[c[(c[k>>2]|0)+24>>2]&127](k)|0)!=-1){break}k=c[(c[f>>2]|0)-12>>2]|0;Zd(h+k|0,c[h+(k+16)>>2]|1)}}while(0);_e(e);i=d;return b|0}function Oe(a){a=a|0;_d(a+4|0);Lm(a);return}function Pe(a){a=a|0;_d(a+4|0);return}function Qe(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;_d(b+(d+4)|0);Lm(b+d|0);return}function Re(a){a=a|0;_d(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function Se(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(qb()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((mc[c[(c[e>>2]|0)+24>>2]&127](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;Zd(d+b|0,c[d+(b+16)>>2]|1);return}function Te(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+40|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=h|0;a[l]=0;c[h+4>>2]=b;m=b;n=c[(c[m>>2]|0)-12>>2]|0;o=b;do{if((c[o+(n+16)>>2]|0)==0){p=c[o+(n+72)>>2]|0;if((p|0)!=0){He(p)|0}a[l]=1;Ii(j,o+((c[(c[m>>2]|0)-12>>2]|0)+28)|0);p=Ki(j,52056)|0;Ji(j);q=c[(c[m>>2]|0)-12>>2]|0;r=c[o+(q+24)>>2]|0;s=o+(q+76)|0;t=c[s>>2]|0;if((t|0)==-1){Ii(g,o+(q+28)|0);u=Ki(g,52408)|0;v=uc[c[(c[u>>2]|0)+28>>2]&31](u,32)|0;Ji(g);c[s>>2]=v<<24>>24;w=v}else{w=t&255}t=c[(c[p>>2]|0)+16>>2]|0;c[f>>2]=r;tc[t&31](k,p,f,o+q|0,w,d);if((c[k>>2]|0)!=0){break}q=c[(c[m>>2]|0)-12>>2]|0;Zd(o+q|0,c[o+(q+16)>>2]|5)}}while(0);Se(h);i=e;return b|0}function Ue(b,d){b=b|0;d=+d;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+40|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=h|0;a[l]=0;c[h+4>>2]=b;m=b;n=c[(c[m>>2]|0)-12>>2]|0;o=b;do{if((c[o+(n+16)>>2]|0)==0){p=c[o+(n+72)>>2]|0;if((p|0)!=0){He(p)|0}a[l]=1;Ii(j,o+((c[(c[m>>2]|0)-12>>2]|0)+28)|0);p=Ki(j,52056)|0;Ji(j);q=c[(c[m>>2]|0)-12>>2]|0;r=c[o+(q+24)>>2]|0;s=o+(q+76)|0;t=c[s>>2]|0;if((t|0)==-1){Ii(g,o+(q+28)|0);u=Ki(g,52408)|0;v=uc[c[(c[u>>2]|0)+28>>2]&31](u,32)|0;Ji(g);c[s>>2]=v<<24>>24;w=v}else{w=t&255}t=c[(c[p>>2]|0)+32>>2]|0;c[f>>2]=r;oc[t&15](k,p,f,o+q|0,w,d);if((c[k>>2]|0)!=0){break}q=c[(c[m>>2]|0)-12>>2]|0;Zd(o+q|0,c[o+(q+16)>>2]|5)}}while(0);Se(h);i=e;return b|0}function Ve(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+8|0;f=e|0;g=f|0;a[g]=0;c[f+4>>2]=b;h=b;j=c[(c[h>>2]|0)-12>>2]|0;k=b;do{if((c[k+(j+16)>>2]|0)==0){l=c[k+(j+72)>>2]|0;if((l|0)!=0){He(l)|0}a[g]=1;l=c[k+((c[(c[h>>2]|0)-12>>2]|0)+24)>>2]|0;m=l;if((l|0)!=0){n=l+24|0;o=c[n>>2]|0;if((o|0)!=(c[l+28>>2]|0)){c[n>>2]=o+1;a[o]=d;break}if((uc[c[(c[l>>2]|0)+52>>2]&31](m,d&255)|0)!=-1){break}}m=c[(c[h>>2]|0)-12>>2]|0;Zd(k+m|0,c[k+(m+16)>>2]|1)}}while(0);Se(f);i=e;return b|0}function We(a){a=a|0;_d(a+4|0);Lm(a);return}function Xe(a){a=a|0;_d(a+4|0);return}function Ye(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;_d(b+(d+4)|0);Lm(b+d|0);return}function Ze(a){a=a|0;_d(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function _e(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(qb()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((mc[c[(c[e>>2]|0)+24>>2]&127](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;Zd(d+b|0,c[d+(b+16)>>2]|1);return}function $e(a){a=a|0;return 1536}function af(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)==1){Fd(a,1680,35);return}else{xd(a,b|0,c);return}}function bf(a){a=a|0;Bd(a|0);Lm(a);return}function cf(a){a=a|0;Bd(a|0);return}function df(a){a=a|0;_d(a);Lm(a);return}function ef(a){a=a|0;fd(a|0);Lm(a);return}function ff(a){a=a|0;fd(a|0);return}function gf(a){a=a|0;fd(a|0);return}function hf(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L1:do{if((e|0)==(f|0)){g=c}else{b=c;h=e;while(1){if((b|0)==(d|0)){i=-1;j=11;break}k=a[b]|0;l=a[h]|0;if(k<<24>>24<l<<24>>24){i=-1;j=9;break}if(l<<24>>24<k<<24>>24){i=1;j=10;break}k=b+1|0;l=h+1|0;if((l|0)==(f|0)){g=k;break L1}else{b=k;h=l}}if((j|0)==9){return i|0}else if((j|0)==11){return i|0}else if((j|0)==10){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function jf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;d=f-e|0;if(d>>>0>4294967279>>>0){Dd(b)}if(d>>>0<11>>>0){a[b]=d<<1;g=b+1|0}else{h=d+16&-16;i=Jm(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=d;g=i}if((e|0)==(f|0)){j=g;a[j]=0;return}else{k=g;l=e}while(1){a[k]=a[l]|0;e=l+1|0;if((e|0)==(f|0)){break}else{k=k+1|0;l=e}}j=g+d|0;a[j]=0;return}function kf(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;if((c|0)==(d|0)){e=0;return e|0}else{f=c;g=0}while(1){c=(a[f]|0)+(g<<4)|0;b=c&-268435456;h=(b>>>24|b)^c;c=f+1|0;if((c|0)==(d|0)){e=h;break}else{f=c;g=h}}return e|0}function lf(a){a=a|0;fd(a|0);Lm(a);return}function mf(a){a=a|0;fd(a|0);return}function nf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L1:do{if((e|0)==(f|0)){g=b;h=6}else{a=b;i=e;while(1){if((a|0)==(d|0)){j=-1;break L1}k=c[a>>2]|0;l=c[i>>2]|0;if((k|0)<(l|0)){j=-1;break L1}if((l|0)<(k|0)){j=1;break L1}k=a+4|0;l=i+4|0;if((l|0)==(f|0)){g=k;h=6;break}else{a=k;i=l}}}}while(0);if((h|0)==6){j=(g|0)!=(d|0)|0}return j|0}function of(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;d=e;g=f-d|0;h=g>>2;if(h>>>0>1073741807>>>0){Dd(b)}if(h>>>0<2>>>0){a[b]=g>>>1;i=b+4|0}else{g=h+4&-4;j=Jm(g<<2)|0;c[b+8>>2]=j;c[b>>2]=g|1;c[b+4>>2]=h;i=j}if((e|0)==(f|0)){k=i;c[k>>2]=0;return}j=(f-4-d|0)>>>2;d=i;h=e;while(1){c[d>>2]=c[h>>2];e=h+4|0;if((e|0)==(f|0)){break}else{d=d+4|0;h=e}}k=i+(j+1<<2)|0;c[k>>2]=0;return}function pf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((b|0)==(d|0)){e=0;return e|0}else{f=b;g=0}while(1){b=(c[f>>2]|0)+(g<<4)|0;a=b&-268435456;h=(a>>>24|a)^b;b=f+4|0;if((b|0)==(d|0)){e=h;break}else{f=b;g=h}}return e|0}function qf(a){a=a|0;fd(a|0);Lm(a);return}function rf(a){a=a|0;fd(a|0);return}function sf(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];nc[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==1){a[j]=1}else if((w|0)==0){a[j]=0}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}$d(r,g);q=r|0;r=c[q>>2]|0;if((c[13102]|0)!=-1){c[m>>2]=52408;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52408,m,104)}m=(c[13103]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;hd(c[q>>2]|0)|0;$d(s,g);n=s|0;p=c[n>>2]|0;if((c[13006]|0)!=-1){c[l>>2]=52024;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52024,l,104)}d=(c[13007]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;hd(c[n>>2]|0)|0;z=t|0;A=x;jc[c[(c[A>>2]|0)+24>>2]&127](z,y);jc[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(_k(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];Hd(t+12|0);Hd(t|0);i=k;return}}while(0);o=Yb(4)|0;jm(o);vb(o|0,8088,140)}}while(0);k=Yb(4)|0;jm(k);vb(k|0,8088,140)}function tf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];$k(a,b,k,l,f,g,h);i=j;return}function uf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];al(a,b,k,l,f,g,h);i=j;return}function vf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];bl(a,b,k,l,f,g,h);i=j;return}function wf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];cl(a,b,k,l,f,g,h);i=j;return}function xf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];dl(a,b,k,l,f,g,h);i=j;return}function yf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];el(a,b,k,l,f,g,h);i=j;return}function zf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];fl(a,b,k,l,f,g,h);i=j;return}function Af(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];gl(a,b,k,l,f,g,h);i=j;return}function Bf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];hl(a,b,k,l,f,g,h);i=j;return}function Cf(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+48|0;o=n;p=i;i=i+4|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;r=i;i=i+160|0;bn(o|0,0,12)|0;s=q;$d(p,h);h=p|0;p=c[h>>2]|0;if((c[13102]|0)!=-1){c[l>>2]=52408;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52408,l,104)}l=(c[13103]|0)-1|0;t=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-t>>2>>>0>l>>>0){u=c[t+(l<<2)>>2]|0;if((u|0)==0){break}v=m|0;fc[c[(c[u>>2]|0)+32>>2]&15](u,9632,9658,v)|0;hd(c[h>>2]|0)|0;bn(s|0,0,12)|0;u=q;Kd(q,10,0);if((a[s]&1)==0){w=u+1|0;x=w;y=w;z=q+8|0}else{w=q+8|0;x=c[w>>2]|0;y=u+1|0;z=w}w=f|0;u=g|0;A=q|0;B=q+4|0;C=m+24|0;D=m+25|0;E=r;F=m+26|0;G=m;H=n+4|0;I=x;J=0;K=r|0;L=x;M=c[w>>2]|0;L14:while(1){do{if((M|0)==0){N=0}else{if((c[M+12>>2]|0)!=(c[M+16>>2]|0)){N=M;break}if((mc[c[(c[M>>2]|0)+36>>2]&127](M)|0)!=-1){N=M;break}c[w>>2]=0;N=0}}while(0);O=(N|0)==0;P=c[u>>2]|0;do{if((P|0)==0){Q=25}else{if((c[P+12>>2]|0)!=(c[P+16>>2]|0)){if(O){break}else{R=I;break L14}}if((mc[c[(c[P>>2]|0)+36>>2]&127](P)|0)==-1){c[u>>2]=0;Q=25;break}else{if(O^(P|0)==0){break}else{R=I;break L14}}}}while(0);if((Q|0)==25){Q=0;if(O){R=I;break}}P=d[s]|0;S=(P&1|0)==0;if((L-I|0)==((S?P>>>1:c[B>>2]|0)|0)){if(S){T=P>>>1;U=P>>>1}else{P=c[B>>2]|0;T=P;U=P}Kd(q,T<<1,0);if((a[s]&1)==0){V=10}else{V=(c[A>>2]&-2)-1|0}Kd(q,V,0);if((a[s]&1)==0){W=y}else{W=c[z>>2]|0}X=W;Y=W+U|0}else{X=I;Y=L}P=c[N+12>>2]|0;if((P|0)==(c[N+16>>2]|0)){Z=(mc[c[(c[N>>2]|0)+36>>2]&127](N)|0)&255}else{Z=a[P]|0}P=(Y|0)==(X|0);do{if(P){S=(a[C]|0)==Z<<24>>24;if(!(S|(a[D]|0)==Z<<24>>24)){Q=50;break}a[Y]=S?43:45;_=0;$=K;aa=Y+1|0}else{Q=50}}while(0);do{if((Q|0)==50){Q=0;O=d[o]|0;if((((O&1|0)==0?O>>>1:c[H>>2]|0)|0)!=0&Z<<24>>24==0){if((K-E|0)>=160){_=J;$=K;aa=Y;break}c[K>>2]=J;_=0;$=K+4|0;aa=Y;break}else{ba=v}while(1){O=ba+1|0;if((a[ba]|0)==Z<<24>>24){ca=ba;break}if((O|0)==(F|0)){ca=F;break}else{ba=O}}O=ca-G|0;if((O|0)>23){R=X;break L14}if((O|0)<22){a[Y]=a[9632+O|0]|0;_=J+1|0;$=K;aa=Y+1|0;break}if(P){R=Y;break L14}if((Y-X|0)>=3){R=X;break L14}if((a[Y-1|0]|0)!=48){R=X;break L14}a[Y]=a[9632+O|0]|0;_=0;$=K;aa=Y+1|0}}while(0);P=c[w>>2]|0;O=P+12|0;S=c[O>>2]|0;if((S|0)==(c[P+16>>2]|0)){mc[c[(c[P>>2]|0)+40>>2]&127](P)|0;I=X;J=_;K=$;L=aa;M=P;continue}else{c[O>>2]=S+1;I=X;J=_;K=$;L=aa;M=P;continue}}a[R+3|0]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);M=il(R,c[12708]|0,1168,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)!=1){c[j>>2]=4}M=c[w>>2]|0;do{if((M|0)==0){da=0}else{if((c[M+12>>2]|0)!=(c[M+16>>2]|0)){da=M;break}if((mc[c[(c[M>>2]|0)+36>>2]&127](M)|0)!=-1){da=M;break}c[w>>2]=0;da=0}}while(0);w=(da|0)==0;M=c[u>>2]|0;do{if((M|0)==0){Q=84}else{if((c[M+12>>2]|0)!=(c[M+16>>2]|0)){if(!w){break}ea=b|0;c[ea>>2]=da;Hd(q);Hd(n);i=e;return}if((mc[c[(c[M>>2]|0)+36>>2]&127](M)|0)==-1){c[u>>2]=0;Q=84;break}if(!(w^(M|0)==0)){break}ea=b|0;c[ea>>2]=da;Hd(q);Hd(n);i=e;return}}while(0);do{if((Q|0)==84){if(w){break}ea=b|0;c[ea>>2]=da;Hd(q);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ea=b|0;c[ea>>2]=da;Hd(q);Hd(n);i=e;return}}while(0);e=Yb(4)|0;jm(e);vb(e|0,8088,140)}function Df(a){a=a|0;fd(a|0);Lm(a);return}function Ef(a){a=a|0;fd(a|0);return}function Ff(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];nc[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==1){a[j]=1}else if((w|0)==0){a[j]=0}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}$d(r,g);q=r|0;r=c[q>>2]|0;if((c[13100]|0)!=-1){c[m>>2]=52400;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52400,m,104)}m=(c[13101]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;hd(c[q>>2]|0)|0;$d(s,g);n=s|0;p=c[n>>2]|0;if((c[13004]|0)!=-1){c[l>>2]=52016;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52016,l,104)}d=(c[13005]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;hd(c[n>>2]|0)|0;z=t|0;A=x;jc[c[(c[A>>2]|0)+24>>2]&127](z,y);jc[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(jl(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];Td(t+12|0);Td(t|0);i=k;return}}while(0);o=Yb(4)|0;jm(o);vb(o|0,8088,140)}}while(0);k=Yb(4)|0;jm(k);vb(k|0,8088,140)}function Gf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];kl(a,b,k,l,f,g,h);i=j;return}function Hf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];ll(a,b,k,l,f,g,h);i=j;return}function If(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];ml(a,b,k,l,f,g,h);i=j;return}function Jf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];nl(a,b,k,l,f,g,h);i=j;return}function Kf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];ol(a,b,k,l,f,g,h);i=j;return}function Lf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];pl(a,b,k,l,f,g,h);i=j;return}function Mf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];ql(a,b,k,l,f,g,h);i=j;return}function Nf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];rl(a,b,k,l,f,g,h);i=j;return}function Of(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];sl(a,b,k,l,f,g,h);i=j;return}function Pf(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0;e=i;i=i+136|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+120|0;o=n;p=i;i=i+4|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;r=i;i=i+160|0;bn(o|0,0,12)|0;s=q;$d(p,h);h=p|0;p=c[h>>2]|0;if((c[13100]|0)!=-1){c[l>>2]=52400;c[l+4>>2]=14;c[l+8>>2]=0;Cd(52400,l,104)}l=(c[13101]|0)-1|0;t=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-t>>2>>>0>l>>>0){u=c[t+(l<<2)>>2]|0;if((u|0)==0){break}v=m|0;fc[c[(c[u>>2]|0)+48>>2]&15](u,9632,9658,v)|0;hd(c[h>>2]|0)|0;bn(s|0,0,12)|0;u=q;Kd(q,10,0);if((a[s]&1)==0){w=u+1|0;x=w;y=w;z=q+8|0}else{w=q+8|0;x=c[w>>2]|0;y=u+1|0;z=w}w=f|0;u=g|0;A=q|0;B=q+4|0;C=m+96|0;D=m+100|0;E=r;F=m+104|0;G=m;H=n+4|0;I=x;J=0;K=r|0;L=x;M=c[w>>2]|0;L14:while(1){do{if((M|0)==0){N=0}else{O=c[M+12>>2]|0;if((O|0)==(c[M+16>>2]|0)){P=mc[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{P=c[O>>2]|0}if((P|0)!=-1){N=M;break}c[w>>2]=0;N=0}}while(0);O=(N|0)==0;Q=c[u>>2]|0;do{if((Q|0)==0){R=26}else{S=c[Q+12>>2]|0;if((S|0)==(c[Q+16>>2]|0)){T=mc[c[(c[Q>>2]|0)+36>>2]&127](Q)|0}else{T=c[S>>2]|0}if((T|0)==-1){c[u>>2]=0;R=26;break}else{if(O^(Q|0)==0){break}else{U=I;break L14}}}}while(0);if((R|0)==26){R=0;if(O){U=I;break}}Q=d[s]|0;S=(Q&1|0)==0;if((L-I|0)==((S?Q>>>1:c[B>>2]|0)|0)){if(S){V=Q>>>1;W=Q>>>1}else{Q=c[B>>2]|0;V=Q;W=Q}Kd(q,V<<1,0);if((a[s]&1)==0){X=10}else{X=(c[A>>2]&-2)-1|0}Kd(q,X,0);if((a[s]&1)==0){Y=y}else{Y=c[z>>2]|0}Z=Y;_=Y+W|0}else{Z=I;_=L}Q=c[N+12>>2]|0;if((Q|0)==(c[N+16>>2]|0)){$=mc[c[(c[N>>2]|0)+36>>2]&127](N)|0}else{$=c[Q>>2]|0}Q=(_|0)==(Z|0);do{if(Q){S=(c[C>>2]|0)==($|0);if(!(S|(c[D>>2]|0)==($|0))){R=50;break}a[_]=S?43:45;aa=0;ba=K;ca=_+1|0}else{R=50}}while(0);do{if((R|0)==50){R=0;O=d[o]|0;if((((O&1|0)==0?O>>>1:c[H>>2]|0)|0)!=0&($|0)==0){if((K-E|0)>=160){aa=J;ba=K;ca=_;break}c[K>>2]=J;aa=0;ba=K+4|0;ca=_;break}else{da=v}while(1){O=da+4|0;if((c[da>>2]|0)==($|0)){ea=da;break}if((O|0)==(F|0)){ea=F;break}else{da=O}}O=ea-G|0;S=O>>2;if((O|0)>92){U=Z;break L14}if((O|0)<88){a[_]=a[9632+S|0]|0;aa=J+1|0;ba=K;ca=_+1|0;break}if(Q){U=_;break L14}if((_-Z|0)>=3){U=Z;break L14}if((a[_-1|0]|0)!=48){U=Z;break L14}a[_]=a[9632+S|0]|0;aa=0;ba=K;ca=_+1|0}}while(0);Q=c[w>>2]|0;S=Q+12|0;O=c[S>>2]|0;if((O|0)==(c[Q+16>>2]|0)){mc[c[(c[Q>>2]|0)+40>>2]&127](Q)|0;I=Z;J=aa;K=ba;L=ca;M=Q;continue}else{c[S>>2]=O+4;I=Z;J=aa;K=ba;L=ca;M=Q;continue}}a[U+3|0]=0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);M=il(U,c[12708]|0,1168,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)!=1){c[j>>2]=4}M=c[w>>2]|0;do{if((M|0)==0){fa=0}else{L=c[M+12>>2]|0;if((L|0)==(c[M+16>>2]|0)){ga=mc[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{ga=c[L>>2]|0}if((ga|0)!=-1){fa=M;break}c[w>>2]=0;fa=0}}while(0);w=(fa|0)==0;M=c[u>>2]|0;do{if((M|0)==0){R=85}else{L=c[M+12>>2]|0;if((L|0)==(c[M+16>>2]|0)){ha=mc[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{ha=c[L>>2]|0}if((ha|0)==-1){c[u>>2]=0;R=85;break}if(!(w^(M|0)==0)){break}ia=b|0;c[ia>>2]=fa;Hd(q);Hd(n);i=e;return}}while(0);do{if((R|0)==85){if(w){break}ia=b|0;c[ia>>2]=fa;Hd(q);Hd(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;ia=b|0;c[ia>>2]=fa;Hd(q);Hd(n);i=e;return}}while(0);e=Yb(4)|0;jm(e);vb(e|0,8088,140)}function Qf(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(c[m+96>>2]|0)==(b|0);if(!p){if((c[m+100>>2]|0)!=(b|0)){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&(b|0)==(i|0)){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+104|0;i=m;while(1){l=i+4|0;if((c[i>>2]|0)==(b|0)){s=i;break}if((l|0)==(k|0)){s=k;break}else{i=l}}i=s-m|0;m=i>>2;if((i|0)>92){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((m|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((i|0)<88){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;s=a[9632+m|0]|0;k=c[g>>2]|0;c[g>>2]=k+1;a[k]=s;q=0;return q|0}}while(0);f=a[9632+m|0]|0;c[g>>2]=n+1;a[n]=f;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function Rf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;$d(k,d);d=k|0;k=c[d>>2]|0;if((c[13102]|0)!=-1){c[j>>2]=52408;c[j+4>>2]=14;c[j+8>>2]=0;Cd(52408,j,104)}j=(c[13103]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}fc[c[(c[m>>2]|0)+32>>2]&15](m,9632,9658,e)|0;m=c[d>>2]|0;if((c[13006]|0)!=-1){c[h>>2]=52024;c[h+4>>2]=14;c[h+8>>2]=0;Cd(52024,h,104)}n=(c[13007]|0)-1|0;o=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-o>>2>>>0>n>>>0){p=c[o+(n<<2)>>2]|0;if((p|0)==0){break}q=p;a[f]=mc[c[(c[p>>2]|0)+16>>2]&127](q)|0;jc[c[(c[p>>2]|0)+20>>2]&127](b,q);hd(c[d>>2]|0)|0;i=g;return}}while(0);n=Yb(4)|0;jm(n);vb(n|0,8088,140)}}while(0);g=Yb(4)|0;jm(g);vb(g|0,8088,140)}function Sf(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+40|0;j=h|0;k=h+16|0;l=h+32|0;$d(l,d);d=l|0;l=c[d>>2]|0;if((c[13102]|0)!=-1){c[k>>2]=52408;c[k+4>>2]=14;c[k+8>>2]=0;Cd(52408,k,104)}k=(c[13103]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}fc[c[(c[n>>2]|0)+32>>2]&15](n,9632,9664,e)|0;n=c[d>>2]|0;if((c[13006]|0)!=-1){c[j>>2]=52024;c[j+4>>2]=14;c[j+8>>2]=0;Cd(52024,j,104)}o=(c[13007]|0)-1|0;p=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-p>>2>>>0>o>>>0){q=c[p+(o<<2)>>2]|0;if((q|0)==0){break}r=q;s=q;a[f]=mc[c[(c[s>>2]|0)+12>>2]&127](r)|0;a[g]=mc[c[(c[s>>2]|0)+16>>2]&127](r)|0;jc[c[(c[q>>2]|0)+20>>2]&127](b,r);hd(c[d>>2]|0)|0;i=h;return}}while(0);o=Yb(4)|0;jm(o);vb(o|0,8088,140)}}while(0);h=Yb(4)|0;jm(h);vb(h|0,8088,140)}function Tf(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if(b<<24>>24==i<<24>>24){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if(b<<24>>24==j<<24>>24){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+32|0;j=o;while(1){q=j+1|0;if((a[j]|0)==b<<24>>24){s=j;break}if((q|0)==(r|0)){s=r;break}else{j=q}}j=s-o|0;if((j|0)>31){p=-1;return p|0}o=a[9632+j|0]|0;if((j|0)==22|(j|0)==23){a[f]=80;s=c[h>>2]|0;c[h>>2]=s+1;a[s]=o;p=0;return p|0}else if((j|0)==25|(j|0)==24){s=c[h>>2]|0;do{if((s|0)!=(g|0)){if((a[s-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=s+1;a[s]=o;p=0;return p|0}else{s=a[f]|0;do{if((o&95|0)==(s<<24>>24|0)){a[f]=s|-128;if((a[e]&1)==0){break}a[e]=0;g=d[k]|0;if((g&1|0)==0){t=g>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}g=c[m>>2]|0;if((g-l|0)>=160){break}r=c[n>>2]|0;c[m>>2]=g+4;c[g>>2]=r}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=o;if((j|0)>21){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}return 0}function Uf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=f+32|0;$d(j,b);b=j|0;j=c[b>>2]|0;if((c[13100]|0)!=-1){c[h>>2]=52400;c[h+4>>2]=14;c[h+8>>2]=0;Cd(52400,h,104)}h=(c[13101]|0)-1|0;k=c[j+8>>2]|0;do{if((c[j+12>>2]|0)-k>>2>>>0>h>>>0){l=c[k+(h<<2)>>2]|0;if((l|0)==0){break}fc[c[(c[l>>2]|0)+48>>2]&15](l,9632,9658,d)|0;l=c[b>>2]|0;if((c[13004]|0)!=-1){c[g>>2]=52016;c[g+4>>2]=14;c[g+8>>2]=0;Cd(52016,g,104)}m=(c[13005]|0)-1|0;n=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-n>>2>>>0>m>>>0){o=c[n+(m<<2)>>2]|0;if((o|0)==0){break}p=o;c[e>>2]=mc[c[(c[o>>2]|0)+16>>2]&127](p)|0;jc[c[(c[o>>2]|0)+20>>2]&127](a,p);hd(c[b>>2]|0)|0;i=f;return}}while(0);m=Yb(4)|0;jm(m);vb(m|0,8088,140)}}while(0);f=Yb(4)|0;jm(f);vb(f|0,8088,140)}function Vf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;$d(k,b);b=k|0;k=c[b>>2]|0;if((c[13100]|0)!=-1){c[j>>2]=52400;c[j+4>>2]=14;c[j+8>>2]=0;Cd(52400,j,104)}j=(c[13101]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}fc[c[(c[m>>2]|0)+48>>2]&15](m,9632,9664,d)|0;m=c[b>>2]|0;if((c[13004]|0)!=-1){c[h>>2]=52016;c[h+4>>2]=14;c[h+8>>2]=0;Cd(52016,h,104)}n=(c[13005]|0)-1|0;o=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-o>>2>>>0>n>>>0){p=c[o+(n<<2)>>2]|0;if((p|0)==0){break}q=p;r=p;c[e>>2]=mc[c[(c[r>>2]|0)+12>>2]&127](q)|0;c[f>>2]=mc[c[(c[r>>2]|0)+16>>2]&127](q)|0;jc[c[(c[p>>2]|0)+20>>2]&127](a,q);hd(c[b>>2]|0)|0;i=g;return}}while(0);n=Yb(4)|0;jm(n);vb(n|0,8088,140)}}while(0);g=Yb(4)|0;jm(g);vb(g|0,8088,140)}function Wf(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if((b|0)==(i|0)){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if((b|0)==(j|0)){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+128|0;j=o;while(1){q=j+4|0;if((c[j>>2]|0)==(b|0)){s=j;break}if((q|0)==(r|0)){s=r;break}else{j=q}}j=s-o|0;o=j>>2;if((j|0)>124){p=-1;return p|0}s=a[9632+o|0]|0;do{if((o|0)==22|(o|0)==23){a[f]=80}else if((o|0)==25|(o|0)==24){r=c[h>>2]|0;do{if((r|0)!=(g|0)){if((a[r-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=r+1;a[r]=s;p=0;return p|0}else{b=a[f]|0;if((s&95|0)!=(b<<24>>24|0)){break}a[f]=b|-128;if((a[e]&1)==0){break}a[e]=0;b=d[k]|0;if((b&1|0)==0){t=b>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}b=c[m>>2]|0;if((b-l|0)>=160){break}q=c[n>>2]|0;c[m>>2]=b+4;c[b>>2]=q}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=s;if((j|0)>84){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}function Xf(a){a=a|0;fd(a|0);Lm(a);return}function Yf(a){a=a|0;fd(a|0);return}function Zf(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];tc[o&31](b,d,l,f,g,h&1);i=j;return}$d(m,f);f=m|0;m=c[f>>2]|0;if((c[13006]|0)!=-1){c[k>>2]=52024;c[k+4>>2]=14;c[k+8>>2]=0;Cd(52024,k,104)}k=(c[13007]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;hd(c[f>>2]|0)|0;o=c[l>>2]|0;if(h){jc[c[o+24>>2]&127](n,d)}else{jc[c[o+28>>2]&127](n,d)}d=n;o=n;l=a[o]|0;if((l&1)==0){p=d+1|0;q=p;r=p;s=n+8|0}else{p=n+8|0;q=c[p>>2]|0;r=d+1|0;s=p}p=e|0;d=n+4|0;t=q;u=l;while(1){if((u&1)==0){v=r}else{v=c[s>>2]|0}l=u&255;if((t|0)==(v+((l&1|0)==0?l>>>1:c[d>>2]|0)|0)){break}l=a[t]|0;w=c[p>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)!=(c[w+28>>2]|0)){c[x>>2]=y+1;a[y]=l;break}if((uc[c[(c[w>>2]|0)+52>>2]&31](w,l&255)|0)!=-1){break}c[p>>2]=0}}while(0);t=t+1|0;u=a[o]|0}c[b>>2]=c[p>>2];Hd(n);i=j;return}}while(0);j=Yb(4)|0;jm(j);vb(j|0,8088,140)}function _f(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[2336]|0;a[q+1|0]=a[2337]|0;a[q+2|0]=a[2338]|0;a[q+3|0]=a[2339]|0;a[q+4|0]=a[2340]|0;a[q+5|0]=a[2341]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=k|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);v=tl(u,12,c[12708]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=22;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=k+2|0}else if((h|0)==32){w=q}else{x=22}}while(0);if((x|0)==22){w=u}x=l|0;$d(o,f);$f(u,w,q,x,m,n,o);hd(c[o>>2]|0)|0;c[p>>2]=c[e>>2];Tc(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function $f(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[13102]|0)!=-1){c[n>>2]=52408;c[n+4>>2]=14;c[n+8>>2]=0;Cd(52408,n,104)}n=(c[13103]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}r=k;s=c[p>>2]|0;if((c[13006]|0)!=-1){c[m>>2]=52024;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52024,m,104)}m=(c[13007]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}t=s;jc[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){fc[c[(c[k>>2]|0)+32>>2]&15](r,b,f,g)|0;c[j>>2]=g+(f-b)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=uc[c[(c[k>>2]|0)+28>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=uc[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+1;a[y]=q;q=uc[c[(c[p>>2]|0)+28>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=mc[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+1;a[I]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=uc[c[(c[p>>2]|0)+28>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+1;a[I]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-1|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=a[J]|0;a[J]=a[K]|0;a[K]=C;J=J+1|0;K=K-1|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;Hd(o);i=l;return}else{L=g+(e-b)|0;c[h>>2]=L;Hd(o);i=l;return}}function ag(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=l|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);t=tl(u,22,c[12708]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==32){w=r}else if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=22;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=l+2|0}else{x=22}}while(0);if((x|0)==22){w=u}x=m|0;$d(p,f);$f(u,w,r,x,n,o,p);hd(c[p>>2]|0)|0;c[q>>2]=c[e>>2];Tc(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function bg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[2336]|0;a[q+1|0]=a[2337]|0;a[q+2|0]=a[2338]|0;a[q+3|0]=a[2339]|0;a[q+4|0]=a[2340]|0;a[q+5|0]=a[2341]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=k|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);t=tl(u,12,c[12708]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+t|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=22;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=k+2|0}else{x=22}}while(0);if((x|0)==22){w=u}x=l|0;$d(o,f);$f(u,w,q,x,m,n,o);hd(c[o>>2]|0)|0;c[p>>2]=c[e>>2];Tc(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function cg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=l|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);t=tl(u,23,c[12708]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==32){w=r}else if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=22;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=l+2|0}else{x=22}}while(0);if((x|0)==22){w=u}x=m|0;$d(p,f);$f(u,w,r,x,n,o,p);hd(c[p>>2]|0)|0;c[q>>2]=c[e>>2];Tc(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function dg(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=c[12708]|0;if(y){w=tl(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=tl(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[52968]|0)==0;if(y){do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=ul(m,c[12708]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);w=ul(m,c[12708]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}Qm();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=Gm(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}Qm();H=0;I=0;J=c[m>>2]|0}}while(0);$d(q,f);eg(J,F,A,H,o,p,q);hd(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];Tc(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){Hm(I)}if((D|0)==0){i=d;return}Hm(D);i=d;return}function eg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[13102]|0)!=-1){c[n>>2]=52408;c[n+4>>2]=14;c[n+8>>2]=0;Cd(52408,n,104)}n=(c[13103]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=Yb(4)|0;s=r;jm(s);vb(r|0,8088,140)}r=k;s=c[p>>2]|0;if((c[13006]|0)!=-1){c[m>>2]=52024;c[m+4>>2]=14;c[m+8>>2]=0;Cd(52024,m,104)}m=(c[13007]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=Yb(4)|0;u=t;jm(u);vb(t|0,8088,140)}t=s;jc[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=uc[c[(c[k>>2]|0)+28>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=m;v=b+1|0}else{v=b}m=f;L23:do{if((m-v|0)>1){if((a[v]|0)!=48){w=21;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=21;break}p=k;n=uc[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+1;a[q]=n;n=v+2|0;q=uc[c[(c[p>>2]|0)+28>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=q;if(n>>>0<f>>>0){x=n}else{y=n;z=n;break}while(1){q=a[x]|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);u=x+1|0;if((db(q<<24>>24|0,c[12708]|0)|0)==0){y=x;z=n;break L23}if(u>>>0<f>>>0){x=u}else{y=u;z=n;break}}}else{w=21}}while(0);L38:do{if((w|0)==21){if(v>>>0<f>>>0){A=v}else{y=v;z=v;break}while(1){x=a[A]|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);q=A+1|0;if((Sb(x<<24>>24|0,c[12708]|0)|0)==0){y=A;z=v;break L38}if(q>>>0<f>>>0){A=q}else{y=q;z=v;break}}}}while(0);v=o;A=o;w=d[A]|0;if((w&1|0)==0){B=w>>>1}else{B=c[o+4>>2]|0}do{if((B|0)==0){fc[c[(c[k>>2]|0)+32>>2]&15](r,z,y,c[j>>2]|0)|0;c[j>>2]=(c[j>>2]|0)+(y-z)}else{do{if((z|0)!=(y|0)){w=y-1|0;if(z>>>0<w>>>0){C=z;D=w}else{break}do{w=a[C]|0;a[C]=a[D]|0;a[D]=w;C=C+1|0;D=D-1|0;}while(C>>>0<D>>>0)}}while(0);x=mc[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(z>>>0<y>>>0){w=v+1|0;q=o+4|0;n=o+8|0;u=k;p=0;E=0;F=z;while(1){G=(a[A]&1)==0;do{if((a[(G?w:c[n>>2]|0)+E|0]|0)>0){if((p|0)!=(a[(G?w:c[n>>2]|0)+E|0]|0)){H=E;I=p;break}J=c[j>>2]|0;c[j>>2]=J+1;a[J]=x;J=d[A]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[q>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=p}}while(0);G=uc[c[(c[u>>2]|0)+28>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+1;a[J]=G;G=F+1|0;if(G>>>0<y>>>0){p=I+1|0;E=H;F=G}else{break}}}F=g+(z-b)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}p=E-1|0;if(F>>>0<p>>>0){K=F;L=p}else{break}do{p=a[K]|0;a[K]=a[L]|0;a[L]=p;K=K+1|0;L=L-1|0;}while(K>>>0<L>>>0)}}while(0);L78:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=uc[c[(c[L>>2]|0)+28>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+1;a[z]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L78}}L=mc[c[(c[s>>2]|0)+12>>2]&127](t)|0;H=c[j>>2]|0;c[j>>2]=H+1;a[H]=L;M=K+1|0}else{M=y}}while(0);fc[c[(c[k>>2]|0)+32>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;Hd(o);i=l;return}N=g+(e-b)|0;c[h>>2]=N;Hd(o);i=l;return}function fg(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=c[12708]|0;if(y){w=tl(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=tl(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[52968]|0)==0;if(y){do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);l=ul(m,c[12708]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);w=ul(m,c[12708]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}Qm();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=53;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=53;break}F=E+2|0}else if((B|0)==32){F=A}else{G=53}}while(0);if((G|0)==53){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=Gm(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}Qm();H=0;I=0;J=c[m>>2]|0}}while(0);$d(q,f);eg(J,F,A,H,o,p,q);hd(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];Tc(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){Hm(I)}if((D|0)==0){i=d;return}Hm(D);i=d;return}function gg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;i=i+104|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+88|0;n=d+96|0;o=d+16|0;a[o]=a[2344]|0;a[o+1|0]=a[2345]|0;a[o+2|0]=a[2346]|0;a[o+3|0]=a[2347]|0;a[o+4|0]=a[2348]|0;a[o+5|0]=a[2349]|0;p=k|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);q=tl(p,20,c[12708]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==16){r=a[p]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){s=k+1|0;break}if(!((q|0)>1&r<<24>>24==48)){t=12;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){t=12;break}s=k+2|0}else if((h|0)==32){s=o}else{t=12}}while(0);if((t|0)==12){s=p}$d(m,f);t=m|0;m=c[t>>2]|0;if((c[13102]|0)!=-1){c[j>>2]=52408;c[j+4>>2]=14;c[j+8>>2]=0;Cd(52408,j,104)}j=(c[13103]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){r=c[h+(j<<2)>>2]|0;if((r|0)==0){break}hd(c[t>>2]|0)|0;u=l|0;fc[c[(c[r>>2]|0)+32>>2]&15](r,p,o,u)|0;r=l+q|0;if((s|0)==(o|0)){v=r;w=e|0;x=c[w>>2]|0;y=n|0;c[y>>2]=x;Tc(b,n,u,v,r,f,g);i=d;return}v=l+(s-k)|0;w=e|0;x=c[w>>2]|0;y=n|0;c[y>>2]=x;Tc(b,n,u,v,r,f,g);i=d;return}}while(0);d=Yb(4)|0;jm(d);vb(d|0,8088,140)}function hg(a){a=a|0;fd(a|0);Lm(a);return}function ig(a){a=a|0;fd(a|0);return}function jg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];tc[o&31](b,d,l,f,g,h&1);i=j;return}$d(m,f);f=m|0;m=c[f>>2]|0;if((c[13004]|0)!=-1){c[k>>2]=52016;c[k+4>>2]=14;c[k+8>>2]=0;Cd(52016,k,104)}k=(c[13005]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;hd(c[f>>2]|0)|0;o=c[l>>2]|0;if(h){jc[c[o+24>>2]&127](n,d)}else{jc[c[o+28>>2]&127](n,d)}d=n;o=a[d]|0;if((o&1)==0){l=n+4|0;p=l;q=l;r=n+8|0}else{l=n+8|0;p=c[l>>2]|0;q=n+4|0;r=l}l=e|0;s=p;t=o;while(1){if((t&1)==0){u=q}else{u=c[r>>2]|0}o=t&255;if((o&1|0)==0){v=o>>>1}else{v=c[q>>2]|0}if((s|0)==(u+(v<<2)|0)){break}o=c[s>>2]|0;w=c[l>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)==(c[w+28>>2]|0)){z=uc[c[(c[w>>2]|0)+52>>2]&31](w,o)|0}else{c[x>>2]=y+4;c[y>>2]=o;z=o}if((z|0)!=-1){break}c[l>>2]=0}}while(0);s=s+4|0;t=a[d]|0}c[b>>2]=c[l>>2];Td(n);i=j;return}}while(0);j=Yb(4)|0;jm(j);vb(j|0,8088,140)}function kg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[2336]|0;a[q+1|0]=a[2337]|0;a[q+2|0]=a[2338]|0;a[q+3|0]=a[2339]|0;a[q+4|0]=a[2340]|0;a[q+5|0]=a[2341]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=k|0;do{if((a[52968]|0)==0){if((mb(52968)|0)==0){break}c[12708]=Qa(2147483647,144,0)|0}}while(0);v=tl(u,12,c[12708]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=22;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=22;break}w=k+2|0}else{x=22}}while(0);if((x|0)==22){w=u}x=l|0;$d(o,f);lg(u,w,q,x,m,n,o);hd(c[o>>2]|0)|0;c[p>>2]=c[e>>2];vl(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}
function tn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return fc[a&15](b|0,c|0,d|0,e|0)|0}function un(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;gc[a&15](b|0,c|0,d|0,e|0)}function vn(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;hc[a&7](b|0,c|0,d|0,e|0,f|0)}function wn(a,b){a=a|0;b=b|0;ic[a&511](b|0)}function xn(a,b,c){a=a|0;b=b|0;c=c|0;jc[a&127](b|0,c|0)}function yn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return kc[a&63](b|0,c|0,d|0)|0}function zn(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;lc[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function An(a,b){a=a|0;b=b|0;return mc[a&127](b|0)|0}function Bn(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;nc[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function Cn(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;oc[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function Dn(a){a=a|0;pc[a&1]()}function En(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return qc[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function Fn(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;rc[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function Gn(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;sc[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function Hn(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;tc[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function In(a,b,c){a=a|0;b=b|0;c=c|0;return uc[a&31](b|0,c|0)|0}function Jn(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return vc[a&31](b|0,c|0,d|0,e|0,f|0)|0}function Kn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;wc[a&7](b|0,c|0,d|0)}function Ln(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(0);return 0}function Mn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ha(1)}function Nn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(2)}function On(a){a=a|0;ha(3)}function Pn(a,b){a=a|0;b=b|0;ha(4)}function Qn(a,b,c){a=a|0;b=b|0;c=c|0;ha(5);return 0}function Rn(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ha(6)}function Sn(a){a=a|0;ha(7);return 0}function Tn(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ha(8)}function Un(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ha(9)}function Vn(){ha(10)}function Wn(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ha(11);return 0}function Xn(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ha(12)}function Yn(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ha(13)}function Zn(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ha(14)}function _n(a,b){a=a|0;b=b|0;ha(15);return 0}function $n(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ha(16);return 0}function ao(a,b,c){a=a|0;b=b|0;c=c|0;ha(17)}
// EMSCRIPTEN_END_FUNCS
var fc=[Ln,Ln,Ri,Ln,Si,Ln,hj,Ln,Zi,Ln,Ti,Ln,Ln,Ln,Ln,Ln];var gc=[Mn,Mn,xm,Mn,ym,Mn,wm,Mn,ge,Mn,of,Mn,ue,Mn,jf,Mn];var hc=[Nn,Nn,Bm,Nn,Cm,Nn,Am,Nn];var ic=[On,On,si,On,qf,On,ig,On,rd,On,ce,On,Jl,On,Ni,On,Ck,On,Xf,On,jd,On,Aj,On,pd,On,Df,On,um,On,ff,On,cf,On,Om,On,sd,On,Li,On,aj,On,Hg,On,Ef,On,jm,On,Xe,On,oi,On,Mi,On,Fe,On,rf,On,Kl,On,th,On,Ll,On,Fi,On,yi,On,Vj,On,nm,On,Uj,On,pd,On,Hl,On,mf,On,_g,On,Xj,On,Oi,On,Hm,On,Rj,On,hi,On,Sj,On,qm,On,Ke,On,lf,On,Vg,On,kd,On,Zk,On,Hk,On,Yf,On,Ij,On,sd,On,uh,On,Ee,On,Re,On,Rg,On,Gg,On,Bk,On,df,On,ih,On,Nm,On,be,On,Ye,On,qe,On,kj,On,lm,On,Ge,On,bf,On,Ph,On,ed,On,Eh,On,Ze,On,Ji,On,rm,On,om,On,Ei,On,Sg,On,Yh,On,km,On,Qj,On,Sh,On,ii,On,Zg,On,hg,On,ef,On,Ik,On,gf,On,Me,On,Ad,On,wk,On,sj,On,bi,On,Xh,On,Pi,On,zi,On,Wj,On,Tk,On,Td,On,Ml,On,lm,On,tm,On,Nk,On,Qe,On,Bd,On,vk,On,Ai,On,De,On,We,On,ni,On,_d,On,Pe,On,Ok,On,Hi,On,Uk,On,Fh,On,ug,On,jh,On,xi,On,Il,On,Tj,On,Le,On,pe,On,Oe,On,bd,On,vg,On,pm,On,ti,On,Pc,On,Wg,On,ci,On,Qh,On,sm,On,Hd,On,bj,On,od,On,Je,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On,On];var jc=[Pn,Pn,ek,Pn,Kh,Pn,mh,Pn,bk,Pn,Dh,Pn,ak,Pn,sh,Pn,xk,Pn,ri,Pn,re,Pn,eh,Pn,Nh,Pn,Ah,Pn,dh,Pn,Ih,Pn,bh,Pn,Lh,Pn,Ii,Pn,Jk,Pn,Dk,Pn,Oh,Pn,dk,Pn,nh,Pn,nd,Pn,fk,Pn,Ch,Pn,ph,Pn,ck,Pn,rh,Pn,de,Pn,Pk,Pn,wi,Pn,xh,Pn,hh,Pn,gh,Pn,ch,Pn,yh,Pn,zh,Pn,Jh,Pn,oh,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn,Pn];var kc=[Qn,Qn,Be,Qn,kf,Qn,dj,Qn,Xi,Qn,vm,Qn,_i,Qn,pf,Qn,vd,Qn,ne,Qn,je,Qn,Qi,Qn,se,Qn,ui,Qn,ij,Qn,Vi,Qn,zk,Qn,wd,Qn,xe,Qn,fj,Qn,pi,Qn,ee,Qn,Lk,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn,Qn];var lc=[Rn,Rn,ji,Rn,di,Rn,Rn,Rn];var mc=[Sn,Sn,tk,Sn,wh,Sn,ke,Sn,pj,Sn,jk,Sn,le,Sn,rk,Sn,kh,Sn,wg,Sn,hk,Sn,Rk,Sn,ze,Sn,ye,Sn,Mj,Sn,nk,Sn,lk,Sn,mm,Sn,qd,Sn,$j,Sn,Yj,Sn,mk,Sn,Zj,Sn,he,Sn,oj,Sn,Mh,Sn,ok,Sn,yk,Sn,lh,Sn,Fj,Sn,Gh,Sn,gk,Sn,Ek,Sn,Nj,Sn,Pm,Sn,$e,Sn,fh,Sn,Fk,Sn,_j,Sn,ie,Sn,ve,Sn,Kk,Sn,rj,Sn,qh,Sn,sk,Sn,Qk,Sn,Ej,Sn,xj,Sn,we,Sn,$g,Sn,ik,Sn,ah,Sn,ld,Sn,vh,Sn,zj,Sn,Bh,Sn,kk,Sn,Hh,Sn,wj,Sn,Ig,Sn,qk,Sn,pk,Sn,Hj,Sn,Pj,Sn];var nc=[Tn,Tn,Bg,Tn,Jg,Tn,Lg,Tn,mi,Tn,Kg,Tn,og,Tn,mg,Tn,gi,Tn,xg,Tn,Ag,Tn,Mg,Tn,cg,Tn,Pf,Tn,zg,Tn,Jf,Tn,ag,Tn,Lf,Tn,Hf,Tn,If,Tn,Cf,Tn,Kf,Tn,Gf,Tn,Ff,Tn,Of,Tn,Nf,Tn,Mf,Tn,Ng,Tn,wf,Tn,yg,Tn,yf,Tn,uf,Tn,vf,Tn,xf,Tn,tf,Tn,Bf,Tn,Af,Tn,zf,Tn,sf,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn,Tn];var oc=[Un,Un,rg,Un,pg,Un,fg,Un,dg,Un,Un,Un,Un,Un,Un,Un];var pc=[Vn,Vn];var qc=[Wn,Wn,tj,Wn,Cj,Wn,Bj,Wn,Kj,Wn,uj,Wn,Jj,Wn,lj,Wn,mj,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn];var rc=[Xn,Xn,Og,Xn,Cg,Xn,Xn,Xn];var sc=[Yn,Yn,Xg,Yn,Ug,Yn,Rh,Yn,Zh,Yn,Vh,Yn,$h,Yn,Yn,Yn];var tc=[Zn,Zn,Dm,Zn,ng,Zn,kg,Zn,jg,Zn,Em,Zn,sg,Zn,qi,Zn,te,Zn,gg,Zn,Zf,Zn,bg,Zn,_f,Zn,Fm,Zn,fe,Zn,vi,Zn];var uc=[_n,_n,cj,_n,Sk,_n,Yi,_n,Ae,_n,gj,_n,Gk,_n,Mk,_n,Ui,_n,ej,_n,Ce,_n,Wi,_n,oe,_n,me,_n,Ak,_n,_n,_n];var vc=[$n,$n,$i,$n,Dj,$n,nf,$n,Oj,$n,Gj,$n,jj,$n,vj,$n,hf,$n,nj,$n,qj,$n,Lj,$n,yj,$n,$n,$n,$n,$n,$n,$n];var wc=[ao,ao,ud,ao,af,ao,ao,ao];return{_strlen:cn,_free:Hm,_realloc:Im,_memmove:dn,__GLOBAL__I_a:$c,_memset:bn,__GLOBAL__I_a131:uk,_malloc:Gm,_memcpy:an,_play:Oc,runPostSets:Nc,stackAlloc:xc,stackSave:yc,stackRestore:zc,setThrew:Ac,setTempRet0:Dc,setTempRet1:Ec,setTempRet2:Fc,setTempRet3:Gc,setTempRet4:Hc,setTempRet5:Ic,setTempRet6:Jc,setTempRet7:Kc,setTempRet8:Lc,setTempRet9:Mc,dynCall_iiiii:tn,dynCall_viiii:un,dynCall_viiiii:vn,dynCall_vi:wn,dynCall_vii:xn,dynCall_iiii:yn,dynCall_viiiiiid:zn,dynCall_ii:An,dynCall_viiiiiii:Bn,dynCall_viiiiid:Cn,dynCall_v:Dn,dynCall_iiiiiiiii:En,dynCall_viiiiiiiii:Fn,dynCall_viiiiiiii:Gn,dynCall_viiiiii:Hn,dynCall_iii:In,dynCall_iiiiii:Jn,dynCall_viii:Kn}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiiii": invoke_iiiii, "invoke_viiii": invoke_viiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiii": invoke_iiii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_ii": invoke_ii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_iiiiii": invoke_iiiiii, "invoke_viii": invoke_viii, "_llvm_lifetime_end": _llvm_lifetime_end, "__scanString": __scanString, "_pthread_mutex_lock": _pthread_mutex_lock, "___cxa_end_catch": ___cxa_end_catch, "_strtoull": _strtoull, "_fflush": _fflush, "__isLeapYear": __isLeapYear, "_fwrite": _fwrite, "_send": _send, "_isspace": _isspace, "_read": _read, "___cxa_guard_abort": ___cxa_guard_abort, "_newlocale": _newlocale, "___gxx_personality_v0": ___gxx_personality_v0, "_pthread_cond_wait": _pthread_cond_wait, "___cxa_rethrow": ___cxa_rethrow, "_fmod": _fmod, "___resumeException": ___resumeException, "_llvm_va_end": _llvm_va_end, "_vsscanf": _vsscanf, "_snprintf": _snprintf, "_fgetc": _fgetc, "__getFloat": __getFloat, "_atexit": _atexit, "___cxa_free_exception": ___cxa_free_exception, "_clock": _clock, "___setErrNo": ___setErrNo, "_isxdigit": _isxdigit, "_exit": _exit, "_sprintf": _sprintf, "___ctype_b_loc": ___ctype_b_loc, "_freelocale": _freelocale, "_catgets": _catgets, "_asprintf": _asprintf, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "___cxa_begin_catch": ___cxa_begin_catch, "_recv": _recv, "__parseInt64": __parseInt64, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "___cxa_call_unexpected": ___cxa_call_unexpected, "_copysign": _copysign, "__exit": __exit, "_strftime": _strftime, "___cxa_throw": ___cxa_throw, "_llvm_eh_exception": _llvm_eh_exception, "_pread": _pread, "__arraySum": __arraySum, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "__ZSt9terminatev": __ZSt9terminatev, "_isascii": _isascii, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_strerror": _strerror, "_catclose": _catclose, "_llvm_lifetime_start": _llvm_lifetime_start, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "_uselocale": _uselocale, "_vsnprintf": _vsnprintf, "_sscanf": _sscanf, "_sysconf": _sysconf, "_fread": _fread, "_abort": _abort, "_isdigit": _isdigit, "_strtoll": _strtoll, "__addDays": __addDays, "_fabs": _fabs, "__reallyNegative": __reallyNegative, "_write": _write, "___cxa_allocate_exception": ___cxa_allocate_exception, "_vasprintf": _vasprintf, "_catopen": _catopen, "___ctype_toupper_loc": ___ctype_toupper_loc, "___ctype_tolower_loc": ___ctype_tolower_loc, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "___fsmu8": ___fsmu8, "_stdout": _stdout, "___dso_handle": ___dso_handle }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var __GLOBAL__I_a131 = Module["__GLOBAL__I_a131"] = asm["__GLOBAL__I_a131"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _play = Module["_play"] = asm["_play"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame
  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;
    ensureInitRuntime();
    preMain();
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
