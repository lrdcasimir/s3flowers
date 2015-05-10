global.document= window.document
global.navigator= window.navigator
var React = require('react');



var PortfolioImage = React.createClass({
   getInitialState : function(){
     return  {
       updating: false
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

                <img  src={"../"+this.props.src} title={this.props.caption} />
            </div>
        )
    }
});

module.exports.PortfolioImage = PortfolioImage;
