var express = require('express'),
    lame = require('lame'),
    spawn = require('child_process').spawn,
    Writable = require('stream').Writable;

var app = express();
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/stream/:modulation/:freq', function(req, res) {
    var modulation = req.params.modulation,
        freq = req.params.freq;
    console.log('tuning to ' + freq + ' in ' + modulation);

    var params = [
        '-f', req.params.freq,
        '-M', req.params.modulation,
        '-p', '65',
        '-g', req.query.gain || '500',
        '-E', 'deemp',
        '-E', 'dc',
        '-F', 'O'
    ]

    if (modulation == 'wbfm') {
        params = params.concat(['-r', '48000']);
    } else {
        params = params.concat(['-s', '48000']);
    }

    var p = spawn('/usr/bin/rtl_fm', params);
    var stream = p.stdout;
    p.stderr.pipe(process.stderr);

    req.on('close', function(){
        console.info('request end');
        p.kill('SIGKILL');
    });

    p.on('error', function(err) {
        console.error(err.stack);
        req.end();
    });

    if (req.query.mp3) {
        var encoder = new lame.Encoder({
            channels: 1,
            bitDepth: 16,
            sampleRate: 48000,
            bitRate: req.query.mp3,
            outSampleRate: 48000,
            mode: lame.MONO
        });
        stream.pipe(encoder);
        stream = encoder;
    }

    stream.pipe(res);
});

app.listen(3000, function() {
    console.info('Server started on port 3000');
});
