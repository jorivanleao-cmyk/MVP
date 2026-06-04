const tokenKey = 'recepcionista_admin_token'
const tokenInput = document.getElementById('tokenInput')
const loginButton = document.getElementById('loginButton')
const loginError = document.getElementById('loginError')
const dashboard = document.getElementById('dashboard')
const loginSection = document.getElementById('loginSection')
const conversationList = document.getElementById('conversationList')
const appointmentList = document.getElementById('appointmentList')
const refreshButton = document.getElementById('refreshButton')
const logoutButton = document.getElementById('logoutButton')
const calendarStatusText = document.getElementById('calendarStatusText')
const connectCalendarButton = document.getElementById('connectCalendarButton')
const refreshCalendarButton = document.getElementById('refreshCalendarButton')
const reconcileCalendarButton = document.getElementById(
  'reconcileCalendarButton',
)
const calendarEventList = document.getElementById('calendarEventList')
const calendarError = document.getElementById('calendarError')
const calendarInfo = document.getElementById('calendarInfo')
const calendarSummary = document.getElementById('calendarSummary')
const calendarDescription = document.getElementById('calendarDescription')
const calendarDate = document.getElementById('calendarDate')
const calendarStartTime = document.getElementById('calendarStartTime')
const calendarEndTime = document.getElementById('calendarEndTime')
const createCalendarEventButton = document.getElementById(
  'createCalendarEventButton',
)
const systemClock = document.getElementById('systemClock')
const tabButtons = document.querySelectorAll('.tab-button')
const calendarSection = document.getElementById('calendarSection')
const conversationSection = document.getElementById('conversationSection')
const appointmentSection = document.getElementById('appointmentSection')
const calendarBadge = document.getElementById('calendarBadge')
const conversationBadge = document.getElementById('conversationBadge')
const appointmentBadge = document.getElementById('appointmentBadge')
const serviceList = document.getElementById('serviceList')
const clientList = document.getElementById('clientList')
const appointmentClientSelect = document.getElementById(
  'appointmentClientSelect',
)
const appointmentServiceSelect = document.getElementById(
  'appointmentServiceSelect',
)
const appointmentDateInput = document.getElementById('appointmentDateInput')
const appointmentStartInput = document.getElementById('appointmentStartInput')
const appointmentEndInput = document.getElementById('appointmentEndInput')
const appointmentNotes = document.getElementById('appointmentNotes')
const createAppointmentButton = document.getElementById(
  'createAppointmentButton',
)
const serviceName = document.getElementById('serviceName')
const serviceDescription = document.getElementById('serviceDescription')
const serviceDuration = document.getElementById('serviceDuration')
const servicePrice = document.getElementById('servicePrice')
const serviceRequiresEvaluation = document.getElementById(
  'serviceRequiresEvaluation',
)
const createServiceButton = document.getElementById('createServiceButton')
const clientPhone = document.getElementById('clientPhone')
const clientName = document.getElementById('clientName')
const clientEmail = document.getElementById('clientEmail')
const createClientButton = document.getElementById('createClientButton')

function getToken() {
  return localStorage.getItem(tokenKey) || ''
}

function setToken(token) {
  localStorage.setItem(tokenKey, token)
}

