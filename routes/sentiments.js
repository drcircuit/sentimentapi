var express = require('express');
var router = express.Router();
var aws = require('aws-sdk');
var crypto = require('crypto');

aws.config.update({region: 'eu-west-1'});

var comp = new aws.Comprehend();
var s3 = new aws.S3();
var bucket = "dnblive";

var loaded = [];

router.post('/', function (req, res) {
    comp.detectSentiment({
        LanguageCode: "en",
        Text: req.body.text
    }, function (err, data) {
        if (!err) {
            data.text = req.body.text;
            data.key = crypto.createHash('md5').update(JSON.stringify(req.body.text)).digest('hex');
            s3.putObject({
                Bucket: bucket,
                Key: 'sentiments/' + data.key,
                Body: JSON.stringify(data)
            }, function (err, r) {
                if (err) {
                    console.log("not stored...");
                }
                res.json(data);
                res.end();
            });
        } else {
            res.status(500).send(err);
        }
    });
});
router.get('/:key', function(req, res){
    var skey = req.originalUrl.substr(1);
    s3.getObject({
        Bucket: bucket,
        Key: skey
    }, function (err, o) {
        if (!err) {
            var obj = JSON.parse(o.Body.toString('utf-8'));
            var listings={
                key: skey,
                text: obj.text,
                sentiment: obj.Sentiment,
                sentimentScore: obj.SentimentScore
            };
            res.json(listings);
            res.end();
        } else {
            res.status(404).send("Didn't find anything...");
        }
    });
});
router.get('/', function (req, res) {
    var fullUrl = req.protocol + '://' + req.get('host');
    s3.listObjects({
        Prefix: 'sentiments/',
        MaxKeys: 100,
        Bucket: bucket
    }, function (err, data) {
        if (!err) {
            var listings = [];
            if (data.Contents.length === 0) {
                res.json(listings);
                res.end();
            }
            data.Contents.forEach(function (c, i) {
                s3.getObject({
                    Bucket: bucket,
                    Key: c.Key
                }, function (err, o) {
                    if (!err) {
                        var obj = JSON.parse(o.Body.toString('utf-8'));
                        listings.push({
                            key: c.Key,
                            size: c.Size,
                            text: obj.text,
                            sentiment: obj.Sentiment,
                            url: fullUrl + '/' + c.Key
                        });
                    } else {

                        listings.push({
                            key: c.Key,
                            error: "Unable to load data...",
                        });
                    }
                    if (listings.length === data.Contents.length) {
                        res.json(listings);
                        res.end();
                    }
                })

            });

        } else {
            res.status(500).send(err);
        }
    });
});
module.exports = router;
