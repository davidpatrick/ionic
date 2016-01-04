IonicModule
.controller('$ionicSideMenus', [
  '$scope',
  '$attrs',
  '$ionicSideMenuDelegate',
  '$ionicPlatform',
  '$ionicBody',
  '$ionicHistory',
  '$ionicScrollDelegate',
  'IONIC_BACK_PRIORITY',
  '$rootScope',
function($scope, $attrs, $ionicSideMenuDelegate, $ionicPlatform, $ionicBody, $ionicHistory, $ionicScrollDelegate, IONIC_BACK_PRIORITY, $rootScope) {
  var self = this;
  var rightShowing, leftShowing, topShowing, isDragging;
  var startPos, lastPos, offSetPos, isAsideExposed;
  var enableMenuWithBackViews = true;

  self.$scope = $scope;

  self.initialize = function(options) {
    self.left = options.left;
    self.right = options.right;
    self.top = options.top;
    self.setContent(options.content);
    self.dragThresholdX = options.dragThresholdX || 10;
    self.dragThresholdY = options.dragThresholdY || 10;
    $ionicHistory.registerHistory(self.$scope);
  };

  /**
   * Set the content view controller if not passed in the constructor options.
   *
   * @param {object} content
   */
  self.setContent = function(content) {
    if (content) {
      self.content = content;

      self.content.onDrag = function(e) {
        self._handleDrag(e);
      };

      self.content.endDrag = function(e) {
        self._endDrag(e);
      };
    }
  };

  self.isOpenLeft = function() {
    return self.getOpenAmount() > 0;
  };

  self.isOpenRight = function() {
    return self.getOpenAmount() < 0;
  };

  /**
   * Toggle the left menu to open 100%
   */
  self.toggleLeft = function(shouldOpen) {
    if (isAsideExposed || !self.left.isEnabled) return;
    var openAmount = self.getOpenAmount();
    if (arguments.length === 0) {
      shouldOpen = openAmount <= 0;
    }
    self.content.enableAnimation();
    if (!shouldOpen) {
      self.openPercentage(0);
      $rootScope.$emit('$ionicSideMenuClose', 'left');
    } else {
      self.openPercentage(100);
      $rootScope.$emit('$ionicSideMenuOpen', 'left');
    }
  };

  /**
   * Toggle the right menu to open 100%
   */
  self.toggleRight = function(shouldOpen) {
    if (isAsideExposed || !self.right.isEnabled) return;
    var openAmount = self.getOpenAmount();
    if (arguments.length === 0) {
      shouldOpen = openAmount >= 0;
    }
    self.content.enableAnimation();
    if (!shouldOpen) {
      self.openPercentage(0);
      $rootScope.$emit('$ionicSideMenuClose', 'right');
    } else {
      self.openPercentage(-100);
      $rootScope.$emit('$ionicSideMenuOpen', 'right');
    }
  };

  self.toggleTop = function(shouldOpen) {
    if (!self.top.isEnabled) return;
    var openAmount = self.getOpenAmount();
    if (arguments.length === 0) {
      shouldOpen = openAmount <= 0;
    }
    self.content.enableAnimation();
    if (!shouldOpen) {
      self.openPercentage(0);
      $rootScope.$emit('$ionicSideMenuClose', 'top');
    } else {
      self.openPercentage(100);
      $rootScope.$emit('$ionicSideMenuClose', 'top');
    }
  };

  self.toggle = function(side) {
    if (side == 'top') {
      self.toggleTop();
    } else if (side == 'right') {
      self.toggleRight();
    } else {
      self.toggleLeft();
    }
  };

  /**
   * Close all menus.
   */
  self.close = function() {
    self.openPercentage(0);
    $rootScope.$emit('$ionicSideMenuClose', 'left');
    $rootScope.$emit('$ionicSideMenuClose', 'right');
    $rootScope.$emit('$ionicSideMenuClose', 'top');
  };

  /**
   * @return {float} The amount the menu is open, if top menu is enabled getTranslateY otherwise
   * getTranslateX will grab either positive or negative for left (positive), or right (negative)
   */
  self.getOpenAmount = function() {
    if ( self.content.topMenuEnabled) {
      return self.content.getTranslateY();
    } else {
      return self.content && self.content.getTranslateX() || 0;
    }
  };

  /**
   * @return {float} The ratio of open amount over menu width. For example, a
   * menu of width 100 open 50 pixels would be open 50% or a ratio of 0.5. Value is negative
   * for right menu.
   */
  self.getOpenRatio = function() {
    var amount = self.getOpenAmount();
    if (self.content.topMenuEnabled) {
      return amount / self.top.height;
    } else if (amount >= 0) {
      return amount / self.left.width;
    } else {
      return amount / self.right.width;
    }
  };

  self.isOpen = function() {
    return self.getOpenAmount() !== 0;
  };

  /**
   * @return {float} The percentage of open amount over menu width. For example, a
   * menu of width 100 open 50 pixels would be open 50%. Value is negative
   * for right menu.
   */
  self.getOpenPercentage = function() {
    return self.getOpenRatio() * 100;
  };

  /**
   * Open the menu with a given percentage amount.
   * @param {float} percentage The percentage (positive or negative for left/right) to open the menu.
   */
  self.openPercentage = function(percentage) {
    var p = percentage / 100;

    if (self.content.topMenuEnabled) {
      self.openAmount(self.top.height * p);
    } else {
      if (self.left && percentage >= 0) {
        self.openAmount(self.left.width * p);
      } else if (self.right && percentage < 0) {
        self.openAmount(self.right.width * p);
      }
    }

    // add the CSS class "menu-open" if the percentage does not
    // equal 0, otherwise remove the class from the body element
    $ionicBody.enableClass((percentage !== 0), 'menu-open');

    self.content.setCanScroll(percentage === 0);
  };

  /*
  function freezeAllScrolls(shouldFreeze) {
    if (shouldFreeze && !self.isScrollFreeze) {
      $ionicScrollDelegate.freezeAllScrolls(shouldFreeze);

    } else if (!shouldFreeze && self.isScrollFreeze) {
      $ionicScrollDelegate.freezeAllScrolls(false);
    }
    self.isScrollFreeze = shouldFreeze;
  }
  */

  /**
   * Open the menu the given pixel amount.
   * @param {float} amount the pixel amount to open the menu. Positive value for left menu,
   * negative value for right menu (only one menu will be visible at a time).
   */
  self.openAmount = function(amount) {
    var maxLeft = self.left && self.left.width || 0;
    var maxRight = self.right && self.right.width || 0;
    var maxTop = self.top && self.top.height || 0;

    // If TopMenu Enabled there is no need to go further.
    if (self.content.topMenuEnabled) {
      var setAmount = amount > maxTop ? maxTop : amount
      self.content.setTranslateY(setAmount < 0 ? 0 : setAmount);
      return;
    }
    // Check if we can move to that side, depending if the left/right panel is enabled
    if (!(self.left && self.left.isEnabled) && amount > 0) {
      self.content.setTranslateX(0);
      return;
    }

    if (!(self.right && self.right.isEnabled) && amount < 0) {
      self.content.setTranslateX(0);
      return;
    }

    if (!(self.top && self.top.isEnabled) && amount < 0) {
      self.content.setTranslateY(0);
      return;
    }

    if (leftShowing && amount > maxLeft) {
      self.content.setTranslateX(maxLeft);
      return;
    }

    if (rightShowing && amount < -maxRight) {
      self.content.setTranslateX(-maxRight);
      return;
    }

    self.content.setTranslateX(amount);
    
    if (amount >= 0) {
      leftShowing = true;
      rightShowing = false;

      if (amount > 0) {
        // Push the z-index of the right menu down
        self.right && self.right.pushDown && self.right.pushDown();
        // Bring the z-index of the left menu up
        self.left && self.left.bringUp && self.left.bringUp();
      }
    } else {
      rightShowing = true;
      leftShowing = false;

      // Bring the z-index of the right menu up
      self.right && self.right.bringUp && self.right.bringUp();
      // Push the z-index of the left menu down
      self.left && self.left.pushDown && self.left.pushDown();
    }
  };
  /**
   * Given an event object, find the final resting position of this side
   * menu. For example, if the user "throws" the content to the right and
   * releases the touch, the left menu should snap open (animated, of course).
   *
   * @param {Event} e the gesture event to use for snapping
   */
  self.snapToRest = function(e) {
    // We want to animate at the end of this
    self.content.enableAnimation();
    isDragging = false;

    // Check how much the panel is open after the drag, and
    // what the drag velocity is
    var ratio = self.getOpenRatio();

    if (ratio === 0) {
      // Just to be safe
      self.openPercentage(0);
      return;
    }

    var velocityThreshold = 0.3;
    var velocityX = e.gesture.velocityX;
    var velocityY = e.gesture.velocityY;
    var direction = e.gesture.direction;

    // Going right, less than half, too slow (snap back)
    if (ratio > 0 && ratio < 0.5 && direction == 'right' && velocityX < velocityThreshold) {
      self.openPercentage(0);
    }

    // Going left, more than half, too slow (snap back)
    else if (ratio > 0.5 && direction == 'left' && velocityX < velocityThreshold) {
      self.openPercentage(100);
    }

    // Going left, less than half, too slow (snap back)
    else if (ratio < 0 && ratio > -0.5 && direction == 'left' && velocityX < velocityThreshold) {
      self.openPercentage(0);
    }

    // Going right, more than half, too slow (snap back)
    else if (ratio < 0.5 && direction == 'right' && velocityX < velocityThreshold) {
      self.openPercentage(-100);
    }

    // Going right, more than half, or quickly (snap open)
    else if (direction == 'right' && ratio >= 0 && (ratio >= 0.5 || velocityX > velocityThreshold)) {
      self.openPercentage(100);
    }

    // Going left, more than half, or quickly (span open)
    else if (direction == 'left' && ratio <= 0 && (ratio <= -0.5 || velocityX > velocityThreshold)) {
      self.openPercentage(-100);
    }

    // Going down, less than half, too slow (snap back)
    else if (ratio > 0 && ratio < 0.5 && direction == 'down' && velocityY < velocityThreshold) {
      self.openPercentage(0);
    }

    // Going up, more than half, too slow (snap back)
    else if (ratio > 0.5 && direction == 'up' && velocityY < velocityThreshold) {
      self.openPercentage(100);
    }

    // Going down, more than half, or quickly (snap open)
    else if (direction == 'down' && ratio >= 0 && (ratio >= 0.5 || velocityY > velocityThreshold)) {
      self.openPercentage(100);
    }
    // Snap back for safety
    else {
      self.openPercentage(0);
    }
  };

  self.enableMenuWithBackViews = function(val) {
    if (arguments.length) {
      enableMenuWithBackViews = !!val;
    }
    return enableMenuWithBackViews;
  };

  self.isAsideExposed = function() {
    return !!isAsideExposed;
  };

  self.exposeAside = function(shouldExposeAside) {
    if (!(self.left && self.left.isEnabled) && !(self.right && self.right.isEnabled)) return;
    self.close();

    isAsideExposed = shouldExposeAside;
    if ((self.left && self.left.isEnabled) && (self.right && self.right.isEnabled)) {
      self.content.setMarginLeftAndRight(isAsideExposed ? self.left.width : 0, isAsideExposed ? self.right.width : 0);
    } else if (self.left && self.left.isEnabled) {
      // set the left marget width if it should be exposed
      // otherwise set false so there's no left margin
      self.content.setMarginLeft(isAsideExposed ? self.left.width : 0);
    } else if (self.right && self.right.isEnabled) {
      self.content.setMarginRight(isAsideExposed ? self.right.width : 0);
    }
    self.$scope.$emit('$ionicExposeAside', isAsideExposed);
  };

  self.activeAsideResizing = function(isResizing) {
    $ionicBody.enableClass(isResizing, 'aside-resizing');
  };

  // End a drag with the given event
  self._endDrag = function(e) {
    if (isAsideExposed) return;

    if (isDragging) {
      self.snapToRest(e);
    }
    startPos = null;
    lastPos = null;
    offSetPos = null;
  };

  // Handle a drag event
  self._handleDrag = function(e) {
    debugger;
    if (isAsideExposed || !$scope.dragContent) return;

    // Set Axis Directions based on side/top menu
    if (self.content.topMenuEnabled) {
      var axisDirection = 'pageY';
      var dragThreshold = self.dragThresholdY;
    } else {
      var axisDirection = 'pageX';
      var dragThreshold = self.dragThresholdX;
    }

    // If we don't have start coords, grab and store them
    if (!startPos) {
      startPos = e.gesture.touches[0][axisDirection];
      lastPos = startPos;
    } else {
      // Grab the current tap coords
      lastPos = e.gesture.touches[0][axisDirection];
    }

    // Calculate difference from the tap points
    if (!isDragging && Math.abs(lastPos - startPos) > dragThreshold) {
      // if the difference is greater than threshold, start dragging using the current
      // point as the starting point
      startPos = lastPos;

      isDragging = true;
      // Initialize dragging
      self.content.disableAnimation();
      offSetPos = self.getOpenAmount();
    }

    if (isDragging) {
      self.openAmount(offSetPos + (lastPos - startPos));
      self.content.setCanScroll(false);
    }
  };

  self.canDragContent = function(canDrag) {
    if (arguments.length) {
      $scope.dragContent = !!canDrag;
    }
    return $scope.dragContent;
  };

  self.edgeThreshold = 25;
  self.edgeThresholdEnabled = false;

  self.edgeDragThreshold = function(value) {
    if (arguments.length) {
      if (isNumber(value) && value > 0) {
        self.edgeThreshold = value;
        self.edgeThresholdEnabled = true;
      } else {
        self.edgeThresholdEnabled = !!value;
      }
    }
    return self.edgeThresholdEnabled;
  };

  self.isDraggableTarget = function(e) {
    //Only restrict edge when sidemenu is closed and restriction is enabled
    var shouldOnlyAllowEdgeDrag = self.edgeThresholdEnabled && !self.isOpen();
    if ( self.content.topMenuEnabled ) {
      var startPos = e.gesture.startEvent && e.gesture.startEvent.center &&
        e.gesture.startEvent.center.pageY;
      var dragOffset = self.content.element.offsetHeight; 
    } else {
      var startPos = e.gesture.startEvent && e.gesture.startEvent.center &&
        e.gesture.startEvent.center.pageX;
        var dragOffset = self.content.element.offsetWidth;
    }

    var dragIsWithinBounds = !shouldOnlyAllowEdgeDrag ||
      startPos <= self.edgeThreshold ||
      startPos >= dragOffset - self.edgeThreshold;

    var backView = $ionicHistory.backView();
    var menuEnabled = enableMenuWithBackViews ? true : !backView;
    if (!menuEnabled) {
      var currentView = $ionicHistory.currentView() || {};
      return (dragIsWithinBounds && (backView.historyId !== currentView.historyId));
    }

    return ($scope.dragContent || self.isOpen()) &&
      dragIsWithinBounds &&
      !e.gesture.srcEvent.defaultPrevented &&
      menuEnabled &&
      !e.target.tagName.match(/input|textarea|select|object|embed/i) &&
      !e.target.isContentEditable &&
      !(e.target.dataset ? e.target.dataset.preventScroll : e.target.getAttribute('data-prevent-scroll') == 'true');
  };

  $scope.sideMenuContentTranslateX = 0;
  $scope.sideMenuContentTranslateY = 0;

  var deregisterBackButtonAction = noop;
  var closeSideMenu = angular.bind(self, self.close);

  $scope.$watch(function() {
    return self.getOpenAmount() !== 0;
  }, function(isOpen) {
    deregisterBackButtonAction();
    if (isOpen) {
      deregisterBackButtonAction = $ionicPlatform.registerBackButtonAction(
        closeSideMenu,
        IONIC_BACK_PRIORITY.sideMenu
      );
    }
  });

  var deregisterInstance = $ionicSideMenuDelegate._registerInstance(
    self, $attrs.delegateHandle, function() {
      return $ionicHistory.isActiveScope($scope);
    }
  );

  $scope.$on('$destroy', function() {
    deregisterInstance();
    deregisterBackButtonAction();
    self.$scope = null;
    if (self.content) {
      self.content.setCanScroll(true);
      self.content.element = null;
      self.content = null;
    }
  });

  self.initialize({
    left: {
      width: 275
    },
    right: {
      width: 275
    },
    top: {
      height: 450
    }
  });
}]);
