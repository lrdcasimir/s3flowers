global.document= window.document;
global.navigator= window.navigator;

var React = require('react/addons');
var Promise = require('promise');
var PortfolioImage = require('../build/components').PortfolioImage;
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var fs = require('fs');
var im = require('imagemagick');
var knox = require('knox');
var client = knox.createClient(require('../../s3config.json'));

var handleAddFile = function(textInput, fileInput,e){
  return new Promise(function(resolve, reject){
    if(fileInput.files.length > 0){
      var name = fileInput.files[0].name;
      var srcPath = fileInput.files[0].path;
      var destPath = 'static/images/'+name;
      var destStream = fs.createWriteStream(destPath);
      var srcStream = fs.createReadStream(srcPath);
      var caption = textInput.value && textInput.value.length > 0 ? textInput.value : "No caption yet";
      srcStream.pipe(destStream);
      srcStream.on('end', function(){
        resizeImage(destPath)
        .then(updateDict.bind(null,textInput.value))
        .then(function(paths){
          resolve( {url: paths.path, thumbnailPath: paths.thumbnailPath, caption: caption});
        });
      });
    }
  });
};

var publishS3File = function(dirpath, file){
  return new Promise(function(resolve,reject){
    fs.stat(dirpath + file, function(e, stat){
      if(e){
        reject(e);
      } else {
        var readStream = fs.createReadStream(dirpath + file);
        var mimeType = file.indexOf('JPG') > 0 || file.indexOf('jpg') > 0 ? 'image/jpeg' : 'text/json';
        var headers = {
          'Content-Type' : mimeType,
          'Content-Length' : stat.size,
          'x-amz-acl' : 'public-read'
        };
        client.putStream(readStream, dirpath + file, headers, function(err, res){
          if(err){
            reject(err);
          } else {
            resolve(res);
          }
        });
      }
    });
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

var updateDict = function(caption, paths, remove){
    remove = remove || false;
    return new Promise(function(resolve,reject){
      fs.readFile('static/images/dict.json', function(e,dict){
        if(e){
          console.log(e);
        } else {
          try {
            var imgs = JSON.parse(dict.toString());
            if(remove){
              delete(imgs[paths.path]);
            } else {
              imgs[paths.path] = {
                "caption": caption,
                "thumbnailPath" : paths.thumbnailPath
              };
            }

            var dictStream = fs.createWriteStream('static/images/dict.json');
            dictStream.end(JSON.stringify(imgs), function(e){
              resolve(paths);
            });
          } catch (err){
            console.log(err);
            console.log("Problem parsing image dictionary");
          }
        }
      })
    });

}


var PortfolioImageList = React.createClass({
  getInitialState : function (){
    this.displayImgDict()
    return {
      images : [],
      publishStatus : ""
    };
  },
  render: function(){
    var self = this;
    return (
        <div className="pflist-container">
          <div className="new-image-container">
              <div className="new-image" onClick={this.handleClick}></div>
          </div>
          <div>
            {this.state.publishStatus}
          </div>
          <button onClick={this.handlePublish}>Publish!</button>
          <input style={{display: "none"}} type="file" ref="pic" onChange={this.handleFile}/>
          <div ref="status"></div>
          <div className="portfolio-image-list">
            <ReactCSSTransitionGroup transitionName="portfolio-image-animation">
              {this.state.images.map( function(i){
                  return <PortfolioImage
                    handleRemove={self.handleRemove}
                    handleChange={self.handleChange}
                    key={i.url}
                    src={i.url}
                    thumbnail={i.thumbnailPath}
                    caption={i.caption || "No caption yet"} />

                })
              }
            </ReactCSSTransitionGroup>


          </div>
        </div>
      );
  },
  displayImgDict : function (){
   var self = this;
   fs.stat('static/images/dict.json', function(e, stat){
      if(e){
        //create json dict
        var dictStream = fs.createWriteStream('static/images/dict.json');
        dictStream.end(JSON.stringify({}));
      } else {
        fs.readFile('static/images/dict.json', function(e,dict){
           if(e){
               console.log(e);
           } else {
             var imgs = JSON.parse(dict.toString());
             var components = Object.keys(imgs).map(function(k){
               return { url: k, caption: imgs[k].caption, thumbnailPath: imgs[k].thumbnailPath};
             });
             self.setState({images: components, publishStatus: self.state.publishStatus});

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
      "Caption me!",
      React.findDOMNode(this.refs.pic),
      e).then(function(newPic){
      self.setState({images: self.state.images.concat([newPic]), publishStatus: "Changes unpublished."});
    },function(reason){

    });
  },
  handleChange: function(caption, paths){
    //update our state optimistically,
    //first mapping our old state to our new state
    var nextImages = this.state.images.map(function(i){
      if(i.url === paths.path){
        return {
          url : i.url,
          thumbnailPath: i.thumbnailPath,
          caption: caption
        };
      }
      return i;
    });
    this.setState({images: nextImages, publishStatus:"Changes unpublished."});
    //then update the json dict
    updateDict(caption, paths);
  },
  handlePublish: function(){
    var self = this;
    fs.readdir('static/images/',function(e, files){
      var pushed = 0;
      var failed = 0;
      if(e){
        console.log(e);
      } else {
        files.forEach(function(file){

          publishS3File('static/images/', file)
          .then(function(res){
            console.log(JSON.stringify(res.statusCode));
            console.log("pushed " + pushed , failed, files.length) -7;
            pushed++;
            self.setState({images: self.state.images , publishStatus: pushed + ' images published'});
            if((pushed + failed) == files.length){
              console.log('finished');
              self.setState({images: self.state.images, publishStatus: "Published!"});
            } else {

            }
          }, function(e){
            console.log(e);
            failed++;
            self.setState({images: self.state.images, publishStatus: pushed + ' images published, ' + failed + ' images failed'});
            if((pushed + failed) == files.length){
              console.log('finished');
              self.setState({images: self.state.images, publishStatus:"Published!"});
            } else {
            }
          });
        });
      }
    });
  },
  handleRemove: function(paths){
    var nextImages = this.state.images.filter(function(i){
      return i.url !== paths.path;
    });
    fs.unlink(paths.path);
    fs.unlink(paths.thumbnailPath);
    this.setState({images: nextImages, publishStatus: "Unpublished changes."});
    updateDict("",paths, true);
  }
});

module.exports.PortfolioImageList = PortfolioImageList;
