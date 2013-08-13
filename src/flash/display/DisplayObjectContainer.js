/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var DisplayObjectContainerDefinition = (function () {
  var def = {
    get mouseChildren() {
      return this._mouseChildren;
    },
    set mouseChildren(val) {
      this._mouseChildren = val;
    },
    get numChildren() {
      return this._children.length;
    },
    get tabChildren() {
      return this._tabChildren;
    },
    set tabChildren(val) {
      this._tabChildren = val;
    },
    get textSnapshot() {
      notImplemented();
    },

    addChild: function (child) {
      return this.addChildAt(child, this._children.length);
    },
    addChildAt: function (child, index) {
      if (child === this) {
        throw ArgumentError();
      }

      if (child._parent === this) {
        return this.setChildIndex(child, index);
      }

      var children = this._children;

      if (index < 0 || index > children.length) {
        throw RangeError();
      }

      if (child._parent) {
        var LoaderClass = avm2.systemDomain.getClass('flash.display.Loader');
        if (LoaderClass.isInstanceOf(child._parent)) {
          def.removeChild.call(child._parent, child);
        } else {
          child._parent.removeChild(child);
        }
      }

      for (var i = children.length; i && i > index; i--) {
        children[i - 1]._index++;
      }
      children.splice(index, 0, child);

      child._owned = false;
      child._parent = this;
      child._stage = this._stage;
      child._index = index;

      this._bounds = null;

      this._control.appendChild(child._control);

      child._dispatchEvent(new flash.events.Event("added"));
      if (this._stage) {
        this._stage._addToStage(child);
      }

      return child;
    },
    areInaccessibleObjectsUnderPoint: function (pt) {
      notImplemented();
    },
    contains: function (child) {
      return child._parent === this;
    },
    getChildAt: function (index) {
      var children = this._children;

      if (index < 0 || index > children.length) {
        throw RangeError();
      }

      return children[index];
    },
    getChildByName: function (name) {
      var children = this._children;
      for (var i = 0, n = children.length; i < n; i++) {
        var child = children[i];
        if (child.name === name) {
          return child;
        }
      }
      return null;
    },
    getChildIndex: function (child) {
      if (child._parent !== this) {
        throw ArgumentError();
      }

      return child._index;
    },
    getObjectsUnderPoint: function (pt) {
      notImplemented();
    },
    removeChild: function (child) {
      if (child._parent !== this) {
        throw ArgumentError();
      }

      return this.removeChildAt(child._index);
    },
    removeChildAt: function (index) {
      var children = this._children;

      if (index < 0 || index >= children.length) {
        throw RangeError();
      }

      var child = children[index];

      child._dispatchEvent(new flash.events.Event("removed"));
      if (this._stage) {
        this._stage._removeFromStage(child);
      }

      for (var i = children.length; i && i > index; i--) {
        children[i - 1]._index--;
      }
      children.splice(index, 1);

      child._parent = null;
      child._index = -1;

      this._bounds = null;

      this._control.removeChild(child._control);

      return child;
    },
    setChildIndex: function (child, index) {
      if (child._parent !== this) {
        throw ArgumentError();
      }

      if (child._index === index) {
        return;
      }

      var children = this._children;

      if (index < 0 || index > children.length) {
        throw RangeError();
      }

      children.splice(child._index, 1);
      children.splice(index, 0, child);

      var i = child._index < index ? child._index : index;
      while (i < children.length) {
        children[i]._index = i++;
      }

      child._owned = false;

      child._invalidate();

      return child;
    },
    removeChildren: function (begin, end) {
      var children = this._children;
      var numChildren = children.length;

      if (begin < 0 || begin > numChildren ||
          end < 0 || end < begin || end > numChildren) {
        throw RangeError();
      }

      for (var i = begin; i < end; i++) {
        this.removeChildAt(i);
      }
    },
    swapChildren: function (child1, child2) {
      if (child1._parent !== this || child2._parent !== this) {
        throw ArgumentError();
      }

      this.swapChildrenAt(child1._index, child2._index);
    },
    swapChildrenAt: function (index1, index2) {
      var children = this._children;
      var numChildren = children.length;

      if (index1 < 0 || index1 > numChildren || index2 < 0 || index2 > numChildren) {
        throw RangeError();
      }

      var child1 = children[index1];
      var child2 = children[index2];

      children[index1] = child2;
      children[index2] = child1;

      child1._index = index2;
      child2._index = index1;
      child1._owned = false;
      child2._owned = false;

      child1._invalidate();
      child2._invalidate();
    },
    destroy: function () {
      if (this._destroyed) {
        return;
      }
      this._destroyed = true;
      this._children.forEach(function (child) {
        child.destroy();
      });
      this.cleanupBroadcastListeners();
    }
  };

  var desc = Object.getOwnPropertyDescriptor;

  def.initialize = function () {
    this._mouseChildren = true;
    this._tabChildren = true;
  };

  def.__glue__ = {
    native: {
      instance: {
        numChildren: desc(def, "numChildren"),
        tabChildren: desc(def, "tabChildren"),
        mouseChildren: desc(def, "mouseChildren"),
        textSnapshot: desc(def, "textSnapshot"),
        addChild: def.addChild,
        addChildAt: def.addChildAt,
        removeChild: def.removeChild,
        removeChildAt: def.removeChildAt,
        getChildIndex: def.getChildIndex,
        setChildIndex: def.setChildIndex,
        getChildAt: def.getChildAt,
        getChildByName: def.getChildByName,
        contains: def.contains,
        swapChildrenAt: def.swapChildrenAt,
        swapChildren: def.swapChildren,
        removeChildren: def.removeChildren
      }
    }
  };

  return def;
}).call(this);
