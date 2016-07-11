/*
 * fixmystreet.js
 * FixMyStreet JavaScript
 */

var fixmystreet = fixmystreet || {};

/*
 * Find directionality of content
 */
function isR2L() {
    return !!$('html[dir=rtl]').length;
}

// Some small jQuery extensions
(function($) {
  var opened;

  $.fn.extend({
    // A sliding drawer from the bottom of the page, small version
    // that doesn't change the main content at all.
    small_drawer: function(id) {
        var $this = $(this), d = $('#' + id);
        this.toggle(function() {
            if (opened) {
                opened.click();
            }
            if (!$this.addClass('hover').data('setup')) {
                d.hide().removeClass('hidden-js').css({
                padding: '1em',
                background: '#fff'
                });
                $this.data('setup', true);
            }
            d.slideDown();
            opened = $this;
        }, function(e) {
            $this.removeClass('hover');
            d.slideUp();
            opened = null;
        });
    },

    // A sliding drawer from the bottom of the page, large version
    drawer: function(id, ajax) {

        // The link/button that triggered the drawer
        var $this = $(this);

        // A bunch of elements that will come in handy when opening/closing
        // the drawer. Because $sw changes its position in the DOM, we capture
        // all these elements just once, the first time .drawer() is called.
        var $sidebar = $('#map_sidebar');
        var $sw = $this.parents('.shadow-wrap');
        var $swparent = $sw.parent();
        var $drawer = $('#' + id);

        this.toggle(function() {
            // Find the specified drawer, or create it if it doesn't exist
            if ($drawer.length === 0) {
                $drawer = $('<div id="' + id + '">');
                $drawer.appendTo($swparent);
            }

            if (!$this.addClass('hover').data('setup')) {
                // Optionally fill $drawer with HTML from an AJAX data source
                if (ajax) {
                    var href = $this.attr('href') + ';ajax=1';
                    var margin = isR2L() ? 'margin-left' : 'margin-right';
                    var $ajax_result = $('<div>').appendTo($drawer);
                    $ajax_result.html('<p style="text-align:center">Loading</p>');
                    $ajax_result.load(href);
                }

                // Style up the $drawer
                var drawer_top = $(window).height() - $sw.height();
                var drawer_css = {
                    position: 'fixed',
                    zIndex: 10,
                    top: drawer_top,
                    bottom: 0,
                    width: $sidebar.css('width'),
                    paddingLeft: $sidebar.css('padding-left'),
                    paddingRight: $sidebar.css('padding-right'),
                    overflow: 'auto',
                    background: '#fff'
                };
                drawer_css[isR2L() ? 'right' : 'left'] = 0;
                $drawer.css(drawer_css).removeClass('hidden-js').find('h2').css({ marginTop: 0 });
                $this.data('setup', true);
            }

            // Insert the .shadow-wrap controls into the top of the drawer.
            $sw.addClass('static').prependTo($drawer);

            // Animate the drawer into place, enitrely covering the sidebar.
            var sidebar_top_px = $sidebar.position().top;
            $drawer.show().animate({ top: sidebar_top_px }, 1000);

        }, function(e) {
            // Slide the drawer down, move the .shadow-wrap back to its
            // original parent, and hide the drawer for potential re-use later.
            $this.removeClass('hover');
            var drawer_top = $(window).height() - $sw.height();

            $drawer.animate({ top: drawer_top }, 1000, function() {
                $sw.removeClass('static').appendTo($swparent);
                $drawer.hide();
            });
        });
    }

  });
})(jQuery);

fixmystreet.mobile_reporting = {
  apply_ui: function() {
    // Creates the "app-like" mobile reporting UI with full screen map
    // and special "OK/Cancel" buttons etc.
    $('html').addClass('mobile-reporting-map');

    var banner_text = '<a href="/">' + translation_strings.home + '</a> ' + translation_strings.place_pin_on_map;
    $('.big-green-banner')
        .addClass('mobile-map-banner')
        .appendTo('#map_box')
        .html(banner_text);
  },

  remove_ui: function() {
    // Removes the "app-like" mobile reporting UI, reverting all the
    // changes made by fixmystreet.mobile_reporting.apply_ui().

    $('html').removeClass('mobile-reporting-map');

    var banner_text = translation_strings.report_problem_heading;
    if (typeof variation !== 'undefined' && variation === 1) {
        banner_text = 'Click map to request a fix';
    }
    $('.big-green-banner')
        .removeClass('mobile-map-banner')
        .prependTo('#side')
        .html(banner_text);
    $('#map_box').css({ width: "", height: "", position: "" });
    $('#mob_sub_map_links').remove();
  }
};

