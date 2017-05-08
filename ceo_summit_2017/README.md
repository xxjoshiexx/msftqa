## Installation

You need NodeJS and npm allready installed on your system. If you need help have a look at [https://nodejs.org/](https://nodejs.org/)

Clone this repo and install als dependencies with this command:

```
npm install
```

After that execute `gulp serve`, point your browser to http://localhost:3003 and start adding and editing files in `src`.

## Gulp Tasks

* `npm start` - starts Browsersync via `gulp serve` and serves your app for testing in different browsers (default: http://localhost:3000, Browsersync-UI at http://localhost:3001), after changes on SCSS files and JS files in `src` or HTML files in `public` the page is automatically refreshed
* `gulp styles` - compiles your SASS files and copies the result CSS file to `public/css`
* `gulp scripts` - transpiles your ES6 scriptfiles in `src/js`, creates a package with all imported files as `app.js` in `public/js`
* `npm run build` - Runs the styles and scripts commands in production mode.

Add `--production` to any gulp task to activate production mode. In production mode all code will be minified and no sourcemaps are written.
