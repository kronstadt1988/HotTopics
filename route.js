import Ember from 'ember';

export default Ember.Route.extend({

    model: function(params) {
        var self = this;

        var config = self.store.findQuery('hot-topic-config', {
            touchpointId: params.pTouchpointId
        });
        var localeConfig = self.store.find('hot-topic-locale');
        var hotTopicsResultPayload = config
            .then(function(results) {
                return localeConfig.then(function(localeResults){
                    var localeId;
                    if(sessionStorage.getItem('localeIdLoaded')){
                        localeId = sessionStorage.getItem('localeIdLoaded');
                    }else{
                        localeId = localeResults.get('firstObject').get('icon');
                    }
                    return self.store.findQuery('hot-topics-result', {
                        touchpointId: params.pTouchpointId,
                        periodType: results.get('firstObject').get('defaultPeriod'),
                        localeId : localeId
                    });
                });
            }); 

        var hotTopicVerbatimPayload = hotTopicsResultPayload.then(function (results) {
            var verbatimIds = [];
            var sortByType = config.get('firstObject').get('defaultSortBy');
            if (results.get('firstObject') !== undefined) {
                if (sessionStorage.getItem('verbatimIdsFromLoadVerbatims')) {
                    verbatimIds = sessionStorage.getItem('verbatimIdsFromLoadVerbatims').split(',');
                    sessionStorage.removeItem('verbatimIdsFromLoadVerbatims');
                } else {
                    var arraySelectVerbatimsByDefault = results.get('firstObject').get('clusters');
                    arraySelectVerbatimsByDefault = arraySelectVerbatimsByDefault.sortBy(sortByType).reverse();
                    verbatimIds = arraySelectVerbatimsByDefault.get('firstObject').get('verbatimIds');
                }
            }
            if(verbatimIds.length!==0){
                return $.ajax({
                    url : '/arke/rest/analytics/hotTopicVerbatims',
                    data : {'verbatimIds[]' : verbatimIds},
                    method: 'POST',
                    headers : {
                        'Accept' : 'application/json' 
                    },
                    success : function(data){
                        return data;
                    }   
                });
            }
        });      

        return new Ember.RSVP.hash({
            hotTopicConfig: config
                .then(function(results) {
                    return results.get('firstObject');
                }),
            hotTopicLocale : localeConfig,
            
            hotTopicSortByType: self.store.find('hot-topic-sort-by-type'),

            hotTopicsResult: hotTopicsResultPayload
                        .then(function(results) {
                            return results.get('firstObject');
                        }),
            hotTopicVerbatim : config
                .then(function(results) {
                    var periodType;
                    if(sessionStorage.getItem('periodType')){
                        periodType = sessionStorage.getItem('periodType');
                        sessionStorage.removeItem('periodType');
                    }else{
                        periodType = results.get('firstObject').get('defaultPeriod');
                    }
                    return hotTopicsResultPayload
                        .then(function(results) {
                            if (results.get('firstObject') !== undefined) {
                                return hotTopicVerbatimPayload.then(function(data){
                                    return self.store.push('hot-topic-verbatim', {
                                        id : 0,
                                        totalVerbatims : data.hotTopicVerbatim[0].totalVerbatims,
                                        verbatims : data.hotTopicVerbatim[0].verbatims
                                    });
                                });
                            } 
                        });
                }),
            touchpointId: params.pTouchpointId
        });
    },

    setupController : function(controller, model){
        if(model.hotTopicsResult !== undefined){
            if(sessionStorage.getItem('firstLoad')=='true'){
                sessionStorage.removeItem('firstLoad');
            }else{
                model.hotTopicsResult.get('clusters').sortBy(model.hotTopicConfig.get('defaultSortBy')).reverse().get('firstObject').set('active', true);
                var defaultClusterName =  model.hotTopicsResult.get('clusters').get('firstObject').get('labels');
                model.hotTopicVerbatim.set('clusterName', defaultClusterName );
            }

            if(sessionStorage.getItem('localeIdLoaded')){
                model.hotTopicConfig.set('localeId', sessionStorage.getItem('localeIdLoaded'));
                model.hotTopicConfig.set('localeText', sessionStorage.getItem('localeTextLoaded'));
                sessionStorage.removeItem('localeIdLoaded');
                sessionStorage.removeItem('localeTextLoaded');
            }else{
                model.hotTopicConfig.set('localeId', model.hotTopicLocale.get('firstObject').get('icon'));
                model.hotTopicConfig.set('localeText', model.hotTopicLocale.get('firstObject').get('icontooltip'));
            }
        }                        
        this.controllerFor('hot-topics').set('model', model);  
    },

    actions: {
        changePeriodStatus: function(newPeriodStatus) {
            if(this.controller.get('model.hotTopicConfig.defaultPeriod')!==null){
                this.controller.set('model.hotTopicConfig.defaultPeriod', newPeriodStatus);
            }
            if(this.controller.get('model.hotTopicsResult.clusters')!==undefined){
                    this.controller.get('model.hotTopicsResult.clusters').forEach(function (cluster) {
                    cluster.set('active', false);
                });
            }
            sessionStorage.setItem('periodType',newPeriodStatus);
            this.refresh();
        },
        loadVerbatims : function(cluster){
            sessionStorage.setItem('verbatimIdsFromLoadVerbatims', cluster.get('verbatimIds'));
            this.controller.get('model.hotTopicVerbatim').set('clusterName', cluster.get('displayName'));

            this.controller.get('model.hotTopicsResult.clusters').forEach(function (cluster) {
                cluster.set('active', false);
            });
            cluster.set('active', true);
            sessionStorage.setItem('firstLoad', true);

            this.refresh();
        },
        changeLocaleStatus : function(localeId, localeText){
            sessionStorage.setItem('localeIdLoaded', localeId);
            sessionStorage.setItem('localeTextLoaded', localeText);
            this.refresh();
        }
    }
});
