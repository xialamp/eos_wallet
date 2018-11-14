var express = require('express');
var app = express();
 
var path = require('path');
var cookieParser = require('cookie-parser');
// var logger = require('morgan');
var indexRouter = require('./routes/index');
app.set('views',path.join(__dirname,'views'));

app.set("view engine","ejs");  
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
const ecc = require('eosjs-ecc');
var server = app.listen(8081, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
})
Eos = require('eosjs')
config = {
    keyProvider: ["Providerkey"],  // 配置私钥字符串  eoseoseoseos
    httpEndpoint: '', //DEV开发链url与端口   rpc 地址
    chainId: "2b9f57561518dc67be8a2f2b93b9b4db818eabf46247ec85a80bc2693ad933b2", // 通过cleos get info可以获取chainId
    mockTransactions: () => null, // 如果要广播，需要设为null
    // transactionHeaders: (expireInSeconds, callback) => {
    //   callback(null/*error*/, headers) //手动设置交易记录头，该方法中的callback回调函数每次交易都会被调用
    // },
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    authorization: null // 该参数用于在多签名情况下，识别签名帐号与权限,格式如：account@permission
}

eos = Eos(config)  


// 获取链的信息
app.get("/get_info",function (req, res){
	eos.getInfo({}).then(result => { 
    res.send(result);
    console.log(result) 
    return;
  })

});
// 获取区块信息
app.get("/getBlock",function (req, res){

	var id=req.query.id;
	if(!id){		
		res.send("区块id不能为空");
		return;
  }
  eos.getBlock({'block_num_or_id': id}).then(result => {
    res.send(result)
  });
});

// 查询账号权限、资源等信息
app.get('/getAccount',function(req,res){
  var name=req.query.name;
  console.log(name)
	if(!name){		
		res.send("请输入账户名");
		return;
  }
  eos.getAccount({'account_name': name})
    .then(result => 
      res.send(result)
    ).catch(error => 
      res.send(error)
    );
})


// 购买RAM
app.get('/buyRam',function(req,res){
  var  account = req.query.account;
  var  receiver = req.query.receiver;
  var  bytes = req.query.bytes;
  if(!account){		
		res.send("请输入你的账户名");
		return;
  }
  if(!receiver){		
		res.send("你为谁购买");
		return;
  }
  if(!bytes){		
		res.send("请输入购买内存字节数");
		return;
  }else{
    bytes = bytes*1024
  }
  eos.transaction(tr => {
    tr.buyrambytes({
      payer: account,
      receiver: receiver,
      bytes: bytes
    })
  }).then((result) => {
    res.send(result);
  }).catch((err) => {
    res.send(err);
  });

})
// 出售RAM
app.get('/sellRam',function(req,res){
  var account = req.query.account;
  var bytes = req.query.bytes;
  if(!account){		
		res.send("请输入账户名");
		return;
  }
  if(!bytes){		
		res.send("请输入出售内存字节数");
		return;
  }else{
    bytes = bytes*1024
  }
  eos.contract('eosio').then(eosio => {
      eosio.sellram(account, bytes).then((result) => {
        res.send(result);
      }).catch((err) => {
        res.send(err);
      });
  })
})
// 创建账户
app.get('/newAccount',function(req,res){
  // 创建新账号，购买抵押资源
  // 在 keys.json 文件里放入你的私钥

  // 替换 xxxxxaccount 为你的账号，替换 newaccount 为你准备创建的账号
  // ** 替换 owner 和 active 两个地方的公钥为 newaccount 的公钥
  // bytes 为购买内存的字节数量
  // stakeNET 是抵押 NET 的 FO 数量，stakeCPU 是抵押 CPU 的 FO 数量

  var creator = req.query.creator;
  var name = req.query.name;
  var owner = req.query.owner;
  var active = owner;
  if(!creator){
    res.send("请输入你的账户名");
		return;
  }
  if(!name){
    res.send("请输入你要创建的账户名");
		return;
  }
  if(!owner){
    res.send("请输入你要创建账户的公钥");
		return;
  }
  var bytes = 100 * 1024;
  var stakeNET = 1;
  var stakeCPU = 1;
  eos.transaction(tr => {
      tr.newaccount({
          creator: creator,
          name: name,
          owner: owner,
          active: active
        })

      tr.buyrambytes({
        payer: creator,
        receiver: name,
        bytes: bytes
      })
      
      tr.delegatebw({
        from: creator,
        receiver: name,
        stake_net_quantity: stakeNET.toFixed(4) + ' EOS',
        stake_cpu_quantity: stakeCPU.toFixed(4) + ' EOS',
        transfer: 0
      })
    }).then((result) => {
      res.send(result);
    }).catch((err) => {
      res.send(err);
    });
})

