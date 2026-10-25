const ROOT='https://whbxyjriqpqwxkfdgkfg.supabase.co';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 const bearer=req.headers.authorization||'';
 if(!/^Bearer \S+$/.test(bearer))return res.status(401).json({error:'Faça login'});
 const key=process.env.OPENAI_API_KEY;
 const pub=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!key||!pub)return res.status(503).json({error:'Configure OPENAI_API_KEY e SUPABASE_PUBLISHABLE_KEY na Vercel'});
 const auth=await fetch(ROOT+'/auth/v1/user',{headers:{apikey:pub,authorization:bearer}});
 if(!auth.ok)return res.status(401).json({error:'Sessão inválida'});
 const threadId=req.body?.threadId;
 if(typeof threadId!=='string'||!/^[0-9a-f-]{36}$/i.test(threadId))return res.status(400).json({error:'Conversa inválida'});
 const headers={apikey:pub,authorization:bearer};
 const t=await fetch(ROOT+'/rest/v1/assistant_threads?select=id&id=eq.'+encodeURIComponent(threadId),{headers});
 if(!t.ok||!(await t.json()).length)return res.status(404).json({error:'Conversa não autorizada'});
 const h=await fetch(ROOT+'/rest/v1/assistant_messages?select=role,content&thread_id=eq.'+encodeURIComponent(threadId)+'&order=created_at.desc&limit=16',{headers});
 if(!h.ok)return res.status(502).json({error:'Falha ao carregar conversa'});
 const messages=(await h.json()).reverse();
 if(!messages.length||messages.at(-1).role!=='user')return res.status(400).json({error:'Envie uma mensagem antes'});
 try{
  const result=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',max_tokens:900,messages:[{role:'system',content:'Você é o Assistente NexFlow. Responda em português e ajude a planejar automações. Não afirme ter ativado conectores ou executado workflows.'},...messages]})});
  if(!result.ok)return res.status(502).json({error:'Provedor de IA não respondeu',status:result.status});
  const answer=await result.json();return res.status(200).json({message:answer.choices?.[0]?.message?.content||''});
 }catch{return res.status(502).json({error:'Erro de conexão com IA'})}
}