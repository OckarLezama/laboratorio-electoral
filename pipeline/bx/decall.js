const fs=require('fs'),zlib=require('zlib'),crypto=require('crypto');
const K=JSON.parse(fs.readFileSync(__dirname+'/keys.json'));
const L='/home/claude/plataforma-electoral/public/lab/';
const dec=(f,k)=>{const u=fs.readFileSync(f),d=crypto.createDecipheriv('aes-256-gcm',Buffer.from(k,'base64'),u.slice(0,12));d.setAuthTag(u.slice(-16));return zlib.gunzipSync(Buffer.concat([d.update(u.slice(12,-16)),d.final()]))};
for(const f of fs.readdirSync(L).filter(f=>/^[a-z]+\.bin$/.test(f))){const c=f.slice(0,-4);
 let ok=null;for(const [e,[k,kl]] of Object.entries(K)){try{const b=dec(L+f,k);const D=JSON.parse(b);if(String(D.meta.ent)!==e&&+D.meta.ent!==+e){}fs.writeFileSync(__dirname+'/dec/'+c+'.json',b);fs.writeFileSync(__dirname+'/dec/'+c+'.lab.json',dec(L+c+'.lab.bin',kl));ok=e;break}catch(_){}}
 console.log(c,ok)}
