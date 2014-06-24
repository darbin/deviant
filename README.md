Deviant
=======

Rips imgur albums and reddit accounts. Can "follow" accounts and update stored images. All images are stored in the images folder.

How to use:
-----------

First you need [node](https://nodejs.org/) installed. Download and open this folder in your command line, then run `npm install` to install the dependencies.

Make sure you have added your users to users.json, replacing the example. It should look like this:

```
{
    "0": "user1",
    "1": "user2",
    "2": "user3"
}
```

Then run `node deviant.js`.

-------

To use album.js, run `node album.js [album url]`.

You can also output to a custom folder if you wish, by running `node album.js [album url] [location]`.


Known issues:
-------------

* Reddit account ripping does not work! Only album.js works.
* Some imgur albums cannot be ripped correctly (unconfirmed)
