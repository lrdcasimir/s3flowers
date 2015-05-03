var bg = require('blueimp-gallery');
var http = require('http');


var options = {
    container: '#blueimp-gallery',
    indicatorContainer: 'ol',
    // The class for the active indicator:
    activeIndicatorClass: 'active',
    // The list object property (or data attribute) with the thumbnail URL,
    // used as alternative to a thumbnail child element:
    thumbnailProperty: 'thumbnail',
    // Defines if the gallery indicators should display a thumbnail:
    thumbnailIndicators: true,
    fullScreen :false

};
var pathPrefix = window.location.pathname.split('/').slice(0,-1).join('/');

http.get(  pathPrefix + '/static/images/dict.json', function(res){
  var dictBuffer = new Buffer(parseInt(res.getHeader('Content-Length'), 10));
  var lastLength = 0;
  res.on('data', function(data){
    dictBuffer.write(data, lastLength);
    lastLength = data.length
  });
  res.on('end', function(){
    var dict = JSON.parse(dictBuffer.toString());
    var galleryData = Object.keys(dict).map(function(key){
      var caption = dict[key].caption;
      var thumbnail = dict[key].thumbnailPath;
      var href = key;
      return {
        "title" : caption,
        "href" : href,
        "thumbnail" : thumbnail,
        "type": "image/jpeg"
      };
    });
    var linksContainer = document.querySelector('#links');
    var gallery = bg(galleryData, options);

    galleryData.forEach(function(gdo){
      var link = document.createElement('a');
      var thumb = document.createElement('img');
      thumb.setAttribute('src', gdo.thumbnail);
      thumb.setAttribute('title', gdo.title);
      link.appendChild(thumb);
      link.setAttribute('href', gdo.href);
      link.onclick = function(event){
        event = event || window.event;
        var target = event.target || event.srcElement,
        link = target.src ? target.parentNode : target,
        options = {index: link , event: event};

        bg(document.querySelectorAll("#links a"), options);
        event.preventDefault();
        return false;
      };
      linksContainer.appendChild(link);
    });

  });
});



