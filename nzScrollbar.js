(function() {

    var module = angular.module('nzScrollbar', []);

    module.directive('nzScrollbar', ['$interval', '$timeout',
        function($interval, $timeout) {
            return {
                restrict: 'EA',
                transclude: true,
                template: [
                    '<div class="nzScrollbar-outer">',
                    '   <div ng-transclude class="nzScrollbar-inner"></div>',
                    '   <div class="nzScrollbar-indicator-wrap">',
                    '       <div class="nzScrollbar-indicator">',
                    '   </div>',
                    '</div>'
                ].join(' '),
                link: function($scope, el, attrs) {

                    initCrossBrowserWheelEvent();

                    var container,
                        inner,
                        indicator,
                        relative,
                        containerHeight,
                        containerPadding,
                        innerHeight,
                        min,
                        max,
                        offset,
                        oldOffset,
                        reference,
                        pressed,
                        inidicatorPressed,
                        xform,
                        velocity,
                        frame,
                        timestamp,
                        ticker,
                        amplitude,
                        target,
                        timeConstant,
                        useCssTranslate = attrs.useCssTranslate !== "false";

                    var wheelSpeed = 40;
                    var deferreds = {},
                        methods = {},
                        uuid = 0;

                    container = el;
                    outer = angular.element(el[0].querySelector('.nzScrollbar-outer'));
                    inner = angular.element(el[0].querySelector('.nzScrollbar-inner'));
                    indicator = angular.element(el[0].querySelector('.nzScrollbar-indicator'));

                    // Touch Events
                    container[0].addEventListener('touchstart', tap);

                    // Click Events
                    indicator[0].addEventListener('mousedown', indicatorClick);

                    // Scroll Events
                    addWheelListener(container[0], wheel);

                    if (window.addResizeListener) {
                        window.addResizeListener(inner[0], resize);
                        $scope.$on('$destroy', function() {
                            window.removeResizeListener(inner[0], resize);
                        });
                    }

                    init();


                    function init() {
                        container.addClass('nzScrollbar');
                        timeConstant = 325; // ms
                        pressed = false;

                        build();
                    }

                    function build() {
                        containerPadding = parseInt(getStyle(el[0], 'paddingTop'), 10) + parseInt(getStyle(el[0], 'paddingBottom'), 10);
                        containerPadding = containerPadding ? containerPadding : 0;
                        containerHeight = el[0].scrollHeight - containerPadding;
                        innerHeight = inner[0].scrollHeight;
                        max = innerHeight - containerHeight + containerPadding;
                        max = max < 0 ? 0 : max;
                        if (typeof offset === 'undefined') {
                            offset = min = 0;
                        }

                        // Styles
                        indicator.css({
                            height: ((containerHeight) / innerHeight) * (containerHeight) + 'px',
                            display: (containerHeight) / innerHeight >= 1 ? 'none' : 'initial'
                        });

                        if(angular.element(el).height() >= innerHeight) {
                          indicator.parent().addClass('noScroll');
                          angular.element(el).addClass('noScroll');
                        } else {
                          /* added for the resize case */
                          indicator.parent().removeClass('noScroll');
                          angular.element(el).removeClass('noScroll');
                        }

                    }

                    function resize() {
                        build();
                        scroll(offset);
                    }

                    function getStyle(el, cssprop) {
                        if (el.currentStyle) //IE
                            return el.currentStyle[cssprop];
                        else if (document.defaultView && document.defaultView.getComputedStyle) //Firefox
                            return document.defaultView.getComputedStyle(el, "")[cssprop];
                        else //try and get inline style
                            return el.style[cssprop];
                    }






                    function ypos(e) {
                        // touch event
                        if (e.targetTouches && (e.targetTouches.length >= 1)) {
                            return e.targetTouches[0].clientY;
                        }

                        // mouse event
                        return e.clientY;
                    }

                    function scroll(y) {
                        offset = (y > max) ? max : (y < min) ? min : y;

                        //Check scroll method
                        if (useCssTranslate) {
                            inner.css({
                                webkitTransform: 'translateY(' + (-offset) + 'px)',
                                transform: 'translateY(' + (-offset) + 'px)'
                            });
                        } else {
                            inner.css({
                                top: -offset + 'px'
                            });
                        }

                        indicator.css({
                            webkitTransform: 'translateY(' + (offset / max * ((containerHeight) - parseInt(indicator.css('height')))) + 'px)',
                            transform: 'translateY(' + (offset / max * ((containerHeight) - parseInt(indicator.css('height')))) + 'px)'
                        });
                        return offset;
                    }

                    function track() {
                        var now, elapsed, delta, v;

                        now = Date.now();
                        elapsed = now - timestamp;
                        timestamp = now;
                        delta = offset - frame;
                        frame = offset;

                        v = 1000 * delta / (1 + elapsed);
                        velocity = 0.8 * v + 0.2 * velocity;
                    }

                    function autoScroll(isIndicator) {
                        var elapsed, delta;

                        if (amplitude) {
                            elapsed = Date.now() - timestamp;
                            delta = -amplitude * Math.exp(-elapsed / timeConstant);
                            if (delta > 0.5 || delta < -0.5) {
                                scroll(target + delta);
                                requestAnimationFrame(autoScroll);
                            } else {
                                scroll(target);
                            }
                        }
                    }

                    function wheel(e) {
                        e = window.event || e; // old IE support

                        // CrossBrowser Equalization
                        var change = -(e.deltaY || e.detail || (-1 / 3 * e.wheelDelta)) / 40;
                        change = isNaN(change) ? 0 : change;

                        // Handle Physical Mouse Wheel in Firefox
                        if (e.deltaMode && !e.wheelDelta) {
                            change *= 8;
                        }
                        // Handle Everything else
                        else {
                            // console.log(e.deltaY, e.detail, -(-1 / 3 * e.wheelDelta) / 40);
                        }

                        // Regular Multipier
                        offset -= change * 30;

                        scroll(offset);

                        if (offset === 0 || offset === max) {
                            return;
                        } else {
                            e.preventDefault(e);
                            e.stopPropagation(e);
                            e.returnValue = false;
                            return false;
                        }
                    }

                    function indicatorClick(e) {
                        window.addEventListener('mousemove', indicatorDrag);
                        window.addEventListener('mouseup', indicatorRelease);
                        container[0].removeEventListener('mouseenter', build);
                        container.addClass('dragging');

                        indicatorPressed = true;
                        reference = ypos(e);

                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }

                    function indicatorDrag(e) {
                        var y, delta;
                        if (indicatorPressed) {
                            y = ypos(e);
                            delta = reference - y;
                            reference = y;
                            delta *= (innerHeight / (containerHeight));
                            scroll(offset - delta);
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }

                    function indicatorRelease(e) {
                        container[0].addEventListener('mouseenter', build);
                        window.removeEventListener('mousemove', indicatorDrag);
                        window.removeEventListener('mouseup', indicatorRelease);
                        container.removeClass('dragging');

                        indicatorPressed = false;

                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }





                    function tap(e) {
                        window.addEventListener('touchmove', drag);
                        window.addEventListener('touchend', release);

                        window.removeEventListener('mouseenter', build);

                        pressed = true;
                        reference = ypos(e);

                        velocity = amplitude = 0;
                        frame = offset;
                        timestamp = Date.now();
                        clearInterval(ticker);
                        ticker = $interval(track, 10);

                        if (offset === 0 || offset === max) {
                            return;
                        } else {
                            e.preventDefault();
                            e.stopPropagation();
                            e.returnValue = false;
                            return false;
                        }
                    }

                    function drag(e) {
                        var y, delta;
                        if (pressed) {
                            y = ypos(e);
                            delta = reference - y;
                            if (delta > 2 || delta < -2) {
                                reference = y;
                                scroll(offset + delta);
                            }
                            if (offset === 0 || offset === max) {
                                return;
                            }
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        e.returnValue = false;
                        return false;
                    }

                    function release(e) {
                        window.removeEventListener('touchmove', drag);
                        window.removeEventListener('touchend', release);

                        window.addEventListener('mouseenter', build);

                        pressed = false;

                        $interval.cancel(ticker);
                        if (velocity > 10 || velocity < -10) {
                            amplitude = 0.6 * velocity;
                            target = Math.round(offset + amplitude);
                            timestamp = Date.now();
                            requestAnimationFrame(autoScroll);
                        }

                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }



                    function debounce(func, threshold, execAsap) {

                        var timeout;

                        return function debounced() {
                            var obj = this,
                                args = arguments;

                            function delayed() {
                                if (!execAsap)
                                    func.apply(obj, args);
                                timeout = null;
                            }

                            if (timeout)
                                clearTimeout(timeout);
                            else if (execAsap)
                                func.apply(obj, args);

                            timeout = setTimeout(delayed, threshold || 100);
                        };
                    }



                    // CrossBrowser Wheel Listener.
                    // https://developer.mozilla.org/en-US/docs/Web/Events/wheel
                    function initCrossBrowserWheelEvent() {

                        if (window.addWheelListener) {
                            return;
                        }

                        var prefix = "",
                            _addEventListener, onwheel, support;

                        // detect event model
                        if (window.addEventListener) {
                            _addEventListener = "addEventListener";
                        } else {
                            _addEventListener = "attachEvent";
                            prefix = "on";
                        }

                        // detect available wheel event
                        support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
                            document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
                            "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox

                        window.addWheelListener = function(elem, callback, useCapture) {
                            _addWheelListener(elem, support, callback, useCapture);

                            // handle MozMousePixelScroll in older Firefox
                            if (support == "DOMMouseScroll") {
                                _addWheelListener(elem, "MozMousePixelScroll", callback, useCapture);
                            }
                        };

                        function _addWheelListener(elem, eventName, callback, useCapture) {
                            elem[_addEventListener](prefix + eventName, support == "wheel" ? callback : function(originalEvent) {
                                !originalEvent && (originalEvent = window.event);

                                // create a normalized event object
                                var event = {
                                    // keep a ref to the original event object
                                    originalEvent: originalEvent,
                                    target: originalEvent.target || originalEvent.srcElement,
                                    type: "wheel",
                                    deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
                                    deltaX: 0,
                                    deltaZ: 0,
                                    preventDefault: function() {
                                        originalEvent.preventDefault ?
                                            originalEvent.preventDefault() :
                                            originalEvent.returnValue = false;
                                    }
                                };

                                // calculate deltaY (and deltaX) according to the event
                                if (support == "mousewheel") {
                                    event.deltaY = -1 / 40 * originalEvent.wheelDelta;
                                    // Webkit also support wheelDeltaX
                                    originalEvent.wheelDeltaX && (event.deltaX = -1 / 40 * originalEvent.wheelDeltaX);
                                } else {
                                    event.deltaY = originalEvent.detail;
                                }

                                // it's time to fire the callback
                                return callback(event);

                            }, useCapture || false);
                        }

                    }

                }
            };
        }
    ]);

})();
