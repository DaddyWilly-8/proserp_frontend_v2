// Turbopack alias target: @react-pdf/renderer's PDFViewer pulls in pdfjs-dist,
// which tries to resolve the native 'canvas' package for server-side rendering.
// It's never actually used in the browser, but Turbopack (unlike webpack) doesn't
// silently ignore unresolvable optional deps, so it must be aliased to a stub.
module.exports = {};
