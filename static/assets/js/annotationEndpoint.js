(function($) {
  $.LocalAnnotationEndpoint = function(options) {
  	jQuery.extend(
      this,
      {
        token: null,
        uri: null,
        url: options.url,
        dfd: null,
        annotationsList: [],
        idMapper: {}
      },
      options
    );
    this.init();
  };

  $.LocalAnnotationEndpoint.prototype = {
    init: function() {
      // NOP
    },

    search: function(options) { 
    	var _this = this;
      _this.uri = options.uri;
    	_this.annotationsList = [];
    	for (var key in this.allannotations){
        if (options['uri'] === key) {
    	  var resources = this.allannotations[key];
	      resources.forEach(function(a) {
	          a.endpoint = _this;
	       });
    	  _this.annotationsList = resources;
    	}
    }
      _this.dfd.resolve(false);
    },

    deleteAnnotation: function(annotationID, returnSuccess, returnError) {
      split = annotationID.split("/");
      ID = split[split.length - 1];
      jQuery.ajax({
        url: this.server + 'delete_annotations/',
        type: "DELETE",
        contentType: 'application/json',
        data: JSON.stringify({'id':ID, 'listuri': this.uri}),
        dataType: "json",
        success: function(data) {
          returnSuccess();
        },
        error: function($xhr,textStatus,errorThrown) {
          alert('Problem deleting annotation')
          console.log($xhr.responseText)
        }
      });
    },

    update: function(annotation, returnSuccess, returnError) {
      var _this = this;
      var updated = new Date().toISOString();
      delete annotation.endpoint;
      annotation['oa:serializedAt'] = updated;
      var senddata = {'json': annotation}
      jQuery.ajax({
        url: _this.server + 'update_annotations/',
        type: "POST",
        dataType: "json",
        data: JSON.stringify(senddata),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          data.endpoint = _this;
          returnSuccess(data);
        },
        error: function($xhr,textStatus,errorThrown) {
          alert('Problem updating annotation')
          console.log($xhr.responseText)
        }
      });
      annotation.endpoint = this;
    },

    create: function(annotation, returnSuccess, returnError) {
      var _this = this;
      var created = new Date().toISOString();
      annotation['oa:annotatedAt'] = created;
      var senddata = {'json': annotation}
      jQuery.ajax({
        url: this.server + 'create_annotations/',
        type: "POST",
        dataType: "json",
        data: JSON.stringify(senddata),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          data.endpoint = _this;
          returnSuccess(data);
        },
        error: function($xhr,textStatus,errorThrown) {
          alert('Problem creating annotation')
          console.log($xhr.responseText)
        }
      });
    },

    set: function(prop, value, options) {
      if (options) {
        this[options.parent][prop] = value;
      } else {
        this[prop] = value;
      }
    },
    userAuthorize: function(action, annotation) {
      return true; // allow all
    }
  };
})(Mirador);
