const Koa = require('koa');
const static = require('koa-static');
const Router = require('koa-router');
const koaBody = require('koa-body');
const fs = require('fs');
const mysql2 = require('mysql2');
// 签发token用
const jwt = require('jsonwebtoken');
// 验证token用
const koajwt = require('koa-jwt');

// 数据库建立连接
const connection = mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'jstest1'
})

let app = new Koa();
let router = new Router();
app.use(static(__dirname + '/static'));
app.use(koaBody({
    multipart:true
}))

router.get('/', ctx => {
    ctx.redirect('/login.html');
});

// 错误处理
app.use((ctx, next) => {
    return next().catch((err) => {
        if(err.status === 401){
            ctx.status = 401;
            ctx.body = 'Protected resource, use Authorization header to get access\n';
        }else{
            throw err;
        }
    })
})

app.use(koajwt({
    secret: 'tokensecret'
}).unless({
    path: [/\/login/]
}));

// 用户登录后获取用户对应图片
router.get('/getPhotoData', async ctx => {
    // let uid = ctx.cookies.get('uid');
    // console.log(ctx.request.header);
    let authorization = ctx.request.header.authorization.split(' ');
    let token = authorization[1];
    // console.log(token);
    var uid = ''
    // 验证 Token
    jwt.verify(token, 'tokensecret', (error, decoded) => {
        if (error) {
        console.log(error.message)
        return
        }
        // decoded是解码出来的token
        // console.log(decoded)
        uid = decoded.uid;
    });
    let [rows] = await connection.promise().query(`SELECT * FROM qqphoto WHERE uid=?`, [uid]);
    // console.log(rows);
    ctx.body = rows;
});

// 验证用户路由
router.post('/checkUser', async ctx => {
    // console.log(ctx.request.body);
    let {username, pwd} = ctx.request.body;
    let [rows] = await connection.promise().query(`SELECT * FROM users WHERE username=? AND pwd=?`, [username, pwd]);
    // console.log(rows);
    var resInfo = {};
    if (rows.length >0 ) {
        // 验证通过后签发token
        let token = jwt.sign({
            // 可以放自定义的内容，也可以放预定义的内容
            username : rows[0].username,
            uid : rows[0].id
            // tokensecret项目里应该是加密的(哈希)，这里字符串代替
            // expiresIn过期时间，一般2小时
        }, 'tokensecret', {expiresIn : '2h'}); 
        resInfo = {
            info : 'user login success',
            status : 1,
            // token带给前端
            token
        }
        
    } else {
        resInfo = {
            info : 'user login failed',
            status : 0
        }
    }
    ctx.body = resInfo;
});
// 上传图片路由。要用koa-jwt验证token,验证要带上自己的秘钥
router.post('/upload', async ctx=>{
    // 这里要用files才能获取到，不能用body
    // console.log(ctx.request.files);
    // 获取头中的token
    // console.log(ctx.request.header.authorization);
    let authorization = ctx.request.header.authorization.split(' ');
    let token = authorization[1];
    // console.log(token);
    var uid = ''
    // 验证 Token
    jwt.verify(token, 'tokensecret', (error, decoded) => {
        if (error) {
        console.log(error.message)
        return
        }
        // decoded是解码出来的token
        // console.log(decoded)
        uid = decoded.id;
    });
    // 因为前端是用异步做的，一个传完再传另一个图片，所以这里每次处理的都是一个图片，不用写循环
    if (ctx.request.files.img.size > 0) {
        // 如果文件又数据则转到指定文件夹-static/uploads
        if (! fs.existsSync('static/img/uploads')) {
            // 如不存在该文件夹则新建
            fs.mkdirSync('static/img/uploads');
        }
        let tempPath = ctx.request.files.img.path;
        // 从临时路径读取文件并写到uploads里去，保持原图片名
        // 写的路径相对跟路径qqPhoto来说的
        fs.writeFileSync('static/img/uploads/'+ctx.request.files.img.name, fs.readFileSync(tempPath));
        // 图片路径这样写，因为app.js里配置了static路径
        let imgPath = '/img/uploads/'+ctx.request.files.img.name;
        let imgName = ctx.request.files.img.name;
        // 用cookie的方式uid确定当前登录用户
        // let uid = ctx.cookies.get('uid');
        // ?是防止SQL注入,rows需解构出来
        let [rows] = await connection.promise().query(`INSERT INTO qqphoto(imgPath,imgName,uid) VALUES (?,?,?)`, [imgPath,imgName,uid]);
        // console.log(rows);
        var resInfo = {};
        if (rows.affectedRows > 0) {
            resInfo = {
                info : 'upload success',
                status : 1
            }
        } else {
            resInfo = {
                info : 'upload failed',
                status : 0
            }
        }
    }
    ctx.body = resInfo;
});
app.use(router.routes());
app.listen(3000);