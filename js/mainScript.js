(function ($) {
    if (typeof _wpcf7 == 'undefined' || _wpcf7 === null)
        _wpcf7 = {};
    _wpcf7 = $.extend({
        cached: 0
    }, _wpcf7);
    $(function () {
        _wpcf7.supportHtml5 = $.wpcf7SupportHtml5();
        $('div.wpcf7 > form').wpcf7InitForm();
    });
    $.fn.wpcf7InitForm = function () {
        this.ajaxForm({
            beforeSubmit: function (arr, $form, options) {
                $form.wpcf7ClearResponseOutput();
                $form.find('[aria-invalid]').attr('aria-invalid', 'false');
                $form.find('img.ajax-loader').css({
                    visibility: 'visible'
                });
                return true;
            },
            beforeSerialize: function ($form, options) {
                $form.find('[placeholder].placeheld').each(function (i, n) {
                    $(n).val('');
                });
                return true;
            },
            data: {
                '_wpcf7_is_ajax_call': 1
            },
            dataType: 'json',
            success: $.wpcf7AjaxSuccess,
            error: function (xhr, status, error, $form) {
                var e = $('<div class="ajax-error"></div>').text(error.message);
                $form.after(e);
            }
        });
        if (_wpcf7.cached)
            this.wpcf7OnloadRefill();
        this.wpcf7ToggleSubmit();
        this.find('.wpcf7-submit').wpcf7AjaxLoader();
        this.find('.wpcf7-acceptance').click(function () {
            $(this).closest('form').wpcf7ToggleSubmit();
        });
        this.find('.wpcf7-exclusive-checkbox').wpcf7ExclusiveCheckbox();
        this.find('.wpcf7-list-item.has-free-text').wpcf7ToggleCheckboxFreetext();
        this.find('[placeholder]').wpcf7Placeholder();
        if (_wpcf7.jqueryUi && !_wpcf7.supportHtml5.date) {
            this.find('input.wpcf7-date[type="date"]').each(function () {
                $(this).datepicker({
                    dateFormat: 'yy-mm-dd',
                    minDate: new Date($(this).attr('min')),
                    maxDate: new Date($(this).attr('max'))
                });
            });
        }
        if (_wpcf7.jqueryUi && !_wpcf7.supportHtml5.number) {
            this.find('input.wpcf7-number[type="number"]').each(function () {
                $(this).spinner({
                    min: $(this).attr('min'),
                    max: $(this).attr('max'),
                    step: $(this).attr('step')
                });
            });
        }
    };
    $.wpcf7AjaxSuccess = function (data, status, xhr, $form) {
        if (!$.isPlainObject(data) || $.isEmptyObject(data))
            return;
        var $responseOutput = $form.find('div.wpcf7-response-output');
        $form.wpcf7ClearResponseOutput();
        $form.find('.wpcf7-form-control').removeClass('wpcf7-not-valid');
        $form.removeClass('invalid spam sent failed');
        if (data.captcha)
            $form.wpcf7RefillCaptcha(data.captcha);
        if (data.quiz)
            $form.wpcf7RefillQuiz(data.quiz);
        if (data.invalids) {
            $.each(data.invalids, function (i, n) {
                $form.find(n.into).wpcf7NotValidTip(n.message);
                $form.find(n.into).find('.wpcf7-form-control').addClass('wpcf7-not-valid');
                $form.find(n.into).find('[aria-invalid]').attr('aria-invalid', 'true');
            });
            $responseOutput.addClass('wpcf7-validation-errors');
            $form.addClass('invalid');
            $(data.into).trigger('invalid.wpcf7');
        } else if (1 == data.spam) {
            $responseOutput.addClass('wpcf7-spam-blocked');
            $form.addClass('spam');
            $(data.into).trigger('spam.wpcf7');
        } else if (1 == data.mailSent) {
            $responseOutput.addClass('wpcf7-mail-sent-ok');
            $form.addClass('sent');
            if (data.onSentOk)
                $.each(data.onSentOk, function (i, n) {
                    eval(n)
                });
            $(data.into).trigger('mailsent.wpcf7');
        } else {
            $responseOutput.addClass('wpcf7-mail-sent-ng');
            $form.addClass('failed');
            $(data.into).trigger('mailfailed.wpcf7');
        }
        if (data.onSubmit)
            $.each(data.onSubmit, function (i, n) {
                eval(n)
            });
        $(data.into).trigger('submit.wpcf7');
        if (1 == data.mailSent)
            $form.resetForm();
        $form.find('[placeholder].placeheld').each(function (i, n) {
            $(n).val($(n).attr('placeholder'));
        });
        $responseOutput.append(data.message).slideDown('fast');
        $responseOutput.attr('role', 'alert');
        $.wpcf7UpdateScreenReaderResponse($form, data);
    }
    $.fn.wpcf7ExclusiveCheckbox = function () {
        return this.find('input:checkbox').click(function () {
            $(this).closest('.wpcf7-checkbox').find('input:checkbox').not(this).removeAttr('checked');
        });
    };
    $.fn.wpcf7Placeholder = function () {
        if (_wpcf7.supportHtml5.placeholder)
            return this;
        return this.each(function () {
            $(this).val($(this).attr('placeholder'));
            $(this).addClass('placeheld');
            $(this).focus(function () {
                if ($(this).hasClass('placeheld'))
                    $(this).val('').removeClass('placeheld');
            });
            $(this).blur(function () {
                if ('' == $(this).val()) {
                    $(this).val($(this).attr('placeholder'));
                    $(this).addClass('placeheld');
                }
            });
        });
    };
    $.fn.wpcf7AjaxLoader = function () {
        return this.each(function () {
            var loader = $('<img class="ajax-loader" />').attr({
                src: _wpcf7.loaderUrl,
                alt: _wpcf7.sending
            }).css('visibility', 'hidden');
            $(this).after(loader);
        });
    };
    $.fn.wpcf7ToggleSubmit = function () {
        return this.each(function () {
            var form = $(this);
            if (this.tagName.toLowerCase() != 'form')
                form = $(this).find('form').first();
            if (form.hasClass('wpcf7-acceptance-as-validation'))
                return;
            var submit = form.find('input:submit');
            if (!submit.length) return;
            var acceptances = form.find('input:checkbox.wpcf7-acceptance');
            if (!acceptances.length) return;
            submit.removeAttr('disabled');
            acceptances.each(function (i, n) {
                n = $(n);
                if (n.hasClass('wpcf7-invert') && n.is(':checked') || !n.hasClass('wpcf7-invert') && !n.is(':checked'))
                    submit.attr('disabled', 'disabled');
            });
        });
    };
    $.fn.wpcf7ToggleCheckboxFreetext = function () {
        return this.each(function () {
            var $wrap = $(this).closest('.wpcf7-form-control');
            if ($(this).find(':checkbox, :radio').is(':checked')) {
                $(this).find(':input.wpcf7-free-text').prop('disabled', false);
            } else {
                $(this).find(':input.wpcf7-free-text').prop('disabled', true);
            }
            $wrap.find(':checkbox, :radio').change(function () {
                var $cb = $('.has-free-text', $wrap).find(':checkbox, :radio');
                var $freetext = $(':input.wpcf7-free-text', $wrap);
                if ($cb.is(':checked')) {
                    $freetext.prop('disabled', false).focus();
                } else {
                    $freetext.prop('disabled', true);
                }
            });
        });
    };
    $.fn.wpcf7NotValidTip = function (message) {
        return this.each(function () {
            var $into = $(this);
            $into.hide().append('<span role="alert" class="wpcf7-not-valid-tip">' + message + '</span>').slideDown('fast');
            if ($into.is('.use-floating-validation-tip *')) {
                $('.wpcf7-not-valid-tip', $into).mouseover(function () {
                    $(this).wpcf7FadeOut();
                });
                $(':input', $into).focus(function () {
                    $('.wpcf7-not-valid-tip', $into).not(':hidden').wpcf7FadeOut();
                });
            }
        });
    };
    $.fn.wpcf7FadeOut = function () {
        return this.each(function () {
            $(this).animate({
                opacity: 0
            }, 'fast', function () {
                $(this).css({
                    'z-index': -100
                });
            });
        });
    };
    $.fn.wpcf7OnloadRefill = function () {
        return this.each(function () {
            var url = $(this).attr('action');
            if (0 < url.indexOf('#'))
                url = url.substr(0, url.indexOf('#'));
            var id = $(this).find('input[name="_wpcf7"]').val();
            var unitTag = $(this).find('input[name="_wpcf7_unit_tag"]').val();
            $.getJSON(url, {
                _wpcf7_is_ajax_call: 1,
                _wpcf7: id,
                _wpcf7_request_ver: $.now()
            }, function (data) {
                if (data && data.captcha)
                    $('#' + unitTag).wpcf7RefillCaptcha(data.captcha);
                if (data && data.quiz)
                    $('#' + unitTag).wpcf7RefillQuiz(data.quiz);
            });
        });
    };
    $.fn.wpcf7RefillCaptcha = function (captcha) {
        return this.each(function () {
            var form = $(this);
            $.each(captcha, function (i, n) {
                form.find(':input[name="' + i + '"]').clearFields();
                form.find('img.wpcf7-captcha-' + i).attr('src', n);
                var match = /([0-9]+)\.(png|gif|jpeg)$/.exec(n);
                form.find('input:hidden[name="_wpcf7_captcha_challenge_' + i + '"]').attr('value', match[1]);
            });
        });
    };
    $.fn.wpcf7RefillQuiz = function (quiz) {
        return this.each(function () {
            var form = $(this);
            $.each(quiz, function (i, n) {
                form.find(':input[name="' + i + '"]').clearFields();
                form.find(':input[name="' + i + '"]').siblings('span.wpcf7-quiz-label').text(n[0]);
                form.find('input:hidden[name="_wpcf7_quiz_answer_' + i + '"]').attr('value', n[1]);
            });
        });
    };
    $.fn.wpcf7ClearResponseOutput = function () {
        return this.each(function () {
            $(this).find('div.wpcf7-response-output').hide().empty().removeClass('wpcf7-mail-sent-ok wpcf7-mail-sent-ng wpcf7-validation-errors wpcf7-spam-blocked').removeAttr('role');
            $(this).find('span.wpcf7-not-valid-tip').remove();
            $(this).find('img.ajax-loader').css({
                visibility: 'hidden'
            });
        });
    };
    $.wpcf7UpdateScreenReaderResponse = function ($form, data) {
        $('.wpcf7 .screen-reader-response').html('').attr('role', '');
        if (data.message) {
            var $response = $form.siblings('.screen-reader-response').first();
            $response.append(data.message);
            if (data.invalids) {
                var $invalids = $('<ul></ul>');
                $.each(data.invalids, function (i, n) {
                    if (n.idref) {
                        var $li = $('<li></li>').append($('<a></a>').attr('href', '#' + n.idref).append(n.message));
                    } else {
                        var $li = $('<li></li>').append(n.message);
                    }
                    $invalids.append($li);
                });
                $response.append($invalids);
            }
            $response.attr('role', 'alert').focus();
        }
    }
    $.wpcf7SupportHtml5 = function () {
        var features = {};
        var input = document.createElement('input');
        features.placeholder = 'placeholder' in input;
        var inputTypes = ['email', 'url', 'tel', 'number', 'range', 'date'];
        $.each(inputTypes, function (index, value) {
            input.setAttribute('type', value);
            features[value] = input.type !== 'text';
        });
        return features;
    };
})(jQuery);;; + function ($) {
    "use strict";
    var Collapse = function (element, options) {
        this.$element = $(element)
        this.options = $.extend({}, Collapse.DEFAULTS, options)
        this.transitioning = null
        if (this.options.parent) this.$parent = $(this.options.parent)
        if (this.options.toggle) this.toggle()
    }
    Collapse.DEFAULTS = {
        toggle: true
    }
    Collapse.prototype.dimension = function () {
        var hasWidth = this.$element.hasClass('width')
        return hasWidth ? 'width' : 'height'
    }
    Collapse.prototype.show = function () {
        if (this.transitioning || this.$element.hasClass('in')) return
        var startEvent = $.Event('show.bs.collapse')
        this.$element.trigger(startEvent)
        if (startEvent.isDefaultPrevented()) return
        var actives = this.$parent && this.$parent.find('> .panel > .in')
        if (actives && actives.length) {
            var hasData = actives.data('bs.collapse')
            if (hasData && hasData.transitioning) return
            actives.collapse('hide')
            hasData || actives.data('bs.collapse', null)
        }
        var dimension = this.dimension()
        this.$element.removeClass('collapse').addClass('collapsing')[dimension](0)
        this.transitioning = 1
        var complete = function () {
            this.$element.removeClass('collapsing').addClass('in')[dimension]('auto')
            this.transitioning = 0
            this.$element.trigger('shown.bs.collapse')
        }
        if (!$.support.transition) return complete.call(this)
        var scrollSize = $.camelCase(['scroll', dimension].join('-'))
        this.$element.one($.support.transition.end, $.proxy(complete, this)).emulateTransitionEnd(350)[dimension](this.$element[0][scrollSize])
    }
    Collapse.prototype.hide = function () {
        if (this.transitioning || !this.$element.hasClass('in')) return
        var startEvent = $.Event('hide.bs.collapse')
        this.$element.trigger(startEvent)
        if (startEvent.isDefaultPrevented()) return
        var dimension = this.dimension()
        this.$element[dimension](this.$element[dimension]())[0].offsetHeight
        this.$element.addClass('collapsing').removeClass('collapse').removeClass('in')
        this.transitioning = 1
        var complete = function () {
            this.transitioning = 0
            this.$element.trigger('hidden.bs.collapse').removeClass('collapsing').addClass('collapse')
        }
        if (!$.support.transition) return complete.call(this)
        this.$element[dimension](0).one($.support.transition.end, $.proxy(complete, this)).emulateTransitionEnd(350)
    }
    Collapse.prototype.toggle = function () {
        this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }
    var old = $.fn.collapse
    $.fn.collapse = function (option) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.collapse')
            var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)
            if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }
    $.fn.collapse.Constructor = Collapse
    $.fn.collapse.noConflict = function () {
        $.fn.collapse = old
        return this
    }
    $(document).on('click.bs.collapse.data-api', '[data-toggle=collapse]', function (e) {
        var $this = $(this),
            href
        var target = $this.attr('data-target') || e.preventDefault() || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')
        var $target = $(target)
        var data = $target.data('bs.collapse')
        var option = data ? 'toggle' : $this.data()
        var parent = $this.attr('data-parent')
        var $parent = parent && $(parent)
        if (!data || !data.transitioning) {
            if ($parent) $parent.find('[data-toggle=collapse][data-parent="' + parent + '"]').not($this).addClass('collapsed')
            $this[$target.hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
        }
        $target.collapse(option)
    })
}(jQuery);; + function ($) {
    "use strict";

    function transitionEnd() {
        var el = document.createElement('bootstrap')
        var transEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd otransitionend',
            'transition': 'transitionend'
        }
        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return {
                    end: transEndEventNames[name]
                }
            }
        }
    }
    $.fn.emulateTransitionEnd = function (duration) {
        var called = false,
            $el = this
        $(this).one($.support.transition.end, function () {
            called = true
        })
        var callback = function () {
            if (!called) $($el).trigger($.support.transition.end)
        }
        setTimeout(callback, duration)
        return this
    }
    $(function () {
        $.support.transition = transitionEnd()
    })
}(jQuery);;;
(function (window) {
    'use strict';
    var docElem = window.document.documentElement;

    function getViewportH() {
        var client = docElem['clientHeight'],
            inner = window['innerHeight'];
        if (client < inner)
            return inner;
        else
            return client;
    }

    function scrollY() {
        return window.pageYOffset || docElem.scrollTop;
    }

    function getOffset(el) {
        var offsetTop = 0,
            offsetLeft = 0;
        do {
            if (!isNaN(el.offsetTop)) {
                offsetTop += el.offsetTop;
            }
            if (!isNaN(el.offsetLeft)) {
                offsetLeft += el.offsetLeft;
            }
        } while (el = el.offsetParent)
        return {
            top: offsetTop,
            left: offsetLeft
        }
    }

    function inViewport(el, h) {
        var elH = el.offsetHeight,
            scrolled = scrollY(),
            viewed = scrolled + getViewportH(),
            elTop = getOffset(el).top,
            elBottom = elTop + elH,
            h = h || 0;
        return (elTop + elH * h) <= viewed && (elBottom) >= scrolled;
    }

    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }

    function cbpScroller(el, options) {
        this.el = el;
        this.options = extend(this.defaults, options);
        this._init();
    }
    cbpScroller.prototype = {
        defaults: {
            viewportFactor: 0.2
        },
        _init: function () {
            if (Modernizr.touch) return;
            this.sections = Array.prototype.slice.call(this.el.querySelectorAll('.section'));
            this.didScroll = false;
            var self = this;
            this.sections.forEach(function (el, i) {
                if (!inViewport(el)) {
                    classie.add(el, 'init');
                }
            });
            setTimeout(function () {
                self._scrollPage();
            }, 60);
            var scrollHandler = function () {
                    if (!self.didScroll) {
                        self.didScroll = true;
                        setTimeout(function () {
                            self._scrollPage();
                        }, 60);
                    }
                },
                resizeHandler = function () {
                    function delayed() {
                        self._scrollPage();
                        self.resizeTimeout = null;
                    }
                    if (self.resizeTimeout) {
                        clearTimeout(self.resizeTimeout);
                    }
                    self.resizeTimeout = setTimeout(delayed, 200);
                };
            window.addEventListener('scroll', scrollHandler, false);
            window.addEventListener('resize', resizeHandler, false);
        },
        _scrollPage: function () {
            var self = this;
            this.sections.forEach(function (el, i) {
                if (inViewport(el, self.options.viewportFactor)) {
                    classie.add(el, 'animate');
                } else {
                    classie.add(el, 'init');
                }
            });
            this.didScroll = false;
        }
    }
    window.cbpScroller = cbpScroller;
})(window);;
/*
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 *
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */
(function (window) {
    'use strict';

    function classReg(className) {
        return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }
    var hasClass, addClass, removeClass;
    if ('classList' in document.documentElement) {
        hasClass = function (elem, c) {
            return elem.classList.contains(c);
        };
        addClass = function (elem, c) {
            elem.classList.add(c);
        };
        removeClass = function (elem, c) {
            elem.classList.remove(c);
        };
    } else {
        hasClass = function (elem, c) {
            return classReg(c).test(elem.className);
        };
        addClass = function (elem, c) {
            if (!hasClass(elem, c)) {
                elem.className = elem.className + ' ' + c;
            }
        };
        removeClass = function (elem, c) {
            elem.className = elem.className.replace(classReg(c), ' ');
        };
    }

    function toggleClass(elem, c) {
        var fn = hasClass(elem, c) ? removeClass : addClass;
        fn(elem, c);
    }
    var classie = {
        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass,
        toggleClass: toggleClass,
        has: hasClass,
        add: addClass,
        remove: removeClass,
        toggle: toggleClass
    };
    if (typeof define === 'function' && define.amd) {
        define(classie);
    } else {
        window.classie = classie;
    }
})(window);;

