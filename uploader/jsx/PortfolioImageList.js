global.document= window.document;
global.navigator= window.navigator;

var React = require('react');
var Promise = require('promise');
var PortfolioImage = require('../build/components').PortfolioImage;
var fs = require('fs');
var im = require('imagemagick');

var handleAddFile = function(textInput, fileInput,e){
  return new Promise(function(resolve, reject){
    if(fileInput.files.length > 0){
      var name = fileInput.files[0].name;
      var srcPath = fileInput.files[0].path;
      var destPath = 'static/images/'+name;
      var destStream = fs.createWriteStream(destPath);
      var srcStream = fs.createReadStream(srcPath);
      srcStream.pipe(destStream);
      srcStream.on('end', function(){
        resizeImage(destPath)
        .then(updateDict.bind(null,textInput.value))
        .then(function(paths){
          resolve( {url: paths.path, thumbnailPath: paths.thumbnailPath, caption: textInput.value});
        });
      });
    }
  });
};

var resizeImage = function(destPath) {
  return new Promise(function(resolve,reject){
    //thumbnail
    var fileParts = destPath.split('.');
    var extension = fileParts.pop();
    var thumbnailPath = fileParts.concat(['thumbnail', extension]).join('.');
    var srcPath = fileParts.concat([extension]).join('.');
    var fiveHundredPath = fileParts.concat(['500', extension]).join('.');
    var imagesPending = 2;
    im.resize({
      width : 256,
      srcPath : srcPath,
      dstPath : thumbnailPath
    }, function(e){
      if(e) {
        reject(e);
      } else if(--imagesPending == 0) {
        resolve({path: fiveHundredPath, thumbnailPath: thumbnailPath});
      }
    });
    im.resize({
      width : 800,
      srcPath: srcPath,
      dstPath: fiveHundredPath
    }, function(e){
      if(e){
        reject(e);
      } else if(--imagesPending == 0){
        resolve({path: fiveHundredPath, thumbnailPath: thumbnailPath});
      }
    });
  });
}

var updateDict = function(caption, paths){
    return new Promise(function(resolve,reject){
      fs.readFile('static/images/dict.json', function(e,dict){
        if(e){
          alert("no dict");
        } else {
          try {
            var imgs = JSON.parse(dict);
            imgs[paths.path] = {
              "caption": caption,
              "thumbnailPath" : paths.thumbnailPath
            };
            var dictStream = fs.createWriteStream('static/images/dict.json');
            dictStream.end(JSON.stringify(imgs), function(e){
              resolve(paths);
            });
          } catch (err){
            console.log(err);
            alert("Problem parsing image dictionary");
          }
        }
      })
    });

}


var PortfolioImageList = React.createClass({
  getInitialState : function (){
    this.displayImgDict()
    return {
      images : []
    };
  },
  render: function(){
    return (
        <div className="pflist-container">
          <div className="new-image-container">
              <div className="new-image" onClick={this.handleClick}></div>
          </div>
          <input type="text" ref="caption"></input>
          <input style={{display: "none"}} type="file" ref="pic" onChange={this.handleFile}/>
          <div ref="status"></div>
          <div className="portfolio-image-list">
            {this.state.images.map( function(i) {
                return <PortfolioImage
                  key={i.url}
                  src={i.url}
                  caption={i.caption} />

              })
            }
          </div>
        </div>
      );
  },
  displayImgDict : function (){
   fs.stat('static/images/dict.json', function(e, stat){
      if(e){
        //create json dict
        var dictStream = fs.createWriteStream('static/images/dict.json');
        dictStream.end(JSON.stringify({}));
      } else {
        fs.readFile('static/images/dict.json', function(e,dict){
           if(e){
               alert("no dict");
           } else {
               try {
                   var imgs = JSON.parse(dict);
                   var components = Object.keys(imgs).map(function(k){
                     return { url: k, caption: imgs[k].caption };
                   });
                   this.setState({images: components});

               } catch (err){
                   console.log(err);
               }
           }
        });
      }
    });
  },
  handleClick : function(e) {
    React.findDOMNode(this.refs.pic).click();
  },
  handleFile: function(e){
    var self = this;
    handleAddFile(
      React.findDOMNode(this.refs.caption),
      React.findDOMNode(this.refs.pic),
      e).then(function(newPic){
      self.setState({images: self.state.images.concat([newPic])});
    },function(reason){

    });
  }
});

module.exports.PortfolioImageList = PortfolioImageList;
