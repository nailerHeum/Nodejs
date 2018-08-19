var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var cookie = require('cookie');

function authIsOwner(req, res) {
  var isOwner = false;
  var cookies = {};
  if (req.headers.cookie) { //expect no cookie case
    cookies = cookie.parse(req.headers.cookie);
  }
  if(cookies.email === 'kingman330@gmail.com' && cookies.password === '111111') {
    isOwner = true;
  }
  return isOwner;
}

function authStatusUI(req, res){
  var authStatusUI = '<a href="/login">Login</a>'
  if (authIsOwner(req, res) === true){
    authStatusUI = '<a href="/logout_process">Logout</a>';
  }
  return authStatusUI;
}

var app = http.createServer((req,res) => {
    var _url = req.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    
    
    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Welcome';
          var description = 'Hello, Node.js';
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>`,
            authStatusUI(req, res)
          );
          res.writeHead(200);
          res.end(html);
        });
      } else {
        fs.readdir('./data', function(error, filelist){
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
              allowedTags:['h1']
            });
            var list = template.list(filelist);
            var html = template.HTML(sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
              ` <a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form>`, authStatusUI(req, res)
            );
            res.writeHead(200);
            res.end(html);
          });
        });
      }
    } else if(pathname === '/create'){
      fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = template.list(filelist);
        var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '', authStatusUI(req, res)
        );
        res.writeHead(200);
        res.end(html);
      });
    } else if(pathname === '/create_process'){
      if(authIsOwner(req, res) === false){
        res.end(`Login required`)
        return false;
      }
      var body = '';
      req.on('data', function(data){
          body = body + data;
      });
      req.on('end', function(){
          var post = qs.parse(body);
          var title = post.title;
          var description = post.description;
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            res.writeHead(302, {Location: `/?id=${title}`});
            res.end();
          })
      });
    } else if(pathname === '/update'){
      fs.readdir('./data', function(error, filelist){
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`,
            authStatusUI(req, res)
          );
          res.writeHead(200);
          res.end(html);
        });
      });
    } else if(pathname === '/update_process'){
      var body = '';
      req.on('data', function(data){
          body = body + data;
      });
      req.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var title = post.title;
          var description = post.description;
          fs.rename(`data/${id}`, `data/${title}`, function(error){
            fs.writeFile(`data/${title}`, description, 'utf8', function(err){
              res.writeHead(302, {Location: `/?id=${title}`});
              res.end();
            })
          });
      });
    } else if(pathname === '/delete_process'){
      var body = '';
      req.on('data', function(data){
          body = body + data;
      });
      req.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var filteredId = path.parse(id).base;
          fs.unlink(`data/${filteredId}`, function(error){
            res.writeHead(302, {Location: `/`});
            res.end();
          })
      });
    } else if (pathname === '/login') {
      fs.readdir('./data', function(error, filelist){
        var title = 'Welcome';
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `
          <form action="/login_process" method="post"> 
          <p>
            <input type="text" name="email" placeholder="email">
          </p>
          <p>
            <input type="password" name="password" placeholder="password">
          </p>
          <p>
            <input type="submit">
          </p>
          </form>
          `,
          `<a href="/create">create</a>`
        );
        res.writeHead(200);
        res.end(html);
      });
    } else if (pathname === '/login_process'){
      var body = '';
      req.on('data', function(data){
          body = body + data;
      });
      req.on('end', function(){
        var post = qs.parse(body);
        if(post.email === 'kingman330@gmail.com' && post.password === '111111'){
          res.writeHead(302, {
            'Set-Cookie': [
              `email=${post.email}`,
              `password=${post.password}`,
              `nickname=heum`
            ], 
            Location: `/`
          });
          res.end();
        } else {
          res.end('who?');
        }
      });
    } else if (pathname === '/logout_process') {
      var post = qs.parse(body);
        
      res.writeHead(302, {
        'Set-Cookie': [
          `email=; Max-Age=0`,
          `password=; Max-Age=0`,
          `nickname=; Max-Age=0`
        ], 
        Location: `/`
      });
      res.end();
    }else {
      res.writeHead(404);
      res.end('Not found');
    }
});
app.listen(3000);
