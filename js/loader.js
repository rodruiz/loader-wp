/*
* Version: 1.0
* Build: 20180730.3
*/
import jQuery from 'jQuery';

window.loaderVersion = "1.0";

window.loaderBuild = "20180730.3";

window.MG2Loader = function ($) {
  var allowedCharacters = "0123456789ABCDEFGHIJKLMNOPQabcdefghijklmnopqrstuvwxyz",
    Fingerprinting = 0,
    DataLayer = 1,
    Connext = 2,
    Flittz = 3;

  var EVENTS = {
    ResourceValidationError : "ResourceValidationError",
    ResourceWasNotLoaded: "ResourceWasNotLoaded",
    OptionsHaveDuplicateURLs: "OptionsHaveDuplicateURLs",
    ConfigFileNotFound: 'ConfigFileNotFound',
    JsValidationError: "JsValidationError"
  }

  var DEFAULT_OPTIONS = {
    defaultResourceURLs: {
      FP: 'https://fp-cdn.azureedge.net/',
      DL: 'https://g2insights-cdn.azureedge.net/',
      NXT: 'https://cdn.ayc0zsm69431gfebd.xyz/',
      FZ: 'https://flittz-cdn.azureedge.net/'
    },
    fileNames: {
      FP: 'fp',
      DL: 'mg2-data-extension',
      NXT: 't8y9347t',
      FZ: 'Flittz',
    },
    blockAttempts: 2,
    environment: 'prod',
    appInsightsKey: '8241cbc2-50a5-47c4-b91f-462506490fad',
    globalNames: {
      FZ: String.fromCharCode.apply(null, [70, 108, 105, 116, 116, 122]),
      NXT: String.fromCharCode.apply(null, [67, 111, 110, 110, 101, 120, 116]),
      FP: String.fromCharCode.apply(null, [70, 105, 110, 103, 101, 114, 112, 114, 105, 110, 116]),
      DL: String.fromCharCode.apply(null, [77, 71, 50, 73, 110, 115, 105, 103, 104, 116, 115])
    }
  },
    OPTIONS = {},
    AVAILABLE_PLUGINS = ['FP', 'DL', 'NXT', 'FZ'],
    CONFIG_URL = 'https://loader-cdn.azureedge.net/prod/mng/loader-config.json',
    ENVIRONMENTS = {
      localhost: 'localhost',
      dev: 'dev',
      test: 'test',
      test20: 'test20',
      demo: 'demo',
      stage: 'stage',
      preprod: 'preprod',
      prod: 'prod'
    },
    MODES = {
      default: 1,
      dynamic: 2,
      predefined: 3,
    },
    APP_INSIGHTS = null,
    LOADER_STORAGE = null;

  var CDN_GENERATORS = [
    encodeType1,
    encodeType2,
    encodeType3,
    encodeType4,
    encodeType5
  ];

  function init(options) {
    if (!options || !options.plugins || !options.plugins.length) {
      throw { name: 'nxtError', message: 'Plugins are required for loader. Please, specify at least one plugin for downloading. ' };
    }

    if (options.appInsightsKey) {
      initAppInsights(options.appInsightsKey);
    }

    return getLoaderConfig().then(function (config) {
      OPTIONS = $.extend(true, OPTIONS, DEFAULT_OPTIONS, clearOptions(config), clearOptions(options));

      if (!APP_INSIGHTS) {
        initAppInsights();
      }

      prepareOptions(OPTIONS);

      LOADER_STORAGE = new LoaderStorage();

      LOADER_STORAGE.checkUpdates(OPTIONS.xCode);

      return loadPlugins(OPTIONS.plugins).then(initPlugins);
    });
  }

  function getLoaderConfig() {
    return $.ajax({
      url: CONFIG_URL,
      cache: true,
      ifModified: true,
      crossOrigin: true,
    }).then(function (config) {
      return $.when(config);
    }, function () {
      if (!APP_INSIGHTS) {
        initAppInsights(DEFAULT_OPTIONS.appInsightsKey);
      }
      APP_INSIGHTS && APP_INSIGHTS.trackEvent(EVENTS.ConfigFileNotFound, {
        configUrl: CONFIG_URL
      });
      return $.when({});
    });
  }

  function prepareOptions(options) {
    var preparedPlugins = [];
    options.plugin = {};

    options.plugins.forEach(function (pluginSettings) {
      var plugin = new Plugin(pluginSettings);

      try {
        plugin.validate();
        preparedPlugins.push(plugin);
        options.plugin[plugin.name] = plugin;
      }
      catch (ex) {
        APP_INSIGHTS && APP_INSIGHTS.trackEvent(EVENTS.ResourceValidationError, {
          plugin: plugin.name,
          attempt: plugin.usedLoadAttempts
        });
      }
    });

    options.plugins = preparedPlugins;
  }

  function loadPlugins(plugins) {
    var pluginsQueue = [];

    plugins.forEach(function (plugin) {
      var source = plugin.getSource();
      pluginsQueue.push(loadPluginResources(plugin, source));
    });

    return $.when.apply($, pluginsQueue);
  }

  function loadPluginResources(plugin, source, deferredResources) {
    deferredResources = deferredResources || $.Deferred();

    var ajaxSettings = {
      url: source.js,
      crossOrigin: true,
      dataType: 'script',
      cache: true,
      ifModified: true,
      success: function () {
        successPluginLoad(plugin, source);
        deferredResources.resolve();
      },
      error: function (responce) {

        if (responce.status == 200) {
          successPluginLoad(plugin, source);

          APP_INSIGHTS && APP_INSIGHTS.trackEvent(EVENTS.JsValidationError, {
            plugin: plugin.name,
            url: source.js
          });

          deferredResources.resolve();


        } else {
          if (!source.resourceUrl.isDefault && responce.status === 0) {
            source.resourceUrl.saveAsBlocked();
          }

          if (source.resourceUrl.isDefault) {
            plugin.nextResourceUrlIndex = 0;
          }

          LOADER_STORAGE.deleteCurrentResource(plugin.name);

          var needNextAttempt =
            (!source.resourceUrl.isDefault || source.resourceUrl.isDefault && plugin.hasUnblockedUrls()) &&
              plugin.loadAttempts > plugin.usedLoadAttempts;

          if (needNextAttempt) {
            var nextSource = plugin.getSource();

            loadPluginResources(plugin, nextSource, deferredResources);
          } else {
            if (plugin.required) {
              deferredResources.reject();
            } else {
              deferredResources.resolve();
            }
          }

          APP_INSIGHTS && APP_INSIGHTS.trackEvent(EVENTS.ResourceWasNotLoaded,
            {
              plugin: plugin.name,
              url: source.js,
              attempt: plugin.usedLoadAttempts,
              statusCode: responce.status
            });
        }
      }
    };

    if (jQueryIsOld()) {
      delete ajaxSettings.dataType;
    }

    $.ajax(ajaxSettings);

    plugin.usedLoadAttempts += 1;

    return deferredResources.promise();
  }


  function successPluginLoad(plugin, source) {
    if ((plugin.name == AVAILABLE_PLUGINS[Connext]) || (plugin.name == AVAILABLE_PLUGINS[Flittz])) {
      loadPluginCSS(plugin, source.css);
    }

    if (plugin.initOptions.environment !== ENVIRONMENTS.localhost) {
      plugin.initOptions.resourceUrl = source.resourceUrl.path + source.environmentSegment + '/';
    }

    source.resourceUrl.saveAsCurrent();
  }

  function loadPluginCSS(plugin, href) {
    var cssLink = $("<link>");

    $("head").append(cssLink);

    cssLink.attr({
      id: plugin.name + '_CSS',
      rel: "stylesheet",
      type: "text/css",
      href: href
    });
  }

  function initPlugins() {
    OPTIONS.plugins.forEach(function (plugin) {
      var pluginGlobalObject = OPTIONS.globalNames[plugin.name];

      if (window[pluginGlobalObject] && window[pluginGlobalObject].init) {
        window[pluginGlobalObject].init(plugin.initOptions);
      }
    });
  }

  function Plugin(settings) {
    this.name = (typeof settings.name === 'string') ? settings.name.toUpperCase() : '';
    this.initOptions = settings.initOptions || {};
    this.environment = this.getEnvironment();
    this.version = this.getVersion();
    this.minified = this.isMinified();
    this.required = (settings.required === true) ? true: false;
    this.fileName = OPTIONS.fileNames[this.name];
    this.mode = this.getMode();
    this.resourceURLs = [];
    this.loadAttempts = OPTIONS.loadAttempts;
    this.usedLoadAttempts = 0;
    this.nextResourceUrlIndex = 0;
    this.globalName = OPTIONS.globalNames[this.name];

    if (this.mode === MODES.predefined) {
      this.resourceURLs = OPTIONS.predefinedResourceURLs[this.name];
    }

    if (this.mode === MODES.dynamic) {
      this.resourceURLs = this.generateCDNsByCode(OPTIONS.xCode);
    }

    if (this.mode === MODES.default) {
      this.loadAttempts = 1;
    } else {
      this.loadAttempts = this.loadAttempts || this.resourceURLs.length + 1;
    }
  }

  Plugin.prototype.getSource = function () {
    var resourceUrl = null,
      minifiedPostfix = this.minified ? '.min' : '';

    if (this.mode === MODES.default) {
      resourceUrl = this.getDefaultResourceUrl();
    } else {
      resourceUrl = this.getResourceUrl();
    }

    var environmentSegment = (this.mode === MODES.dynamic && !resourceUrl.isDefault) ? encodeType1(this.environment) : this.environment;
    var versionSegment = (this.mode === MODES.dynamic && !resourceUrl.isDefault) ? encodeType1(this.version) : this.version;

    var source = {
      resourceUrl: resourceUrl,
      js: resourceUrl.path + environmentSegment + '/' + versionSegment + '/' + this.fileName + minifiedPostfix + '.js',
      css: resourceUrl.path + environmentSegment + '/' + versionSegment + '/' + this.fileName + minifiedPostfix + '.css',
      environmentSegment: environmentSegment,
      versionSegment: versionSegment
    };

    return source;
  }

  Plugin.prototype.getVersion = function () {
    var needClientCode = (this.name === AVAILABLE_PLUGINS[Connext]) && (this.initOptions.environment === ENVIRONMENTS.stage || this.initOptions.environment === ENVIRONMENTS.prod);

    if (needClientCode) {
      return this.initOptions.clientCode;
    } else {
      return this.initOptions.version;
    }
  }

  Plugin.prototype.getEnvironment = function () {
    if (environmentIsExists(OPTIONS.environment)) {
      return OPTIONS.environment.toLowerCase();
    }

    if (environmentIsExists(this.initOptions.environment)) {
      return this.initOptions.environment.toLowerCase();
    }

    return ENVIRONMENTS.prod;
  }

  Plugin.prototype.getMode = function () {
    if (OPTIONS.predefinedResourceURLs && Array.isArray(OPTIONS.predefinedResourceURLs[this.name]) && OPTIONS.predefinedResourceURLs[this.name].length > 0) {
      return MODES.predefined;
    }

    if (!OPTIONS.predefinedResourceURLs && OPTIONS.xCode) {
      return MODES.dynamic;
    }

    return MODES.default;
  }

  Plugin.prototype.isMinified = function () {
    return this.environment === ENVIRONMENTS.demo || this.environment === ENVIRONMENTS.stage || this.environment === ENVIRONMENTS.prod;
  }

  Plugin.prototype.validate = function () {
    this.validateVersion();
    this.validateName();
    this.validateURLs();
  }

  Plugin.prototype.validateVersion = function () {
    var requiredClientCode = (this.name === AVAILABLE_PLUGINS[Connext]) && (this.environment === ENVIRONMENTS.stage || this.environment === ENVIRONMENTS.prod);

    if (requiredClientCode) {
      if (!this.initOptions.clientCode) {
        throw { name: 'nxtError', message: 'Please, set clientCode property into InitOptins object! Plugin name: ' + this.name + '. ' };
      }
    } else {
      if (!this.initOptions.version) {
        throw { name: 'nxtError', message: 'Please, set version property into InitOptins object! Plugin name: ' + this.name + '. ' };
      }
    }
  }

  Plugin.prototype.validateName = function () {
    if (!this.name) {
      throw { name: 'nxtError', message: 'Please, set name property into plugin options. ' };
    }
  }

  Plugin.prototype.validateURLs = function () {
    this.resourceURLs = this.resourceURLs.filter(function (url) {
      return isValidURL(url);
    });

    var uniq = this.resourceURLs
      .map(function (url) {
        return { count: 1, url: url }
      })
      .reduce(function (a, b) {
        a[b.url] = (a[b.url] || 0) + b.count
        return a
      }, {});

    var duplicates = Object.keys(uniq).filter(function (a) { return uniq[a] > 1 });

    if (duplicates.length > 0) {
      APP_INSIGHTS && APP_INSIGHTS.trackEvent(EVENTS.OptionsHaveDuplicateURLs, {
        plugin: this.name,
        duplicates: duplicates.toString()
      });
    }
  }

  Plugin.prototype.generateCDNsByCode = function (xCode) {
    this.xCodeCDNs = [];

    CDN_GENERATORS.forEach(function (generator) {
      var cdn = 'https://cdn.' + generator(xCode) + '.com/';

      this.xCodeCDNs.push(cdn);
    }.bind(this));

    return this.xCodeCDNs;
  }

  Plugin.prototype.getResourceUrl = function () {
    var resourceUrl = this.getStoredResourceUrl();

    if (resourceUrl.path) {
      return resourceUrl;
    }

    if (OPTIONS.randomURLChoosing) {
      if (this.resourceURLs.length != this.usedLoadAttempts) {
        resourceUrl = this.getRandomResourceUrl();
      } else {
        resourceUrl = this.getDefaultResourceUrl();
      }
    } else {
      resourceUrl = this.getConsistentResourceUrl();
    }

    if (!resourceUrl.path) {
      resourceUrl = this.getDefaultResourceUrl();
    }

    if (resourceUrl.isDefault && !resourceUrl.index) {
      resourceUrl.index = this.resourceURLs.length;
    }

    this.nextResourceUrlIndex = resourceUrl.index + 1;

    return resourceUrl;
  }

  Plugin.prototype.getStoredResourceUrl = function () {
    var storedData = LOADER_STORAGE.getStoredData(),
      currentResources = LOADER_STORAGE.getStoredData().cRs || {},
      charKey = currentResources[this.name],
      resourceUrlIndex = (typeof charKey !== 'undefined') ? charToIndex(charKey) : null,
      storedResourceUrl = '',
      isDefaultResourceUrl = false;

    if (resourceUrlIndex === this.resourceURLs.length) {
      storedResourceUrl = this.getDefaultResourceUrl().path;
      isDefaultResourceUrl = true;
    } else if (resourceUrlIndex) {
      storedResourceUrl = this.resourceURLs[resourceUrlIndex];
    }

    return new ResourceUrl(storedResourceUrl, { index: resourceUrlIndex, isDefault: isDefaultResourceUrl, pluginName: this.name });
  }

  Plugin.prototype.getRandomResourceUrl = function () {
    var resourceUrl = null,
      resourceUrlIndex;

    for (var i = 0; i < this.resourceURLs.length; i++) {
      resourceUrlIndex = getRandomIndex(0, this.resourceURLs.length - 1);
      resourceUrl = new ResourceUrl(this.resourceURLs[resourceUrlIndex], { index: resourceUrlIndex, pluginName: this.name });

      if (!resourceUrl.checkBlock()) {
        return resourceUrl;
      }
    }

    return new ResourceUrl();
  }

  Plugin.prototype.getConsistentResourceUrl = function () {
    var resourceUrl = null,
      resourceUrlIndex = this.nextResourceUrlIndex;

    for (; resourceUrlIndex < this.resourceURLs.length; resourceUrlIndex++) {
      resourceUrl = new ResourceUrl(this.resourceURLs[resourceUrlIndex], { index: resourceUrlIndex, pluginName: this.name });

      if (!resourceUrl.checkBlock()) {
        return resourceUrl;
      }
    }

    return new ResourceUrl();
  }

  Plugin.prototype.getDefaultResourceUrl = function () {
    var url = OPTIONS.defaultResourceURLs[this.name];
    return new ResourceUrl(url, { isDefault: true, pluginName: this.name, index: this.resourceURLs.length });
  }

  Plugin.prototype.hasUnblockedUrls = function () {
    var hasUnblockedUrls = false;

    if (this.mode === MODES.default) {
      return hasUnblockedUrls;
    }

    var blockedResources = LOADER_STORAGE.getStoredData().bRs[this.name];

    for (var i = 0; i < this.resourceURLs.length; i++) {
      var blockCount = blockedResources[indexToChar(i)];

      if (blockCount !== OPTIONS.blockAttempts) {
        hasUnblockedUrls = true;
        break;
      }
    }

    return hasUnblockedUrls;
  }


  function LoaderStorage() {
    this.storageKey = 'nxt_ldr_rsrc_rls';

    this.defaulLoaderData = {
      cRs: {},
      bRs: {},
      xC: null
    }
  }

  LoaderStorage.prototype.getStoredData = function () {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || this.defaulLoaderData;
    } catch (ex) {
      console.error(ex);
      return this.defaulLoaderData;
    }
  }

  LoaderStorage.prototype.storeData = function (data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (ex) {
      console.error(ex);
    }
  }

  LoaderStorage.prototype.checkUpdates = function (xCode) {
    var loaderData = this.getStoredData();

    if (loaderData.xC !== xCode) {
      loaderData = {
        xC: xCode,
        cRs: {},
        bRs: {}
      }

      this.storeData(loaderData);
    }
  }

  LoaderStorage.prototype.deleteCurrentResource = function (pluginName) {
    var storedLoaderData = LOADER_STORAGE.getStoredData();

    if (storedLoaderData.cRs) {
      delete storedLoaderData.cRs[pluginName];

      LOADER_STORAGE.storeData(storedLoaderData);
    }
  }


  function ResourceUrl(path, options) {
    options = options || {};
    path = path || '';

    this.path = setCorrectURLFormat(path);
    this.index = options.index;
    this.isDefault = options.isDefault || false;
    this.pluginName = options.pluginName;
  }

  ResourceUrl.prototype.saveAsCurrent = function () {
    var loaderData = LOADER_STORAGE.getStoredData();

    loaderData.cRs[this.pluginName] = indexToChar(this.index);

    LOADER_STORAGE.storeData(loaderData);
  }

  ResourceUrl.prototype.saveAsBlocked = function () {
    var loaderData = LOADER_STORAGE.getStoredData();
    var charKey = indexToChar(this.index);

    if (!loaderData.bRs[this.pluginName]) {
      loaderData.bRs[this.pluginName] = {};
    }

    if (!loaderData.bRs[this.pluginName][charKey]) {
      loaderData.bRs[this.pluginName][charKey] = 0;
    }

    loaderData.bRs[this.pluginName][charKey] += 1;

    LOADER_STORAGE.storeData(loaderData);
  }

  ResourceUrl.prototype.checkBlock = function () {
    var loaderData = LOADER_STORAGE.getStoredData();

    var urlIsBlocked = loaderData.bRs
      && loaderData.bRs[this.pluginName]
      && loaderData.bRs[this.pluginName][indexToChar(this.index)] >= OPTIONS.blockAttempts;

    return urlIsBlocked;
  }

  function initAppInsights(key) {
    if (!key && (!OPTIONS || !OPTIONS.appInsightsKey)) {
      APP_INSIGHTS = null;
      return;
    }
    try {
      APP_INSIGHTS = function(config) {
        function i(config) {
          t[config] = function() {
            var i = arguments;
            t.queue = t.queue || [];
            t.queue.push(function() {
              t[config].apply(t, i);
            });
          }
        }

        var t = {
            config: config
          },
          u = document,
          e = window,
          o = "script",
          s = "AuthenticatedUserContext",
          h = "start",
          c = "stop",
          l = "Track",
          a = l + "Event",
          v = l + "Page",
          y = u.createElement(o),
          r,
          f;
        y.src = config.url || "https://az416426.vo.msecnd.net/scripts/a/ai.0.js";
        u.getElementsByTagName(o)[0].parentNode.appendChild(y);
        try {
          t.cookie = u.cookie;
        } catch (p) { }
        for (t.queue = [], t.version = "1.0", r = ["Event", "Exception", "Metric", "PageView", "Trace", "Dependency"]; r.length;) i("track" + r.pop());
        return i("set" + s), i("clear" + s), i(h + a), i(c + a), i(h + v), i(c + v), i("flush"),
          config.disableExceptionTracking ||
          (r = "onerror", i("_" + r), f = e[r], e[r] = function(config, i, u, e, o) {
            var s = f && f(config, i, u, e, o);
            return s !== !0 && t["_" + r](config, i, u, e, o), s;
          }), t;
      }({
        instrumentationKey: key || OPTIONS.appInsightsKey,
        disableExceptionTracking: true,
        disableAjaxTracking: true
      });

      window.appInsights = APP_INSIGHTS;
    } catch (ex) {
      APP_INSIGHTS = null;
    }
  }

  function encodeType1(code) {
    return btoa(code).replace(/[^a-z0-9]/gi, '');
  }

  function encodeType2(code) {
    var symbol,
      charLocation,
      encryptedCharlocation,
      encryptedChar,
      encryptedString = "";

    for (var i = 0; i < code.length; i++) {
      symbol = code.substring(i, i + 1);
      charLocation = allowedCharacters.indexOf(symbol);
      encryptedCharlocation = charLocation ^ 1;
      encryptedChar = allowedCharacters.substring(encryptedCharlocation, encryptedCharlocation + 1);
      encryptedString += encryptedChar;
    }
    return encryptedString;
  }

  function encodeType3(code) {
    var maxPC = ifPC = 0,
      numPC = 0,
      keyCode = 'Secret key',
      result = "";

    for (var i = 0; i < keyCode.length; i++) {
      maxPC += keyCode.charCodeAt(i);
    }

    maxPCmod = maxPC;
    for (var i = 0; i < code.length; i++) {
      if (numPC == keyCode.length) numPC = 0;

      if (maxPCmod < 1) {
        maxPCmod = maxPC + ifPC;
      }

      var iscode = maxPCmod % keyCode.charCodeAt(numPC),
        nCode = (code.charCodeAt(i) + iscode);


      ifPC += maxPCmod % keyCode.charCodeAt(numPC);
      maxPCmod -= keyCode.charCodeAt(numPC);

      numPC++;

      result += parseInt(nCode / 52) + allowedCharacters.charAt(parseInt(nCode % 52));
    }
    return result;
  }

  function encodeType4(code) {
    var result = '';

    result = code[0] + code[code.length - 1] + code.length + code[code.length - 1] + code[0] + 'rr' + code.length + 'j';

    return result;
  }

  function encodeType5(code) {
    var result = '';

    var chars = code.split('');

    chars.forEach(function (char) {
      result += String.fromCharCode(char.charCodeAt() + 2) + char + String.fromCharCode(char.charCodeAt() - 2);
    });

    result = result.replace(/[^a-z0-9]/gi, '');

    if (result.length < 8) {
      for (var i = result.length; i < 8; i++) {
        result += String.fromCharCode(96 + 2 * i);
      }
    }

    return result;
  }

  function clearOptions(options) {
    if (!options.appInsightsKey) {
      delete options.appInsightsKey;
    }

    if (typeof options.blockAttempts !== 'number' && options.blockAttempts !== null) {
      delete options.blockAttempts;
    }

    if (typeof options.loadAttempts !== 'number' && options.loadAttempts !== null) {
      delete options.loadAttempts;
    }

    if (typeof options.randomURLChoosing !== 'boolean') {
      delete options.randomURLChoosing;
    }

    if (options.fileNames) {
      $.each(options.fileNames, function (key, value) {
        if (!options.fileNames[key]) {
          delete options.fileNames[key];
        }
      });
    }

    if (options.defaultResourceURLs) {
      $.each(options.defaultResourceURLs, function (key, value) {
        if (!options.defaultResourceURLs[key]) {
          delete options.defaultResourceURLs[key];
        }
      });
    }

    if (options.predefinedResourceURLs) {
      $.each(options.predefinedResourceURLs, function (key, value) {
        if (!options.predefinedResourceURLs || !options.predefinedResourceURLs[key].length) {
          delete options.predefinedResourceURLs[key];
        }
      });

      if ($.isEmptyObject(options.predefinedResourceURLs)) {
        options.predefinedResourceURLs = null;
      }
    }

    return options;
  }

  function environmentIsExists(environment) {
    return (typeof environment === 'string' || environment instanceof String) && ENVIRONMENTS[environment.toLowerCase()];
  }

  function getRandomIndex(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function jQueryIsOld() {
    return $.fn.jquery.split('.')[0] < 2;
  }

  function isValidURL(url) {
    var pattern = new RegExp("((http|https)(:\/\/))?([a-zA-Z0-9]+[.]{1}){2}[a-zA-z0-9]+(\/{1}[a-zA-Z0-9]+)*\/?", "i");
    return pattern.test(url);
  }

  function indexToChar(index) {
    return String.fromCharCode(index);
  }

  function charToIndex(char) {
    return char.charCodeAt();
  }

  function setCorrectURLFormat(url) {
    return (!url || url.lastIndexOf('/') === url.length - 1) ? url : url + '/';
  }

  function getVersionInfo() {
    return "Version: " + window.loaderVersion + ", Build: " + window.loaderBuild;
  }

  return {
    init: init,
    GetVersionInfo: getVersionInfo
  };
}(jQuery);