function clearToken() {
  localStorage.removeItem(tokenKey)
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

function showDashboard() {
  loginSection.classList.add('hidden')
  dashboard.classList.remove('hidden')
}

function showLogin() {
  loginSection.classList.remove('hidden')
  dashboard.classList.add('hidden')
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Erro ao carregar dados.')
  }

  return response.json()
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function renderConversations(conversations) {
  conversationList.innerHTML = ''

  if (!conversations.length) {
    conversationList.innerHTML = '<p>Nenhuma conversa encontrada.</p>'
    return
  }

  conversations.forEach((conversation) => {
    const template = document.getElementById('conversationTemplate')
    const node = document.importNode(template.content, true)
    node.querySelector('.conversation-phone').textContent = conversation.phone
    node.querySelector('.conversation-status').textContent = conversation.status
    node.querySelector('.conversation-client').textContent = conversation.client
      ?.phone
      ? `Cliente: ${conversation.client.phone}`
      : 'Cliente não cadastrado'

    const messagesEl = node.querySelector('.conversation-messages')
    conversation.messages.forEach((message) => {
      const row = document.createElement('div')
      row.className = 'message-content'
      row.innerHTML = `<span class="message-actor">${message.from}</span>${message.content}`
      messagesEl.appendChild(row)
    })

    const takeoverButton = node.querySelector('.takeoverButton')
    const releaseButton = node.querySelector('.releaseButton')
    const replyButton = node.querySelector('.replyButton')
    const replyInput = node.querySelector('.replyInput')

    takeoverButton.addEventListener('click', () =>
      handleTakeover(conversation.id),
    )
    releaseButton.addEventListener('click', () =>
      handleRelease(conversation.id),
    )
    replyButton.addEventListener('click', () =>
      handleReply(conversation.id, replyInput.value),
    )

    conversationList.appendChild(node)
  })
}

function renderAppointments(appointments) {
  appointmentList.innerHTML = ''

  if (!appointments.length) {
    appointmentList.innerHTML = '<p>Nenhum agendamento encontrado.</p>'
    return
  }

  appointments.forEach((appointment) => {
    const item = document.createElement('div')
    item.className = 'appointment-item'
    item.innerHTML = `
      <p><strong>${appointment.service.name}</strong> para <strong>${appointment.client.phone}</strong></p>
      <p>${formatDate(appointment.date)} | ${appointment.startTime} - ${appointment.endTime}</p>
      <p>Status: ${appointment.status}</p>
      <p>${appointment.googleEventId ? `Google Event ID: ${appointment.googleEventId}` : 'Nenhum evento do Google vinculado'}</p>
    `
    appointmentList.appendChild(item)
  })
}

function renderServices(services) {
  serviceList.innerHTML = ''

  if (!services.length) {
    serviceList.innerHTML = '<p>Nenhum serviço cadastrado.</p>'
    return
  }

  services.forEach((service) => {
    const item = document.createElement('div')
    item.className = 'service-item'
    item.innerHTML = `
      <p><strong>${service.name}</strong> — R$ ${service.priceFrom.toFixed(2)}</p>
      <p>${service.description}</p>
      <p>Duração: ${service.durationMinutes} min</p>
    `
    serviceList.appendChild(item)
  })
}

function renderClients(clients) {
  clientList.innerHTML = ''

  if (!clients.length) {
    clientList.innerHTML = '<p>Nenhum cliente cadastrado.</p>'
    return
  }

  clients.forEach((client) => {
    const item = document.createElement('div')
    item.className = 'client-item'
    item.innerHTML = `
      <p><strong>${client.name || client.phone}</strong></p>
      <p>${client.phone}</p>
      <p>${client.email || 'Sem email'}</p>
    `
    clientList.appendChild(item)
  })
}

function updateTabBadges(
  conversationCount,
  appointmentCount,
  calendarAlertCount,
) {
  if (conversationBadge) {
    conversationBadge.textContent = String(conversationCount)
    conversationBadge.style.display = conversationCount ? 'inline-flex' : 'none'
  }
  if (appointmentBadge) {
    appointmentBadge.textContent = String(appointmentCount)
    appointmentBadge.style.display = appointmentCount ? 'inline-flex' : 'none'
  }
  if (calendarBadge) {
    calendarBadge.textContent = String(calendarAlertCount)
    calendarBadge.style.display = calendarAlertCount ? 'inline-flex' : 'none'
  }
}

async function refreshData() {
  calendarError.textContent = ''
  calendarInfo.textContent = ''
  try {
    const [
      conversationsData,
      appointmentsData,
      calendarData,
      calendarEventsData,
      servicesData,
      clientsData,
    ] = await Promise.all([
      fetchJson('/conversations', { headers: authHeaders() }),
      fetchJson('/appointments', { headers: authHeaders() }),
      fetchJson('/calendar/status', { headers: authHeaders() }).catch(
        () => null,
      ),
      fetchJson('/calendar/events', { headers: authHeaders() }).catch(() => ({
        events: [],
      })),
      fetchJson('/services', { headers: authHeaders() }),
      fetchJson('/clients', { headers: authHeaders() }),
    ])

    renderConversations(conversationsData.conversations || [])
    renderAppointments(appointmentsData.appointments || [])
    renderCalendarEvents(calendarEventsData.events || [])
    renderServices(servicesData.services || [])
    renderClients(clientsData.clients || [])
    populateAppointmentSelects(
      servicesData.services || [],
      clientsData.clients || [],
    )

    const conversationCount = (conversationsData.conversations || []).length
    const appointmentCount = (appointmentsData.appointments || []).filter(
      (a) => a.status === 'pending',
    ).length
    const calendarAlertCount = (calendarEventsData.events || []).filter(
      (event) => !event.linked,
    ).length
    updateTabBadges(conversationCount, appointmentCount, calendarAlertCount)

    if (calendarData && calendarData.connected) {
      calendarStatusText.textContent = `Conectado ao Google Calendar`
      connectCalendarButton.textContent = 'Reautenticar Google Calendar'
    } else {
      calendarStatusText.textContent = 'Não conectado ao Google Calendar.'
      connectCalendarButton.textContent = 'Conectar Google Calendar'
    }
  } catch (error) {
    calendarError.textContent = error.message
    if (error.message.includes('Não autorizado')) {
      clearToken()
      showLogin()
    }
  }
}

function renderCalendarEvents(events) {
  calendarEventList.innerHTML = ''

  if (!events.length) {
    calendarEventList.innerHTML = '<p>Nenhum evento encontrado.</p>'
    return
  }

  events.forEach((event) => {
    const item = document.createElement('div')
    item.className = 'calendar-event-item'
    const start = event.start?.dateTime || event.start?.date || 'Sem data'
    const linkedText = event.linked
      ? `Vinculado ao agendamento #${event.linkedAppointmentId}`
      : 'Não vinculado'
    const eventIdText = event.eventId
      ? `ID do evento: ${event.eventId}`
      : 'ID do evento não disponível'
    item.innerHTML = `
      <p><strong>${event.summary || 'Sem título'}</strong></p>
      <p>${new Date(start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
      <p>${event.description || ''}</p>
      <p>${eventIdText}</p>
      <p>${linkedText}</p>
    `
    calendarEventList.appendChild(item)
  })
}

function populateAppointmentSelects(services, clients) {
  if (appointmentServiceSelect) {
    appointmentServiceSelect.innerHTML =
      '<option value="">Selecione um serviço...</option>'
    services.forEach((service) => {
      const option = document.createElement('option')
      option.value = service.id
      option.textContent = `${service.name} — R$ ${service.priceFrom.toFixed(2)}`
      appointmentServiceSelect.appendChild(option)
    })
  }

  if (appointmentClientSelect) {
    appointmentClientSelect.innerHTML =
      '<option value="">Selecione um cliente...</option>'
    clients.forEach((client) => {
      const option = document.createElement('option')
      option.value = client.id
      option.textContent = `${client.name || client.phone} (${client.phone})`
      appointmentClientSelect.appendChild(option)
    })
  }
}

async function createService() {
  if (
    !serviceName.value.trim() ||
    !serviceDescription.value.trim() ||
    !serviceDuration.value ||
    !servicePrice.value
  ) {
    calendarError.textContent = 'Preencha todos os campos de serviço.'
    return
  }

  try {
    await fetchJson('/services', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: serviceName.value.trim(),
        description: serviceDescription.value.trim(),
        durationMinutes: Number(serviceDuration.value),
        priceFrom: Number(servicePrice.value),
        requiresEvaluation: serviceRequiresEvaluation.checked,
      }),
    })

    serviceName.value = ''
    serviceDescription.value = ''
    serviceDuration.value = ''
    servicePrice.value = ''
    serviceRequiresEvaluation.checked = true

    await refreshData()
  } catch (error) {
    calendarError.textContent = error.message
  }
}

