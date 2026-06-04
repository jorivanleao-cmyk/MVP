const tokenKey = 'recepcionista_admin_token';
const tokenInput = document.getElementById('tokenInput');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const dashboard = document.getElementById('dashboard');
const loginSection = document.getElementById('loginSection');
const conversationList = document.getElementById('conversationList');
const appointmentList = document.getElementById('appointmentList');
const refreshButton = document.getElementById('refreshButton');
const logoutButton = document.getElementById('logoutButton');

function getToken() {
  return localStorage.getItem(tokenKey) || '';
}

function setToken(token) {
  localStorage.setItem(tokenKey, token);
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
}

function showLogin() {
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Erro ao carregar dados.');
  }

  return response.json();
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function renderConversations(conversations) {
  conversationList.innerHTML = '';

  if (!conversations.length) {
    conversationList.innerHTML = '<p>Nenhuma conversa encontrada.</p>';
    return;
  }

  conversations.forEach((conversation) => {
    const template = document.getElementById('conversationTemplate');
    const node = document.importNode(template.content, true);
    node.querySelector('.conversation-phone').textContent = conversation.phone;
    node.querySelector('.conversation-status').textContent = conversation.status;
    node.querySelector('.conversation-client').textContent = conversation.client?.phone ? `Cliente: ${conversation.client.phone}` : 'Cliente não cadastrado';

    const messagesEl = node.querySelector('.conversation-messages');
    conversation.messages.forEach((message) => {
      const row = document.createElement('div');
      row.className = 'message-content';
      row.innerHTML = `<span class="message-actor">${message.from}</span>${message.content}`;
      messagesEl.appendChild(row);
    });

    const takeoverButton = node.querySelector('.takeoverButton');
    const releaseButton = node.querySelector('.releaseButton');
    const replyButton = node.querySelector('.replyButton');
    const replyInput = node.querySelector('.replyInput');

    takeoverButton.addEventListener('click', () => handleTakeover(conversation.id));
    releaseButton.addEventListener('click', () => handleRelease(conversation.id));
    replyButton.addEventListener('click', () => handleReply(conversation.id, replyInput.value));

    conversationList.appendChild(node);
  });
}

function renderAppointments(appointments) {
  appointmentList.innerHTML = '';

  if (!appointments.length) {
    appointmentList.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
    return;
  }

  appointments.forEach((appointment) => {
    const item = document.createElement('div');
    item.className = 'appointment-item';
    item.innerHTML = `
      <p><strong>${appointment.service.name}</strong> para <strong>${appointment.client.phone}</strong></p>
      <p>${formatDate(appointment.date)} | ${appointment.startTime} - ${appointment.endTime}</p>
      <p>Status: ${appointment.status}</p>
    `;
    appointmentList.appendChild(item);
  });
}

async function refreshData() {
  try {
    const [conversationsData, appointmentsData] = await Promise.all([
      fetchJson('/conversations', { headers: authHeaders() }),
      fetchJson('/appointments', { headers: authHeaders() }),
    ]);

    renderConversations(conversationsData.conversations || []);
    renderAppointments(appointmentsData.appointments || []);
  } catch (error) {
    loginError.textContent = error.message;
    if (error.message.includes('Não autorizado')) {
      clearToken();
      showLogin();
    }
  }
}

async function handleTakeover(id) {
  await fetchJson(`/conversations/${id}/takeover`, { method: 'PATCH', headers: authHeaders() });
  await refreshData();
}

async function handleRelease(id) {
  await fetchJson(`/conversations/${id}/release`, { method: 'PATCH', headers: authHeaders() });
  await refreshData();
}

async function handleReply(id, message) {
  if (!message.trim()) {
    loginError.textContent = 'Informe a mensagem antes de enviar.';
    return;
  }

  await fetchJson(`/conversations/${id}/reply`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });

  await refreshData();
}

loginButton.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  if (!token) {
    loginError.textContent = 'Informe o token administrativo.';
    return;
  }

  setToken(token);
  try {
    await refreshData();
    loginError.textContent = '';
    showDashboard();
  } catch (error) {
    loginError.textContent = error.message;
    clearToken();
  }
});

logoutButton.addEventListener('click', () => {
  clearToken();
  showLogin();
});

refreshButton.addEventListener('click', refreshData);

(function init() {
  const currentToken = getToken();
  if (currentToken) {
    tokenInput.value = currentToken;
    refreshData().then(showDashboard).catch(() => showLogin());
  }
})();
