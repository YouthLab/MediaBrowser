﻿(function ($, window, document) {

    function loadMediaFolders(page, user, mediaFolders) {

        var html = '';

        html += '<fieldset data-role="controlgroup">';

        html += '<legend>' + Globalize.translate('HeaderLibraryAccess') + '</legend>';

        for (var i = 0, length = mediaFolders.length; i < length; i++) {

            var folder = mediaFolders[i];

            var id = 'mediaFolder' + i;

            var checkedAttribute = user.Policy.BlockedMediaFolders.indexOf(folder.Id) == -1 && user.Policy.BlockedMediaFolders.indexOf(folder.Name) == -1 ? ' checked="checked"' : '';

            html += '<input class="chkMediaFolder" data-foldername="' + folder.Id + '" type="checkbox" id="' + id + '"' + checkedAttribute + ' />';
            html += '<label for="' + id + '">' + folder.Name + '</label>';
        }

        html += '</fieldset>';

        $('.mediaFolderAccess', page).html(html).trigger('create');
    }

    function loadChannels(page, user, channels) {

        var html = '';

        html += '<fieldset data-role="controlgroup">';

        html += '<legend>' + Globalize.translate('HeaderChannelAccess') + '</legend>';

        for (var i = 0, length = channels.length; i < length; i++) {

            var folder = channels[i];

            var id = 'channels' + i;

            var checkedAttribute = user.Policy.BlockedChannels.indexOf(folder.Id) == -1 ? ' checked="checked"' : '';

            html += '<input class="chkChannel" data-foldername="' + folder.Id + '" type="checkbox" id="' + id + '"' + checkedAttribute + ' />';
            html += '<label for="' + id + '">' + folder.Name + '</label>';
        }

        html += '</fieldset>';

        $('.channelAccess', page).show().html(html).trigger('create');

        if (channels.length) {
            $('.channelAccessContainer', page).show();
        } else {
            $('.channelAccessContainer', page).hide();
        }
    }

    function loadDevices(page, user, devices) {

        var html = '';

        html += '<fieldset data-role="controlgroup">';

        html += '<legend>' + Globalize.translate('HeaderSelectDevices') + '</legend>';

        for (var i = 0, length = devices.length; i < length; i++) {

            var device = devices[i];

            var id = 'device' + i;

            var checkedAttribute = user.Policy.EnableAllDevices || user.Policy.EnabledDevices.indexOf(device.Id) != -1 ? ' checked="checked"' : '';

            html += '<input class="chkDevice" data-deviceid="' + device.Id + '" type="checkbox" id="' + id + '"' + checkedAttribute + ' />';
            html += '<label for="' + id + '">' + device.Name;

            html += '<br/><span style="font-weight:normal;font-size: 90%;">' + device.AppName + '</span>';
            html += '</label>';
        }

        html += '</fieldset>';

        $('.deviceAccess', page).show().html(html).trigger('create');

        $('#chkEnableAllDevices', page).checked(user.Policy.EnableAllDevices).checkboxradio('refresh').trigger('change');
    }

    function loadUser(page, user, loggedInUser, mediaFolders, channels, devices) {

        $(page).trigger('userloaded', [user]);

        Dashboard.setPageTitle(user.Name);

        loadChannels(page, user, channels);
        loadMediaFolders(page, user, mediaFolders);
        loadDevices(page, user, devices);

        Dashboard.hideLoadingMsg();
    }

    function onSaveComplete(page) {

        Dashboard.hideLoadingMsg();

        Dashboard.alert(Globalize.translate('SettingsSaved'));
    }

    function saveUser(user, page) {

        user.Policy.BlockedMediaFolders = $('.chkMediaFolder:not(:checked)', page).map(function () {

            return this.getAttribute('data-foldername');

        }).get();

        user.Policy.BlockedChannels = $('.chkChannel:not(:checked)', page).map(function () {

            return this.getAttribute('data-foldername');

        }).get();

        user.Policy.EnableAllDevices = $('#chkEnableAllDevices', page).checked();

        user.Policy.EnabledDevices = user.Policy.EnableAllDevices ?
            [] :
            $('.chkDevice:checked', page).map(function () {

                return this.getAttribute('data-deviceid');

            }).get();

        ApiClient.updateUserPolicy(user.Id, user.Policy).done(function () {
            onSaveComplete(page);
        });
    }

    window.LibraryAccessPage = {

        onSubmit: function () {

            var page = $(this).parents('.page');

            Dashboard.showLoadingMsg();

            var userId = getParameterByName("userId");

            ApiClient.getUser(userId).done(function (result) {
                saveUser(result, page);
            });

            // Disable default form submission
            return false;
        }
    };

    $(document).on('pageinit', "#userLibraryAccessPage", function () {

        var page = this;

        $('#chkEnableAllDevices', page).on('change', function () {

            if (this.checked) {
                $('.deviceAccessListContainer', page).hide();
            } else {
                $('.deviceAccessListContainer', page).show();
            }

        });

    }).on('pageshow', "#userLibraryAccessPage", function () {

        var page = this;

        Dashboard.showLoadingMsg();

        var userId = getParameterByName("userId");

        var promise1;

        if (!userId) {

            var deferred = $.Deferred();

            deferred.resolveWith(null, [{
                Configuration: {}
            }]);

            promise1 = deferred.promise();
        } else {

            promise1 = ApiClient.getUser(userId);
        }

        var promise2 = Dashboard.getCurrentUser();
        var promise4 = ApiClient.getJSON(ApiClient.getUrl("Library/MediaFolders", { IsHidden: false }));
        var promise5 = ApiClient.getJSON(ApiClient.getUrl("Channels"));
        var promise6 = ApiClient.getJSON(ApiClient.getUrl('Devices', {
            SupportsUniqueIdentifier: true
        }));

        $.when(promise1, promise2, promise4, promise5, promise6).done(function (response1, response2, response4, response5, response6) {

            loadUser(page, response1[0] || response1, response2[0], response4[0].Items, response5[0].Items, response6[0].Items);

        });
    });

})(jQuery, window, document);