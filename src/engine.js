const TYPES = new Set(['trigger','set','condition','output','delay']);
const MAX_NODES = 100;
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
export function validateWorkflow(flow) {
 if (!flow || !Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) throw Error('Fluxo inválido');
 if (flow.nodes.length<1 || flow.nodes.length>MAX_NODES) throw Error('Quantidade de nós inválida');
 const nodes=new Map();
 for(const n of flow.nodes){
  if(!n || typeof n.id!=='string' || !n.id || !TYPES.has(n.type) || nodes.has(n.id)) throw Error('Nó inválido, duplicado ou desconhecido');
  nodes.set(n.id,n);
 }
 if(flow.nodes.filter(n=>n.type==='trigger').length!==1) throw Error('Exatamente um gatilho é obrigatório');
 const adjacency=new Map([...nodes.keys()].map(id=>[id,[]]));
 const edges=new Set();
 for(const e of flow.edges){
  if(!e || !nodes.has(e.source)||!nodes.has(e.target)) throw Error('Conexão inválida');
  if(e.source===e.target) throw Error('Conexão circular');
  const source=nodes.get(e.source);
  if(source.type==='output') throw Error('Saída não pode ter conexões');
  if(nodes.get(e.target).type==='trigger') throw Error('Gatilho não aceita entradas');
  if(source.type==='condition' && !['true','false'].includes(e.sourceHandle)) throw Error('Condição exige saída true ou false');
  if(source.type!=='condition' && e.sourceHandle!==undefined && e.sourceHandle!=='default') throw Error('Porta de saída inválida');
  const signature=[e.source,e.target,e.sourceHandle||'default'].join(':');
  if(edges.has(signature)) throw Error('Conexão duplicada');
  edges.add(signature);adjacency.get(e.source).push(e.target);
 }
 const active=new Set(),seen=new Set();
 function visit(id){if(active.has(id)) throw Error('Fluxo cíclico');if(seen.has(id))return;active.add(id);for(const next of adjacency.get(id))visit(next);active.delete(id);seen.add(id);}
 for(const id of nodes.keys())visit(id);
 return flow;
}
export async function runWorkflowAsync(flow,input={},options={}){
 validateWorkflow(flow);
 if(input===null||typeof input!=='object'||Array.isArray(input))throw Error('Entrada deve ser objeto JSON');
 const nodes=new Map(flow.nodes.map(n=>[n.id,n]));
 const outgoing=new Map(flow.nodes.map(n=>[n.id,[]]));
 for(const e of flow.edges)outgoing.get(e.source).push(e);
 const trigger=flow.nodes.find(n=>n.type==='trigger');
 const queue=[{id:trigger.id,value:structuredClone(input),depth:0}];
 const steps=[],outputs=[];let executed=0;
 const maxSteps=options.maxSteps??500;
 const timeoutMs=options.timeoutMs??30000;
 const started=Date.now();
 while(queue.length){
  if(options.signal?.aborted)throw Error('Execução cancelada');
  if(Date.now()-started>timeoutMs)throw Error('Tempo limite de execução excedido');
  if(++executed>maxSteps)throw Error('Limite de etapas excedido');
  const task=queue.shift(),node=nodes.get(task.id),value=structuredClone(task.value);
  let result=value,condition;
  if(node.type==='set'){
   if(!node.data?.values||typeof node.data.values!=='object'||Array.isArray(node.data.values))throw Error('Transformação exige objeto');
   result={...value,...structuredClone(node.data.values)};
  }
  if(node.type==='condition')condition=String(value[node.data?.field]??'')===String(node.data?.equals??'');
  if(node.type==='delay'){
   const ms=Number(node.data?.ms??0);
   if(!Number.isInteger(ms)||ms<0||ms>5000)throw Error('Delay deve estar entre 0 e 5000 ms');
   if(ms)await new Promise(resolve=>setTimeout(resolve,ms));
  }
  steps.push({nodeId:node.id,type:node.type,output:structuredClone(result),...(condition===undefined?{}:{condition})});
  if(node.type==='output')outputs.push(structuredClone(result));
  const next=outgoing.get(node.id).filter(e=>node.type!=='condition'||e.sourceHandle===String(condition));
  for(const e of next)queue.push({id:e.target,value:structuredClone(result),depth:task.depth+1});
 }
 return {status:'success',output:outputs.at(-1)??steps.at(-1)?.output??structuredClone(input),outputs,steps};
}
export function runWorkflow(flow,input={}) {
 validateWorkflow(flow);
 if(flow.nodes.some(n=>n.type==='delay'))throw Error('Use runWorkflowAsync para fluxos com delay');
 const nodes=new Map(flow.nodes.map(n=>[n.id,n]));
 const queue=[{id:flow.nodes.find(n=>n.type==='trigger').id,value:structuredClone(input)}],steps=[],outputs=[];
 let count=0;
 while(queue.length){
  if(++count>500)throw Error('Limite de etapas excedido');
  const task=queue.shift(),node=nodes.get(task.id);
  let val=structuredClone(task.value),condition;
  if(node.type==='set'){if(!node.data?.values||typeof node.data.values!=='object'||Array.isArray(node.data.values))throw Error('Transformação exige objeto');val={...val,...structuredClone(node.data.values)};}
  if(node.type==='condition')condition=String(val[node.data?.field]??'')===String(node.data?.equals??'');
  steps.push({nodeId:node.id,type:node.type,output:structuredClone(val),...(condition===undefined?{}:{condition})});
  if(node.type==='output')outputs.push(structuredClone(val));
  for(const e of flow.edges.filter(e=>e.source===node.id&&(node.type!=='condition'||e.sourceHandle===String(condition))))queue.push({id:e.target,value:structuredClone(val)});
 }
 return {status:'success',output:outputs.at(-1)??steps.at(-1)?.output??structuredClone(input),outputs,steps};
}