fixmystreet.resize_to = {
  mobile_page: function() {
    $('html').addClass('mobile');
    if (typeof fixmystreet !== 'undefined' && fixmystreet.page == 'around') {
        fixmystreet.mobile_reporting.apply_ui();
    }

    // Hide sidebar notes ("rap-notes") on the /report/new page on mobile,
    // and provide a button that reveals/hides them again.
    var $rapSidebar = $('#report-a-problem-sidebar');
    if ($rapSidebar.length) {
        $rapSidebar.hide();
        $('<a>')
            .addClass('rap-notes-trigger button-fwd')
            .html(translation_strings.how_to_send)
            .insertBefore($rapSidebar)
            .on('click', function(){
                $rapSidebar.slideToggle(100);
                $(this).toggleClass('clicked');
            });
    }

    // On the front page, make it so that the "report a problem" menu item
    // scrolls to the top of the page, and has a hover effect, rather than
    // just being an innert span.
    $('span.report-a-problem-btn').on('click.reportBtn', function() {
        $('html, body').animate({scrollTop:0}, 500);
    }).css({ cursor:'pointer' }).on('hover.reportBtn', function() {
        $(this).toggleClass('hover');
    });
  },

  desktop_page: function() {
    $('html').removeClass('mobile');
    fixmystreet.mobile_reporting.remove_ui();

    // Undo the special "rap-notes" tweaks that might have
    // been put into place by previous mobile UI.
    $('#report-a-problem-sidebar').show();
    $('.rap-notes-trigger').remove();

    // On a desktop, so reset the "Report a problem" nav item to act
    // like an innert span again.
    $('span.report-a-problem-btn').css({ cursor:'' }).off('.reportBtn');
  }
};

