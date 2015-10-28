// Used to turn static MDT config into runnable/usable code on both client and server.

// Build compiler class
function MdtCompiler() {}

MdtCompiler.prototype.processFilesForTarget = function(files) {
  files.forEach(function(file) {
    var arch = file.getArch() // web.browser, os.osx.x86_64
    var contents = file.getContentsAsString()
    // TODO: Strip sensitive config for web. Do in /config handler?
    var output = 'mdt = new MDT(' + contents + ');'
    file.addJavaScript({data: output, path: 'mdt-config.js'})
    // Maybe rendering would use this later.
    // file.addHtml()
  })
}

// Register compiler
Plugin.registerCompiler({
  extensions: [],
  filenames: ["mdt.json"]
}, function () {
  return new MdtCompiler()
})
