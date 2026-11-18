const fs=require('fs'),zlib=require('zlib'),crypto=require('crypto');
const K=JSON.parse(fs.readFileSync(__dirname+'/keys.json'));const L='/home/claude/plataforma-electoral/public/lab/';
const dec=(f,k)=>{const u=fs.readFileSync(f),d=crypto.createDecipheriv('aes-256-gcm',Buffer.from(k,'base64'),u.slice(0,12));d.setAuthTag(u.slice(-16));return JSON.parse(zlib.gunzipSync(Buffer.concat([d.update(u.slice(12,-16)),d.final()])))};
for(const f of fs.readdirSync(__dirname+'/fix')){const c=f.slice(0,-5);const D=JSON.parse(fs.readFileSync(__dirname+'/fix/'+f));const k=K[String(D.meta.ent)][0];
 const raw=zlib.gzipSync(Buffer.from(JSON.stringify(D)),{level:9});const iv=crypto.randomBytes(12);const ci=crypto.createCipheriv('aes-256-gcm',Buffer.from(k,'base64'),iv);
 const out=Buffer.concat([iv,ci.update(raw),ci.final(),ci.getAuthTag()]);const antes=fs.statSync(L+c+'.bin').size;fs.writeFileSync(L+c+'.bin',out);
 const chk=dec(L+c+'.bin',k);if(JSON.stringify(chk.E)!==JSON.stringify(D.E))throw c;console.log(c,antes,'→',out.length);}
