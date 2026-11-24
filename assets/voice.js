// SmartTorque's local command catalogue uses the supplied recognition phrases.
(() => {
  const session = document.querySelector('[data-voice-session]');
  if (!session) return;

  const groups = [
    ['Attachment','接头',[[5,'开锁','Unlock']]],
    ['Operating mode','工作模式',[[6,'自动模式','Automatic mode'],[7,'手动模式','Manual mode']]],
    ['Direction','作业方向',[[8,'紧固','Tighten'],[9,'松开','Loosen']]],
    ['Rotation','转动圈数',[[10,'转动半圈','Half a turn'],[11,'转动一圈','One turn'],[12,'转动两圈','Two turns'],[13,'转动三圈','Three turns']]],
    ['Speed','速度档位',[[14,'速度一档','Speed level 1'],[15,'速度二档','Speed level 2'],[16,'速度三档','Speed level 3']]],
    ['Torque','扭矩档位',[[17,'扭矩一档','Torque level 1'],[18,'扭矩二档','Torque level 2'],[19,'扭矩三档','Torque level 3']]]
  ];

  const cover = session.querySelector('[data-voice-cover]');
  const workspace = session.querySelector('[data-voice-workspace]');
  const wake = session.querySelector('[data-voice-wake]');
  const reset = session.querySelector('[data-voice-reset]');
  const catalogue = session.querySelector('[data-voice-catalogue]');
  const result = session.querySelector('[data-voice-result]');
  const announcement = session.querySelector('[data-voice-announcement]');
  const canvas = session.querySelector('[data-voice-wave]');
  const context = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const localText = (en,zh) => document.documentElement.lang.startsWith('zh') ? zh : en;

  const commandLabels = new Map();
  const groupLabels = [];
  let state = 'idle', selected = null;
  let width = 0, height = 0, layers = [];

  for (const [en,zh,commands] of groups) {
    const card = document.createElement('section');
    card.className = 'voice-command-set';
    const heading = document.createElement('h4');
    heading.id = `voice-group-${commands[0][0]}`;
    card.setAttribute('aria-labelledby',heading.id);
    groupLabels.push({heading,en,zh});
    const list = document.createElement('ul');

    for (const command of commands) {
      const [id,phrase] = command;
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'voice-command-key';
      button.dataset.command = String(id);
      button.setAttribute('aria-pressed','false');

      const label = document.createElement('span');
      const chinese = document.createElement('strong');
      chinese.lang = 'zh-CN';
      chinese.textContent = phrase;
      const meaning = document.createElement('small');
      label.append(chinese,meaning);

      const code = document.createElement('code');
      code.textContent = `ID ${String(id).padStart(2,'0')}`;
      button.append(label,code);
      item.append(button);
      list.append(item);
      commandLabels.set(id,{button,meaning,command});

      button.addEventListener('click',() => {
        commandLabels.get(selected?.[0])?.button.setAttribute('aria-pressed','false');
        selected = command;
        button.setAttribute('aria-pressed','true');
        updateResult();
      });
    }
    card.append(heading,list);
    catalogue.append(card);
  }

  function updateResult() {
    result.toggleAttribute('data-matched',Boolean(selected));
    if (selected) {
      const [id,zh,en] = selected;
      result.textContent = localText(`Recognized · ${zh} · ${en} · ID ${id}`,`已识别 · ${zh} · 指令 ID ${id}`);
    } else {
      result.textContent = localText('Select a command to check its recognition result.','点击任一指令，查看识别结果。');
    }
  }

  function localize() {
    for (const label of session.querySelectorAll('[data-session-en]')) {
      label.textContent = localText(label.dataset.sessionEn,label.dataset.sessionZh);
    }
    for (const {heading,en,zh} of groupLabels) heading.textContent = localText(en,zh);
    for (const {button,meaning,command:[id,zh,en]} of commandLabels.values()) {
      meaning.textContent = en;
      meaning.hidden = document.documentElement.lang.startsWith('zh');
      button.setAttribute('aria-label',localText(`${en} · ${zh} · command ${id}`,`${zh} · 指令 ${id}`));
    }
    wake.textContent = state === 'waking' ? localText('Waking…','正在唤醒…') : localText('Wake Assistant','唤醒助手');
    updateResult();
  }

  function setWaveSize() {
    if (!context || cover.hidden) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1,2);
    canvas.width = Math.round(width*ratio);
    canvas.height = Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    const dark = document.documentElement.dataset.theme !== 'light';
    const colors = dark ? ['88,199,255','130,150,251','135,247,239'] : ['30,117,170','85,91,179','27,139,142'];
    layers = colors.map((color,index) => {
      const gradient = context.createLinearGradient(0,0,width,0);
      gradient.addColorStop(0,`rgba(${color},0)`);
      gradient.addColorStop(.28,`rgba(${color},.49)`);
      gradient.addColorStop(.53,`rgba(${color},${index === 2 ? 1 : .74})`);
      gradient.addColorStop(.77,`rgba(${color},.51)`);
      gradient.addColorStop(1,`rgba(${color},0)`);
      return {gradient,color};
    });
    paintWave(0,0);
  }

  function paintWave(time,strength) {
    if (!context || width === 0) return;
    context.clearRect(0,0,width,height);
    const amplitude = Math.min(34,height*.37) * strength;
    const middle = height/2;
    for (let layer = 0; layer < layers.length; layer++) {
      const {gradient,color} = layers[layer];
      context.beginPath();
      for (let step = 0; step <= 144; step++) {
        const position = step/144;
        const envelope = Math.sin(Math.PI*position)**2.5;
        const phase = position*22 - time*11 + layer*.92;
        const ripple = Math.sin(phase)*.63 + Math.sin(position*47-time*17-layer*.7)*.23;
        const y = middle + envelope * (amplitude*(.83+layer*.09)*ripple + Math.sin(position*12)*(.7+layer*.32));
        if (step === 0) context.moveTo(0,y);
        else context.lineTo(position*width,y);
      }
      context.lineWidth = layer === 2 ? 1.7 : 1.13;
      context.strokeStyle = gradient;
      context.globalAlpha = .48 + strength*.52;
      context.shadowColor = `rgba(${color},${strength*.72})`;
      context.shadowBlur = strength*(layer === 2 ? 12 : 6);
      context.stroke();
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  function openCommands() {
    state = 'ready';
    cover.hidden = true;
    workspace.hidden = false;
    wake.setAttribute('aria-expanded','true');
    session.removeAttribute('data-waking');
    workspace.querySelector('h3').focus({preventScroll:true});
  }

  wake.addEventListener('click',() => {
    if (state !== 'idle') return;
    state = 'waking';
    session.setAttribute('data-waking','');
    wake.setAttribute('aria-disabled','true');
    announcement.textContent = localText('Assistant waking.','正在唤醒助手。');
    localize();
    if (reducedMotion.matches || !context) {
      paintWave(.3,.66);
      window.setTimeout(openCommands,210);
      return;
    }

    const start = performance.now();
    function animate(now) {
      const fraction = Math.min(1,(now-start)/990);
      const pulse = Math.sin(Math.PI * fraction)**.76;
      paintWave((now-start)/1000,pulse);
      if (fraction < 1) requestAnimationFrame(animate);
      else openCommands();
    }
    requestAnimationFrame(animate);
  });

  reset.addEventListener('click',() => {
    state = 'idle';
    commandLabels.get(selected?.[0])?.button.setAttribute('aria-pressed','false');
    selected = null;
    announcement.textContent = '';
    workspace.hidden = true;
    cover.hidden = false;
    wake.setAttribute('aria-expanded','false');
    wake.removeAttribute('aria-disabled');
    localize();
    setWaveSize();
    wake.focus({preventScroll:true});
  });

  new ResizeObserver(setWaveSize).observe(canvas);
  window.addEventListener('site-theme-change',setWaveSize);
  window.addEventListener('site-language-change',localize);
  localize();
  setWaveSize();
})();
