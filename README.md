# Liverpool 2016 Sprint

## Tools needed

### 1. Node.JS
Download the LTS version from [here](https://nodejs.org/en/). It comes bundled with it's package manager "npm".
### 2. Grunt.JS
Get the task runner's CLI from [here](http://gruntjs.com/getting-started). Basically you have to run the following
command as Administrator in Linux/OSX:
```
sudo npm install -g grunt-cli
```
### 3. Bower.JS
The package manager can be installed by following the [instructions](http://bower.io/), you just need to run:
```
npm install -g bower
```

## Getting the project
Simply checkout the project on your machine and afterwards you need to follow these steps to download all of the
dependencies:
1. change directory to the root of the checked-out git project
1. dependencies for the task runner will be downloaded in the directory `node_modules` - **run**:   `npm install`
1. project dependencies are downloaded in the `vendor` directory - **run**: `bower install`
1. build the project - **run**: `grunt default`

## Running the project locally
Grunt will run a small HTTP server serving the project files on the port 9000. For this you have to start it up using:
```
grunt watch
```
After a short period you'll see:
```
Running "express-server:devServer" (express-server) task
Web server started on port:9000, hostname: localhost [pid: 46492]
Running "delta" task
Waiting...
```
At this point you can navigate with your browser to [http://localhost:9000/](http://localhost:9000/)

The *watch* task has Live Reloading enabled, so all your changes in the projects source files will be automatically
visible in the browser if you install the [Live Reload plugin](http://livereload.com/extensions/).