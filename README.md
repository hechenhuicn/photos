# photos
It's a project which shows how to interactive between front and back

本项目主要展示node.js和前端的交互

功能描述： （1）用户登录自己的图片界面 （2）登录后可上传图片、展示图片

使用： 
（1）nodemon index.js或node index.js启动服务器。 
（2）浏览器输入http://localhost:3000 进入登录页面。
（3）请配合mysql数据库使用。

技术点： 
（1）主要采用koa框架，另用koa-router,koa-static,koa-body模块。 
（2）数据库MYSQL，用mysql2模块。 
（3）采用JWT鉴权+Axios。JWT用jsonwebtoken、koa-jwt模块。
