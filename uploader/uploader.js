global.document = window.document;
global.navigator = window.navigator;
//require('nw.gui').Window.get().showDevTools();

var React = require('react');
var PortfolioImage = require('./build/components').PortfolioImage;
var PortfolioImageList = require('./build/components').PortfolioImageList;




React.render(<PortfolioImageList />, document.querySelector("#main"))
