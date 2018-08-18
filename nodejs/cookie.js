var http = require('http');
var cookie = require('cookie');

http.createServer((req, res) => {
  var cookies = {};
  if (req.headers.cookie != undefined){
    cookies = cookie.parse(req.headers.cookie);
    console.log(cookies);
    console.log(cookies.tasty_cookie);
  }
  res.writeHead(200, {
    'Set-Cookie':[
      'yummy_cookie=choco', 
      'tasty_cookie=strewberry',
      `Permanent=cookies; Max-Age=${60*60*24*30}`,
      'Secure=Secure; Secure',
      'HttpOnly=HttpOnly; HttpOnly',
      'Path=Path; Path=/cookie',
      'Domain=Domain; Domain=o2.org'
    ] 
    
  })
  res.end("cookie!!!");
}).listen(3000);