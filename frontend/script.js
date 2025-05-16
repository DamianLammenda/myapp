document.getElementById('accessForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value
  };

  const res = await fetch('/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    alert('✅ Solicitud enviada. Te contactaremos pronto.');
    form.reset();
  } else {
    alert('❌ Error al enviar solicitud.');
  }
});