function Swipe(container, options) {
    "use strict";
    var noop = function () {};
    var offloadFn = function (fn) {
        setTimeout(fn || noop, 0)
    };
    var browser = {
        addEventListener: !!window.addEventListener,
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions: (function (temp) {
            var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
            for (var i in props)
                if (temp.style[props[i]] !== undefined) return true;
            return false;
        })(document.createElement('swipe'))
    };
    if (!container) return;
    var element = container.children[0];
    var slides, slidePos, width, length;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;
    options.continuous = options.continuous !== undefined ? options.continuous : true;

    function setup() {
        slides = element.children;
        length = slides.length;
        if (slides.length < 2) options.continuous = false;
        if (browser.transitions && options.continuous && slides.length < 3) {
            element.appendChild(slides[0].cloneNode(true));
            element.appendChild(element.children[1].cloneNode(true));
            slides = element.children;
        }
        slidePos = new Array(slides.length);
        width = container.getBoundingClientRect().width || container.offsetWidth;
        element.style.width = (slides.length * width) + 'px';
        var pos = slides.length;
        while (pos--) {
            var slide = slides[pos];
            slide.style.width = width + 'px';
            slide.setAttribute('data-index', pos);
            if (browser.transitions) {
                slide.style.left = (pos * -width) + 'px';
                move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
            }
        }
        if (options.continuous && browser.transitions) {
            move(circle(index - 1), -width, 0);
            move(circle(index + 1), width, 0);
        }
        if (!browser.transitions) element.style.left = (index * -width) + 'px';
        container.style.visibility = 'visible';
    }

    function prev() {
        if (options.continuous) slide(index - 1);
        else if (index) slide(index - 1);
    }

    function next() {
        if (options.continuous) slide(index + 1);
        else if (index < slides.length - 1) slide(index + 1);
    }

    function circle(index) {
        return (slides.length + (index % slides.length)) % slides.length;
    }

    function slide(to, slideSpeed) {
        if (index == to) return;
        if (browser.transitions) {
            var direction = Math.abs(index - to) / (index - to);
            if (options.continuous) {
                var natural_direction = direction;
                direction = -slidePos[circle(to)] / width;
                if (direction !== natural_direction) to = -direction * slides.length + to;
            }
            var diff = Math.abs(index - to) - 1;
            while (diff--) move(circle((to > index ? to : index) - diff - 1), width * direction, 0);
            to = circle(to);
            move(index, width * direction, slideSpeed || speed);
            move(to, 0, slideSpeed || speed);
            if (options.continuous) move(circle(to - direction), -(width * direction), 0);
        } else {
            to = circle(to);
            animate(index * -width, to * -width, slideSpeed || speed);
        }
        index = to;
        offloadFn(options.callback && options.callback(index, slides[index]));
    }

    function move(index, dist, speed) {
        translate(index, dist, speed);
        slidePos[index] = dist;
    }

    function translate(index, dist, speed) {
        var slide = slides[index];
        var style = slide && slide.style;
        if (!style) return;
        style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = speed + 'ms';
        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform = style.MozTransform = style.OTransform = 'translateX(' + dist + 'px)';
    }

    function animate(from, to, speed) {
        if (!speed) {
            element.style.left = to + 'px';
            return;
        }
        var start = +new Date;
        var timer = setInterval(function () {
            var timeElap = +new Date - start;
            if (timeElap > speed) {
                element.style.left = to + 'px';
                if (delay) begin();
                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
                clearInterval(timer);
                return;
            }
            element.style.left = (((to - from) * (Math.floor((timeElap / speed) * 100) / 100)) + from) + 'px';
        }, 4);
    }
    var delay = options.auto || 0;
    var interval;

    function begin() {
        interval = setTimeout(next, delay);
    }

    function stop() {
        delay = 0;
        clearTimeout(interval);
    }
    var start = {};
    var delta = {};
    var isScrolling;
    var events = {
        handleEvent: function (event) {
            switch (event.type) {
            case 'touchstart':
                this.start(event);
                break;
            case 'touchmove':
                this.move(event);
                break;
            case 'touchend':
                offloadFn(this.end(event));
                break;
            case 'webkitTransitionEnd':
            case 'msTransitionEnd':
            case 'oTransitionEnd':
            case 'otransitionend':
            case 'transitionend':
                offloadFn(this.transitionEnd(event));
                break;
            case 'resize':
                offloadFn(setup);
                break;
            }
            if (options.stopPropagation) event.stopPropagation();
        },
        start: function (event) {
            var touches = event.touches[0];
            start = {
                x: touches.pageX,
                y: touches.pageY,
                time: +new Date
            };
            isScrolling = undefined;
            delta = {};
            element.addEventListener('touchmove', this, false);
            element.addEventListener('touchend', this, false);
        },
        move: function (event) {
            if (event.touches.length > 1 || event.scale && event.scale !== 1) return
            if (options.disableScroll) event.preventDefault();
            var touches = event.touches[0];
            delta = {
                x: touches.pageX - start.x,
                y: touches.pageY - start.y
            }
            if (typeof isScrolling == 'undefined') {
                isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
            }
            if (!isScrolling) {
                event.preventDefault();
                stop();
                if (options.continuous) {
                    translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0);
                    translate(index, delta.x + slidePos[index], 0);
                    translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0);
                } else {
                    delta.x = delta.x / ((!index && delta.x > 0 || index == slides.length - 1 && delta.x < 0) ? (Math.abs(delta.x) / width + 1) : 1);
                    translate(index - 1, delta.x + slidePos[index - 1], 0);
                    translate(index, delta.x + slidePos[index], 0);
                    translate(index + 1, delta.x + slidePos[index + 1], 0);
                }
            }
        },
        end: function (event) {
            var duration = +new Date - start.time;
            var isValidSlide = Number(duration) < 250 && Math.abs(delta.x) > 20 || Math.abs(delta.x) > width / 2;
            var isPastBounds = !index && delta.x > 0 || index == slides.length - 1 && delta.x < 0;
            if (options.continuous) isPastBounds = false;
            var direction = delta.x < 0;
            if (!isScrolling) {
                if (isValidSlide && !isPastBounds) {
                    if (direction) {
                        if (options.continuous) {
                            move(circle(index - 1), -width, 0);
                            move(circle(index + 2), width, 0);
                        } else {
                            move(index - 1, -width, 0);
                        }
                        move(index, slidePos[index] - width, speed);
                        move(circle(index + 1), slidePos[circle(index + 1)] - width, speed);
                        index = circle(index + 1);
                    } else {
                        if (options.continuous) {
                            move(circle(index + 1), width, 0);
                            move(circle(index - 2), -width, 0);
                        } else {
                            move(index + 1, width, 0);
                        }
                        move(index, slidePos[index] + width, speed);
                        move(circle(index - 1), slidePos[circle(index - 1)] + width, speed);
                        index = circle(index - 1);
                    }
                    options.callback && options.callback(index, slides[index]);
                } else {
                    if (options.continuous) {
                        move(circle(index - 1), -width, speed);
                        move(index, 0, speed);
                        move(circle(index + 1), width, speed);
                    } else {
                        move(index - 1, -width, speed);
                        move(index, 0, speed);
                        move(index + 1, width, speed);
                    }
                }
            }
            element.removeEventListener('touchmove', events, false)
            element.removeEventListener('touchend', events, false)
        },
        transitionEnd: function (event) {
            if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
                if (delay) begin();
                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
            }
        }
    }
    setup();
    if (delay) begin();
    if (browser.addEventListener) {
        if (browser.touch) element.addEventListener('touchstart', events, false);
        if (browser.transitions) {
            element.addEventListener('webkitTransitionEnd', events, false);
            element.addEventListener('msTransitionEnd', events, false);
            element.addEventListener('oTransitionEnd', events, false);
            element.addEventListener('otransitionend', events, false);
            element.addEventListener('transitionend', events, false);
        }
        window.addEventListener('resize', events, false);
    } else {
        window.onresize = function () {
            setup()
        };
    }
    return {
        setup: function () {
            setup();
        },
        slide: function (to, speed) {
            stop();
            slide(to, speed);
        },
        prev: function () {
            stop();
            prev();
        },
        next: function () {
            stop();
            next();
        },
        stop: function () {
            stop();
        },
        getPos: function () {
            return index;
        },
        getNumSlides: function () {
            return length;
        },
        kill: function () {
            stop();
            element.style.width = '';
            element.style.left = '';
            var pos = slides.length;
            while (pos--) {
                var slide = slides[pos];
                slide.style.width = '';
                slide.style.left = '';
                if (browser.transitions) translate(pos, 0, 0);
            }
            if (browser.addEventListener) {
                element.removeEventListener('touchstart', events, false);
                element.removeEventListener('webkitTransitionEnd', events, false);
                element.removeEventListener('msTransitionEnd', events, false);
                element.removeEventListener('oTransitionEnd', events, false);
                element.removeEventListener('otransitionend', events, false);
                element.removeEventListener('transitionend', events, false);
                window.removeEventListener('resize', events, false);
            } else {
                window.onresize = null;
            }
        }
    }
}
if (window.jQuery || window.Zepto) {
    (function ($) {
        $.fn.Swipe = function (params) {
            return this.each(function () {
                $(this).data('Swipe', new Swipe($(this)[0], params));
            });
        }
    })(window.jQuery || window.Zepto)
};
(function ($) {
    $("a.navbar-call.icon-call").click(function () {
        _gaq.push(['_trackEvent', 'Click Metrics', 'Click', 'Call Button']);
    });
    if ($('body').hasClass('home')) {
        var headerVideo = $('#background-video');
        $("#headerimage").height($(window).height());
        $(headerVideo).height($(window).height());
        if (isMobile()) {
            $('body').addClass('touchy');
            $('.scrollnav, .socialnav').addClass('fixed');
        }
        $('#logo .scrollbtn').click(function (e) {
            e.preventDefault();
            var scrollHeight = ($(window).height() - 70);
            scrollHeight = Math.max(0, scrollHeight);
            scrollHeight = scrollHeight + 'px';
            $("html, body").animate({
                scrollTop: scrollHeight
            }, '2500');
        });
        $('.caption a[href="#app-slideshow"]').click(function (f) {
            f.preventDefault();
            var scrollHeight = ($(window).height() - 70);
            scrollHeight = Math.max(0, scrollHeight);
            scrollHeight = scrollHeight + 'px';
            $("html, body").animate({
                scrollTop: scrollHeight
            }, '2500');
        });
        $('.logohome').click(function (e) {
            e.preventDefault();
            var scrollHeight = 0 + 'px';
            $("html, body").animate({
                scrollTop: scrollHeight
            }, '2500');
        });
        var distance = $('.scrollnav').offset().top,
            $window = $(window);
        var logoHeight = $('.logohome').height(),
            navHeight = $('.scrollnav').height();
        $(window).resize(function () {
            if (isMobile()) return;
            $("#headerimage").height($(window).height());
            distance = $('.scrollnav').offset().top;
            headerImageCheck();
        });
        $(window).scroll(function () {
            if (isMobile()) return;
            if ($(window).scrollTop() >= distance) {
                $('.scrollnav, .socialnav').addClass('fixed');
            } else {
                $('.scrollnav, .socialnav').removeClass('fixed');
            }
            headerImageCheck();
        });

        function headerImageCheck() {
            if (isMobile()) return;
            var sectionHeight = $('#headerimage').height();
            var topPos = 30,
                min = (sectionHeight - navHeight);
            var percentageraw = $(window).scrollTop() / min;
            var percentage = Math.min(1, percentageraw);
            var percentage = Math.max(0, percentage);
            var maxLogoSize = 218;
            var topvar = topPos - (topPos * percentage) + '%';
            var widthvar = maxLogoSize - (78 * percentage);
            var mleftvar = (widthvar / 2) * -1;
            var bgalpha = percentage * 2;
            var fade = 0.7 - (percentage);
            var fade2 = 1 - (percentage * 2);
            var fade3 = 1.5 - (percentage * 3);
            var marginbottom = (7 - (percentage * 9)) + '%';
            var top = (45 - (percentage * 40)) + '%';
            var fade2 = Math.max(0, fade2);
            var fade3 = Math.max(0, fade3);
            $('.logohome').css({
                top: topvar,
                'margin-left': mleftvar,
                width: widthvar
            });
            // $('.scrollnav').css({
            //     'background': 'rgba(0,124,196,' + bgalpha + ')'
            // });
            $('.scrollnav').css({
                'background': 'rgba(86,100,115,' + bgalpha + ')'
            });
            $('.scrollbtn').css({
                opacity: fade
            });
            $('.caption h1').css({
                opacity: fade2,
                'margin-bottom': marginbottom
            });
            $('.caption p').css({
                opacity: fade3
            });
            $('#headerimage .container').css({
                top: top
            });
            $('.logohome').attr('data-percentage', percentage);
            if ($(window).scrollTop() > sectionHeight) {
                $('#headerimage .caption').css({
                    'visibility': 'hidden'
                });
            } else {
                $('#headerimage .caption').css({
                    'visibility': 'visible'
                });
            }
        }
        window.mySwipe = new Swipe($(".swipejs")[0], {
            speed: 400,
            auto: 4500,
            continuous: true,
            disableScroll: false,
            stopPropagation: false,
            callback: function (index, elem) {
                $('.swipejs .slides .slide.active').removeClass('active');
                $('.swipejs .slides .slide').eq(index).addClass('active');
                $('.swipejs .paginationlink.active').removeClass('active');
                $('.swipejs .paginationlink').eq(index).addClass('active');
            },
            transitionEnd: function (index, elem) {}
        });
        $(".swipejs .paginationlink").click(function () {
            window.mySwipe.slide($(this).data('slideno'));
        })
        $(".swipejs .arrow.rgt").click(function () {
            window.mySwipe.next();
        })
        $(".swipejs .arrow.lft").click(function () {
            window.mySwipe.prev();
        })
    }
    if ($('body').hasClass('blog') || $('body').hasClass('archive')) {
        $(".filter-btn").click(function (e) {
            e.preventDefault();
            $(".category-filter.standard").toggleClass('open');
            $(this).toggleClass('active');
        });
        var filterFromTop = $('.search-filter').offset().top - $('nav.scrollnav').outerHeight();
        $(window).scroll(function () {
            if (isMobile()) return;
            if (filterFromTop < 10 || $(document).outerWidth() < 768) return;
            if ($(window).scrollTop() > filterFromTop) {
                var newMTop = $('.search-filter').outerHeight();
                if ($(".category-filter.standard").hasClass('open')) {
                    newMTop += $(".category-filter.standard").outerHeight();
                }
                $('section.bloglist').addClass('fixed').css('margin-top', newMTop);
            } else {
                $('section.bloglist').removeClass('fixed').css('margin-top', '0');
            }
        });
    }
    $('.mapbtn').click(function () {
        $(this).addClass("fadeout");
        $('.map').addClass("fadein");
    });
    if ($('body').hasClass('single-b2c_apps')) {
        $(window).resize(function () {
            headerTitleCheck();
        });
        $(window).scroll(function () {
            headerTitleCheck();
        });
        var navHeight = $('.scrollnav').height(),
            sectionHeight = $('#mainheader').height(),
            topPos = $('.casestudy-title').offset().top,
            min = (sectionHeight - navHeight);

        function headerTitleCheck() {
            if (isMobile()) return;
            var percentageraw = $(window).scrollTop() / min;
            var percentage = Math.min(1, percentageraw);
            var percentage = Math.max(0, percentage);
            var topvar = 200 + (topPos * percentage);
            $('.casestudy-title').css({
                top: topvar
            });
        }
    }
    $('.navbar-call.icon-search').live('click', function (e) {
        e.preventDefault();
        $('.popout-textfield').toggleClass('show');
        if ($('.popout-textfield').hasClass('show')) {}
    });
    $("button.navbar-toggle").click(function () {
        $(this).toggleClass("active");
        $('.navbar').toggleClass("open");
    });

    function isMobile() {
        return Modernizr.touch;
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch (e) {
            return false;
        }
    }
    if ($('#animate-wrapper .section').length !== 0) {
        var factor = (Modernizr.touch) ? "0" : "0.5";
        if (Modernizr.touch) {
            $('#animate-wrapper .section').each(function (count) {
                var delay = count * 400,
                    _this = this;
                setTimeout(function () {
                    $(_this).addClass("animate");
                }, delay);
            });
        } else {
            new cbpScroller($('#animate-wrapper')[0], {
                viewportFactor: factor
            });
        }
    }

    function FooterCheck() {
        var distanceTop = $(document).height() - $(window).height() - 5;
        if ($(window).scrollTop() > distanceTop || distanceTop < 0)
            $('#footer').addClass('show');
        else {
            $('#footer').removeClass('show');
        }
    }
    $(window).scroll(function () {
        FooterCheck();
    });
    $(window).resize(function () {
        FooterCheck();
    });
    $(window).resize();
    $(window).scroll();
})(jQuery);;
(function ($) {
    $.fn.videoBG = function (selector, options) {
        var options = {};
        if (typeof selector == "object") {
            options = $.extend({}, $.fn.videoBG.defaults, selector);
        } else if (!selector) {
            options = $.fn.videoBG.defaults;
        } else {
            return $(selector).videoBG(options);
        }
        var container = $(this);
        if (!container.length)
            return;
        if (container.css('position') == 'static' || !container.css('position'))
            container.css('position', 'relative');
        if (options.width == 0)
            options.width = container.width();
        if (options.height == 0)
            options.height = container.height();
        var wrap = $.fn.videoBG.wrapper();
        wrap.height(options.height).width(options.width);
        if (options.textReplacement) {
            options.scale = true;
            container.width(options.width).height(options.height).css('text-indent', '-9999px');
        } else {
            wrap.css('z-index', options.zIndex + 1);
        }
        wrap.html(container.clone(true));
        var video = $.fn.videoBG.video(options);
        if (options.scale) {
            wrap.height(options.height).width(options.width);
            video.height(options.height).width(options.width);
        }
        container.html(wrap);
        container.append(video);
        return video.find("video")[0];
    }
    $.fn.videoBG.setFullscreen = function ($el) {
        var windowWidth = $(window).width(),
            windowHeight = $(window).height();
        $el.css('min-height', 0).css('min-width', 0);
        $el.parent().width(windowWidth).height(windowHeight);
        if (windowWidth / windowHeight > $el.aspectRatio) {
            $el.width(windowWidth).height('auto');
            var height = $el.height();
            var shift = (height - windowHeight) / 2;
            if (shift < 0) shift = 0;
            $el.css("top", -shift);
        } else {
            $el.width('auto').height(windowHeight);
            var width = $el.width();
            var shift = (width - windowWidth) / 2;
            if (shift < 0) shift = 0;
            $el.css("left", -shift);
            if (shift === 0) {
                var t = setTimeout(function () {
                    $.fn.videoBG.setFullscreen($el);
                }, 500);
            }
        }
        $('body > .videoBG_wrapper').width(windowWidth).height(windowHeight);
    }
    $.fn.videoBG.video = function (options) {
        $('html, body').scrollTop(-1);
        var $div = $('<div/>');
        $div.addClass('videoBG').css('position', options.position).css('z-index', options.zIndex).css('top', 0).css('left', 0).css('height', options.height).css('width', options.width).css('opacity', options.opacity).css('overflow', 'hidden');
        var $video = $('<video/>');
        $video.css('position', 'absolute').css('z-index', options.zIndex).attr('poster', options.poster).css('top', 0).css('left', 0).css('min-width', '100%').css('min-height', '100%');
        if (options.autoplay) {
            $video.attr('autoplay', options.autoplay);
        }
        if (options.fullscreen) {
            $video.bind('canplay', function () {
                $video.aspectRatio = $video.width() / $video.height();
                $.fn.videoBG.setFullscreen($video);
            })
            var resizeTimeout;
            $(window).resize(function () {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function () {
                    $.fn.videoBG.setFullscreen($video);
                }, 100);
            });
            $.fn.videoBG.setFullscreen($video);
        }
        var v = $video[0];
        if (options.loop) {
            loops_left = options.loop;
            $video.bind('ended', function () {
                if (loops_left)
                    v.play();
                if (loops_left !== true)
                    loops_left--;
            });
        }
        $video.bind('canplay', function () {
            if (options.autoplay)
                v.play();
        });
        if ($.fn.videoBG.supportsVideo()) {
            if ($.fn.videoBG.supportType('webm')) {
                $video.attr('src', options.webm);
            } else if ($.fn.videoBG.supportType('mp4')) {
                $video.attr('src', options.mp4);
            } else {
                $video.attr('src', options.ogv);
            }
        }
        var $img = $('<img/>');
        $img.attr('src', options.poster).css('position', 'absolute').css('z-index', options.zIndex).css('top', 0).css('left', 0).css('min-width', '100%').css('min-height', '100%');
        if ($.fn.videoBG.supportsVideo()) {
            $div.html($video);
        } else {
            $div.html($img);
        }
        if (options.textReplacement) {
            $div.css('min-height', 1).css('min-width', 1);
            $video.css('min-height', 1).css('min-width', 1);
            $img.css('min-height', 1).css('min-width', 1);
            $div.height(options.height).width(options.width);
            $video.height(options.height).width(options.width);
            $img.height(options.height).width(options.width);
        }
        if ($.fn.videoBG.supportsVideo()) {
            v.play();
        }
        return $div;
    }
    $.fn.videoBG.supportsVideo = function () {
        if (isMobile()) return false;
        return (document.createElement('video').canPlayType);
    }
    $.fn.videoBG.supportType = function (str) {
        if (!$.fn.videoBG.supportsVideo())
            return false;
        var v = document.createElement('video');
        switch (str) {
        case 'webm':
            return (v.canPlayType('video/webm; codecs="vp8, vorbis"'));
            break;
        case 'mp4':
            return (v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
            break;
        case 'ogv':
            return (v.canPlayType('video/ogg; codecs="theora, vorbis"'));
            break;
        }
        return false;
    }
    $.fn.videoBG.wrapper = function () {
        var $wrap = $('<div/>');
        $wrap.addClass('videoBG_wrapper').css('position', 'absolute').css('top', 0).css('left', 0);
        return $wrap;
    }
    $.fn.videoBG.defaults = {
        mp4: '',
        ogv: '',
        webm: '',
        poster: '',
        autoplay: true,
        loop: true,
        scale: false,
        position: "absolute",
        opacity: 1,
        textReplacement: false,
        zIndex: 0,
        width: 0,
        height: 0,
        fullscreen: false,
        imgFallback: true
    }
})(jQuery);

function isMobile() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}