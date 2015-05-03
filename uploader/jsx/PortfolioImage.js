global.document= window.document
global.navigator= window.navigator
var React = require('react');

var PortfolioImage = React.createClass({
   propTypes : {
       src: React.PropTypes.string.isRequired,
       caption: React.PropTypes.string.isRequired
   },
    render: function(){
        return (
            <div className="portfolio-image">
                <div className="remove-indicator"></div>
                <img src={"../"+this.props.src} title={this.props.caption} />
            </div>
        )
    }
});

module.exports.PortfolioImage = PortfolioImage;
