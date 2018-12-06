# Chrome Extension
The coveo-implementation-checker extension allows you validate your Coveo implementation.


## Installation
You can load it manually in your browser from the extension page. (chrome://extensions/)

## Build extension package

Bash command to build the package for the Chrome Web Store:
> `zip -r9 coveo_implementation_checker_v$(node -p -e "require('./manifest.json').version").zip manifest.json popup.html css dependencies images js`

## Usage

TBD

## Dependencies
Google Chrome or Chromium

