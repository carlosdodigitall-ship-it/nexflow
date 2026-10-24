export function validateWorkflow(workflow) {
  if (!workflow || !Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) throw new Error('Fluxo inválido');
  if (workflow.nodes.length < 1 || workflow.nodes.length > 30) throw new Error('Limite de 1 a 30 blocos');
  const ids = new Set(workflow.nodes.map(n => n.id));
  if (ids.size !== workflow.nodes.length) throw new Error('IDs duplicados');
  const types = new Set(['trigger','set','condition','output']);
  if (workflow.nodes.some(n => !types.has(n.type))) throw new Error('Tipo de bloco desconhecido');
  if (workflow.nodes.filter(n => n.type === 'trigger').length !== 1) throw new Error('Exatamente um gatilho é obrigatório');
  for (const e of workflow.edges) if (!ids.has(e.source) || !ids.has(e.target)) throw new Error('Conexão inválida');
  const visited = new Set(), active = new Set(), next = id => workflow.edges.filter(e => e.source === id).map(e => e.target);
  function visit(id) {
    if (active.has(id)) throw new Error('Fluxo cíclico');
    if (visited.has(id)) return;
    active.add(id); for (const to of next(id)) visit(to); active.delete(id); visited.add(id);
  }
  for (const id of ids) visit(id);
  return workflow;
}
export function runWorkflow(workflow, input = {}) {
  validateWorkflow(workflow);
  const byId = new Map(workflow.nodes.map(n => [n.id,n]));
  let node = workflow.nodes.find(n => n.type === 'trigger'), value = structuredClone(input), steps = [];
  while (node) {
    if (node.type === 'set') value = {...value, ...(node.data?.values ?? {})};
    if (node.type === 'condition') value = {...value, condition: String(value[node.data?.field] ?? '') === String(node.data?.equals ?? '')};
    steps.push({nodeId: node.id, type: node.type, output: structuredClone(value)});
    const options = workflow.edges.filter(e => e.source === node.id);
    const edge = node.type === 'condition' ? options.find(e => e.sourceHandle === String(value.condition)) : options[0];
    node = edge ? byId.get(edge.target) : undefined;
  }
  return {status:'success',output:value,steps};
}
