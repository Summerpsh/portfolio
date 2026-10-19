(() => {
  const rd = document.getElementById('rubricDialog');
  document.querySelectorAll('[data-open-rubric]').forEach(b => b.addEventListener('click', () => {
    rd.showModal();
    rd.querySelector('.rubric-content').scrollTop = 0;
  }));
  document.getElementById('closeRubric').addEventListener('click', () => rd.close());
  document.getElementById('backToGame').addEventListener('click', () => rd.close());
  document.getElementById('referenceHours').innerHTML = products.map(x =>
    '<tr><th scope="row">' + x.name + '</th><td>' + window.RoomAssessment.referenceHours(x) + '시간</td></tr>').join('');
})();
