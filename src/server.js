import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,randomBytes,timingSafeEqual} from 'node:crypto';
import {runWorkflowAsync,validateWorkflow} from './engine.js';
const file = new URL('../data.json',import.meta.url);
const host=process.env.HOST || '127.0.0.1', port=Number(process.env.PORT || 3100);
const secret=process.env.NEXFLOW_API_TOKEN || '';
let db={workflows:[],runs:[]};
try {db=JSON.parse(await readFile(file,'utf8'));} catch(e) {if(e.code !== 'ENOENT') throw e;}
let saveQueue=Promise.resolve();
function save(){saveQueue=saveQueue.then(()=>writeFile(file,JSON.stringify(db,null,2)));return saveQueue;}
function send(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){let text='';for await(const part of req){text+=part;if(text.length>1024*1024) throw Error('Payload muito grande');}return JSON.parse(text||'{}');}
function validToken(value){const a=Buffer.from(value||''),b=Buffer.from(secret);return a.length===b.length&&timingSafeEqual(a,b);}
const srv=createServer(async(req,res)=>{
try{
 const url=new URL(req.url,'http://localhost'), path=url.pathname;
 if(req.method==='GET' && ({'/':'index.html','/app':'app.html','/styles.css':'styles.css','/app.js':'app.js'})[path]){const fileName=({'/':'index.html','/app':'app.html','/styles.css':'styles.css','/app.js':'app.js'})[path];const mime=fileName.endsWith('.css')?'text/css; charset=utf-8':fileName.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8';res.writeHead(200,{'content-type':mime,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(await readFile(new URL('../public/'+fileName,import.meta.url)));return;}
 if(path==='/health'&&req.method==='GET')return send(res,200,{ok:true});
 if(!secret || !validToken(req.headers.authorization?.replace(/^Bearer /i,'')))return send(res,401,{error:'Configure NEXFLOW_API_TOKEN e envie Bearer token'});
 if(path==='/api/workflows'&&req.method==='GET')return send(res,200,db.workflows.map(({webhookToken,...x})=>x));
 if(path==='/api/workflows'&&req.method==='POST'){
 const w=await body(req);validateWorkflow(w);const item={...w,id:randomUUID(),webhookToken:randomBytes(24).toString('hex'),createdAt:new Date().toISOString()};
 db.workflows.push(item);await save();return send(res,201,item);
 }
 const match=path.match(/^\/api\/workflows\/([a-f0-9-]+)(\/run)?$/);
 if(match){const w=db.workflows.find(x=>x.id===match[1]);if(!w)return send(res,404,{error:'Fluxo não encontrado'});
 if(req.method==='GET'&&!match[2])return send(res,200,w);
 if(req.method==='PUT'&&!match[2]){const next=await body(req);validateWorkflow(next);Object.assign(w,{name:next.name,nodes:next.nodes,edges:next.edges});await save();return send(res,200,w);}
 if(req.method==='DELETE'&&!match[2]){db.workflows=db.workflows.filter(x=>x.id!==w.id);await save();return send(res,200,{ok:true});}
 if(req.method==='POST'&&match[2]){const result=await runWorkflowAsync(w,await body(req));const run={id:randomUUID(),workflowId:w.id,time:new Date().toISOString(),...result};db.runs.unshift(run);db.runs=db.runs.slice(0,300);await save();return send(res,200,run);}
 }
 if(path==='/api/runs'&&req.method==='GET')return send(res,200,db.runs);
 return send(res,404,{error:'Rota não encontrada'});
}catch(e){send(res,e instanceof SyntaxError?400:422,{error:e.message});}
});
srv.listen(port,host,()=>console.log('NexFlow local http://'+host+':'+port));