// 生成密钥对
app.get('/create_key',function(req,res){
  var key = {};
  ecc.randomKey().then(privateKey => {
    key['Private'] = privateKey;
    key['Public'] = ecc.privateToPublic(privateKey);
    res.send(key)
  })
})

// 获取账户余额
app.get('/getBalance',function(req,res){
  var account = req.query.name;
  var code = req.query.code;
  if(!account){
    res.send("请输入账户名");
		return;
  }
  if(!code){
    res.send("请输入合约名");
		return;
  }
  eos.getTableRows(true, code, account, "accounts").then((result) => {
    res.send(result);
  }).catch((err) => {
    res.send(err);
  });
})
// 取消抵押cpu net
app.get('/getRefund',function(req,res){
  var account = req.query.name; // 赎回账户
  var receiver = req.query.receiver;  //  接受者
  var net = parseFloat(req.query.net);
  var cpu = parseFloat(req.query.cpu);
  if(!account){
    res.send('请输入赎回账户');
    return;
  }
  if(!receiver){
    res.send('请输入接收者');
    return;
  }
  if(!cpu){
    cpu = 0;
  }
  if(!net){
    net = 0;
  }
  if(cpu == 0 && net == 0){
    res.send('请输入赎回cpu或net');
    return;
  }
  // console.log(net.toFixed(4));
  eos.transaction(tr => {
      tr.undelegatebw({
          from: account,
          receiver: receiver,
          unstake_net_quantity: net.toFixed(4) + ' EOS',       //赎回0.1个DEV
          unstake_cpu_quantity: cpu.toFixed(4) + ' EOS'
      })
  }).then((result) => {
    console.log(net.toFixed(4));
    // console.log(result)
    res.send(result);
  }).catch((err) => {
    console.log(net.toFixed(4));
    res.send(err);
  });
})

// 抵押cpu net 
app.get('/getMortgage',function(req,res){
  var from = req.query.from;
  var receiver = req.query.receiver;
  var net = parseFloat(req.query.net);
  var cpu = parseFloat(req.query.cpu);
  if(!account){
    res.send('请输入抵押账户');
    return;
  }
  if(!receiver){
    res.send('请输入给谁');
    return;
  }
  if(!cpu){
    cpu = 0;
  }
  if(!net){
    net = 0;
  }
  if(cpu == 0 && net == 0){
    res.send('请输入抵押cpu或net');
    return;
  }
  eos.transaction(tr => {
      tr.delegatebw({
          from: from,
          receiver: receiver, //testtesttest账户为自己抵押
          stake_net_quantity: net.toFixed(4) + ' EOS',
          stake_cpu_quantity: cpu.toFixed(4) + ' EOS',
          transfer: 0
      })
  }).then((result) => {
    // console.log(result)
    res.send(result);
  }).catch((err) => {
    // console.log(err);
    res.send(err);
  });
})


// 转账
app.get('/getTransfer',function(req,res){
  var from = req.query.from;
  var receiver = req.query.receiver;
  var memo = req.query.memo;
  var amount = parseFloat(req.query.amount);
  if(!from){
    res.send('请输入账户名');
    return;
  }
  if(!receiver){
    res.send('请输入对方账户名');
    return;
  }
  if(!amount){
    res.send('请输入转账金额');
    return;
  }
  if(amount <= 0){
    res.send('请输入正确的转账金额');
    return;
  }
  var value = amount.toFixed(4) + " EOS";
  eos.contract("eosio.token").then((token) => {
      token.transfer(from, receiver, value, memo).then((result) => {
          console.log(result);     
          res.send(result);     
      }).catch((err) => {
          console.log(err);
          res.send(err);
      });
  });
})



// // eos.getBlock({'block_num_or_id': 1}).then(
// //   console.log
// // );
// // // 获取链的信息
// // eos.getInfo({}).then(result => { 
// // 	console.log(result) 
// // })

// // 查看账户信息
// eos.getAccount({'account_name': 'chaofeiissha'})
//     .then(result => console.log(result))
//     .catch(error => console.error(error));

// 获取公钥对应的账户
// eos.getKeyAccounts('EOS8j8YSzxiKYMD7SAe65dGy9Xr71DLJ9KBNKxWzM2A2WAGrfVvuZ')
//     .then(result => console.log(result))
//     .catch(error => console.error(error));

