/*
* Version: 1.0.6 
* Build: 20191204.1 
*/ 

 window.loaderVersion = "1.0.6";

 window.loaderBuild = "20191204.1";function PluginInitOverride(overrides, plugin, siteCode, layoutCode){
    this.plugin = plugin;
    this.overrides = overrides;
    this.siteCode = siteCode;
    this.layoutCode = layoutCode;
}


PluginInitOverride.prototype.findCurrentPlugin = function (overrideTypeInits) {
    var pluginOptions = null;
    if (overrideTypeInits && overrideTypeInits.plugins) {
        var pluginsLength = overrideTypeInits.plugins.length;
        for (var i = 0; i < pluginsLength; i++) {
            pluginSettings = overrideTypeInits.plugins[i];
            if (pluginSettings.name == this.plugin.name) {
                return pluginSettings.initOptions;
            }
        }
    }

    return pluginOptions;
}


PluginInitOverride.prototype.getTypeInits = function (overrideTypeInits, property, propertyValue) {
    var overrideInits = {};
    if(overrideTypeInits){
        if(overrideTypeInits[property] && overrideTypeInits[property][propertyValue]){
            var overridePluginInits = this.findCurrentPlugin(overrideTypeInits[property][propertyValue]);
            if(overridePluginInits){
                $.extend(true,  overrideInits, overridePluginInits);
            }
        }
    }

    return overrideInits;
}



PluginInitOverride.prototype.getCustomInits = function(){
    var overrideInits = {};
    var that = this;
    this.overrides.forEach(function(overrideTypeInits) {
        var siteCodeInits = that.getTypeInits(overrideTypeInits, 'siteCodes', that.siteCode);
        var layoutInits = that.getTypeInits(overrideTypeInits, 'customLayouts', that.layoutCode);

        $.extend(true,  overrideInits, siteCodeInits, layoutInits);

    });

    return overrideInits;
}


