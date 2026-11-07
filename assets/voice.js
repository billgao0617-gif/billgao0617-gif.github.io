// Demonstrates the supplied recognition vocabulary; no microphone or hardware connection.
(() => {
  const groups = [
    {en:'Attachment',zh:'接头',commands:[[5,'开锁','Unlock']]},
    {en:'Operating mode',zh:'工作模式',commands:[[6,'自动模式','Automatic mode'],[7,'手动模式','Manual mode']]},
    {en:'Direction',zh:'作业方向',commands:[[8,'紧固','Tighten'],[9,'松开','Loosen']]},
    {en:'Rotation',zh:'转动圈数',commands:[[10,'转动半圈','Half a turn'],[11,'转动一圈','One turn'],[12,'转动两圈','Two turns'],[13,'转动三圈','Three turns']]},
    {en:'Speed',zh:'速度档位',commands:[[14,'速度一档','Speed level 1'],[15,'速度二档','Speed level 2'],[16,'速度三档','Speed level 3']]},
    {en:'Torque',zh:'扭矩档位',commands:[[17,'扭矩一档','Torque level 1'],[18,'扭矩二档','Torque level 2'],[19,'扭矩三档','Torque level 3']]}
  ];
  const commands=groups.flatMap(group=>group.commands);
  const text=(en,zh)=>window.siteLanguage?.()==='zh'?zh:en;
  const controlSources=new WeakMap();
  const controlTranslations={'LCD / OUTPUT FEEDBACK':'LCD / 输出反馈','Direction':'松紧方向','Torque':'扭矩','Speed':'速度','Turn target':'目标圈数','Turn counter':'已转圈数','D10 direction':'D10 输出方向','Drill direction input':'电钻方向输入','Select direction':'选择方向','Tighten · CW':'紧固 · 顺时针','Loosen · CCW':'松开 · 逆时针','Drill speed input':'电钻速度输入','Browser simulation only. Animation speed is illustrative; no physical RPM or D10 HIGH/LOW polarity is assigned.':'浏览器逻辑演示。动画速度仅作示意，不代表实际转速；D10 的高低电平映射未指定。'};
  const widgets=[...document.querySelectorAll('[data-voice-demo]')].map(element=>({element,awake:false,selected:5,applied:null,mode:'manual',torque:null,direction:null,manualDirection:null,speed:null,turns:null,trigger:false,count:0,phase:0,unlocked:false,stopped:false,blocked:false,manualSpeed:50}));
  function publish(widget){
    if(!widget.element.querySelector('[data-voice-controls]'))return;
    const wake=document.querySelector('[data-voice-wake-short]'),trigger=document.querySelector('[data-voice-trigger-short]');
    if(wake){wake.textContent=text(widget.awake?'智能工具 · Awake':'智能工具 · Wake',widget.awake?'智能工具 · 已唤醒':'智能工具 · 唤醒');wake.disabled=widget.awake;}
    if(trigger){trigger.textContent=text(widget.trigger?'Release trigger':'Press trigger',widget.trigger?'松开扳机':'按下扳机');trigger.setAttribute('aria-pressed',String(widget.trigger));}
    const {element,...state}=widget;window.dispatchEvent(new CustomEvent('voice-tool-state',{detail:state}));
  }
  function render(widget){
    const {element}=widget;
    const assign=(name,value)=>{const node=element.querySelector(`[data-voice-${name}]`);if(node)node.textContent=value;};
    (element.closest('#voice')||element).querySelectorAll('[data-session-en]').forEach(node=>node.textContent=text(node.dataset.sessionEn,node.dataset.sessionZh));
    if(element.hasAttribute('data-voice-session')){
      element.querySelector('[data-voice-cover]').hidden=widget.awake;
      element.querySelector('[data-voice-workspace]').hidden=!widget.awake;
      element.querySelectorAll('.voice-command-button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.command)===widget.applied)));
    }
    assign('label',text('VOICE / COMMAND DEMO','语音 / 指令演示'));
    assign('wake-label',text('Wake phrase · ID: 1','唤醒词 · ID: 1'));
    assign('phrase','智能工具');
    assign('state',text(widget.awake?'AWAKE':'WAITING FOR WAKE',widget.awake?'已唤醒':'等待唤醒'));
    assign('wake',text(widget.awake?'Awake':'Wake demo',widget.awake?'已唤醒':'唤醒演示'));
    assign('apply',text('Apply command','演示指令'));
    assign('reset',text('Reset','复位'));
    if(element.hasAttribute('data-voice-session')){assign('wake',text('Wake assistant','唤醒智能助手'));assign('reset',text('Restart assistant','重新唤醒'));}
    element.querySelector('[data-voice-wake]').disabled=widget.awake;
    if(element.querySelector('[data-voice-apply]'))element.querySelector('[data-voice-apply]').disabled=!widget.awake;
    element.classList.toggle('is-active',widget.awake);
    const select=element.querySelector('[data-voice-command]');
    if(select){select.setAttribute('aria-label',text('Voice command','语音指令'));
    select.replaceChildren(...groups.map(group=>{
      const optgroup=document.createElement('optgroup');optgroup.label=text(group.en,group.zh);
      for(const [id,zh,en] of group.commands){const option=document.createElement('option');option.value=id;option.textContent=`${text(`${zh} · ${en}`,zh)} · CMDID: ${id}`;optgroup.append(option);}
      return optgroup;
    }));
    select.value=widget.selected;}
    const applied=commands.find(command=>command[0]===widget.applied);
    assign('result',widget.blocked?text('Release the trigger (0 V) before changing an automatic-mode setting.','自动模式下，请先松开扳机（0 V），再切换档位或功能。'):applied?text(`Command matched: ${applied[1]} · ${applied[2]} · CMDID: ${applied[0]}`,`指令匹配：${applied[1]} · CMDID: ${applied[0]}`):text(widget.awake?'Select a command, then apply it in the demo.':'Wake first, then select a command.',widget.awake?'选择指令，再点击演示。':'先唤醒，再选择指令。'));
    if(element.hasAttribute('data-voice-session')&&!widget.applied)assign('result',text('Click a command to see the tool respond.','直接点击指令，观察工具响应。'));
    if(element.hasAttribute('data-voice-session')&&widget.applied>=10&&widget.applied<=16&&!widget.direction)assign('result',text('Setting applied. Choose Tighten or Loosen to demonstrate motion.','设置已应用。点击“紧固”或“松开”，开始运动演示。'));
    assign('note',text('Interface simulation · Original Chinese phrases are the recognition vocabulary.','界面交互示意 · 展示实际中文识别词条'));
    renderControls(widget);
    publish(widget);
  }
  function enterAuto(widget){
    if(widget.mode==='auto')return;
    widget.mode='auto';widget.speed=1;widget.turns=.5;widget.count=0;widget.stopped=false;
  }
  function applyCommand(widget){
    if(!widget.awake)return;
    if(widget.mode==='auto'&&widget.trigger){widget.blocked=true;render(widget);return;}
    widget.blocked=false;widget.applied=widget.selected;
    const id=widget.selected;
    if(id===5)widget.unlocked=true;
    if(id===6||(id>=8&&id<=16))enterAuto(widget);
    if(id===7){widget.mode='manual';widget.direction=widget.manualDirection;widget.count=0;widget.stopped=false;}
    if(id===8)widget.direction='tighten';
    if(id===9)widget.direction='loosen';
    if(id>=10&&id<=13)widget.turns=[.5,1,2,3][id-10];
    if(id>=14&&id<=16)widget.speed=id-13;
    if(id>=17&&id<=19)widget.torque=id-16;
    if(widget.element.hasAttribute('data-voice-session')&&id>=8&&id<=16&&widget.direction){widget.trigger=true;widget.autoDemo=true;widget.count=0;widget.stopped=false;widget.releaseAt=0;}
    render(widget);
  }
  function renderControls(widget){
    const controls=widget.element.querySelector('[data-voice-controls]');if(!controls)return;
    const walker=document.createTreeWalker(controls,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;if(!controlSources.has(node))controlSources.set(node,node.nodeValue);
      const source=controlSources.get(node);if(controlTranslations[source.trim()])node.nodeValue=text(source,controlTranslations[source.trim()]);
    }
    for(const input of controls.querySelectorAll('[aria-label]')){if(input.hasAttribute('data-manual-direction'))input.setAttribute('aria-label',text('Drill direction input','电钻方向输入'));if(input.hasAttribute('data-manual-speed'))input.setAttribute('aria-label',text('Drill speed input','电钻速度输入'));}
    const output=(name,value)=>{controls.querySelector(`[data-state-${name}]`).textContent=value;};
    output('mode',text(widget.mode==='auto'?'AUTOMATIC':'MANUAL',widget.mode==='auto'?'自动模式':'手动模式'));
    const direction=widget.direction?text(widget.direction==='tighten'?'Tighten · CW':'Loosen · CCW',widget.direction==='tighten'?'紧固 · 顺时针':'松开 · 逆时针'):text('Not supplied','待输入');
    output('direction',direction);output('d10',direction);
    output('torque',widget.torque?text(`Level ${widget.torque}`,`${widget.torque} 档`):text('Not supplied','待输入'));
    output('speed',widget.mode==='manual'?text('Drill input','电钻自身信号'):text(`Level ${widget.speed}`,`${widget.speed} 档`));
    output('turns',widget.mode==='auto'?text(`${widget.turns} turns`,`${widget.turns} 圈`):text('Drill control','电钻自身控制'));
    output('count',widget.count.toFixed(2));
    output('trigger',widget.trigger?text('PRESSED · nonzero input','已按下 · 非零输入'):text('RELEASED · 0 V','已松开 · 0 V'));
    output('motion',text(widget.stopped?'TARGET REACHED · STOPPED':widget.trigger&&widget.direction?'RUNNING':'STOPPED',widget.stopped?'达到圈数 · 已停止':widget.trigger&&widget.direction?'运行中':'已停止'));
    const trigger=controls.querySelector('[data-trigger-toggle]');trigger.textContent=text(widget.trigger?'Release trigger':'Press trigger',widget.trigger?'松开扳机':'按下扳机');trigger.setAttribute('aria-pressed',String(widget.trigger));
    const manual=controls.querySelector('[data-manual-direction]');manual.value=widget.direction||'';manual.disabled=widget.mode!=='manual';
    controls.querySelector('[data-manual-speed]').disabled=widget.mode!=='manual';
    controls.querySelector('[data-manual-speed]').value=widget.manualSpeed;
  }
  function renderCatalogue(){
    for(const catalogue of document.querySelectorAll('[data-voice-catalogue]')){
      catalogue.replaceChildren(...groups.map(group=>{
        const card=document.createElement('div');card.className='voice-command-group';
        const heading=document.createElement('h3');heading.textContent=text(group.en,group.zh);card.append(heading);
        const list=document.createElement('ul');
        for(const [id,zh,en] of group.commands){
          const item=document.createElement('li');const button=document.createElement('button');button.type='button';button.className='voice-command-button';button.dataset.command=id;button.style.setProperty('--command-order',id-5);button.setAttribute('aria-pressed',String(widgets[0]?.applied===id));button.setAttribute('aria-label',text(`${zh} · ${en} · CMDID: ${id}`,`${zh} · CMDID: ${id}`));const label=document.createElement('span');label.textContent=zh;
          if(window.siteLanguage?.()!=='zh'){const meaning=document.createElement('small');meaning.textContent=en;label.append(meaning);}
          const code=document.createElement('code');code.textContent=`CMDID: ${id}`;button.append(label,code);item.append(button);list.append(item);
          button.addEventListener('click',()=>{for(const widget of widgets){widget.selected=id;applyCommand(widget);if(!widget.awake){widget.element.querySelector('[data-voice-result]').textContent=text('Wake with “智能工具” before applying this command.','请先用“智能工具”唤醒，再执行此指令。');widget.element.querySelector('[data-voice-wake]').focus({preventScroll:true});}}});
        }
        card.append(list);return card;
      }));
      if(catalogue.hasAttribute('data-voice-tiles')){const buttons=[...catalogue.querySelectorAll('button')];catalogue.replaceChildren(...buttons);}
    }
  }
  for(const widget of widgets){
    widget.element.querySelector('[data-voice-wake]').addEventListener('click',()=>{widget.awake=true;render(widget);if(widget.element.hasAttribute('data-voice-session')){widget.element.querySelector('.voice-command-button')?.focus({preventScroll:true});widget.element.closest('#voice').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
    widget.element.querySelector('[data-voice-command]')?.addEventListener('change',event=>{widget.selected=Number(event.target.value);widget.applied=null;render(widget);});
    widget.element.querySelector('[data-voice-apply]')?.addEventListener('click',()=>applyCommand(widget));
    widget.element.querySelector('[data-voice-reset]').addEventListener('click',()=>{Object.assign(widget,{awake:false,selected:5,applied:null,mode:'manual',torque:null,direction:null,manualDirection:null,speed:null,turns:null,trigger:false,count:0,phase:0,unlocked:false,stopped:false,blocked:false,autoDemo:false,releaseAt:0,manualSpeed:50});render(widget);});
    widget.element.querySelector('[data-trigger-toggle]')?.addEventListener('click',()=>{
      widget.trigger=!widget.trigger;
      widget.autoDemo=false;widget.releaseAt=0;
      if(!widget.trigger){widget.count=0;widget.stopped=false;widget.blocked=false;}
      render(widget);
    });
    widget.element.querySelector('[data-manual-direction]')?.addEventListener('change',event=>{if(widget.mode==='manual'){widget.direction=widget.manualDirection=event.target.value||null;renderControls(widget);publish(widget);}});
    widget.element.querySelector('[data-manual-speed]')?.addEventListener('input',event=>{if(widget.mode==='manual'){widget.manualSpeed=Number(event.target.value);renderControls(widget);}});
  }
  const controlled=widgets.find(widget=>widget.element.querySelector('[data-voice-controls]'));
  document.querySelector('[data-voice-wake-short]')?.addEventListener('click',()=>{controlled.awake=true;render(controlled);});
  document.querySelector('[data-voice-trigger-short]')?.addEventListener('click',()=>{controlled.autoDemo=false;controlled.releaseAt=0;controlled.trigger=!controlled.trigger;if(!controlled.trigger){controlled.count=0;controlled.stopped=false;controlled.blocked=false;}render(controlled);});
  setInterval(()=>{
    for(const widget of widgets){
      if(widget.autoDemo&&widget.releaseAt&&performance.now()>=widget.releaseAt){widget.trigger=false;widget.count=0;widget.stopped=false;widget.blocked=false;widget.autoDemo=false;widget.releaseAt=0;render(widget);continue;}
      if(!widget.trigger||!widget.direction||widget.stopped||!widget.element.querySelector('[data-voice-controls]'))continue;
      // Illustrative rate only, unrelated to actual RPM or electrical output.
      const delta=Math.max(0,widget.mode==='auto'?Math.min(.025*widget.speed,widget.turns-widget.count):.075*widget.manualSpeed/100);
      widget.count+=delta;
      widget.phase+=delta*Math.PI*2*(widget.direction==='tighten'?-1:1);
      if(widget.mode==='auto'&&widget.count>=widget.turns){widget.count=widget.turns;widget.stopped=true;if(widget.autoDemo)widget.releaseAt=performance.now()+1000;}
      renderControls(widget);
      publish(widget);
    }
  },100);
  const renderAll=()=>{widgets.forEach(render);renderCatalogue();};
  window.addEventListener('site-language-change',renderAll);
  window.addEventListener('cad-voice-ready',()=>widgets.forEach(publish));
  renderAll();
})();
