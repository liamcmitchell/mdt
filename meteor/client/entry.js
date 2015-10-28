import Meteor from "meteor";
import React from "react";
import App from "components/app";

Meteor.startup(function () {  
  React.render(<App />, document.getElementById("render-target"));
});

// Disable history.back on backspace, noone needs that.
document.addEventListener("keydown", function(e) {
  if (e.keyCode === 8 && !e.target.nodeName.toLowerCase().match(/input|textarea/)) {
    e.preventDefault();
  }
});
