var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var prompt = require('prompt');
var fs = require('fs');
var app = express();

function scrape(url) {
	if (url.substr(url.length - 4) == '.png' || url.substr(url.length - 4) == '.jpg' || url.substr(url.length - 4) == '.gif') {
		console.log("Downloading...");
		var name = 'images/' + url.substr(19);
		request(url).pipe(fs.createWriteStream(name)).on('close', function () {
			console.log("Done!");
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
							name = 'images/' + obj.parent.attribs.id + ext;

						// Checks to see if file exists, and if so, skips the download
						if (fs.existsSync(name)) {
							continue;
						}

						var x = 0;
						request('http:' + href).pipe(fs.createWriteStream(name)).on('close', function () {
							x++;
							if (x == posts.length) {
								console.log("Done!");
							}
						});
					}
				} else {
					var posts = $('.zoom').children();
					console.log("Downloading...");
					for (var i = 0; i < posts.length; i++) {
						var obj = posts[i],
							href = obj.attribs['data-src'].substring(0, obj.attribs['data-src'].length);
						if (!isNaN(href.substr(href.length - 1))) {
							href = href.substring(0, href.length - 2);
						}
						var ext = href.substr(href.length - 4),
							name = 'images/' + href.substring(14, href.length - 4) + ext; //console.log(href);

						// Checks to see if file exists, and if so, skips the download
						if (fs.existsSync(name)) {
							continue;
						}

						var x = 0;
						request('http:' + href).pipe(fs.createWriteStream(name)).on('close', function () {
							x++;
							if (x == posts.length) {
								console.log("Done!");
							}
						});
					}
				}
			} else {
				console.log(err);
			}
		});
	}
}

//prompt.start();
//
//prompt.get('user', function (err, result) {
//	request('http://www.reddit.com/user/' + result.user + '.json', function (err, res) {
//		if (!err) {
//			console.log(res);
//			fs.writeFile('stuff.txt', res);
//		}
//	});
//});

request('http://www.reddit.com/user/ArquetipoArcana.json', function (err, res) {
	if (!err) {
		console.log(res);
		fs.writeFile('stuff.txt', res.kind);
	}
});