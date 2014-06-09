var async = require('async');
var cheerio = require('cheerio');
var fs = require('fs');
var mkdirp = require('mkdirp');
var progressbar = require('progress');
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
                    name = 'images/' + redditor + '/' + href.substring(14, href.length - 4) + ext,
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

function scrape(url, redditor) {
    if (!fs.existsSync('images/' + redditor)) {
        mkdirp('images/' + redditor);
    }

    if (url.substr(url.length - 4) == '.png' || url.substr(url.length - 4) == '.jpg' || url.substr(url.length - 4) == '.gif') {
        var name = 'images/' + redditor + '/' + url.substr(19);
        request.head(url).on('response', function(data) {
            dload.push({
                name: name,
                url: url,
                len: parseInt(data.headers['content-length'])
            });
        });
    } else {
        AlbumRip(url, redditor);
    }
}
/*
prompt.start();
prompt.get('user', function (err, result) {
	var follow = {};
	if (!fs.existsSync('users.json')) {
		fs.openSync('users.json', 'w');
	}
	fs.readFile('users.json', 'utf8', function (err, data) {
		follow = JSON.parse(data);
		len = Object.keys(follow).length;
		for (var i = 0; i <= len; i++) {
			if (follow[i] == result.user) {
				console.log("On the list.");
				break;
			} else if (i == len && follow[i] != result.user) {
				follow[i] = result.user;
				fs.writeFile('users.json', JSON.stringify(follow));
				console.log("On the list.");
			}
		}
	});

	function req(user) {
		request('http://www.reddit.com/user/' + user + '/submitted.json?&limit=100', function (err, res) {
			if (!err) {
				res.body = JSON.parse(res.body);
				for (var i = 0; i < res.body.data.children.length; i++) {
					var prefix = res.body.data.children[i].data;
					if (prefix.over_18 || prefix.subreddit == 'feet') {
						scrape(prefix.url, result.user);
					}
				}
			} else {
				throw (err);
			}
		});
	}
	req(result.user);
	setInterval(function () {
		fs.readFile('users.json', 'utf8', function (err, data) {
			follow = JSON.parse(data);
			len = Object.keys(follow).length;
			for (var i = 0; i <= len; i++) {
				user = follow[i];
				req(user);
			}
		});
	}, 120 * 60 * 1000); // Every two hours
});
*/

function req(user) {
    request('http://www.reddit.com/user/' + user + '/submitted.json?&limit=100', function(err, res) {
        if (!err) {
            res.body = JSON.parse(res.body);
            for (var i = 0; i < res.body.data.children.length; i++) {
                var prefix = res.body.data.children[i].data;
                if (prefix.over_18 || prefix.subreddit == 'feet') {
                    scrape(prefix.url, user);
                }
            }
        } else {
            throw (err);
        }
    });
}

fs.readFile('users.json', 'utf8', function(err, data) {
    var follow = JSON.parse(data),
        len = Object.keys(follow).length;
    for (var i = 0; i <= len; i++) {
        user = follow[i];
        req(user);
    }
});

setInterval(function() {
    fs.readFile('users.json', 'utf8', function(err, data) {
        var follow = JSON.parse(data),
            len = Object.keys(follow).length;
        for (var i = 0; i <= len; i++) {
            user = follow[i];
            req(user);
        }
    });
}, 120 * 60 * 1000); // Every two hours