var async = require('async');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var prompt = require('prompt');
var request = require('request');
var progressbar = require('progress');
var fs = require('fs');

/*var bar = new progressbar('[:bar] :percent :etas', {total: 20, complete: '#'});
var timer = setInterval(function () {
	bar.tick();
	if (bar.complete) {
		console.log('\nDone!\n');
		clearInterval(timer);
	}
}, 100);*/

if (!fs.existsSync('images')) {
	mkdirp('images');
}

var dload = async.queue(function (task, callback) {
	request(task.url).pipe(fs.createWriteStream(task.name));
	callback();
}, 2);

function scrape(url, redditor) { // TODO: Need new way of scraping, see http://imgur.com/a/0KoeX
	if (!fs.existsSync('images/' + redditor)) {
		mkdirp('images/' + redditor);
	}

	if (url.substr(url.length - 4) == '.png' || url.substr(url.length - 4) == '.jpg' || url.substr(url.length - 4) == '.gif') {
		console.log("Downloading...");
		var name = 'images/' + redditor + '/' + url.substr(19);
		/*request(url).pipe(fs.createWriteStream(name)).on('close', function () {
			console.log("Done!");
		});*/
		dload.push({name: name, url: url}, function (err) {
			console.log('Done!');
		});
	} else {
		request(url, function (err, res, html) {
			if (!err) {
				var $ = cheerio.load(html);
				var posts = $('.posts').children().children();
				if (posts.length != 0) {
					console.log("Downloading...");

					for (var i = 0; i < posts.length; i++) {

						var obj = posts[i],
							href = obj.attribs.href.substring(0, obj.attribs.href.length - 2),
							ext = href.substr(href.length - 4),
							name = 'images/' + redditor + '/' + obj.parent.attribs.id + ext;

						// Checks to see if file exists, and if so, skips the download
						if (fs.existsSync(name)) {
							continue;
						}

						var x = 0;
						/*request('http:' + href).pipe(fs.createWriteStream(name)).on('close', function () {
							x++;
							if (x == posts.length) {
								console.log("Done!");
							}
						});*/
						dload.push({url: 'http:' + href, name: name}, function (err) {
							console.log('Done!');
						});
					}
				} else {
					var posts = $('.zoom').children();
					console.log("Downloading...");
					var bar = new progressbar('[:bar] :percent :etas', {
							total: posts.length,
							complete: '#',
							width: 20
					});
					for (var i = 0; i < posts.length; i++) {
						var obj = posts[i],
							href = obj.attribs['data-src'].substring(0, obj.attribs['data-src'].length);
						if (!isNaN(href.substr(href.length - 1))) {
							href = href.substring(0, href.length - 2);
						}
						var ext = href.substr(href.length - 4),
							name = 'images/' + redditor + '/' + href.substring(14, href.length - 4) + ext;

						// Checks to see if file exists, and if so, skips the download
						if (fs.existsSync(name)) {
							continue;
						}

						var x = 0;
						/*request('http:' + href).pipe(fs.createWriteStream(name)).on('close', function () {
							x++;
							if (x == posts.length) {
								console.log("Done!");
							}
						});*/


						bar.tick();

						dload.push({url: 'http:' + href, name: name}, function (err) {
							//console.log('Done!');
						});
					}
				}
			} else {
				console.log(err);
			}
		}).on('error', function (e) {
			console.log(e);
		});
	}
}
var check;
var len = 0;
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

scrape('http://imgur.com/a/xq0an', 'test');