fixmystreet.set_up = fixmystreet.set_up || {};
$.extend(fixmystreet.set_up, {
  on_resize: function() {
    var last_type;
    $(window).on('resize', function() {
        var type = Modernizr.mq('(min-width: 48em)') || $('html.iel8').length ? 'desktop' : 'mobile';
        if (last_type == type) { return; }
        if (type == 'mobile') {
            fixmystreet.resize_to.mobile_page();
        } else {
            fixmystreet.resize_to.desktop_page();
        }
        last_type = type;
    }).resize();
  },

  dropzone: function($context) {

    // Pass a jQuery element, eg $('.foobar'), into this function
    // to limit all the selectors to that element. Handy if you want
    // to only bind/detect Dropzones in a particular part of the page,
    // or if your selectors (eg: "#form_photo") aren't unique across
    // the whole page.
    if (typeof $context === undefined) {
        $context = $(document);
    }

    if ('Dropzone' in window) {
      Dropzone.autoDiscover = false;
    }
    if ('Dropzone' in window && $('#form_photo', $context).length) {
      var $originalLabel = $('[for="form_photo"]', $context);
      var $originalInput = $('#form_photos', $context);
      var $dropzone = $('<div>').addClass('dropzone');

      $originalLabel.removeAttr('for');
      $originalInput.hide();

      $dropzone.insertAfter($originalInput);
      var photodrop = new Dropzone($dropzone[0], {
        url: '/photo/upload',
        paramName: 'photo',
        maxFiles: 3,
        addRemoveLinks: true,
        thumbnailHeight: 150,
        thumbnailWidth: 150,
        acceptedFiles: 'image/jpeg,image/pjpeg,image/gif,image/tiff,image/png',
        dictDefaultMessage: translation_strings.upload_default_message,
        dictCancelUploadConfirmation: translation_strings.upload_cancel_confirmation,
        dictInvalidFileType: translation_strings.upload_invalid_file_type,
        dictMaxFilesExceeded: translation_strings.upload_max_files_exceeded,

        fallback: function() {
          $dropzone.remove();
          $originalLabel.attr('for', 'form_photo');
          $originalInput.show();
        },
        init: function() {
          this.on("addedfile", function(file) {
            $('input[type=submit]', $context).prop("disabled", true).removeClass('green-btn');
          });
          this.on("queuecomplete", function() {
            $('input[type=submit]', $context).removeAttr('disabled').addClass('green-btn');
          });
          this.on("success", function(file, xhrResponse) {
            var ids = $('input[name=upload_fileid]', $context).val().split(','),
                id = (file.server_id = xhrResponse.id),
                l = ids.push(id),
                newstr = ids.join(',');
            $('input[name=upload_fileid]', $context).val(newstr);
          });
          this.on("error", function(file, errorMessage, xhrResponse) {
          });
          this.on("removedfile", function(file) {
            var ids = $('input[name=upload_fileid]', $context).val().split(','),
                newstr = $.grep(ids, function(n) { return (n!=file.server_id); }).join(',');
            $('input[name=upload_fileid]', $context).val(newstr);
          });
          this.on("maxfilesexceeded", function(file) {
            this.removeFile(file);
            var $message = $('<div class="dz-message dz-error-message">');
            $message.text(translation_strings.upload_max_files_exceeded);
            $message.prependTo(this.element);
            setTimeout(function() {
              $message.slideUp(250, function() {
                $message.remove();
              });
            }, 2000);
          });
        }
      });

      $.each($('input[name=upload_fileid]', $context).val().split(','), function(i, f) {
        if (!f) {
            return;
        }
        var mockFile = { name: f, server_id: f };
        photodrop.emit("addedfile", mockFile);
        photodrop.createThumbnailFromUrl(mockFile, '/photo/temp.' + f);
        photodrop.emit("complete", mockFile);
        photodrop.options.maxFiles -= 1;
      });
    }
  },

  mobile_ui_tweaks: function() {
    //move 'skip this step' link on mobile
    $('.mobile #skip-this-step').addClass('chevron').wrap('<li>').parent().appendTo('#key-tools');

    // nicetable - on mobile shift 'name' col to be a row
    $('.mobile .nicetable th.title').remove();
    $('.mobile .nicetable td.title').each(function(i) {
        $(this).attr('colspan', 5).insertBefore($(this).parent('tr')).wrap('<tr class="heading" />');
    });
  },

  on_mobile_nav_click: function() {
    $('.mobile').on('click', '#nav-link', function(e) {
        e.preventDefault();
        var offset = $('#main-nav').offset().top;
        $('html, body').animate({scrollTop:offset}, 1000);
        window.location.hash = 'main-nav';
    });
  },

  map_controls: function() {
    //add permalink on desktop, force hide on mobile
    //add links container (if its not there)
    if (window.cobrand != 'zurich' && !$('.mobile').length) {
        if ($('#sub_map_links').length === 0) {
            $('<p id="sub_map_links" />').insertAfter($('#map'));
        }
        if ($('#map_permalink').length === 0) {
            $('#sub_map_links').append('<a href="#" id="map_permalink">' + translation_strings.permalink + '</a>');
        }
    }

    if ($('.mobile').length) {
        $('#map_permalink').hide();
        $('#key-tools a.feed').appendTo('#sub_map_links');
        $('#key-tools li:empty').remove();
        $('#report-updates-data').insertAfter($('#map_box'));
    }

    //add open/close toggle button (if its not there)
    if ($('#map_links_toggle').length === 0) {
        $('<span>')
            .html('&nbsp;')
            .attr('id', 'map_links_toggle')
            .on('click', function() {
                var sub_map_links_css = {},
                    left_right = isR2L() ? 'left' : 'right';
                if ($(this).hasClass('closed')) {
                    $(this).removeClass('closed');
                    sub_map_links_css[left_right] = '0';
                } else {
                    $(this).addClass('closed');
                    sub_map_links_css[left_right] = -$('#sub_map_links').width();
                }
                $('#sub_map_links').animate(sub_map_links_css, 1200);
            })
            .prependTo('#sub_map_links');
    }
  },

  map_sidebar_key_tools: function() {
    if ($('html.mobile').length) {
        $('#council_wards').hide().removeClass('hidden-js').find('h2').hide();
        $('#key-tool-wards').click(function(e) {
            e.preventDefault();
            $('#council_wards').slideToggle('800', function() {
              $('#key-tool-wards').toggleClass('hover');
            });
        });
    } else {
        $('#key-tool-wards').drawer('council_wards', false);
        $('#key-tool-around-updates').drawer('updates_ajax', true);
    }
    $('#key-tool-report-updates').small_drawer('report-updates-data');
    $('#key-tool-report-share').small_drawer('report-share');
  },

  email_login_form: function() {
    // Log in with email button
    var email_form = $('#js-social-email-hide'),
        button = $('<button class="btn btn--social btn--social-email">Log in with email</button>'),
        form_box = $('<div class="form-box"></div>');
    button.click(function(e) {
        e.preventDefault();
        email_form.fadeIn(500);
        form_box.hide();
    });
    form_box.append(button).insertBefore(email_form);
    if ($('.form-error').length) {
        button.click();
    }
  },

  fancybox_images: function() {
    // Fancybox fullscreen images
    if (typeof $.fancybox == 'function') {
        $('a[rel=fancy]').fancybox({
            'overlayColor': '#000000'
        });
    }
  },

  form_focus_triggers: function() {
    // If all of the form-focus-triggers are empty, hide form-focus-hidden.
    // (If the triggers aren't empty, then chances are we're being re-shown
    // the form after a validation error, so don't hide form-focus-hidden.)
    // Unhide form-focus-hidden when any of the triggers are focussed.
    var form_focus_data = $('.form-focus-trigger').map(function() {
        return $(this).val();
    }).get().join('');
    if (!form_focus_data) {
        $('.form-focus-hidden').hide();
        $('.form-focus-trigger').on('focus', function() {
            $('.form-focus-hidden').fadeIn(500);
        });
    }
  },

  alert_page_buttons: function() {
    // Go directly to RSS feed if RSS button clicked on alert page
    // (due to not wanting around form to submit, though good thing anyway)
    $('body').on('click', '#alert_rss_button', function(e) {
        e.preventDefault();
        var feed = $('input[name=feed][type=radio]:checked').nextAll('a').attr('href');
        window.location.href = feed;
    });
    $('body').on('click', '#alert_email_button', function(e) {
        e.preventDefault();
        var form = $('<form/>').attr({ method:'post', action:"/alert/subscribe" });
        form.append($('<input name="alert" value="Subscribe me to an email alert" type="hidden" />'));
        $('#alerts input[type=text], #alerts input[type=hidden], #alerts input[type=radio]:checked').each(function() {
            var $v = $(this);
            $('<input/>').attr({ name:$v.attr('name'), value:$v.val(), type:'hidden' }).appendTo(form);
        });
        $('body').append(form);
        form.submit();
    });
  },

  promo_elements: function() {
    // Add close buttons for .promo's
    if ($('.promo').length) {
        $('.promo').append('<a href="#" class="close-promo">x</a>');
    }
    //only close its own parent
    $('.promo').on('click', '.close-promo', function(e) {
        e.preventDefault();
        $(this).parent('.promo').animate({
            'height':0,
            'margin-bottom':0,
            'padding-top':0,
            'padding-bottom':0
        },{
            duration:500,
            queue:false
        }).fadeOut(500);
    });
  },

  ajax_history: function() {
    $('#map_sidebar').on('click', '.item-list--reports a', function(e) {
        e.preventDefault();
        var reportPageUrl = $(this).attr('href');
        var reportId = parseInt(reportPageUrl.replace(/^.*\/([0-9]+)$/, '$1'), 10);

        // If we've already selected this report
        if (reportId == window.selected_problem_id) {
            return;
        }

        fixmystreet.display.report(reportPageUrl, reportId, function() {
            // Since this navigation was the result of a user action,
            // we want to record the navigation as a state, so the user
            // can return to it later using their Back button.
            if ('pushState' in history) {
                history.pushState({
                    reportId: reportId,
                    reportPageUrl: reportPageUrl
                }, null, reportPageUrl);
            }
        });
    });

    $('#map_sidebar').on('click', '.js-back-to-report-list', function(e) {
        e.preventDefault();
        var reportListUrl = $(this).attr('href');
        fixmystreet.display.around(reportListUrl, function() {
            // Since this navigation was the result of a user action,
            // we want to record the navigation as a state, so the user
            // can return to it later using their Back button.
            if ('pushState' in history) {
                history.pushState(null, null, reportListUrl);
            }
        });
    });

    window.addEventListener('popstate', function(e) {
        // The user has pressed the Back button, and there is a
        // stored History state for them to return to.

        // Note: no pushState callbacks in these display_* calls,
        // because we're already inside a popstate: We want to roll
        // back to a previous state, not create a new one!

        if (e.state === null) {
            // User has navigated Back from a pushStated state, presumably to
            // see the list of all reports (which was shown on pageload). By
            // this point, the browser has *already* updated the URL bar so
            // location.href is something like foo.com/around?pc=abc-123,
            // which we pass into fixmystreet.display.around() as a fallback
            // incase the list isn't already in the DOM.
            fixmystreet.display.around(window.location.href);
        } else if ('reportId' in e.state) {
            fixmystreet.display.report(e.state.reportPageUrl, e.state.reportId);
        }
    });
  }
});

