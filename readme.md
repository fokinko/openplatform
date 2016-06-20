# OpenPlatform v1.0.0

- install node.js platform `+v4`
- download the source code
- execute `$ node debug.js`
- first time login: 123456/123456


---

## Documentation

1. What is and how the OpenPlatform works?
2. How to write an application for the OpenPlatform?
3. Server-Side communication between the OpenPlatform and the Application
4. Client-Side communication between the OpenPlatform and the Application
5. Widgets

## What is and how the OpenPlatform works?

The OpenPlatform is a simple node.js and total.js based platform that can manage the lifecycle of third party applications and provide them with basic services like users and roles management. Each application is executed in the OpenPlatform's context in an HTML `iframe`. Depending on the access rights, running applications can read lists of platform of users and applications, create notifications and communicate with other applications via service worker. Administrator has complete control over the users' and applications' access rights.

The platform supports two ways of communication:

- server-side
- client-side via small [openplatform.js](https://github.com/totaljs/openplatform/blob/master/public/v1/openplatform.js) library

![OpenPlatform workbench](https://www.totaljs.com/img/openplatform/openplatform-auth.png)

The OpenPlatform stores all users and applications data in-memory and data are stored in JSON files (when are changed).

---

### How to write an application for the OpenPlatform?

Each application must contain `openplatform.json` file that contains all the necessary information for the OpenPlatform to recognize and deploy the application, setup its roles, icon and widgets. The full URL address to `openplatform.json` is used as the application identificator in the OpenPlatform. The platform downloads the content of the file `openplatform.json` every 5 minutes.

```javascript
{
    "name": "TestApp",
    "version": "1.0.0",
    "icon": "http://openapp.totaljs.com/icon.png",

    // Author of the application
    "author": "Peter Širka",

    // Suport email
    "email": "petersirka@gmail.com",

    // Optional. The description sees only the super user of the OpenPlatform.
    "description": "Some important info for the superuser.",

    // URL which to be open when the user clicks on the application's icon
    "url": "http://openapp.totaljs.com",

    // Optional: session URL - workaround for iframes blocking in Safari. 
    // more info bellow
    "sessionurl": "http://openapp.totaljs.com/openplatform/",

    // Optional: roles used within the application. 
    "roles": ["create", "read", "update"],

    // Optional: widgets to be shown on the dashboard.
    "widgets": [
        {
            // Widget name
            "name": "Chart.js",

            // Widget generator
            "url": "http://openapp.totaljs.com/widgets/chartjs/",

            // Optional: when the user clicks on the widget the OpenPlatform
            // redirects the iFrame to this URL address. Default: application "url"
            "redirect": "",

            // Optional: widget's background color. Default: white
            "background": "white",

            // Optional: widget's font color. Default: silver
            "color": "silver",

            // Optional: size of widget "1" = 400x250, "2" = 600x250, "3" = 800x250.
            // Default: 1
            "size": 1,

            // Optional: refresh interval, default 15000 (15 seconds). A minimal value
            // can be 15000.
            "interval": 15000
        }
    ],

    // Optional: whitelist of IP addresses to be checked by the OpenPlatform for the requests originated from 
    // a server. Simple hijacking prevention
    "origin": ['10.77.50.11']
}
```

### Server-side communication between the OpenPlatform and the Application

Every request has to include following headers:

- `x-openplatform-id` __(important)__ full URL address to the application's `openplatform.json`
- `x-openplatform-user` __(important)__ user identificator (with except obtaining a session)
- `x-openplatform-secret` __(optional)__ application specific security token


#### Request to `sessionurl` (session request)

```html
http://openapp.totaljs.com/openplatform/?openplatform=http%3A%2F%2Fopenplatform.totaljs.com%2Fsession%2F%3Ftoken%3D14mp1e1r3fs9k5lrkqggewg9a1hq71~-1556735938~-684557733~1569270833
```
- workaround for iframes blocking in Safari. 
- used to obtain third party session cookie.
- the `sessionurl` should respond with a simple `plain text` response (e.g. `success`).   
- OpenPlatform makes modifications to the `sessionurl` according to the argument `openplatform`
- you should make request to the URL received in the response in argument `openplatform`

__Request__:

```html
GET http://openplatform.totaljs.com/session/?token=14mp1e1r3fs9k5lrkqggewg9a1hq71~-1556735938~-684557733~1569270833
x-openplatform-id: http://openapp.totaljs.com/openplatform.json
x-openplatform-secret: app-secret (if any)
```

__Response__:

```javascript
{
    // User ID for future requests: `x-openplatform-user`
    "id": "16061919190001xis1",
    "alias": "Peter Širka",
    "firstname": "Peter",
    "lastname": "Širka",
    "photo": "http://openplatform.totaljs.com/photos/petersirka_gmail_com.jpg",
    "email": "petersirka@gmail.com",
    "phone": "",
    "online": true,
    "blocked": false,
    "group": "Developers",
    "superadmin": true,
    "notifications": true,
    "dateupdated": "2016-06-17T19:08:32.328Z",
    "datecreated": "2016-06-16T12:03:22.434Z",
    "sounds": true,
    "language": "sk",

    // Application's settings
    "settings": "",

    // Application's roles
    "roles": [
        "create",
        "read",
        "update"
    ],

    // OpenPlatform's information
    "openplatform": {
        "version": "0.0.1",
        "name": "OpenPlatform",
        "url": "http://openplatform.totaljs.com",
        "author": "Peter Širka"
    }
}
```

#### Request to: `url` (application request)

Almost the same as `sessionurl` request with the difference that when the iframe loads `sessionurl` it is autmoatically redirected to `url` (the user doesn't see the content of the `sessionurl`). The `sessionurl` was created for the Safari browser because it comes with the third party cookies blocked by default. When Safari browser is detected, the OpenPlatform opens up a popup window with the `sessionurl` in order to create the session cookie. 

```html
http://openapp.totaljs.com/?openplatform=http%3A%2F%2Fopenplatform.totaljs.com%2Fsession%2F%3Ftoken%3D14mp1e1r3fs9k5lrkqggewg9a1hq71~-1556735938~-684557733~1569270833
```

#### API

- open API to access the platform
- no need for any session token 
- the user must have privileges for the specific operations

__Gets all registered users__:

```html
GET http://openplatform.totaljs.com/api/users/
x-openplatform-id: http://openapp.totaljs.com/openplatform.json
x-openplatform-user: 16061919190001xis1
x-openplatform-secret: app-secret (if any)
```

__Gets the user's applications__:

```html
GET http://openplatform.totaljs.com/api/applications/
x-openplatform-id: http://openapp.totaljs.com/openplatform.json
x-openplatform-user: 16061919190001xis1
x-openplatform-secret: app-secret (if any)
```

__Create a notification__:

- creates a notification for the `x-openplatform-user`
- notifications must be allowed for the user

JSON:
- `type`: optional, `0` info (default), `1` success, `2` alert
- `url`: optional, default `application URL`

```html
POST http://openplatform.totaljs.com/api/notifications/
content-type: application/json
x-openplatform-id: http://openapp.totaljs.com/openplatform.json
x-openplatform-user: 16061919190001xis1
x-openplatform-secret: app-secret (if any)

{ "type": 0, "body": "Message", "url": "Where does it to redirect application's iframe?" }
```

__Sends data via ServiceWorker__:

- can send data to other applications using `events`
- target applications must subscribe for specific `event`

JSON:
- `event`: event name (lowercase)
- `data`: object

```html
POST http://openplatform.totaljs.com/api/serviceworker/
content-type: application/json
x-openplatform-id: http://openapp.totaljs.com/openplatform.json
x-openplatform-user: 16061919190001xis1
x-openplatform-secret: app-secret (if any)

{ "event": "event name", "data": { "your": "object" }}
```

### Client-Side communication between the OpenPlatform and the Application

- client-side must use [openplatform.js](https://github.com/totaljs/openplatform/blob/master/public/v1/openplatform.js) library

The library contains following method:

```javascript

// OPENPLATFORM is global
console.log(typeof(OPENPLATFORM));

// Shows/Hides the OpenPlatform loading progress
// Method: OPENPLATFORM.loading(BOOLEAN);
OPENPLATFORM.loading(true);

// Maximizes the application's iframe
// Method: OPENPLATFORM.maximize([url]);
OPENPLATFORM.maximize();
OPENPLATFORM.maximize('http://yourapp.com/redirect/here/');

// Minimizes the application's iframe
// Method: OPENPLATFORM.minimize();
OPENPLATFORM.minimize();

// Closes the application (application instance gets killed)
// Method: OPENPLATFORM.close();
OPENPLATFORM.close();

// Restarts the application
// Method: OPENPLATFORM.restart();
OPENPLATFORM.restart();

// Opens another OpenPlatform's application (if exists)
// Method: OPENPLATFORM.open(id);
OPENPLATFORM.open('http://anotherapp.com/openplatform.json');

// Notifies the user
// Method: OPENPLATFORM.notify([type], body, [url_to_redirect]);
OPENPLATFORM.notify('You have new unread messages.');

// Gets the user profile
// Method: OPENPLATFORM.getProfile(callback(err, response));
OPENPLATFORM.getProfile(function(err, response) {
    console.log(err, response);
});

// Gets the user's applications
// Method: OPENPLATFORM.getApplications(callback(err, response));
OPENPLATFORM.getApplications(function(err, response) {
    console.log(err, response);
});

// Gets all registered users
// Method: OPENPLATFORM.getUsers(callback(err, response));
OPENPLATFORM.getUsers(function(err, response) {
    console.log(err, response);
});

// Gets info about OpenPlatform
// Method: OPENPLATFORM.getInfo(callback(err, response));
OPENPLATFORM.getInfo(function(err, response) {
    console.log(err, response);
});
```

__Events__:

```javascript
OPENPLATFORM.on('minimize', function() {
    // Is triggered when the application is minimized
});

OPENPLATFORM.on('maximize', function() {
    // Is triggered when the application is maximized
});

OPENPLATFORM.on('close', function() {
    // Is triggered when the application is closed
});
```

### Widgets

The OpenPlatform supports 2 types of widgets: raw `SVG` and `Chart.js` and 3 sizes of charts:

- Size: `400x250` --> type 1 (default)
- Size: `600x250` --> type 2
- Size: `800x250` --> type 3

Sizes are declared in the `openplatform.json`file.

__Chart.js__:

Documentation can be found here <http://www.chartjs.org/docs/>. Simple example of `doughnut` chart:

```json
{
    "type": "doughnut",
    "data": {
        "labels": [
            "Red",
            "Blue",
            "Yellow"
        ],
        "datasets": [
            {
                "data": [
                    300,
                    50,
                    100
                ],
                "backgroundColor": [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56"
                ],
                "hoverBackgroundColor": [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56"
                ]
            }
        ]
    }
}
```
