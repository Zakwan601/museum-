// Test-only continuation of the pre-existing finale. The cake step deliberately
// defers it; production exposes no ceremony or ending trigger in step one.
export async function resumeExistingEnding(ev) {
  await ev(`(async()=>{
    const f=await import(performance.getEntriesByType('resource').find(r=>r.name.includes('@react-three_fiber.js')).name);
    const stack=[f._roots.get(document.querySelector('canvas')).fiber.current];let props;
    while(stack.length){const n=stack.pop();if(!n)continue;if(n.memoizedProps?.ending&&n.memoizedProps?.onEndingChange){props=n.memoizedProps;break;}stack.push(n.child,n.sibling);}
    if(!props)throw Error('Museum scene not found');
    for(let i=0;i<240&&props.kiss.active;i++)await new Promise(r=>setTimeout(r,100));
    if(props.ending.phase==='cake'){
      props.ending.startedAt=performance.now();props.ending.cameraCaptured=false;
      props.onEndingChange('pullback');
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    }
  })()`);
}