async function createClient() {
  if (!clientPhone.value.trim()) {
    calendarError.textContent = 'O telefone do cliente é obrigatório.'
    return
  }

  try {
    await fetchJson('/clients', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        phone: clientPhone.value.trim(),
        name: clientName.value.trim(),
        email: clientEmail.value.trim(),
      }),
    })

    clientPhone.value = ''
    clientName.value = ''
    clientEmail.value = ''

    await refreshData()
  } catch (error) {
    calendarError.textContent = error.message
  }
}

async function createAppointment() {
  calendarError.textContent = ''

  const clientId = appointmentClientSelect.value
  const serviceId = appointmentServiceSelect.value
  const date = appointmentDateInput.value
  const startTime = appointmentStartInput.value
  const endTime = appointmentEndInput.value
  const notes = appointmentNotes.value.trim()

  if (!clientId || !serviceId || !date || !startTime || !endTime) {
    calendarError.textContent = 'Preencha todos os campos de agendamento.'
    return
  }

  try {
    await fetchJson('/appointments', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        clientId: Number(clientId),
        serviceId: Number(serviceId),
        date,
        startTime,
        endTime,
        notes,
      }),
    })

    appointmentClientSelect.value = ''
    appointmentServiceSelect.value = ''
    appointmentDateInput.value = ''
    appointmentStartInput.value = ''
    appointmentEndInput.value = ''
    appointmentNotes.value = ''

    await refreshData()
    activateTab('appointments')
  } catch (error) {
    calendarError.textContent = error.message
  }
}

