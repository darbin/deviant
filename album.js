var async = require('async');
var cheerio = require('cheerio');
var fs = require('fs');
var mkdirp = require('mkdirp');
var progressbar = require('progress');
var prompt = require('prompt');
var request = require('request');

// If images folder doesn't exist, create it
if (!fs.existsSync('images')) {
    mkdirp('images');
}

// Handles the actual downloading, naming
var dload = async.queue(function(task, callback) {
    bar = new progressbar('[:bar] :percent :etas', {
        total: task.len,
        width: 20,
        complete: '#'
    });
    request(task.url).on('response', function(data) {
        bar.tick(parseInt(data.headers['content-length']));
    }).pipe(fs.createWriteStream(task.name));
    callback();
}, 5);

function AlbumRip(url) {
    var dir = false;

    // Checks for custom download location, if none specified, stores in images folder
    if (process.argv[3] != null) {
        dir = true;
        if (!fs.existsSync(process.argv[3])) {
            mkdirp(process.argv[3]);
        }
    } else if (!fs.existsSync('images/' + url.substring(19))) {
        mkdirp('images/' + url.substring(19));
    }

    // Total download size of images and array containing urls
    // and image names (names are urls minus the file extension)
    var totalsize = 0,
        pics = [];

    // Makes requests to the noscript version of the album URL
    request(url + '/noscript', function(err, res, html) {
        if (!err) {
            var $ = cheerio.load(html);
            // Selects images
            var posts = $('img').parent('div[class=wrapper], a[class=zoom]').children();
            var y = 0;

      		// Loops through all images and passes info about them to downloader
            for (var i = 0; i < posts.length; i++) {
                var obj = posts[i],
                    href = obj.attribs['src'].substring(0, obj.attribs['src'].length);
                if (!isNaN(href.substr(href.length - 1))) {
                    href = href.substring(0, href.length - 2);
                }
                var ext = href.substr(href.length - 4),
                    href = 'http:' + href;

                // File naming
                if (!dir) {
                    name = 'images/' + url.substring(19) + '/' + i + ' - ' + href.substring(19, href.length - 4) + ext;
                } else {
                    name = process.argv[3] + '/' + i + ' - ' + href.substring(19, href.length - 4) + ext;
                }

                // Checks to see if file exists, and if so, skips the download
                if (fs.existsSync(name)) {
                    continue;
                }

                var image = {
                    url: href,
                    name: name
                };

                // Adds image info to pics array
                pics.push(image);

                // Requests header info on every image
                request.head(href).on('response', function(data) {
                    y++;
                    totalsize += parseInt(data.headers['content-length']);
                    // When it has info on all images, passes info to downloader to begin download
                    if (y == posts.length) {
                        for (var x = 0; x < pics.length; x++) {
                            dload.push({
                                url: pics[x].url,
                                name: pics[x].name,
                                len: totalsize
                            });
                        }
                    }
                });
            }
        } else {
            console.log(err);
        }
    }).on('error', function(e) {
        console.log(e);
    });
}

AlbumRip(process.argv[2]);