var MG2Loader = function ($) {
    var allowedCharacters = "0123456789ABCDEFGHIJKLMNOPQabcdefghijklmnopqrstuvwxyz",
        Fingerprinting = 0,
        DataLayer = 1,
        Connext = 2,
        Flittz = 3;

    var EVENTS = {
        ResourceValidationError: "ResourceValidationError",
        ResourceWasNotLoaded: "ResourceWasNotLoaded",
        OptionsHaveDuplicateURLs: "OptionsHaveDuplicateURLs",
        ConfigFileNotFound: 'ConfigFileNotFound',
        JsValidationError: "JsValidationError"
    }
    var SessionId= null;
    var DEFAULT_OPTIONS = {
        defaultResourceURLs: {
            FP: 'https://fp-cdn.azureedge.net/',
            DL: 'https://g2insights-cdn.azureedge.net/',
            NXT: 'https://cdn.czx5eyk0exbhwp43ya.biz/',
            FZ: 'https://flittz-cdn.azureedge.net/'
        },
        fileNames: {
            FP: 'fp',
            DL: 'g2insights',
            NXT: 't8y9347t',
            FZ: 'Flittz',
        },
        blockAttempts: 2,
        environment: '__ENVIRONMENT__',
        appInsightsKey: '__APP_INSIGHTS_KEY__',
        globalNames: {
            FZ: String.fromCharCode.apply(null, [70, 108, 105, 116, 116, 122]), // Flittz
            NXT: String.fromCharCode.apply(null, [67, 111, 110, 110, 101, 120, 116]), // Connext
            FP: String.fromCharCode.apply(null, [70, 105, 110, 103, 101, 114, 112, 114, 105, 110, 116]), // Fingerprint
            DL: String.fromCharCode.apply(null, [77, 71, 50, 73, 110, 115, 105, 103, 104, 116, 115]) // MG2Insights
        }
    },
        OPTIONS = {},
        AVAILABLE_PLUGINS = ['FP', 'DL', 'NXT', 'FZ'],
        CONFIG_URL = '__JSON_URL__',
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
    ],
    SITE_CODE,
    LAYOUT_CODE;

    function getPropertyValueFromClientInits(clientInitPlugins, property) {
        var pluginsLength = clientInitPlugins.length;
        for(var i=0; i< pluginsLength; i++){
            var pluginInits = clientInitPlugins[i].initOptions;
            if(pluginInits){
                if (pluginInits.hasOwnProperty(property)) {
                    return pluginInits[property];
                }
            }
        }

        return null;
    }


    //main function
    function init(options) {
        //main validation
        if (!options || !options.plugins || !options.plugins.length) {
            throw { name: 'nxtError', message: 'Plugins are required for loader. Please, specify at least one plugin for downloading. ' };
        }

        //if appInsightsKey passed as init param
        if (options.appInsightsKey) {
            initAppInsights(options.appInsightsKey);
        }
        SessionId = GenerateGuid();
        return loadPolifills().then(function(){
        //getting loader file

            return getLoaderConfig(options.CONFIG_URL).then(function (config) {     //WP case: ConfigUrl passed as init param from wrapper
                LoaderConfig = config;
               
                var defaultOptions = $.extend(true, OPTIONS, DEFAULT_OPTIONS, clearOptions(config), clearOptions(options));
                defaultOptions.plugins = extendCustomPluginSetting(options.plugins,  config.plugins);

                SITE_CODE = getPropertyValueFromClientInits(defaultOptions.plugins,'siteCode');
                LAYOUT_CODE = getPropertyValueFromClientInits(defaultOptions.plugins, 'layoutCode') || SITE_CODE;

                OPTIONS = defaultOptions;
    
                //todo we need to have different APPINSIGHTS instanse for LOADER
                if (!APP_INSIGHTS) {
                    initAppInsights();
                }
               
                prepareOptions(OPTIONS);
    
                LOADER_STORAGE = new LoaderStorage();
    
                LOADER_STORAGE.checkUpdates(OPTIONS.xCode);
    
                return loadPlugins(OPTIONS.plugins).then(initPlugins);
            });
        })
   
    }

    function getLoaderConfig(configUrl) {
        var url = configUrl || CONFIG_URL;
        return $.ajax({
            url: url,
            cache: false,
            ifModified: true,
            crossOrigin: true,
        }).then(function (config) {
            return $.when(config);
        }, function () {
            //APP_INSIGHTS hasn't been initialized yet
            if (!APP_INSIGHTS) {
                initAppInsights(DEFAULT_OPTIONS.appInsightsKey);
            }
            APP_INSIGHTS && APP_INSIGHTS.trackEvent(EVENTS.ConfigFileNotFound, {
                configUrl: url
            });
            return $.when({});
        });
    }

    function findPluginKeyByName(plugins, name){
        var pluginKey;
        plugins.forEach(function (pluginSettings, key) {
            if(pluginSettings.name == name){
                pluginKey = key;
                return false;
            }
        });
        return pluginKey;
    }

    function extendCustomPluginSetting(defaultInitPluginsOptions, customInitPluginsOptions){
        if(customInitPluginsOptions) {
            customInitPluginsOptions.forEach(function (pluginSettings) {
                var pluginKey = findPluginKeyByName(defaultInitPluginsOptions, pluginSettings.name);
                $.extend(true,  defaultInitPluginsOptions[pluginKey].initOptions, pluginSettings.initOptions);
            });
        }

        return defaultInitPluginsOptions;
    }

    function isDefinedEnvironment(pluginSettings){
       return pluginSettings && pluginSettings.initOptions && pluginSettings.initOptions.environment;
    }

    function prepareOptions(options) {
        var preparedPlugins = [];
        options.plugin = {};
        options.plugins.forEach(function (pluginSettings) {
            pluginSettings.initOptions.sessionId = SessionId;
            pluginSettings.initOptions.siteCode = pluginSettings.initOptions.siteCode || SITE_CODE;
            pluginSettings.initOptions.layoutCode = pluginSettings.initOptions.layoutCode || LAYOUT_CODE;
            
            if(!isDefinedEnvironment(pluginSettings)){
                pluginSettings.initOptions['environment'] = OPTIONS.environment; 
            }
            var plugin = new Plugin(pluginSettings);

           
            //todo #1 this code trows errors when potions is not valid. I think we need to catch those errors and continiue validate other plugin. Current implementation will stop any work after any error!
            //todo #2 we need to track event in analytic when we have invalid data
            //todo #3 there is no validation for all plugins except Connext. We need to add it for DataLayer and Flittz. 

            try {
                plugin.validate();
                preparedPlugins.push(plugin);
                options.plugin[plugin.name] = plugin;

            }
            catch (ex) {
                //validation error of plugin, we will not load that plugin, but will load all other plugins
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
            if(LoaderConfig.overrides && LoaderConfig.overrides.length>0){
                var overrideInits = new PluginInitOverride(LoaderConfig.overrides, plugin, SITE_CODE, LAYOUT_CODE);
                var pluginCustomInits = overrideInits.getCustomInits();
            
                $.extend(true,  plugin.initOptions, pluginCustomInits);   
            }

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


    // --- LOADER OBJECTS ---

    function Plugin(settings) {
        this.name = (typeof settings.name === 'string') ? settings.name.toUpperCase() : '';
        this.initOptions = settings.initOptions || {};
        this.environment = this.getEnvironment();
        this.version = this.getVersion();
        this.minified = this.isMinified();
        this.required = (settings.required === true) ? true : false;
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
        var xCode = (this.initOptions && this.initOptions.xCode) ? this.initOptions.xCode: "";

        var source = {
            resourceUrl: resourceUrl,
            js: resourceUrl.path + environmentSegment + '/' + versionSegment + '/' + this.fileName + minifiedPostfix + '.js?' + xCode,
            css: resourceUrl.path + environmentSegment + '/' + versionSegment + '/' + this.fileName + minifiedPostfix + '.css?'+ xCode,
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
        var predefinedUrls = OPTIONS.predefinedResourceURLs ? OPTIONS.predefinedResourceURLs[this.name]: null;
        if (predefinedUrls && Array.isArray(predefinedUrls) && predefinedUrls.length > 0) {
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
        // remove invalid URLs
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
            var blockCount = blockedResources ? blockedResources[indexToChar(i)] : null;

            if (!blockCount || blockCount !== OPTIONS.blockAttempts) {
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


    // --- APP INSIGHTS ---

    function initAppInsights(key) {
        if (!key && (!OPTIONS || !OPTIONS.appInsightsKey)) {
            APP_INSIGHTS = null;
            return;
        }
        try {
            APP_INSIGHTS = function (config) {
                function i(config) {
                    t[config] = function () {
                        var i = arguments;
                        t.queue = t.queue || [];
                        t.queue.push(function () {
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
                    (r = "onerror", i("_" + r), f = e[r], e[r] = function (config, i, u, e, o) {
                        var s = f && f(config, i, u, e, o);
                        return s !== !0 && t["_" + r](config, i, u, e, o), s;
                    }), t;
            }({
                instrumentationKey: key || OPTIONS.appInsightsKey,
                disableExceptionTracking: true,
                disableAjaxTracking: true,
                maxAjaxCallsPerView: 0
            });

            window.appInsights = APP_INSIGHTS;
        } catch (ex) {
            APP_INSIGHTS = null;
        }
    }


    // --- URL GENERATORS ---

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


    // --- UTILS ---

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

    function loadPolifills(){
        deferredResources = $.Deferred();

        var ajaxSettings = {
            url: "https://polyfill.io/v3/polyfill.min.js?flags=gated&features=es5%2CCustomEvent%2CArray.from%2CArray.isArray%2CArray.prototype.filter%2CArray.prototype.find%2CArray.prototype.findIndex%2CArray.prototype.forEach%2CArray.prototype.indexOf%2CArray.prototype.keys%2CArray.prototype.lastIndexOf%2CArray.prototype.map%2CArray.prototype.reduce%2CDate.prototype.toISOString%2CDocumentFragment%2CDocumentFragment.prototype.append%2CDocumentFragment.prototype.prepend%2CElement%2CElement.prototype.after%2CElement.prototype.append%2CElement.prototype.before%2CElement.prototype.classList%2CElement.prototype.cloneNode%2CElement.prototype.closest%2CElement.prototype.dataset%2CElement.prototype.matches%2CElement.prototype.placeholder%2CElement.prototype.prepend%2CElement.prototype.remove%2CElement.prototype.replaceWith%2CElement.prototype.toggleAttribute%2CEvent%2CJSON%2CMap%2CNumber.parseInt%2CNumber.parseFloat%2CObject.assign%2CObject.create%2CObject.defineProperties%2CObject.defineProperty%2CObject.entries%2CObject.getOwnPropertyDescriptor%2CObject.getOwnPropertyNames%2CObject.is%2CObject.keys%2CObject.values%2CPromise%2CPromise.prototype.finally%2CSet%2CString.prototype.trim%2CXMLHttpRequest%2Cdocument.getElementsByClassName%2Cdocument.currentScript%2Cdocument.querySelector%2Cfetch%2CgetComputedStyle%2ClocalStorage%2CArray.prototype.some%2CDate.now%2CEvent.focusin%2CEventSource%2CFunction.prototype.bind%2CFunction.prototype.name%2CHTMLDocument%2CNodeList.prototype.forEach%2CNodeList.prototype.%40%40iterator%2CNode.prototype.contains%2CObject.getPrototypeOf%2CObject.setPrototypeOf%2CRegExp.prototype.flags%2CString.prototype.%40%40iterator%2CString.prototype.startsWith%2Cconsole%2Cconsole.debug%2Cconsole.error%2Cconsole.info%2Cconsole.log%2Cdocument%2Cdocument.head%2Cdocument.visibilityState%2Clocation.origin%2CrequestIdleCallback%2Cscreen.orientation%2CmatchMedia%2CURL",
            crossOrigin: true,
            dataType: 'script',
            cache: true,
            ifModified: true,
            async: false,
            success: function () {
                 deferredResources.resolve();
            },
            error: function (responce) {
                deferredResources.resolve();
            }
        }

        $.ajax(ajaxSettings);
        return deferredResources.promise();

    }

    function GenerateGuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
    }

    // --- PUBLIC ---

    return {
        init: init,
        GetVersionInfo: getVersionInfo
    };
}(jQuery);
