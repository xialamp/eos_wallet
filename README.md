# eos_wallet
基于eosjs nodejs,支持创建账号，转账，抵押资源，取消抵押资源，购买内存，出售内存，创建密钥对等
1。 下载源码
git clone https://github.com/xialamp/eos_wallet.git
2. 安装扩展 
npm install 
3. 修改参数
修改index.js config.keyProvider 为自己的私钥
修改index.js config.chainId 为连接主网的链ID
修改index.js config.httpEndpoint 为连接主网rpc地址
4. 运行或编译
node index.js
