JSBaker-Uglify
==============

JSBaker implementation using the UglifyJS parser instead of Esprima. Work in Progress!


INSTRUCTIONS:

1) FetchLibrary.js fetches all scripts specified in library\_list.txt using NPM. Traverses the directory tree to identify the corresponding js file for each package and stores them in the Fetched\_libraries directory.

2) ParseLibrary.js parses the extracted source files in Fetched\_Libraries directory to extract API information and stores them as a JSON.

NOTES:

1) Walker returns true for a non-recursive traversal(Only top-level), return false to recurse.

2) ...
