$(document).ready(function() {

    var socket = io(),
        lastKeyword = '',
        resultsDeep = resultsClear = [],
        _isSearching = false,
        isSearching = function(value) {
            if (typeof value !== 'undefined') {
                _isSearching = value;
            }

            //toggle search indicator
            if (_isSearching) {
                $('#search-indicator').show();
            } else {
                $('#search-indicator').hide();
            }

            return _isSearching;
        },
        searchTimeoutThrottle = 500,
        searchTimeout;

    socket.on('data-list', function(data) {
        populateResults(data);
    });

    socket.on('data-details', function(data) {
        populateResultDetail(data.data, data.isDeep);
    });

    socket.emit('keyword', 'russia');

    var fixHeight = function(){
        $('.results-container').height($(window).outerHeight()-150);
    };

    $(window).resize(fixHeight);

    fixHeight();

    $('a.result-back-btn').on('click', function(e) {
        e.preventDefault();

        $(this).parents('.result-detail-content').hide();

        return false;
    });

    $('#query').on('keyup', function(e) {

        if(e.keyCode == 13){
            clearTimeout(searchTimeout);
            var query = $('#query').val();

            // validate search query
            if (!query) {
                populateResults(); //reset results if query is empty
                return;
            }

            searchTimeout = setTimeout(function() {
                doSearch(query);
            }, searchTimeoutThrottle);
        }
    });

    var populateResultDetail = function(result, isDeep) {
        var target = isDeep ? $('#results-dark') : $('#results-clear');
        targetContent = target.find('.result-detail-content');

        targetContent.find('.result-title').html(result.title);
        targetContent.find('.result-content').html(result.text);

        if(isDeep){
            targetContent.find('.result-content').append('<img src="img/right.svg">');
        } else {
            targetContent.find('.result-content').append('<img src="img/left.svg">');
        }

        targetContent.show();
    };

    var populateResults = function(results) {

        if (!results) {
            resetSearch();
            return;
        }

        if (results.keyword !== lastKeyword) {
            return;
        }

        results.data = results.data.map(function(r) {
            r.date = moment(r.date).fromNow();
            return r;
        });


        if (results.isDeep) {
            hideRightLoader();
            resultsDark = Array.prototype.concat(resultsDark, results.data);
        } else {
            hideLeftLoader();
            resultsClear = Array.prototype.concat(resultsClear, results.data);
        }

        var resultsClearContent = $('<ul/>').addClass('list-unstyled'),
            resultsDarkContent = $('<ul/>').addClass('list-unstyled');

        resultsClear.forEach(function(result) {
            resultsClearContent.append(resultTemplate(result));
        });

        resultsDark.forEach(function(result) {
            resultsDarkContent.append(resultTemplate(result));
        });

        $('#results-clear .results-content').html('').append(resultsClearContent);
        $('#results-dark .results-content').html('').append(resultsDarkContent);

        $('body').addClass('has-results');
        isSearching(false);
    };

    var resultClickListener = function(e) {
        e.preventDefault();

        var url = $(this).attr('href');

        socket.emit('details', url);

        return false;
    };

    var resultDetailTemplate = function(result) {
        var template = $($('#result-detail-template').html());

    };

    var resultTemplate = function(result) {
        var output = $('<li/>'),
            template = $($('#result-template').html());

        template.attr('href', result.url);
        template.find('.result-title').html(result.title);
        template.find('.result-source').html(result.source);
        template.find('.result-date').html(result.date);

        template.on('click', resultClickListener);

        output.append(template);

        return output;
    };

    var hideLeftLoader = function() {
        $('#results-clear .loader').fadeOut();
    };

    var hideRightLoader = function() {
        $('#results-dark .loader').fadeOut();
    };

    var showLeftLoader = function() {
        $('#results-clear .loader').fadeIn();
    };

    var showRightLoader = function() {
        $('#results-dark .loader').fadeIn();
    };

    var resetSearch = function() {
        $('body').removeClass('has-results');
        resultsClear = [];
        resultsDark = [];
        $('#results-clear .results-content, #results-dark .results-content').html('');
    };

    var doSearch = function(query) {
        if (!isSearching()) {
            if (lastKeyword !== query) {
                resetSearch();
            }
            showRightLoader();
            showLeftLoader();
            lastKeyword = query;
            isSearching(true);
            socket.emit('keyword', query);
        }
    };
});
