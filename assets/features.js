// Small previews of the proposed interface; no hardware is connected.
const featureText=(en,zh)=>window.siteLanguage?.()==='zh'?zh:en;
let previewHead='scissors',retentionChecked=false,lcdStep=0;
const setFeatureText=(id,en,zh)=>{const node=document.getElementById(id);if(node)node.textContent=featureText(en,zh);};
function renderFeatureInterfaces(){
  setFeatureText('heads-preview-label','TASK HEAD','任务接头');
  const heads={scissors:['Scissors','剪切头','CUT','剪切','Cut suitable material','剪切适用材料'],pliers:['Pliers','钳头','GRIP','抓取','Grip and handle parts','抓取与操作部件'],driver:['Nut driver','螺母头','TURN','旋拧','Turn compatible nuts','旋拧兼容螺母']};
  const entry=heads[previewHead];setFeatureText('heads-preview-state',entry[2],entry[3]);setFeatureText('head-preview-task',entry[4],entry[5]);
  document.querySelectorAll('[data-preview-head]').forEach(button=>{const values=heads[button.dataset.previewHead];button.textContent=featureText(values[0],values[1]);button.setAttribute('aria-pressed',String(button.dataset.previewHead===previewHead));});
  setFeatureText('head-preview-link-label','View working head','查看对应接头');
  document.getElementById('head-preview-link')?.setAttribute('href',`/smarttorque/?head=${previewHead}#explore`);
  setFeatureText('retention-preview-label','TETHER PATH','系留连接');
  setFeatureText('retention-preview-state',retentionChecked?'CONNECTED':'CHECK',retentionChecked?'连接已确认':'待确认');
  setFeatureText('retention-collar-label','Printed collar','打印扣环');setFeatureText('retention-ring-label','Curved ring','弧形环扣');
  setFeatureText('retention-preview-button',retentionChecked?'Reset check':'Verify connection',retentionChecked?'重新检查':'确认连接');
  document.getElementById('retention-preview-button')?.setAttribute('aria-pressed',String(retentionChecked));
  setFeatureText('lcd-preview-label','LCD / FEEDBACK','LCD / 状态反馈');
  const states=[['READY','待作业'],['RUNNING','运行中'],['STOPPED','已停止']];
  setFeatureText('lcd-preview-state',...states[lcdStep]);
  setFeatureText('lcd-torque-label','TORQUE','扭矩');setFeatureText('lcd-speed-label','SPEED','转速');setFeatureText('lcd-turns-label','TURNS','圈数');
  document.querySelectorAll('[data-lcd-preset]').forEach(node=>node.textContent=featureText('PRESET','已预设'));
  setFeatureText('lcd-preview-button','Next status','切换工作状态');
}
document.querySelectorAll('[data-preview-head]').forEach(button=>button.addEventListener('click',()=>{previewHead=button.dataset.previewHead;renderFeatureInterfaces();}));
document.getElementById('retention-preview-button')?.addEventListener('click',()=>{retentionChecked=!retentionChecked;renderFeatureInterfaces();});
document.getElementById('lcd-preview-button')?.addEventListener('click',()=>{lcdStep=(lcdStep+1)%3;renderFeatureInterfaces();});
document.querySelectorAll('.interface-status strong,.head-preview-task').forEach(node=>node.setAttribute('aria-live','polite'));
window.addEventListener('site-language-change',renderFeatureInterfaces);
renderFeatureInterfaces();
