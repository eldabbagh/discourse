/**
  Keyboard Shortcut related functions.

  @class KeyboardShortcuts
  @namespace Discourse
  @module Discourse
**/
Discourse.KeyboardShortcuts = Ember.Object.createWithMixins({
  PATH_BINDINGS: {
    'g h': '/',
    'g l': '/latest',
    'g n': '/new',
    'g u': '/unread',
    'g f': '/starred',
    'g c': '/categories',
    'g t': '/top'
  },

  CLICK_BINDINGS: {
    'b': '.topic-post.selected button.bookmark',                      // bookmark current post
    'c': '#create-topic',                                         // create new topic
    'd': '.topic-post.selected button.delete',                        // delete selected post
    'e': '.topic-post.selected button.edit',                          // edit selected post

    // star topic
    'f': '#topic-footer-buttons button.star, #topic-list tr.topic-list-item.selected a.star',

    'l': '.topic-post.selected button.like',                          // like selected post
    'm m': 'div.notification-options li[data-id="0"] a',          // mark topic as muted
    'm r': 'div.notification-options li[data-id="1"] a',          // mark topic as regular
    'm t': 'div.notification-options li[data-id="2"] a',          // mark topic as tracking
    'm w': 'div.notification-options li[data-id="3"] a',          // mark topic as watching
    'n': '#user-notifications',                                   // open notifictions menu
    'o,enter': '#topic-list tr.selected a.title', // open selected topic
    'shift+r': '#topic-footer-buttons button.create',                   // reply to topic
    'r': '.topic-post.selected button.create',                        // reply to selected post
    'shift+s': '#topic-footer-buttons button.share',                    // share topic
    's': '.topic-post.selected button.share',                         // share selected post
    '!': '.topic-post.selected button.flag'                           // flag selected post
  },

  FUNCTION_BINDINGS: {
    'home': 'goToFirstPost',
    'end': 'goToLastPost',
    'j': 'selectDown',
    'k': 'selectUp',
    'u': 'goBack',
    '`': 'nextSection',
    '~': 'prevSection',
    '/': 'showSearch',
    '?': 'showHelpModal',                                          // open keyboard shortcut help
    'q': 'quoteReply'
  },

  bindEvents: function(keyTrapper) {
    this.keyTrapper = keyTrapper;
    _.each(this.PATH_BINDINGS, this._bindToPath, this);
    _.each(this.CLICK_BINDINGS, this._bindToClick, this);
    _.each(this.FUNCTION_BINDINGS, this._bindToFunction, this);
  },

  quoteReply: function(){
    $('.topic-post.selected button.create').click();
    // lazy but should work for now
    setTimeout(function(){
      $('#wmd-quote-post').click();
    }, 500);
  },

  goToFirstPost: function() {
    this._jumpTo('jumpTop');
  },

  goToLastPost: function() {
    this._jumpTo('jumpBottom');
  },

  _jumpTo: function(direction) {
    if ($('.container.posts').length) {
      Discourse.__container__.lookup('controller:topic').send(direction);
    }
  },

  selectDown: function() {
    this._moveSelection(1);
  },

  selectUp: function() {
    this._moveSelection(-1);
  },

  goBack: function() {
    history.back();
  },

  nextSection: function() {
    this._changeSection(1);
  },

  prevSection: function() {
    this._changeSection(-1);
  },

  showSearch: function() {
    $('#search-button').click();
    return false;
  },

  showHelpModal: function() {
    Discourse.__container__.lookup('controller:application').send('showKeyboardShortcutsHelp');
  },

  _bindToPath: function(path, binding) {
    this.keyTrapper.bind(binding, function() {
      Discourse.URL.routeTo(path);
    });
  },

  _bindToClick: function(selector, binding) {
    binding = binding.split(',');
    this.keyTrapper.bind(binding, function() {
      $(selector).click();
    });
  },

  _bindToFunction: function(func, binding) {
    if (typeof this[func] === 'function') {
      this.keyTrapper.bind(binding, _.bind(this[func], this));
    }
  },

  _moveSelection: function(direction) {
    var $articles = this._findArticles();

    if (typeof $articles === 'undefined') {
      return;
    }

    var $selected = $articles.filter('.selected'),
        index = $articles.index($selected);

    // loop is not allowed
    if (direction === -1 && index === 0) { return; }

    // if nothing is selected go to the first post on screen
    if ($selected.length === 0) {
      var scrollTop = $('body').scrollTop();

      index = 0;
      $articles.each(function(){
        var top = $(this).position().top;
        if(top > scrollTop) {
          return false;
        }
        index += 1;
      });

      if(index >= $articles.length){
        index = $articles.length - 1;
      }
    }

    var $article = $articles.eq(index + direction);

    if ($article.size() > 0) {
      $articles.removeClass('selected');
      Em.run.next(function(){
        $article.addClass('selected');
      });

      var rgx = new RegExp("post-cloak-(\\d+)").exec($article.parent()[0].id);
      if (rgx === null || typeof rgx[1] === 'undefined') {
          this._scrollList($article, direction);
      } else {
          Discourse.TopicView.jumpToPost(rgx[1]);
      }
    }
  },

  _scrollList: function($article, direction) {
    var $body = $('body'),
        distToElement = $article.position().top + $article.height() - $(window).height() - $body.scrollTop();

    // cut some bottom slack
    distToElement += 40;

    // don't scroll backwards, its silly
    if((direction > 0 && distToElement < 0) || (direction < 0 && distToElement > 0)) {
      return;
    }

    $('html, body').scrollTop($body.scrollTop() + distToElement);
  },

  _findArticles: function() {
    var $topicList = $('#topic-list'),
        $topicArea = $('.posts-wrapper');

    if ($topicArea.size() > 0) {
      return $('.posts-wrapper .topic-post, #topic-list tbody tr');
    }
    else if ($topicList.size() > 0) {
      return $topicList.find('.topic-list-item');
    }
  },

  _changeSection: function(direction) {
    var $sections = $('#navigation-bar').find('li'),
        index = $sections.index('.active');

    $sections.eq(index + direction).find('a').click();
  }
});