fixmystreet.update_pin = function(lonlat) {
    fixmystreet.maps.update_pin(lonlat);

    $.getJSON('/report/new/ajax', {
        latitude: $('#fixmystreet\\.latitude').val(),
        longitude: $('#fixmystreet\\.longitude').val()
    }, function(data) {
        if (data.error) {
            if (!$('#side-form-error').length) {
                $('<div id="side-form-error"/>').insertAfter($('#side-form'));
            }
            $('#side-form-error').html('<h1>' + translation_strings.reporting_a_problem + '</h1><p>' + data.error + '</p>').show();
            $('#side-form').hide();
            $('body').removeClass('with-notes');
            return;
        }
        $('#side-form, #site-logo').show();
        var old_category = $("select#form_category").val();
        $('#councils_text').html(data.councils_text);
        $('#form_category_row').html(data.category);
        if ($("select#form_category option[value=\""+old_category+"\"]").length) {
            $("select#form_category").val(old_category);
        }
        if ( data.extra_name_info && !$('#form_fms_extra_title').length ) {
            // there might be a first name field on some cobrands
            var lb = $('#form_first_name').prev();
            if ( lb.length === 0 ) { lb = $('#form_name').prev(); }
            lb.before(data.extra_name_info);
        }

        // If the category filter appears on the map and the user has selected
        // something from it, then pre-fill the category field in the report,
        // if it's a value already present in the drop-down.
        var category = $("#filter_categories").val();
        if (category !== undefined && $("#form_category option[value="+category+"]").length) {
            $("#form_category").val(category);
        }

        var category_select = $("select#form_category");
        if (category_select.val() != '-- Pick a category --') {
            category_select.change();
        }
    });

    if (!$('#side-form-error').is(':visible')) {
        $('#side-form, #site-logo').show();
        $('#map_sidebar').scrollTop(0);
    }

};

