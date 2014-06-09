var async = require('async');
var cheerio = require('cheerio');
var fs = require('fs');
var mkdirp = require('mkdirp');
var progressbar = require('progress');
var prompt = require('prompt');
var request = require('request');

if (!fs.existsSync('images')) {
    mkdirp('images');
}

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
}, 2);

function AlbumRip(url) {
    var totalsize = 0,
        pics = [];

    if (!fs.existsSync('images/' + url.substring(19))) {
        mkdirp('images/' + url.substring(19));
    }

    request(url + '/noscript', function(err, res, html) {
        if (!err) {
            var $ = cheerio.load(html);
            var posts = $('div[class=image]').children().children().children();
            var bar = new progressbar('[:bar] :percent :etas', {
                total: posts.length,
                complete: '#',
                width: 20
            });
            var y = 0;
            for (var i = 0; i < posts.length; i++) {
                var obj = posts[i],
                    href = obj.attribs['src'].substring(0, obj.attribs['src'].length);
                if (!isNaN(href.substr(href.length - 1))) {
                    href = href.substring(0, href.length - 2);
                }
                var ext = href.substr(href.length - 4),
                    name = 'images/' + url.substring(19) + '/' + href.substring(14, href.length - 4) + ext,
                    href = 'http:' + href;

                // Checks to see if file exists, and if so, skips the download
                if (fs.existsSync(name)) {
                    continue;
                }

                var image = {
                    url: href,
                    name: name
                };

                pics.push(image);
                request.head(href).on('response', function(data) {
                    y++;
                    totalsize += parseInt(data.headers['content-length']);
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