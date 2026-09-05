/* My Arcane Library v13.1 live hotfix: shelf safety + cloud reconciliation */
(function(){
  const esc2=s=>String(s??"").replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  function bind(){
    ["booksHome","booksAll"].forEach(id=>{
      const el=document.getElementById(id); if(!el||el.dataset.shelfHotfix)return;
      el.dataset.shelfHotfix="1";
      el.addEventListener("click",function(e){
        const card=e.target.closest(".shelfBook[data-book-id],.book[data-book-id]");
        if(!card||!el.contains(card))return;
        e.preventDefault(); e.stopImmediatePropagation();
        if(typeof window.openDetail==='function')window.openDetail(card.dataset.bookId);
      },true);
    });
  }
  const originalRender=window.renderBooks;
  if(typeof originalRender==='function'){
    window.renderBooks=function(){ originalRender.apply(this,arguments); bind(); };
  }
  bind();
  window.addEventListener('load',bind);
})();
