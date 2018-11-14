var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  // res.send('respond with a resource');
  res.render('index', { title: '<h1>EOS demo</h1>'
                          ,users:[{username: 'Wilson'},
                                {username: 'Wilson Zhong'},
                                {username: 'Zhong Wei'}] 
            });
});

module.exports = router;