async function connectCalendar() {
  try {
    const response = await fetch('/auth/google', { headers: authHeaders() })
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
      return
    }
    throw new Error('Não foi possível iniciar autenticação do Google Calendar.')
  } catch (error) {
    calendarError.textContent = error.message
  }
}

async function refreshCalendarEvents() {
  calendarError.textContent = ''
  calendarInfo.textContent = ''
  try {
    const calendarEventsData = await fetchJson('/calendar/events', {
      headers: authHeaders(),
    })
    renderCalendarEvents(calendarEventsData.events || [])
    calendarError.textContent = ''
  } catch (error) {
    calendarError.textContent = error.message
  }
}

async function handleReconcileCalendar() {
  calendarError.textContent = ''
  calendarInfo.textContent = ''
  try {
    const result = await fetchJson('/calendar/reconcile', {
      method: 'POST',
      headers: authHeaders(),
    })

    calendarInfo.textContent = `Reconciliação concluída. Eventos vinculados: ${result.linkedCount}.`
    await refreshCalendarEvents()
  } catch (error) {
    calendarError.textContent = error.message
  }
}

async function handleCreateCalendarEvent() {
  calendarError.textContent = ''
  const summary = calendarSummary.value.trim()
  const description = calendarDescription.value.trim()
  const date = calendarDate.value
  const startTime = calendarStartTime.value
  const endTime = calendarEndTime.value

  if (!summary || !date || !startTime || !endTime) {
    calendarError.textContent = 'Preencha título, data, hora de início e fim.'
    return
  }

  try {
    await fetchJson('/calendar/events', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ summary, description, date, startTime, endTime }),
    })

    calendarSummary.value = ''
    calendarDescription.value = ''
    calendarDate.value = ''
    calendarStartTime.value = ''
    calendarEndTime.value = ''

    await refreshCalendarEvents()
  } catch (error) {
    calendarError.textContent = error.message
  }
}

function updateClock() {
  if (!systemClock) return
  const now = new Date()
  systemClock.textContent = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function activateTab(tab) {
  const sections = {
    calendar: calendarSection,
    conversations: conversationSection,
    appointments: appointmentSection,
  }

  Object.keys(sections).forEach((sectionKey) => {
    const section = sections[sectionKey]
    if (!section) return
    section.classList.toggle('active-section', sectionKey === tab)
  })

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tab
    button.classList.toggle('active', isActive)
  })
}

async function handleTakeover(id) {
  await fetchJson(`/conversations/${id}/takeover`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  await refreshData()
}

async function handleRelease(id) {
  await fetchJson(`/conversations/${id}/release`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  await refreshData()
}

async function handleReply(id, message) {
  if (!message.trim()) {
    loginError.textContent = 'Informe a mensagem antes de enviar.'
    return
  }

  await fetchJson(`/conversations/${id}/reply`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  })

  await refreshData()
}

loginButton.addEventListener('click', async () => {
  const token = tokenInput.value.trim()
  if (!token) {
    loginError.textContent = 'Informe o token administrativo.'
    return
  }

  setToken(token)
  try {
    await refreshData()
    loginError.textContent = ''
    showDashboard()
  } catch (error) {
    loginError.textContent = error.message
    clearToken()
  }
})

logoutButton.addEventListener('click', () => {
  clearToken()
  showLogin()
})

refreshButton.addEventListener('click', refreshData)
connectCalendarButton.addEventListener('click', connectCalendar)
refreshCalendarButton.addEventListener('click', refreshCalendarEvents)
reconcileCalendarButton.addEventListener('click', handleReconcileCalendar)
createCalendarEventButton.addEventListener('click', handleCreateCalendarEvent)
createAppointmentButton.addEventListener('click', createAppointment)
createServiceButton.addEventListener('click', createService)
createClientButton.addEventListener('click', createClient)

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activateTab(button.dataset.tab)
  })
})

;(function init() {
  updateClock()
  setInterval(updateClock, 1000)
  activateTab('calendar')
  const currentToken = getToken()
  if (currentToken) {
    tokenInput.value = currentToken
    refreshData()
      .then(showDashboard)
      .catch(() => showLogin())
  }
})()
