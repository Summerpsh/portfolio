(() => {
  const dialog=document.getElementById('studentDialog'),form=document.getElementById('studentForm');
  const number=document.getElementById('studentNumber'),name=document.getElementById('studentName'),error=document.getElementById('studentError');
  const chip=document.getElementById('editStudent'),cancel=document.getElementById('cancelStudent');
  let entering=true;
  function refreshChip(){chip.textContent=hasStudentInfo()?state.studentNumber+' · '+state.studentName+(state.nicknameChanged?' · 별명 확정':' · 별명 수정 (1회)'):'학번 · 별명 입력';chip.disabled=hasStudentInfo()&&!!state.nicknameChanged}

  function open(edit=false){if(edit&&state.nicknameChanged)return;entering=!edit;number.readOnly=edit&&hasStudentInfo();form.querySelector('p').innerHTML=edit?'별명은 처음 입력한 뒤 한 번만 변경할 수 있어요.<br>변경 후에는 새로 시작해도 다시 바꿀 수 없어요.':'학번과 별명을 입력하면 나만의 방을 만들 수 있어요.<br>별명은 이후 한 번만 변경할 수 있어요.';number.value=state.studentNumber;name.value=state.studentName;error.textContent='';cancel.hidden=entering||!hasStudentInfo();if(!dialog.open)dialog.showModal()}
  window.openStudentEntry=()=>open(false);
  chip.addEventListener('click',()=>open(true));
  cancel.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('cancel',event=>{if(entering||!hasStudentInfo())event.preventDefault()});
  const submitEntry=event=>{
    event&&event.preventDefault&&event.preventDefault();
    const studentNumber=number.value.trim().slice(0,20),studentName=name.value.trim().slice(0,20);
    if(!studentNumber||!studentName){error.textContent='학번과 별명을 모두 입력해 주세요.';(!studentNumber?number:name).focus();return}
    if(!entering&&studentNumber!==state.studentNumber){error.textContent='학번은 처음 입력한 값으로 유지돼요.';return}if(!entering&&studentName!==state.studentName){if(state.nicknameChanged){error.textContent='별명 변경 기회를 이미 사용했어요.';return}state.nicknameChanged=true}state.studentNumber=studentNumber;state.studentName=studentName;save();refreshChip();dialog.close();
  };
  form.addEventListener('submit',submitEntry);
  form.querySelector('.primary').addEventListener('click',e=>{e.preventDefault();submitEntry()});
  refreshChip();if(!hasStudentInfo())open(false);
})();
