import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contextSteps } from '../src/workshop/contextSteps.ts';
import type { SSEEvent } from '../src/types/events.ts';
const initial: SSEEvent[] = [
  {type:'notice',content:'not a teaching step'},
  {type:'llm_request',messages:[],purpose:'initial facts'},
  {type:'llm_thinking'}, {type:'llm_response',content:'Actual first reply'},
  {type:'context_measurement',input_tokens:263000,limit:262144,output_tokens:500,source:'server',phase:'next request'},
];
test('later arrivals leave earlier step snapshots unchanged and do not expose the future error',()=>{
  const before=contextSteps(initial);
  const events: SSEEvent[]=[...initial,{type:'llm_request',messages:[],purpose:'unmanaged — actual oversized request'}, {type:'context_error',error:'HTTP 400\nActual rejection'}, {type:'done'}];
  const after=contextSteps(events);
  assert.deepEqual(after.slice(0,2),before);
  assert.deepEqual(after.map(s=>s.kind),['initial','boundary','rejected']);
  assert.ok(!events.slice(0,after[1].end).some(e=>e.type==='context_error'));
});
test('compaction has separate selectable intervention, summary and measured reduction steps',()=>{
  const events: SSEEvent[]=[...initial,
    {type:'context_compacting',input_tokens:263000,limit:262144},
    {type:'notice',content:'deduplicate synthetic notes'},
    {type:'llm_request',messages:[],purpose:'context summary'},
    {type:'llm_response',content:'ACTUAL SUMMARY'},
    {type:'context_compaction',before_count:4,after_count:4,before_tokens:263000,after_tokens:275,summary:'ACTUAL SUMMARY'},
    {type:'llm_request',messages:[],purpose:'recall after real context management'},
    {type:'llm_response',content:'Actual final answer'}, {type:'done'}];
  const steps=contextSteps(events);
  assert.deepEqual(steps.map(s=>s.kind),['initial','boundary','compacting','summary','compacted','answer']);
  assert.equal(steps[2].event.type,'context_compacting');
  assert.ok(!events.slice(0,steps[2].end).some(e=>e.type==='context_compaction'));
  assert.equal(steps[3].event.type==='llm_response'&&steps[3].event.content,'ACTUAL SUMMARY');
});
test('an early network error is selectable even without a model reply',()=>{
  const steps=contextSteps([{type:'error',content:'Network failed'}]);
  assert.equal(steps.length,1);assert.equal(steps[0].kind,'failure');
});