fixmystreet.display = {
  begin_report: function(lonlat) {
    fixmystreet.maps.begin_report(lonlat);

    // Store pin location in form fields, and check coverage of point
    fixmystreet.update_pin(lonlat);

    // It's possible to invoke this multiple times in a row
    // (eg: by clicking on the map multiple times, to
    // reposition your report). But there is some stuff we
    // only want to happen the first time you switch from
    // the "around" view to the "new" report view. So, here
    // we check whether we've already transitioned into the
    // "new" report view, and if so, we return from the
    // callback early, skipping the remainder of the setup
    // stuff.
    if (fixmystreet.page == 'new') {
        if (fixmystreet.map.panTo) {
            fixmystreet.map.panDuration = 100;
            fixmystreet.map.panTo(lonlat);
            fixmystreet.map.panDuration = 50;
        }
        return;
    }

    // If there are notes to be displayed, add the .with-notes class
    // to make the sidebar wider.
    if ($('#report-a-problem-sidebar').length) {
        $('body').addClass('with-notes');
    }

    /* For some reason on IOS5 if you use the jQuery show method it
     * doesn't display the JS validation error messages unless you do this
     * or you cause a screen redraw by changing the phone orientation.
     * NB: This has to happen after the call to show() in fixmystreet.update_pin */
    if ( navigator.userAgent.match(/like Mac OS X/i)) {
        document.getElementById('side-form').style.display = 'block';
    }
    $('#side').hide();

    if (fixmystreet.map.updateSize) {
        fixmystreet.map.updateSize(); // required after changing the size of the map element
    }
    if (fixmystreet.map.panTo) {
        fixmystreet.map.panDuration = 100;
        fixmystreet.map.panTo(lonlat);
        fixmystreet.map.panDuration = 50;
    }

    $('#sub_map_links').hide();
    if ($('html').hasClass('mobile')) {
        var $map_box = $('#map_box'),
            width = $map_box.width(),
            height = $map_box.height();
        $map_box.append(
            '<p id="mob_sub_map_links">' +
            '<a href="#" id="try_again">' +
                translation_strings.try_again +
            '</a>' +
            '<a href="#ok" id="mob_ok">' +
                translation_strings.ok +
            '</a>' +
            '</p>')
        .css({
            position: 'relative', // Stop map being absolute, so reporting form doesn't get hidden
            width: width,
            height: height
        });

        $('.mobile-map-banner').html('<a href="/">' + translation_strings.home + '</a> ' + translation_strings.right_place);

        // mobile user clicks 'ok' on map
        $('#mob_ok').toggle(function(){
            //scroll the height of the map box instead of the offset
            //of the #side-form or whatever as we will probably want
            //to do this on other pages where #side-form might not be
            $('html, body').animate({ scrollTop: height-60 }, 1000, function(){
                $('#mob_sub_map_links').addClass('map_complete');
                $('#mob_ok').text(translation_strings.map);
            });
        }, function(){
            $('html, body').animate({ scrollTop: 0 }, 1000, function(){
                $('#mob_sub_map_links').removeClass('map_complete');
                $('#mob_ok').text(translation_strings.ok);
            });
        });
    }

    fixmystreet.page = 'new';
    location.hash = 'report';
  },

  report: function(reportPageUrl, reportId, callback) {
    $.ajax(reportPageUrl).done(function(html, textStatus, jqXHR) {
        var $reportPage = $(html);
        var $sideReport = $reportPage.find('#side-report');

        if ($sideReport.length) {
            $('#side').hide(); // Hide the list of reports
            $('#side-report').remove(); // Remove any existing report page content from sidebar
            $sideReport.appendTo('#map_sidebar'); // Insert this report's content
            $('#map_sidebar').scrollTop(0);

            var found = html.match(/<title>([\s\S]*?)<\/title>/);
            var page_title = found[1];
            document.title = page_title;
            fixmystreet.page = 'report';

            fixmystreet.mobile_reporting.remove_ui();
            if ($('html').hasClass('mobile') && fixmystreet.map.updateSize) {
                fixmystreet.map.updateSize();
            }

            // If this is the first individual report we've loaded, remove the
            // "all reports" sub_map_links but store them in a global variable
            // so we can reinsert them when the user returns to the all reports
            // view. With #sub_map_links detached from the DOM, we set up the
            // individual report's sub_map_links using map_controls().
            if (!('originalSubMapLinks' in window)) {
                window.originalSubMapLinks = $('#sub_map_links').detach();
            }
            fixmystreet.set_up.map_controls();

            $sideReport.find('#key-tool-problems-nearby').addClass('js-back-to-report-list');
            fixmystreet.set_up.map_sidebar_key_tools();

            fixmystreet.set_up.fancybox_images();
            fixmystreet.set_up.dropzone($sideReport);
            fixmystreet.set_up.form_focus_triggers();

            window.selected_problem_id = reportId;
            var marker = fixmystreet.maps.get_marker_by_id(reportId);
            if (fixmystreet.map.panTo && ($('html').hasClass('mobile') || !marker.onScreen())) {
                fixmystreet.map.panTo(
                    marker.geometry.getBounds().getCenterLonLat()
                );
            }
            if (fixmystreet.maps.markers_resize) {
                fixmystreet.maps.markers_resize(); // force a redraw so the selected marker gets bigger
            }

            if (typeof callback === 'function') {
                callback();
            }

        } else {
            window.location.href = reportPageUrl;
        }

    }).fail(function(jqXHR, textStatus, errorThrown) {
        window.location.href = reportPageUrl;

    });
  },

  around: function(reportListUrl, callback) {
    // If the report list is already in the DOM,
    // just reveal it, rather than loading new page.
    if ($('#side').length) {
        $('#side').show();
        $('#side-report').remove();

        document.title = fixmystreet.original_title;
        fixmystreet.page = 'around';
        if ($('html').hasClass('mobile')) {
            fixmystreet.mobile_reporting.apply_ui();
            fixmystreet.map.updateSize();
        }

        if ('originalSubMapLinks' in window) {
            $('#sub_map_links').replaceWith(window.originalSubMapLinks);
            delete window.originalSubMapLinks;
        }
        fixmystreet.set_up.map_controls();

        window.selected_problem_id = undefined;
        fixmystreet.markers.refresh({force: true}); // force a redraw to return (de)selected marker to normal size

        if (typeof callback === 'function') {
            callback();
        }
    } else {
        window.location.href = reportListUrl;
    }
  }
};


$(function() {
    window.cobrand = $('meta[name="cobrand"]').attr('content');
    fixmystreet.original_title = document.title;

    if (typeof variation !== 'undefined' && variation === 1) {
        $('input[name=variant]').val(1);
    }

    $.each(fixmystreet.set_up, function(setup_name, setup_func) {
        setup_func();
    });
});
