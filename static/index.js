const annoview = Vue.component('annoview', {
  template: `<div>
  <div class="manifestimages">
    <div v-for="manifest in existing['manifests']">
      <a v-on:click="getManifest(manifest)">{{manifest}}</a>
    </div>
    <div v-for="image in existing['images']">
      <a v-on:click="inputurl = image; currentmanifest='';loadAnno()">{{image}}</a>
    </div>
  </div>
  <div>
    <label>Manifest</label>
    <input v-on:change="getManifest(currentmanifest)" v-model="currentmanifest"></input>
    <button v-on:click="showManThumbs = !showManThumbs" v-if="currentmanifest">
      <span v-if="showManThumbs">Hide</span><span v-else>Show</span> Manifest Thumbnails
    </button>
  </div>
  <div class="manifestthumbs" v-show="showManThumbs && currentmanifest">
    <div v-if="manifestdata.length == 0">Loading...</div>
    <div v-else v-for="item in manifestdata" style="display: inline-block;">
      <div v-on:click="manifestLoad(item)">
        <img :src="item['image']" style="max-width:100px;padding:5px;">
      </div>
    </div>
  </div>
  <div>
    <label>Image URL</label>
    <input v-on:change="currentmanifest = '';loadAnno()" v-model="inputurl"></input>
  </div>
  <div class="drawingtools" v-if="anno">
    <label for="current-tool">Current Annotation drawing shape: </label>
    <div id="current-tool" v-for="drawtool in drawtools" v-on:change="updateDrawTool()">
      <label class="toolbutton" v-bind:for="drawtool.name">
        <input type="radio" v-bind:id="drawtool.name" v-bind:name="drawtool.name" v-bind:value="drawtool.name" v-model="currentdrawtool">
        <span>{{drawtool.label}}</span></label>
    </div>
  </div>
  <div v-for="item in alltiles" v-if="alltiles.length > 1">
    <input type="checkbox" class="tagscheck" v-on:click="setOpacity(item)" v-model="item.checked">
    <span v-html="item.label"></span>
    <div class="slidecontainer">Opacity: <input v-on:change="setOpacity(item, $event)" type="range" min="0" max="100" v-bind:value="item.opacity*100" class="slider"></div>
    <img :src="item['thumbnail']" style="max-width:100px;padding:5px;">
  </div>
  <div id="openseadragon1"></div>
  </div>
  `,
  props: {
    'existing': Object,
    'filepaths': Object,
    'userinfo': Object,
    'tags': Array
  },
  data: function() {
  	return {
      inputurl: '',
      drawtools: [{'name': 'rect', 'label':'Rectangle'},{'name': 'polygon', 'label':'Polygon'}],
      currentdrawtool: 'rect',
      anno: '',
      viewer: '',
      manifestdata: '',
      currentmanifest: '',
      showManThumbs: true,
      canvas: '',
      alltiles: []
  	}
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    const manifesturl = params.get('manifesturl');
    const imageurl = params.get('imageurl');
    if (manifesturl){
      this.currentmanifest = manifesturl;
      this.getManifest(manifesturl, params.get('canvas'));
    }
    if (imageurl) {
      this.inputurl = imageurl;
      this.loadAnno();
    }
  },
  methods: {
    manifestLoad: function(item) {
      this.canvas = item['canvas'];
      this.inputurl = item['tiles'][0]['id'];
      this.alltiles = item['tiles'];
      this.loadAnno()
      this.showManThumbs = false;
    },
    loadAnno: function() {
      document.getElementById('openseadragon1').innerHTML = '';
      var tilesources = [this.inputurl]
      if (this.inputurl.indexOf('.jpg') > 1) {
        tilesources = {
            type: "image",
            url: this.inputurl
        }
      }
      var viewer = OpenSeadragon({
        id: "openseadragon1",
        prefixUrl: "/assets/openseadragon/images/",
        tileSources: tilesources
      });
      this.viewer = viewer;
      var vue = this;
      for (var k=1; k<this.alltiles.length; k++){
        this.setLayers(this.alltiles[k], k, viewer)
      } 

      var id = this.inputurl;
      //localStorage.setItem('')
      // Initialize the Annotorious plugin
      var existing = this.currentmanifest ? this.filepaths[this.canvas] : this.filepaths[this.inputurl];
      this.anno = OpenSeadragon.Annotorious(viewer, 
        { image: 'openseadragon1',
          widgets: [ 
                    {widget: 'COMMENT', editable: 'MINE_ONLY', purposeSelector: true},
                    {widget: 'TAG', vocabulary: vue.tags}
                  ]});
    // Load annotations in W3C WebAnnotation format
      if (existing){
        var annotation = this.anno.setAnnotations(existing); 
      }
      this.addListeners();
      this.anno.setAuthInfo({
        id: this.userinfo["id"],
        displayName: this.userinfo["name"]
      });
    },
    setLayers: function(layer, position, viewer){
      var vue = this;
      tiledimage = viewer.addTiledImage({
        tileSource: layer['id'],
        opacity: layer['opacity'],
        success: function (obj) {
          vue.alltiles[position]['osdtile'] = obj.item;
        }
      });
    },
    getManifest: function(manifest, loadcanvas=false) {
      this.currentmanifest = manifest;
      this.showManThumbs = true;
      this.manifestdata = [];
      var vue = this;
      jQuery.ajax({
        url: manifest,
        type: "GET",
        success: function(data) {
          var images = [];
          const manifestdata = data.sequences[0].canvases;
          for (var i=0; i<manifestdata.length; i++){
            var tiles = [];
            var canvas = manifestdata[i]['id'] ? manifestdata[i]['id'] : manifestdata[i]['@id'];
            var thumb = manifestdata[i]['thumbnail'] ? manifestdata[i]['thumbnail'] : manifestdata[i]['images'][0]['resource']
            thumb = thumb['id'] ? thumb['id'] : thumb['@id'] ? thumb['@id'] : thumb;  
            const resource = manifestdata[i]['images'].map(elem => elem['resource']);
            for (var j=0; j<resource.length; j++){
              const resourceitem = resource[j];
              const thumb = resourceitem['id'] ? resourceitem['id'] : resourceitem['@id'];
              const id = resourceitem['service']['id'] ? resourceitem['service']['id'] : resourceitem['service']['@id'] + '/info.json';
              const opacity = j == 0 ? 1 : 0;
              const checked = j == 0 ? true : false;
              tiles.push({'id': id, 'label': resourceitem['label'], 
                thumbnail: thumb.replace('/full/0', '/100,/0'), 'opacity': opacity,
                'checked': checked
              })
            }
            thumb = thumb.replace('/full/0', '/100,/0')
            images.push({'image': thumb, 'canvas': canvas, 'tiles': tiles})
            if (loadcanvas == canvas) {
              vue.manifestLoad({'image': thumb, 'canvas': canvas, 'tiles': tiles})
            }
          }
          vue.manifestdata = images;
        },
        error: function(err) {
          console.log(err)
        }
      });
    },
    updateDrawTool: function() {
      this.anno.setDrawingTool(this.currentdrawtool);
    },
    addManifestAnnotation: function(annotation){
      if (this.currentmanifest){
        annotation.target['dcterms:isPartOf'] = {
          "id": this.currentmanifest,
          "type": "Manifest"
        }
        target = this.canvas;
      }
      annotation.target.source = target;
      return annotation;
    },
    addListeners: function() {
      // Attach handlers to listen to events
      var vue = this;
      this.anno.on('createAnnotation', function(annotation) {
        var target = vue.inputurl;
        var annotation = vue.addManifestAnnotation(annotation);
        var senddata = {'json': annotation }
        vue.write_annotation(senddata, 'create', annotation)
      });
    
      this.anno.on('updateAnnotation', function(annotation) {
        var annotation = vue.addManifestAnnotation(annotation);
        var senddata = {'json': annotation,'id': annotation['id'], 'order': annotation['order']}
        vue.write_annotation(senddata, 'update')
      });

      this.anno.on('deleteAnnotation', function(annotation) {
        var senddata = {'id': annotation['id'] }
        vue.write_annotation(senddata, 'delete')
      });
    },
    write_annotation: function(senddata, method, annotation=false) {
      jQuery.ajax({
        url: `/${method}_annotations/`,
        type: "POST",
        dataType: "json",
        data: JSON.stringify(senddata),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (annotation) {
            annotation['id'] = data['id']
            annotation['order'] = data['order'];
          }
        },
        error: function(err) {
          console.log(err)
        }
      });
    } 
  }
})

var app = new Vue({
  el: '#app'
})