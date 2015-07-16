import Ember from 'ember';

export default Ember.Controller.extend({
    

    clustersSorted: function() {
        var array = this.get('model.hotTopicsResult.clusters');
        if (!array)
            return;
        var sortedArray;
        if(this.get('model.hotTopicConfig.defaultSortBy') === 'volume'){
            sortedArray = array.sortBy('volume').reverse();
            return sortedArray;
        }else if(this.get('model.hotTopicConfig.defaultSortBy') === 'trend'){
            sortedArray = array.sortBy('trend').reverse();
            return sortedArray;
        }else {
            sortedArray = array.sortBy('sentiment').reverse();
            return sortedArray;
        }
    }.property('this.model.hotTopicConfig.defaultSortBy'),

    actions :{
        close: function() {
            window._amdBridge.hide();
        }
    }
});
