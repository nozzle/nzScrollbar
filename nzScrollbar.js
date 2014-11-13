(function() {

    var module = angular.module('nzScrollbar', []);

    module.directive('nzScrollbar', function($interval) {
        return {
            restrict: 'EA',
            transclude: true,
            template: [
                '<div class="nzScrollbar-outer">',
                '   <div ng-transclude class="nzScrollbar-inner"></div>',
                '   <div class="nzScrollbar-indicator"></div>',
                '</div>'
            ].join(' '),
            link: function($scope, el, attrs) {
                console.log(el);

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
                    reference,
                    pressed,
                    xform,
                    velocity,
                    frame,
                    timestamp,
                    ticker,
                    amplitude,
                    target,
                    timeConstant;

                var wheelSpeed = 40;

                container = el;
                outer = angular.element(el[0].querySelector('.nzScrollbar-outer'));
                inner = angular.element(el[0].querySelector('.nzScrollbar-inner'));
                indicator = angular.element(el[0].querySelector('.nzScrollbar-indicator'));

                containerHeight = parseInt(getComputedStyle(el[0]).height, 10);
                containerPadding = parseInt(getComputedStyle(el[0]).padding, 10);
                innerHeight = parseInt(getComputedStyle(inner[0]).height, 10);
                max = innerHeight - containerHeight + containerPadding * 2;
                max = max < 0 ? 0 : max;
                offset = min = 0;
                pressed = false;
                timeConstant = 325; // ms


                // Styles
                outer.css({
                    position: 'relative',
                    height: '100%',
                    overflow: 'hidden',
                });

                indicator.css({
                    position: 'absolute',
                    zIndex: 99,
                    top: '0px',
                    right: '3px',
                    width: '4px',
                    height: ((containerHeight - containerPadding) / innerHeight) * (containerHeight - containerPadding) + 'px',
                    backgroundColor: 'black',
                    opacity: '.05',
                    border: 'none',
                    margin: '5px 0 5px 0',
                    borderRadius: '1px',
                    transitionDuration: 'width .2s ease, height .2s ease, opacity .2s ease, background-color .2s ease, border-radius .2s ease',
                });



                //Events

                container[0].addEventListener('touchstart', tap);

                if (container[0].addEventListener) {
                    container[0].addEventListener("mousewheel", wheel, false); // IE9, Chrome, Safari, Opera
                    container[0].addEventListener("DOMMouseScroll", wheel, false); // Firefox
                } else container[0].attachEvent("onmousewheel", wheel); // IE 6/7/8

                var moveEvent = document.createEvent("HTMLEvents");
                moveEvent.initEvent("move", true, true);






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
                    inner.css({
                        transform: 'translateY(' + (-offset) + 'px)'
                    });
                    indicator.css({
                        transform: 'translateY(' + (offset / max * ((containerHeight - containerPadding * 2) - parseInt(indicator.css('height')))) + 'px)'
                    });
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

                function autoScroll() {
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
                    var wheelSpeedDelta = -(e.deltaX || e.detail || (-1 / 3 * e.wheelDelta)) / 40;
                    console.log(wheelSpeedDelta);
                    offset -= wheelSpeedDelta * 30;

                    scroll(offset);

                    el[0].dispatchEvent(moveEvent);
                    e.preventDefault();
                    e.stopPropagation();
                    e.returnValue = false;
                    return false;


                    /*
                    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                    console.log(delta);
                    scroll(offset - delta * 5);
                    e.preventDefault();
                    e.stopPropagation();
                    e.returnValue = false;
                    return false;*/
                }

                function tap(e) {
                    container[0].addEventListener('touchmove', drag);
                    container[0].addEventListener('touchend', release);
                    pressed = true;
                    reference = ypos(e);

                    velocity = amplitude = 0;
                    frame = offset;
                    timestamp = Date.now();
                    clearInterval(ticker);
                    ticker = $interval(track, 10);

                    e.preventDefault();
                    e.stopPropagation();
                    return false;
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
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }

                function release(e) {
                    window.removeEventListener('mousemove', drag);
                    window.removeEventListener('mouseup', release);
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

            }
        };
    });

})();
