JSBaker-Uglify
==============

JSBaker implementation using the UglifyJS parser instead of Esprima. Work in Progress!


INSTRUCTIONS:

1) To fetch the JavaScript source for any JavaScript library:

- Install Node.js and Node Package Manager(npm).
- Install execSync using npm
	npm install execSync
- In the library\_fetch directory, create two directories named Fetched\_Libraries and node\_modules.
- Run FetchLibraries.js

(FetchLibrary.js fetches all scripts specified in library\_list.txt using NPM. Traverses the directory tree to identify the corresponding js file for each package and stores them in the Fetched\_libraries directory.)

2) ParseLibrary.js parses the extracted source files in Fetched\_Libraries directory to extract API information and stores them as a JSON.


RANDOM NOTES:

1) Walker returns true for a non-recursive traversal(Only top-level), return false to recurse.

2) ...



Libraries in the top 100 for which source was not found:

(finds index.js but seems empty)
- expect
- formidable
- mongoose


(can find no match )
- bower
- expresso
- node-uuid
- regarde
- shelljs
- socket.io-client
