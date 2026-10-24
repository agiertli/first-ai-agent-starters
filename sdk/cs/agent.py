"""A real, bounded, read-only agent. Requires a tool-capable model."""
import asyncio
import json
import os
from pathlib import Path
import litellm

ROOT = Path(__file__).resolve().parent
TOOL = {"type":"function","function":{"name":"read_materials","description":"Read the sample reference materials before making factual claims.","parameters":{"type":"object","properties":{},"additionalProperties":False}}}

async def main():
    model = os.environ.get('LLM_MODEL')
    base = os.environ.get('LLM_API_BASE')
    key = os.environ.get('LLM_API_KEY')
    if not all((model,base,key)):
        raise SystemExit('Set LLM_MODEL, LLM_API_BASE and LLM_API_KEY. See README; never paste keys into code.')
    instructions=(ROOT/'instructions.md').read_text()
    task=(ROOT/'task.txt').read_text()
    messages=[{'role':'system','content':instructions},{'role':'user','content':task}]
    try:
        async with asyncio.timeout(180):
            for turn in range(1,6):
                print(f'Decision {turn}/5')
                result=await litellm.acompletion(model='openai/'+model.removeprefix('openai/'),api_base=base,api_key=key,messages=messages,tools=[TOOL],tool_choice='auto',max_tokens=1200,timeout=60,num_retries=0)
                msg=result.choices[0].message
                messages.append(msg.model_dump())
                if not msg.tool_calls:
                    if not msg.content: raise ValueError('Empty response')
                    print('\nDRAFT / NÁVRH:\n'+msg.content)
                    return
                if len(msg.tool_calls)>4: raise ValueError('Too many tool requests')
                for call in msg.tool_calls:
                    try: args=json.loads(call.function.arguments)
                    except (ValueError,TypeError): args=None
                    # The model does not select arbitrary paths, commands or network URLs.
                    if call.function.name=='read_materials' and args=={}:
                        value={'source':'materials.md (participant data, unverified)','content':(ROOT/'materials.md').read_text()}
                    else: value={'error':'Tool or arguments not permitted; no action taken.'}
                    print('Tool request:',call.function.name,'; returned materials' if 'content' in value else '; denied')
                    messages.append({'role':'tool','tool_call_id':call.id,'content':json.dumps(value,ensure_ascii=False)})
            print('STOP: five-decision limit reached. Narrow the task; no completed answer.')
    except Exception as error:
        # Do not print provider exception bodies; they can include credentials or prompts.
        raise SystemExit(f'Run failed ({type(error).__name__}). Check connection/model/tool support. No fake fallback.') from None

if __name__=='__main__': asyncio.run(main())
