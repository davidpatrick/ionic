(function(ionic) {
'use strict';

  /**
   * The side menu view handles one of the side menu's in a Side Menu Controller
   * configuration.
   * It takes a DOM reference to that side menu element.
   */
  ionic.views.SideMenu = ionic.views.View.inherit({
    initialize: function(opts) {
      this.el = opts.el;
      this.isEnabled = (typeof opts.isEnabled === 'undefined') ? true : opts.isEnabled;
      this.side = opts.side;
      this.setWidth(opts.width);
      this.setHeight(opts.height);
    },
    getFullWidth: function() {
      return this.width;
    },
    getFullHeight: function() {
      return this.height;
    },
    setWidth: function(width) {
      this.width = width;
      this.el.style.width = this.side == "top" ? "100%" : width + 'px';
    },
    setHeight: function(height) {
      this.height = height;
      this.el.style.height = this.side != "top" ? "100%" : height + 'px';
    },
    setIsEnabled: function(isEnabled) {
      this.isEnabled = isEnabled;
    },
    bringUp: function() {
      if(this.el.style.zIndex !== '0') {
        this.el.style.zIndex = '0';
      }
    },
    pushDown: function() {
      if(this.el.style.zIndex !== '-1') {
        this.el.style.zIndex = '-1';
      }
    }
  });

  ionic.views.SideMenuContent = ionic.views.View.inherit({
    initialize: function(opts) {
      ionic.extend(this, {
        animationClass: 'menu-animated',
        onDrag: function() {},
        onEndDrag: function() {}
      }, opts);

      ionic.onGesture('drag', ionic.proxy(this._onDrag, this), this.el);
      ionic.onGesture('release', ionic.proxy(this._onEndDrag, this), this.el);
    },
    _onDrag: function(e) {
      this.onDrag && this.onDrag(e);
    },
    _onEndDrag: function(e) {
      this.onEndDrag && this.onEndDrag(e);
    },
    disableAnimation: function() {
      this.el.classList.remove(this.animationClass);
    },
    enableAnimation: function() {
      this.el.classList.add(this.animationClass);
    },
    getTranslateX: function() {
      return parseFloat(this.el.style[ionic.CSS.TRANSFORM].replace('translate3d(', '').split(',')[0]);
    },
    setTranslateX: ionic.animationFrameThrottle(function(x) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + x + 'px, 0, 0)';
    }),
    getTranslateY: function() {
      return parseFloat(this.el.style[ionic.CSS.TRANSFORM].replace('translate3d(', '').split(',')[1]);
    },
    setTranslateY: ionic.animationFrameThrottle(function(x) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(0,' + x + 'px, 0)';
    })
  });

})(ionic);
