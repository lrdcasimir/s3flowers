global.document= window.document
global.navigator= window.navigator
var React = require('react');
var im = require('imagemagick');


var PortfolioImage = React.createClass({
   getInitialState : function(){
     return  {
       updating: false,
       src: this.props.src,
       thumbnail: this.props.thumbnail
     };
   },
   handleCaptionClick : function(e){
     this.setState({updating:true});
   },
   handleSaveClick: function(e){
     this.props.handleChange(React.findDOMNode(this.refs.caption).value,
                           {path: this.props.src, thumbnailPath: this.props.thumbnail});
     this.setState({updating: false});
   },
   handleRemove: function(e){
     this.props.handleRemove({path: this.props.src, thumbnailPath: this.props.thumbnail});
   },
   handleRotate: function(e){
     var self = this;
     im.identify(self.props.src, function(err, features){
       //pick rotation operator
       im.convert([self.props.src, '-rotate', '-90', self.props.src], function(e,stdout,stderr){
         console.log(stdout);
         console.log(stderr);
         self.setState({src: self.state.src + "#"+  Date.now(), updating: false});
       });
     });
   },
   propTypes : {
       handleRemove : React.PropTypes.func.isRequired,
       handleChange : React.PropTypes.func.isRequired,
       src: React.PropTypes.string.isRequired,
       caption: React.PropTypes.string.isRequired,
       thumbnail: React.PropTypes.string.isRequired
   },
    render: function(){
        return (
            <div className="portfolio-image">
                <div className="remove-indicator" onClick={this.handleRemove}></div>

                {this.state.updating ? <p><input ref="caption" type="text" defaultValue={this.props.caption}></input>
                    <button onClick={this.handleSaveClick}>Save caption</button></p> : '' }

                {!this.state.updating ? <p className="caption" onClick={this.handleCaptionClick}>{this.props.caption}</p> : ''}

                <img src={"../"+this.state.src} title={this.props.caption} />
                <button onClick={this.handleRotate}>Rotate 90°</button>
            </div>
        )
    }
});

module.exports.PortfolioImage = PortfolioImage;
